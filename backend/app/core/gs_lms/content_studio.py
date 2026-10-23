"""Content studio: what is actually live for a GS subject, and approving it.

Readiness here is read from the database (what students can reach), not from a
content file. The thresholds come from ``content_check`` so the file checker and
this page can never disagree about what "ready" means.

* ``subject_readiness`` / ``subject_topics``: counts per subject and per leaf
  topic, with a plain-words "next to write" list.
* ``worklist_csv``: the same per-topic data as CSV for the team's spreadsheet.
* ``set_review``: approve (REVIEWED) or un-approve (UNREVIEWED) a topic or a
  whole sub-/mega-topic, and log who did it.

Review status on a leaf covers its own row and, if asked, its sections, MCQs,
concepts, concept versions and PYQs. Mega- and sub-topics above an approved
leaf are approved too (students' syllabus tree hides a parent that is not
reviewed), and fall back to UNREVIEWED when no reviewed leaf is left under them.
"""

from __future__ import annotations

import csv
import io
from datetime import datetime, timezone
from typing import Any, Iterable, Optional

from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.exam_profiles import profile_for_subject
from app.core.gs_lms.content_check import (
    MAX_KEY_POINTS,
    MCQS_PER_TOPIC,
    MIN_KEY_POINTS,
)
from app.core.gs_lms.models import (
    GsLmsConcept,
    GsLmsConceptBookRef,
    GsLmsConceptVersion,
    GsLmsContentImport,
    GsLmsContentReviewLog,
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsSyllabusNode,
)

REVIEWED = GsReviewStatusEnum.REVIEWED
UNREVIEWED = GsReviewStatusEnum.UNREVIEWED

REVIEW_PARTS = ("topic", "mcqs", "concepts", "versions", "pyqs")

SECTION_NAMES = {
    "BASIC": "Basic",
    "NCERT_LEVEL": "NCERT level",
    "ADVANCED": "Advanced",
    "CURRENT_AFFAIRS": "Current affairs",
    "EXAMINER_TRAPS": "Examiner traps",
}


def _is_reviewed(status: Any) -> bool:
    return status == REVIEWED


# ---------------------------------------------------------------------------
# Readiness
# ---------------------------------------------------------------------------

def _ordered_nodes(db: Session, subject_id: int) -> tuple[dict[int, GsLmsSyllabusNode], list[int]]:
    """All nodes of the subject by id, and the ids in tree (depth-first) order."""
    nodes = db.query(GsLmsSyllabusNode).filter(GsLmsSyllabusNode.subject_id == subject_id).all()
    by_id = {n.id: n for n in nodes}
    children: dict[Optional[int], list[GsLmsSyllabusNode]] = {}
    for n in nodes:
        parent = n.parent_id if n.parent_id in by_id else None
        children.setdefault(parent, []).append(n)
    for group in children.values():
        group.sort(key=lambda n: (n.display_order or 0, n.id))
    order: list[int] = []

    def walk(parent: Optional[int]) -> None:
        for n in children.get(parent, []):
            order.append(n.id)
            walk(n.id)

    walk(None)
    return by_id, order


def _titles_above(by_id: dict[int, GsLmsSyllabusNode], node: GsLmsSyllabusNode) -> tuple[str, str]:
    """(mega-topic title, sub-topic title) above a node; empty when absent."""
    mega = sub = ""
    parent = by_id.get(node.parent_id) if node.parent_id else None
    while parent is not None:
        if parent.node_type == GsLmsNodeTypeEnum.SUB_TOPIC and not sub:
            sub = parent.title
        elif parent.node_type == GsLmsNodeTypeEnum.MEGA_TOPIC:
            mega = parent.title
        parent = by_id.get(parent.parent_id) if parent.parent_id else None
    return mega, sub


def _plural(n: int, word: str) -> str:
    return f"{n} {word}" if n == 1 else f"{n} {word}s"


def _next_to_write(
    sections_missing: list[str],
    mcq_total: int,
    mcq_no_explanation: int,
    pyq_total: int,
    concept_total: int,
    concepts_bad_points: int,
) -> list[str]:
    todo: list[str] = []
    for label in sections_missing:
        todo.append(f"Write the {SECTION_NAMES.get(label, label)} section")
    if mcq_total < MCQS_PER_TOPIC:
        todo.append(
            f"Add {_plural(MCQS_PER_TOPIC - mcq_total, 'MCQ')} ({mcq_total} of {MCQS_PER_TOPIC} written)"
        )
    if mcq_no_explanation:
        todo.append(f"Add an explanation to {_plural(mcq_no_explanation, 'MCQ')}")
    if pyq_total == 0:
        todo.append("Add at least one previous-year question (PYQ)")
    if concept_total == 0:
        todo.append("Add concepts (the small ideas this topic teaches)")
    if concepts_bad_points:
        todo.append(
            f"Fix the key points of {_plural(concepts_bad_points, 'concept')} "
            f"(each needs {MIN_KEY_POINTS} to {MAX_KEY_POINTS})"
        )
    return todo


