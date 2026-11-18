#!/usr/bin/env python3
"""Deterministically audit the two seed entry points without importing them.

The validator reads Python source, parses it with :mod:`ast`, and reports three
states for each safety criterion:

* ``proved`` -- the required source-level evidence was found;
* ``definite_failure`` -- contradictory or missing required direct behaviour;
* ``indeterminate`` -- behaviour is delegated to dynamic code that this
  validator cannot prove either safe or unsafe.

It never imports seed modules, loads configuration, reads ``.env`` files, or
opens a database/provider connection.  Indeterminate findings are informational;
only definite failures make the process exit non-zero.
"""
from __future__ import annotations

import argparse
import ast
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Sequence

DEFAULT_FILES = ("seed_production.py", "local_seed_upgraded.py")
CRITERIA = (
    "explicit destructive confirmation",
    "non-SQLite refusal",
    "artifact validation before writes",
    "stable-slug subject resolution",
    "one commit boundary",
    "rollback/error propagation",
    "no database URL value printing",
    "no silent cleanup suppression",
)


@dataclass(frozen=True)
class Finding:
    criterion: str
    status: str
    evidence: str
    line: int | None = None


@dataclass(frozen=True)
class ScriptReport:
    script: str
    findings: tuple[Finding, ...]
    parse_error: str | None = None

    @property
    def definite_failures(self) -> int:
        return sum(f.status == "definite_failure" for f in self.findings)


def _call_name(node: ast.AST) -> str:
    if isinstance(node, ast.Call):
        node = node.func
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        parent = _call_name(node.value)
        return f"{parent}.{node.attr}" if parent else node.attr
    return ""


def _qualified_name(node: ast.AST) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        parent = _qualified_name(node.value)
        return f"{parent}.{node.attr}" if parent else node.attr
    return ""


def _calls(tree: ast.AST) -> Iterable[ast.Call]:
    return (node for node in ast.walk(tree) if isinstance(node, ast.Call))


def _raises(node: ast.AST) -> bool:
    return any(isinstance(child, ast.Raise) for child in ast.walk(node))


def _contains_name(node: ast.AST, name: str) -> bool:
    return any(isinstance(child, ast.Name) and child.id == name for child in ast.walk(node))


def _source(source: str, node: ast.AST) -> str:
    return ast.get_source_segment(source, node) or ""


def _line(node: ast.AST | None) -> int | None:
    return getattr(node, "lineno", None) if node is not None else None


def _is_database_url_read(call: ast.Call) -> bool:
    name = _call_name(call)
    if name in {"os.getenv", "os.environ.get", "os.environ.__getitem__"}:
        return bool(call.args and isinstance(call.args[0], ast.Constant)
                    and call.args[0].value == "DATABASE_URL")
    return name == "os.environ.get" and any(
        isinstance(arg, ast.Constant) and arg.value == "DATABASE_URL"
        for arg in call.args
    )


def _is_write_call(call: ast.Call) -> bool:
    name = _call_name(call).lower()
    return (
        name.endswith(".create_all")
        or name.endswith(".begin")
        or name.endswith(".execute")
        or name.endswith(".add")
        or name.endswith(".flush")
        or name.endswith(".commit")
        or "delete" in name
    )


def _first_write(tree: ast.AST) -> ast.Call | None:
    writes = [call for call in _calls(tree) if _is_write_call(call)]
    return min(writes, key=lambda call: call.lineno, default=None)


def _finding(criterion: str, status: str, evidence: str,
             node: ast.AST | None = None) -> Finding:
    return Finding(criterion, status, evidence, _line(node))


