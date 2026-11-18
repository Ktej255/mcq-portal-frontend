"""
Unit and API integration tests for CA Quick Test ("Test Anytime") endpoints.
"""

from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, User
from app.core.current_affairs.ca_models import CAItem, CAMcq


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    test_user = User(
        id=1,
        google_uid="learner_1",
        email="learner@upsc.test",
        full_name="Learner One",
        role=RoleEnum.STUDENT,
    )

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_quick_test_empty_when_no_published_items(client):
    res = client.get("/api/v1/current-affairs/quick-test?scope=today")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 0
    assert data["mcqs"] == []


def test_quick_test_requires_subject_param_when_scope_is_subject(client):
    res = client.get("/api/v1/current-affairs/quick-test?scope=subject")
    assert res.status_code == 422


def test_quick_test_submit_empty_rejected(client):
    res = client.post(
        "/api/v1/current-affairs/quick-test/submit",
        json={"question_ids": [], "answers": {}},
    )
    assert res.status_code == 422


def test_quick_test_scoring_and_not_persisted_contract(client, db_session):
    # Seed a published CA item with an MCQ
    item = CAItem(
        id=101,
        title="COP28 Climate Accord",
        subject="environment",
        gs_paper="GS3",
        exam_relevance="both",
        review_status="PUBLISHED",
        publish_date=date.today(),
        is_deleted=False,
    )
    db_session.add(item)
    db_session.flush()

    mcq = CAMcq(
        id=201,
        ca_item_id=101,
        question_text="What was the primary goal of COP28?",
        question_type="factual",
        options=[
            {"label": "A", "text": "Transition away from fossil fuels"},
            {"label": "B", "text": "Expand coal subsidies"},
            {"label": "C", "text": "Abolish renewable energy targets"},
            {"label": "D", "text": "Freeze all trade agreements"},
        ],
        correct_answer="A",
        explanation="COP28 established the historic consensus on transitioning away from fossil fuels.",
    )
    db_session.add(mcq)
    db_session.commit()

    # Fetch quiz
    get_res = client.get("/api/v1/current-affairs/quick-test?scope=today")
    assert get_res.status_code == 200
    quiz_data = get_res.json()
    assert quiz_data["total_count"] == 1
    assert quiz_data["mcqs"][0]["id"] == 201

    # Submit correct answer
    sub_res = client.post(
        "/api/v1/current-affairs/quick-test/submit",
        json={"question_ids": [201], "answers": {"201": "A"}},
    )
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["total_questions"] == 1
    assert sub_data["correct_count"] == 1
    assert sub_data["score"] == 100.0
    assert sub_data["persistence_status"] == "not_persisted"
    assert sub_data["attempt_id"] is None
    assert sub_data["attempts"][0]["is_correct"] is True

    # Submit wrong answer
    sub_wrong = client.post(
        "/api/v1/current-affairs/quick-test/submit",
        json={"question_ids": [201], "answers": {"201": "B"}},
    )
    assert sub_wrong.status_code == 200
    wrong_data = sub_wrong.json()
    assert wrong_data["correct_count"] == 0
    assert wrong_data["score"] == 0.0
    assert wrong_data["attempts"][0]["is_correct"] is False
