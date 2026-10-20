"""CA Knowledge Graph endpoint: published items only, with causality and
thread edges, and the learner's completion state."""

from __future__ import annotations

from datetime import date

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Register every model on Base.metadata before create_all.
import app.main  # noqa: F401
from app.api.dependencies import get_current_user
from app.api.v1.current_affairs import router as ca_router
from app.core.current_affairs.ca_models import (
    CACausalityLink,
    CAItem,
    CAStudentProgress,
    CAThread,
    CAThreadItem,
)
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User


def _item(title: str, day: int, status: str = "PUBLISHED") -> CAItem:
    return CAItem(
        title=title,
        publish_date=date(2026, 10, day),
        subject="geography",
        gs_paper="GS1",
        exam_relevance="both",
        content_blocks=[],
        review_status=status,
        relevance_score=4,
    )


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    with SessionLocal() as db:
        student = User(google_uid="uid-1", email="s@example.com", role=RoleEnum.STUDENT)
        monsoon, drought, policy = _item("Weak monsoon", 1), _item("Drought in Marathwada", 2), _item("Relief package", 3)
        draft = _item("Unreviewed draft", 4, status="DRAFT")
        db.add_all([student, monsoon, drought, policy, draft])
        db.flush()
        thread = CAThread(title="Monsoon 2026", primary_subject="geography", start_date=date(2026, 10, 1))
        db.add(thread)
        db.flush()
        db.add_all([
            CAThreadItem(thread_id=thread.id, item_id=monsoon.id, sequence_order=1),
            CAThreadItem(thread_id=thread.id, item_id=drought.id, sequence_order=2),
            CACausalityLink(source_item_id=drought.id, target_item_id=policy.id, impact_type="policy response"),
            CACausalityLink(source_item_id=drought.id, target_item_id=draft.id, impact_type="hidden"),
            CAStudentProgress(student_id=student.id, ca_item_id=monsoon.id, is_completed=True),
        ])
        db.commit()
        student_id = student.id
        ids = {"monsoon": monsoon.id, "drought": drought.id, "policy": policy.id, "draft": draft.id}

    def _db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app = FastAPI()
    app.include_router(ca_router, prefix="/current-affairs")
    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = lambda: User(id=student_id, email="s@example.com", role=RoleEnum.STUDENT)
    return TestClient(app), ids


def test_graph_returns_published_items_and_links(client):
    http, ids = client
    resp = http.get("/current-affairs/graph")
    assert resp.status_code == 200
    body = resp.json()

    node_ids = {n["id"] for n in body["nodes"]}
    assert node_ids == {f"ca-{ids['monsoon']}", f"ca-{ids['drought']}", f"ca-{ids['policy']}"}

    edges = {(e["edge_type"], e["source"], e["target"]) for e in body["edges"]}
    assert ("thread", f"ca-{ids['monsoon']}", f"ca-{ids['drought']}") in edges
    assert ("causality", f"ca-{ids['drought']}", f"ca-{ids['policy']}") in edges
    # The link to the unpublished draft must not leak.
    assert all(f"ca-{ids['draft']}" not in (s, t) for _, s, t in edges)

    completed = {n["id"]: n["is_completed"] for n in body["nodes"]}
    assert completed[f"ca-{ids['monsoon']}"] is True
    assert completed[f"ca-{ids['policy']}"] is False


def test_graph_date_filter(client):
    http, ids = client
    body = http.get("/current-affairs/graph", params={"date_from": "2026-10-02"}).json()
    assert {n["id"] for n in body["nodes"]} == {f"ca-{ids['drought']}", f"ca-{ids['policy']}"}


def test_graph_requires_login(client):
    http, _ = client
    http.app.dependency_overrides.pop(get_current_user)
    assert http.get("/current-affairs/graph").status_code == 401