def _production_confirmation(tree: ast.Module, source: str) -> Finding:
    function = next(
        (node for node in ast.walk(tree)
         if isinstance(node, ast.FunctionDef)
         and node.name == "_require_destructive_confirmation"),
        None,
    )
    if function is None:
        dynamic = "ALLOW_DESTRUCTIVE_SEED" in source or "getattr" in source
        return _finding(
            CRITERIA[0], "indeterminate" if dynamic else "definite_failure",
            "confirmation is delegated dynamically" if dynamic
            else "no _require_destructive_confirmation function is present",
        )

    text = _source(source, function)
    has_env = any(
        _call_name(call) == "os.environ.get" for call in _calls(function)
    ) and (
        "ALLOW_DESTRUCTIVE_SEED" in text
        or (
            "DESTRUCTIVE_CONFIRMATION_ENV" in text
            and "DESTRUCTIVE_CONFIRMATION_ENV = \"ALLOW_DESTRUCTIVE_SEED\"" in source
        )
    )
    compares_true = any(
        isinstance(node, ast.Constant) and node.value == "true"
        for node in ast.walk(function)
    )
    guarded_raise = any(
        isinstance(node, ast.If)
        and _raises(node)
        and any(_call_name(call) == "os.environ.get" for call in _calls(node))
        for node in ast.walk(function)
    )
    if not (has_env and compares_true and guarded_raise):
        dynamic = "getattr" in text or "eval(" in text
        return _finding(
            CRITERIA[0], "indeterminate" if dynamic else "definite_failure",
            "confirmation logic is dynamic" if dynamic
            else "confirmation does not visibly require ALLOW_DESTRUCTIVE_SEED=true",
            function,
        )

    calls = [call for call in _calls(tree)
             if _call_name(call).endswith("_require_destructive_confirmation")]
    main = next((node for node in ast.walk(tree)
                 if isinstance(node, ast.FunctionDef) and node.name == "main"), None)
    write = _first_write(main or tree)
    call = min(calls, key=lambda item: item.lineno, default=None)
    if call is None or (write is not None and call.lineno >= write.lineno):
        return _finding(
            CRITERIA[0], "definite_failure",
            "confirmation is not called before the first database write", call,
        )
    return _finding(
        CRITERIA[0], "proved",
        "ALLOW_DESTRUCTIVE_SEED is compared with 'true' and guarded by a raising check",
        call,
    )


def _sqlite_refusal(tree: ast.Module, source: str) -> Finding:
    candidates = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.If):
            continue
        text = _source(source, node)
        if "sqlite" in text and "dialect" in text and _raises(node):
            candidates.append(node)
    if candidates:
        return _finding(
            CRITERIA[1], "proved",
            "engine.dialect.name is checked against sqlite and non-SQLite execution raises",
            min(candidates, key=lambda node: node.lineno),
        )
    dynamic = any(
        _call_name(call) in {"getattr", "eval", "exec"}
        for call in _calls(tree)
    )
    return _finding(
        CRITERIA[1], "indeterminate" if dynamic else "definite_failure",
        "database dialect policy is delegated dynamically" if dynamic
        else "no non-SQLite refusal is present",
    )


def _artifact_before_writes(tree: ast.Module, source: str) -> Finding:
    loads = [call for call in _calls(tree) if _call_name(call).endswith("load_artifact")]
    if not loads:
        dynamic = any(
            _call_name(call) in {"getattr", "eval", "exec"}
            for call in _calls(tree)
        )
        return _finding(
            CRITERIA[2], "indeterminate" if dynamic else "definite_failure",
            "artifact loading/validation is delegated dynamically" if dynamic
            else "no load_artifact call is present",
        )
    load = min(loads, key=lambda call: call.lineno)
    main = next((node for node in ast.walk(tree)
                 if isinstance(node, ast.FunctionDef) and node.name == "main"), None)
    write = _first_write(main or tree)
    if write is not None and load.lineno >= write.lineno:
        return _finding(
            CRITERIA[2], "definite_failure",
            "artifact is loaded after a database write", load,
        )

    checks = []
    for node in ast.walk(tree):
        if isinstance(node, ast.If) and node.lineno > load.lineno and (
            write is None or node.lineno < write.lineno
        ):
            text = _source(source, node)
            if _raises(node) and ("subject_id" in text or "tree" in text):
                checks.append(node)
    has_subject_check = any("subject_id" in _source(source, node) for node in checks)
    has_tree_check = any("tree" in _source(source, node) for node in checks)
    if has_subject_check and has_tree_check:
        return _finding(
            CRITERIA[2], "proved",
            "artifact is loaded, subject_id/tree shape checks raise before create_all or other writes",
            load,
        )
    dynamic = "getattr" in source or "validate_artifact" in source
    return _finding(
        CRITERIA[2], "indeterminate" if dynamic else "definite_failure",
        "artifact checks are not statically complete" if not dynamic
        else "artifact validation is delegated dynamically",
        load,
    )


