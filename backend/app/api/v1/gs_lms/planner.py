"""Daily Planner endpoints for the GS LMS Platform.

Routes (mounted under /api/v1/gs-lms; auth-gated at the package router):
* GET /{subject_slug}/plan/today — Current day's plan with items + projected completion
* PUT /{subject_slug}/plan/bandwidth — Set/update daily bandwidth
* POST /{subject_slug}/plan/replan — Manual trigger replanning

Design properties enforced:
* Property 16 (position continuity): day plan contains min(B, remaining)
  items from current position in display order.
* Property 17 (replan trigger): replanning triggers on 2 consecutive misses.
* Property 18 (projected completion): today + ceil(R / B) days.

Requirements traced: 7.1, 7.2, 7.4, 7.5, 7.6
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user
from app.schemas.common import StandardResponse
from app.core.gs.models import GsSubject, GsReviewStatusEnum
from app.core.gs_lms.planner import (
    create_daily_plan,
    find_current_position,
    get_syllabus_plan_items,
    plan_eligible_ids,
    get_plan_history,
    record_replan_event,
    check_replan_needed,
    should_suggest_bandwidth_increase,
    compute_projected_completion,
    generate_day_plan,
)
from app.core.gs_lms.student_models import (
    GsLmsDailyPlan,
    GsLmsOnboardingStatus,
    GsLmsPracticeSession,
    GsLmsPracticeSessionStatusEnum,
    GsLmsReplanEvent,
    GsLmsRevisitSchedule,
    GsLmsStudentSectionProgress,
    GsLmsWeeklyRetro,
)
from app.core.gs_lms.funnel_models import GsLmsMcqLabSession
from app.core.gs_lms.models import GsLmsSyllabusNode, GsLmsContentSection, GsLmsPyq
from app.api.v1.gs_lms.dependencies import resolve_subject
from app.api.v1.gs_lms.schemas import (
    GsLmsDailyPlanOut,
    GsLmsPlanItemOut,
    GsLmsBandwidthIn,
    GsLmsReplanOut,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_student_bandwidth(db: Session, student_id: int) -> int:
    """Get the student's configured bandwidth from onboarding or most recent plan.

    Priority: onboarding bandwidth_selected > most recent daily plan bandwidth > default 3.
    """
    # Check onboarding bandwidth selection first.
    onboarding = (
        db.query(GsLmsOnboardingStatus)
        .filter(GsLmsOnboardingStatus.student_id == student_id)
        .first()
    )
    if onboarding is not None and onboarding.bandwidth_selected is not None:
        return onboarding.bandwidth_selected

    # Fall back to most recent daily plan.
    latest_plan = (
        db.query(GsLmsDailyPlan)
        .filter(GsLmsDailyPlan.student_id == student_id)
        .order_by(GsLmsDailyPlan.plan_date.desc())
        .first()
    )
    if latest_plan is not None:
        return latest_plan.bandwidth

    # Default bandwidth.
    return 3


def _get_today_plan(db: Session, student_id: int) -> GsLmsDailyPlan | None:
    """Get today's existing plan for the student, or None."""
    today = date.today()
    return (
        db.query(GsLmsDailyPlan)
        .filter(
            GsLmsDailyPlan.student_id == student_id,
            GsLmsDailyPlan.plan_date == today,
        )
        .first()
    )


def _count_completed_items(plan: GsLmsDailyPlan) -> int:
    """Count completed items in a plan."""
    completed_items = plan.completed_items or []
    return len(completed_items)


def _compute_streak(db: Session, student_id: int) -> int:
    """Compute the current streak of consecutive target-met days."""
    plans = (
        db.query(GsLmsDailyPlan)
        .filter(
            GsLmsDailyPlan.student_id == student_id,
            GsLmsDailyPlan.is_target_met == True,  # noqa: E712
        )
        .order_by(GsLmsDailyPlan.plan_date.desc())
        .all()
    )
    # Count consecutive target-met days from most recent backwards.
    # We need all plans ordered by date to check actual consecutiveness.
    all_plans = (
        db.query(GsLmsDailyPlan)
        .filter(GsLmsDailyPlan.student_id == student_id)
        .order_by(GsLmsDailyPlan.plan_date.desc())
        .all()
    )
    streak = 0
    for plan in all_plans:
        if plan.is_target_met is True:
            streak += 1
        elif plan.is_target_met is False:
            break
        # Skip plans with is_target_met = None (today's plan, not yet evaluated)
    return streak


