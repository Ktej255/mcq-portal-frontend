"""Hermetic safety tests for ``scripts.seed_production``.

The production seed is imported with a temporary working directory and every
session/schema collaborator used by ``main`` is replaced before execution.
These tests never connect to a database, read ``.env``, invoke a provider, or
perform network or migration work.
"""

from __future__ import annotations

import importlib
import io
import sys
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from types import SimpleNamespace

import pytest


@pytest.fixture()
def seed_module(tmp_path, monkeypatch):
    """Import the script without consulting a repository environment file."""
    backend_dir = Path(__file__).resolve().parents[2]
    monkeypatch.syspath_prepend(str(backend_dir))
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.delenv("ALLOW_DESTRUCTIVE_SEED", raising=False)
    sys.modules.pop("scripts.seed_production", None)
    return importlib.import_module("scripts.seed_production")


def _base_spy(calls):
    class Metadata:
        def create_all(self, bind):
            calls.append(bind)

    return SimpleNamespace(metadata=Metadata())


class SessionDouble:
    def __init__(self, *, begin_error=None, rollback_error=None):
        self.begin_error = begin_error
        self.rollback_error = rollback_error
        self.commits = 0
        self.rollbacks = 0
        self.closes = 0
        self.connections = 0

    def begin(self):
        if self.begin_error:
            raise self.begin_error

    def connection(self):
        self.connections += 1
        return object()

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1
        if self.rollback_error:
            raise self.rollback_error

    def close(self):
        self.closes += 1


def _configure_main(seed_module, monkeypatch, session, schema_calls=None):
    monkeypatch.setattr(seed_module, "SessionLocal", lambda: session)
    monkeypatch.setattr(
        seed_module,
        "Base",
        _base_spy(schema_calls if schema_calls is not None else []),
    )
    monkeypatch.setattr(seed_module, "_ensure_gs_paper_column", lambda connection: None)


def test_confirmation_is_checked_before_session_or_schema_work(seed_module, monkeypatch):
    session_calls = []
    schema_calls = []
    monkeypatch.setattr(
        seed_module,
        "SessionLocal",
        lambda: session_calls.append("opened") or pytest.fail("session opened too soon"),
    )
    monkeypatch.setattr(seed_module, "Base", _base_spy(schema_calls))

    with pytest.raises(SystemExit) as exc_info:
        seed_module.main()

    assert exc_info.value.code == 2
    assert session_calls == []
    assert schema_calls == []


def test_main_never_prints_database_url_or_driver_message(seed_module, monkeypatch):
    secret = "postgresql://seed_user:driver-secret@example.invalid/prod"
    monkeypatch.setenv("DATABASE_URL", secret)
    monkeypatch.setenv("ALLOW_DESTRUCTIVE_SEED", "true")
    session = SessionDouble(begin_error=RuntimeError(secret))
    _configure_main(seed_module, monkeypatch, session)

    stdout, stderr = io.StringIO(), io.StringIO()
    with redirect_stdout(stdout), redirect_stderr(stderr):
        with pytest.raises(SystemExit) as exc_info:
            seed_module.main()

    output = stdout.getvalue() + stderr.getvalue()
    assert exc_info.value.code == 1
    assert secret not in output
    assert "RuntimeError" in output
    assert session.rollbacks == 1
    assert session.closes == 1


def test_rollback_failure_is_unknown_state_and_nonzero_without_driver_text(
    seed_module, monkeypatch
):
    driver_text = "password=never-print-this host=private-db.example"
    session = SessionDouble(
        begin_error=RuntimeError("initial " + driver_text),
        rollback_error=RuntimeError("rollback " + driver_text),
    )
    _configure_main(seed_module, monkeypatch, session)
    monkeypatch.setenv("ALLOW_DESTRUCTIVE_SEED", "true")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")

    stdout, stderr = io.StringIO(), io.StringIO()
    with redirect_stdout(stdout), redirect_stderr(stderr):
        with pytest.raises(SystemExit) as exc_info:
            seed_module.main()

    output = stdout.getvalue() + stderr.getvalue()
    assert exc_info.value.code == 1
    assert "database state is unknown" in output
    assert driver_text not in output
    assert session.rollbacks == 1
    assert session.closes == 1


def test_main_passes_slug_resolved_subject_ids_to_seed_steps(seed_module, monkeypatch):
    monkeypatch.setenv("ALLOW_DESTRUCTIVE_SEED", "true")
    session = SessionDouble()
    _configure_main(seed_module, monkeypatch, session)
    calls = {"import": [], "retired": [], "csat": []}

    def ensure_subjects(received_session):
        assert received_session is session
        return {"geography": 37, "csat": 43}

    def import_geography(received_session, *, review_status):
        assert received_session is session
        calls["import"].append(review_status)
        return {"imported": 1}

    def retire_orphans(received_session, subject_id):
        assert received_session is session
        calls["retired"].append(subject_id)
        return 0

    def seed_csat(received_session, subject_id):
        assert received_session is session
        calls["csat"].append(subject_id)
        return {"created_nodes": 0, "updated_nodes": 29, "hidden_nodes": 0}

    monkeypatch.setattr(seed_module, "_ensure_subjects", ensure_subjects)
    monkeypatch.setattr(seed_module, "import_gs_geography", import_geography)
    monkeypatch.setattr(seed_module, "_retire_orphan_nodes", retire_orphans)
    monkeypatch.setattr(seed_module, "_ensure_csat_syllabus", seed_csat)

    seed_module.main()

    assert calls == {
        "import": ["REVIEWED"],
        "retired": [37],
        "csat": [43],
    }
    assert session.commits == 1
    assert session.rollbacks == 0
    assert session.closes == 1
