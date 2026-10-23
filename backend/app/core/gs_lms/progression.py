"""Server-enforced learning loop for the GS LMS: learn one thing, prove it,
then move on.

Everything that gates progress lives here so the rules and thresholds are in
one place:

* step gates for the 14-step funnel (discussion, recall, MCQ lab),
* topic completed / mastered definitions,
* the topic order lock within a subject,
* the combined "cumulative review" checkpoints.

Functions flush but never commit; the caller owns the transaction.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.exam_profiles import ExamProfile, ProgressionRules, profile_for_subject
from app.core.gs_lms.funnel_models import (
    GsLmsCheckpoint,
    GsLmsFunnelProgress,
    GsLmsMcqLabSession,
    GsLmsRecallAttempt,
)
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsNodeTypeEnum,
    GsLmsSyllabusNode,
)

# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------

# Best recall score (0..1) a student needs on a section to pass its recall step.
RECALL_PASS_SCORE = 0.5
# After this many recall attempts on a section the step is allowed even below
# RECALL_PASS_SCORE (the section is then reported as weak in the growth report).
RECALL_MAX_ATTEMPTS = 3
# Best MCQ lab score (0..1) that turns a completed topic into a MASTERED one.
TOPIC_MCQ_PASS = 0.6
# A review checkpoint becomes due after this many consecutive mastered leaves
# in one sub-topic (and at the end of a sub-topic if >= CHECKPOINT_MIN_LEAVES).
CHECKPOINT_EVERY = 3
CHECKPOINT_MIN_LEAVES = 2
# Number of MCQs in a checkpoint test.
CHECKPOINT_QUESTIONS = 10
# Score (0..1) that passes a checkpoint and unlocks the next leaf.
CHECKPOINT_PASS = 0.6

CHECKPOINT_DUE = "DUE"
CHECKPOINT_PASSED = "PASSED"

# Funnel steps -> content section label whose recall must be passed.
RECALL_STEP_SECTIONS: dict[int, str] = {
    3: "BASIC",
    5: "NCERT_LEVEL",
    7: "ADVANCED",
    9: "CURRENT_AFFAIRS",
    11: "EXAMINER_TRAPS",
}
DISCUSSION_STEP = 1
MCQ_LAB_STEP = 12
FINAL_STEP = 14


class StepGateError(Exception):
    """A funnel step cannot be completed yet because its gate is not met."""


# ---------------------------------------------------------------------------
# Exam profile lookups
#
# The constants above are the defaults (UPSC today). Every threshold below is
# read from the subject's exam profile (app.core.gs_lms.exam_profiles), whose
# UPSC values equal these constants, and falls back to them when the subject
# cannot be found.
# ---------------------------------------------------------------------------

def default_rules() -> ProgressionRules:
    return ProgressionRules(
        recall_pass_score=RECALL_PASS_SCORE,
        recall_max_attempts=RECALL_MAX_ATTEMPTS,
        topic_mcq_pass=TOPIC_MCQ_PASS,
        checkpoint_every=CHECKPOINT_EVERY,
        checkpoint_min_leaves=CHECKPOINT_MIN_LEAVES,
        checkpoint_questions=CHECKPOINT_QUESTIONS,
        checkpoint_pass=CHECKPOINT_PASS,
    )


def subject_profile(db: Session, subject_id: Optional[int]) -> Optional[ExamProfile]:
    subject = db.get(GsSubject, subject_id) if subject_id is not None else None
    return profile_for_subject(subject) if subject is not None else None


def rules_for_subject(db: Session, subject_id: Optional[int]) -> ProgressionRules:
    profile = subject_profile(db, subject_id)
    return profile.progression if profile is not None else default_rules()


def profile_for_node(db: Session, node_id: int) -> Optional[ExamProfile]:
    node = db.get(GsLmsSyllabusNode, node_id)
    return subject_profile(db, node.subject_id) if node is not None else None


# ---------------------------------------------------------------------------
# Who is exempt
# ---------------------------------------------------------------------------

def is_order_exempt(user: Any) -> bool:
    """Admins (role ADMIN or allow-listed email) are never locked; the whole
    lock is off unless GS_LMS_ENFORCE_PROGRESSION (master) and
    GS_LMS_ENFORCE_ORDER (sub-switch) are both on."""
    if not settings.GS_LMS_ENFORCE_PROGRESSION or not settings.GS_LMS_ENFORCE_ORDER:
        return True
    role = getattr(user, "role", None)
    role = getattr(role, "value", role)
    if role == "ADMIN":
        return True
    email = (getattr(user, "email", None) or "").lower()
    return email in {e.lower() for e in settings.ADMIN_EMAILS}


# ---------------------------------------------------------------------------
# Per-topic facts
# ---------------------------------------------------------------------------

def recall_stats(db: Session, student_id: int, node_id: int, section_label: str) -> tuple[Optional[float], int]:
    """(best recall score or None, number of attempts) for one section."""
    best, count = (
        db.query(func.max(GsLmsRecallAttempt.recall_score), func.count(GsLmsRecallAttempt.id))
        .filter(
            GsLmsRecallAttempt.student_id == student_id,
            GsLmsRecallAttempt.syllabus_node_id == node_id,
            GsLmsRecallAttempt.section_label == section_label,
        )
        .one()
    )
    return best, int(count or 0)


def weak_recall_sections(db: Session, student_id: int, node_id: int) -> list[str]:
    """Section labels whose recall step was passed only via RECALL_MAX_ATTEMPTS
    (best score still below RECALL_PASS_SCORE)."""
    weak = []
    profile = profile_for_node(db, node_id)
    rules = profile.progression if profile is not None else default_rules()
    for step, label in RECALL_STEP_SECTIONS.items():
        if profile is not None and step not in profile.enabled_funnel_steps:
            continue
        best, count = recall_stats(db, student_id, node_id, label)
        if count >= rules.recall_max_attempts and (best or 0.0) < rules.recall_pass_score:
            weak.append(label)
    return weak


def best_mcq_scores(db: Session, student_id: int, node_ids: list[int]) -> dict[int, float]:
    """Best submitted MCQ lab score (0..1) per node; nodes never submitted are absent."""
    if not node_ids:
        return {}
    rows = (
        db.query(GsLmsMcqLabSession.syllabus_node_id, func.max(GsLmsMcqLabSession.score))
        .filter(
            GsLmsMcqLabSession.student_id == student_id,
            GsLmsMcqLabSession.syllabus_node_id.in_(node_ids),
            GsLmsMcqLabSession.submitted_at.isnot(None),
        )
        .group_by(GsLmsMcqLabSession.syllabus_node_id)
        .all()
    )
    return {nid: float(score or 0.0) for nid, score in rows}


def _naive_utc(dt: datetime) -> datetime:
    return dt.astimezone(timezone.utc).replace(tzinfo=None) if dt.tzinfo else dt


def completed_topic_times(db: Session, student_id: int, node_ids: list[int]) -> dict[int, Optional[datetime]]:
    """Topics whose step 14 is done (the only definition of COMPLETED) -> completion time."""
    if not node_ids:
        return {}
    rows = (
        db.query(GsLmsFunnelProgress.syllabus_node_id, GsLmsFunnelProgress.completed_at)
        .filter(
            GsLmsFunnelProgress.student_id == student_id,
            GsLmsFunnelProgress.step_number == FINAL_STEP,
            GsLmsFunnelProgress.completed == True,  # noqa: E712
            GsLmsFunnelProgress.syllabus_node_id.in_(node_ids),
        )
        .all()
    )
    return {r[0]: r[1] for r in rows}


def completed_topic_ids(db: Session, student_id: int, node_ids: list[int]) -> set[int]:
    return set(completed_topic_times(db, student_id, node_ids))


def _is_mastered(
    completed_at: Optional[datetime], score: Optional[float], rules: Optional[ProgressionRules] = None
) -> bool:
    """Best MCQ score >= TOPIC_MCQ_PASS, or step 14 finished before
    GS_LMS_PROGRESSION_START (grandfathered)."""
    pass_mark = rules.topic_mcq_pass if rules is not None else TOPIC_MCQ_PASS
    start = settings.GS_LMS_PROGRESSION_START
    if start is not None and completed_at is not None and _naive_utc(completed_at) < _naive_utc(start):
        return True
    return (score or 0.0) >= pass_mark


def mastered_topic_ids(
    db: Session, student_id: int, node_ids: list[int], rules: Optional[ProgressionRules] = None
) -> set[int]:
    """Topics that are COMPLETED and have a best MCQ lab score >= TOPIC_MCQ_PASS
    (or were completed before GS_LMS_PROGRESSION_START)."""
    done = completed_topic_times(db, student_id, node_ids)
    if not done:
        return set()
    scores = best_mcq_scores(db, student_id, list(done))
    return {n for n, at in done.items() if _is_mastered(at, scores.get(n), rules)}


def check_step_gate(db: Session, student_id: int, node_id: int, step: int) -> None:
    """Raise StepGateError unless the gate for ``step`` is met (no-op while
    GS_LMS_ENFORCE_PROGRESSION is off)."""
    if not settings.GS_LMS_ENFORCE_PROGRESSION:
        return
    node = db.get(GsLmsSyllabusNode, node_id)
    rules = rules_for_subject(db, node.subject_id if node is not None else None)
    if step == DISCUSSION_STEP:
        from app.core.gs_lms.discussion import has_completed_discussion

        if not has_completed_discussion(db, student_id, node_id):
            raise StepGateError(
                "Cannot complete step 1: finish the AI discussion for this topic first."
            )
        return

    if step in RECALL_STEP_SECTIONS:
        label = RECALL_STEP_SECTIONS[step]
        has_section = (
            db.query(GsLmsContentSection.id)
            .filter(
                GsLmsContentSection.syllabus_node_id == node_id,
                GsLmsContentSection.section_label == label,
                GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .first()
            is not None
        )
        if not has_section:
            return  # nothing to recall on a section that does not exist
        best, count = recall_stats(db, student_id, node_id, label)
        if best is not None and best >= rules.recall_pass_score:
            return
        if count >= rules.recall_max_attempts:
            return
        got = "no recall attempt yet" if best is None else f"best score {round(best * 100)}%"
        raise StepGateError(
            f"Cannot complete step {step}: {label} recall not passed ({got}; need "
            f"{round(rules.recall_pass_score * 100)}% or {rules.recall_max_attempts} attempts, "
            f"{count} made)."
        )

    if step == MCQ_LAB_STEP:
        if not best_mcq_scores(db, student_id, [node_id]):
            raise StepGateError("Cannot complete step 12: submit the MCQ lab for this topic first.")


# ---------------------------------------------------------------------------
# Topic order
# ---------------------------------------------------------------------------

@dataclass
class LeafState:
    node_id: int
    title: str
    sub_topic_id: Optional[int]
    completed: bool = False
    mastered: bool = False
    best_mcq_score: Optional[float] = None
    locked: bool = False
    lock_reason: Optional[str] = None


@dataclass
class Progression:
    leaves: list[LeafState] = field(default_factory=list)
    due_checkpoints: list[GsLmsCheckpoint] = field(default_factory=list)

    @property
    def by_id(self) -> dict[int, LeafState]:
        return {leaf.node_id: leaf for leaf in self.leaves}

    @property
    def mastered_count(self) -> int:
        return sum(1 for leaf in self.leaves if leaf.mastered)

    @property
    def next_unlocked(self) -> Optional[LeafState]:
        for leaf in self.leaves:
            if not leaf.locked and not leaf.mastered:
                return leaf
        return None


def ordered_leaves(db: Session, subject_id: int) -> list[tuple[int, str, Optional[int]]]:
    """Leaf topics of a subject in syllabus order (depth-first by display_order):
    (node_id, title, sub_topic_id). Only REVIEWED nodes reachable through
    REVIEWED ancestors count (same view as the student tree), and leaves with no
    REVIEWED content section are skipped since a student cannot study them."""
    rows = (
        db.query(
            GsLmsSyllabusNode.id,
            GsLmsSyllabusNode.parent_id,
            GsLmsSyllabusNode.node_type,
            GsLmsSyllabusNode.display_order,
            GsLmsSyllabusNode.title,
        )
        .filter(
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .all()
    )
    children: dict[Optional[int], list] = {}
    for row in rows:
        children.setdefault(row.parent_id, []).append(row)
    for kids in children.values():
        kids.sort(key=lambda r: (r.display_order, r.id))

    leaves: list[tuple[int, str, Optional[int]]] = []

    def walk(parent_id: Optional[int], sub_topic_id: Optional[int]) -> None:
        for row in children.get(parent_id, []):
            node_type = getattr(row.node_type, "value", row.node_type)
            if node_type == GsLmsNodeTypeEnum.LEAF_TOPIC.value:
                leaves.append((row.id, row.title, sub_topic_id if sub_topic_id is not None else row.parent_id))
            else:
                walk(row.id, row.id if node_type == GsLmsNodeTypeEnum.SUB_TOPIC.value else sub_topic_id)

    walk(None, None)
    if not leaves:
        return leaves

    with_content = {
        r[0]
        for r in db.query(GsLmsContentSection.syllabus_node_id)
        .filter(
            GsLmsContentSection.syllabus_node_id.in_([leaf[0] for leaf in leaves]),
            GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .distinct()
        .all()
    }
    return [leaf for leaf in leaves if leaf[0] in with_content]


def compute_progression(db: Session, student_id: int, subject_id: int) -> Progression:
    """Lock / mastery state of every leaf of a subject for one student.

    A fixed number of queries regardless of the number of leaves.
    """
    profile = subject_profile(db, subject_id)
    rules = profile.progression if profile is not None else default_rules()
    step_count = len(profile.enabled_funnel_steps) if profile is not None else FINAL_STEP
    leaves = ordered_leaves(db, subject_id)
    ids = [leaf[0] for leaf in leaves]
    completed_at = completed_topic_times(db, student_id, ids)
    completed = set(completed_at)
    scores = best_mcq_scores(db, student_id, list(completed))
    checkpoints = (
        db.query(GsLmsCheckpoint)
        .filter(
            GsLmsCheckpoint.student_id == student_id,
            GsLmsCheckpoint.subject_id == subject_id,
            GsLmsCheckpoint.status == CHECKPOINT_DUE,
        )
        .order_by(GsLmsCheckpoint.id)
        .all()
    )
    due_after: dict[int, GsLmsCheckpoint] = {}
    for cp in checkpoints:
        covered = [i for i in (cp.leaf_ids or []) if i in set(ids)]
        if covered:
            last = max(covered, key=ids.index)
            due_after.setdefault(last, cp)

    prog = Progression(due_checkpoints=checkpoints)
    block: Optional[str] = None
    titles = {leaf[0]: leaf[1] for leaf in leaves}
    for node_id, title, sub_topic_id in leaves:
        score = scores.get(node_id)
        done = node_id in completed
        mastered = done and _is_mastered(completed_at.get(node_id), score, rules)
        state = LeafState(
            node_id=node_id,
            title=title,
            sub_topic_id=sub_topic_id,
            completed=done,
            mastered=mastered,
            best_mcq_score=score,
            locked=block is not None,
            lock_reason=block,
        )
        prog.leaves.append(state)
        if block is not None:
            continue
        if not mastered:
            if done:
                block = (
                    f"Score at least {round(rules.topic_mcq_pass * 100)}% in the MCQ lab of "
                    f"'{title}' to master it before moving on."
                )
            else:
                block = f"Finish '{title}' first (complete all {step_count} steps and master it) before moving on."
        elif node_id in due_after:
            names = ", ".join(f"'{titles[i]}'" for i in due_after[node_id].leaf_ids if i in titles)
            block = f"A review test is due before you continue (covers {names})."
    return prog


def leaf_lock(db: Session, user: Any, subject_id: int, node_id: int) -> Optional[str]:
    """Reason a topic is locked for the user, or None when it is open (or
    exempt, or not part of the leaf order)."""
    if is_order_exempt(user):
        return None
    state = compute_progression(db, user.id, subject_id).by_id.get(node_id)
    if state is not None and state.locked:
        return state.lock_reason
    return None


# ---------------------------------------------------------------------------
# Checkpoints
# ---------------------------------------------------------------------------

def maybe_create_checkpoints(
    db: Session, student_id: int, subject_id: int, node_id: int
) -> list[GsLmsCheckpoint]:
    """Create any checkpoint that has become due now that ``node_id`` may be
    mastered. Idempotent: leaves already covered by a checkpoint are never
    covered twice.

    Rules: every CHECKPOINT_EVERY consecutive mastered (and not yet covered)
    leaves of one sub-topic make a checkpoint; and when the sub-topic's last
    leaf is mastered, the remaining mastered run becomes a checkpoint if it has
    at least CHECKPOINT_MIN_LEAVES leaves.
    """
    rules = rules_for_subject(db, subject_id)
    leaves = ordered_leaves(db, subject_id)
    me = next((leaf for leaf in leaves if leaf[0] == node_id), None)
    if me is None:
        return []
    group = [leaf[0] for leaf in leaves if leaf[2] == me[2]]
    if node_id not in mastered_topic_ids(db, student_id, [node_id], rules):
        return []
    mastered = mastered_topic_ids(db, student_id, group, rules)

    covered: set[int] = set()
    for (ids,) in (
        db.query(GsLmsCheckpoint.leaf_ids)
        .filter(
            GsLmsCheckpoint.student_id == student_id,
            GsLmsCheckpoint.subject_id == subject_id,
            GsLmsCheckpoint.sub_topic_node_id == me[2],
        )
        .all()
    ):
        covered.update(ids or [])

    run: list[int] = []
    reached_end = True
    for leaf_id in group:
        if leaf_id in covered:
            continue
        if leaf_id not in mastered:
            reached_end = False
            break
        run.append(leaf_id)

    created: list[GsLmsCheckpoint] = []

    def make(leaf_ids: list[int]) -> None:
        cp = GsLmsCheckpoint(
            student_id=student_id,
            subject_id=subject_id,
            sub_topic_node_id=me[2],
            leaf_ids=list(leaf_ids),
            status=CHECKPOINT_DUE,
            attempts=0,
            created_by=str(student_id),
        )
        db.add(cp)
        created.append(cp)

    while len(run) >= rules.checkpoint_every:
        make(run[:rules.checkpoint_every])
        run = run[rules.checkpoint_every:]
    if run and reached_end and len(run) >= rules.checkpoint_min_leaves:
        make(run)
        run = []
    if created:
        db.flush()
    return created


def refresh_mastery(db: Session, student_id: int, node_id: int) -> list[GsLmsCheckpoint]:
    """Call after step 14 or an MCQ lab submission: if the topic is now
    mastered, create any checkpoint that became due."""
    node = db.get(GsLmsSyllabusNode, node_id)
    if node is None:
        return []
    db.flush()
    return maybe_create_checkpoints(db, student_id, node.subject_id, node_id)


def pass_checkpoint(db: Session, cp: GsLmsCheckpoint, score: float) -> bool:
    """Record a checkpoint attempt; returns True if it passed."""
    cp.attempts = (cp.attempts or 0) + 1
    cp.best_score = max(cp.best_score or 0.0, score)
    cp.updated_by = str(cp.student_id)
    passed = score >= rules_for_subject(db, cp.subject_id).checkpoint_pass
    if passed and cp.status != CHECKPOINT_PASSED:
        cp.status = CHECKPOINT_PASSED
        cp.passed_at = datetime.now(timezone.utc)
    db.flush()
    return passed


__all__ = [
    "RECALL_PASS_SCORE", "RECALL_MAX_ATTEMPTS", "TOPIC_MCQ_PASS", "CHECKPOINT_EVERY",
    "CHECKPOINT_MIN_LEAVES", "CHECKPOINT_QUESTIONS", "CHECKPOINT_PASS",
    "CHECKPOINT_DUE", "CHECKPOINT_PASSED", "RECALL_STEP_SECTIONS",
    "StepGateError", "is_order_exempt", "recall_stats", "weak_recall_sections",
    "best_mcq_scores", "completed_topic_ids", "mastered_topic_ids",
    "check_step_gate", "LeafState", "Progression", "ordered_leaves",
    "compute_progression", "leaf_lock", "maybe_create_checkpoints",
    "refresh_mastery", "pass_checkpoint", "default_rules", "rules_for_subject",
    "subject_profile", "profile_for_node",
]
