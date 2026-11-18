"""Admin Content studio: readiness from the database, upload check and import,
approve / un-approve, admin-only access, worklist CSV and the migration."""

from __future__ import annotations

import copy
import csv
import importlib.util
import io
import json
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import get_current_user
from app.api.v1.admin import router as admin_router
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.gs.models import GsReviewStatusEnum as RS, GsSubject
from app.core.gs_lms.content_check import MCQS_PER_TOPIC
from app.core.gs_lms.importer import DEFAULT_ARTIFACT_PATH, import_gs_subject
from app.core.gs_lms.models import (
    GsLmsConcept,
    GsLmsConceptVersion,
    GsLmsContentImport,
    GsLmsContentReviewLog,
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsPyq,
    GsLmsSyllabusNode,
)
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

TEMPLATE_PATH = DEFAULT_ARTIFACT_PATH.parent / "templates" / "gs_subject_template.json"
MIGRATION_PATH = (
    Path(__file__).resolve().parents[2] / "alembic" / "versions" / "o2c3d4e5f6a7_add_gs_lms_content_studio_logs.py"
)
BASE = "/api/v1/admin/gs-lms/content"


class _Who:
    def __init__(self, id, role, email):
        self.id, self.role, self.email = id, role, email


STUDENT = _Who(1, RoleEnum.STUDENT, "s@test.local")
ADMIN = _Who(2, RoleEnum.ADMIN, "a@test.local")


def _template() -> dict:
    return json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))


def _leaf_of(data: dict) -> dict:
    return data["tree"][0]["children"][0]["children"][0]


def _upload(data) -> dict:
    raw = data if isinstance(data, bytes) else json.dumps(data).encode()
    return {"file": ("polity.json", raw, "application/json")}


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with SessionLocal() as db:
        db.add(GsSubject(id=1, slug="polity-governance", name="Polity", display_order=1))
        db.add(GsSubject(id=2, slug="history", name="History", display_order=2))
        db.add(User(id=1, email="s@test.local", full_name="S", role=RoleEnum.STUDENT, google_uid="g1"))
        db.add(User(id=2, email="a@test.local", full_name="Asha Admin", role=RoleEnum.ADMIN, google_uid="g2"))
        db.commit()
    return SessionLocal


@pytest.fixture()
def db(session_factory):
    with session_factory() as s:
        yield s


@pytest.fixture()
def who():
    return {"user": ADMIN}


@pytest.fixture()
def client(session_factory, who):
    app_ = FastAPI()
    app_.include_router(admin_router, prefix="/api/v1/admin")
    app_.include_router(gs_lms_router, prefix="/api/v1/gs-lms")

    def _db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    app_.dependency_overrides[get_db] = _db
    app_.dependency_overrides[get_current_user] = lambda: who["user"]
    return TestClient(app_)


@pytest.fixture()
def imported(db):
    import_gs_subject(db, _template())
    db.commit()


def _topic(client, slug="polity-governance"):
    r = client.get(f"{BASE}/subjects/{slug}")
    assert r.status_code == 200
    return r.json()["data"]


def _leaf_id(db) -> int:
    return db.query(GsLmsSyllabusNode).filter(GsLmsSyllabusNode.node_type == "LEAF_TOPIC").first().id


def _available(client) -> bool:
    rows = client.get("/api/v1/gs-lms/subjects").json()
    return next(r for r in rows if r["slug"] == "polity-governance")["available"]


# ---------------------------------------------------------------------------
# Readiness
# ---------------------------------------------------------------------------

def test_readiness_of_template_subject(client, imported):
    rows = client.get(f"{BASE}/subjects").json()["data"]
    assert [r["slug"] for r in rows] == ["polity-governance", "history"]
    polity, history = rows
    assert history["topics"] == 0 and history["last_import"] is None
    leaf = _leaf_of(_template())
    assert polity["topics"] == 1 and polity["topics_ready"] == 1 and polity["topics_reviewed"] == 0
    assert polity["mcqs"] == len(leaf["mcq_questions"]) == MCQS_PER_TOPIC
    assert polity["mcqs_reviewed"] == 0 and polity["mcqs_unreviewed"] == MCQS_PER_TOPIC
    assert polity["concepts"] == len(leaf["concepts"])
    assert polity["pyqs"] == len(leaf["pyqs"]) >= 1
    assert polity["versions"] == 2
    assert polity["last_import"]["source"] == "command_line"  # imported outside the studio


