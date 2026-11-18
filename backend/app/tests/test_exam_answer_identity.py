"""The option a student clicks must be the option that is stored and scored.

The exam screen shows the original question (``tests/{id}/questions``). A
per-attempt variation used to be applied when the answer was saved, but not when
the question was shown, so the stored option was usually not the clicked one.
Variation is now one explicit switch (``MCQ_VARIATION_ENABLED``, off by default)
that governs both sides.
"""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.session import Base
from app.models.domain import (
    AttemptAnswer,
    Question,
    RoleEnum,
    Subject,
    Test,
    Topic,
    User,
    WorkflowStatusEnum,
)
from app.schemas.test_engine import SaveAnswerRequest, StartAttemptRequest
from app.services.test_engine_service import (
    get_attempt_questions,
    save_answer,
    start_attempt,
)

OPTIONS = {"A": "Alpha", "B": "Bravo", "C": "Charlie", "D": "Delta"}


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


def _seed(db, question_count: int = 12):
    user = User(google_uid="uid-1", email="student@example.com", role=RoleEnum.STUDENT)
    subject = Subject(name="Geography")
    db.add_all([user, subject])
    db.commit()
    topic = Topic(name="Geomorphology", subject_id=subject.id)
    db.add(topic)
    db.commit()
    test = Test(title="Identity", subject_id=subject.id, duration_minutes=30)
    db.add(test)
    db.commit()
    questions = [
        Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en=f"Which of the following is correct about item {n}?",
            options_en=dict(OPTIONS),
            correct_option="B",
            question_number=n,
            status=WorkflowStatusEnum.PUBLISHED,
        )
        for n in range(1, question_count + 1)
    ]
    db.add_all(questions)
    db.commit()
    attempt = start_attempt(db, user.id, StartAttemptRequest(test_id=test.id))
    return user, attempt, questions


def _stored(db, attempt_id: int, question_id: int) -> str:
    return (
        db.query(AttemptAnswer)
        .filter_by(attempt_id=attempt_id, question_id=question_id)
        .one()
        .selected_option
    )


def test_variation_is_off_by_default():
    assert settings.MCQ_VARIATION_ENABLED is False


def test_saved_option_is_the_clicked_option(db, monkeypatch):
    # Remove the pytest marker that the old code used to switch variation off,
    # so this test exercises exactly what production runs.
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    user, attempt, questions = _seed(db)

    for index, question in enumerate(questions):
        clicked = "ABCD"[index % 4]
        save_answer(
            db,
            attempt.id,
            user.id,
            SaveAnswerRequest(question_id=question.id, selected_option=clicked, time_taken_seconds=5),
        )
        assert _stored(db, attempt.id, question.id) == clicked


def test_attempt_questions_match_the_originals_when_variation_is_off(db, monkeypatch):
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    user, attempt, questions = _seed(db, question_count=4)

    served = get_attempt_questions(db, attempt.id, user.id)

    assert [row["options_en"] for row in served] == [OPTIONS] * 4
    assert [row["text_en"] for row in served] == [q.text_en for q in questions]


def test_variation_on_keeps_shown_and_saved_options_in_step(db, monkeypatch):
    """With variation on, clicking the option that *shows* the correct text
    must store the original correct key."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.setattr(settings, "MCQ_VARIATION_ENABLED", True)
    user, attempt, questions = _seed(db)

    served = {row["id"]: row for row in get_attempt_questions(db, attempt.id, user.id)}
    checked = 0
    for question in questions:
        shown = served[question.id]
        if shown["text_en"] != question.text_en:
            continue  # wording was inverted; the correct key no longer applies
        shown_key = next(k for k, text in shown["options_en"].items() if text == "Bravo")
        save_answer(
            db,
            attempt.id,
            user.id,
            SaveAnswerRequest(question_id=question.id, selected_option=shown_key, time_taken_seconds=5),
        )
        assert _stored(db, attempt.id, question.id) == "B"
        checked += 1
    assert checked > 0