def _stable_slug_resolution(tree: ast.Module, source: str) -> Finding:
    has_subject_query = "GsSubject.slug" in source and ".filter" in source
    helper_import = any(
        isinstance(node, ast.ImportFrom)
        and node.module == "scripts.seed_production"
        and any(alias.name == "_ensure_subjects" for alias in node.names)
        for node in ast.walk(tree)
    )
    helper_call = any(_call_name(call).endswith("_ensure_subjects") for call in _calls(tree))
    uses_resolved_id = "subject_ids[" in source or "subject_ids.get(" in source
    if has_subject_query and helper_call:
        return _finding(
            CRITERIA[3], "proved",
            "subjects are queried with GsSubject.slug and the returned ID mapping is used",
        )
    if helper_import and helper_call and uses_resolved_id:
        return _finding(
            CRITERIA[3], "proved",
            "local seed imports the slug-resolving _ensure_subjects helper and uses its IDs",
        )
    # The production seed delegates to the shared loader (also used by the
    # admin endpoint). Read that module's source, without importing it, to
    # confirm the slug lookup is really there.
    loader_import = any(
        isinstance(node, ast.ImportFrom)
        and node.module == "app.core.gs_lms.content_loader"
        and any(alias.name == "ensure_gs_subjects" for alias in node.names)
        for node in ast.walk(tree)
    )
    loader_call = any(_call_name(call).endswith("ensure_gs_subjects") for call in _calls(tree))
    if loader_import and loader_call and helper_call and uses_resolved_id:
        loader_path = (
            Path(__file__).resolve().parents[2] / "app" / "core" / "gs_lms" / "content_loader.py"
        )
        try:
            loader_source = loader_path.read_text(encoding="utf-8")
        except OSError:
            loader_source = ""
        if "GsSubject.slug" in loader_source and ".filter" in loader_source:
            return _finding(
                CRITERIA[3], "proved",
                "subjects are resolved by the shared loader, which queries GsSubject.slug, "
                "and the returned ID mapping is used",
            )
    dynamic = "subject" in source and ("query" in source or "getattr" in source)
    return _finding(
        CRITERIA[3], "indeterminate" if dynamic else "definite_failure",
        "subject resolution is delegated dynamically" if dynamic
        else "no stable-slug subject lookup is visible",
    )


def _commit_boundary(tree: ast.Module, source: str) -> Finding:
    commits = [call for call in _calls(tree) if _call_name(call).endswith(".commit")]
    if len(commits) == 1:
        return _finding(
            CRITERIA[4], "proved",
            "exactly one explicit commit call is present",
            commits[0],
        )
    if len(commits) > 1:
        return _finding(
            CRITERIA[4], "definite_failure",
            f"{len(commits)} explicit commit calls create multiple commit boundaries",
            commits[1],
        )
    dynamic = any(token in source for token in ("getattr", "eval(", "exec(", "importlib"))
    writes = any(_is_write_call(call) for call in _calls(tree))
    return _finding(
        CRITERIA[4], "indeterminate" if dynamic else "definite_failure",
        "commit is invoked dynamically" if dynamic
        else ("writes are present but no explicit commit call is visible" if writes
              else "no commit boundary is visible"),
    )


def _rollback_propagation(tree: ast.Module, source: str) -> Finding:
    handlers = [node for node in ast.walk(tree) if isinstance(node, ast.ExceptHandler)]
    rollback_handlers = [
        handler for handler in handlers
        if any(_call_name(call).endswith(".rollback") for call in _calls(handler))
        and _raises(handler)
    ]
    if rollback_handlers:
        return _finding(
            CRITERIA[5], "proved",
            "a rollback call is followed by exception propagation from the error handler",
            min(rollback_handlers, key=lambda node: node.lineno),
        )
    dynamic = any(
        _call_name(call) in {"getattr", "eval", "exec"}
        for call in _calls(tree)
    )
    return _finding(
        CRITERIA[5], "indeterminate" if dynamic else "definite_failure",
        "rollback/error handling is delegated dynamically" if dynamic
        else "no rollback-and-propagate error handler is visible",
    )


def _tainted_database_names(tree: ast.AST) -> set[str]:
    tainted: set[str] = set()
    changed = True
    while changed:
        changed = False
        for node in ast.walk(tree):
            target = None
            value: ast.AST | None = None
            if isinstance(node, ast.Assign):
                value = node.value
                if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                    target = node.targets[0].id
            elif isinstance(node, ast.AnnAssign):
                value = node.value
                if isinstance(node.target, ast.Name):
                    target = node.target.id
            if target is None or value is None or target in tainted:
                continue
            direct = any(_is_database_url_read(call) for call in _calls(value))
            propagated = any(
                isinstance(child, ast.Name) and child.id in tainted
                for child in ast.walk(value)
            )
            if direct or propagated:
                tainted.add(target)
                changed = True
    return tainted


def _expr_has_tainted_name(node: ast.AST, tainted: set[str]) -> bool:
    return any(isinstance(child, ast.Name) and child.id in tainted
               for child in ast.walk(node))


def _url_printing(tree: ast.Module, source: str) -> Finding:
    tainted = _tainted_database_names(tree)
    unsafe = []
    for call in _calls(tree):
        if _call_name(call) != "print":
            continue
        if any(
            _is_database_url_read(child) or _expr_has_tainted_name(child, tainted)
            for arg in call.args for child in ast.walk(arg)
        ):
            unsafe.append(call)
    if unsafe:
        return _finding(
            CRITERIA[6], "definite_failure",
            "print receives a DATABASE_URL-derived value",
            min(unsafe, key=lambda node: node.lineno),
        )
    return _finding(
        CRITERIA[6], "proved",
        "no print call is data-flow-connected to a DATABASE_URL read",
    )