def subject_topics(db: Session, subject: GsSubject) -> list[dict[str, Any]]:
    """One row per leaf topic, in tree order, with what is present and missing."""
    by_id, order = _ordered_nodes(db, subject.id)
    leaf_ids = [i for i in order if by_id[i].node_type == GsLmsNodeTypeEnum.LEAF_TOPIC]
    if not leaf_ids:
        return []
    leaf_set = set(leaf_ids)

    sections: dict[int, dict[str, bool]] = {}
    sections_reviewed: dict[int, int] = {}
    for node_id, label, blocks, status in (
        db.query(
            GsLmsContentSection.syllabus_node_id,
            GsLmsContentSection.section_label,
            GsLmsContentSection.blocks,
            GsLmsContentSection.review_status,
        )
        .join(GsLmsSyllabusNode, GsLmsSyllabusNode.id == GsLmsContentSection.syllabus_node_id)
        .filter(GsLmsSyllabusNode.subject_id == subject.id)
    ):
        key = label.value if hasattr(label, "value") else str(label)
        sections.setdefault(node_id, {})[key] = bool(blocks)
        if _is_reviewed(status):
            sections_reviewed[node_id] = sections_reviewed.get(node_id, 0) + 1

    mcq = {i: {"total": 0, "reviewed": 0, "no_explanation": 0} for i in leaf_ids}
    for node_id, status, explanation in (
        db.query(
            GsLmsMcqQuestion.syllabus_node_id, GsLmsMcqQuestion.review_status, GsLmsMcqQuestion.explanation
        )
        .join(GsLmsSyllabusNode, GsLmsSyllabusNode.id == GsLmsMcqQuestion.syllabus_node_id)
        .filter(GsLmsSyllabusNode.subject_id == subject.id)
    ):
        if node_id not in mcq:
            continue
        mcq[node_id]["total"] += 1
        mcq[node_id]["reviewed"] += 1 if _is_reviewed(status) else 0
        mcq[node_id]["no_explanation"] += 0 if (explanation or "").strip() else 1

    pyq = {i: {"total": 0, "reviewed": 0} for i in leaf_ids}
    for node_id, status in db.query(GsLmsPyq.syllabus_node_id, GsLmsPyq.review_status).filter(
        GsLmsPyq.subject_id == subject.id
    ):
        if node_id in pyq:
            pyq[node_id]["total"] += 1
            pyq[node_id]["reviewed"] += 1 if _is_reviewed(status) else 0

    concepts = {
        i: {"total": 0, "reviewed": 0, "good_points": 0, "with_version": 0, "versions": 0,
            "versions_reviewed": 0, "book_refs": 0}
        for i in leaf_ids
    }
    concept_node: dict[int, int] = {}
    for cid, node_id, key_points, status in (
        db.query(
            GsLmsConcept.id, GsLmsConcept.syllabus_node_id, GsLmsConcept.key_points, GsLmsConcept.review_status
        )
        .join(GsLmsSyllabusNode, GsLmsSyllabusNode.id == GsLmsConcept.syllabus_node_id)
        .filter(GsLmsSyllabusNode.subject_id == subject.id)
    ):
        if node_id not in concepts:
            continue
        concept_node[cid] = node_id
        c = concepts[node_id]
        c["total"] += 1
        c["reviewed"] += 1 if _is_reviewed(status) else 0
        points = key_points if isinstance(key_points, list) else []
        c["good_points"] += 1 if MIN_KEY_POINTS <= len(points) <= MAX_KEY_POINTS else 0
    versions_of: set[int] = set()
    for cid, status in (
        db.query(GsLmsConceptVersion.concept_id, GsLmsConceptVersion.review_status)
        .join(GsLmsConcept, GsLmsConcept.id == GsLmsConceptVersion.concept_id)
        .join(GsLmsSyllabusNode, GsLmsSyllabusNode.id == GsLmsConcept.syllabus_node_id)
        .filter(GsLmsSyllabusNode.subject_id == subject.id)
    ):
        node_id = concept_node.get(cid)
        if node_id is None:
            continue
        c = concepts[node_id]
        c["versions"] += 1
        c["versions_reviewed"] += 1 if _is_reviewed(status) else 0
        if cid not in versions_of:
            versions_of.add(cid)
            c["with_version"] += 1
    for (cid,) in (
        db.query(GsLmsConceptBookRef.concept_id)
        .join(GsLmsConcept, GsLmsConcept.id == GsLmsConceptBookRef.concept_id)
        .join(GsLmsSyllabusNode, GsLmsSyllabusNode.id == GsLmsConcept.syllabus_node_id)
        .filter(GsLmsSyllabusNode.subject_id == subject.id)
    ):
        node_id = concept_node.get(cid)
        if node_id is not None:
            concepts[node_id]["book_refs"] += 1

    # Which sections a topic needs depends on the subject's exam (NEET/JEE: no CURRENT_AFFAIRS).
    required_sections = list(profile_for_subject(subject).section_labels)
    rows: list[dict[str, Any]] = []
    for leaf_id in leaf_ids:
        node = by_id[leaf_id]
        mega, sub = _titles_above(by_id, node)
        have = sections.get(leaf_id, {})
        present = [s for s in required_sections if have.get(s)]
        missing = [s for s in required_sections if not have.get(s)]
        m, p, c = mcq[leaf_id], pyq[leaf_id], concepts[leaf_id]
        todo = _next_to_write(
            missing, m["total"], m["no_explanation"], p["total"], c["total"], c["total"] - c["good_points"]
        )
        rows.append({
            "node_id": leaf_id,
            "parent_id": node.parent_id if node.parent_id in by_id else None,
            "mega_title": mega,
            "sub_title": sub,
            "title": node.title,
            "review_status": node.review_status.value if hasattr(node.review_status, "value") else str(node.review_status),
            "sections_present": present,
            "sections_missing": missing,
            "sections_reviewed": sections_reviewed.get(leaf_id, 0),
            "mcqs": m["total"],
            "mcqs_needed": MCQS_PER_TOPIC,
            "mcqs_reviewed": m["reviewed"],
            "mcqs_unreviewed": m["total"] - m["reviewed"],
            "pyqs": p["total"],
            "pyqs_reviewed": p["reviewed"],
            "concepts": c["total"],
            "concepts_reviewed": c["reviewed"],
            "concepts_with_good_key_points": c["good_points"],
            "concepts_with_version": c["with_version"],
            "versions": c["versions"],
            "versions_reviewed": c["versions_reviewed"],
            "book_refs": c["book_refs"],
            "content_ready": not todo,
            "next_to_write": todo,
        })
    return rows


