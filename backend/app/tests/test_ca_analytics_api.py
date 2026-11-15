"""API regressions for the Current Affairs analytics endpoint.

Coverage must never exceed the published catalogue: a stored completion for a
draft or soft-deleted item used to count toward "completed" and overall
coverage while the denominator counted published items only, which could
report more than 100% coverage.
"""
from __future__ import annotations

from datetime import date, datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.current_affairs.ca_models import CAItem, CAStudentProgress
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
        tables=[CAItem.__table__, CAStudentProgress.__table__],
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
    title: str = "Housing and the urban land market",
    subject: str = "geography",
    publish_date: date = date(2026, 1, 5),
    review_status: str = "PUBLISHED",
) -> int:
    db = session_factory()
    try:
        item = CAItem(
            title=title,
            publish_date=publish_date,
            subject=subject,
            gs_paper="GS1",
            exam_relevance="high",
            content_blocks=[{"type": "paragraph", "text": "Explainer."}],
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


def _complete(session_factory, item_id: int) -> None:
    db = session_factory()
    try:
        db.add(
            CAStudentProgress(
                student_id=STUDENT_ID,
                ca_item_id=item_id,
                current_step=4,
                completed_steps=[1, 2, 3, 4],
                is_completed=True,
                completed_at=datetime.now(timezone.utc),
            )
        )
        db.commit()
    finally:
        db.close()


def _subject_row(body: dict, subject: str) -> dict:
    return next(row for row in body["coverage_by_subject"] if row["subject"] == subject)


def test_analytics_counts_only_completions_of_published_items(ca_client):
    client, session_factory = ca_client
    published = _item(session_factory)
    draft = _item(session_factory, title="Draft", review_status="DRAFT")
    deleted = _item(session_factory, title="Deleted")
    db = session_factory()
    try:
        item = db.query(CAItem).filter(CAItem.id == deleted).one()
        item.is_deleted = True
        db.commit()
    finally:
        db.close()
    for item_id in (published, draft, deleted):
        _complete(session_factory, item_id)

    response = client.get("/api/v1/current-affairs/analytics")
    assert response.status_code == 200
    body = response.json()
    assert body["total_items_available"] == 1
    assert body["total_items_completed"] == 1
    assert body["overall_coverage_percent"] == 100.0

    geography = _subject_row(body, "geography")
    assert geography["total_available"] == 1
    assert geography["completed"] == 1
    assert geography["percentage"] == 100.0

    economy = _subject_row(body, "economy")
    assert economy["total_available"] == 0
    assert economy["completed"] == 0
    assert economy["percentage"] == 0


def test_analytics_reports_zero_without_published_items(ca_client):
    client, session_factory = ca_client
    draft = _item(session_factory, review_status="DRAFT")
    _complete(session_factory, draft)

    response = client.get("/api/v1/current-affairs/analytics")
    assert response.status_code == 200
    body = response.json()
    assert body["total_items_available"] == 0
    assert body["total_items_completed"] == 0
    assert body["overall_coverage_percent"] == 0.0
    assert _subject_row(body, "geography")["completed"] == 0