def test_topic_readiness_and_next_to_write(client, db, imported):
    data = _topic(client)
    assert data["subject"]["slug"] == "polity-governance"
    (t,) = data["topics"]
    assert t["mega_title"] == "Constitutional Framework" and t["sub_title"] == "Making of the Constitution"
    assert t["review_status"] == "UNREVIEWED" and t["content_ready"] and t["next_to_write"] == []
    assert t["sections_missing"] == [] and len(t["sections_present"]) == 5
    assert (t["mcqs"], t["mcqs_needed"]) == (15, 15)
    assert t["concepts_with_good_key_points"] == t["concepts"] and t["concepts_with_version"] >= 1
    assert t["book_refs"] >= 1

    # Make the topic incomplete: drop a section, 4 MCQs, all PYQs; one MCQ loses its explanation.
    leaf_id = t["node_id"]
    db.query(GsLmsContentSection).filter_by(section_label="ADVANCED").delete()
    for q in db.query(GsLmsMcqQuestion).order_by(GsLmsMcqQuestion.id).limit(4):
        db.delete(q)
    db.flush()
    db.query(GsLmsMcqQuestion).first().explanation = ""
    db.query(GsLmsPyq).delete()
    db.commit()
    (t,) = _topic(client)["topics"]
    assert not t["content_ready"] and t["node_id"] == leaf_id
    assert t["sections_missing"] == ["ADVANCED"] and t["mcqs"] == 11
    assert t["next_to_write"] == [
        "Write the Advanced section",
        "Add 4 MCQs (11 of 15 written)",
        "Add an explanation to 1 MCQ",
        "Add at least one previous-year question (PYQ)",
    ]
    assert client.get(f"{BASE}/subjects").json()["data"][0]["topics_ready"] == 0


def test_unknown_subject_is_404(client):
    assert client.get(f"{BASE}/subjects/nope").status_code == 404
    assert client.get(f"{BASE}/subjects/nope/worklist.csv").status_code == 404


def test_worklist_csv_shape(client, db, imported):
    r = client.get(f"{BASE}/subjects/polity-governance/worklist.csv")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "polity-governance-worklist.csv" in r.headers["content-disposition"]
    rows = list(csv.reader(io.StringIO(r.text)))
    assert rows[0][:5] == ["Mega topic", "Sub topic", "Topic", "Status", "Content ready"]
    assert len(rows) == 2 and len(rows[1]) == len(rows[0])
    assert rows[1][0] == "Constitutional Framework" and rows[1][3] == "Draft" and rows[1][4] == "yes"
    assert rows[1][6] == "15" and rows[1][7] == "15"
    # Titles that start like a formula are neutralised.
    db.query(GsLmsSyllabusNode).filter_by(node_type="LEAF_TOPIC").one().title = "=SUM(A1)"
    db.commit()
    rows = list(csv.reader(io.StringIO(client.get(f"{BASE}/subjects/polity-governance/worklist.csv").text)))
    assert rows[1][2] == "'=SUM(A1)"


# ---------------------------------------------------------------------------
# Check and import
# ---------------------------------------------------------------------------

def _broken() -> dict:
    data = _template()
    leaf = _leaf_of(data)
    leaf["mcq_questions"][0]["correct_option"] = "Z"
    return data


def test_check_reports_errors_and_writes_nothing(client, db):
    r = client.post(f"{BASE}/check", files=_upload(_broken()))
    assert r.status_code == 200
    body = r.json()["data"]
    assert body["ok_to_import"] is False and body["ready"] is False
    assert any("correct_option" in e for e in body["errors"])
    assert body["summary"]["topics"] == 1
    assert db.query(GsLmsSyllabusNode).count() == 0 and db.query(GsLmsContentImport).count() == 0


def test_check_clean_file_and_gaps(client, db):
    ok = client.post(f"{BASE}/check", files=_upload(_template())).json()["data"]
    assert ok["ok_to_import"] and ok["ready"] and ok["errors"] == [] and ok["gaps"] == []
    assert ok["subject_name"] == "Polity" and ok["approved_topics_now"] == 0
    gappy = _template()
    _leaf_of(gappy)["pyqs"] = []
    body = client.post(f"{BASE}/check", files=_upload(gappy)).json()["data"]
    assert body["ok_to_import"] and not body["ready"] and any("PYQ" in g for g in body["gaps"])
    assert db.query(GsLmsSyllabusNode).count() == 0


