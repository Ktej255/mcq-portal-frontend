"""Progression and review-checkpoint endpoints for the GS LMS learning loop.

Routes (mounted under /api/v1/gs-lms/{subject_slug}; auth-gated at package router):
* GET  /progression                     — next unlocked topic, mastered count, due checkpoint
* GET  /checkpoints                     — checkpoints currently due
* POST /checkpoints/{id}/start          — CHECKPOINT_QUESTIONS MCQs (no answers) from the covered topics
* POST /checkpoints/{id}/submit         — score; passing unlocks the next topic

The rules and thresholds live in ``app.core.gs_lms.progression``.
"""

from __future__ import annotations

import random
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user, mcq_quota
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import GsLmsMcqQuestion, GsLmsSyllabusNode
from app.core.gs_lms.progression import (
    CHECKPOINT_DUE,
    CHECKPOINT_PASS,
    CHECKPOINT_PASSED,
    CHECKPOINT_QUESTIONS,
    compute_progression,
    is_order_exempt,
    pass_checkpoint,
)
from app.core.gs_lms.funnel_models import GsLmsCheckpoint
from app.api.v1.gs_lms.dependencies import resolve_subject

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LeafRefOut(BaseModel):
    node_id: int
    title: str


class CheckpointOut(BaseModel):
    checkpoint_id: int
    sub_topic_id: int
    sub_topic_title: str
    status: str
    leaves: List[LeafRefOut]
    attempts: int
    best_score: Optional[float] = None  # 0-100
    pass_score: float = round(CHECKPOINT_PASS * 100, 1)


class ProgressionOut(BaseModel):
    next_leaf: Optional[LeafRefOut] = None
    mastered_count: int
    total_leaves: int
    due_checkpoint: Optional[CheckpointOut] = None
    due_checkpoints: List[CheckpointOut] = []
    order_enforced: bool


class CheckpointOptionOut(BaseModel):
    label: str
    text: str


class CheckpointQuestionOut(BaseModel):
    question_id: int
    question_type: str
    question_text: str
    options: List[CheckpointOptionOut]
    display_order: int


class CheckpointStartOut(BaseModel):
    checkpoint_id: int
    total_questions: int
    questions: List[CheckpointQuestionOut]


class CheckpointAnswerIn(BaseModel):
    question_id: int
    chosen_answer: str


class CheckpointSubmitIn(BaseModel):
    answers: List[CheckpointAnswerIn] = Field(..., min_length=1, max_length=CHECKPOINT_QUESTIONS)


class CheckpointAttemptOut(BaseModel):
    question_id: int
    leaf_id: int
    chosen_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str | None = None


class CheckpointLeafBreakdownOut(BaseModel):
    leaf_id: int
    title: str
    total: int
    correct: int
    accuracy: float  # 0-100


class CheckpointResultOut(BaseModel):
    checkpoint_id: int
    total_questions: int
    correct_count: int
    score: float  # 0-100 percentage
    passed: bool
    pass_score: float
    status: str
    attempts: List[CheckpointAttemptOut]
    leaf_breakdown: List[CheckpointLeafBreakdownOut]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _titles(db: Session, node_ids: List[int]) -> Dict[int, str]:
    if not node_ids:
        return {}
    rows = db.query(GsLmsSyllabusNode.id, GsLmsSyllabusNode.title).filter(
        GsLmsSyllabusNode.id.in_(node_ids)
    ).all()
    return {r[0]: r[1] for r in rows}


def _checkpoint_out(cp: GsLmsCheckpoint, titles: Dict[int, str]) -> CheckpointOut:
    return CheckpointOut(
        checkpoint_id=cp.id,
        sub_topic_id=cp.sub_topic_node_id,
        sub_topic_title=titles.get(cp.sub_topic_node_id, f"Topic {cp.sub_topic_node_id}"),
        status=cp.status,
        leaves=[LeafRefOut(node_id=i, title=titles.get(i, f"Topic {i}")) for i in (cp.leaf_ids or [])],
        attempts=cp.attempts or 0,
        best_score=round(cp.best_score * 100, 1) if cp.best_score is not None else None,
    )


