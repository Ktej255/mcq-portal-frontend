"""Where a student goes next in the single-page study flow.

``next_for_student`` walks the subject's leaf order (``progression``): the
first not-mastered leaf the student may open (any leaf for exempt users) gives
its first not-PASSED reviewed concept; when every concept is passed but the
topic is not mastered it gives the leaf's MCQ lab. With no such leaf, a due
checkpoint is next, else "done". ``next_after_concept`` is the pointer shown on
a concept card and after an explanation.

Reads only; never commits.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.gs.models import GsSubject
from app.core.gs_lms.mastery import get_reviewed_concepts
from app.core.gs_lms.models import GsLmsConcept
from app.core.gs_lms.progression import compute_progression, is_order_exempt
from app.core.gs_lms.student_models import GsLmsConceptMastery, GsLmsConceptMasteryStatusEnum


@dataclass
class NextStep:
    type: str  # concept | mcq_lab | checkpoint | done
    subject_slug: Optional[str] = None
    leaf_id: Optional[int] = None
    concept_id: Optional[int] = None
    checkpoint_id: Optional[int] = None
    label: str = ""


def _passed_ids(db: Session, student_id: int, concept_ids: list[int]) -> set[int]:
    if not concept_ids:
        return set()
    rows = (
        db.query(GsLmsConceptMastery.concept_id)
        .filter(
            GsLmsConceptMastery.student_id == student_id,
            GsLmsConceptMastery.concept_id.in_(concept_ids),
            GsLmsConceptMastery.status == GsLmsConceptMasteryStatusEnum.PASSED,
        )
        .all()
    )
    return {r[0] for r in rows}


def _leaf_step(db: Session, student_id: int, subject: GsSubject, leaf_id: int, title: str) -> NextStep:
    concepts = get_reviewed_concepts(db, leaf_id)
    passed = _passed_ids(db, student_id, [c.id for c in concepts])
    for c in concepts:
        if c.id not in passed:
            return NextStep("concept", subject.slug, leaf_id, c.id, None, f"Next concept: {c.title}")
    return NextStep("mcq_lab", subject.slug, leaf_id, None, None, f"MCQ lab: {title}")


def next_in_subject(db: Session, user: Any, subject: GsSubject) -> NextStep:
    prog = compute_progression(db, user.id, subject.id)
    exempt = is_order_exempt(user)
    for leaf in prog.leaves:
        if leaf.mastered or (leaf.locked and not exempt):
            continue
        return _leaf_step(db, user.id, subject, leaf.node_id, leaf.title)
    if prog.due_checkpoints:
        cp = prog.due_checkpoints[0]
        return NextStep("checkpoint", subject.slug, None, None, cp.id, "Review test due")
    return NextStep("done", subject.slug, None, None, None, "You are all caught up")


def next_for_student(db: Session, user: Any, subject_slug: Optional[str] = None) -> NextStep:
    q = db.query(GsSubject)
    if subject_slug:
        q = q.filter(GsSubject.slug == subject_slug)
    last: Optional[NextStep] = None
    for subject in q.order_by(GsSubject.display_order, GsSubject.id).all():
        step = next_in_subject(db, user, subject)
        if step.type != "done":
            return step
        if not compute_progression(db, user.id, subject.id).leaves:
            continue  # subject without studyable leaves
        last = last or step
    return last or NextStep("done", subject_slug, None, None, None, "Nothing to study yet")


def next_after_concept(db: Session, user: Any, subject: GsSubject, concept: GsLmsConcept) -> Optional[NextStep]:
    """None while the concept is not PASSED; else the next unpassed concept of
    the leaf, the leaf's MCQ lab, or (leaf mastered) the general next step."""
    concepts = get_reviewed_concepts(db, concept.syllabus_node_id)
    passed = _passed_ids(db, user.id, [c.id for c in concepts])
    if concept.id not in passed:
        return None
    ids = [c.id for c in concepts]
    pos = ids.index(concept.id) if concept.id in ids else -1
    order = concepts[pos + 1:] + concepts[: max(pos, 0)]
    for c in order:
        if c.id not in passed:
            return NextStep("concept", subject.slug, concept.syllabus_node_id, c.id, None, f"Next concept: {c.title}")
    state = compute_progression(db, user.id, subject.id).by_id.get(concept.syllabus_node_id)
    if state is not None and state.mastered:
        return next_for_student(db, user, None)
    leaf_title = state.title if state else concept.syllabus_node.title
    return NextStep("mcq_lab", subject.slug, concept.syllabus_node_id, None, None, f"MCQ lab: {leaf_title}")


__all__ = ["NextStep", "next_in_subject", "next_for_student", "next_after_concept"]
