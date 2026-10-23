"""Per-student concept mastery for the GS LMS.

A concept is the smallest learning unit under a leaf topic. Each assessment of
a student's explanation (a 0..1 score from ``understanding.grade_explanation``)
is recorded with ``record_attempt``; the best score decides whether the concept
is PASSED. ``is_topic_mastered`` says whether a student has passed every
reviewed concept of a leaf topic.

These functions flush but never commit; the caller owns the transaction.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum
from app.core.gs_lms.models import GsLmsConcept
from app.core.gs_lms.student_models import GsLmsConceptMastery, GsLmsConceptMasteryStatusEnum

# Best score at or above this passes the concept.
CONCEPT_PASS_THRESHOLD = 0.7


def get_reviewed_concepts(db: Session, leaf_id: int) -> list[GsLmsConcept]:
    """REVIEWED concepts of a leaf topic, in display order (students see only these)."""
    return (
        db.query(GsLmsConcept)
        .filter(
            GsLmsConcept.syllabus_node_id == leaf_id,
            GsLmsConcept.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsConcept.display_order, GsLmsConcept.id)
        .all()
    )


def record_attempt(db: Session, student_id: int, concept_id: int, score: float) -> GsLmsConceptMastery:
    """Record one assessed attempt and return the student's mastery row.

    Updates attempts and last_score, keeps the best score, and marks the concept
    PASSED once the best score reaches CONCEPT_PASS_THRESHOLD (otherwise
    LEARNING). A PASSED concept stays PASSED after a weaker later attempt.
    """
    if db.get(GsLmsConcept, concept_id) is None:
        raise ValueError(f"Concept {concept_id} not found.")
    score = min(1.0, max(0.0, float(score)))
    now = datetime.now(timezone.utc)

    row = (
        db.query(GsLmsConceptMastery)
        .filter(
            GsLmsConceptMastery.student_id == student_id,
            GsLmsConceptMastery.concept_id == concept_id,
        )
        .one_or_none()
    )
    if row is None:
        row = GsLmsConceptMastery(
            student_id=student_id,
            concept_id=concept_id,
            score=0.0,
            attempts=0,
            status=GsLmsConceptMasteryStatusEnum.NOT_STARTED,
            created_by=str(student_id),
        )
        db.add(row)

    row.attempts = (row.attempts or 0) + 1
    row.last_score = score
    row.score = max(row.score or 0.0, score)
    row.last_assessed_at = now
    row.updated_by = str(student_id)
    if row.score >= CONCEPT_PASS_THRESHOLD:
        if row.status != GsLmsConceptMasteryStatusEnum.PASSED:
            row.passed_at = now
        row.status = GsLmsConceptMasteryStatusEnum.PASSED
    else:
        row.status = GsLmsConceptMasteryStatusEnum.LEARNING
    db.flush()
    return row


def topic_mastery(db: Session, student_id: int, leaf_id: int) -> dict[str, Any]:
    """Summary for a leaf topic: number of reviewed concepts, how many the
    student passed, and the average best score across all of them (concepts not
    yet attempted count as 0)."""
    concepts = get_reviewed_concepts(db, leaf_id)
    if not concepts:
        return {"concepts": 0, "passed": 0, "average_score": 0.0}
    rows = (
        db.query(GsLmsConceptMastery)
        .filter(
            GsLmsConceptMastery.student_id == student_id,
            GsLmsConceptMastery.concept_id.in_([c.id for c in concepts]),
        )
        .all()
    )
    by_concept = {r.concept_id: r for r in rows}
    passed = sum(
        1 for r in rows if r.status == GsLmsConceptMasteryStatusEnum.PASSED
    )
    total = sum((by_concept[c.id].score if c.id in by_concept else 0.0) for c in concepts)
    return {
        "concepts": len(concepts),
        "passed": passed,
        "average_score": round(total / len(concepts), 4),
    }


def is_topic_mastered(db: Session, student_id: int, leaf_id: int) -> bool:
    """True when the student passed every reviewed concept of the leaf. A leaf
    with no reviewed concepts has nothing to master, so it returns True."""
    summary = topic_mastery(db, student_id, leaf_id)
    return summary["passed"] >= summary["concepts"]


__all__ = [
    "CONCEPT_PASS_THRESHOLD",
    "get_reviewed_concepts",
    "record_attempt",
    "topic_mastery",
    "is_topic_mastered",
]
