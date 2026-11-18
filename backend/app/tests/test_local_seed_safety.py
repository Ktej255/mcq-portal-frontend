"""Hermetic safety-boundary tests for ``scripts.local_seed_upgraded``.

These tests deliberately replace the script's database/session collaborators.
They never invoke the configured application database, read an environment
file, load a provider, or perform network I/O.
"""

from __future__ import annotations

import importlib
import sys
import types
from pathlib import Path
from types import SimpleNamespace

import pytest


@pytest.fixture()
def seed_module(tmp_path, monkeypatch):
    """Import the script without consulting the repository's environment file."""
    backend_dir = Path(__file__).resolve().parents[2]
    monkeypatch.syspath_prepend(str(backend_dir))
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("APP_ENVIRONMENT", "test")
    sys.modules.pop("scripts.local_seed_upgraded", None)
    return importlib.import_module("scripts.local_seed_upgraded")


def _engine(dialect_name: str):
    return SimpleNamespace(dialect=SimpleNamespace(name=dialect_name))


def _base_spy(calls):
    class Metadata:
        def create_all(self, bind):
            calls.append(bind)

    return SimpleNamespace(metadata=Metadata())


def _install_seed_helpers(monkeypatch, *, ensure_subjects, clear_subject_content,
                          ensure_csat_syllabus):
    """Provide only the helpers dynamically imported by ``main``."""
    helpers = types.ModuleType("scripts.seed_production")
    helpers._ensure_subjects = ensure_subjects
    helpers._clear_subject_content = clear_subject_content
    helpers._ensure_csat_syllabus = ensure_csat_syllabus
    monkeypatch.setitem(sys.modules, "scripts.seed_production", helpers)


class RecordingSession:
    def __init__(self):
        self.commits = 0
        self.rollbacks = 0
        self.closes = 0

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1

    def close(self):
        self.closes += 1


def test_non_sqlite_refusal_happens_before_any_write(seed_module, monkeypatch):
    """A configured non-SQLite dialect is rejected before loading or writing."""
    schema_writes = []
    seed_module.engine = _engine("postgresql")
    seed_module.Base = _base_spy(schema_writes)
    monkeypatch.setattr(
        seed_module,
        "load_artifact",
        lambda: pytest.fail("artifact must not be loaded for a non-SQLite DB"),
    )
    monkeypatch.setattr(
        seed_module,
        "SessionLocal",
        lambda: pytest.fail("session must not be opened for a non-SQLite DB"),
    )

    with pytest.raises(RuntimeError, match="requires a SQLite database"):
        seed_module.main()

    assert schema_writes == []


@pytest.mark.parametrize(
    "artifact",
    [
        {"subject_id": "1", "tree": [{"title": "topic"}]},
        {"subject_id": 1, "tree": []},
        {"subject_id": 1, "tree": None},
        {"subject_id": 1, "tree": [None]},
    ],
)
def test_malformed_artifact_is_rejected_before_schema_or_content_work(
    seed_module, monkeypatch, artifact
):
    """Artifact validation precedes create_all, column work, and sessions."""
    schema_writes = []
    seed_module.engine = _engine("sqlite")
    seed_module.Base = _base_spy(schema_writes)
    monkeypatch.setattr(seed_module, "load_artifact", lambda: artifact)
    monkeypatch.setattr(
        seed_module,
        "SessionLocal",
        lambda: pytest.fail("malformed artifacts must not open a session"),
    )

    with pytest.raises(ValueError):
        seed_module.main()

    assert schema_writes == []


def test_subject_id_is_rewritten_from_slug_resolution(seed_module, monkeypatch):
    """The importer receives the helper's Geography ID, never artifact ID 1."""
    calls = {"subjects": 0, "clear": [], "csat": [], "import": []}
    session = RecordingSession()
    schema_writes = []

    def ensure_subjects(received_session):
        assert received_session is session
        calls["subjects"] += 1
        # Deliberately use a non-1 ID as a stand-in for the slug-resolved row.
        return {"geography": 37, "csat": 43}

    def clear_subject_content(received_session, subject_id):
        assert received_session is session
        calls["clear"].append(subject_id)

    def ensure_csat_syllabus(received_session, subject_id):
        assert received_session is session
        calls["csat"].append(subject_id)

    def import_geography(received_session, artifact, *, review_status):
        assert received_session is session
        calls["import"].append((artifact, review_status))
        return {"subject_id": artifact["subject_id"]}

    _install_seed_helpers(
        monkeypatch,
        ensure_subjects=ensure_subjects,
        clear_subject_content=clear_subject_content,
        ensure_csat_syllabus=ensure_csat_syllabus,
    )
    seed_module.engine = _engine("sqlite")
    seed_module.Base = _base_spy(schema_writes)
    seed_module.SessionLocal = lambda: session
    monkeypatch.setattr(seed_module, "_ensure_gs_paper_column", lambda: None)
    monkeypatch.setattr(
        seed_module,
        "load_artifact",
        lambda: {"subject_id": 1, "tree": [{"title": "Geography"}]},
    )
    monkeypatch.setattr(seed_module, "import_gs_geography", import_geography)

    seed_module.main()

    assert calls["subjects"] == 1
    assert calls["clear"] == [37]
    assert calls["csat"] == [43]
    assert calls["import"] == [({"subject_id": 37, "tree": [{"title": "Geography"}]}, "REVIEWED")]
    assert session.commits == 1
    assert session.rollbacks == 0
    assert session.closes == 1


def test_import_error_rolls_back_and_is_propagated(seed_module, monkeypatch):
    """A content failure rolls back, closes the session, and keeps its error."""
    session = RecordingSession()
    schema_writes = []
    failure = RuntimeError("import failed")
    calls = []

    def ensure_subjects(received_session):
        assert received_session is session
        return {"geography": 29, "csat": 31}

    def clear_subject_content(received_session, subject_id):
        assert received_session is session
        calls.append(("clear", subject_id))

    def ensure_csat_syllabus(received_session, subject_id):
        calls.append(("csat", subject_id))

    def import_geography(received_session, artifact, *, review_status):
        assert received_session is session
        assert artifact["subject_id"] == 29
        assert review_status == "REVIEWED"
        calls.append(("import", artifact["subject_id"]))
        raise failure

    _install_seed_helpers(
        monkeypatch,
        ensure_subjects=ensure_subjects,
        clear_subject_content=clear_subject_content,
        ensure_csat_syllabus=ensure_csat_syllabus,
    )
    seed_module.engine = _engine("sqlite")
    seed_module.Base = _base_spy(schema_writes)
    seed_module.SessionLocal = lambda: session
    monkeypatch.setattr(seed_module, "_ensure_gs_paper_column", lambda: None)
    monkeypatch.setattr(
        seed_module,
        "load_artifact",
        lambda: {"subject_id": 1, "tree": [{"title": "Geography"}]},
    )
    monkeypatch.setattr(seed_module, "import_gs_geography", import_geography)

    with pytest.raises(RuntimeError) as exc_info:
        seed_module.main()

    assert exc_info.value is failure
    assert calls == [("clear", 29), ("import", 29)]
    assert session.commits == 0
    assert session.rollbacks == 1
    assert session.closes == 1
