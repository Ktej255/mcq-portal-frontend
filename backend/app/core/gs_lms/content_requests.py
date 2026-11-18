"""Record study searches that found nothing good, for the content team.

``record_content_request`` counts a request per normalised query and, through
``GsLmsContentRequestStudent``, per distinct student, without keeping the raw
text of each student's query (only the latest sample, trimmed to 200 chars).

``normalize_query`` lowercases, strips punctuation and stopwords, stems, then
sorts and de-duplicates the words, so "Plassey battle" and "battle of Plassey"
are one request.

Flushes but never commits; the caller owns the transaction.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.gs_lms.models import GsLmsContentRequest, GsLmsContentRequestStudent
from app.core.gs_lms.study_search import SEARCH_GOOD_SCORE, SearchHit
from app.core.gs_lms.understanding import tokenize

_MAX = 200


def normalize_query(query: str | None) -> str:
    """Sorted unique meaningful stems joined by a space ('' when none)."""
    return " ".join(sorted(tokenize(query)))[:_MAX]


def needs_content(hits: list[SearchHit]) -> bool:
    """True when there is no hit, or the best one is below SEARCH_GOOD_SCORE."""
    return not hits or max(h.score for h in hits) < SEARCH_GOOD_SCORE


def record_content_request(
    db: Session, student_id: int, query: str, subject_slug: Optional[str] = None
) -> Optional[GsLmsContentRequest]:
    """Count one request for ``query`` by ``student_id``; None if the query has
    no meaningful words."""
    normalized = normalize_query(query)
    if not normalized:
        return None
    sample = " ".join((query or "").split())[:_MAX]
    now = datetime.now(timezone.utc)

    row = (
        db.query(GsLmsContentRequest)
        .filter(GsLmsContentRequest.normalized_query == normalized)
        .one_or_none()
    )
    if row is None:
        row = GsLmsContentRequest(
            normalized_query=normalized, sample_query=sample, subject_slug=subject_slug,
            request_count=0, distinct_students=0, first_requested_at=now, last_requested_at=now,
        )
        try:
            with db.begin_nested():
                db.add(row)
                db.flush()
        except IntegrityError:  # another request created it first
            row = (
                db.query(GsLmsContentRequest)
                .filter(GsLmsContentRequest.normalized_query == normalized)
                .one()
            )

    row.request_count = (row.request_count or 0) + 1
    row.sample_query = sample
    row.last_requested_at = now
    if row.subject_slug is None and subject_slug:
        row.subject_slug = subject_slug

    known = (
        db.query(GsLmsContentRequestStudent)
        .filter(
            GsLmsContentRequestStudent.request_id == row.id,
            GsLmsContentRequestStudent.student_id == student_id,
        )
        .first()
    )
    if known is None:
        db.add(GsLmsContentRequestStudent(request_id=row.id, student_id=student_id))
        row.distinct_students = (row.distinct_students or 0) + 1
    db.flush()
    return row


def record_if_unanswered(
    db: Session, student_id: int, query: str, hits: list[SearchHit], subject_slug: Optional[str] = None
) -> Optional[GsLmsContentRequest]:
    """Record the request when ``hits`` do not answer it well."""
    if not needs_content(hits):
        return None
    return record_content_request(db, student_id, query, subject_slug)


__all__ = ["normalize_query", "needs_content", "record_content_request", "record_if_unanswered"]
