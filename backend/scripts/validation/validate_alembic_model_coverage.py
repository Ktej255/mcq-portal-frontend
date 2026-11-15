#!/usr/bin/env python3
"""Static, read-only coverage check for registered SQLAlchemy tables.

This validator deliberately parses source instead of importing the application:
no settings, providers, database engines, migrations, or revision commands are
executed.  It reports only statically provable gaps as definite failures;
dynamic registration and table names are reported as uncertainty.

Exit codes:
  0  no definite coverage gaps (uncertainty may still be reported)
  1  one or more definite coverage gaps
  2  required source could not be read or parsed
"""
from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

_SAFE = re.compile(r"[^A-Za-z0-9_./:-]+")


@dataclass(frozen=True)
class Finding:
    kind: str
    message: str
    location: str = ""


@dataclass
class Inventory:
    registered: dict[str, set[str]] = field(default_factory=dict)
    created: dict[str, set[str]] = field(default_factory=dict)
    dropped: dict[str, set[str]] = field(default_factory=dict)
    uncertain: list[Finding] = field(default_factory=list)
    blocked: list[Finding] = field(default_factory=list)

    def add_registered(self, name: str, location: str) -> None:
        self.registered.setdefault(name, set()).add(location)

    def add_created(self, name: str, location: str) -> None:
        self.created.setdefault(name, set()).add(location)

    def add_dropped(self, name: str, location: str) -> None:
        self.dropped.setdefault(name, set()).add(location)


@dataclass
class Analysis:
    inventory: Inventory
    definite: list[Finding]

    @property
    def status(self) -> str:
        if self.inventory.blocked:
            return "BLOCKED"
        return "FAIL" if self.definite else "PASS"


def _safe(value: object) -> str:
    """Keep diagnostics bounded and free of source contents or secrets."""
    text = _SAFE.sub("_", str(value))
    return text[:160]


def _location(path: Path, root: Path, node: ast.AST | None = None) -> str:
    try:
        relative = path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        relative = path.name
    if node is not None and getattr(node, "lineno", None):
        return f"{_safe(relative)}:{node.lineno}"
    return _safe(relative)


def _literal_string(node: ast.AST | None) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        value = node.value.strip()
        return value or None
    return None


def _module_path(module: str, backend_root: Path) -> Path | None:
    """Resolve a Python module without importing it."""
    if not module.startswith("app"):
        return None
    parts = module.split(".")
    if not parts or any(not part.isidentifier() for part in parts):
        return None
    candidate = backend_root.joinpath(*parts)
    file_candidate = candidate.with_suffix(".py")
    package_candidate = candidate / "__init__.py"
    if file_candidate.is_file():
        return file_candidate
    if package_candidate.is_file():
        return package_candidate
    return None


def _module_for_path(path: Path, backend_root: Path) -> str | None:
    try:
        relative = path.resolve().relative_to((backend_root / "app").resolve())
    except ValueError:
        return None
    parts = list(relative.parts)
    if parts[-1] == "__init__.py":
        parts.pop()
    else:
        parts[-1] = Path(parts[-1]).stem
    return ".".join(["app", *parts]) if parts else "app"


def _relative_base(current: str, level: int) -> str:
    package = current.split(".")[:-1]
    # level=1 means the current module's package; level=2 means its parent.
    keep = max(0, len(package) - (level - 1))
    return ".".join(package[:keep])


def _import_targets(node: ast.Import | ast.ImportFrom, current: str) -> Iterable[str]:
    if isinstance(node, ast.Import):
        for alias in node.names:
            yield alias.name
        return

    base = _relative_base(current, node.level) if node.level else ""
    if node.module:
        yield f"{base}.{node.module}" if base else node.module
    for alias in node.names:
        if alias.name == "*":
            continue
        candidate = ".".join(part for part in (base, node.module or "", alias.name) if part)
        yield candidate


def _is_dynamic_import_call(node: ast.Call) -> bool:
    function = node.func
    if isinstance(function, ast.Name):
        return function.id in {"__import__", "import_module"}
    return isinstance(function, ast.Attribute) and function.attr in {"import_module", "__import__"}


