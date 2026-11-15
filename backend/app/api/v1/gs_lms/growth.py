"""Growth Report and Spaced Repetition endpoints for the Interactive Learning Funnel.

Routes (mounted under /api/v1/gs-lms/{subject_slug}; auth-gated at package router):
* GET /funnel/{node_id}/growth-report — Generate or retrieve Growth Report
* GET /spaced-rep/upcoming — Return recall sessions within 30 days
* POST /spaced-rep/{schedule_id}/complete — Mark recall session complete
* GET /weakness-pattern — Return student's per-type accuracy pattern
* GET /topics/{node_id}/external-resources — Return reviewed resources

Requirements traced: 9.1, 9.6, 10.7, 10.8, 12.4, 12.5, 12.6
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user
from app.core.gs.models import GsSubject
from app.core.gs_lms.models import GsLmsSyllabusNode
from app.core.gs_lms.funnel_models import (
    GsLmsGrowthReport,
    GsLmsSpacedRepSchedule,
    GsLmsWeaknessPattern,
    GsLmsExternalResource,
)
from app.core.gs_lms.growth_report import generate_growth_report, latest_mains_score
from app.core.gs_lms.spaced_repetition import compute_next_interval
from app.api.v1.gs_lms.dependencies import resolve_subject


router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SectionMetricOut(BaseModel):
    section_label: str
    reading_time_seconds: int
    recall_score: float
    confidence_score: float
    is_rushed: bool
    # None means the snapshot predates evidence tracking; the client must not
    # read that as "not attempted". New snapshots always send a boolean.
    has_reading_evidence: bool | None = None
    has_recall_evidence: bool | None = None


class WeaknessOut(BaseModel):
    category: str
    label: str
    value: float
    recommended_action: str


class ComparisonOut(BaseModel):
    avg_recall_trend: List[float]
    mcq_accuracy_trend: List[float]
    report_count: int


class GrowthReportOut(BaseModel):
    topic_title: str
    generated_at: str
    section_metrics: List[SectionMetricOut]
    mcq_total_score: float
    # False means the MCQ Lab was never submitted for this topic; the score is
    # then a placeholder, not a failed attempt.
    has_mcq_evidence: bool = False
    mcq_type_breakdown: List[dict]
    mains_score: float | None
    mains_max_marks: int | None
    next_recall_date: str
    recall_interval_days: int
    comparison: ComparisonOut | None
    weaknesses: List[WeaknessOut]


class UpcomingRecallOut(BaseModel):
    schedule_id: int
    node_id: int
    title: str
    due_date: str
    interval_days: int


class WeaknessPatternOut(BaseModel):
    question_type: str
    accuracy: float
    total_attempts: int
    is_weak: bool


class ExternalResourceOut(BaseModel):
    id: int
    section_label: str
    title: str
    source_name: str
    url: str
    relevance_description: str | None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/funnel/{node_id}/growth-report", response_model=GrowthReportOut)
def get_growth_report(
    node_id: int,
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate or retrieve the Growth Report for a completed topic."""
    node = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.id == node_id,
            GsLmsSyllabusNode.subject_id == subject.id,
        )
        .one_or_none()
    )
    if node is None:
        raise HTTPException(status_code=404, detail="Topic node not found")

    # Check if report already exists
    existing = (
        db.query(GsLmsGrowthReport)
        .filter(
            GsLmsGrowthReport.student_id == current_user.id,
            GsLmsGrowthReport.syllabus_node_id == node_id,
        )
        .order_by(GsLmsGrowthReport.generated_at.desc())
        .first()
    )

    if existing:
        # Older snapshots may predate Mains evaluation. Reconcile only the
        # nullable Mains fields from the same scoped source; leave all other
        # snapshot metrics unchanged.
        if existing.mains_score is None:
            mains_result = latest_mains_score(db, current_user.id, node_id)
            if mains_result is not None:
                existing.mains_score, existing.mains_max_marks = mains_result
                db.commit()

        comparison = None
        if existing.comparison_data:
            comparison = ComparisonOut(**existing.comparison_data)

        # Snapshots store section scores as 0.0–1.0 fractions. The API contract
        # is percentage-based, so an existing snapshot must be scaled exactly
        # like a freshly generated one or a revisit shows "0.7%".
        section_metrics = []
        for sm in existing.section_metrics or []:
            reading_seconds = int(sm.get("reading_time_seconds") or 0)
            raw_recall = float(sm.get("recall_score") or 0.0)
            raw_confidence = float(sm.get("confidence_score") or 0.0)
            has_reading = sm.get("has_reading_evidence")
            if has_reading is None:
                # Older snapshots cannot distinguish "unread" from "not
                # tracked"; only a positive duration is safe evidence.
                has_reading = reading_seconds > 0
            has_recall = sm.get("has_recall_evidence")
            if has_recall is None:
                has_recall = raw_recall > 0
            section_metrics.append(SectionMetricOut(
                section_label=sm.get("section_label", ""),
                reading_time_seconds=reading_seconds,
                recall_score=round(raw_recall * 100, 1),
                confidence_score=round(raw_confidence * 100, 1),
                is_rushed=bool(sm.get("is_rushed")) and bool(has_reading),
                has_reading_evidence=bool(has_reading),
                has_recall_evidence=bool(has_recall),
            ))

        return GrowthReportOut(
            topic_title=existing.syllabus_node.title if existing.syllabus_node else f"Topic {node_id}",
            generated_at=existing.generated_at.isoformat(),
            section_metrics=section_metrics,
            mcq_total_score=existing.mcq_total_score,
            # A submitted session always produced a type breakdown; legacy
            # snapshots without one never recorded an MCQ attempt.
            has_mcq_evidence=bool(existing.mcq_type_breakdown),
            mcq_type_breakdown=existing.mcq_type_breakdown or [],
            mains_score=existing.mains_score,
            mains_max_marks=existing.mains_max_marks,
            next_recall_date=existing.next_recall_date.isoformat() if existing.next_recall_date else "",
            recall_interval_days=existing.recall_interval_days,
            comparison=comparison,
            weaknesses=[WeaknessOut(**w) for w in (existing.weaknesses or [])],
        )

    # Generate new report
    report_data = generate_growth_report(db, current_user.id, node_id)
    db.commit()

    comparison = None
    if report_data.comparison_data:
        comparison = ComparisonOut(**report_data.comparison_data)

    return GrowthReportOut(
        topic_title=report_data.topic_title,
        generated_at=report_data.generated_at.isoformat(),
        section_metrics=[
            SectionMetricOut(
                section_label=sm.section_label,
                reading_time_seconds=sm.reading_time_seconds,
                recall_score=round(sm.recall_score * 100, 1),
                confidence_score=round(sm.confidence_score * 100, 1),
                is_rushed=sm.is_rushed,
                has_reading_evidence=sm.has_reading_evidence,
                has_recall_evidence=sm.has_recall_evidence,
            )
            for sm in report_data.section_metrics
        ],
        mcq_total_score=report_data.mcq_total_score,
        has_mcq_evidence=report_data.has_mcq_evidence,
        mcq_type_breakdown=report_data.mcq_type_breakdown,
        mains_score=report_data.mains_score,
        mains_max_marks=report_data.mains_max_marks,
        next_recall_date=report_data.next_recall_date.isoformat(),
        recall_interval_days=report_data.recall_interval_days,
        comparison=comparison,
        weaknesses=[
            WeaknessOut(
                category=w.category,
                label=w.label,
                value=w.value,
                recommended_action=w.recommended_action,
            )
            for w in report_data.weaknesses
        ],
    )