def test_check_rejects_bad_files(client):
    assert client.post(f"{BASE}/check", files=_upload(b"not json")).status_code == 400
    assert client.post(f"{BASE}/check", files=_upload(b"[1,2]")).status_code == 400
    r = client.post(f"{BASE}/check", files=_upload({"tree": []}))
    assert r.status_code == 200 and any("subject_slug" in e for e in r.json()["data"]["errors"])
    unknown = _template()
    unknown["subject_slug"] = "astrology"
    body = client.post(f"{BASE}/check", files=_upload(unknown)).json()["data"]
    assert not body["ok_to_import"] and any("astrology" in e for e in body["errors"])


def test_upload_size_limit(client, monkeypatch):
    from app.api.v1.admin import gs_lms_content_studio as mod

    monkeypatch.setattr(mod, "MAX_UPLOAD_BYTES", 100)
    r = client.post(f"{BASE}/check", files=_upload(b" " * 101))
    assert r.status_code == 413


def test_import_refuses_errors(client, db):
    r = client.post(f"{BASE}/import", files=_upload(_broken()))
    assert r.status_code == 422
    assert any("correct_option" in e for e in r.json()["detail"]["errors"])
    assert db.query(GsLmsSyllabusNode).count() == 0 and db.query(GsLmsContentImport).count() == 0


def test_import_clean_file_as_draft_and_logs(client, db):
    r = client.post(f"{BASE}/import", files=_upload(_template()))
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["result"]["review_status"] == "UNREVIEWED" and data["result"]["mcqs_created"] == 15
    assert db.query(GsLmsSyllabusNode).filter(GsLmsSyllabusNode.review_status != RS.UNREVIEWED).count() == 0
    assert db.query(GsLmsMcqQuestion).filter(GsLmsMcqQuestion.review_status != RS.UNREVIEWED).count() == 0
    (log,) = db.query(GsLmsContentImport).all()
    assert log.uploaded_by == ADMIN.id and log.filename == "polity.json" and len(log.sha256) == 64
    assert log.summary["topics"] == 1 and log.result["nodes_created"] >= 3
    subject = db.get(GsSubject, 1)
    assert subject.is_complete and subject.completeness_status["topics_ready"] == 1
    # Students see nothing until it is approved.
    assert not _available(client)

    listed = client.get(f"{BASE}/imports?subject=polity-governance").json()["data"]
    assert len(listed) == 1 and listed[0]["filename"] == "polity.json" and listed[0]["uploaded_by_name"] == "Asha Admin"
    assert client.get(f"{BASE}/imports?subject=history").json()["data"] == []
    assert client.get(f"{BASE}/subjects").json()["data"][0]["last_import"]["source"] == "content_studio"


def test_import_can_derive_concepts(client, db):
    data = _template()
    leaf = _leaf_of(data)
    leaf["concepts"] = []
    leaf["concept_checklist"] = ["separation of powers", "judicial review"]
    r = client.post(f"{BASE}/import", files=_upload(data), data={"derive_concepts": "true"})
    assert r.status_code == 200, r.text
    assert r.json()["data"]["result"]["concepts_derived"] == 2
    assert db.query(GsLmsConcept).count() == 2


def test_reimport_keeps_approval_of_unchanged_topics(client, db, imported):
    leaf_id = _leaf_id(db)
    assert client.post(f"{BASE}/topics/{leaf_id}/review", json={"status": "REVIEWED"}).status_code == 200
    body = client.post(f"{BASE}/check", files=_upload(_template())).json()["data"]
    assert body["approved_topics_now"] == 1
    r = client.post(f"{BASE}/import", files=_upload(_template()))
    assert r.json()["data"]["result"]["approved_topics_before"] == 1
    db.expire_all()
    # Nothing in the file changed, so the approval is kept.
    assert db.get(GsLmsSyllabusNode, leaf_id).review_status == RS.REVIEWED


# ---------------------------------------------------------------------------
# Approve / un-approve
# ---------------------------------------------------------------------------

