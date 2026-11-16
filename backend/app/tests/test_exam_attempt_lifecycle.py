"""The exam attempt from start to report, through the API.

Covers what a student depends on during a timed test:

* the clock is the server's, counted from when the attempt started;
* an interrupted exam can be reopened with the answers already saved;
* answers that arrive after time is up are refused, but submitting still works;
* an attempt abandoned past its time limit is closed with a report, and the
  next start is a fresh attempt;
* the report is complete when submit returns, with the revision queue filled.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import (
    Attempt,
    AttemptAnswer,
    AttemptStatusEnum,
    Question,
    Report,
    RevisionQueue,
    RoleEnum,
    Subject,
    Test,
    Topic,
    User,
    WorkflowStatusEnum,
)

OPTIONS = {"A": "Alpha", "B": "Bravo", "C": "Charlie", "D": "Delta"}
DURATION_MINUTES = 30
API = "/api/v1/attempts"


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.drop_all(engine)


@pytest.fixture()
def exam(session_factory):
    db = session_factory()
    user = User(google_uid="uid-1", email="student@example.com", role=RoleEnum.STUDENT)
    other = User(google_uid="uid-2", email="other@example.com", role=RoleEnum.STUDENT)
    subject = Subject(name="Geography")
    db.add_all([user, other, subject])
    db.commit()
    topic = Topic(name="Geomorphology", subject_id=subject.id)
    db.add(topic)
    db.commit()
    test = Test(title="Timed paper", subject_id=subject.id, duration_minutes=DURATION_MINUTES)
    db.add(test)
    db.commit()
    db.add_all(
        Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en=f"Which of the following is correct about item {n}?",
            options_en=dict(OPTIONS),
            correct_option="B",
            question_number=n,
            status=WorkflowStatusEnum.PUBLISHED,
        )
        for n in range(1, 5)
    )
    db.commit()
    ids = {
        "user": user.id,
        "other": other.id,
        "test": test.id,
        "questions": [q.id for q in db.query(Question).order_by(Question.question_number)],
    }
    db.close()
    return ids


@pytest.fixture()
def client(session_factory, exam):
    current = {"user_id": exam["user"]}

    def _db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    def _user():
        db = session_factory()
        try:
            user = db.get(User, current["user_id"])
            db.expunge(user)
            return user
        finally:
            db.close()

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _user
    test_client = TestClient(app)
    test_client.act_as = lambda user_id: current.update(user_id=user_id)
    try:
        yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def _start(client, exam) -> int:
    response = client.post(f"{API}/start", json={"test_id": exam["test"]})
    assert response.status_code == 200, response.text
    return response.json()["data"]["attempt_id"]


def _answer(question_id: int, option: str | None, **extra) -> dict:
    return {"question_id": question_id, "selected_option": option, "time_taken_seconds": 12, **extra}


def _rewind(session_factory, attempt_id: int, minutes: float) -> None:
    """Pretend the attempt started `minutes` ago."""
    db = session_factory()
    attempt = db.get(Attempt, attempt_id)
    attempt.start_time = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    db.commit()
    db.close()


def _state(client, attempt_id: int) -> dict:
    response = client.get(f"{API}/{attempt_id}/state")
    assert response.status_code == 200, response.text
    return response.json()["data"]


# --- the clock ---------------------------------------------------------------

def test_clock_starts_at_the_full_duration(client, exam):
    state = _state(client, _start(client, exam))

    assert state["status"] == "IN_PROGRESS"
    assert state["duration_seconds"] == DURATION_MINUTES * 60
    assert DURATION_MINUTES * 60 - 5 <= state["remaining_seconds"] <= DURATION_MINUTES * 60
    assert state["time_up"] is False


def test_clock_keeps_running_while_the_student_is_away(client, exam, session_factory):
    attempt_id = _start(client, exam)
    _rewind(session_factory, attempt_id, minutes=10)

    remaining = _state(client, attempt_id)["remaining_seconds"]

    assert 20 * 60 - 5 <= remaining <= 20 * 60


def test_clock_never_goes_below_zero(client, exam, session_factory):
    attempt_id = _start(client, exam)
    _rewind(session_factory, attempt_id, minutes=DURATION_MINUTES + 0.5)

    state = _state(client, attempt_id)

    assert state["remaining_seconds"] == 0
    assert state["time_up"] is True


def test_another_student_cannot_read_the_attempt(client, exam):
    attempt_id = _start(client, exam)
    client.act_as(exam["other"])

    assert client.get(f"{API}/{attempt_id}/state").status_code == 404


# --- resume ------------------------------------------------------------------

def test_reopening_returns_the_answers_already_saved(client, exam):
    attempt_id = _start(client, exam)
    q1, q2, q3, _ = exam["questions"]
    client.put(f"{API}/{attempt_id}/answers", json=_answer(q1, "C", confidence_level="FAIRLY_SURE"))
    client.put(
        f"{API}/{attempt_id}/answers/bulk",
        json={"answers": [_answer(q2, "A", marked_for_review=True), _answer(q3, "B")]},
    )

    # Starting again resumes the same attempt rather than a new one.
    assert _start(client, exam) == attempt_id
    saved = {row["question_id"]: row for row in _state(client, attempt_id)["answers"]}

    assert {qid: row["selected_option"] for qid, row in saved.items()} == {q1: "C", q2: "A", q3: "B"}
    assert saved[q1]["confidence_level"] == "FAIRLY_SURE"
    assert saved[q2]["marked_for_review"] is True


def test_bulk_save_is_all_or_nothing(client, exam):
    attempt_id = _start(client, exam)
    q1 = exam["questions"][0]

    response = client.put(
        f"{API}/{attempt_id}/answers/bulk",
        json={"answers": [_answer(q1, "A"), _answer(999_999, "B")]},
    )

    assert response.status_code == 404
    assert _state(client, attempt_id)["answers"] == []


def test_bulk_save_applies_a_repeated_question_in_order(client, exam):
    attempt_id = _start(client, exam)
    q1 = exam["questions"][0]

    response = client.put(
        f"{API}/{attempt_id}/answers/bulk",
        json={"answers": [_answer(q1, "A"), _answer(q1, "D")]},
    )

    assert response.status_code == 200, response.text
    answers = _state(client, attempt_id)["answers"]
    assert [(row["question_id"], row["selected_option"]) for row in answers] == [(q1, "D")]


# --- time up -----------------------------------------------------------------

def test_final_sync_is_accepted_inside_the_grace_period(client, exam, session_factory):
    attempt_id = _start(client, exam)
    _rewind(session_factory, attempt_id, minutes=DURATION_MINUTES + 0.5)

    response = client.put(f"{API}/{attempt_id}/answers", json=_answer(exam["questions"][0], "B"))

    assert response.status_code == 200, response.text


def test_late_answers_are_refused_but_submit_still_works(client, exam, session_factory):
    attempt_id = _start(client, exam)
    q1, q2, *_ = exam["questions"]
    client.put(f"{API}/{attempt_id}/answers", json=_answer(q1, "B"))
    _rewind(session_factory, attempt_id, minutes=DURATION_MINUTES + 5)

    late = client.put(f"{API}/{attempt_id}/answers", json=_answer(q2, "B"))
    late_bulk = client.put(f"{API}/{attempt_id}/answers/bulk", json={"answers": [_answer(q2, "B")]})
    submitted = client.post(f"{API}/{attempt_id}/submit")

    assert late.status_code == 409
    assert late.json()["detail"]["code"] == "TIMER_EXPIRED"
    assert late_bulk.status_code == 409
    assert submitted.status_code == 200, submitted.text
    report = submitted.json()["data"]
    # Only the answer saved in time counts.
    assert report["correct_count"] == 1
    assert report["unattempted_count"] == 3


def test_attempt_closed_late_ends_when_its_clock_did(client, exam, session_factory):
    attempt_id = _start(client, exam)
    _rewind(session_factory, attempt_id, minutes=DURATION_MINUTES + 45)

    client.post(f"{API}/{attempt_id}/submit")

    db = session_factory()
    attempt = db.get(Attempt, attempt_id)
    taken = attempt.end_time - attempt.start_time
    db.close()
    assert abs(taken - timedelta(minutes=DURATION_MINUTES)) < timedelta(seconds=2)


def test_abandoned_attempt_is_closed_and_the_next_start_is_fresh(client, exam, session_factory):
    first = _start(client, exam)
    client.put(f"{API}/{first}/answers", json=_answer(exam["questions"][0], "B"))
    _rewind(session_factory, first, minutes=DURATION_MINUTES + 120)

    second = _start(client, exam)

    assert second != first
    old = _state(client, first)
    assert old["status"] == "SUBMITTED"
    assert _state(client, second)["remaining_seconds"] >= DURATION_MINUTES * 60 - 5
    db = session_factory()
    report = db.query(Report).filter(Report.attempt_id == first).one()
    db.close()
    assert report.correct_count == 1
    assert report.processing_status == "COMPLETED"


# --- submit and report -------------------------------------------------------

def test_report_is_complete_when_submit_returns(client, exam, session_factory):
    attempt_id = _start(client, exam)
    q1, q2, q3, _ = exam["questions"]
    client.put(
        f"{API}/{attempt_id}/answers/bulk",
        json={"answers": [_answer(q1, "B"), _answer(q2, "B"), _answer(q3, "A")]},
    )

    response = client.post(f"{API}/{attempt_id}/submit")

    assert response.status_code == 200, response.text
    db = session_factory()
    report = db.query(Report).filter(Report.attempt_id == attempt_id).one()
    queued = db.query(RevisionQueue).filter(RevisionQueue.user_id == exam["user"]).all()
    attempt = db.get(Attempt, attempt_id)
    try:
        assert attempt.status == AttemptStatusEnum.SUBMITTED
        assert (report.correct_count, report.incorrect_count, report.unattempted_count) == (2, 1, 1)
        assert report.processing_status == "COMPLETED"
        assert report.truth_status == "VERIFIED"
        assert report.narrative
        # The wrong answer is waiting in the revision queue already.
        assert q3 in {row.question_id for row in queued}
    finally:
        db.close()


def test_submitting_twice_returns_the_same_report(client, exam, session_factory):
    attempt_id = _start(client, exam)
    client.put(f"{API}/{attempt_id}/answers", json=_answer(exam["questions"][0], "B"))

    first = client.post(f"{API}/{attempt_id}/submit")
    second = client.post(f"{API}/{attempt_id}/submit")

    assert first.status_code == second.status_code == 200
    assert first.json()["data"]["total_score"] == second.json()["data"]["total_score"]
    db = session_factory()
    assert db.query(Report).filter(Report.attempt_id == attempt_id).count() == 1
    db.close()


def test_retrying_submit_finishes_a_report_left_unfinished(client, exam, session_factory):
    attempt_id = _start(client, exam)
    client.put(f"{API}/{attempt_id}/answers", json=_answer(exam["questions"][0], "B"))
    client.post(f"{API}/{attempt_id}/submit")
    db = session_factory()
    report = db.query(Report).filter(Report.attempt_id == attempt_id).one()
    report.processing_status = "PENDING"
    report.truth_status = None
    db.commit()
    db.close()

    response = client.post(f"{API}/{attempt_id}/submit")

    assert response.status_code == 200, response.text
    db = session_factory()
    report = db.query(Report).filter(Report.attempt_id == attempt_id).one()
    db.close()
    assert report.processing_status == "COMPLETED"
    assert report.truth_status == "VERIFIED"


def test_answers_cannot_change_after_submit(client, exam, session_factory):
    attempt_id = _start(client, exam)
    q1 = exam["questions"][0]
    client.put(f"{API}/{attempt_id}/answers", json=_answer(q1, "A"))
    client.post(f"{API}/{attempt_id}/submit")

    response = client.put(f"{API}/{attempt_id}/answers", json=_answer(q1, "B"))

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "ALREADY_SUBMITTED"
    db = session_factory()
    stored = db.query(AttemptAnswer).filter_by(attempt_id=attempt_id, question_id=q1).one()
    db.close()
    assert stored.selected_option == "A"


def test_simulation_left_past_its_time_is_closed_and_the_next_start_is_fresh(client, exam, session_factory):
    first = client.post(f"/api/v1/simulation/start/{exam['test']}").json()
    assert first["status"] == "STARTED"

    # Still inside its time: the same simulation is resumed.
    again = client.post(f"/api/v1/simulation/start/{exam['test']}").json()
    assert (again["status"], again["attempt_id"]) == ("RESUMED", first["attempt_id"])

    _rewind(session_factory, first["attempt_id"], minutes=DURATION_MINUTES + 30)
    fresh = client.post(f"/api/v1/simulation/start/{exam['test']}").json()

    assert fresh["status"] == "STARTED" and fresh["attempt_id"] != first["attempt_id"]
    db = session_factory()
    try:
        old = db.get(Attempt, first["attempt_id"])
        assert old.status != AttemptStatusEnum.IN_PROGRESS
        assert db.query(Report).filter(Report.attempt_id == old.id).count() == 1
    finally:
        db.close()