def _unfinished_count(db: Session, subject_id: int) -> int:
    """Mega-/sub-topics with nothing under them (the checker's ``unfinished``)."""
    by_id, _ = _ordered_nodes(db, subject_id)
    with_children = {n.parent_id for n in by_id.values() if n.parent_id}
    return sum(
        1 for n in by_id.values()
        if n.node_type != GsLmsNodeTypeEnum.LEAF_TOPIC and n.id not in with_children
    )


def last_import(db: Session, subject: GsSubject) -> Optional[dict[str, Any]]:
    """The newest import: from the Content studio log, else the CLI's completeness_status."""
    row = (
        db.query(GsLmsContentImport)
        .filter(GsLmsContentImport.subject_id == subject.id)
        .order_by(GsLmsContentImport.created_at.desc(), GsLmsContentImport.id.desc())
        .first()
    )
    if row is not None:
        return {"at": _iso(row.created_at), "filename": row.filename, "source": "content_studio"}
    status = subject.completeness_status if isinstance(subject.completeness_status, dict) else None
    if status:
        return {"at": status.get("imported_at"), "filename": None, "source": "command_line"}
    return None


def _iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def subject_readiness(db: Session, subject: GsSubject) -> dict[str, Any]:
    topics = subject_topics(db, subject)
    profile = profile_for_subject(subject)
    return {
        "slug": subject.slug,
        "name": subject.name,
        "exam": profile.code,
        "exam_name": profile.name,
        "rules": {
            "required_sections": list(profile.section_labels),
            "pyq_exam_types": list(profile.pyq_exam_types),
            "question_types": [t for t in profile.question_types if profile.supports_question_type(t)],
            "unsupported_question_types": list(profile.unsupported_question_types),
            "mcqs_per_topic": MCQS_PER_TOPIC,
            "skipped_funnel_steps": sorted(profile.disabled_funnel_steps),
        },
        "topics": len(topics),
        "topics_ready": sum(1 for t in topics if t["content_ready"]),
        "topics_reviewed": sum(1 for t in topics if t["review_status"] == "REVIEWED"),
        "unfinished": _unfinished_count(db, subject.id),
        "mcqs": sum(t["mcqs"] for t in topics),
        "mcqs_reviewed": sum(t["mcqs_reviewed"] for t in topics),
        "mcqs_unreviewed": sum(t["mcqs_unreviewed"] for t in topics),
        "concepts": sum(t["concepts"] for t in topics),
        "versions": sum(t["versions"] for t in topics),
        "pyqs": sum(t["pyqs"] for t in topics),
        "is_complete": bool(subject.is_complete),
        "last_import": last_import(db, subject),
    }


