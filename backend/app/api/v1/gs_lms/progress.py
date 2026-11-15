"""Progress and gap tracking endpoints for the GS LMS Platform.

Routes (mounted under /api/v1/gs-lms; auth-gated at the package router):
* GET /geography/progress — Overall + per-mega-topic coverage
* GET /geography/gaps — Prioritized weak topics and weak question types

Design properties enforced:
* Property 14 (Gap profile weak area identification): topics/types below 60%
  are in weak lists; those at or above 60% are excluded.
* Property 15 (Gap prioritization ordering): weak lists ordered by severity
  (lowest accuracy first).

The gap profile is updated after every practice submission and discussion
completion via the coverage engine's ``create_gap_snapshot`` function (called
from the practice submit and discussion complete endpoints). This module
reads the latest snapshot or computes fresh when no snapshot exists.

Requirements traced: 6.1, 6.2, 6.3, 6.4, 6.5
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user
from app.schemas.common import StandardResponse
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import (
    GsLmsSyllabusNode,
    GsLmsContentSection,
    GsLmsNodeTypeEnum,
)
from app.core.gs_lms.student_models import (
    GsLmsDiscussionSession,
    GsLmsDiscussionStatusEnum,
    GsLmsGapSnapshot,
)
from app.core.gs_lms.coverage import (
    compute_gap_profile,
    get_latest_gap_snapshot,
)
from app.api.v1.gs_lms.dependencies import resolve_subject
from app.api.v1.gs_lms.content import (
    _compute_skippable_section_ids,
    _compute_skippable_section_labels,
    _get_learner_level,
    _get_student_progress,
    _is_topic_completed,
)
from app.api.v1.gs_lms.schemas import (
    GsLmsProgressOut,
    GsLmsMegaTopicProgressOut,
    GsLmsGapOut,
    GsLmsWeakTopicOut,
    GsLmsWeakQuestionTypeOut,
    GsLmsRecommendedActionOut,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _compute_progress(
    db: Session,
    student_id: int,
    subject_id: int,
) -> GsLmsProgressOut:
    """Compute overall and per-mega-topic progress for a student.

    A leaf topic is complete when all of its reviewed, non-skippable sections
    are complete according to the same learner-aware policy used by content.py.
    The actual reviewed section set preserves legacy four-section topics and
    supports canonical five-section topics.
    """
    # Get all REVIEWED leaf topics for this subject.
    leaf_nodes = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    )

    total_topics = len(leaf_nodes)
    leaf_ids = [node.id for node in leaf_nodes]

    # Load reviewed sections once, restricting progress to this subject's
    # reviewed leaf topics instead of counting arbitrary student rows.
    sections_by_node: dict[int, list[GsLmsContentSection]] = defaultdict(list)
    if leaf_ids:
        reviewed_sections = (
            db.query(GsLmsContentSection)
            .filter(
                GsLmsContentSection.syllabus_node_id.in_(leaf_ids),
                GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .all()
        )
        for section in reviewed_sections:
            sections_by_node[section.syllabus_node_id].append(section)

    all_section_ids = [
        section.id
        for sections in sections_by_node.values()
        for section in sections
    ]
    progress_map = _get_student_progress(db, student_id, all_section_ids)
    learner_level = _get_learner_level(db, student_id)

    # The latest completed discussion match is topic-specific and controls
    # which sections are skippable for intermediate/advanced learners.
    latest_match_by_node: dict[int, float | None] = {}
    if leaf_ids:
        sessions = (
            db.query(GsLmsDiscussionSession)
            .filter(
                GsLmsDiscussionSession.student_id == student_id,
                GsLmsDiscussionSession.syllabus_node_id.in_(leaf_ids),
                GsLmsDiscussionSession.status == GsLmsDiscussionStatusEnum.COMPLETED,
            )
            .order_by(GsLmsDiscussionSession.completed_at.desc())
            .all()
        )
        for session in sessions:
            latest_match_by_node.setdefault(
                session.syllabus_node_id, session.match_percentage
            )

    completed_node_ids: set[int] = set()
    for node in leaf_nodes:
        sections = sections_by_node.get(node.id, [])
        section_ids = [section.id for section in sections]
        skippable_labels = _compute_skippable_section_labels(
            learner_level, latest_match_by_node.get(node.id)
        )
        skippable_ids = _compute_skippable_section_ids(
            sections, skippable_labels
        )
        if _is_topic_completed(progress_map, section_ids, skippable_ids):
            completed_node_ids.add(node.id)

    completed_topics = sum(
        1 for node in leaf_nodes if node.id in completed_node_ids
    )

    overall_percent = (
        (completed_topics / total_topics * 100.0) if total_topics > 0 else 0.0
    )

    # Get REVIEWED mega-topic nodes
    mega_topics = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.MEGA_TOPIC,
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsSyllabusNode.display_order)
        .all()
    )

    # Build per-mega-topic breakdown
    mega_topic_progress: list[GsLmsMegaTopicProgressOut] = []
    for mega in mega_topics:
        # Find all leaf descendants of this mega topic
        children_leaves = _get_leaf_descendants(db, mega.id, subject_id)
        total_children = len(children_leaves)
        completed_children = sum(
            1 for child in children_leaves if child.id in completed_node_ids
        )
        completion_pct = (
            (completed_children / total_children * 100.0)
            if total_children > 0
            else 0.0
        )
        mega_topic_progress.append(
            GsLmsMegaTopicProgressOut(
                node_id=mega.id,
                title=mega.title,
                total_children=total_children,
                completed_children=completed_children,
                completion_percent=round(completion_pct, 2),
            )
        )

    return GsLmsProgressOut(
        total_topics=total_topics,
        completed_topics=completed_topics,
        overall_percent=round(overall_percent, 2),
        mega_topics=mega_topic_progress,
    )


def _get_leaf_descendants(
    db: Session,
    mega_topic_id: int,
    subject_id: int,
) -> list[GsLmsSyllabusNode]:
    """Get all REVIEWED leaf-topic descendants of a mega-topic node.

    Traverses the tree via parent_id links to find all leaf nodes under the
    specified mega-topic, including intermediate sub-topics.
    """
    # BFS to collect all descendants
    result_leaves: list[GsLmsSyllabusNode] = []
    queue = [mega_topic_id]

    while queue:
        current_id = queue.pop(0)
        children = (
            db.query(GsLmsSyllabusNode)
            .filter(
                GsLmsSyllabusNode.parent_id == current_id,
                GsLmsSyllabusNode.subject_id == subject_id,
                GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .all()
        )
        for child in children:
            if child.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC:
                result_leaves.append(child)
            else:
                queue.append(child.id)

    return result_leaves


def _build_gap_out_from_snapshot(snapshot: GsLmsGapSnapshot) -> GsLmsGapOut:
    """Convert a persisted gap snapshot to the API response schema."""
    weak_topics = [
        GsLmsWeakTopicOut(
            node_id=t["node_id"],
            title=t["title"],
            accuracy=t["accuracy"],
            attempt_count=t.get("attempts", 0),
        )
        for t in (snapshot.weak_topics or [])
    ]

    weak_question_types = [
        GsLmsWeakQuestionTypeOut(
            question_type=t["type"],
            accuracy=t["accuracy"],
            attempt_count=t.get("attempts", 0),
        )
        for t in (snapshot.weak_question_types or [])
    ]

    recommended_actions = [
        GsLmsRecommendedActionOut(
            action=a["action"],
            target_node_id=a.get("target_node_id"),
            reason=a["reason"],
        )
        for a in (snapshot.recommended_actions or [])
    ]

    return GsLmsGapOut(
        overall_accuracy=snapshot.overall_accuracy,
        weak_topics=weak_topics,
        weak_question_types=weak_question_types,
        recommended_actions=recommended_actions,
        computed_at=snapshot.computed_at.isoformat(),
    )


def _build_gap_out_from_profile(profile, computed_at_iso: str) -> GsLmsGapOut:
    """Convert a freshly computed GapProfile to the API response schema."""
    weak_topics = [
        GsLmsWeakTopicOut(
            node_id=t.node_id,
            title=t.title,
            accuracy=t.accuracy,
            attempt_count=t.total_attempts,
        )
        for t in profile.weak_topics
    ]

    weak_question_types = [
        GsLmsWeakQuestionTypeOut(
            question_type=t.question_type.value,
            accuracy=t.accuracy,
            attempt_count=t.total_attempts,
        )
        for t in profile.weak_question_types
    ]

    recommended_actions = [
        GsLmsRecommendedActionOut(
            action=a.action,
            target_node_id=a.target_node_id,
            reason=a.reason,
        )
        for a in profile.recommended_actions
    ]

    return GsLmsGapOut(
        overall_accuracy=profile.overall_accuracy,
        weak_topics=weak_topics,
        weak_question_types=weak_question_types,
        recommended_actions=recommended_actions,
        computed_at=computed_at_iso,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/progress")
def get_progress(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get overall and per-mega-topic progress for the current student.

    Returns total topics, completed topics, overall percentage, and a
    breakdown per mega-topic with child counts and completion percentages.

    Requirements: 6.1
    """
    progress = _compute_progress(db, current_user.id, subject.id)
    return StandardResponse(
        success=True,
        message="Progress retrieved",
        data=progress,
    )


@router.get("/gaps")
def get_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get the gap profile for the current student.

    Returns weak topics, weak question types, and recommended actions.
    Uses the latest persisted snapshot if available; otherwise computes
    fresh from practice attempt data.

    Guarantees (R6.4): always renders either a prioritized weak-area list
    OR an empty-state (all lists empty when no weaknesses detected).

    Requirements: 6.2, 6.3, 6.4, 6.5
    """
    from datetime import datetime, timezone

    # Try the latest snapshot first (avoids re-computing on every request)
    snapshot = get_latest_gap_snapshot(db, current_user.id)
    if snapshot is not None:
        gap_out = _build_gap_out_from_snapshot(snapshot)
        return StandardResponse(
            success=True,
            message="Gap profile retrieved",
            data=gap_out,
        )

    # No snapshot yet — compute fresh
    profile = compute_gap_profile(db, current_user.id)
    computed_at = datetime.now(timezone.utc).isoformat()
    gap_out = _build_gap_out_from_profile(profile, computed_at)

    return StandardResponse(
        success=True,
        message="Gap profile computed",
        data=gap_out,
    )
