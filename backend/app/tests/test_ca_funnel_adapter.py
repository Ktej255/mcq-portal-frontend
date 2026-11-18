"""Hermetic regressions for the Current Affairs per-item funnel adapter."""
from datetime import date, datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.current_affairs.ca_funnel_adapter import (
    complete_ca_funnel_step,
    get_ca_funnel_state,
)
from app.core.current_affairs.ca_models import CAItem, CAStudentProgress
from app.db.session import Base


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        engine,
        tables=[CAItem.__table__, CAStudentProgress.__table__],
    )
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def _item(db: Session, *, video_url: str | None = None) -> CAItem:
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
        review_status="REVIEWED",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _saved_progress(
    db: Session,
    *,
    item_id: int,
    current_step: int,
    completed_steps: list[int],
) -> None:
    now = datetime.now(timezone.utc)
    db.add(
        CAStudentProgress(
            student_id=1,
            ca_item_id=item_id,
            current_step=current_step,
            completed_steps=completed_steps,
            is_completed=False,
            started_at=now,
            last_activity_at=now,
        )
    )
    db.commit()


def test_item_without_video_starts_at_read_with_watch_skipped(db: Session):
    item = _item(db, video_url=None)

    state = get_ca_funnel_state(db, student_id=1, item_id=item.id)

    assert state.video_available is False
    assert state.current_step == 2
    assert 1 in state.completed_steps
    assert state.started_at is None


def test_item_with_video_starts_at_watch(db: Session):
    item = _item(db, video_url="https://example.com/lesson.mp4")

    state = get_ca_funnel_state(db, student_id=1, item_id=item.id)

    assert state.video_available is True
    assert state.current_step == 1
    assert state.completed_steps == frozenset()


def test_saved_watch_step_recovers_when_video_is_removed(db: Session):
    item = _item(db, video_url=None)
    _saved_progress(db, item_id=item.id, current_step=1, completed_steps=[])

    state = get_ca_funnel_state(db, student_id=1, item_id=item.id)

    assert state.video_available is False
    assert state.current_step == 2
    assert 1 in state.completed_steps

    # Completing Read must advance to Discussion and persist the skipped
    # Watch step, so the learner is never stuck on a blank screen.
    advanced = complete_ca_funnel_step(db, student_id=1, item_id=item.id, step=2)

    assert advanced.current_step == 3
    assert {1, 2}.issubset(advanced.completed_steps)
    saved = (
        db.query(CAStudentProgress)
        .filter(CAStudentProgress.ca_item_id == item.id)
        .one()
    )
    assert saved.completed_steps == [1, 2]


def test_saved_watch_step_is_kept_while_video_exists(db: Session):
    item = _item(db, video_url="https://example.com/lesson.mp4")
    _saved_progress(db, item_id=item.id, current_step=1, completed_steps=[])

    state = get_ca_funnel_state(db, student_id=1, item_id=item.id)

    assert state.video_available is True
    assert state.current_step == 1
    assert state.completed_steps == frozenset()
