from __future__ import annotations

import logging
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import case, func, inspect as sa_inspect
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.beta_scope import beta_scope_enabled, compute_loop_ready_ids
from app.core.gs_lms.funnel_models import GsLmsMcqLabAttempt, GsLmsMcqLabSession
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsSyllabusNode,
)
from app.core.gs_lms.recall_scoring import extract_key_concepts
from app.core.gs_lms.spaced_repetition import compute_initial_interval
from app.core.gs_lms.student_models import (
    GsLmsPracticeAttempt,
    GsLmsPracticeSession,
    GsLmsRevisitSchedule,
)
from app.db.session import get_db
from app.models.domain import Question, RevisionQueue, Topic, User
from app.services.educational_memory_engine import misconception_tracking
from app.services.knowledge_graph_engine import build_knowledge_graph
from app.services.revision_service import (
    append_retention_snapshot,
    compute_adaptive_revision_schedule,
    compute_exam_countdown_pacing,
)
from app.services.student_longitudinal_profile import build_student_longitudinal_profile

logger = logging.getLogger(__name__)

router = APIRouter()

_RATING_DELTAS: dict[str, float] = {
    "blank": -0.15,
    "shaky": 0.10,
    "solid": 0.25,
}


def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))


def _format_drill_options(options_en: Any, options_hi: Any) -> list[dict[str, Any]]:
    options: list[dict[str, Any]] = []
    if isinstance(options_en, dict):
        for key, opt_text in options_en.items():
            text_en_str = "" if opt_text is None else str(opt_text)
            text_hi = options_hi.get(key, "") if isinstance(options_hi, dict) else ""
            options.append({
                "id": str(key),
                "text": text_en_str,
                "textEn": text_en_str,
                "textHi": "" if text_hi is None else str(text_hi),
            })
        return options

    if isinstance(options_en, list):
        for idx, opt_item in enumerate(options_en):
            if isinstance(opt_item, dict):
                raw_key = opt_item.get("id") or opt_item.get("label")
                opt_key = str(raw_key) if raw_key is not None else (chr(65 + idx) if 0 <= idx < 26 else str(idx))
                opt_text = opt_item.get("text") if "text" in opt_item else opt_item.get("textEn", "")
            else:
                opt_key = chr(65 + idx) if 0 <= idx < 26 else str(idx)
                opt_text = opt_item

            text_hi = ""
            if isinstance(options_hi, list) and idx < len(options_hi):
                hi_item = options_hi[idx]
                if isinstance(hi_item, dict):
                    text_hi = str(hi_item.get("text") or hi_item.get("textHi") or "")
                elif hi_item is not None:
                    text_hi = str(hi_item)
            elif isinstance(options_hi, dict):
                raw_hi = options_hi.get(opt_key, "")
                text_hi = "" if raw_hi is None else str(raw_hi)

            text_en_str = "" if opt_text is None else str(opt_text)
            options.append({
                "id": opt_key,
                "text": text_en_str,
                "textEn": text_en_str,
                "textHi": text_hi,
            })
    return options


