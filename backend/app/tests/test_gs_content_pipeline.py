"""Content pipeline for a new GS subject: check the file, import it by slug,
and the subject opens for students once the content is reviewed."""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import get_current_user
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.gs.models import GsSubject
from app.core.gs_lms.content_check import MCQS_PER_TOPIC, check_subject_content, format_report
from app.core.gs_lms.importer import DEFAULT_ARTIFACT_PATH, import_gs_subject
from app.core.gs_lms.models import GsLmsMcqQuestion, GsLmsSyllabusNode
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

TEMPLATE_PATH = DEFAULT_ARTIFACT_PATH.parent / "templates" / "gs_subject_template.json"


def _template() -> dict:
    return json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))


def _leaf(data: dict) -> dict:
    return data["tree"][0]["children"][0]["children"][0]


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with SessionLocal() as db:
        db.add_all([
            GsSubject(id=1, slug="geography", name="Geography", display_order=1),
            GsSubject(id=2, slug="polity-governance", name="Polity & Governance", display_order=2),
        ])
        db.commit()
    return SessionLocal


# ---- checker ---------------------------------------------------------------


def test_template_is_a_ready_subject():
    report = check_subject_content(_template())
    assert report.errors == [] and report.gaps == [], format_report(report)
    assert report.ready and report.topics == 1 and report.mcqs == MCQS_PER_TOPIC


def test_geography_content_is_importable():
    data = json.loads(DEFAULT_ARTIFACT_PATH.read_text(encoding="utf-8"))
    report = check_subject_content(data)
    assert report.ok_to_import, format_report(report)
    assert report.topics == 63


def test_checker_reports_malformed_content_as_errors():
    data = _template()
    leaf = _leaf(data)
    leaf["mcq_questions"][0]["correct_option"] = "E"
    leaf["mcq_questions"][1]["options"] = leaf["mcq_questions"][1]["options"][:3]
    leaf["content_sections"][0]["section_label"] = "INTRO"
    leaf["pyqs"][0]["exam_type"] = "PRELIM"
    data["tree"][0]["children"].append(copy.deepcopy(data["tree"][0]["children"][0]))

    errors = "\n".join(check_subject_content(data).errors)
    assert "correct_option 'E'" in errors
    assert "exactly four options" in errors
    assert "section_label 'INTRO'" in errors
    assert "exam_type 'PRELIM'" in errors
    assert "2 topics are titled" in errors


def test_checker_reports_unfinished_topics_as_gaps():
    data = _template()
    leaf = _leaf(data)
    leaf["mcq_questions"] = leaf["mcq_questions"][:5]
    leaf["content_sections"] = [s for s in leaf["content_sections"] if s["section_label"] != "EXAMINER_TRAPS"]
    leaf["pyqs"] = []

    report = check_subject_content(data)
    assert report.ok_to_import and not report.ready and report.topics_ready == 0
    gaps = "\n".join(report.gaps)
    assert f"5 MCQs; the MCQ Lab needs {MCQS_PER_TOPIC}" in gaps
    assert "missing section(s) EXAMINER_TRAPS" in gaps
    assert "no PYQs" in gaps


# ---- importer --------------------------------------------------------------


def test_import_by_slug_is_idempotent_and_records_completeness(session_factory):
    data = _template()
    with session_factory() as db:
        first = import_gs_subject(db, data, review_status="REVIEWED")
        second = import_gs_subject(db, data, review_status="REVIEWED")
        db.commit()
        subject = db.query(GsSubject).filter_by(slug="polity-governance").one()
        assert first["subject_id"] == 2 and first["nodes_created"] == 3 and first["mcqs_created"] == MCQS_PER_TOPIC
        assert second["nodes_created"] == 0 and second["mcqs_created"] == 0
        assert db.query(GsLmsSyllabusNode).filter_by(subject_id=2).count() == 3
        assert subject.is_complete is True
        assert subject.completeness_status["topics_ready"] == 1


def test_import_refuses_a_file_with_errors(session_factory):
    data = _template()
    _leaf(data)["mcq_questions"][0]["correct_option"] = "E"
    with session_factory() as db:
        with pytest.raises(ValueError, match="nothing was imported"):
            import_gs_subject(db, data)
        assert db.query(GsLmsSyllabusNode).count() == 0


def test_import_needs_an_existing_subject(session_factory):
    with session_factory() as db:
        with pytest.raises(ValueError, match="not found"):
            import_gs_subject(db, _template(), subject_slug="economy")


# ---- subjects endpoint -----------------------------------------------------


def _client(session_factory) -> TestClient:
    with session_factory() as db:
        student = User(google_uid="uid-1", email="s@example.com", role=RoleEnum.STUDENT)
        db.add(student)
        db.commit()
        db.refresh(student)
        db.expunge(student)

    def _db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app = FastAPI()
    app.include_router(gs_lms_router, prefix="/gs-lms")
    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = lambda: student
    return TestClient(app)


def _availability(client: TestClient) -> dict:
    response = client.get("/gs-lms/subjects")
    assert response.status_code == 200, response.text
    return {s["slug"]: s for s in response.json()}


def test_subject_opens_only_once_its_content_is_reviewed(session_factory):
    client = _client(session_factory)
    assert _availability(client)["polity-governance"]["available"] is False

    with session_factory() as db:
        import_gs_subject(db, _template())  # UNREVIEWED: still hidden from students
        db.commit()
    polity = _availability(client)["polity-governance"]
    assert polity["available"] is False and polity["topics"] == 0

    with session_factory() as db:
        import_gs_subject(db, _template(), review_status="REVIEWED")
        db.commit()
    polity = _availability(client)["polity-governance"]
    assert polity == {
        "slug": "polity-governance",
        "name": "Polity & Governance",
        "available": True,
        "topics": 1,
        "topics_with_mcqs": 1,
    }
    assert _availability(client)["geography"]["available"] is False


def test_reviewed_topic_without_reviewed_mcqs_does_not_open_a_subject(session_factory):
    client = _client(session_factory)
    with session_factory() as db:
        import_gs_subject(db, _template(), review_status="REVIEWED")
        for mcq in db.query(GsLmsMcqQuestion):
            mcq.review_status = "UNREVIEWED"
        db.commit()
    assert _availability(client)["polity-governance"]["available"] is False
