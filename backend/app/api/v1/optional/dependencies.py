"""Reusable authorization dependencies for Optional subject content."""

from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.optional.entitlement import EntitlementProvider, get_entitlement_provider
from app.core.optional.models import OptionalSubject
from app.core.optional.student_models import AnswerAttempt, RecallSession, VideoSegment
from app.db.session import get_db
from app.models.domain import User


def get_entitlement_provider_dep() -> EntitlementProvider:
    """Entitlement provider dependency; kept stable for dependency overrides."""
    return get_entitlement_provider()


def _subject_or_404(db: Session, slug: str) -> OptionalSubject:
    subject = db.query(OptionalSubject).filter(OptionalSubject.slug == slug).one_or_none()
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Optional subject '{slug}' not found",
        )
    return subject


def _authorize_subject(
    *,
    subject: OptionalSubject,
    provider: EntitlementProvider,
    current_user: User,
    db: Session,
) -> OptionalSubject:
    decision = provider.check_access(
        student_id=current_user.id,
        external_user_id=getattr(current_user, "google_uid", None),
        subject=subject,
        db=db,
    )
    if not decision.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "reason": decision.reason,
                "upgrade_path": decision.upgrade_path,
            },
        )
    return subject


def require_optional_subject_access(
    request: Request,
    db: Session = Depends(get_db),
    provider: EntitlementProvider = Depends(get_entitlement_provider_dep),
    current_user: User = Depends(get_current_user),
) -> Optional[OptionalSubject]:
    """Authorize slug-scoped content or an owned answer-report request."""
    slug = request.path_params.get("slug")
    if slug is not None:
        return _authorize_subject(
            subject=_subject_or_404(db, str(slug)),
            provider=provider,
            current_user=current_user,
            db=db,
        )

    # The answer report route has no subject slug. Resolve its subject through
    # the requesting student's own attempt so premium reports cannot bypass the
    # shared subject entitlement dependency. Unknown/foreign attempts remain
    # invisible to the handler and retain its normal 404 response.
    attempt_id = request.path_params.get("attempt_id")
    if attempt_id is None:
        return None
    try:
        attempt_id_int = int(attempt_id)
    except (TypeError, ValueError):
        return None
    attempt_query = db.query(AnswerAttempt).filter(
        AnswerAttempt.id == attempt_id_int,
        AnswerAttempt.student_id == current_user.id,
    )
    if hasattr(AnswerAttempt, "is_deleted"):
        attempt_query = attempt_query.filter(AnswerAttempt.is_deleted.is_(False))
    attempt = attempt_query.one_or_none()
    if attempt is None:
        return None
    subject = (
        db.query(OptionalSubject)
        .filter(OptionalSubject.id == attempt.subject_id)
        .one_or_none()
    )
    if subject is None:
        return None
    return _authorize_subject(
        subject=subject,
        provider=provider,
        current_user=current_user,
        db=db,
    )


def require_optional_recall_access(
    request: Request,
    db: Session = Depends(get_db),
    provider: EntitlementProvider = Depends(get_entitlement_provider_dep),
    current_user: User = Depends(get_current_user),
) -> Optional[OptionalSubject]:
    """Authorize slug-, segment-, and owned-session-scoped recall requests.

    Unknown segments and sessions are left to the route's existing 404 handling.
    Session lookup is owner-scoped so this dependency does not reveal another
    student's resource before the route applies its normal ownership response.
    """
    subject: OptionalSubject | None = None
    slug = request.path_params.get("slug")
    segment_id = request.path_params.get("segment_id")
    session_id = request.path_params.get("session_id")

    if slug is not None:
        subject = _subject_or_404(db, str(slug))
    elif segment_id is not None:
        segment = (
            db.query(VideoSegment)
            .filter(VideoSegment.id == int(segment_id))
            .one_or_none()
        )
        if segment is None:
            return None
        subject = db.query(OptionalSubject).filter(OptionalSubject.id == segment.subject_id).one_or_none()
    elif session_id is not None:
        recall_session = (
            db.query(RecallSession)
            .filter(
                RecallSession.id == int(session_id),
                RecallSession.student_id == current_user.id,
            )
            .one_or_none()
        )
        if recall_session is None:
            return None
        segment = (
            db.query(VideoSegment)
            .filter(VideoSegment.id == recall_session.video_segment_id)
            .one_or_none()
        )
        if segment is None:
            return None
        subject = db.query(OptionalSubject).filter(OptionalSubject.id == segment.subject_id).one_or_none()

    if subject is None:
        return None
    return _authorize_subject(
        subject=subject,
        provider=provider,
        current_user=current_user,
        db=db,
    )
