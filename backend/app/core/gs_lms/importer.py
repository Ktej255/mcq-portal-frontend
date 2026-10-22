"""No-loss content importer for GS LMS Platform (Task 9.4).

Mirrors the Optional platform ``importer.py`` pattern: takes a JSON artifact
(or in-memory dict) and imports it into the database as GS LMS content.

The importer handles:
  1. Syllabus tree nodes (with parent relationships, node types, weights, ordering)
  2. Content sections per leaf node (5 sections each with blocks)
  3. PYQs (Prelims + Mains with metadata)
  4. MCQ questions (with options, correct answer, type classification)
  5. Concepts per leaf node (title, key points, misconceptions), each with
     optional ready-made versions and book references
  6. Books and their chapters (top-level "books" list, imported before the tree)

Idempotency strategy: match existing records by (title + parent_id) for tree
nodes, (syllabus_node_id + section_label) for content sections,
(syllabus_node_id + title) for concepts, (concept_id + level + style + source)
for concept versions, slug for books, (book_id + number) for chapters,
(concept_id + chapter_id) for book refs, and
(syllabus_node_id + question_text) for PYQs/MCQs. On re-run, existing records
are updated rather than duplicated — running twice produces the same DB state
as running once (Design Property 20).

Review gate: all imported content starts as UNREVIEWED by default, satisfying
Property 19 (review-gate filtering). Pass ``review_status="REVIEWED"`` to
bypass the gate for pre-approved content.

Requirements: 10.5, 11.4
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.content_check import check_subject_content, format_report
from app.core.gs_lms.understanding import tokenize
from app.core.gs_lms.models import (
    GsLmsSyllabusNode,
    GsLmsContentSection,
    GsLmsConcept,
    GsLmsConceptVersion,
    GsLmsBook,
    GsLmsBookChapter,
    GsLmsConceptBookRef,
    GsLmsVersionLevelEnum,
    GsLmsVersionStyleEnum,
    GsLmsVersionSourceEnum,
    GsLmsPyq,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsExamTypeEnum,
    GsLmsQuestionTypeEnum,
    GsLmsSectionLabelEnum,
)

# Default artifact path (committed, reproducible).
DEFAULT_ARTIFACT_PATH = (
    Path(__file__).resolve().parent / "data" / "gs_geography_syllabus.json"
)

# Actor identifier stamped on audit fields.
_ACTOR = "gs-lms-importer"


# ---------------------------------------------------------------------------
# Artifact Loading
# ---------------------------------------------------------------------------


def load_artifact(artifact_path: Optional[os.PathLike | str] = None) -> dict[str, Any]:
    """Load a GS LMS JSON artifact from disk.

    Returns the parsed dict. Raises FileNotFoundError if the path does not
    exist.
    """
    path = Path(artifact_path) if artifact_path else DEFAULT_ARTIFACT_PATH
    if not path.exists():
        raise FileNotFoundError(
            f"GS LMS content artifact not found at {path}. "
            "Provide a valid artifact path or place the file at the default location."
        )
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# Syllabus Tree Import
# ---------------------------------------------------------------------------


def import_syllabus_tree(
    db: Session,
    tree_data: list[dict[str, Any]],
    subject_id: int,
    *,
    review_status: str = "UNREVIEWED",
    parent_id: Optional[int] = None,
) -> dict[str, Any]:
    """Import a syllabus tree structure into the database.

    Each node in ``tree_data`` is a dict with keys:
      - title (str): Node title
      - node_type (str): MEGA_TOPIC, SUB_TOPIC, or LEAF_TOPIC
      - weight (float): Weight for coverage calculation
      - display_order (int): Order within siblings
      - ordering_justification (str | None): Why this ordering
      - day_lesson_id (int | None): Bridge to existing day-lesson system
      - children (list[dict]): Child nodes (recursive)
      - content_sections (list[dict] | None): Sections for leaf nodes
      - concepts (list[dict] | None): Concepts for leaf nodes
      - pyqs (list[dict] | None): PYQs for this node
      - mcq_questions (list[dict] | None): MCQ questions for this node

    Idempotency: matches existing nodes by (title + parent_id + subject_id).
    If found, updates attributes; otherwise creates a new node.

    Returns a counts dict summarizing what was imported.
    """
    rs_enum = GsReviewStatusEnum(review_status)
    counts = {
        "nodes_created": 0,
        "nodes_updated": 0,
        "sections_created": 0,
        "sections_updated": 0,
        "concepts_created": 0,
        "concepts_updated": 0,
        "pyqs_created": 0,
        "pyqs_updated": 0,
        "mcqs_created": 0,
        "mcqs_updated": 0,
        "versions_created": 0,
        "versions_updated": 0,
        "book_refs_created": 0,
        "book_refs_updated": 0,
    }

    for node_data in tree_data:
        node_counts = _import_node(
            db,
            node_data,
            subject_id=subject_id,
            parent_id=parent_id,
            review_status=rs_enum,
        )
        _merge_counts(counts, node_counts)

    db.flush()
    return counts


def _import_node(
    db: Session,
    node_data: dict[str, Any],
    *,
    subject_id: int,
    parent_id: Optional[int],
    review_status: GsReviewStatusEnum,
) -> dict[str, Any]:
    """Import a single syllabus node and recurse into children.

    Idempotent: matches by (title, parent_id, subject_id).
    """
    counts = {
        "nodes_created": 0,
        "nodes_updated": 0,
        "sections_created": 0,
        "sections_updated": 0,
        "concepts_created": 0,
        "concepts_updated": 0,
        "pyqs_created": 0,
        "pyqs_updated": 0,
        "mcqs_created": 0,
        "mcqs_updated": 0,
        "versions_created": 0,
        "versions_updated": 0,
        "book_refs_created": 0,
        "book_refs_updated": 0,
    }

    title = node_data["title"]
    node_type = GsLmsNodeTypeEnum(node_data["node_type"])

    # Idempotent lookup: match by title + parent + subject.
    existing = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.title == title,
            GsLmsSyllabusNode.parent_id == parent_id,
            GsLmsSyllabusNode.subject_id == subject_id,
        )
        .one_or_none()
    )

    # video_url and concept_checklist are only meaningful on LEAF_TOPIC nodes.
    video_url = node_data.get("video_url") if node_type == GsLmsNodeTypeEnum.LEAF_TOPIC else None
    concept_checklist = node_data.get("concept_checklist") if node_type == GsLmsNodeTypeEnum.LEAF_TOPIC else None

    if existing:
        # Update existing node attributes.
        existing.node_type = node_type
        existing.weight = node_data.get("weight", 1.0)
        existing.display_order = node_data.get("display_order", 0)
        existing.ordering_justification = node_data.get("ordering_justification")
        existing.day_lesson_id = node_data.get("day_lesson_id")
        existing.video_url = video_url
        existing.concept_checklist = concept_checklist
        existing.review_status = review_status
        existing.updated_by = _ACTOR
        db.flush()
        node = existing
        counts["nodes_updated"] += 1
    else:
        # Create new node.
        node = GsLmsSyllabusNode(
            subject_id=subject_id,
            parent_id=parent_id,
            title=title,
            node_type=node_type,
            weight=node_data.get("weight", 1.0),
            display_order=node_data.get("display_order", 0),
            ordering_justification=node_data.get("ordering_justification"),
            day_lesson_id=node_data.get("day_lesson_id"),
            video_url=video_url,
            concept_checklist=concept_checklist,
            review_status=review_status,
            created_by=_ACTOR,
            updated_by=_ACTOR,
        )
        db.add(node)
        db.flush()
        counts["nodes_created"] += 1

    # Import content sections for this node (if provided).
    sections_data = node_data.get("content_sections")
    if sections_data:
        sec_counts = import_content_sections(
            db, sections_data, node.id, review_status=review_status.value
        )
        counts["sections_created"] += sec_counts["created"]
        counts["sections_updated"] += sec_counts["updated"]

    # Import concepts for this node (if provided).
    concepts_data = node_data.get("concepts")
    if concepts_data:
        concept_counts = import_concepts(
            db, concepts_data, node.id, review_status=review_status.value
        )
        counts["concepts_created"] += concept_counts["created"]
        counts["concepts_updated"] += concept_counts["updated"]
        for key in ("versions_created", "versions_updated", "book_refs_created", "book_refs_updated"):
            counts[key] += concept_counts[key]

    # Import PYQs for this node (if provided).
    pyqs_data = node_data.get("pyqs")
    if pyqs_data:
        pyq_counts = import_pyqs(
            db, pyqs_data, subject_id, node_id=node.id, review_status=review_status.value
        )
        counts["pyqs_created"] += pyq_counts["created"]
        counts["pyqs_updated"] += pyq_counts["updated"]

    # Import MCQ questions for this node (if provided).
    mcqs_data = node_data.get("mcq_questions")
    if mcqs_data:
        mcq_counts = import_mcq_questions(
            db, mcqs_data, node.id, review_status=review_status.value
        )
        counts["mcqs_created"] += mcq_counts["created"]
        counts["mcqs_updated"] += mcq_counts["updated"]

    # Recurse into children.
    children_data = node_data.get("children", [])
    for child_data in children_data:
        child_counts = _import_node(
            db,
            child_data,
            subject_id=subject_id,
            parent_id=node.id,
            review_status=review_status,
        )
        _merge_counts(counts, child_counts)

    return counts


# ---------------------------------------------------------------------------
# Content Sections Import
# ---------------------------------------------------------------------------


def import_content_sections(
    db: Session,
    sections_data: list[dict[str, Any]],
    node_id: int,
    *,
    review_status: str = "UNREVIEWED",
) -> dict[str, int]:
    """Import content sections for a syllabus node.

    Each section dict has keys:
      - section_label (str): BASIC, ADVANCED, NCERT_LEVEL, CURRENT_AFFAIRS, or EXAMINER_TRAPS
      - title (str): Section title
      - blocks (list[dict]): Content blocks
      - display_order (int): 1-4
      - authored (bool): Whether content is authored

    Idempotency: matches by (syllabus_node_id + section_label).

    Returns counts of created and updated sections.
    """
    rs_enum = GsReviewStatusEnum(review_status)
    created = 0
    updated = 0

    for sec_data in sections_data:
        section_label = GsLmsSectionLabelEnum(sec_data["section_label"])

        existing = (
            db.query(GsLmsContentSection)
            .filter(
                GsLmsContentSection.syllabus_node_id == node_id,
                GsLmsContentSection.section_label == section_label,
            )
            .one_or_none()
        )

        if existing:
            existing.title = sec_data.get("title", existing.title)
            existing.blocks = sec_data.get("blocks", existing.blocks)
            existing.display_order = sec_data.get("display_order", existing.display_order)
            existing.review_status = rs_enum
            existing.authored = sec_data.get("authored", existing.authored)
            existing.updated_by = _ACTOR
            updated += 1
        else:
            section = GsLmsContentSection(
                syllabus_node_id=node_id,
                section_label=section_label,
                title=sec_data.get("title", section_label.value),
                blocks=sec_data.get("blocks"),
                display_order=sec_data.get("display_order", 0),
                review_status=rs_enum,
                authored=sec_data.get("authored", False),
                created_by=_ACTOR,
                updated_by=_ACTOR,
            )
            db.add(section)
            created += 1

    db.flush()
    return {"created": created, "updated": updated}


# ---------------------------------------------------------------------------
# Concepts Import
# ---------------------------------------------------------------------------


def import_concepts(
    db: Session,
    concepts_data: list[dict[str, Any]],
    node_id: int,
    *,
    review_status: str = "UNREVIEWED",
) -> dict[str, int]:
    """Import the concepts of a leaf syllabus node.

    Each concept dict has keys:
      - title (str): Concept title
      - key_points (list[str]): 2-6 short phrases a student must convey
      - misconceptions (list[str] | None): Common wrong beliefs
      - display_order (int | None): Defaults to the concept's position in the list
      - versions (list[dict] | None): see ``import_concept_versions``
      - book_refs (list[dict] | None): see ``import_book_refs``

    Idempotency: matches by (syllabus_node_id + title).

    Returns counts of created and updated concepts, versions and book refs.
    """
    rs_enum = GsReviewStatusEnum(review_status)
    created = 0
    updated = 0
    extra = {"versions_created": 0, "versions_updated": 0, "book_refs_created": 0, "book_refs_updated": 0}

    for position, c_data in enumerate(concepts_data, start=1):
        title = c_data["title"].strip()
        existing = (
            db.query(GsLmsConcept)
            .filter(
                GsLmsConcept.syllabus_node_id == node_id,
                GsLmsConcept.title == title,
            )
            .one_or_none()
        )
        display_order = c_data.get("display_order", position)

        if existing:
            existing.key_points = c_data["key_points"]
            existing.misconceptions = c_data.get("misconceptions")
            existing.display_order = display_order
            existing.review_status = rs_enum
            existing.updated_by = _ACTOR
            concept = existing
            updated += 1
        else:
            concept = GsLmsConcept(
                syllabus_node_id=node_id,
                title=title,
                key_points=c_data["key_points"],
                misconceptions=c_data.get("misconceptions"),
                display_order=display_order,
                review_status=rs_enum,
                created_by=_ACTOR,
                updated_by=_ACTOR,
            )
            db.add(concept)
            db.flush()
            created += 1

        if c_data.get("versions"):
            v = import_concept_versions(db, c_data["versions"], concept.id, review_status=review_status)
            extra["versions_created"] += v["created"]
            extra["versions_updated"] += v["updated"]
        if c_data.get("book_refs"):
            r = import_book_refs(db, c_data["book_refs"], concept.id)
            extra["book_refs_created"] += r["created"]
            extra["book_refs_updated"] += r["updated"]

    db.flush()
    return {"created": created, "updated": updated, **extra}


# ---------------------------------------------------------------------------
# Concept versions, books and book refs
# ---------------------------------------------------------------------------


def import_concept_versions(
    db: Session,
    versions_data: list[dict[str, Any]],
    concept_id: int,
    *,
    review_status: str = "UNREVIEWED",
) -> dict[str, int]:
    """Import the ready-made versions of one concept.

    Each dict has: level, style, source (enum names), title, blocks,
    video_url (optional), duration_minutes (optional), display_order (optional,
    defaults to the position in the list).

    Idempotency: matches by (concept_id + level + style + source). Versions get
    the same review_status as the rest of the import.
    """
    rs_enum = GsReviewStatusEnum(review_status)
    created = updated = 0
    for position, v_data in enumerate(versions_data, start=1):
        level = GsLmsVersionLevelEnum(v_data["level"])
        style = GsLmsVersionStyleEnum(v_data["style"])
        source = GsLmsVersionSourceEnum(v_data["source"])
        row = (
            db.query(GsLmsConceptVersion)
            .filter(
                GsLmsConceptVersion.concept_id == concept_id,
                GsLmsConceptVersion.level == level,
                GsLmsConceptVersion.style == style,
                GsLmsConceptVersion.source == source,
            )
            .one_or_none()
        )
        fields = dict(
            title=v_data["title"].strip(),
            blocks=v_data.get("blocks"),
            video_url=v_data.get("video_url"),
            duration_minutes=v_data.get("duration_minutes"),
            display_order=v_data.get("display_order", position),
            review_status=rs_enum,
            updated_by=_ACTOR,
        )
        if row:
            for key, value in fields.items():
                setattr(row, key, value)
            updated += 1
        else:
            db.add(
                GsLmsConceptVersion(
                    concept_id=concept_id, level=level, style=style, source=source,
                    created_by=_ACTOR, **fields,
                )
            )
            created += 1
    db.flush()
    return {"created": created, "updated": updated}


def import_books(db: Session, books_data: list[dict[str, Any]]) -> dict[str, int]:
    """Import books and their chapters.

    Each book dict has: slug, title, author, edition, publisher (optional),
    exam_tag (optional, default "UPSC"), subject_slug (optional), chapters
    ([{number, title}]). Idempotency: books match by slug, chapters by
    (book + number). Books are not review-gated.
    """
    counts = {"books_created": 0, "books_updated": 0, "chapters_created": 0, "chapters_updated": 0}
    for b_data in books_data:
        slug = b_data["slug"].strip()
        fields = dict(
            title=b_data["title"].strip(),
            author=b_data["author"].strip(),
            edition=str(b_data["edition"]).strip(),
            publisher=b_data.get("publisher"),
            exam_tag=b_data.get("exam_tag") or "UPSC",
            subject_slug=b_data.get("subject_slug"),
            updated_by=_ACTOR,
        )
        book = db.query(GsLmsBook).filter(GsLmsBook.slug == slug).one_or_none()
        if book:
            for key, value in fields.items():
                setattr(book, key, value)
            counts["books_updated"] += 1
        else:
            book = GsLmsBook(slug=slug, created_by=_ACTOR, **fields)
            db.add(book)
            counts["books_created"] += 1
        db.flush()
        for c_data in b_data.get("chapters") or []:
            chapter = (
                db.query(GsLmsBookChapter)
                .filter(GsLmsBookChapter.book_id == book.id, GsLmsBookChapter.number == c_data["number"])
                .one_or_none()
            )
            if chapter:
                chapter.title = c_data["title"].strip()
                counts["chapters_updated"] += 1
            else:
                db.add(GsLmsBookChapter(book_id=book.id, number=c_data["number"], title=c_data["title"].strip()))
                counts["chapters_created"] += 1
        db.flush()
    return counts


def import_book_refs(db: Session, refs_data: list[dict[str, Any]], concept_id: int) -> dict[str, int]:
    """Link a concept to book chapters: [{book: slug, chapter: number, pages}].

    Idempotency: matches by (concept_id + chapter_id). The book and chapter
    must already exist (``import_books`` runs first).
    """
    created = updated = 0
    for r_data in refs_data:
        chapter = (
            db.query(GsLmsBookChapter)
            .join(GsLmsBook, GsLmsBook.id == GsLmsBookChapter.book_id)
            .filter(GsLmsBook.slug == r_data["book"], GsLmsBookChapter.number == r_data["chapter"])
            .one_or_none()
        )
        if chapter is None:
            raise ValueError(f"Book chapter {r_data['book']!r} #{r_data['chapter']} not found.")
        row = db.get(GsLmsConceptBookRef, (concept_id, chapter.id))
        if row:
            row.pages = r_data.get("pages")
            updated += 1
        else:
            db.add(GsLmsConceptBookRef(concept_id=concept_id, chapter_id=chapter.id, pages=r_data.get("pages")))
            created += 1
    db.flush()
    return {"created": created, "updated": updated}


# ---------------------------------------------------------------------------
# Concept backfill from concept_checklist
# ---------------------------------------------------------------------------

_TITLE_MAX = 120
_MAX_DERIVED_KEY_POINTS = 4
_KEY_POINT_SPLIT = re.compile(r"[,;]|\s+and\s+", re.IGNORECASE)


def _derive_key_points(sentence: str) -> list[str]:
    """2-4 short phrases from a checklist sentence (split on commas, semicolons
    and " and "); the sentence itself when it does not split into at least two."""
    sentence = sentence.strip()
    parts = [p.strip(" .:-\t") for p in _KEY_POINT_SPLIT.split(sentence)]
    parts = [p for p in parts if tokenize(p)]
    if len(parts) < 2:
        return [sentence]
    return parts[:_MAX_DERIVED_KEY_POINTS]


def derive_concepts_from_checklist(db: Session, leaf: GsLmsSyllabusNode) -> list[GsLmsConcept]:
    """Create one concept per concept_checklist sentence of a leaf topic.

    Title = the sentence trimmed to 120 characters; key points = phrases from
    ``_derive_key_points``. The new concepts take the leaf's review_status.
    Idempotent: a concept whose title already exists on the leaf is skipped.
    Returns the concepts created.
    """
    checklist = leaf.concept_checklist
    if not isinstance(checklist, list):
        return []
    existing_titles = {
        t for (t,) in db.query(GsLmsConcept.title).filter(GsLmsConcept.syllabus_node_id == leaf.id)
    }
    next_order = (
        db.query(func.max(GsLmsConcept.display_order))
        .filter(GsLmsConcept.syllabus_node_id == leaf.id)
        .scalar()
        or 0
    ) + 1
    created: list[GsLmsConcept] = []
    for item in checklist:
        if not isinstance(item, str) or not item.strip():
            continue
        title = item.strip()[:_TITLE_MAX].strip()
        if title in existing_titles:
            continue
        concept = GsLmsConcept(
            syllabus_node_id=leaf.id,
            title=title,
            key_points=_derive_key_points(item),
            display_order=next_order,
            review_status=leaf.review_status,
            created_by=_ACTOR,
            updated_by=_ACTOR,
        )
        db.add(concept)
        existing_titles.add(title)
        created.append(concept)
        next_order += 1
    db.flush()
    return created


def derive_concepts_for_subject(db: Session, subject_id: int) -> int:
    """Run ``derive_concepts_from_checklist`` on every leaf of a subject that has no concepts yet.
    Returns the number of concepts created."""
    leaves = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == subject_id,
            GsLmsSyllabusNode.node_type == GsLmsNodeTypeEnum.LEAF_TOPIC,
        )
        .all()
    )
    return sum(len(derive_concepts_from_checklist(db, leaf)) for leaf in leaves if not leaf.concepts)


# ---------------------------------------------------------------------------
# PYQ Import
# ---------------------------------------------------------------------------


def import_pyqs(
    db: Session,
    pyqs_data: list[dict[str, Any]],
    subject_id: int,
    *,
    node_id: int,
    review_status: str = "UNREVIEWED",
) -> dict[str, int]:
    """Import Previous Year Questions for a subject/node.

    Each PYQ dict has keys:
      - exam_type (str): PRELIMS or MAINS
      - year (int): Year of the question
      - question_text (str): The question
      - answer_text (str | None): Correct answer or model answer
      - explanation (str | None): Explanation
      - marks (int | None): Marks (for Mains)
      - question_type (str | None): Question type classification

    Idempotency: matches by (syllabus_node_id + question_text + year).

    Returns counts of created and updated PYQs.
    """
    rs_enum = GsReviewStatusEnum(review_status)
    created = 0
    updated = 0

    for pyq_data in pyqs_data:
        question_text = pyq_data["question_text"]
        year = pyq_data.get("year", 0)

        existing = (
            db.query(GsLmsPyq)
            .filter(
                GsLmsPyq.syllabus_node_id == node_id,
                GsLmsPyq.question_text == question_text,
                GsLmsPyq.year == year,
            )
            .one_or_none()
        )

        exam_type = GsLmsExamTypeEnum(pyq_data["exam_type"])
        question_type = None
        if pyq_data.get("question_type"):
            question_type = GsLmsQuestionTypeEnum(pyq_data["question_type"])

        if existing:
            existing.exam_type = exam_type
            existing.answer_text = pyq_data.get("answer_text")
            existing.explanation = pyq_data.get("explanation")
            existing.marks = pyq_data.get("marks")
            existing.question_type = question_type
            existing.review_status = rs_enum
            existing.updated_by = _ACTOR
            updated += 1
        else:
            pyq = GsLmsPyq(
                subject_id=subject_id,
                syllabus_node_id=node_id,
                exam_type=exam_type,
                year=year,
                question_text=question_text,
                answer_text=pyq_data.get("answer_text"),
                explanation=pyq_data.get("explanation"),
                marks=pyq_data.get("marks"),
                question_type=question_type,
                review_status=rs_enum,
                created_by=_ACTOR,
                updated_by=_ACTOR,
            )
            db.add(pyq)
            created += 1

    db.flush()
    return {"created": created, "updated": updated}


# ---------------------------------------------------------------------------
# MCQ Questions Import
# ---------------------------------------------------------------------------


def import_mcq_questions(
    db: Session,
    questions_data: list[dict[str, Any]],
    node_id: int,
    *,
    review_status: str = "UNREVIEWED",
) -> dict[str, int]:
    """Import MCQ questions for a syllabus node.

    Each question dict has keys:
      - question_text (str): The question text
      - options (list[dict]): [{label: "A", text: "..."}, ...]
      - correct_option (str): "A", "B", "C", or "D"
      - explanation (str | None): Explanation
      - question_type (str): Question type classification
      - display_order (int): Order for sequential presentation

    Idempotency: matches by (syllabus_node_id + question_text).

    Returns counts of created and updated questions.
    """
    rs_enum = GsReviewStatusEnum(review_status)
    created = 0
    updated = 0

    for q_data in questions_data:
        question_text = q_data["question_text"]

        existing = (
            db.query(GsLmsMcqQuestion)
            .filter(
                GsLmsMcqQuestion.syllabus_node_id == node_id,
                GsLmsMcqQuestion.question_text == question_text,
            )
            .one_or_none()
        )

        question_type = GsLmsQuestionTypeEnum(q_data["question_type"])

        if existing:
            existing.options = q_data["options"]
            existing.correct_option = q_data["correct_option"]
            existing.explanation = q_data.get("explanation")
            existing.question_type = question_type
            existing.display_order = q_data.get("display_order", existing.display_order)
            existing.review_status = rs_enum
            existing.updated_by = _ACTOR
            updated += 1
        else:
            mcq = GsLmsMcqQuestion(
                syllabus_node_id=node_id,
                question_text=question_text,
                options=q_data["options"],
                correct_option=q_data["correct_option"],
                explanation=q_data.get("explanation"),
                question_type=question_type,
                display_order=q_data.get("display_order", 0),
                review_status=rs_enum,
                created_by=_ACTOR,
                updated_by=_ACTOR,
            )
            db.add(mcq)
            created += 1

    db.flush()
    return {"created": created, "updated": updated}


# ---------------------------------------------------------------------------
# Top-level Import Entry Point
# ---------------------------------------------------------------------------


def import_gs_subject(
    db: Session,
    artifact_path_or_data: Optional[os.PathLike | str | dict[str, Any]] = None,
    *,
    subject_slug: Optional[str] = None,
    review_status: str = "UNREVIEWED",
) -> dict[str, Any]:
    """Import one GS subject's LMS content from a JSON artifact or dict.

    The subject is found by ``subject_slug`` (argument, else the artifact's
    ``"subject_slug"`` key) and falls back to the artifact's ``"subject_id"``.
    The artifact is checked first (see ``content_check``); a file with errors
    raises ``ValueError`` and nothing is written. The check summary is stored
    on ``GsSubject.completeness_status`` and ``is_complete`` is set when every
    topic is ready.

    The expected artifact structure::

        {
            "subject_slug": "geography",
            "tree": [
                {
                    "title": "Geomorphology",
                    "node_type": "MEGA_TOPIC",
                    "weight": 5.0,
                    "display_order": 1,
                    "children": [
                        {
                            "title": "Plate Tectonics",
                            "node_type": "SUB_TOPIC",
                            "children": [
                                {
                                    "title": "Continental Drift",
                                    "node_type": "LEAF_TOPIC",
                                    "content_sections": [...],
                                    "pyqs": [...],
                                    "mcq_questions": [...]
                                }
                            ]
                        }
                    ]
                }
            ]
        }

    Idempotent: running twice produces the same DB state (Property 20).
    All imported content starts as UNREVIEWED by default (Property 19).

    Returns a summary report with counts of all entities processed.
    """
    if artifact_path_or_data is None:
        data = load_artifact()
    elif isinstance(artifact_path_or_data, dict):
        data = artifact_path_or_data
    else:
        data = load_artifact(artifact_path_or_data)

    report = check_subject_content(data)
    if not report.ok_to_import:
        raise ValueError("Content file has errors; nothing was imported.\n" + format_report(report))

    slug = subject_slug or data.get("subject_slug")
    query = db.query(GsSubject)
    subject = (
        query.filter(GsSubject.slug == slug).one_or_none()
        if slug
        else query.filter(GsSubject.id == data.get("subject_id")).one_or_none()
    )
    if subject is None:
        raise ValueError(
            f"GS subject {slug or data.get('subject_id')!r} not found; "
            "run scripts/seed_production.py first to create the subjects."
        )

    book_counts = import_books(db, data.get("books") or [])
    counts = import_syllabus_tree(
        db,
        data.get("tree", []),
        subject.id,
        review_status=review_status,
    )
    counts.update(book_counts)

    subject.completeness_status = report.summary()
    subject.is_complete = report.ready
    db.flush()

    return {
        "subject_id": subject.id,
        "subject_slug": subject.slug,
        "review_status": review_status,
        **counts,
        "topics_ready": f"{report.topics_ready}/{report.topics}",
    }


def import_gs_geography(
    db: Session,
    artifact_path_or_data: Optional[os.PathLike | str | dict[str, Any]] = None,
    *,
    review_status: str = "UNREVIEWED",
) -> dict[str, Any]:
    """Import GS Geography content (the default artifact). Kept for callers
    that predate ``import_gs_subject``."""
    return import_gs_subject(db, artifact_path_or_data, review_status=review_status)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _merge_counts(target: dict[str, int], source: dict[str, int]) -> None:
    """Merge source counts into target (in-place addition)."""
    for key, value in source.items():
        target[key] = target.get(key, 0) + value


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------


def main() -> None:  # pragma: no cover - CLI entrypoint
    """Check and import one subject's content.

    python -m app.core.gs_lms.importer --artifact content/polity.json --check-only
    python -m app.core.gs_lms.importer --artifact content/polity.json --subject polity-governance
    """
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Check and import GS LMS subject content.")
    parser.add_argument("--artifact", default=None, help="Path to the JSON content file (default: Geography).")
    parser.add_argument("--subject", default=None, help='Subject slug, e.g. "polity-governance" (default: from the file).')
    parser.add_argument("--check-only", action="store_true", help="Only check the file; do not touch the database.")
    parser.add_argument(
        "--review-status",
        default="UNREVIEWED",
        choices=[e.value for e in GsReviewStatusEnum],
        help="review_status to stamp on imported content (default: UNREVIEWED, hidden from students).",
    )
    parser.add_argument(
        "--derive-concepts",
        action="store_true",
        help="After importing, create a concept for every concept_checklist sentence of topics that have none.",
    )
    args = parser.parse_args()

    data = load_artifact(args.artifact)
    report = check_subject_content(data)
    print(format_report(report))
    if args.check_only or not report.ok_to_import:
        sys.exit(0 if report.ok_to_import else 1)

    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        result = import_gs_subject(session, data, subject_slug=args.subject, review_status=args.review_status)
        if args.derive_concepts:
            result["concepts_derived"] = derive_concepts_for_subject(session, result["subject_id"])
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    print("=== GS LMS import complete ===")
    for k, v in result.items():
        print(f"  {k:<20} {v}")


if __name__ == "__main__":  # pragma: no cover
    main()
