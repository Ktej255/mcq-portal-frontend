"""Consent, sample storage, trend reads and backfill for the handwriting trend.

Everything here is scoped to one student (``user_id``); nothing aggregates
across students. Logs carry exception types and counts only, never image bytes.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.gs_lms.models import GsLmsAnswerSheetImage
from app.core.wellbeing.handwriting_features import (
    ALGORITHM_VERSION,
    HandwritingFeatures,
    extract_features,
)
from app.core.wellbeing.handwriting_trend import TrendSample, compute_trend
from app.core.wellbeing.models import HandwritingSample, WellbeingConsent

logger = logging.getLogger(__name__)

CONSENT_BACKFILL_MAX_IMAGES = 20
CONSENT_BACKFILL_MAX_SECONDS = 10.0


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_consent(db: Session, user_id: int) -> Optional[WellbeingConsent]:
    return db.query(WellbeingConsent).filter(WellbeingConsent.user_id == user_id).one_or_none()


def has_consent(db: Session, user_id: int) -> bool:
    row = get_consent(db, user_id)
    return bool(row and row.handwriting_insights)


def set_consent(db: Session, user_id: int, consent: bool) -> WellbeingConsent:
    """Turn the signal on or off. Turning it off deletes every sample."""
    row = get_consent(db, user_id)
    if row is None:
        row = WellbeingConsent(user_id=user_id, handwriting_insights=False)
        db.add(row)
    if consent and not row.handwriting_insights:
        row.handwriting_consented_at = _now()
    if not consent:
        row.handwriting_consented_at = None
        delete_samples(db, user_id, commit=False)
    row.handwriting_insights = consent
    db.commit()
    db.refresh(row)
    return row


def delete_samples(db: Session, user_id: int, *, commit: bool = True) -> int:
    n = (
        db.query(HandwritingSample)
        .filter(HandwritingSample.user_id == user_id)
        .delete(synchronize_session=False)
    )
    if commit:
        db.commit()
    return n


def safe_extract(data: bytes) -> Optional[HandwritingFeatures]:
    """Run the extractor; None on any failure (logs the exception type only)."""
    try:
        return extract_features(data)
    except Exception as exc:  # noqa: BLE001 - never let this affect an upload
        logger.warning("handwriting extraction skipped: %s", type(exc).__name__)
        return None


def upsert_sample(
    db: Session,
    *,
    user_id: int,
    answer_image_id: Optional[int],
    result: HandwritingFeatures,
    captured_at: datetime,
) -> HandwritingSample:
    """Insert or replace the sample for (image, algorithm version). No commit."""
    row = None
    if answer_image_id is not None:
        row = (
            db.query(HandwritingSample)
            .filter(
                HandwritingSample.answer_image_id == answer_image_id,
                HandwritingSample.algorithm_version == result.algorithm_version,
            )
            .one_or_none()
        )
    if row is None:
        row = HandwritingSample(
            user_id=user_id,
            answer_image_id=answer_image_id,
            algorithm_version=result.algorithm_version,
        )
        db.add(row)
    row.captured_at = captured_at
    row.quality = result.quality
    row.usable = result.usable
    row.features = result.features
    return row


def record_sample(
    db: Session,
    *,
    user_id: int,
    answer_image_id: Optional[int],
    result: Optional[HandwritingFeatures],
    captured_at: Optional[datetime] = None,
) -> bool:
    """Store one extraction result; swallows every error. True if saved."""
    if result is None:
        return False
    try:
        upsert_sample(
            db,
            user_id=user_id,
            answer_image_id=answer_image_id,
            result=result,
            captured_at=captured_at or _now(),
        )
        db.commit()
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("handwriting sample not saved: %s", type(exc).__name__)
        try:
            db.rollback()
        except Exception:  # noqa: BLE001
            pass
        return False


def backfill_user(
    db: Session,
    store: Any,
    user_id: int,
    *,
    limit: Optional[int] = None,
    max_seconds: Optional[float] = None,
    dry_run: bool = False,
) -> Dict[str, int]:
    """Extract from stored images that have no sample for the current algorithm.

    Newest images first; ``captured_at`` is the image's upload time. Counts only.
    """
    done = (
        db.query(HandwritingSample.answer_image_id)
        .filter(
            HandwritingSample.user_id == user_id,
            HandwritingSample.algorithm_version == ALGORITHM_VERSION,
            HandwritingSample.answer_image_id.isnot(None),
        )
        .subquery()
    )
    q = (
        db.query(GsLmsAnswerSheetImage)
        .filter(
            GsLmsAnswerSheetImage.student_id == user_id,
            GsLmsAnswerSheetImage.media_ref.isnot(None),
            ~GsLmsAnswerSheetImage.id.in_(db.query(done.c.answer_image_id)),
        )
        .order_by(GsLmsAnswerSheetImage.uploaded_at.desc(), GsLmsAnswerSheetImage.id.desc())
    )
    if limit:
        q = q.limit(limit)
    rows: List[GsLmsAnswerSheetImage] = q.all()
    counts = {"candidates": len(rows), "saved": 0, "failed": 0}
    if dry_run:
        return counts
    started = time.monotonic()
    for row in rows:
        if max_seconds is not None and time.monotonic() - started > max_seconds:
            break
        try:
            data = store.open(
                row.media_ref, requester_id=user_id, is_evaluator=False, owner_id=user_id
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("handwriting backfill: image unreadable: %s", type(exc).__name__)
            counts["failed"] += 1
            continue
        uploaded = row.uploaded_at
        if uploaded is not None and uploaded.tzinfo is not None:
            uploaded = uploaded.astimezone(timezone.utc).replace(tzinfo=None)
        if record_sample(
            db,
            user_id=user_id,
            answer_image_id=row.id,
            result=safe_extract(data),
            captured_at=uploaded,
        ):
            counts["saved"] += 1
        else:
            counts["failed"] += 1
    return counts


def trend_for_user(db: Session, user_id: int) -> Dict[str, Any]:
    rows = (
        db.query(HandwritingSample)
        .filter(HandwritingSample.user_id == user_id)
        .order_by(HandwritingSample.captured_at)
        .all()
    )
    return compute_trend(
        [
            TrendSample(
                captured_at=r.captured_at,
                features=r.features or {},
                usable=bool(r.usable),
                algorithm_version=r.algorithm_version,
            )
            for r in rows
        ]
    )
