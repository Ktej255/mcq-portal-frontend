"""Integration tests for Current Affairs Admin CMS API endpoints."""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.api.v1.admin import router as ca_admin_router
from app.core.current_affairs.ca_models import (
    CAItem,
    CAMcq,
    CAMainsQuestion,
    CAAuditLog,
)
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User


@pytest.fixture()
def ca_admin_client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        User.__table__,
        CAItem.__table__,
        CAMcq.__table__,
        CAMainsQuestion.__table__,
        CAAuditLog.__table__,
    ]
    Base.metadata.create_all(bind=engine, tables=tables)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    # Seed an admin and a student
    admin = User(
        id=1,
        google_uid="admin_sub",
        email="admin@upsc.test",
        full_name="Admin User",
        role=RoleEnum.ADMIN,
    )
    student = User(
        id=2,
        google_uid="student_sub",
        email="student@upsc.test",
        full_name="Student User",
        role=RoleEnum.STUDENT,
    )
    session.add_all([admin, student])
    session.commit()

    app = FastAPI()
    app.include_router(ca_admin_router, prefix="/api/v1/admin")
    app.dependency_overrides[get_db] = lambda: session

    # Default to admin caller
    app.dependency_overrides[get_current_user] = lambda: admin

    client = TestClient(app)
    try:
        yield client, app, session, admin, student
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine, tables=tables)


def test_ca_admin_rejects_unauthenticated_and_student(ca_admin_client):
    client, app, session, admin, student = ca_admin_client

    # 1. Unauthenticated -> 401
    del app.dependency_overrides[get_current_user]
    resp = client.get("/api/v1/admin/current-affairs/items")
    assert resp.status_code == 401

    # 2. Student caller -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: student
    resp = client.get("/api/v1/admin/current-affairs/items")
    assert resp.status_code == 403


def test_ca_admin_draft_creation_and_status_transitions(ca_admin_client):
    client, app, session, admin, student = ca_admin_client

    payload = {
        "title": "National Green Hydrogen Mission Updates",
        "publish_date": "2026-11-17",
        "subject": "environment",
        "secondary_subjects": ["economy"],
        "gs_paper": "GS3",
        "exam_relevance": "both",
        "source_authority": "official",
        "relevance_score": 4,
        "content_blocks": [{"type": "paragraph", "text": "Details on electrolysis targets."}],
        "mcqs": [
            {
                "question_text": "Which ministry steers the National Green Hydrogen Mission?",
                "question_type": "DIRECT_RECALL",
                "options": [
                    {"label": "A", "text": "Ministry of New and Renewable Energy"},
                    {"label": "B", "text": "Ministry of Power"},
                    {"label": "C", "text": "Ministry of Petroleum"},
                    {"label": "D", "text": "Ministry of Environment"},
                ],
                "correct_answer": "A",
                "explanation": "MNRE is the nodal ministry.",
            }
        ],
    }

    # 1. Create draft
    res = client.post("/api/v1/admin/current-affairs/items", json=payload)
    assert res.status_code == 201
    data = res.json()
    item_id = data["id"]

    # Verify created item starts in DRAFT in database
    created_item = session.query(CAItem).filter(CAItem.id == item_id).first()
    assert created_item is not None
    assert created_item.review_status == "DRAFT"
    assert created_item.title == payload["title"]

    # 2. Illegal direct transition: DRAFT -> PUBLISHED must return 409 Conflict
    res_illegal = client.patch(
        f"/api/v1/admin/current-affairs/items/{item_id}/status",
        json={"status": "PUBLISHED"},
    )
    assert res_illegal.status_code == 409
    assert "Invalid transition" in res_illegal.json()["detail"]

    # 3. Legal transition: DRAFT -> IN_REVIEW
    res_review = client.patch(
        f"/api/v1/admin/current-affairs/items/{item_id}/status",
        json={"status": "IN_REVIEW"},
    )
    assert res_review.status_code == 200
    assert res_review.json()["status"] == "IN_REVIEW"

    # 4. Legal transition: IN_REVIEW -> PUBLISHED
    res_publish = client.patch(
        f"/api/v1/admin/current-affairs/items/{item_id}/status",
        json={"status": "PUBLISHED"},
    )
    assert res_publish.status_code == 200
    assert res_publish.json()["status"] == "PUBLISHED"

    # 5. Legal transition: PUBLISHED -> ARCHIVED
    res_archive = client.patch(
        f"/api/v1/admin/current-affairs/items/{item_id}/status",
        json={"status": "ARCHIVED"},
    )
    assert res_archive.status_code == 200
    assert res_archive.json()["status"] == "ARCHIVED"

    # 6. ARCHIVED is terminal: ARCHIVED -> DRAFT must return 409
    res_archived_illegal = client.patch(
        f"/api/v1/admin/current-affairs/items/{item_id}/status",
        json={"status": "DRAFT"},
    )
    assert res_archived_illegal.status_code == 409
