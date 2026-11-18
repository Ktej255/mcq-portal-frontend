"""Tests for bulk question ingestion idempotency and duplicate prevention."""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models.domain import Subject, Topic, Test, Question, ExecutionTrace, RoleEnum, User
from app.core.pedagogy.ingestion_engine import MCQIngestionEngine


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        Subject.__table__,
        Topic.__table__,
        Test.__table__,
        Question.__table__,
        ExecutionTrace.__table__,
        User.__table__,
    ]
    Base.metadata.create_all(bind=engine, tables=tables)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        # Seed test subject, topic, test
        subject = Subject(id=1, name="Geography")
        session.add(subject)
        topic = Topic(id=1, name="Physical Geography", subject_id=1)
        session.add(topic)
        test = Test(id=1, title="Prelims 2026 Test 1", subject_id=1, duration_minutes=60)
        session.add(test)
        session.commit()
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=tables)


def test_ingest_batch_creates_questions(db_session):
    raw_questions = [
        {
            "test_id": 1,
            "topic_id": 1,
            "text_en": "Which of the following is the highest peak in the Western Ghats?",
            "options_en": {
                "A": "Anamudi",
                "B": "Doddabetta",
                "C": "Guru Shikhar",
                "D": "Mahendragiri",
            },
            "correct_option": "A",
            "difficulty": "EASY",
            "explanation_en": "Anamudi is the highest peak in the Western Ghats and South India at 2,695m.",
        }
    ]

    result = MCQIngestionEngine.ingest_batch(db_session, test_id=1, questions=raw_questions)
    db_session.commit()

    assert len(result) == 1
    assert result[0].id is not None
    assert result[0].content_hash is not None

    count = db_session.query(Question).filter(Question.test_id == 1).count()
    assert count == 1


def test_ingest_batch_is_idempotent_no_duplicates(db_session):
    raw_questions = [
        {
            "test_id": 1,
            "topic_id": 1,
            "text_en": "Consider the following statements regarding El Nino:\n1. It leads to warming of the central and eastern tropical Pacific Ocean.\n2. It generally suppresses the Indian monsoon rainfall.",
            "options_en": {
                "A": "1 only",
                "B": "2 only",
                "C": "Both 1 and 2",
                "D": "Neither 1 nor 2",
            },
            "correct_option": "C",
            "difficulty": "MEDIUM",
            "explanation_en": "Both statements are correct regarding El Nino effects.",
        }
    ]

    # Ingest once
    result_1 = MCQIngestionEngine.ingest_batch(db_session, test_id=1, questions=raw_questions)
    db_session.commit()
    assert len(result_1) == 1
    first_id = result_1[0].id

    # Ingest the exact same questions again
    result_2 = MCQIngestionEngine.ingest_batch(db_session, test_id=1, questions=raw_questions)
    db_session.commit()
    assert len(result_2) == 1
    assert result_2[0].id == first_id

    # Total questions in DB must strictly remain 1 (no duplicate rows created)
    total_count = db_session.query(Question).filter(Question.test_id == 1).count()
    assert total_count == 1
