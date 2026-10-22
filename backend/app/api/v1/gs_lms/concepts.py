"""Concept endpoints for the GS LMS Platform.

Routes (mounted under /api/v1/gs-lms/{subject_slug}; auth-gated at the package router):
* GET /topics/{node_id}/concepts — The leaf topic's concepts with the current
  student's mastery of each, plus a topic-level mastery summary.

Review-gate: only REVIEWED concepts are returned to students. Read-only.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user
from app.schemas.common import StandardResponse
from app.core.gs.models import GsSubject
from app.core.gs_lms.mastery import get_reviewed_concepts, topic_mastery
from app.core.gs_lms.models import GsLmsNodeTypeEnum, GsLmsSyllabusNode
from app.core.gs_lms.student_models import GsLmsConceptMastery, GsLmsConceptMasteryStatusEnum
from app.api.v1.gs_lms.dependencies import resolve_subject
from app.api.v1.gs_lms.schemas import (
    GsLmsConceptMasteryOut,
    GsLmsConceptOut,
    GsLmsTopicConceptsOut,
    GsLmsTopicMasteryOut,
)

router = APIRouter()


def _iso(value) -> str | None:
    return value.isoformat() if value else None


@router.get("/topics/{node_id}/concepts")
def get_topic_concepts(
    node_id: int,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return a leaf topic's reviewed concepts with the student's mastery."""
    node = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.id == node_id,
            GsLmsSyllabusNode.subject_id == subject.id,
        )
        .one_or_none()
    )
    if node is None or node.node_type != GsLmsNodeTypeEnum.LEAF_TOPIC:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found",
        )

    concepts = get_reviewed_concepts(db, node_id)
    rows = (
        db.query(GsLmsConceptMastery)
        .filter(
            GsLmsConceptMastery.student_id == current_user.id,
            GsLmsConceptMastery.concept_id.in_([c.id for c in concepts]),
        )
        .all()
        if concepts
        else []
    )
    by_concept = {r.concept_id: r for r in rows}

    concepts_out = []
    for concept in concepts:
        row = by_concept.get(concept.id)
        mastery = (
            GsLmsConceptMasteryOut(
                status=row.status.value,
                score=row.score,
                last_score=row.last_score,
                attempts=row.attempts,
                passed_at=_iso(row.passed_at),
                last_assessed_at=_iso(row.last_assessed_at),
            )
            if row
            else GsLmsConceptMasteryOut(status=GsLmsConceptMasteryStatusEnum.NOT_STARTED.value)
        )
        concepts_out.append(
            GsLmsConceptOut(
                concept_id=concept.id,
                title=concept.title,
                display_order=concept.display_order,
                key_points=concept.key_points or [],
                misconceptions=concept.misconceptions or [],
                mastery=mastery,
            )
        )

    summary = topic_mastery(db, current_user.id, node_id)
    return StandardResponse(
        success=True,
        message="Topic concepts",
        data=GsLmsTopicConceptsOut(
            node_id=node.id,
            title=node.title,
            concepts=concepts_out,
            topic_mastery=GsLmsTopicMasteryOut(
                **summary, mastered=summary["passed"] >= summary["concepts"]
            ),
        ),
    )