def _get_due_revisit_items(
    db: Session, student_id: int, subject_id: int
) -> list[GsLmsPlanItemOut]:
    """Fetch today's due revisits for the requested subject."""
    today = date.today()
    revisits = (
        db.query(GsLmsRevisitSchedule)
        .join(
            GsLmsSyllabusNode,
            GsLmsSyllabusNode.id == GsLmsRevisitSchedule.syllabus_node_id,
        )
        .filter(
            GsLmsRevisitSchedule.student_id == student_id,
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsRevisitSchedule.due_date <= today,
            GsLmsRevisitSchedule.completed == False,  # noqa: E712
        )
        .order_by(GsLmsRevisitSchedule.due_date.asc())
        .all()
    )

    items: list[GsLmsPlanItemOut] = []
    for r in revisits:
        node = db.query(GsLmsSyllabusNode).filter(GsLmsSyllabusNode.id == r.syllabus_node_id).one_or_none()
        title = f"🔄 {node.title}" if node else "🔄 Quick Recall"
        items.append(
            GsLmsPlanItemOut(
                node_id=r.syllabus_node_id,
                title=title,
                item_type="revisit",
                completed=False,
                revisit_id=r.id,
                revisit_type=r.revisit_type,
                overdue=r.due_date < today,
            )
        )
    return items


