"""Shared dependencies for the GS LMS API routes.

Provides subject resolution from the `subject_slug` path parameter so that
all sub-routers can resolve the target subject from the URL.

Requirements traced: 9.1, 9.2
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.gs.models import GsSubject
from app.core.gs_lms.progression import leaf_lock
from app.models.domain import User
from app.core.gs_lms.beta_scope import (
    BETA_LOCKED_MESSAGE,
    beta_scope_enabled,
    compute_loop_ready_ids,
)


def ensure_beta_topic(db: Session, subject_id: int, node_id: int) -> None:
    """Reject entry to a topic outside the paid-beta scope.

    Returns 409 (not 404) because the topic exists and is visible on the
    syllabus map; it simply is not open for learning yet. The message is
    learner-facing and states the reason without blaming the learner.
    Operators are never routed through this helper, so coverage work is not
    blocked by the scope.
    """
    if not beta_scope_enabled():
        return
    if node_id in compute_loop_ready_ids(db, subject_id):
        return
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=BETA_LOCKED_MESSAGE,
    )


def resolve_subject(
    subject_slug: str,
    db: Session = Depends(get_db),
) -> GsSubject:
    """Look up a GS subject by its URL slug.

    Raises HTTP 404 if:
    - The slug doesn't exist in the gs_subjects table
    - The slug isn't a valid GS subject

    Currently only "geography" is a valid slug. Others will 404 until
    content is seeded for them.
    """
    subject = (
        db.query(GsSubject)
        .filter(GsSubject.slug == subject_slug)
        .one_or_none()
    )
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject '{subject_slug}' not found",
        )
    return subject


def ensure_leaf_unlocked(db: Session, user: User, subject: GsSubject, node_id: int) -> None:
    """Raise HTTP 423 (Locked) when the topic is locked for this student.

    A topic is locked until the previous topic of the subject is mastered (and
    any due review checkpoint is passed). Admins, topics outside the leaf order
    and GS_LMS_ENFORCE_ORDER=False are never locked. See
    ``app.core.gs_lms.progression``.
    """
    reason = leaf_lock(db, user, subject.id, node_id)
    if reason is not None:
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail=reason)