def _build_node_repair_card(
    db: Session,
    node: GsLmsSyllabusNode,
    existing_tables: set[str],
) -> dict[str, Any] | None:
    concept_bullets: list[str] = []
    seen_bullets: set[str] = set()

    if isinstance(node.concept_checklist, list):
        for raw_concept in node.concept_checklist:
            if isinstance(raw_concept, str):
                cleaned = raw_concept.strip()
                if cleaned and cleaned.lower() not in seen_bullets:
                    seen_bullets.add(cleaned.lower())
                    concept_bullets.append(cleaned)
                    if len(concept_bullets) >= 5:
                        break

    if len(concept_bullets) < 3 and "gs_lms_content_sections" in existing_tables:
        sections = (
            db.query(GsLmsContentSection)
            .filter(
                GsLmsContentSection.syllabus_node_id == node.id,
                GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .order_by(GsLmsContentSection.display_order.asc())
            .all()
        )
        for sec in sections:
            for extracted in extract_key_concepts(sec.blocks or []):
                cleaned = str(extracted).strip()
                if cleaned and cleaned.lower() not in seen_bullets:
                    seen_bullets.add(cleaned.lower())
                    concept_bullets.append(cleaned)
                    if len(concept_bullets) >= 5:
                        break
            if len(concept_bullets) >= 5:
                break

    sample_q: Optional[GsLmsMcqQuestion] = None
    sample_options: list[dict[str, Any]] = []
    if "gs_lms_mcq_questions" in existing_tables:
        sample_q = (
            db.query(GsLmsMcqQuestion)
            .filter(
                GsLmsMcqQuestion.syllabus_node_id == node.id,
                GsLmsMcqQuestion.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .order_by(GsLmsMcqQuestion.display_order.asc(), GsLmsMcqQuestion.id.asc())
            .first()
        )
        if sample_q is not None:
            raw_opts = sample_q.options
            if isinstance(raw_opts, list):
                for idx, opt in enumerate(raw_opts):
                    if isinstance(opt, dict):
                        text_str = str(opt.get("text") or opt.get("textEn") or "")
                        sample_options.append({
                            "id": str(opt.get("label") or opt.get("id") or ""),
                            "text": text_str,
                            "textEn": text_str,
                            "textHi": opt.get("textHi"),
                        })
                    else:
                        fallback_id = chr(65 + idx) if 0 <= idx < 26 else str(idx)
                        text_str = "" if opt is None else str(opt)
                        sample_options.append({
                            "id": fallback_id,
                            "text": text_str,
                            "textEn": text_str,
                            "textHi": None,
                        })
            elif isinstance(raw_opts, dict):
                for key, val in raw_opts.items():
                    text_str = "" if val is None else str(val)
                    sample_options.append({
                        "id": str(key),
                        "text": text_str,
                        "textEn": text_str,
                        "textHi": None,
                    })

    if not concept_bullets and sample_q is None:
        return None

    return {
        "kind": "topic_concept",
        "question_id": sample_q.id if sample_q else None,
        "question_text": sample_q.question_text if sample_q else None,
        "options": sample_options if sample_q else [],
        "correct_option": (
            str(sample_q.correct_option or "").strip().upper() or None
        ) if sample_q else None,
        "explanation": sample_q.explanation if sample_q else None,
        "concept_bullets": concept_bullets,
    }


# ---------------------------------------------------------------------------
# Triage Schemas
# ---------------------------------------------------------------------------


class TriageItemIn(BaseModel):
    topic_label: str
    subject_slug: Optional[str] = None
    syllabus_node_id: Optional[int] = None
    accuracy: float
    confidence: Literal["low", "medium", "high"]


class TriageEvaluateRequest(BaseModel):
    items: List[TriageItemIn] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=List[dict])
def get_revision_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the pending revision items for the current user.
    """
    now = datetime.now(timezone.utc)
    items = (
        db.query(RevisionQueue)
        .filter(
            RevisionQueue.user_id == current_user.id,
            RevisionQueue.is_deleted == False,
            RevisionQueue.next_review_at <= now,
        )
        .order_by(
            RevisionQueue.is_overconfident.desc(),
            RevisionQueue.priority_score.desc(),
        )
        .all()
    )

    result = []
    for item in items:
        result.append({
            "id": item.id,
            "topic": item.topic.name if item.topic else "General",
            "reason": item.reason,
            "priority": item.priority_score,
            "question_id": item.question_id,
            "review_count": item.review_count,
            "mastery": item.mastery_level,
            "category": item.category,
            "is_overconfident": bool(item.is_overconfident),
            "forgetting_count": int(item.forgetting_count or 0),
            "next_review_at": item.next_review_at,
        })
    return result


@router.get("/rapid-drill", response_model=List[dict])
def rapid_drill(
    mode: str = "recovery",  # recovery, mistakes, weak_topic, high_confidence_mistake
    topic_id: Optional[int] = None,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Priority 2: Micro-Revision Mode.
    Fast retrieval for daily consistency drills.
    """
    query = db.query(RevisionQueue).filter(
        RevisionQueue.user_id == current_user.id,
        RevisionQueue.is_deleted == False,
    )

    if mode == "high_confidence_mistake":
        query = query.filter(RevisionQueue.is_overconfident == True)
    elif mode == "mistakes":
        query = query.filter(RevisionQueue.category == "MISTAKE")
    elif mode == "weak_topic" and topic_id:
        query = query.filter(RevisionQueue.topic_id == topic_id)
    elif mode == "recovery":
        # Mix of everything, prioritized by overconfidence + priority score
        pass

    items = (
        query.order_by(
            RevisionQueue.is_overconfident.desc(),
            RevisionQueue.priority_score.desc(),
        )
        .limit(limit)
        .all()
    )

    result = []
    for item in items:
        q = item.question
        if not q:
            continue

        result.append({
            "id": q.id,
            "revision_item_id": item.id,
            "test_id": q.test_id,
            "topic_id": q.topic_id,
            "subject": q.topic.subject.name if q.topic and q.topic.subject else "General",
            "textEn": q.text_en,
            "textHi": q.text_hi,
            "options": _format_drill_options(q.options_en, q.options_hi),
            "correct_option": q.correct_option,
            "positiveMarks": 1.0,  # Default for revision
            "negativeMarks": 0.33,
            "difficulty": q.difficulty,
            "category": item.category,
            "priority": item.priority_score,
            "is_overconfident": bool(item.is_overconfident),
        })
    return result


@router.get("/command-center")
def get_revision_command_center(
    exam_date: Optional[str] = None,
    daily_minutes: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Unified Revision Command Center: merges due RevisionQueue items, beta-scoped
    GS LMS spaced revisits, beta-scoped weak GS topics, exam-countdown pacing,
    and misconception memory alerts.
    """
    now = datetime.now(timezone.utc)
    today = date.today()
    priority_queue: list[dict[str, Any]] = []

    inspector = sa_inspect(db.get_bind())
    existing_tables = set(inspector.get_table_names())

    # 1. Due RevisionQueue rows
    rq_count = 0
    overconfidence_traps = 0
    mistakes_due = 0
    if "revision_queues" in existing_tables:
        rq_items = (
            db.query(RevisionQueue)
            .filter(
                RevisionQueue.user_id == current_user.id,
                RevisionQueue.is_deleted == False,
                RevisionQueue.next_review_at <= now,
            )
            .order_by(
                RevisionQueue.is_overconfident.desc(),
                RevisionQueue.priority_score.desc(),
            )
            .all()
        )
        for item in rq_items:
            is_trap = bool(item.is_overconfident)
            item_category = item.category or ("OVERCONFIDENCE_TRAP" if is_trap else "MISTAKE")
            item_reason = item.reason or ("OVERCONFIDENCE_TRAP" if is_trap else "INCORRECT_ANSWER")
            rq_count += 1
            if is_trap:
                overconfidence_traps += 1
            elif (
                item_category.upper() == "MISTAKE"
                or "INCORRECT" in item_reason.upper()
                or "MISTAKE" in item_reason.upper()
            ):
                mistakes_due += 1

            topic_name = item.topic.name if item.topic else "General"
            subject_name = (
                item.topic.subject.name
                if item.topic and item.topic.subject and item.topic.subject.name
                else "general"
            )
            subject_slug = subject_name.strip().lower().replace(" ", "-")
            q = item.question
            if q is not None:
                repair_card: Optional[dict[str, Any]] = {
                    "kind": "mcq_mistake",
                    "question_id": q.id,
                    "question_text": q.text_en,
                    "options": _format_drill_options(q.options_en, q.options_hi),
                    "correct_option": str(q.correct_option or "").strip().upper() or None,
                    "explanation": getattr(q, "explanation_en", None) or None,
                    "concept_bullets": [],
                }
            else:
                repair_card = None

            priority_queue.append({
                "uid": f"rq-{item.id}",
                "source": "revision_queue",
                "item_id": item.id,
                "revisit_id": None,
                "syllabus_node_id": None,
                "question_id": item.question_id,
                "topic": topic_name,
                "subject_slug": subject_slug,
                "reason": item_reason,
                "category": item_category,
                "priority": float(item.priority_score if item.priority_score is not None else (1.5 if is_trap else 1.0)),
                "mastery": float(item.mastery_level) if item.mastery_level is not None else 0.0,
                "review_count": int(item.review_count or 0),
                "forgetting_count": int(item.forgetting_count or 0),
                "is_overconfident": is_trap,
                "due_at": item.next_review_at.isoformat() if item.next_review_at else None,
                "revisit_type": None,
                "action_href": (
                    "/exam/revision?mode=high_confidence_mistake"
                    if is_trap
                    else "/exam/revision?mode=recovery"
                ),
                "repair_card": repair_card,
            })

    # Helper cache for paid-beta loop-ready IDs per GS subject
    beta_enforced = beta_scope_enabled()
    ready_ids_by_subject: dict[int, set[int]] = {}
    node_repair_cards: dict[int, Optional[dict[str, Any]]] = {}

    def _is_node_visible(subject_id: int, node_id: int) -> bool:
        if not beta_enforced:
            return True
        if subject_id not in ready_ids_by_subject:
            ready_ids_by_subject[subject_id] = compute_loop_ready_ids(db, subject_id)
        return node_id in ready_ids_by_subject[subject_id]

    def _get_node_repair_card(node: GsLmsSyllabusNode) -> Optional[dict[str, Any]]:
        if node.id not in node_repair_cards:
            node_repair_cards[node.id] = _build_node_repair_card(db, node, existing_tables)
        return node_repair_cards[node.id]

    # 2. Due GS LMS Spaced Revisits (respecting beta_scope_enabled)
    topic_revisits_due = 0
    if {
        "gs_lms_revisit_schedule",
        "gs_lms_syllabus_nodes",
        "gs_subjects",
    }.issubset(existing_tables):
        revisit_rows = (
            db.query(GsLmsRevisitSchedule, GsLmsSyllabusNode, GsSubject)
            .join(
                GsLmsSyllabusNode,
                GsLmsSyllabusNode.id == GsLmsRevisitSchedule.syllabus_node_id,
            )
            .join(GsSubject, GsSubject.id == GsLmsSyllabusNode.subject_id)
            .filter(
                GsLmsRevisitSchedule.student_id == current_user.id,
                GsLmsRevisitSchedule.due_date <= today,
                GsLmsRevisitSchedule.completed == False,
            )
            .order_by(GsLmsRevisitSchedule.due_date.asc())
            .all()
        )
        for revisit, node, subject in revisit_rows:
            if not _is_node_visible(node.subject_id, node.id):
                continue
            topic_revisits_due += 1
            overdue = revisit.due_date < today
            priority_queue.append({
                "uid": f"revisit-{revisit.id}",
                "source": "topic_revisit",
                "item_id": None,
                "revisit_id": revisit.id,
                "syllabus_node_id": node.id,
                "question_id": None,
                "topic": node.title,
                "subject_slug": subject.slug,
                "reason": f"SPACED_REVISIT_{revisit.revisit_type.upper()}",
                "category": "TOPIC_REVISIT",
                "priority": 1.25 if overdue else 0.95,
                "mastery": None,
                "review_count": 0,
                "forgetting_count": 0,
                "is_overconfident": False,
                "due_at": revisit.due_date.isoformat() if revisit.due_date else None,
                "revisit_type": revisit.revisit_type,
                "action_href": f"/upsc/{subject.slug}/lms/topic/{node.id}",
                "repair_card": _get_node_repair_card(node),
            })

    # 3. Weak practiced GS topics (accuracy < 0.6 with >= 3 attempts across Practice + MCQ Lab)
    weak_topics_count = 0
    stats_by_node: dict[int, list[int]] = defaultdict(lambda: [0, 0])

    if {"gs_lms_practice_sessions", "gs_lms_practice_attempts"}.issubset(existing_tables):
        for node_id, total, correct in (
            db.query(
                GsLmsPracticeSession.syllabus_node_id,
                func.count(GsLmsPracticeAttempt.id),
                func.sum(case((GsLmsPracticeAttempt.is_correct.is_(True), 1), else_=0)),
            )
            .join(
                GsLmsPracticeAttempt,
                GsLmsPracticeAttempt.session_id == GsLmsPracticeSession.id,
            )
            .filter(
                GsLmsPracticeSession.student_id == current_user.id,
                GsLmsPracticeAttempt.is_correct.is_not(None),
            )
            .group_by(GsLmsPracticeSession.syllabus_node_id)
            .all()
        ):
            stats_by_node[node_id][0] += int(total or 0)
            stats_by_node[node_id][1] += int(correct or 0)

    if {"gs_lms_mcq_lab_sessions", "gs_lms_mcq_lab_attempts"}.issubset(existing_tables):
        for node_id, total, correct in (
            db.query(
                GsLmsMcqLabSession.syllabus_node_id,
                func.count(GsLmsMcqLabAttempt.id),
                func.sum(case((GsLmsMcqLabAttempt.is_correct.is_(True), 1), else_=0)),
            )
            .join(
                GsLmsMcqLabAttempt,
                GsLmsMcqLabAttempt.session_id == GsLmsMcqLabSession.id,
            )
            .filter(
                GsLmsMcqLabSession.student_id == current_user.id,
                GsLmsMcqLabAttempt.is_correct.is_not(None),
            )
            .group_by(GsLmsMcqLabSession.syllabus_node_id)
            .all()
        ):
            stats_by_node[node_id][0] += int(total or 0)
            stats_by_node[node_id][1] += int(correct or 0)

    weak_node_ids = [
        nid
        for nid, (total, correct) in stats_by_node.items()
        if nid is not None and total >= 3 and (correct / total) < 0.6
    ]
    if weak_node_ids and {"gs_lms_syllabus_nodes", "gs_subjects"}.issubset(existing_tables):
        weak_nodes = (
            db.query(GsLmsSyllabusNode, GsSubject)
            .join(GsSubject, GsSubject.id == GsLmsSyllabusNode.subject_id)
            .filter(GsLmsSyllabusNode.id.in_(weak_node_ids))
            .all()
        )
        for node, subject in weak_nodes:
            if not _is_node_visible(node.subject_id, node.id):
                continue
            total, correct = stats_by_node[node.id]
            accuracy = correct / total
            weak_topics_count += 1
            priority_queue.append({
                "uid": f"weak-{node.id}",
                "source": "weak_topic",
                "item_id": None,
                "revisit_id": None,
                "syllabus_node_id": node.id,
                "question_id": None,
                "topic": node.title,
                "subject_slug": subject.slug,
                "reason": f"LOW_PRACTICE_ACCURACY ({round(accuracy * 100)}% over {total} attempts)",
                "category": "WEAK_TOPIC",
                "priority": round(1.15 - accuracy * 0.5, 4),
                "mastery": round(accuracy, 4),
                "review_count": int(total),
                "forgetting_count": 0,
                "is_overconfident": False,
                "due_at": None,
                "revisit_type": None,
                "action_href": f"/upsc/{subject.slug}/lms/topic/{node.id}",
                "repair_card": _get_node_repair_card(node),
            })

    priority_queue.sort(key=lambda entry: (-entry["priority"], entry["due_at"] or ""))

    # 4. Educational Memory Engine misconception alerts (defensively wrapped)
    memory_alerts: list[dict[str, Any]] = []
    if {"reports", "attempts", "topics", "subjects"}.issubset(existing_tables):
        try:
            profile = build_student_longitudinal_profile(db, current_user.id)
            if profile.get("attempt_count", 0) > 0:
                graph = build_knowledge_graph(db)
                tracking = misconception_tracking(profile, graph)
                for m in tracking.get("misconceptions", []):
                    memory_alerts.append({
                        "topic": str(m.get("topic", "")),
                        "flags": [str(f) for f in m.get("flags", [])],
                        "latest_score": float(m.get("latest_score", 0.0)),
                        "probability": float(m.get("probability", 0.0)),
                        "safety_note": str(
                            m.get(
                                "safety_note",
                                "Misconception evidence is probabilistic and educational, not a learner label.",
                            )
                        ),
                    })
        except Exception as exc:
            logger.warning("Failed to compute misconception memory alerts for user %s: %s", current_user.id, exc)
            memory_alerts = []

    total_due = len(priority_queue)
    estimated_minutes_today = (rq_count * 3) + (topic_revisits_due * 8) + (weak_topics_count * 10)

    summary = {
        "total_due": total_due,
        "overconfidence_traps": overconfidence_traps,
        "mistakes_due": mistakes_due,
        "topic_revisits_due": topic_revisits_due,
        "weak_topics_count": weak_topics_count,
        "estimated_minutes_today": estimated_minutes_today,
    }
    pacing = compute_exam_countdown_pacing(
        total_due=total_due,
        estimated_minutes_today=estimated_minutes_today,
        exam_date_str=exam_date,
        daily_minutes=daily_minutes,
    )

    return {
        "summary": summary,
        "pacing": pacing,
        "priority_queue": priority_queue,
        "memory_alerts": memory_alerts,
        "revision_engine_version": "revision-os.v1",
    }


@router.post("/triage/evaluate")
def evaluate_triage(
    payload: TriageEvaluateRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Quick Diagnostic Triage: classifies topics into SOLID, RUSTY, or BLIND_SPOT
    with recommended spaced intervals and overconfidence alerts.
    """
    _ = current_user
    counts = {
        "solid": 0,
        "rusty": 0,
        "blind_spot": 0,
        "overconfidence_alerts": 0,
    }
    results: list[dict[str, Any]] = []

    for item in payload.items:
        raw_acc = float(item.accuracy)
        acc = min(1.0, raw_acc / 100.0) if raw_acc > 1.0 else max(0.0, raw_acc)
        conf = item.confidence.strip().lower()
        overconfidence_alert = conf == "high" and acc < 0.6

        if acc >= 0.8 and conf in {"medium", "high"}:
            band = "SOLID"
            action_label = "Skip / Light Recall"
            recommended_interval_days = compute_initial_interval(acc)
            counts["solid"] += 1
        elif acc < 0.5 or overconfidence_alert:
            band = "BLIND_SPOT"
            action_label = (
                "Surgical Repair — Recalibrate"
                if overconfidence_alert
                else "Surgical Repair — Study & Drill"
            )
            recommended_interval_days = 1
            counts["blind_spot"] += 1
        else:
            band = "RUSTY"
            action_label = "5-Min Refresh & Recall"
            recommended_interval_days = compute_initial_interval(min(acc, 0.59))
            counts["rusty"] += 1

        if overconfidence_alert:
            counts["overconfidence_alerts"] += 1

        results.append({
            "topic_label": item.topic_label,
            "subject_slug": item.subject_slug,
            "syllabus_node_id": item.syllabus_node_id,
            "band": band,
            "action_label": action_label,
            "recommended_interval_days": recommended_interval_days,
            "overconfidence_alert": overconfidence_alert,
        })

    return {
        "counts": counts,
        "results": results,
    }


@router.post("/{item_id}/complete")
def complete_revision(
    item_id: int,
    mastery_delta: float = 0.0,
    rating: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a revision item as completed and schedule next review adaptively.
    """
    item = (
        db.query(RevisionQueue)
        .filter(
            RevisionQueue.id == item_id,
            RevisionQueue.user_id == current_user.id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Revision item not found")

    normalized_rating: Optional[str] = None
    if rating is not None:
        normalized_rating = rating.strip().lower()
        if normalized_rating not in _RATING_DELTAS:
            raise HTTPException(
                status_code=422,
                detail="Invalid rating. Expected one of: blank, shaky, solid",
            )
        effective_delta = _RATING_DELTAS[normalized_rating]
    else:
        effective_delta = mastery_delta

    now = datetime.now(timezone.utc)
    current_mastery = float(item.mastery_level or 0.0)
    new_mastery = clamp(current_mastery + effective_delta, 0.0, 1.0)
    is_correct = (normalized_rating != "blank") if normalized_rating is not None else (effective_delta >= 0)
    new_review_count = int(item.review_count or 0) + 1

    interval_days, next_review_dt = compute_adaptive_revision_schedule(
        current_mastery=current_mastery,
        new_mastery=new_mastery,
        review_count=new_review_count,
        last_reviewed_at=item.last_reviewed_at,
        next_review_at=item.next_review_at,
        now=now,
        is_correct=is_correct,
        rating=normalized_rating,
    )

    item.last_reviewed_at = now
    item.review_count = new_review_count
    item.mastery_level = new_mastery
    item.next_review_at = next_review_dt

    if not is_correct:
        item.forgetting_count = int(item.forgetting_count or 0) + 1
        current_decay = float(item.decay_rate if item.decay_rate is not None else 1.0)
        item.decay_rate = round(min(3.0, current_decay + 0.2), 4)

    if is_correct and new_mastery >= 0.7 and normalized_rating != "blank":
        item.is_overconfident = False

    append_retention_snapshot(
        item,
        mastery=new_mastery,
        event="completed",
        now=now,
        is_overconfident=bool(item.is_overconfident),
        rating=normalized_rating,
    )

    db.commit()
    return {
        "status": "completed",
        "id": item.id,
        "mastery_level": item.mastery_level,
        "review_count": item.review_count,
        "interval_days": interval_days,
        "next_review_at": item.next_review_at,
        "is_overconfident": bool(item.is_overconfident),
    }


@router.post("/bulk-complete")
def bulk_complete_revision(
    payload: List[dict],  # [{question_id, is_correct}]
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Process multiple revision items at once after a rapid drill.
    """
    now = datetime.now(timezone.utc)
    results = []
    for entry in payload:
        q_id = entry.get("question_id")
        is_correct = bool(entry.get("is_correct"))
        raw_rating = entry.get("rating")
        normalized_rating = raw_rating.strip().lower() if isinstance(raw_rating, str) else None
        if normalized_rating in _RATING_DELTAS:
            mastery_delta = _RATING_DELTAS[normalized_rating]
            if normalized_rating == "blank":
                is_correct = False
        else:
            normalized_rating = None
            mastery_delta = 0.2 if is_correct else -0.1

        # Find the revision item for this question
        item = (
            db.query(RevisionQueue)
            .filter(
                RevisionQueue.user_id == current_user.id,
                RevisionQueue.question_id == q_id,
            )
            .first()
        )

        if not item:
            continue

        current_mastery = float(item.mastery_level or 0.0)
        new_mastery = clamp(current_mastery + mastery_delta, 0.0, 1.0)
        new_review_count = int(item.review_count or 0) + 1

        interval_days, next_review_dt = compute_adaptive_revision_schedule(
            current_mastery=current_mastery,
            new_mastery=new_mastery,
            review_count=new_review_count,
            last_reviewed_at=item.last_reviewed_at,
            next_review_at=item.next_review_at,
            now=now,
            is_correct=is_correct,
            rating=normalized_rating,
        )

        item.last_reviewed_at = now
        item.review_count = new_review_count
        item.mastery_level = new_mastery
        item.next_review_at = next_review_dt

        if not is_correct:
            item.forgetting_count = int(item.forgetting_count or 0) + 1
            current_decay = float(item.decay_rate if item.decay_rate is not None else 1.0)
            item.decay_rate = round(min(3.0, current_decay + 0.2), 4)

        if is_correct and item.mastery_level >= 0.7:
            item.is_overconfident = False

        append_retention_snapshot(
            item,
            mastery=new_mastery,
            event="bulk_completed",
            now=now,
            is_overconfident=bool(item.is_overconfident),
            rating=normalized_rating,
        )

        results.append({
            "question_id": q_id,
            "next_review": item.next_review_at,
            "interval_days": interval_days,
            "mastery_level": item.mastery_level,
            "is_overconfident": bool(item.is_overconfident),
        })

    db.commit()
    return {"status": "success", "processed": len(results), "items": results}


@router.get("/recovery-path/{topic_id}")
async def get_recovery_path(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Concept recovery: the student's REAL recorded weak points in this topic.

    Built from the student's own ``RevisionQueue`` items for the topic (the
    questions/reasons actually flagged for them) — never fabricated generic
    prerequisites. When nothing is recorded yet, returns an honest empty path so
    the UI can say so rather than inventing steps.
    """
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    items = (
        db.query(RevisionQueue)
        .filter(
            RevisionQueue.user_id == current_user.id,
            RevisionQueue.topic_id == topic_id,
        )
        .order_by(RevisionQueue.priority_score.desc())
        .limit(5)
        .all()
    )

    reason_titles = {
        "WEAK_TOPIC": "Weak topic — rebuild the fundamentals",
        "INCORRECT_ANSWER": "Mistake to re-attempt",
        "OVERCONFIDENCE_TRAP": "High-confidence mistake — recalibrate",
        "MARKED_FOR_REVIEW": "Flagged for review",
        "SPACED_REPETITION": "Due for spaced recall",
    }

    def _priority(mastery: float) -> str:
        if mastery < 0.34:
            return "CRITICAL"
        if mastery < 0.67:
            return "HIGH"
        return "MEDIUM"

    steps = [
        {
            "title": reason_titles.get(item.reason or "", item.reason) or f"Revise {topic.name}",
            "priority": _priority(item.mastery_level or 0.0),
        }
        for item in items
    ]

    if steps:
        message = (
            f"{len(steps)} recorded weak point(s) in {topic.name}. "
            "Clear these from your revision queue to recover the topic."
        )
    else:
        message = (
            f"No recorded weaknesses in {topic.name} yet. Attempt or revise it "
            "and your recovery path will build from your real results."
        )

    return {
        "primary_topic": topic.name,
        "suggested_prerequisites": steps,
        "message": message,
    }


@router.get("/history", response_model=List[dict])
def get_revision_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Priority 5: Revision History Timeline.
    Tracks continuity and effort over time.
    """
    items = (
        db.query(RevisionQueue)
        .filter(
            RevisionQueue.user_id == current_user.id,
            RevisionQueue.last_reviewed_at != None,
        )
        .order_by(RevisionQueue.last_reviewed_at.desc())
        .limit(limit)
        .all()
    )

    return [{
        "id": item.id,
        "topic": item.topic.name if item.topic else "General",
        "last_reviewed_at": item.last_reviewed_at,
        "mastery_at_time": item.mastery_level,
        "category": item.category,
    } for item in items]