# ---------------------------------------------------------------------------
# Worklist CSV
# ---------------------------------------------------------------------------

WORKLIST_HEADER = [
    "Mega topic", "Sub topic", "Topic", "Status", "Content ready", "Missing sections",
    "MCQs", "MCQs needed", "MCQs approved", "PYQs", "Concepts", "Concept versions", "Book references",
    "Next to write",
]


def _safe_cell(value: Any) -> Any:
    """Stop a spreadsheet reading a text cell as a formula."""
    if isinstance(value, str) and value[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return value


def worklist_csv(db: Session, subject: GsSubject) -> str:
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(WORKLIST_HEADER)
    for t in subject_topics(db, subject):
        writer.writerow([
            _safe_cell(v) for v in (
                t["mega_title"], t["sub_title"], t["title"],
                "Approved" if t["review_status"] == "REVIEWED" else "Draft",
                "yes" if t["content_ready"] else "no",
                ", ".join(SECTION_NAMES.get(s, s) for s in t["sections_missing"]),
                t["mcqs"], t["mcqs_needed"], t["mcqs_reviewed"], t["pyqs"], t["concepts"],
                t["versions"], t["book_refs"],
                "; ".join(t["next_to_write"]),
            )
        ])
    return out.getvalue()


# ---------------------------------------------------------------------------
# Approve / un-approve
# ---------------------------------------------------------------------------

def _descendant_leaves(by_id: dict[int, GsLmsSyllabusNode], root_id: int) -> tuple[list[int], list[int]]:
    """(leaf ids, non-leaf ids) of the subtree at root_id, root included."""
    kids: dict[int, list[int]] = {}
    for n in by_id.values():
        if n.parent_id in by_id:
            kids.setdefault(n.parent_id, []).append(n.id)
    leaves: list[int] = []
    inner: list[int] = []
    stack = [root_id]
    while stack:
        nid = stack.pop()
        if by_id[nid].node_type == GsLmsNodeTypeEnum.LEAF_TOPIC:
            leaves.append(nid)
        else:
            inner.append(nid)
        stack.extend(kids.get(nid, []))
    return leaves, inner


def _bulk_set(db: Session, model: Any, filters: list[Any], status: GsReviewStatusEnum, actor: str) -> int:
    return (
        db.query(model)
        .filter(*filters)
        .update({"review_status": status, "updated_by": actor}, synchronize_session=False)
    )


def set_review(
    db: Session,
    node_id: int,
    status: str,
    *,
    include: Optional[Iterable[str]] = None,
    user_id: Optional[int] = None,
    only_ready: bool = False,
) -> dict[str, Any]:
    """Set review status on a leaf, or on every leaf under a sub-/mega-topic.

    ``include`` picks which rows change (default all of ``REVIEW_PARTS``). With
    ``only_ready`` topics whose content is incomplete are skipped and reported.
    Commits. Raises ``LookupError`` for an unknown node and ``ValueError`` for
    bad input.
    """
    new_status = GsReviewStatusEnum(status)
    if new_status == GsReviewStatusEnum.IN_REVIEW:
        raise ValueError("status must be REVIEWED or UNREVIEWED")
    parts = list(include) if include is not None else list(REVIEW_PARTS)
    unknown = [p for p in parts if p not in REVIEW_PARTS]
    if unknown:
        raise ValueError(f"include has unknown part(s): {', '.join(unknown)}")
    if not parts:
        raise ValueError("include must name at least one part")

    node = db.get(GsLmsSyllabusNode, node_id)
    if node is None:
        raise LookupError("Topic not found")
    subject = db.get(GsSubject, node.subject_id)
    by_id, _ = _ordered_nodes(db, node.subject_id)
    leaf_ids, inner_ids = _descendant_leaves(by_id, node_id)

    skipped: list[dict[str, Any]] = []
    if only_ready and new_status == REVIEWED:
        ready = {t["node_id"]: t for t in subject_topics(db, subject)}
        keep = []
        for lid in leaf_ids:
            if ready.get(lid, {}).get("content_ready"):
                keep.append(lid)
            else:
                skipped.append({"node_id": lid, "title": by_id[lid].title})
        leaf_ids = keep

    actor = f"user:{user_id}" if user_id is not None else "content-studio"
    counts: dict[str, Any] = {"include": parts, "topics": len(leaf_ids), "skipped_not_ready": skipped}
    if leaf_ids:
        if "topic" in parts:
            counts["topic"] = _bulk_set(
                db, GsLmsSyllabusNode, [GsLmsSyllabusNode.id.in_(leaf_ids)], new_status, actor
            )
            counts["sections"] = _bulk_set(
                db, GsLmsContentSection, [GsLmsContentSection.syllabus_node_id.in_(leaf_ids)], new_status, actor
            )
        if "mcqs" in parts:
            counts["mcqs"] = _bulk_set(
                db, GsLmsMcqQuestion, [GsLmsMcqQuestion.syllabus_node_id.in_(leaf_ids)], new_status, actor
            )
        if "pyqs" in parts:
            counts["pyqs"] = _bulk_set(db, GsLmsPyq, [GsLmsPyq.syllabus_node_id.in_(leaf_ids)], new_status, actor)
        concept_ids = [
            cid for (cid,) in db.query(GsLmsConcept.id).filter(GsLmsConcept.syllabus_node_id.in_(leaf_ids))
        ]
        if "concepts" in parts:
            counts["concepts"] = _bulk_set(db, GsLmsConcept, [GsLmsConcept.id.in_(concept_ids)], new_status, actor) if concept_ids else 0
        if "versions" in parts:
            counts["versions"] = (
                _bulk_set(db, GsLmsConceptVersion, [GsLmsConceptVersion.concept_id.in_(concept_ids)], new_status, actor)
                if concept_ids else 0
            )
        db.flush()
        if "topic" in parts:
            _sync_parents(db, by_id, leaf_ids, node_id, inner_ids, actor)

    db.add(GsLmsContentReviewLog(node_id=node_id, user_id=user_id, status=new_status.value, counts=counts))
    _refresh_reviewed_stats(db, subject)
    db.commit()
    return {"node_id": node_id, "status": new_status.value, **counts}


def _sync_parents(
    db: Session,
    by_id: dict[int, GsLmsSyllabusNode],
    changed_leaves: list[int],
    root_id: int,
    inner_ids: list[int],
    actor: str,
) -> None:
    """Mega-/sub-topics are REVIEWED exactly when a reviewed leaf sits under them.

    Only the changed leaves' ancestors, and the sub-tree being bulk-changed, are touched.
    """
    leaf_status = {
        nid: st for nid, st in db.query(GsLmsSyllabusNode.id, GsLmsSyllabusNode.review_status)
        .filter(GsLmsSyllabusNode.subject_id == by_id[root_id].subject_id,
                GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC)
    }
    kids: dict[int, list[int]] = {}
    for n in by_id.values():
        if n.parent_id in by_id:
            kids.setdefault(n.parent_id, []).append(n.id)

    memo: dict[int, bool] = {}

    def has_reviewed_leaf(nid: int) -> bool:
        if nid in memo:
            return memo[nid]
        if by_id[nid].node_type == GsLmsNodeTypeEnum.LEAF_TOPIC:
            result = _is_reviewed(leaf_status.get(nid))
        else:
            result = any(has_reviewed_leaf(k) for k in kids.get(nid, []))
        memo[nid] = result
        return result

    affected = set(inner_ids)
    for lid in changed_leaves:
        parent = by_id[lid].parent_id
        while parent in by_id:
            affected.add(parent)
            parent = by_id[parent].parent_id
    for nid in affected:
        if by_id[nid].node_type == GsLmsNodeTypeEnum.LEAF_TOPIC:
            continue
        want = REVIEWED if has_reviewed_leaf(nid) else UNREVIEWED
        if by_id[nid].review_status != want:
            by_id[nid].review_status = want
            by_id[nid].updated_by = actor
    db.flush()


def _refresh_reviewed_stats(db: Session, subject: GsSubject) -> None:
    """Keep ``completeness_status`` in step with approvals.

    ``is_complete`` says the *content* has no gaps and is set by the importer
    from the file check; approving does not change that, so only the reviewed
    counts are refreshed here.
    """
    reviewed = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == subject.id,
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
            GsLmsSyllabusNode.review_status == REVIEWED,
        )
        .count()
    )
    status = dict(subject.completeness_status) if isinstance(subject.completeness_status, dict) else {}
    status["reviewed_topics"] = reviewed
    status["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    subject.completeness_status = status  # reassigned so the JSON change is saved