def test_approve_leaf_flips_rows_and_opens_subject(client, db, imported):
    leaf_id = _leaf_id(db)
    assert not _available(client)
    r = client.post(f"{BASE}/topics/{leaf_id}/review", json={"status": "REVIEWED"})
    assert r.status_code == 200, r.text
    counts = r.json()["data"]
    assert counts["topics"] == 1 and counts["mcqs"] == 15 and counts["sections"] == 5 and counts["versions"] == 2

    db.expire_all()
    assert db.get(GsLmsSyllabusNode, leaf_id).review_status == RS.REVIEWED
    for model in (GsLmsMcqQuestion, GsLmsConcept, GsLmsConceptVersion, GsLmsPyq, GsLmsContentSection):
        assert db.query(model).filter(model.review_status != RS.REVIEWED).count() == 0
    # the mega- and sub-topic above it are approved too, so the syllabus tree shows it
    assert db.query(GsLmsSyllabusNode).filter(GsLmsSyllabusNode.review_status != RS.REVIEWED).count() == 0
    assert _available(client)
    (log,) = db.query(GsLmsContentReviewLog).all()
    assert (log.node_id, log.user_id, log.status) == (leaf_id, ADMIN.id, "REVIEWED") and log.counts["mcqs"] == 15
    assert db.get(GsSubject, 1).completeness_status["reviewed_topics"] == 1

    (t,) = _topic(client)["topics"]
    assert t["review_status"] == "REVIEWED" and t["mcqs_reviewed"] == 15 and t["mcqs_unreviewed"] == 0

    r = client.post(f"{BASE}/topics/{leaf_id}/review", json={"status": "UNREVIEWED"})
    assert r.status_code == 200
    db.expire_all()
    assert db.query(GsLmsSyllabusNode).filter(GsLmsSyllabusNode.review_status != RS.UNREVIEWED).count() == 0
    assert db.query(GsLmsMcqQuestion).filter(GsLmsMcqQuestion.review_status != RS.UNREVIEWED).count() == 0
    assert not _available(client)
    assert db.get(GsSubject, 1).completeness_status["reviewed_topics"] == 0
    assert db.query(GsLmsContentReviewLog).count() == 2


def test_approve_only_chosen_parts(client, db, imported):
    leaf_id = _leaf_id(db)
    r = client.post(f"{BASE}/topics/{leaf_id}/review", json={"status": "REVIEWED", "include": ["mcqs"]})
    assert r.status_code == 200 and "topic" not in r.json()["data"]
    db.expire_all()
    assert db.get(GsLmsSyllabusNode, leaf_id).review_status == RS.UNREVIEWED
    assert db.query(GsLmsMcqQuestion).filter(GsLmsMcqQuestion.review_status == RS.REVIEWED).count() == 15
    assert db.query(GsLmsConcept).filter(GsLmsConcept.review_status == RS.REVIEWED).count() == 0
    assert not _available(client)  # the topic itself is still a draft


def test_review_validation(client, db, imported):
    leaf_id = _leaf_id(db)
    assert client.post(f"{BASE}/topics/{leaf_id}/review", json={"status": "IN_REVIEW"}).status_code == 422
    assert client.post(f"{BASE}/topics/{leaf_id}/review", json={"status": "REVIEWED", "include": ["x"]}).status_code == 422
    assert client.post(f"{BASE}/topics/{leaf_id}/review", json={"status": "REVIEWED", "include": []}).status_code == 400
    assert client.post(f"{BASE}/topics/9999/review", json={"status": "REVIEWED"}).status_code == 404
    parent = db.query(GsLmsSyllabusNode).filter_by(node_type="SUB_TOPIC").one()
    assert client.post(f"{BASE}/topics/{parent.id}/review", json={"status": "REVIEWED"}).status_code == 400