def _checkpoint_titles(db: Session, cps: List[GsLmsCheckpoint]) -> Dict[int, str]:
    ids = {cp.sub_topic_node_id for cp in cps}
    for cp in cps:
        ids.update(cp.leaf_ids or [])
    return _titles(db, list(ids))


def _get_checkpoint(db: Session, user: User, subject: GsSubject, checkpoint_id: int) -> GsLmsCheckpoint:
    cp = db.query(GsLmsCheckpoint).filter(
        GsLmsCheckpoint.id == checkpoint_id,
        GsLmsCheckpoint.student_id == user.id,
        GsLmsCheckpoint.subject_id == subject.id,
    ).one_or_none()
    if cp is None:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    return cp


def _qtype(q: GsLmsMcqQuestion) -> str:
    return q.question_type.value if hasattr(q.question_type, "value") else str(q.question_type)


def _covered_questions(db: Session, cp: GsLmsCheckpoint) -> Dict[int, List[GsLmsMcqQuestion]]:
    """REVIEWED MCQs per covered leaf."""
    leaf_ids = list(cp.leaf_ids or [])
    pools: Dict[int, List[GsLmsMcqQuestion]] = {i: [] for i in leaf_ids}
    rows = db.query(GsLmsMcqQuestion).filter(
        GsLmsMcqQuestion.syllabus_node_id.in_(leaf_ids),
        GsLmsMcqQuestion.review_status == GsReviewStatusEnum.REVIEWED,
    ).order_by(GsLmsMcqQuestion.id).all()
    for q in rows:
        pools[q.syllabus_node_id].append(q)
    return pools


