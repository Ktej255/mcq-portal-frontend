"""Hermetic source-analysis tests for Alembic model coverage validation.

The validator is loaded directly from its script path and pointed at temporary
backend roots.  These tests intentionally avoid importing ``app``, opening a
database, executing migrations, loading providers, using the network, or
reading environment files.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pytest


@pytest.fixture()
def coverage_module():
    """Load the validator without putting the repository application on sys.path."""
    script = Path(__file__).resolve().parents[2] / "scripts" / "validation" / "validate_alembic_model_coverage.py"
    spec = importlib.util.spec_from_file_location("test_alembic_model_coverage_validator", script)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _write(root: Path, relative: str, source: str) -> None:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(source, encoding="utf-8")


def _backend(
    root: Path,
    *,
    models_init: str = "from app.models.account import Account\n",
    model_sources: dict[str, str] | None = None,
    env: str = "from app.models import Account\n",
    migrations: dict[str, str] | None = None,
) -> Path:
    """Create the minimum source tree understood by the static validator."""
    _write(root, "app/__init__.py", "")
    _write(root, "app/models/__init__.py", models_init)
    _write(root, "alembic/env.py", env)
    (root / "alembic/versions").mkdir(parents=True, exist_ok=True)
    for relative, source in (model_sources or {}).items():
        _write(root, f"app/models/{relative}", source)
    for relative, source in (migrations or {}).items():
        _write(root, f"alembic/versions/{relative}", source)
    return root


def _finding_messages(findings) -> list[str]:
    return [finding.message for finding in findings]


def test_static_import_traversal_finds_registered_tables(coverage_module, tmp_path):
    root = _backend(
        tmp_path / "backend",
        models_init="from app.models.account import Account\n",
        model_sources={
            "account.py": "class Account:\n    __tablename__ = 'accounts'\n",
        },
        migrations={"001_accounts.py": "def upgrade():\n    op.create_table('accounts')\n"},
    )

    result = coverage_module.analyze(root)

    assert result.status == "PASS"
    assert set(result.inventory.registered) == {"accounts"}
    assert set(result.inventory.created) == {"accounts"}
    assert result.definite == []
    assert result.inventory.blocked == []


def test_literal_registered_table_without_migration_is_definite(coverage_module, tmp_path):
    root = _backend(
        tmp_path / "backend",
        model_sources={"account.py": "class Account:\n    __tablename__ = 'accounts'\n"},
        migrations={},
    )

    result = coverage_module.analyze(root)

    assert result.status == "FAIL"
    assert len(result.definite) == 1
    assert result.definite[0].kind == "DEFINITE"
    assert "accounts" in result.definite[0].message
    assert "no migration create-table coverage" in result.definite[0].message


def test_migration_created_unregistered_table_is_definite(coverage_module, tmp_path):
    root = _backend(
        tmp_path / "backend",
        models_init="\n",
        env="\n",
        migrations={"001_orphan.py": "def upgrade():\n    op.create_table('orphaned')\n"},
    )

    result = coverage_module.analyze(root)

    assert result.status == "FAIL"
    assert len(result.definite) == 1
    assert "orphaned" in result.definite[0].message
    assert "absent from registered metadata" in result.definite[0].message


def test_dynamic_table_names_are_uncertain_not_definite(coverage_module, tmp_path):
    root = _backend(
        tmp_path / "backend",
        models_init="\n",
        env="\n",
        model_sources={"dynamic.py": "TABLE_NAME = get_name()\nclass Dynamic:\n    __tablename__ = TABLE_NAME\n"},
        migrations={"001_dynamic.py": "def upgrade():\n    op.create_table(get_name())\n"},
    )
    # Reach the dynamic model through the authoritative registration entrypoint.
    _write(root, "app/models/__init__.py", "from app.models.dynamic import Dynamic\n")

    result = coverage_module.analyze(root)

    assert result.status == "PASS"
    assert result.definite == []
    assert len(result.inventory.uncertain) == 2
    assert all(finding.kind == "UNCERTAIN" for finding in result.inventory.uncertain)
    assert any("registered table name" in finding.message for finding in result.inventory.uncertain)
    assert any("migration create_table name" in finding.message for finding in result.inventory.uncertain)


@pytest.mark.parametrize(
    ("tree_kind", "expected_message"),
    [
        ("missing_registration", "missing registration source"),
        ("invalid_registration", "invalid registration source"),
        ("missing_migrations", "missing Alembic versions directory"),
        ("invalid_migration", "invalid migration source"),
    ],
)
def test_missing_or_malformed_sources_are_blocked(
    coverage_module, tmp_path, tree_kind, expected_message
):
    root = tmp_path / "backend"
    _backend(
        root,
        migrations={"001_valid.py": "def upgrade():\n    op.create_table('valid')\n"},
    )

    if tree_kind == "missing_registration":
        (root / "app/models/__init__.py").unlink()
    elif tree_kind == "invalid_registration":
        _write(root, "app/models/__init__.py", "class Broken(:\n")
    elif tree_kind == "missing_migrations":
        for path in (root / "alembic/versions").glob("*.py"):
            path.unlink()
        (root / "alembic/versions").rmdir()
    else:
        _write(root, "alembic/versions/001_valid.py", "def upgrade(:\n")

    result = coverage_module.analyze(root)

    assert result.status == "BLOCKED"
    assert result.inventory.blocked
    assert any(expected_message in finding.message for finding in result.inventory.blocked)


def test_downgrade_only_drops_do_not_erase_upgrade_coverage(coverage_module, tmp_path):
    root = _backend(
        tmp_path / "backend",
        model_sources={"account.py": "class Account:\n    __tablename__ = 'accounts'\n"},
        migrations={
            "001_accounts.py": (
                "def upgrade():\n"
                "    op.create_table('accounts')\n\n"
                "def downgrade():\n"
                "    op.drop_table('accounts')\n"
            )
        },
    )

    result = coverage_module.analyze(root)

    assert result.status == "PASS"
    assert result.definite == []
    assert set(result.inventory.created) == {"accounts"}
    assert result.inventory.dropped == {}


def test_json_output_is_deterministic_and_sanitized(coverage_module, tmp_path):
    root = _backend(
        tmp_path / "backend",
        models_init="from app.models.account import Account\n",
        model_sources={
            "account.py": "class Account:\n    __tablename__ = 'secret table\\nname'\n",
        },
        migrations={},
    )
    result = coverage_module.analyze(root)

    first = coverage_module._render(result, as_json=True)
    second = coverage_module._render(result, as_json=True)
    payload = json.loads(first)

    assert first == second
    assert first == json.dumps(payload, ensure_ascii=True, sort_keys=True, indent=2)
    assert payload["status"] == "FAIL"
    assert payload["definite_findings"][0]["message"].endswith("secret_table_name")
    assert "secret table" not in first
    assert "\\n" not in payload["definite_findings"][0]["message"]
    assert all(set(finding) == {"kind", "message", "location"}
               for finding in payload["definite_findings"])