@router.get("/spaced-rep/upcoming", response_model=List[UpcomingRecallOut])
def get_upcoming_recalls(
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get recall sessions scheduled within the next 30 days."""
    today = date.today()
    cutoff = today + timedelta(days=30)

    schedules = (
        db.query(GsLmsSpacedRepSchedule)
        .join(
            GsLmsSyllabusNode,
            GsLmsSyllabusNode.id == GsLmsSpacedRepSchedule.syllabus_node_id,
        )
        .filter(
            GsLmsSpacedRepSchedule.student_id == current_user.id,
            GsLmsSyllabusNode.subject_id == subject.id,
            GsLmsSpacedRepSchedule.completed == False,
            GsLmsSpacedRepSchedule.due_date >= today,
            GsLmsSpacedRepSchedule.due_date <= cutoff,
        )
        .order_by(GsLmsSpacedRepSchedule.due_date.asc())
        .all()
    )

    results = []
    for sched in schedules:
        node = db.query(GsLmsSyllabusNode).filter(
            GsLmsSyllabusNode.id == sched.syllabus_node_id
        ).first()
        results.append(UpcomingRecallOut(
            schedule_id=sched.id,
            node_id=sched.syllabus_node_id,
            title=node.title if node else f"Topic {sched.syllabus_node_id}",
            due_date=sched.due_date.isoformat(),
            interval_days=sched.interval_days,
        ))

    return results


@router.post("/spaced-rep/{schedule_id}/complete", status_code=200)
def complete_recall_session(
    schedule_id: int,
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a recall session as complete and schedule the next one."""
    sched = db.query(GsLmsSpacedRepSchedule).join(
        GsLmsSyllabusNode,
        GsLmsSyllabusNode.id == GsLmsSpacedRepSchedule.syllabus_node_id,
    ).filter(
        GsLmsSpacedRepSchedule.id == schedule_id,
        GsLmsSpacedRepSchedule.student_id == current_user.id,
        GsLmsSyllabusNode.subject_id == subject.id,
    ).first()

    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if sched.completed:
        raise HTTPException(status_code=409, detail="Already completed")

    # Mark complete (recall_score would be set by the recall check process)
    now = datetime.now(timezone.utc)
    sched.completed = True
    sched.completed_at = now

    # Get previous score for interval calculation
    prev_sched = (
        db.query(GsLmsSpacedRepSchedule)
        .filter(
            GsLmsSpacedRepSchedule.student_id == current_user.id,
            GsLmsSpacedRepSchedule.syllabus_node_id == sched.syllabus_node_id,
            GsLmsSpacedRepSchedule.sequence_number == sched.sequence_number - 1,
        )
        .first()
    )
    previous_score = prev_sched.recall_score if prev_sched else None
    current_score = sched.recall_score or 0.5  # default if no score set

    # Compute next interval
    next_interval = compute_next_interval(sched.interval_days, current_score, previous_score)
    next_due = now.date() + timedelta(days=next_interval)

    # Create next schedule entry
    next_entry = GsLmsSpacedRepSchedule(
        student_id=current_user.id,
        syllabus_node_id=sched.syllabus_node_id,
        sequence_number=sched.sequence_number + 1,
        due_date=next_due,
        interval_days=next_interval,
    )
    db.add(next_entry)
    db.commit()

    return {"next_due_date": next_due.isoformat(), "next_interval_days": next_interval}


@router.get("/weakness-pattern", response_model=List[WeaknessPatternOut])
def get_weakness_pattern(
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get student's per-type accuracy weakness pattern."""
    patterns = (
        db.query(GsLmsWeaknessPattern)
        .filter(GsLmsWeaknessPattern.student_id == current_user.id)
        .all()
    )

    return [
        WeaknessPatternOut(
            question_type=p.question_type,
            accuracy=round(p.accuracy * 100, 1),
            total_attempts=p.total_attempts,
            is_weak=p.is_weak,
        )
        for p in patterns
    ]


@router.get("/topics/{node_id}/external-resources", response_model=List[ExternalResourceOut])
def get_external_resources(
    node_id: int,
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get curated external reading resources for a topic (max 5, REVIEWED only)."""
    node = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.id == node_id,
            GsLmsSyllabusNode.subject_id == subject.id,
        )
        .one_or_none()
    )
    if node is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    resources = (
        db.query(GsLmsExternalResource)
        .filter(
            GsLmsExternalResource.syllabus_node_id == node_id,
            GsLmsExternalResource.review_status == "REVIEWED",
        )
        .order_by(GsLmsExternalResource.display_order.asc())
        .limit(5)
        .all()
    )

    return [
        ExternalResourceOut(
            id=r.id,
            section_label=r.section_label,
            title=r.title,
            source_name=r.source_name,
            url=r.url,
            relevance_description=r.relevance_description,
        )
        for r in resources
    ]