def _draw_evenly(pools: Dict[int, List[GsLmsMcqQuestion]], count: int) -> List[GsLmsMcqQuestion]:
    """Round-robin over the leaves so each contributes (nearly) the same number;
    a leaf with too few questions hands its share to the others."""
    shuffled = {leaf: random.sample(qs, len(qs)) for leaf, qs in pools.items()}
    picked: List[GsLmsMcqQuestion] = []
    while len(picked) < count and any(shuffled.values()):
        for leaf in list(shuffled):
            if shuffled[leaf] and len(picked) < count:
                picked.append(shuffled[leaf].pop())
    random.shuffle(picked)
    return picked


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/progression", response_model=ProgressionOut)
def get_progression(
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Where the student is in the subject: next unlocked topic, how many are
    mastered, and the review checkpoint that is due (if any)."""
    prog = compute_progression(db, current_user.id, subject.id)
    nxt = prog.next_unlocked
    titles = _checkpoint_titles(db, prog.due_checkpoints)
    due = [_checkpoint_out(cp, titles) for cp in prog.due_checkpoints]
    return ProgressionOut(
        next_leaf=LeafRefOut(node_id=nxt.node_id, title=nxt.title) if nxt else None,
        mastered_count=prog.mastered_count,
        total_leaves=len(prog.leaves),
        due_checkpoint=due[0] if due else None,
        due_checkpoints=due,
        order_enforced=not is_order_exempt(current_user),
    )


@router.get("/checkpoints", response_model=List[CheckpointOut])
def list_due_checkpoints(
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Review checkpoints currently due for this subject."""
    cps = db.query(GsLmsCheckpoint).filter(
        GsLmsCheckpoint.student_id == current_user.id,
        GsLmsCheckpoint.subject_id == subject.id,
        GsLmsCheckpoint.status == CHECKPOINT_DUE,
    ).order_by(GsLmsCheckpoint.id).all()
    titles = _checkpoint_titles(db, cps)
    return [_checkpoint_out(cp, titles) for cp in cps]


@router.post("/checkpoints/{checkpoint_id}/start", response_model=CheckpointStartOut)
def start_checkpoint(
    checkpoint_id: int,
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Draw CHECKPOINT_QUESTIONS MCQs evenly from the covered topics' REVIEWED
    questions, in random order, without the correct answers."""
    cp = _get_checkpoint(db, current_user, subject, checkpoint_id)
    if cp.status != CHECKPOINT_DUE:
        raise HTTPException(status_code=409, detail="This checkpoint is already passed")
    questions = _draw_evenly(_covered_questions(db, cp), CHECKPOINT_QUESTIONS)
    if not questions:
        raise HTTPException(status_code=409, detail="No reviewed questions are available for this checkpoint yet")
    cp.question_ids = [q.id for q in questions]  # a new /start replaces the stored set
    db.commit()
    return CheckpointStartOut(
        checkpoint_id=cp.id,
        total_questions=len(questions),
        questions=[
            CheckpointQuestionOut(
                question_id=q.id,
                question_type=_qtype(q),
                question_text=q.question_text,
                options=[CheckpointOptionOut(label=o["label"], text=o["text"]) for o in (q.options or [])],
                display_order=i + 1,
            )
            for i, q in enumerate(questions)
        ],
    )


@router.post(
    "/checkpoints/{checkpoint_id}/submit",
    response_model=CheckpointResultOut,
    dependencies=[Depends(mcq_quota(CHECKPOINT_QUESTIONS))],
)
def submit_checkpoint(
    checkpoint_id: int,
    body: CheckpointSubmitIn,
    subject: GsSubject = Depends(resolve_subject),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Score a checkpoint attempt. Passing (>= CHECKPOINT_PASS) marks it PASSED
    and unlocks the next topic; otherwise the student can start it again."""
    cp = _get_checkpoint(db, current_user, subject, checkpoint_id)
    if cp.status != CHECKPOINT_DUE:
        raise HTTPException(status_code=409, detail="This checkpoint is already passed")

    if not cp.question_ids:
        raise HTTPException(status_code=409, detail="Start the checkpoint before submitting")
    pools = _covered_questions(db, cp)
    by_id = {q.id: (leaf, q) for leaf, qs in pools.items() for q in qs}
    if any(i not in by_id for i in cp.question_ids):
        raise HTTPException(status_code=409, detail="Some questions are no longer available; start the checkpoint again")
    ids = [a.question_id for a in body.answers]
    if len(set(ids)) != len(ids):
        raise HTTPException(status_code=422, detail="Duplicate question in answers")
    if set(ids) != set(cp.question_ids) or len(ids) != len(cp.question_ids):
        raise HTTPException(status_code=422, detail="Answers must be for exactly the questions you were given")

    attempts: List[CheckpointAttemptOut] = []
    stats: Dict[int, List[int]] = {leaf: [0, 0] for leaf in pools}  # leaf -> [total, correct]
    for a in body.answers:
        leaf, q = by_id[a.question_id]
        ok = a.chosen_answer.strip().upper() == str(q.correct_option).strip().upper()
        stats[leaf][0] += 1
        stats[leaf][1] += int(ok)
        attempts.append(CheckpointAttemptOut(
            question_id=q.id, leaf_id=leaf, chosen_answer=a.chosen_answer,
            correct_answer=q.correct_option, is_correct=ok, explanation=q.explanation,
        ))
    total = len(attempts)
    correct = sum(1 for a in attempts if a.is_correct)
    score = correct / total
    passed = pass_checkpoint(db, cp, score)
    cp.question_ids = None  # one submission per /start
    db.commit()

    titles = _titles(db, list(pools))
    return CheckpointResultOut(
        checkpoint_id=cp.id,
        total_questions=total,
        correct_count=correct,
        score=round(score * 100, 1),
        passed=passed,
        pass_score=round(CHECKPOINT_PASS * 100, 1),
        status=cp.status,
        attempts=attempts,
        leaf_breakdown=[
            CheckpointLeafBreakdownOut(
                leaf_id=leaf, title=titles.get(leaf, f"Topic {leaf}"), total=t, correct=c,
                accuracy=round(c / t * 100, 1) if t else 0.0,
            )
            for leaf, (t, c) in stats.items() if t
        ],
    )
