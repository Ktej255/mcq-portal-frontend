"""Database orchestration for the GS readiness engine.

This module loads learner evidence in bulk, calls the pure engine, persists the
daily snapshot, and serialises the API response. It deliberately contains no
scoring formulas: every threshold and weight lives in ``readiness.py``.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, Sequence

from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsExamTypeEnum,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsSyllabusNode,
)
from app.core.gs_lms.readiness import (
    PyqRef,
    ReadinessReport,
    SectionEvidence,
    TopicEvidence,
    build_readiness_report,
)
from app.core.gs_lms.readiness_models import (
    GsLmsDemandWeight,
    GsLmsReadinessSnapshot,
)
from app.core.gs_lms.student_models import (
    GsLmsDiscussionSession,
    GsLmsDiscussionStatusEnum,
    GsLmsOnboardingStatus,
    GsLmsPracticeAttempt,
    GsLmsPracticeSession,
    GsLmsRevisitSchedule,
    GsLmsStudentSectionProgress,
)

MODEL_VERSION = "readiness-v1"
DEMAND_CACHE_MAX_AGE_DAYS = 7

_CANONICAL_SECTION_ORDER = {
    "BASIC": 1,
    "NCERT_LEVEL": 2,
    "ADVANCED": 3,
    "CURRENT_AFFAIRS": 4,
    "EXAMINER_TRAPS": 5,
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return _utcnow().date()


def _skippable_labels(learner_level: str, match_percentage: float | None) -> set[str]:
    """Mirror the content-access skip policy exactly.

    Keeping this in one place matters: coverage must not disagree with the
    completion rule the learner sees on the topic page.
    """
    if (
        learner_level == "intermediate"
        and match_percentage is not None
        and match_percentage > 70.0
    ):
        return {"BASIC"}
    if (
        learner_level == "advanced"
        and match_percentage is not None
        and match_percentage > 90.0
    ):
        return {"BASIC", "ADVANCED"}
    return set()


def _mega_topic_map(
    nodes: Sequence[GsLmsSyllabusNode],
) -> dict[int, str]:
    by_id = {node.id: node for node in nodes}
    result: dict[int, str] = {}
    for node in nodes:
        if node.node_type != GsLmsNodeTypeEnum.LEAF_TOPIC:
            continue
        current = node
        visited: set[int] = set()
        while current.parent_id is not None and current.parent_id in by_id:
            if current.id in visited:
                break
            visited.add(current.id)
            parent = by_id[current.parent_id]
            if parent.node_type == GsLmsNodeTypeEnum.MEGA_TOPIC:
                result[node.id] = parent.title
                break
            current = parent
        else:
            result[node.id] = ""
    return result


def load_topic_evidence(
    db: Session,
    student_id: int,
    subject_id: int,
) -> list[TopicEvidence]:
    """Load all evidence needed for one learner/subject readiness report.

    Query count is bounded and independent of topic count.
    """
    leaf_nodes = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsSyllabusNode.display_order, GsLmsSyllabusNode.id)
        .all()
    )
    # Paid-beta scope: the readiness dashboard must describe the curriculum
    # the learner can actually study. Unfinished topics are visible as gaps on
    # the syllabus map and in the operator coverage view, not counted here as
    # demand the learner is failing to cover.
    from app.core.gs_lms.beta_scope import beta_scope_enabled, compute_loop_ready_ids

    if beta_scope_enabled():
        ready_ids = compute_loop_ready_ids(db, subject_id)
        leaf_nodes = [node for node in leaf_nodes if node.id in ready_ids]
    if not leaf_nodes:
        return []

    leaf_ids = [node.id for node in leaf_nodes]
    all_nodes = (
        db.query(GsLmsSyllabusNode)
        .filter(GsLmsSyllabusNode.subject_id == subject_id)
        .all()
    )
    mega_titles = _mega_topic_map(all_nodes)

    sections_by_node: dict[int, list[GsLmsContentSection]] = defaultdict(list)
    for section in (
        db.query(GsLmsContentSection)
        .filter(
            GsLmsContentSection.syllabus_node_id.in_(leaf_ids),
            GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsContentSection.display_order)
        .all()
    ):
        sections_by_node[section.syllabus_node_id].append(section)

    # Match the content endpoint's canonical five-section order when present.
    for node_id, sections in sections_by_node.items():
        labels = {
            section.section_label.value
            if hasattr(section.section_label, "value")
            else str(section.section_label)
            for section in sections
        }
        if set(_CANONICAL_SECTION_ORDER).issubset(labels):
            sections.sort(
                key=lambda section: _CANONICAL_SECTION_ORDER[
                    section.section_label.value
                    if hasattr(section.section_label, "value")
                    else str(section.section_label)
                ]
            )

    section_ids = [
        section.id
        for sections in sections_by_node.values()
        for section in sections
    ]
    progress_map: dict[int, bool] = {}
    if section_ids:
        progress_map = {
            row.section_id: row.completed
            for row in (
                db.query(GsLmsStudentSectionProgress)
                .filter(
                    GsLmsStudentSectionProgress.student_id == student_id,
                    GsLmsStudentSectionProgress.section_id.in_(section_ids),
                )
                .all()
            )
        }

    onboarding = (
        db.query(GsLmsOnboardingStatus)
        .filter(GsLmsOnboardingStatus.student_id == student_id)
        .one_or_none()
    )
    learner_level = onboarding.learner_level if onboarding else "beginner"

    match_by_node: dict[int, float | None] = {}
    for session in (
        db.query(GsLmsDiscussionSession)
        .filter(
            GsLmsDiscussionSession.student_id == student_id,
            GsLmsDiscussionSession.syllabus_node_id.in_(leaf_ids),
            GsLmsDiscussionSession.status == GsLmsDiscussionStatusEnum.COMPLETED,
        )
        .order_by(
            GsLmsDiscussionSession.completed_at.desc(),
            GsLmsDiscussionSession.id.desc(),
        )
        .all()
    ):
        match_by_node.setdefault(session.syllabus_node_id, session.match_percentage)

    practice_by_node: dict[int, tuple[int, int]] = {}
    for node_id, total, correct in (
        db.query(
            GsLmsPracticeSession.syllabus_node_id,
            func.count(GsLmsPracticeAttempt.id),
            func.sum(
                case(
                    (GsLmsPracticeAttempt.is_correct.is_(True), 1),
                    else_=0,
                )
            ),
        )
        .join(
            GsLmsPracticeAttempt,
            GsLmsPracticeAttempt.session_id == GsLmsPracticeSession.id,
        )
        .filter(
            GsLmsPracticeSession.student_id == student_id,
            GsLmsPracticeSession.syllabus_node_id.in_(leaf_ids),
            GsLmsPracticeAttempt.is_correct.is_not(None),
        )
        .group_by(GsLmsPracticeSession.syllabus_node_id)
        .all()
    ):
        practice_by_node[node_id] = (int(total or 0), int(correct or 0))

    today = _today()
    revisit_by_node: dict[int, int] = defaultdict(int)
    for node_id, total in (
        db.query(
            GsLmsRevisitSchedule.syllabus_node_id,
            func.count(GsLmsRevisitSchedule.id),
        )
        .filter(
            GsLmsRevisitSchedule.student_id == student_id,
            GsLmsRevisitSchedule.syllabus_node_id.in_(leaf_ids),
            GsLmsRevisitSchedule.due_date <= today,
            GsLmsRevisitSchedule.completed.is_(True),
        )
        .group_by(GsLmsRevisitSchedule.syllabus_node_id)
        .all()
    ):
        revisit_by_node[node_id] = int(total or 0)

    pyqs_by_node: dict[int, list[PyqRef]] = defaultdict(list)
    for pyq in (
        db.query(GsLmsPyq)
        .filter(
            GsLmsPyq.subject_id == subject_id,
            GsLmsPyq.syllabus_node_id.in_(leaf_ids),
            GsLmsPyq.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    ):
        exam_type = (
            pyq.exam_type.value
            if hasattr(pyq.exam_type, "value")
            else str(pyq.exam_type)
        )
        pyqs_by_node[pyq.syllabus_node_id].append(
            PyqRef(year=pyq.year, exam_type=exam_type, marks=pyq.marks)
        )

    mcq_counts = {
        node_id: int(total or 0)
        for node_id, total in (
            db.query(
                GsLmsMcqQuestion.syllabus_node_id,
                func.count(GsLmsMcqQuestion.id),
            )
            .filter(
                GsLmsMcqQuestion.syllabus_node_id.in_(leaf_ids),
                GsLmsMcqQuestion.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .group_by(GsLmsMcqQuestion.syllabus_node_id)
            .all()
        )
    }

    topics: list[TopicEvidence] = []
    for node in leaf_nodes:
        sections = sections_by_node.get(node.id, [])
        skip_labels = _skippable_labels(
            learner_level, match_by_node.get(node.id)
        )
        skippable_ids = frozenset(
            section.id
            for section in sections
            if (
                section.section_label.value
                if hasattr(section.section_label, "value")
                else str(section.section_label)
            )
            in skip_labels
        )
        attempts, correct = practice_by_node.get(node.id, (0, 0))
        recall = match_by_node.get(node.id)

        topics.append(
            TopicEvidence(
                node_id=node.id,
                title=node.title,
                mega_topic=mega_titles.get(node.id, ""),
                display_order=node.display_order,
                sections=tuple(
                    SectionEvidence(
                        id=section.id,
                        label=(
                            section.section_label.value
                            if hasattr(section.section_label, "value")
                            else str(section.section_label)
                        ),
                        completed=bool(progress_map.get(section.id, False)),
                        title=section.title,
                    )
                    for section in sections
                ),
                skippable_section_ids=skippable_ids,
                practice_attempts=attempts,
                practice_correct=correct,
                recall_score=(
                    None if recall is None else max(0.0, min(1.0, recall / 100.0))
                ),
                completed_due_revisits=revisit_by_node.get(node.id, 0),
                pyqs=tuple(pyqs_by_node.get(node.id, [])),
                mcq_count=mcq_counts.get(node.id, 0),
            )
        )
    return topics


def _serialise(report: ReadinessReport, subject_slug: str) -> dict[str, Any]:
    topics = sorted(
        report.topics,
        key=lambda row: (row.marks_at_stake, row.demand_score),
        reverse=True,
    )
    return {
        "generated_at": _utcnow().isoformat(),
        "subject": subject_slug,
        "model_version": MODEL_VERSION,
        "summary": {
            "readiness_score": report.readiness_score,
            "band": report.band,
            "band_suppressed": report.band_suppressed,
            "confidence": {
                "level": report.confidence_level,
                "assessed_demand_pct": report.assessed_demand_pct,
                "demand_mapping_pct": report.demand_mapping_pct,
                "weighted_confidence": report.weighted_confidence,
            },
            "projection": {
                "questions": report.projection.questions,
                "correct": {
                    "low": report.projection.correct_low,
                    "expected": report.projection.correct_expected,
                    "high": report.projection.correct_high,
                },
                "net_marks": {
                    "low": report.projection.net_low,
                    "expected": report.projection.net_expected,
                    "high": report.projection.net_high,
                },
                "assumptions": list(report.projection.assumptions),
            },
        },
        "coverage": {
            "demand_weighted_pct": report.coverage_pct,
            "topics_touched": sum(1 for row in topics if row.coverage > 0),
            "topics_total": len(topics),
        },
        "depth": {
            "demand_weighted_pct": report.depth_pct,
            "deep_topics": sum(1 for row in topics if row.depth >= 0.70),
        },
        "evidence": {
            "assessed_topics": sum(1 for row in topics if row.has_evidence),
            "assessed_demand_pct": report.assessed_demand_pct,
        },
        "topics": [
            {
                "node_id": row.node_id,
                "title": row.title,
                "mega_topic": row.mega_topic,
                "display_order": row.display_order,
                "demand_score": round(row.demand_score, 1),
                "demand_share_pct": round(100.0 * row.demand_share, 2),
                "demand_confidence_pct": round(100.0 * row.demand_confidence, 1),
                "pyq_count": row.pyq_count,
                "last_pyq_year": row.last_pyq_year,
                "mains_pyq_count": row.mains_pyq_count,
                "last_mains_year": row.last_mains_year,
                "coverage_pct": round(100.0 * row.coverage, 1),
                "depth_pct": round(100.0 * row.depth, 1),
                "prep_pct": round(100.0 * row.prep, 1),
                "performance_pct": round(100.0 * row.performance, 1),
                "confidence_pct": round(100.0 * row.confidence, 1),
                "status": row.status,
                "gap_marks": round(row.marks_at_stake, 1),
                "has_evidence": row.has_evidence,
                "practice_attempts": row.practice_attempts,
                "practice_correct": row.practice_correct,
                "recall_score_pct": (
                    None
                    if row.recall_score is None
                    else round(100.0 * row.recall_score, 1)
                ),
                "mcq_count": row.mcq_count,
                "next_action": row.next_action,
                "next_section": row.next_section,
                "reason": row.reason,
            }
            for row in topics
        ],
        "next_actions": list(report.next_actions),
        "data_quality": report.data_quality,
    }


def _upsert_snapshot(
    db: Session,
    student_id: int,
    subject_id: int,
    report: ReadinessReport,
    payload: dict[str, Any],
) -> None:
    snapshot = (
        db.query(GsLmsReadinessSnapshot)
        .filter(
            GsLmsReadinessSnapshot.student_id == student_id,
            GsLmsReadinessSnapshot.subject_id == subject_id,
            GsLmsReadinessSnapshot.snapshot_date == report.as_of,
        )
        .one_or_none()
    )
    now = _utcnow()
    values = {
        "computed_at": now,
        "readiness_score": report.readiness_score,
        "band": report.band,
        "projected_correct_low": report.projection.correct_low,
        "projected_correct_expected": report.projection.correct_expected,
        "projected_correct_high": report.projection.correct_high,
        "projected_net_low": report.projection.net_low,
        "projected_net_expected": report.projection.net_expected,
        "projected_net_high": report.projection.net_high,
        "confidence_level": report.confidence_level,
        "assessed_demand_pct": report.assessed_demand_pct,
        "coverage_pct": report.coverage_pct,
        "depth_pct": report.depth_pct,
        "payload": payload,
    }

    try:
        if snapshot is None:
            snapshot = GsLmsReadinessSnapshot(
                student_id=student_id,
                subject_id=subject_id,
                snapshot_date=report.as_of,
                **values,
            )
            db.add(snapshot)
        else:
            for key, value in values.items():
                setattr(snapshot, key, value)
        db.commit()
    except IntegrityError:
        db.rollback()
        # A concurrent request won the unique-key race; update that row.
        snapshot = (
            db.query(GsLmsReadinessSnapshot)
            .filter(
                GsLmsReadinessSnapshot.student_id == student_id,
                GsLmsReadinessSnapshot.subject_id == subject_id,
                GsLmsReadinessSnapshot.snapshot_date == report.as_of,
            )
            .one()
        )
        for key, value in values.items():
            setattr(snapshot, key, value)
        db.commit()


def get_readiness(
    db: Session,
    student_id: int,
    subject_id: int,
    subject_slug: str,
    persist: bool = True,
) -> dict[str, Any]:
    """Compute and optionally persist one readiness report."""
    if demand_cache_is_stale(db, subject_id):
        try:
            rebuild_demand_weights(db, subject_id)
        except Exception:
            # The readiness calculation does not depend on the cache; a cache
            # write failure must not prevent a learner from seeing their data.
            db.rollback()

    topics = load_topic_evidence(db, student_id, subject_id)
    report = build_readiness_report(topics, _today())
    payload = _serialise(report, subject_slug)
    if persist:
        _upsert_snapshot(db, student_id, subject_id, report, payload)
    return payload


def get_readiness_trend(
    db: Session,
    student_id: int,
    subject_id: int,
    limit: int = 30,
) -> list[dict[str, Any]]:
    rows = (
        db.query(GsLmsReadinessSnapshot)
        .filter(
            GsLmsReadinessSnapshot.student_id == student_id,
            GsLmsReadinessSnapshot.subject_id == subject_id,
        )
        .order_by(GsLmsReadinessSnapshot.snapshot_date.desc())
        .limit(max(1, min(limit, 180)))
        .all()
    )
    rows.reverse()
    return [
        {
            "date": row.snapshot_date.isoformat(),
            "computed_at": row.computed_at.isoformat(),
            "readiness_score": row.readiness_score,
            "band": row.band,
            "confidence_level": row.confidence_level,
            "coverage_pct": row.coverage_pct,
            "depth_pct": row.depth_pct,
            "assessed_demand_pct": row.assessed_demand_pct,
            "projected_correct_expected": row.projected_correct_expected,
            "projected_net_expected": row.projected_net_expected,
        }
        for row in rows
    ]


def rebuild_demand_weights(
    db: Session,
    subject_id: int,
    as_of_year: int | None = None,
) -> int:
    """Rebuild the demand cache for a subject.

    Readiness requests compute demand from PYQs directly; this cache exists so
    operators and audits can inspect the demand model without recomputing it
    inside a learner request.
    """
    from app.core.gs_lms.readiness import compute_demand_weights

    leaf_nodes = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    )
    if not leaf_nodes:
        return 0

    leaf_ids = [node.id for node in leaf_nodes]
    pyqs_by_node: dict[int, list[PyqRef]] = defaultdict(list)
    for pyq in (
        db.query(GsLmsPyq)
        .filter(
            GsLmsPyq.subject_id == subject_id,
            GsLmsPyq.syllabus_node_id.in_(leaf_ids),
            GsLmsPyq.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    ):
        pyqs_by_node[pyq.syllabus_node_id].append(
            PyqRef(
                year=pyq.year,
                exam_type=(
                    pyq.exam_type.value
                    if hasattr(pyq.exam_type, "value")
                    else str(pyq.exam_type)
                ),
                marks=pyq.marks,
            )
        )

    topics = [
        TopicEvidence(node_id=node.id, title=node.title, pyqs=tuple(pyqs_by_node[node.id]))
        for node in leaf_nodes
    ]
    year = as_of_year or _today().year
    demands = compute_demand_weights(topics, year)
    now = _utcnow()

    existing = {
        row.syllabus_node_id: row
        for row in (
            db.query(GsLmsDemandWeight)
            .filter(GsLmsDemandWeight.subject_id == subject_id)
            .all()
        )
    }
    for node in leaf_nodes:
        demand = demands[node.id]
        row = existing.get(node.id)
        values = {
            "demand_share": demand.share,
            "demand_score": demand.score,
            "pyq_count": demand.pyq_count,
            "weighted_pyq": demand.weighted_pyq,
            "distinct_years": demand.distinct_years,
            "last_pyq_year": demand.last_pyq_year,
            "demand_confidence": demand.confidence,
            "components": list(demand.components),
            "computed_at": now,
        }
        if row is None:
            db.add(
                GsLmsDemandWeight(
                    subject_id=subject_id,
                    syllabus_node_id=node.id,
                    **values,
                )
            )
        else:
            for key, value in values.items():
                setattr(row, key, value)
    db.commit()
    return len(leaf_nodes)


def demand_cache_is_stale(db: Session, subject_id: int) -> bool:
    latest = (
        db.query(func.max(GsLmsDemandWeight.computed_at))
        .filter(GsLmsDemandWeight.subject_id == subject_id)
        .scalar()
    )
    if latest is None:
        return True
    if isinstance(latest, str):
        try:
            latest = datetime.fromisoformat(latest)
        except ValueError:
            return True
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    return (_utcnow() - latest).days >= DEMAND_CACHE_MAX_AGE_DAYS


__all__ = [
    "MODEL_VERSION",
    "demand_cache_is_stale",
    "get_readiness",
    "get_readiness_trend",
    "load_topic_evidence",
    "rebuild_demand_weights",
]
