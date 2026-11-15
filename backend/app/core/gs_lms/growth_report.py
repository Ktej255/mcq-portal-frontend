"""Growth Report Generator — aggregates all funnel data into a comprehensive
performance report with historical comparison and weakness identification.

Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, date, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.gs_lms.funnel_models import (
    GsLmsReadingTime,
    GsLmsRecallAttempt,
    GsLmsMcqLabSession,
    GsLmsMcqLabAttempt,
    GsLmsWeaknessPattern,
    GsLmsGrowthReport,
    GsLmsSpacedRepSchedule,
)
from app.core.gs.models import GsReviewStatusEnum
from app.core.gs_lms.models import (
    GsLmsAnswerAttempt,
    GsLmsAnswerAttemptStatusEnum,
    GsLmsContentSection,
    GsLmsEvaluationReport,
    GsLmsExamTypeEnum,
    GsLmsPyq,
    GsLmsSyllabusNode,
)
from app.core.gs_lms.spaced_repetition import (
    compute_initial_interval,
    schedule_after_completion,
)


# ---------------------------------------------------------------------------
# Data Types
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SectionMetrics:
    section_label: str
    reading_time_seconds: int
    recall_score: float          # 0.0–1.0
    confidence_score: float      # 0.0–1.0
    is_rushed: bool
    # Evidence flags distinguish "scored zero" from "never recorded". A
    # section with no reading or recall record must not be presented as a
    # learner deficit; it is simply unevidenced.
    has_reading_evidence: bool = False
    has_recall_evidence: bool = False


@dataclass(frozen=True)
class WeaknessItem:
    category: str                # "rushed_section" | "low_recall" | "weak_type"
    label: str
    value: float
    recommended_action: str


@dataclass
class GrowthReportData:
    student_id: int
    syllabus_node_id: int
    topic_title: str
    generated_at: datetime
    section_metrics: List[SectionMetrics]
    mcq_total_score: float
    mcq_type_breakdown: list
    mains_score: Optional[float]
    mains_max_marks: Optional[int]
    next_recall_date: date
    recall_interval_days: int
    comparison_data: Optional[dict]
    weaknesses: List[WeaknessItem]
    # False when the learner never submitted an MCQ Lab session for this topic.
    # The score is then reported as 0.0 for schema stability, but it must not be
    # presented as a failed attempt.
    has_mcq_evidence: bool = False


def _snapshot_evidenced_recall_avg(metrics: list) -> Optional[float]:
    """Average recorded recall (0–100) from a persisted snapshot, or None.

    Snapshots predating evidence flags are inferred from a positive recall
    score; a missing recall must not enter the average as a zero.
    """
    values: List[float] = []
    for m in metrics or []:
        has = m.get("has_recall_evidence")
        raw = float(m.get("recall_score") or 0.0)
        if has is None:
            has = raw > 0
        if has:
            values.append(raw)
    if not values:
        return None
    return round(sum(values) / len(values) * 100, 1)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

RUSHED_THRESHOLD = 0.3  # section is rushed if reading time < 30% of estimated
LOW_RECALL_THRESHOLD = 0.5  # recall score < 50% is flagged
SECTION_LABELS = ["BASIC", "NCERT_LEVEL", "ADVANCED", "CURRENT_AFFAIRS", "EXAMINER_TRAPS"]


# ---------------------------------------------------------------------------
# Pure Functions
# ---------------------------------------------------------------------------

def is_section_rushed(reading_time_seconds: int, estimated_duration_seconds: int) -> bool:
    """A section is rushed when reading time < 30% of estimated duration.

    Returns False if estimated_duration is <= 0 (cannot determine).
    """
    if estimated_duration_seconds <= 0:
        return False
    return reading_time_seconds < (RUSHED_THRESHOLD * estimated_duration_seconds)


def identify_weaknesses(
    section_metrics: List[SectionMetrics],
    mcq_type_breakdown: list,
    weakness_patterns: list,
) -> List[WeaknessItem]:
    """Identify weakness areas for the Growth Report.

    Rules:
    - Rushed: reading_time < 30% of estimated → "Re-read this section"
    - Low recall: recall_score < 0.5 → "Review and re-attempt recall"
    - Weak type: accuracy < 0.5 across 3+ attempts → "Practice this question type"
    """
    weaknesses: List[WeaknessItem] = []

    # Rushed sections
    for sm in section_metrics:
        if sm.is_rushed:
            weaknesses.append(WeaknessItem(
                category="rushed_section",
                label=sm.section_label.replace("_", " "),
                value=sm.reading_time_seconds,
                recommended_action="Re-read this section more carefully",
            ))

    # Low recall — only when a recall attempt actually exists. A section that
    # was skipped or never checked is not evidence of weak recall.
    for sm in section_metrics:
        if sm.has_recall_evidence and sm.recall_score < LOW_RECALL_THRESHOLD:
            weaknesses.append(WeaknessItem(
                category="low_recall",
                label=sm.section_label.replace("_", " "),
                value=round(sm.recall_score * 100, 1),
                recommended_action="Review the content and re-attempt spoken recall",
            ))

    # Weak question types
    for wp in weakness_patterns:
        if isinstance(wp, dict) and wp.get("is_weak"):
            weaknesses.append(WeaknessItem(
                category="weak_type",
                label=wp.get("question_type", "Unknown").replace("_", " "),
                value=round(wp.get("accuracy", 0) * 100, 1),
                recommended_action="Practice more questions of this type",
            ))

    return weaknesses


# ---------------------------------------------------------------------------
# Mains score derivation
# ---------------------------------------------------------------------------

def latest_mains_score(
    db: Session,
    student_id: int,
    node_id: int,
) -> Optional[Tuple[Optional[float], Optional[int]]]:
    """Return the latest evaluated, linked Mains score for a topic.

    Only attempts linked to a reviewed Mains PYQ for the node's subject and
    syllabus node are attributable to this Growth Report. Free-form attempts
    have no durable topic relationship and are therefore excluded.
    """
    node = (
        db.query(GsLmsSyllabusNode)
        .filter(GsLmsSyllabusNode.id == node_id)
        .one_or_none()
    )
    if node is None:
        return None

    row = (
        db.query(GsLmsEvaluationReport, GsLmsAnswerAttempt, GsLmsPyq)
        .join(
            GsLmsAnswerAttempt,
            GsLmsEvaluationReport.attempt_id == GsLmsAnswerAttempt.id,
        )
        .join(GsLmsPyq, GsLmsAnswerAttempt.pyq_id == GsLmsPyq.id)
        .filter(
            GsLmsAnswerAttempt.student_id == student_id,
            GsLmsAnswerAttempt.is_deleted.is_(False),
            GsLmsAnswerAttempt.status == GsLmsAnswerAttemptStatusEnum.EVALUATED,
            GsLmsEvaluationReport.student_id == student_id,
            GsLmsPyq.subject_id == node.subject_id,
            GsLmsPyq.syllabus_node_id == node_id,
            GsLmsPyq.exam_type == GsLmsExamTypeEnum.MAINS,
            GsLmsPyq.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsAnswerAttempt.id.desc())
        .first()
    )
    if row is None:
        return None

    report, attempt, pyq = row
    max_marks = report.max_marks or attempt.max_marks or pyq.marks
    return report.marks_awarded, max_marks


# ---------------------------------------------------------------------------
# Report Generation (Database-dependent)
# ---------------------------------------------------------------------------

def generate_growth_report(
    db: Session,
    student_id: int,
    node_id: int,
) -> GrowthReportData:
    """Aggregate all funnel data into a Growth Report.

    Queries: reading times, recall attempts, MCQ Lab results, weakness patterns,
    and the last 5 growth reports for trend comparison.
    Computes spaced repetition schedule.
    Identifies weaknesses.
    Persists the report snapshot.

    Returns:
        GrowthReportData with all computed metrics.
    """
    now = datetime.now(timezone.utc)
    today = now.date()

    # Get topic title
    node = db.query(GsLmsSyllabusNode).filter(
        GsLmsSyllabusNode.id == node_id
    ).first()
    topic_title = node.title if node else f"Topic {node_id}"

    # --- Gather Section Metrics ---
    # Only report sections that exist for this topic. A missing section is a
    # content-coverage fact, not a learner weakness, so inventing five rows
    # with zero scores would turn unread content into a false deficit.
    topic_sections = (
        db.query(GsLmsContentSection)
        .filter(GsLmsContentSection.syllabus_node_id == node_id)
        .order_by(GsLmsContentSection.display_order.asc())
        .all()
    )
    section_labels: List[str] = []
    for content_section in topic_sections:
        label = getattr(content_section.section_label, "value", content_section.section_label)
        if label and str(label) not in section_labels:
            section_labels.append(str(label))
    if not section_labels:
        section_labels = SECTION_LABELS

    section_metrics: List[SectionMetrics] = []

    for section_label in section_labels:
        # Get reading time
        reading_time = db.query(GsLmsReadingTime).filter(
            GsLmsReadingTime.student_id == student_id,
            GsLmsReadingTime.syllabus_node_id == node_id,
        ).join(GsLmsContentSection, GsLmsReadingTime.section_id == GsLmsContentSection.id).filter(
            GsLmsContentSection.section_label == section_label,
        ).first()

        has_reading_evidence = reading_time is not None
        duration = reading_time.duration_seconds if reading_time else 0
        estimated = reading_time.estimated_duration_seconds if reading_time and reading_time.estimated_duration_seconds else 300

        # Get latest recall attempt
        recall = (
            db.query(GsLmsRecallAttempt)
            .filter(
                GsLmsRecallAttempt.student_id == student_id,
                GsLmsRecallAttempt.syllabus_node_id == node_id,
                GsLmsRecallAttempt.section_label == section_label,
            )
            .order_by(GsLmsRecallAttempt.attempt_number.desc())
            .first()
        )

        has_recall_evidence = recall is not None
        recall_score = recall.recall_score if recall else 0.0
        confidence_score = recall.confidence_score if recall else 0.0

        section_metrics.append(SectionMetrics(
            section_label=section_label,
            reading_time_seconds=duration,
            recall_score=recall_score,
            confidence_score=confidence_score,
            is_rushed=has_reading_evidence and is_section_rushed(duration, estimated),
            has_reading_evidence=has_reading_evidence,
            has_recall_evidence=has_recall_evidence,
        ))

    # --- MCQ Lab Results ---
    mcq_session = (
        db.query(GsLmsMcqLabSession)
        .filter(
            GsLmsMcqLabSession.student_id == student_id,
            GsLmsMcqLabSession.syllabus_node_id == node_id,
            GsLmsMcqLabSession.submitted_at.isnot(None),
        )
        .order_by(GsLmsMcqLabSession.submitted_at.desc())
        .first()
    )

    # A missing session is "not recorded", not a zero score. Keep 0.0 for the
    # stored column, but carry the evidence flag so the API can say so.
    has_mcq_evidence = mcq_session is not None
    mcq_total_score = (
        round(mcq_session.score * 100, 1)
        if mcq_session and mcq_session.score is not None
        else 0.0
    )

    # Type breakdown from MCQ Lab attempts
    mcq_type_breakdown = []
    if mcq_session:
        attempts = (
            db.query(GsLmsMcqLabAttempt)
            .filter(GsLmsMcqLabAttempt.session_id == mcq_session.id)
            .all()
        )
        type_stats: dict = {}
        for a in attempts:
            correct, total = type_stats.get(a.question_type, (0, 0))
            total += 1
            if a.is_correct:
                correct += 1
            type_stats[a.question_type] = (correct, total)

        mcq_type_breakdown = [
            {
                "question_type": qtype,
                "total": total,
                "correct": correct,
                "accuracy": round((correct / total * 100) if total > 0 else 0, 1),
            }
            for qtype, (correct, total) in sorted(type_stats.items())
        ]

    # --- Mains Score (if attempted) ---
    mains_result = latest_mains_score(db, student_id, node_id)
    mains_score, mains_max_marks = mains_result or (None, None)

    # --- Spaced Repetition Schedule ---
    # Average only sections with a recorded recall attempt. Counting unevidenced
    # sections as zero would shorten the interval as a punishment for missing
    # evidence rather than for demonstrated forgetting.
    evidenced_recalls = [
        sm.recall_score for sm in section_metrics if sm.has_recall_evidence
    ]
    avg_recall = (
        sum(evidenced_recalls) / len(evidenced_recalls)
        if evidenced_recalls else 0.0
    )
    schedule = schedule_after_completion(avg_recall, today)

    # Persist spaced rep entry
    existing_schedule = db.query(GsLmsSpacedRepSchedule).filter(
        GsLmsSpacedRepSchedule.student_id == student_id,
        GsLmsSpacedRepSchedule.syllabus_node_id == node_id,
        GsLmsSpacedRepSchedule.sequence_number == 1,
    ).first()

    if not existing_schedule:
        sched_entry = GsLmsSpacedRepSchedule(
            student_id=student_id,
            syllabus_node_id=node_id,
            sequence_number=1,
            due_date=schedule.due_date,
            interval_days=schedule.recall_interval_days,
        )
        db.add(sched_entry)

    # --- Historical Comparison (last 5 reports) ---
    prior_reports = (
        db.query(GsLmsGrowthReport)
        .filter(
            GsLmsGrowthReport.student_id == student_id,
            GsLmsGrowthReport.syllabus_node_id != node_id,  # other topics
        )
        .order_by(GsLmsGrowthReport.generated_at.desc())
        .limit(5)
        .all()
    )

    comparison_data = None
    if prior_reports:
        # Trends include only topics with real evidence. Historical reports that
        # never recorded a recall or an MCQ attempt must not appear as zeros,
        # or the "improvement" line is measuring missing data.
        avg_recall_trend = []
        mcq_accuracy_trend = []
        for pr in reversed(prior_reports):
            avg_r = _snapshot_evidenced_recall_avg(pr.section_metrics or [])
            if avg_r is not None:
                avg_recall_trend.append(avg_r)
            if pr.mcq_type_breakdown:
                mcq_accuracy_trend.append(round((pr.mcq_total_score or 0), 1))

        # Add current topic's scores only where evidence exists.
        if evidenced_recalls:
            avg_recall_trend.append(round(avg_recall * 100, 1))
        if has_mcq_evidence:
            mcq_accuracy_trend.append(round(mcq_total_score, 1))

        comparison_data = {
            "avg_recall_trend": avg_recall_trend,
            "mcq_accuracy_trend": mcq_accuracy_trend,
            "report_count": len(prior_reports) + 1,
        }

    # --- Weakness Identification ---
    weakness_patterns_raw = (
        db.query(GsLmsWeaknessPattern)
        .filter(
            GsLmsWeaknessPattern.student_id == student_id,
            GsLmsWeaknessPattern.is_weak == True,
        )
        .all()
    )
    wp_dicts = [
        {"question_type": wp.question_type, "accuracy": wp.accuracy, "is_weak": wp.is_weak}
        for wp in weakness_patterns_raw
    ]

    weaknesses = identify_weaknesses(section_metrics, mcq_type_breakdown, wp_dicts)

    # --- Persist Growth Report ---
    report_record = GsLmsGrowthReport(
        student_id=student_id,
        syllabus_node_id=node_id,
        section_metrics=[
            {
                "section_label": sm.section_label,
                "reading_time_seconds": sm.reading_time_seconds,
                "recall_score": sm.recall_score,
                "confidence_score": sm.confidence_score,
                "is_rushed": sm.is_rushed,
                "has_reading_evidence": sm.has_reading_evidence,
                "has_recall_evidence": sm.has_recall_evidence,
            }
            for sm in section_metrics
        ],
        mcq_total_score=mcq_total_score,
        mcq_type_breakdown=mcq_type_breakdown,
        mains_score=mains_score,
        mains_max_marks=mains_max_marks,
        next_recall_date=schedule.due_date,
        recall_interval_days=schedule.recall_interval_days,
        weaknesses=[
            {
                "category": w.category,
                "label": w.label,
                "value": w.value,
                "recommended_action": w.recommended_action,
            }
            for w in weaknesses
        ],
        comparison_data=comparison_data,
        generated_at=now,
    )
    db.add(report_record)
    db.flush()

    return GrowthReportData(
        student_id=student_id,
        syllabus_node_id=node_id,
        topic_title=topic_title,
        generated_at=now,
        section_metrics=section_metrics,
        mcq_total_score=mcq_total_score,
        mcq_type_breakdown=mcq_type_breakdown,
        mains_score=mains_score,
        mains_max_marks=mains_max_marks,
        next_recall_date=schedule.due_date,
        recall_interval_days=schedule.recall_interval_days,
        comparison_data=comparison_data,
        weaknesses=weaknesses,
        has_mcq_evidence=has_mcq_evidence,
    )


# ---------------------------------------------------------------------------
# Exports
# ---------------------------------------------------------------------------

__all__ = [
    "SectionMetrics",
    "WeaknessItem",
    "GrowthReportData",
    "RUSHED_THRESHOLD",
    "is_section_rushed",
    "identify_weaknesses",
    "latest_mains_score",
    "generate_growth_report",
]
