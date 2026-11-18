"""Pick the most suitable ready-made version of a concept for a student.

A concept can hold several REVIEWED ``GsLmsConceptVersion`` rows (level x style
x source). ``rank_versions`` orders them best-first and ``pick_version``
returns the first. Only REVIEWED versions are ever considered. The result is
deterministic: the same student state and the same versions always give the
same order.

Each version gets a sort key ``(level_rank, style_rank, source_rank,
display_order, id)``; lower is better and the fields are compared in that
order, so level matters most, then style, then source. Ties fall to
``display_order`` and finally ``id``.

Level preference (first = best)
    * A student who has attempted the concept at least 2 times (see
      ``GsLmsConceptMastery.attempts``) and has not PASSED it is struggling:
      BASIC, STANDARD, ADVANCED.
    * Otherwise: the profile's ``preferred_level`` (if set), then STANDARD,
      then BASIC, then ADVANCED.

Style preference
    The profile's ``preferred_style`` (if set), then TEXT, VISUAL, STORY, VIDEO.

Source preference, by the profile's ``study_path``
    * NCERT_ONLY: NCERT, ORIGINAL, REFERENCE_BOOK, COACHING.
    * REFERENCE_BOOKS: REFERENCE_BOOK first, but only when the concept has a
      book ref to a chapter of one of the student's books (``book_ids``);
      without such a ref the default order below applies.
    * COACHING: COACHING, ORIGINAL, NCERT, REFERENCE_BOOK.
    * MIXED, or no profile / no study_path: ORIGINAL, NCERT, COACHING,
      REFERENCE_BOOK.

A student with no profile and no attempts therefore gets the STANDARD TEXT
ORIGINAL version when it exists, else the nearest by the rules above.

These functions only read; they never write or commit.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum
from app.core.gs_lms.models import (
    GsLmsBookChapter,
    GsLmsConceptBookRef,
    GsLmsConceptVersion,
    GsLmsLearnerProfile,
    GsLmsStudyPathEnum,
    GsLmsVersionLevelEnum as Level,
    GsLmsVersionSourceEnum as Source,
    GsLmsVersionStyleEnum as Style,
)
from app.core.gs_lms.student_models import GsLmsConceptMastery, GsLmsConceptMasteryStatusEnum

# A student with this many attempts and no pass on a concept gets BASIC first.
STRUGGLING_ATTEMPTS = 2

_DEFAULT_STYLES = [Style.TEXT, Style.VISUAL, Style.STORY, Style.VIDEO]
_DEFAULT_SOURCES = [Source.ORIGINAL, Source.NCERT, Source.COACHING, Source.REFERENCE_BOOK]


def _front(preferred, defaults):
    """``defaults`` with ``preferred`` (if any) moved to the front, no duplicates."""
    order = [preferred] if preferred is not None else []
    order.extend(d for d in defaults if d != preferred)
    return order


def is_struggling(db: Session, student_id: int, concept_id: int) -> bool:
    """True when the student has >= 2 attempts on the concept and has not passed it."""
    row = (
        db.query(GsLmsConceptMastery)
        .filter(
            GsLmsConceptMastery.student_id == student_id,
            GsLmsConceptMastery.concept_id == concept_id,
        )
        .one_or_none()
    )
    return (
        row is not None
        and (row.attempts or 0) >= STRUGGLING_ATTEMPTS
        and row.status != GsLmsConceptMasteryStatusEnum.PASSED
    )


def concept_in_student_books(db: Session, concept_id: int, book_ids: list[int]) -> bool:
    """True when the concept has a book ref to a chapter of one of ``book_ids``."""
    if not book_ids:
        return False
    return (
        db.query(GsLmsConceptBookRef.concept_id)
        .join(GsLmsBookChapter, GsLmsBookChapter.id == GsLmsConceptBookRef.chapter_id)
        .filter(
            GsLmsConceptBookRef.concept_id == concept_id,
            GsLmsBookChapter.book_id.in_(book_ids),
        )
        .first()
        is not None
    )


def level_order(preferred: Optional[Level], struggling: bool) -> list[Level]:
    if struggling:
        return [Level.BASIC, Level.STANDARD, Level.ADVANCED]
    return _front(preferred, [Level.STANDARD, Level.BASIC, Level.ADVANCED])


def style_order(preferred: Optional[Style]) -> list[Style]:
    return _front(preferred, _DEFAULT_STYLES)


def source_order(study_path: Optional[GsLmsStudyPathEnum], has_book_match: bool) -> list[Source]:
    if study_path == GsLmsStudyPathEnum.NCERT_ONLY:
        return [Source.NCERT, Source.ORIGINAL, Source.REFERENCE_BOOK, Source.COACHING]
    if study_path == GsLmsStudyPathEnum.REFERENCE_BOOKS and has_book_match:
        return [Source.REFERENCE_BOOK, Source.ORIGINAL, Source.NCERT, Source.COACHING]
    if study_path == GsLmsStudyPathEnum.COACHING:
        return [Source.COACHING, Source.ORIGINAL, Source.NCERT, Source.REFERENCE_BOOK]
    return list(_DEFAULT_SOURCES)


def rank_versions(db: Session, student_id: int, concept_id: int) -> list[GsLmsConceptVersion]:
    """REVIEWED versions of the concept, best first for this student."""
    versions = (
        db.query(GsLmsConceptVersion)
        .filter(
            GsLmsConceptVersion.concept_id == concept_id,
            GsLmsConceptVersion.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    )
    if not versions:
        return []
    profile = (
        db.query(GsLmsLearnerProfile)
        .filter(GsLmsLearnerProfile.student_id == student_id)
        .one_or_none()
    )
    preferred_level = profile.preferred_level if profile else None
    preferred_style = profile.preferred_style if profile else None
    study_path = profile.study_path if profile else None
    book_ids = [b for b in (profile.book_ids or []) if isinstance(b, int)] if profile else []

    levels = level_order(preferred_level, is_struggling(db, student_id, concept_id))
    styles = style_order(preferred_style)
    sources = source_order(
        study_path,
        study_path == GsLmsStudyPathEnum.REFERENCE_BOOKS
        and concept_in_student_books(db, concept_id, book_ids),
    )
    return sorted(
        versions,
        key=lambda v: (
            levels.index(v.level),
            styles.index(v.style),
            sources.index(v.source),
            v.display_order or 0,
            v.id,
        ),
    )


def pick_version(db: Session, student_id: int, concept_id: int) -> Optional[GsLmsConceptVersion]:
    """The best REVIEWED version for the student, or None when there is none."""
    ranked = rank_versions(db, student_id, concept_id)
    return ranked[0] if ranked else None


__all__ = [
    "STRUGGLING_ATTEMPTS",
    "is_struggling",
    "concept_in_student_books",
    "rank_versions",
    "pick_version",
]