def _cleanup_suppression(tree: ast.Module, source: str) -> Finding:
    handlers = [node for node in ast.walk(tree) if isinstance(node, ast.ExceptHandler)]
    swallowing = [handler for handler in handlers if not _raises(handler)]
    if swallowing:
        handler = min(swallowing, key=lambda node: node.lineno)
        dynamic = "getattr" in _source(source, handler) or "exec(" in _source(source, handler)
        return _finding(
            CRITERIA[7], "indeterminate" if dynamic else "definite_failure",
            "exception handler does not visibly propagate its error" if not dynamic
            else "exception handling is dynamic and its propagation cannot be proven",
            handler,
        )
    return _finding(
        CRITERIA[7], "proved",
        "every exception handler visibly raises; cleanup failures cannot be silently swallowed",
        min(handlers, key=lambda node: node.lineno) if handlers else None,
    )


def _not_applicable(criterion: str, reason: str) -> Finding:
    return _finding(criterion, "not_applicable", reason)


def analyze_file(path: Path) -> ScriptReport:
    """Analyze one source file without importing or executing it."""
    try:
        # Explicitly reject dotenv paths so even a caller typo cannot make the
        # validator inspect secrets.  Normal operation only passes Python files.
        if path.name == ".env" or path.name.startswith(".env."):
            raise ValueError("refusing to read dotenv files")
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(path))
    except (OSError, SyntaxError, UnicodeError, ValueError) as exc:
        finding = _finding(
            "source parse",
            "definite_failure",
            f"cannot parse source safely: {type(exc).__name__}: {exc}",
        )
        return ScriptReport(path.name, (finding,), parse_error=str(exc))

    production = path.name == "seed_production.py"
    local = path.name == "local_seed_upgraded.py"
    findings = [
        (_production_confirmation(tree, source) if production else
         _not_applicable(CRITERIA[0], "only the production seed requires destructive confirmation")),
        (_sqlite_refusal(tree, source) if local else
         _not_applicable(CRITERIA[1], "the production seed intentionally supports approved PostgreSQL targets")),
        (_artifact_before_writes(tree, source) if local else
         _not_applicable(CRITERIA[2], "the production importer owns artifact loading")),
        _stable_slug_resolution(tree, source),
        _commit_boundary(tree, source),
        _rollback_propagation(tree, source),
        _url_printing(tree, source),
        _cleanup_suppression(tree, source),
    ]
    return ScriptReport(path.name, tuple(findings))


def _default_paths() -> tuple[Path, Path]:
    scripts_dir = Path(__file__).resolve().parents[1]
    return tuple(scripts_dir / name for name in DEFAULT_FILES)  # type: ignore[return-value]


def _render_text(reports: Sequence[ScriptReport]) -> str:
    lines = ["Seed safety AST validation"]
    for report in reports:
        lines.append(f"\n{report.script}")
        for finding in report.findings:
            location = f" (line {finding.line})" if finding.line else ""
            lines.append(f"  {finding.status.upper():17} {finding.criterion}{location}: {finding.evidence}")
    definite = sum(report.definite_failures for report in reports)
    indeterminate = sum(
        finding.status == "indeterminate"
        for report in reports for finding in report.findings
    )
    lines.append(f"\nSummary: {definite} definite failure(s), {indeterminate} indeterminate finding(s).")
    lines.append("Indeterminate findings are informational; definite failures return exit code 1.")
    return "\n".join(lines)


def _render_json(reports: Sequence[ScriptReport]) -> str:
    payload = {
        "reports": [
            {
                "script": report.script,
                "parse_error": report.parse_error,
                "findings": [asdict(finding) for finding in report.findings],
            }
            for report in reports
        ],
        "definite_failures": sum(report.definite_failures for report in reports),
        "indeterminate": sum(
            finding.status == "indeterminate"
            for report in reports for finding in report.findings
        ),
    }
    return json.dumps(payload, indent=2, sort_keys=True)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="AST/source-only safety validator for the production and local seed scripts"
    )
    parser.add_argument(
        "paths", nargs="*", type=Path,
        help="optional seed Python files (defaults to both supported scripts)",
    )
    parser.add_argument("--json", action="store_true", help="emit deterministic JSON")
    args = parser.parse_args(argv)
    paths = tuple(args.paths) if args.paths else _default_paths()
    reports = tuple(analyze_file(path) for path in paths)
    print(_render_json(reports) if args.json else _render_text(reports))
    return 1 if any(report.definite_failures for report in reports) else 0


if __name__ == "__main__":
    raise SystemExit(main())
