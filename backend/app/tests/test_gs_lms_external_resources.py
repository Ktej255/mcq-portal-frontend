"""Hermetic subject-scope and review-gate coverage for GS resources."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.funnel_models import GsLmsExternalResource
from app.core.gs_lms.models import GsLmsNodeTypeEnum, GsLmsSyllabusNode
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, User


@pytest.fixture
def resources_client():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        table
        for name, table in Base.metadata.tables.items()
        if name
        in {
            "institutions",
            "users",
            "gs_subjects",
            "gs_day_lessons",
            "gs_lms_syllabus_nodes",
            "gs_lms_external_resources",
        }
    ]
    Base.metadata.create_all(engine, tables=tables)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = TestSession()
    try:
        db.add(User(id=1, google_uid="resource-student", email="resource@test.local", full_name="Resource Student", role=RoleEnum.STUDENT))
        db.add_all(
            [
                GsSubject(id=1, slug="geography", name="GS Geography", display_order=1),
                GsSubject(id=2, slug="history", name="GS History", display_order=2),
            ]
        )
        db.add_all(
            [
                GsLmsSyllabusNode(id=100, subject_id=1, title="Geography Topic", node_type=GsLmsNodeTypeEnum.LEAF_TOPIC, weight=1, display_order=1, review_status=GsReviewStatusEnum.REVIEWED),
                GsLmsSyllabusNode(id=200, subject_id=2, title="History Topic", node_type=GsLmsNodeTypeEnum.LEAF_TOPIC, weight=1, display_order=1, review_status=GsReviewStatusEnum.REVIEWED),
            ]
        )
        db.add_all(
            [
                GsLmsExternalResource(
                    id=resource_id,
                    syllabus_node_id=100,
                    section_label="BASIC",
                    title=f"Geography Resource {resource_id}",
                    source_name="Test Source",
                    url=f"https://example.test/resource/{resource_id}",
                    relevance_description="Test relevance",
                    display_order=resource_id,
                    review_status=status,
                )
                for resource_id, status in [
                    (1, "REVIEWED"),
                    (2, "REVIEWED"),
                    (3, "REVIEWED"),
                    (4, "REVIEWED"),
                    (5, "REVIEWED"),
                    (6, "REVIEWED"),
                    (7, "DRAFT"),
                ]
            ]
        )
        db.add(
            GsLmsExternalResource(
                id=8,
                syllabus_node_id=200,
                section_label="BASIC",
                title="History Resource",
                source_name="History Source",
                url="https://example.test/history",
                relevance_description=None,
                display_order=1,
                review_status="REVIEWED",
            )
        )
        db.commit()
    finally:
        db.close()

    def override_get_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    class FakeUser:
        id = 1
        email = "resource@test.local"
        google_uid = "resource-student"
        role = RoleEnum.STUDENT

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: FakeUser()
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        engine.dispose()


def test_external_resources_are_reviewed_ordered_and_limited(resources_client):
    response = resources_client.get(
        "/api/v1/gs-lms/geography/topics/100/external-resources"
    )

    assert response.status_code == 200
    payload = response.json()
    assert [item["id"] for item in payload] == [1, 2, 3, 4, 5]
    assert all(item["section_label"] == "BASIC" for item in payload)
    assert all("Draft" not in item["title"] for item in payload)


def test_external_resources_reject_node_from_another_subject(resources_client):
    response = resources_client.get(
        "/api/v1/gs-lms/geography/topics/200/external-resources"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Topic not found"