def _parse(path: Path, root: Path) -> ast.AST | None:
    try:
        # Explicitly open only Python source selected by the validator; no
        # environment files or application configuration are ever read.
        source = path.read_text(encoding="utf-8")
        return ast.parse(source, filename=str(path))
    except (OSError, UnicodeError, SyntaxError) as exc:
        return None


def _collect_model_tables(tree: ast.AST, path: Path, root: Path, inventory: Inventory) -> None:
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            for statement in node.body:
                if not isinstance(statement, ast.Assign):
                    continue
                if not any(isinstance(target, ast.Name) and target.id == "__tablename__"
                           for target in statement.targets):
                    continue
                name = _literal_string(statement.value)
                where = _location(path, root, statement)
                if name is None:
                    inventory.uncertain.append(
                        Finding("UNCERTAIN", "dynamic registered table name", where)
                    )
                else:
                    inventory.add_registered(name, where)
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "Table":
            where = _location(path, root, node)
            name = _literal_string(node.args[0] if node.args else None)
            if name is None:
                inventory.uncertain.append(
                    Finding("UNCERTAIN", "dynamic registered Table name", where)
                )
            else:
                inventory.add_registered(name, where)


def _collect_registered_sources(backend_root: Path, root: Path, inventory: Inventory) -> list[Path]:
    """Follow static imports from the two metadata-registration entrypoints."""
    entrypoints = [backend_root / "app" / "models" / "__init__.py", backend_root / "alembic" / "env.py"]
    queue = list(entrypoints)
    seen: set[Path] = set()
    while queue:
        path = queue.pop(0).resolve()
        if path in seen:
            continue
        seen.add(path)
        if not path.is_file():
            inventory.blocked.append(Finding("BLOCKED", "missing registration source", _location(path, root)))
            continue
        tree = _parse(path, root)
        if tree is None:
            inventory.blocked.append(Finding("BLOCKED", "unreadable or invalid registration source", _location(path, root)))
            continue
        # Alembic env.py is outside app/, but its absolute imports still
        # provide the authoritative registration roots.
        module = _module_for_path(path, backend_root) or "app._alembic_registration"
        _collect_model_tables(tree, path, root, inventory)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and _is_dynamic_import_call(node):
                inventory.uncertain.append(
                    Finding("UNCERTAIN", "dynamic model-module import", _location(path, root, node))
                )
            if not isinstance(node, (ast.Import, ast.ImportFrom)):
                continue
            targets = list(_import_targets(node, module))
            resolved = []
            for target in targets:
                target_path = _module_path(target, backend_root)
                if target_path is not None:
                    resolved.append(target_path)
                    queue.append(target_path)
            if isinstance(node, ast.Import):
                unresolved = [target for target in targets if target.startswith("app")
                              and _module_path(target, backend_root) is None]
                if unresolved:
                    inventory.uncertain.append(
                        Finding("UNCERTAIN", "unresolved model-module import", _location(path, root, node))
                    )
            elif node.module:
                # In ``from app.models.domain import User``, ``User`` is a
                # symbol, not a module. Only classify the import as uncertain
                # when neither the source module nor a child module resolves.
                base = f"{_relative_base(module, node.level)}.{node.module}" if node.level else node.module
                base_resolves = _module_path(base, backend_root) is not None
                if base.startswith("app") and not base_resolves and not resolved:
                    inventory.uncertain.append(
                        Finding("UNCERTAIN", "unresolved model-module import", _location(path, root, node))
                    )
    return sorted(seen)