def _plan_to_response(
    plan: GsLmsDailyPlan,
    streak_days: int,
    revisit_items: list[GsLmsPlanItemOut] | None = None,
    db: Session | None = None,
    subject_id: int | None = None,
) -> GsLmsDailyPlanOut:
    """Convert a GsLmsDailyPlan DB record to the response schema."""
    planned_items = plan.planned_items or []
    completed_items = plan.completed_items or []
    completed_count = len(completed_items)

    # Where each topic sits in the plan-eligible sequence, plus the reviewed
    # PYQ evidence behind it. This is what tells a learner why today's items
    # were chosen instead of just naming them.
    sequence_by_node: dict[int, int] = {}
    sequence_total: int | None = None
    pyq_counts: dict[int, tuple[int, int]] = {}
    if db is not None and subject_id is not None:
        eligible_items = get_syllabus_plan_items(db, subject_id)
        sequence_total = len(eligible_items)
        sequence_by_node = {
            item.node_id: index
            for index, item in enumerate(eligible_items, start=1)
        }
        section_ids = [
            item["node_id"]
            for item in planned_items
            if item.get("type", "section") == "section"
        ]
        if section_ids:
            for node_id, exam_type, total in (
                db.query(
                    GsLmsPyq.syllabus_node_id,
                    GsLmsPyq.exam_type,
                    func.count(GsLmsPyq.id),
                )
                .filter(
                    GsLmsPyq.syllabus_node_id.in_(section_ids),
                    GsLmsPyq.review_status == GsReviewStatusEnum.REVIEWED,
                )
                .group_by(GsLmsPyq.syllabus_node_id, GsLmsPyq.exam_type)
                .all()
            ):
                raw_type = (
                    exam_type.value if hasattr(exam_type, "value") else str(exam_type)
                )
                prelims, mains = pyq_counts.get(node_id, (0, 0))
                if raw_type.upper() == "PRELIMS":
                    prelims += int(total)
                else:
                    mains += int(total)
                pyq_counts[node_id] = (prelims, mains)

    items_out = []
    # Build a set of completed node_ids for fast lookup.
    completed_node_ids = {item["node_id"] for item in completed_items}

    for item in planned_items:
        node_id = item["node_id"]
        is_completed = node_id in completed_node_ids
        # Find completed_at if available.
        completed_at = None
        if is_completed:
            for ci in completed_items:
                if ci["node_id"] == node_id:
                    completed_at = ci.get("completed_at")
                    break

        prelims_pyqs, mains_pyqs = pyq_counts.get(node_id, (0, 0))
        items_out.append(
            GsLmsPlanItemOut(
                node_id=node_id,
                title=item.get("title", f"Topic {node_id}"),
                item_type=item.get("type", "section"),
                completed=is_completed,
                completed_at=completed_at,
                sequence_position=sequence_by_node.get(node_id),
                sequence_total=sequence_total,
                prelims_pyq_count=prelims_pyqs,
                mains_pyq_count=mains_pyqs,
            )
        )

    # Prepend due revisit items (they appear at top of plan)
    if revisit_items:
        items_out = revisit_items + items_out

    # Inject weekly retro item on every 7th plan day
    all_plans_count = (
        db.query(func.count(GsLmsDailyPlan.id))
        .filter(GsLmsDailyPlan.student_id == plan.student_id)
        .scalar()
    ) if db else 0
    if all_plans_count and all_plans_count % 7 == 0:
        retro_completed = False
        retro_completed_at = None
        target_week = max(1, all_plans_count // 7)
        if db:
            retro_record = (
                db.query(GsLmsWeeklyRetro)
                .filter(
                    GsLmsWeeklyRetro.student_id == plan.student_id,
                    GsLmsWeeklyRetro.week_number == target_week,
                    GsLmsWeeklyRetro.completed == True,
                )
                .first()
            )
            if not retro_record:
                retro_record = (
                    db.query(GsLmsWeeklyRetro)
                    .filter(
                        GsLmsWeeklyRetro.student_id == plan.student_id,
                        GsLmsWeeklyRetro.plan_date == plan.plan_date,
                        GsLmsWeeklyRetro.completed == True,
                    )
                    .first()
                )
            if retro_record:
                retro_completed = True
                if retro_record.completed_at:
                    retro_completed_at = retro_record.completed_at.isoformat()

        items_out.append(
            GsLmsPlanItemOut(
                node_id=0,
                title="📝 Weekly Retrospective",
                item_type="retro",
                completed=retro_completed,
                completed_at=retro_completed_at,
            )
        )

    projected_date = None
    if plan.projected_completion_date is not None:
        projected_date = plan.projected_completion_date.isoformat()

    return GsLmsDailyPlanOut(
        plan_date=plan.plan_date.isoformat(),
        bandwidth=plan.bandwidth,
        planned_items=items_out,
        completed_count=completed_count,
        is_target_met=plan.is_target_met,
        projected_completion_date=projected_date,
        streak_days=streak_days,
    )


def evaluate_and_update_plans(db: Session, student_id: int, subject_id: int) -> None:
    """Evaluate past plans, update target milestones, and dynamically adjust bandwidth."""
    today = date.today()

    # Get student's configured bandwidth
    current_bandwidth = _get_student_bandwidth(db, student_id)

    # 1. Fetch all plans for this student
    plans = (
        db.query(GsLmsDailyPlan)
        .filter(GsLmsDailyPlan.student_id == student_id)
        .order_by(GsLmsDailyPlan.plan_date.asc())
        .all()
    )

    updated_any = False

    for plan in plans:
        planned_items = plan.planned_items or []
        completed_items = []

        for item in planned_items:
            node_id = item.get("node_id")
            item_type = item.get("type", "section")

            is_completed = False
            completed_at_str = None

            if item_type == "section":
                total_sections = (
                    db.query(GsLmsContentSection)
                    .filter(
                        GsLmsContentSection.syllabus_node_id == node_id,
                        GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
                    )
                    .count()
                )
                progress_count = (
                    db.query(GsLmsStudentSectionProgress)
                    .filter(
                        GsLmsStudentSectionProgress.student_id == student_id,
                        GsLmsStudentSectionProgress.syllabus_node_id == node_id,
                        GsLmsStudentSectionProgress.completed == True,
                    )
                    .count()
                )
                if total_sections > 0 and progress_count >= total_sections:
                    is_completed = True
                    latest_progress = (
                        db.query(GsLmsStudentSectionProgress)
                        .filter(
                            GsLmsStudentSectionProgress.student_id == student_id,
                            GsLmsStudentSectionProgress.syllabus_node_id == node_id,
                            GsLmsStudentSectionProgress.completed == True,
                        )
                        .order_by(GsLmsStudentSectionProgress.completed_at.desc())
                        .first()
                    )
                    if latest_progress and latest_progress.completed_at:
                        completed_at_str = latest_progress.completed_at.isoformat()

            elif item_type == "revisit":
                revisit = (
                    db.query(GsLmsRevisitSchedule)
                    .filter(
                        GsLmsRevisitSchedule.student_id == student_id,
                        GsLmsRevisitSchedule.syllabus_node_id == node_id,
                        GsLmsRevisitSchedule.completed == True,
                    )
                    .first()
                )
                if revisit:
                    is_completed = True
                    if revisit.updated_at:
                        completed_at_str = revisit.updated_at.isoformat()

            elif item_type == "retro":
                all_plans_cnt = (
                    db.query(func.count(GsLmsDailyPlan.id))
                    .filter(GsLmsDailyPlan.student_id == student_id)
                    .scalar()
                ) or 1
                cur_week = max(1, all_plans_cnt // 7)
                retro = (
                    db.query(GsLmsWeeklyRetro)
                    .filter(
                        GsLmsWeeklyRetro.student_id == student_id,
                        GsLmsWeeklyRetro.week_number == cur_week,
                        GsLmsWeeklyRetro.completed == True,
                    )
                    .first()
                )
                if not retro:
                    retro = (
                        db.query(GsLmsWeeklyRetro)
                        .filter(
                            GsLmsWeeklyRetro.student_id == student_id,
                            GsLmsWeeklyRetro.plan_date == plan.plan_date,
                            GsLmsWeeklyRetro.completed == True,
                        )
                        .first()
                    )
                if retro:
                    is_completed = True
                    if retro.completed_at:
                        completed_at_str = retro.completed_at.isoformat()

            elif item_type == "practice":
                practice = (
                    db.query(GsLmsPracticeSession)
                    .filter(
                        GsLmsPracticeSession.student_id == student_id,
                        GsLmsPracticeSession.syllabus_node_id == node_id,
                        GsLmsPracticeSession.status == GsLmsPracticeSessionStatusEnum.SUBMITTED,
                    )
                    .order_by(GsLmsPracticeSession.submitted_at.desc())
                    .first()
                )
                if practice:
                    is_completed = True
                    if practice.submitted_at:
                        completed_at_str = practice.submitted_at.isoformat()
                else:
                    lab = (
                        db.query(GsLmsMcqLabSession)
                        .filter(
                            GsLmsMcqLabSession.student_id == student_id,
                            GsLmsMcqLabSession.syllabus_node_id == node_id,
                        )
                        .order_by(GsLmsMcqLabSession.submitted_at.desc())
                        .first()
                    )
                    if lab:
                        is_completed = True
                        if lab.submitted_at:
                            completed_at_str = lab.submitted_at.isoformat()

            if is_completed:
                completed_items.append({
                    "node_id": node_id,
                    "type": item_type,
                    "completed_at": completed_at_str or datetime.now(timezone.utc).isoformat()
                })

        # Update completed_items
        plan.completed_items = completed_items

        # If it's a past plan and target status is not set, evaluate it
        if plan.plan_date < today and plan.is_target_met is None:
            all_completed = len(completed_items) >= len(planned_items) and len(planned_items) > 0
            plan.is_target_met = all_completed
            updated_any = True

    if updated_any:
        db.flush()

        # Fetch fresh chronological history
        history = get_plan_history(db, student_id)

        # Check if bandwidth needs auto-replan (decrease)
        if check_replan_needed(history):
            if current_bandwidth > 1:
                new_bandwidth = current_bandwidth - 1

                onboarding = db.query(GsLmsOnboardingStatus).filter(GsLmsOnboardingStatus.student_id == student_id).first()
                if onboarding:
                    onboarding.bandwidth_selected = new_bandwidth

                today_plan = _get_today_plan(db, student_id)
                if today_plan:
                    today_plan.bandwidth = new_bandwidth
                    syllabus_items = get_syllabus_plan_items(db, subject_id)
                    current_position = find_current_position(db, student_id, subject_id)
                    day_plan = generate_day_plan(syllabus_items, current_position, new_bandwidth)
                    today_plan.planned_items = [
                        {"node_id": item.node_id, "type": item.item_type, "title": item.title}
                        for item in day_plan.items
                    ]
                    today_plan.projected_completion_date = day_plan.projected_completion

                record_replan_event(
                    db=db,
                    student_id=student_id,
                    reason="consecutive_misses",
                    old_bandwidth=current_bandwidth,
                    new_bandwidth=new_bandwidth,
                )

        # Check if bandwidth should increase
        elif should_suggest_bandwidth_increase(history):
            if current_bandwidth < 5:
                new_bandwidth = current_bandwidth + 1

                onboarding = db.query(GsLmsOnboardingStatus).filter(GsLmsOnboardingStatus.student_id == student_id).first()
                if onboarding:
                    onboarding.bandwidth_selected = new_bandwidth

                today_plan = _get_today_plan(db, student_id)
                if today_plan:
                    today_plan.bandwidth = new_bandwidth
                    syllabus_items = get_syllabus_plan_items(db, subject_id)
                    current_position = find_current_position(db, student_id, subject_id)
                    day_plan = generate_day_plan(syllabus_items, current_position, new_bandwidth)
                    today_plan.planned_items = [
                        {"node_id": item.node_id, "type": item.item_type, "title": item.title}
                        for item in day_plan.items
                    ]
                    today_plan.projected_completion_date = day_plan.projected_completion

                record_replan_event(
                    db=db,
                    student_id=student_id,
                    reason="bandwidth_increase",
                    old_bandwidth=current_bandwidth,
                    new_bandwidth=new_bandwidth,
                )
        db.flush()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/plan/today")
def get_today_plan(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return today's plan for the authenticated student.

    Creates a new plan for today if one doesn't exist yet. Includes
    planned items, completion count, target status, projected completion,
    and streak info.

    Requirements: 7.1, 7.2, 7.5, 7.6
    """
    student_id = current_user.id

    # Auto-evaluate past plans and dynamic bandwidth calibration first
    evaluate_and_update_plans(db, student_id, subject.id)

    # Check if today's plan already exists.
    plan = _get_today_plan(db, student_id)

    if plan is None:
        # Create a new plan for today.
        bandwidth = _get_student_bandwidth(db, student_id)
        plan = create_daily_plan(
            db=db,
            student_id=student_id,
            subject_id=subject.id,
            bandwidth=bandwidth,
        )
        # Enrich planned_items with titles from syllabus items.
        syllabus_items = get_syllabus_plan_items(db, subject.id)
        item_titles = {item.node_id: item.title for item in syllabus_items}
        enriched_items = []
        for item in (plan.planned_items or []):
            enriched_items.append({
                "node_id": item["node_id"],
                "type": item.get("type", "section"),
                "title": item_titles.get(item["node_id"], f"Topic {item['node_id']}"),
            })
        plan.planned_items = enriched_items
        db.flush()
        db.commit()
    else:
        # A plan saved before the beta scope tightened can still name topics
        # the gate rejects. Regenerate today's items from the scoped sequence
        # so the learner is never sent into a locked topic.
        eligible_ids = plan_eligible_ids(db, subject.id)
        planned_ids = {
            item.get("node_id")
            for item in (plan.planned_items or [])
            if item.get("type", "section") == "section"
        }
        if eligible_ids is not None and not planned_ids <= eligible_ids:
            syllabus_items = get_syllabus_plan_items(db, subject.id)
            current_position = find_current_position(db, student_id, subject.id)
            day_plan = generate_day_plan(syllabus_items, current_position, plan.bandwidth)
            plan.planned_items = [
                {"node_id": item.node_id, "type": item.item_type, "title": item.title}
                for item in day_plan.items
            ]
            plan.projected_completion_date = day_plan.projected_completion
        db.commit()

    streak = _compute_streak(db, student_id)
    revisit_items = _get_due_revisit_items(db, student_id, subject.id)
    data = _plan_to_response(plan, streak, revisit_items, db, subject.id)

    return StandardResponse(
        success=True,
        message="Today's plan retrieved",
        data=data,
    )


@router.put("/plan/bandwidth")
def update_bandwidth(
    payload: GsLmsBandwidthIn,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Set or update the student's daily bandwidth.

    Validates bandwidth > 0, updates the student's bandwidth in onboarding,
    and creates/updates today's plan with the new bandwidth.

    Requirements: 7.1, 7.6
    """
    student_id = current_user.id
    new_bandwidth = payload.bandwidth

    # Validate bandwidth > 0 (Pydantic does this via gt=0, but be explicit).
    if new_bandwidth <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Bandwidth must be a positive integer",
        )

    # Update onboarding record if it exists.
    onboarding = (
        db.query(GsLmsOnboardingStatus)
        .filter(GsLmsOnboardingStatus.student_id == student_id)
        .first()
    )
    if onboarding is not None:
        onboarding.bandwidth_selected = new_bandwidth
    else:
        # Create a minimal onboarding record with the bandwidth.
        onboarding = GsLmsOnboardingStatus(
            student_id=student_id,
            completed=False,
            bandwidth_selected=new_bandwidth,
        )
        db.add(onboarding)

    # Check if today's plan exists — update or create.
    today_plan = _get_today_plan(db, student_id)

    if today_plan is not None:
        # Update existing plan with new bandwidth and regenerate items.
        old_bandwidth = today_plan.bandwidth
        syllabus_items = get_syllabus_plan_items(db, subject.id)
        current_position = find_current_position(db, student_id, subject.id)
        day_plan = generate_day_plan(syllabus_items, current_position, new_bandwidth)

        planned_items_json = [
            {
                "node_id": item.node_id,
                "type": item.item_type,
                "title": item.title,
            }
            for item in day_plan.items
        ]

        today_plan.bandwidth = new_bandwidth
        today_plan.planned_items = planned_items_json
        today_plan.projected_completion_date = day_plan.projected_completion
    else:
        # Create a new plan for today with the new bandwidth.
        plan = create_daily_plan(
            db=db,
            student_id=student_id,
            subject_id=subject.id,
            bandwidth=new_bandwidth,
        )
        # Enrich with titles.
        syllabus_items = get_syllabus_plan_items(db, subject.id)
        item_titles = {item.node_id: item.title for item in syllabus_items}
        enriched_items = []
        for item in (plan.planned_items or []):
            enriched_items.append({
                "node_id": item["node_id"],
                "type": item.get("type", "section"),
                "title": item_titles.get(item["node_id"], f"Topic {item['node_id']}"),
            })
        plan.planned_items = enriched_items

    db.commit()

    # Re-fetch today's plan for the response.
    today_plan = _get_today_plan(db, student_id)
    streak = _compute_streak(db, student_id)
    revisit_items = _get_due_revisit_items(db, student_id, subject.id)
    data = _plan_to_response(today_plan, streak, revisit_items, db, subject.id)

    return StandardResponse(
        success=True,
        message="Bandwidth updated successfully",
        data=data,
    )


@router.post("/plan/replan")
def trigger_replan(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Manually trigger replanning.

    Unifying with non-hardcoded geography logic.
    """
    student_id = current_user.id

    # Get current bandwidth.
    current_bandwidth = _get_student_bandwidth(db, student_id)

    # Get current projected completion.
    syllabus_items = get_syllabus_plan_items(db, subject.id)
    current_position = find_current_position(db, student_id, subject.id)
    remaining = max(0, len(syllabus_items) - current_position)
    old_projected = compute_projected_completion(remaining, current_bandwidth)

    # For manual replan, bandwidth stays the same but plan is regenerated.
    new_bandwidth = current_bandwidth
    new_projected = compute_projected_completion(remaining, new_bandwidth)

    # Record the replan event.
    event = record_replan_event(
        db=db,
        student_id=student_id,
        reason="manual",
        old_bandwidth=current_bandwidth,
        new_bandwidth=new_bandwidth,
        old_projected_date=old_projected,
        new_projected_date=new_projected,
    )

    # Regenerate today's plan.
    today_plan = _get_today_plan(db, student_id)
    if today_plan is not None:
        # Regenerate from current position.
        day_plan = generate_day_plan(syllabus_items, current_position, new_bandwidth)
        planned_items_json = [
            {
                "node_id": item.node_id,
                "type": item.item_type,
                "title": item.title,
            }
            for item in day_plan.items
        ]
        today_plan.planned_items = planned_items_json
        today_plan.projected_completion_date = day_plan.projected_completion
    else:
        # Create a new plan for today.
        plan = create_daily_plan(
            db=db,
            student_id=student_id,
            subject_id=subject.id,
            bandwidth=new_bandwidth,
        )
        # Enrich with titles.
        item_titles = {item.node_id: item.title for item in syllabus_items}
        enriched_items = []
        for item in (plan.planned_items or []):
            enriched_items.append({
                "node_id": item["node_id"],
                "type": item.get("type", "section"),
                "title": item_titles.get(item["node_id"], f"Topic {item['node_id']}"),
            })
        plan.planned_items = enriched_items

    db.commit()

    # Build response.
    data = GsLmsReplanOut(
        reason="manual",
        old_bandwidth=current_bandwidth,
        new_bandwidth=new_bandwidth,
        old_projected_date=old_projected.isoformat() if old_projected else None,
        new_projected_date=new_projected.isoformat() if new_projected else None,
        triggered_at=event.triggered_at.isoformat() if event.triggered_at else datetime.now(timezone.utc).isoformat(),
    )

    return StandardResponse(
        success=True,
        message="Replanning triggered successfully",
        data=data,
    )