def test_bulk_approve_sub_topic_skips_unready(client, db):
    data = _template()
    sub = data["tree"][0]["children"][0]
    second = copy.deepcopy(sub["children"][0])
    second["title"] = "Second topic"
    second["pyqs"] = []  # not ready: no PYQ
    sub["children"].append(second)
    import_gs_subject(db, data)
    db.commit()
    sub_id = db.query(GsLmsSyllabusNode).filter_by(node_type="SUB_TOPIC").one().id

    r = client.post(f"{BASE}/nodes/{sub_id}/review", json={"status": "REVIEWED"})
    assert r.status_code == 200, r.text
    out = r.json()["data"]
    assert out["topics"] == 1 and [s["title"] for s in out["skipped_not_ready"]] == ["Second topic"]
    db.expire_all()
    status = {n.title: n.review_status for n in db.query(GsLmsSyllabusNode)}
    assert status["Second topic"] == RS.UNREVIEWED
    assert status[sub["title"]] == RS.REVIEWED and status[data["tree"][0]["title"]] == RS.REVIEWED
    assert _available(client)

    r = client.post(f"{BASE}/nodes/{sub_id}/review", json={"status": "REVIEWED", "only_ready": False})
    assert r.json()["data"]["topics"] == 2
    db.expire_all()
    assert db.query(GsLmsSyllabusNode).filter(GsLmsSyllabusNode.review_status != RS.REVIEWED).count() == 0

    r = client.post(f"{BASE}/nodes/{sub_id}/review", json={"status": "UNREVIEWED"})
    assert r.json()["data"]["topics"] == 2
    db.expire_all()
    assert db.query(GsLmsSyllabusNode).filter(GsLmsSyllabusNode.review_status != RS.UNREVIEWED).count() == 0
    assert not _available(client)


def test_unapproving_one_topic_keeps_parent_while_another_is_approved(client, db):
    data = _template()
    sub = data["tree"][0]["children"][0]
    second = copy.deepcopy(sub["children"][0])
    second["title"] = "Second topic"
    sub["children"].append(second)
    import_gs_subject(db, data)
    db.commit()
    mega_id = db.query(GsLmsSyllabusNode).filter_by(node_type="MEGA_TOPIC").one().id
    assert client.post(f"{BASE}/nodes/{mega_id}/review", json={"status": "REVIEWED"}).json()["data"]["topics"] == 2
    first = db.query(GsLmsSyllabusNode).filter_by(title=sub["children"][0]["title"]).one().id
    client.post(f"{BASE}/topics/{first}/review", json={"status": "UNREVIEWED"})
    db.expire_all()
    assert db.get(GsLmsSyllabusNode, mega_id).review_status == RS.REVIEWED
    assert _available(client)


# ---------------------------------------------------------------------------
# Access
# ---------------------------------------------------------------------------

def test_non_admin_gets_403_everywhere(client, db, who, imported):
    who["user"] = STUDENT
    leaf_id = _leaf_id(db)
    calls = [
        ("get", f"{BASE}/subjects", {}),
        ("get", f"{BASE}/subjects/polity-governance", {}),
        ("get", f"{BASE}/subjects/polity-governance/worklist.csv", {}),
        ("get", f"{BASE}/imports", {}),
        ("post", f"{BASE}/check", {"files": _upload(_template())}),
        ("post", f"{BASE}/import", {"files": _upload(_template())}),
        ("post", f"{BASE}/topics/{leaf_id}/review", {"json": {"status": "REVIEWED"}}),
        ("post", f"{BASE}/nodes/{leaf_id}/review", {"json": {"status": "REVIEWED"}}),
    ]
    for method, url, kwargs in calls:
        assert getattr(client, method)(url, **kwargs).status_code == 403, url
    db.expire_all()
    assert db.get(GsLmsSyllabusNode, leaf_id).review_status == RS.UNREVIEWED
    assert db.query(GsLmsContentImport).count() == 0


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

def test_migration_up_down_up():
    spec = importlib.util.spec_from_file_location("studio_migration", MIGRATION_PATH)
    mig = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mig)
    assert mig.down_revision == "n1b2c3d4e5f6"
    tables = {"gs_lms_content_imports", "gs_lms_content_review_log"}
    engine = create_engine("sqlite:///:memory:", future=True)
    with engine.begin() as conn:
        conn.execute(sa.text("CREATE TABLE gs_subjects (id INTEGER PRIMARY KEY)"))
        conn.execute(sa.text("CREATE TABLE users (id INTEGER PRIMARY KEY)"))
        conn.execute(sa.text("CREATE TABLE gs_lms_syllabus_nodes (id INTEGER PRIMARY KEY)"))
        with Operations.context(MigrationContext.configure(conn)):
            mig.upgrade()
            assert tables <= set(sa.inspect(conn).get_table_names())
            cols = {c["name"] for c in sa.inspect(conn).get_columns("gs_lms_content_imports")}
            assert cols >= {"subject_id", "uploaded_by", "filename", "sha256", "summary", "result", "created_at"}
            mig.upgrade()  # idempotent
            mig.downgrade()
            assert not tables & set(sa.inspect(conn).get_table_names())
