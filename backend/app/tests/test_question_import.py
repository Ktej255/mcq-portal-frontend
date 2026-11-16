"""Filling a test with questions through the operator API.

Before this, adding a question failed with a server error whether it was sent
alone or in bulk, so no test could be given questions. These tests take an
operator from an empty database to a test a student can sit and be scored on.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import Question, RoleEnum, Topic, User

ADMIN = "/api/v1/admin"


@pytest.fixture()
def api():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = factory()
    admin = User(google_uid="admin", email="admin@example.com", role=RoleEnum.ADMIN)
    student = User(google_uid="student", email="student@example.com", role=RoleEnum.STUDENT)
    db.add_all([admin, student])
    db.commit()
    users = {"admin": admin.id, "student": student.id}
    db.close()
    current = {"id": users["admin"]}

    def _db():
        session = factory()
        try:
            yield session
        finally:
            session.close()

    def _user():
        session = factory()
        user = session.get(User, current["id"])
        session.expunge(user)
        session.close()
        return user

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _user
    client = TestClient(app)

    subject = client.post(f"{ADMIN}/subjects", json={"name": "Polity"}).json()["data"]
    topic = client.post(
        f"{ADMIN}/topics", json={"name": "Parliament", "subject_id": subject["id"]}
    ).json()["data"]
    test = client.post(
        f"{ADMIN}/tests",
        json={"title": "Polity paper 1", "subject_id": subject["id"], "duration_minutes": 10},
    ).json()["data"]

    class Api:
        pass

    handle = Api()
    handle.client = client
    handle.factory = factory
    handle.test_id = test["id"]
    handle.topic_id = topic["id"]
    handle.as_user = lambda name: current.__setitem__("id", users[name])
    yield handle
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)
    Base.metadata.drop_all(engine)


def row(n: int, **changes):
    base = {
        "text_en": f"Which article of the Constitution deals with matter {n}?",
        "options_en": {"A": f"Article {n}", "B": f"Article {n + 100}", "C": "Neither", "D": "Both"},
        "correct_option": "b",
        "topic": "Parliament",
    }
    base.update(changes)
    return base


def do_import(api, rows, **options):
    body = {"test_id": api.test_id, "questions": rows, **options}
    response = api.client.post(f"{ADMIN}/questions/import", json=body)
    assert response.status_code == 200, response.text
    return response.json()["data"]


def stored(api):
    db = api.factory()
    try:
        return db.query(Question).order_by(Question.question_number).all()
    finally:
        db.close()


def test_dry_run_reports_and_saves_nothing(api):
    report = do_import(api, [row(1), row(2)])

    assert report["dry_run"] is True and report["saved"] is False
    assert (report["ready"], report["invalid"], report["duplicates"]) == (2, 0, 0)
    assert [r["question_number"] for r in report["rows"]] == [1, 2]
    assert stored(api) == []


def test_real_run_saves_what_the_dry_run_promised(api):
    promised = do_import(api, [row(1), row(2)])
    report = do_import(api, [row(1), row(2)], dry_run=False, publish=True)

    assert report["saved"] is True and report["created"] == promised["ready"] == 2
    questions = stored(api)
    assert [q.question_number for q in questions] == [1, 2]
    assert questions[0].options_en == {"A": "Article 1", "B": "Article 101", "C": "Neither", "D": "Both"}
    assert questions[0].correct_option == "B"
    assert questions[0].status.value == "PUBLISHED"
    assert questions[0].topic_id == api.topic_id


def test_uploading_the_same_file_twice_adds_nothing(api):
    do_import(api, [row(1), row(2)], dry_run=False)
    again = do_import(api, [row(1), row(2), row(3)], dry_run=False)

    assert (again["created"], again["duplicates"]) == (1, 2)
    assert "already in this test" in again["rows"][0]["problems"][0]
    assert len(stored(api)) == 3


def test_duplicates_are_recognised_despite_case_spacing_and_option_order(api):
    do_import(api, [row(1)], dry_run=False)
    disguised = row(
        1,
        text_en="  which ARTICLE of the constitution   deals with matter 1? ",
        options_en={"A": "both", "B": "Neither", "C": "Article 101", "D": "Article 1"},
        correct_option="C",
    )
    report = do_import(api, [disguised, row(2), row(2)], dry_run=False)

    assert [r["outcome"] for r in report["rows"]] == ["duplicate", "created", "duplicate"]
    assert "row 2 of this upload" in report["rows"][2]["problems"][0]


def test_one_bad_row_is_named_and_nothing_is_saved(api):
    rows = [
        row(1),
        row(2, correct_option="E"),
        row(3, options_en={"A": "Only", "B": "Two"}),
        row(4, topic="No such topic"),
        row(5, text_en=""),
    ]
    report = do_import(api, rows, dry_run=False)

    assert report["saved"] is False and report["invalid"] == 4
    assert [r["outcome"] for r in report["rows"]] == ["ready", "invalid", "invalid", "invalid", "invalid"]
    assert "A, B, C or D" in report["rows"][1]["problems"][0]
    assert "four options" in report["rows"][2]["problems"][0]
    assert "No such topic" in report["rows"][3]["problems"][0]
    assert stored(api) == []


def test_spreadsheet_columns_and_a_default_topic_are_accepted(api):
    sheet_row = {
        "question": "Which house can a Money Bill be introduced in first?",
        "option_a": "Lok Sabha",
        "option_b": "Rajya Sabha",
        "option_c": "Either house",
        "option_d": "A joint sitting",
        "answer": "A",
        "explanation": "Article 109.",
    }
    report = do_import(api, [sheet_row], dry_run=False, default_topic_id=api.topic_id)

    assert report["created"] == 1
    question = stored(api)[0]
    assert question.correct_option == "A" and question.explanation_en == "Article 109."
    assert question.status.value == "DRAFT"


def test_the_downloadable_template_columns_are_accepted(api):
    template_row = {
        "text_en": "Which body conducts elections to Parliament?",
        "A": "Election Commission",
        "B": "Supreme Court",
        "C": "Lok Sabha Secretariat",
        "D": "NITI Aayog",
        "correct": "A",
        "difficulty": "easy",
        "topic_id": "",
        "test_id": "",
    }
    report = do_import(api, [template_row], dry_run=False, default_topic_id=api.topic_id)

    assert report["created"] == 1
    assert stored(api)[0].options_en["A"] == "Election Commission"


def test_missing_topics_are_created_only_when_asked(api):
    refused = do_import(api, [row(1, topic="Judiciary")])
    assert refused["invalid"] == 1

    report = do_import(api, [row(1, topic="Judiciary"), row(2, topic="judiciary")], dry_run=False, create_missing_topics=True)
    assert report["created"] == 2 and report["topics_created"] == ["Judiciary"]
    db = api.factory()
    try:
        assert db.query(Topic).filter(Topic.name == "Judiciary").count() == 1
    finally:
        db.close()


def test_question_numbers_continue_after_the_ones_already_there(api):
    do_import(api, [row(1), row(2)], dry_run=False)
    report = do_import(api, [row(3), row(4, question_number=2), row(5, question_number=9)], dry_run=False)

    assert [r["question_number"] for r in report["rows"]] == [3, 4, 9]


def test_unknown_test_and_oversized_uploads_are_refused(api):
    missing = api.client.post(f"{ADMIN}/questions/import", json={"test_id": 999, "questions": [row(1)]})
    assert missing.status_code == 404

    too_many = api.client.post(
        f"{ADMIN}/questions/import", json={"test_id": api.test_id, "questions": [row(n) for n in range(501)]}
    )
    assert too_many.status_code == 422


def test_students_cannot_upload(api):
    api.as_user("student")
    response = api.client.post(f"{ADMIN}/questions/import", json={"test_id": api.test_id, "questions": [row(1)]})
    assert response.status_code == 403
    assert stored(api) == []


def test_single_and_older_bulk_routes_work_and_reject_bad_input(api):
    payload = {**row(1), "test_id": api.test_id, "topic_id": api.topic_id}
    payload.pop("topic")

    created = api.client.post(f"{ADMIN}/questions", json=payload)
    assert created.status_code == 200, created.text
    assert created.json()["data"]["options_en"]["B"] == "Article 101"

    repeated = api.client.post(f"{ADMIN}/questions", json=payload)
    assert repeated.status_code == 422

    second = {**payload, "text_en": "Who presides over a joint sitting of Parliament?"}
    bulk = api.client.post(f"{ADMIN}/questions/bulk", json={"questions": [payload, second]})
    assert bulk.status_code == 200, bulk.text
    assert len(bulk.json()["data"]) == 1
    assert len(stored(api)) == 2


def test_a_student_can_sit_and_be_scored_on_an_uploaded_test(api):
    do_import(api, [row(1), row(2), row(3)], dry_run=False, publish=True)
    api.as_user("student")

    served = api.client.get(f"/api/v1/tests/{api.test_id}/questions").json()["data"]
    assert len(served) == 3
    attempt = api.client.post("/api/v1/attempts/start", json={"test_id": api.test_id}).json()["data"]
    answers = [
        {
            "question_id": int(question["id"]),
            "selected_option": choice,
            "confidence_level": "FAIRLY_SURE",
            "time_taken_seconds": 5,
        }
        for question, choice in zip(served, ["B", "B", "A"])
    ]
    saved = api.client.put(f"/api/v1/attempts/{attempt['attempt_id']}/answers/bulk", json={"answers": answers})
    assert saved.status_code == 200, saved.text
    report = api.client.post(f"/api/v1/attempts/{attempt['attempt_id']}/submit").json()["data"]

    assert (report["correct_count"], report["incorrect_count"]) == (2, 1)
