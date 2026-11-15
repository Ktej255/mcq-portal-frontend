"""Paid-beta topic scope for the GS LMS.

The founder decision for the private paid beta is: **only loop-ready topics**.
A loop-ready topic has all five reviewed canonical sections, at least one
reviewed PYQ (measured demand), and a complete 15-question reviewed MCQ Lab.
Every other topic is still being authored and must not be entered, because a
learner who opens it hits a dead end.

Enforcement is controlled by ``settings.GS_LMS_BETA_SCOPE`` so the mechanics
tests (which deliberately build partial topics) and local authoring tools keep
working. Production startup refuses to boot with the flag off, so the paid
cohort can never be served an unscoped curriculum.

Operators are never gated: ``/admin/gs-lms/content-coverage`` reports every
topic and its blockers using the same gate computation defined here.
"""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.gs.models import GsReviewStatusEnum
from app.core.gs_lms.mcq_lab_scoring import TOTAL_MCQ_LAB_QUESTIONS
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)

# Funnel order, not enum declaration order. Mirrors the content endpoint.
CANONICAL_SECTION_LABELS: tuple[str, ...] = (
    GsLmsSectionLabelEnum.BASIC.value,
    GsLmsSectionLabelEnum.NCERT_LEVEL.value,
    GsLmsSectionLabelEnum.ADVANCED.value,
    GsLmsSectionLabelEnum.CURRENT_AFFAIRS.value,
    GsLmsSectionLabelEnum.EXAMINER_TRAPS.value,
)

BETA_LOCKED_MESSAGE = (
    "This topic is not open in the paid beta yet. It is still being authored "
    "and becomes available once it passes the content, demand, and practice "
    "gates. The syllabus map shows it so you can see what is coming."
)


def beta_scope_enabled() -> bool:
    """Whether learner entry is restricted to loop-ready topics."""
    return bool(settings.GS_LMS_BETA_SCOPE)


def compute_loop_ready_ids(db: Session, subject_id: int) -> set[int]:
    """Return the IDs of leaf topics that pass every paid-beta gate.

    Four bounded queries, independent of the number of topics. The gate
    definitions must stay identical to the operator coverage view:

    * content: REVIEWED topic and all five canonical section labels REVIEWED;
    * demand: at least one REVIEWED PYQ mapped to the topic;
    * practice: at least ``TOTAL_MCQ_LAB_QUESTIONS`` REVIEWED MCQs.
    """
    leaves = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    )
    leaf_ids = [node.id for node in leaves]
    if not leaf_ids:
        return set()

    reviewed_labels: dict[int, set[str]] = defaultdict(set)
    for node_id, label in (
        db.query(
            GsLmsContentSection.syllabus_node_id,
            GsLmsContentSection.section_label,
        )
        .filter(
            GsLmsContentSection.syllabus_node_id.in_(leaf_ids),
            GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    ):
        reviewed_labels[node_id].add(
            label.value if hasattr(label, "value") else str(label)
        )

    pyq_nodes = {
        node_id
        for (node_id,) in db.query(GsLmsPyq.syllabus_node_id)
        .filter(
            GsLmsPyq.syllabus_node_id.in_(leaf_ids),
            GsLmsPyq.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .distinct()
        .all()
    }

    mcq_counts = dict(
        db.query(GsLmsMcqQuestion.syllabus_node_id, func.count(GsLmsMcqQuestion.id))
        .filter(
            GsLmsMcqQuestion.syllabus_node_id.in_(leaf_ids),
            GsLmsMcqQuestion.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .group_by(GsLmsMcqQuestion.syllabus_node_id)
        .all()
    )

    ready: set[int] = set()
    for node in leaves:
        if set(CANONICAL_SECTION_LABELS) - reviewed_labels.get(node.id, set()):
            continue
        if node.id not in pyq_nodes:
            continue
        if mcq_counts.get(node.id, 0) < TOTAL_MCQ_LAB_QUESTIONS:
            continue
        ready.add(node.id)
    return ready


def is_beta_ready(db: Session, subject_id: int, node_id: int) -> bool:
    """Whether one topic is enterable in the paid beta."""
    return node_id in compute_loop_ready_ids(db, subject_id)


__all__ = [
    "BETA_LOCKED_MESSAGE",
    "CANONICAL_SECTION_LABELS",
    "beta_scope_enabled",
    "compute_loop_ready_ids",
    "is_beta_ready",
]
