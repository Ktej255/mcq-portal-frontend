"""API-level regressions for the Current Affairs funnel endpoints.

The funnel state and complete-step endpoints already refused unpublished
items; the MCQ list, MCQ submit, and Mains prompt endpoints did not, so an
unpublished or deleted item could still be read and scored by ID. These tests
pin the published-only gate on every learner endpoint.
"""
from __future__ import annotations

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.current_affairs.ca_models import (
    CAItem,
    CAMainsQuestion,
    CAMcq,
    CAStudentProgress,
)
from app.db.session import Base, get_db
from app.main import app

STUDENT_ID = 7


class _FakeStudent:
    id = STUDENT_ID
    email = "learner@upsc.local"


@pytest.fixture()
def ca_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        engine,
        tables=[
            CAItem.__table__,
            CAMcq.__table__,
            CAMainsQuestion.__table__,
            CAStudentProgress.__table__,
        ],
    )
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def _override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = lambda: _FakeStudent()
    try:
        with TestClient(app) as client:
            yield client, session_factory
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def _item(
    session_factory,
    *,
    review_status: str = "PUBLISHED",
    video_url: str | None = None,
) -> int:
    db = session_factory()
    try:
        item = CAItem(
            title="Budget 2026 and the fiscal space",
            publish_date=date(2026, 2, 1),
            subject="Economy",
            gs_paper="GS3",
            exam_relevance="high",
            video_url=video_url,
            content_blocks=[{"type": "paragraph", "text": "Budget explainer."}],
            source_authority="standard",
            relevance_score=4,
            review_status=review_status,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item.id
    finally:
        db.close()


def _mcqs(session_factory, item_id: int, count: int = 2) -> list[int]:
    db = session_factory()
    try:
        created = []
        for index in range(1, count + 1):
            mcq = CAMcq(
                ca_item_id=item_id,
                question_text=f"Question {index}?",
                question_type="conceptual",
                options=[
                    {"label": "A", "text": "First"},
                    {"label": "B", "text": "Second"},
                ],
                correct_answer="A",
                explanation="Because A.",
                display_order=index,
            )
            db.add(mcq)
            created.append(mcq)
        db.commit()
        return [mcq.id for mcq in created]
    finally:
        db.close()


def _mains(session_factory, item_id: int) -> int:
    db = session_factory()
    try:
        question = CAMainsQuestion(
            ca_item_id=item_id,
            question_text="Discuss the fiscal implications.",
            gs_paper="GS3",
            marks=10,
            word_limit=150,
            display_order=1,
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        return question.id
    finally:
        db.close()


def test_unpublished_item_hides_every_learner_endpoint(ca_client):
    client, session_factory = ca_client
    item_id = _item(session_factory, review_status="DRAFT")
    _mcqs(session_factory, item_id)
    _mains(session_factory, item_id)

    base = f"/api/v1/current-affairs/items/{item_id}"
    assert client.get(f"{base}/funnel/state").status_code == 404
    assert client.get(f"{base}/mcqs").status_code == 404
    assert client.get(f"{base}/mains").status_code == 404
    assert client.post(f"{base}/mcqs/submit", json={"answers": {}}).status_code == 404

    db = session_factory()
    try:
        assert db.query(CAStudentProgress).count() == 0
    finally:
        db.close()


def test_deleted_item_is_not_scored_or_read(ca_client):
    client, session_factory = ca_client
    item_id = _item(session_factory)
    _mcqs(session_factory, item_id)

    db = session_factory()
    try:
        item = db.query(CAItem).filter(CAItem.id == item_id).one()
        item.is_deleted = True
        db.commit()
    finally:
        db.close()

    base = f"/api/v1/current-affairs/items/{item_id}"
    assert client.get(f"{base}/mcqs").status_code == 404
    assert client.post(
        f"{base}/mcqs/submit",
        json={"answers": {"1": "A"}},
    ).status_code == 404


def test_published_item_scores_every_answer(ca_client):
    client, session_factory = ca_client
    item_id = _item(session_factory)
    mcq_ids = _mcqs(session_factory, item_id)

    listed = client.get(f"/api/v1/current-affairs/items/{item_id}/mcqs")
    assert listed.status_code == 200
    assert [mcq["id"] for mcq in listed.json()] == mcq_ids

    submitted = client.post(
        f"/api/v1/current-affairs/items/{item_id}/mcqs/submit",
        json={"answers": {str(mcq_id): "A" for mcq_id in mcq_ids}},
    )
    assert submitted.status_code == 200
    body = submitted.json()
    assert body["total_questions"] == 2
    assert body["correct_count"] == 2
    assert body["score"] == 100.0
    assert all(attempt["is_correct"] for attempt in body["attempts"])


def test_submit_requires_one_answer_per_current_mcq(ca_client):
    client, session_factory = ca_client
    item_id = _item(session_factory)
    mcq_ids = _mcqs(session_factory, item_id)

    missing = client.post(
        f"/api/v1/current-affairs/items/{item_id}/mcqs/submit",
        json={"answers": {str(mcq_ids[0]): "A"}},
    )
    assert missing.status_code == 422

    blank = client.post(
        f"/api/v1/current-affairs/items/{item_id}/mcqs/submit",
        json={"answers": {str(mcq_id): " " for mcq_id in mcq_ids}},
    )
    assert blank.status_code == 422


def test_funnel_state_skips_watch_without_a_video(ca_client):
    client, session_factory = ca_client
    item_id = _item(session_factory)

    state = client.get(f"/api/v1/current-affairs/items/{item_id}/funnel/state")
    assert state.status_code == 200
    body = state.json()
    assert body["video_available"] is False
    assert body["current_step"] == 2
    assert body["completed_steps"] == [1]


def test_complete_step_refuses_to_skip_ahead(ca_client):
    client, session_factory = ca_client
    item_id = _item(session_factory)

    skipped = client.post(
        f"/api/v1/current-affairs/items/{item_id}/funnel/complete-step",
        json={"step": 4},
    )
    assert skipped.status_code == 409

    read = client.post(
        f"/api/v1/current-affairs/items/{item_id}/funnel/complete-step",
        json={"step": 2},
    )
    assert read.status_code == 200
    assert read.json()["current_step"] == 3