class _MigrationVisitor(ast.NodeVisitor):
    def __init__(self, path: Path, root: Path, inventory: Inventory) -> None:
        self.path = path
        self.root = root
        self.inventory = inventory
        self.function_stack: list[str] = []

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.function_stack.append(node.name)
        for child in node.body:
            self.visit(child)
        self.function_stack.pop()

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        operation = node.func.attr if isinstance(node.func, ast.Attribute) else ""
        if operation in {"create_table", "drop_table"} and "downgrade" not in self.function_stack:
            where = _location(self.path, self.root, node)
            name = _literal_string(node.args[0] if node.args else None)
            if name is None:
                self.inventory.uncertain.append(
                    Finding("UNCERTAIN", f"dynamic migration {operation} name", where)
                )
            elif operation == "create_table":
                self.inventory.add_created(name, where)
            else:
                self.inventory.add_dropped(name, where)
        self.generic_visit(node)


def _collect_migrations(backend_root: Path, root: Path, inventory: Inventory) -> None:
    versions = backend_root / "alembic" / "versions"
    if not versions.is_dir():
        inventory.blocked.append(Finding("BLOCKED", "missing Alembic versions directory", _location(versions, root)))
        return
    for path in sorted(versions.glob("*.py")):
        tree = _parse(path, root)
        if tree is None:
            inventory.blocked.append(Finding("BLOCKED", "unreadable or invalid migration source", _location(path, root)))
            continue
        _MigrationVisitor(path, root, inventory).visit(tree)


def analyze(backend_root: Path | None = None) -> Analysis:
    script_path = Path(__file__).resolve()
    root = script_path.parents[3]
    backend = (backend_root or (root / "backend")).resolve()
    inventory = Inventory()
    _collect_registered_sources(backend, root, inventory)
    _collect_migrations(backend, root, inventory)

    definite: list[Finding] = []
    covered = set(inventory.created)
    for name in sorted(set(inventory.registered) - covered):
        locations = ", ".join(sorted(inventory.registered[name]))
        definite.append(Finding("DEFINITE", f"registered table has no migration create-table coverage: {_safe(name)}", locations))

    # A table explicitly dropped during an upgrade is not a current migration
    # artifact for the reverse-direction check. Its historical create still
    # counts as coverage for a registered table above.
    current_created = set(inventory.created) - set(inventory.dropped)
    for name in sorted(current_created - set(inventory.registered)):
        locations = ", ".join(sorted(inventory.created[name]))
        definite.append(Finding("DEFINITE", f"migration-created table is absent from registered metadata: {_safe(name)}", locations))
    return Analysis(inventory, definite)


def _payload(result: Analysis) -> dict[str, object]:
    inventory = result.inventory
    return {
        "status": result.status,
        "registered_table_count": len(inventory.registered),
        "migration_create_table_count": len(inventory.created),
        "definite_findings": [finding.__dict__ for finding in result.definite],
        "uncertain_findings": [finding.__dict__ for finding in inventory.uncertain],
        "blocked_findings": [finding.__dict__ for finding in inventory.blocked],
    }


def _render(result: Analysis, as_json: bool) -> str:
    if as_json:
        return json.dumps(_payload(result), ensure_ascii=True, sort_keys=True, indent=2)
    inventory = result.inventory
    lines = [
        f"Alembic model coverage: {result.status}",
        f"Registered tables: {len(inventory.registered)}",
        f"Migration create-table names: {len(inventory.created)}",
    ]
    for finding in result.inventory.blocked + result.definite + result.inventory.uncertain:
        suffix = f" [{finding.location}]" if finding.location else ""
        lines.append(f"{finding.kind} {finding.message}{suffix}")
    if not result.inventory.blocked and not result.definite and not result.inventory.uncertain:
        lines.append("No static uncertainty or coverage gaps found.")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    default_backend = Path(__file__).resolve().parents[2]
    parser.add_argument("--backend-root", type=Path, default=default_backend,
                        help="local backend source root (default: this repository's backend)")
    parser.add_argument("--json", action="store_true", dest="as_json",
                        help="emit deterministic machine-readable JSON")
    args = parser.parse_args(argv)
    result = analyze(args.backend_root)
    print(_render(result, args.as_json))
    if result.inventory.blocked:
        return 2
    return 1 if result.definite else 0


if __name__ == "__main__":
    raise SystemExit(main())
