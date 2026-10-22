"""SQLAlchemy models for the GS LMS Platform — canonical content/syllabus
domain (design "Data Models" section).

These models are intentionally isolated from the Optional Subjects platform at
``app.core.optional`` (design Key Decision 3: Domain isolation). Nothing here
imports from or references Optional modules.

They register on the shared declarative ``Base`` (``app.db.session.Base``) so
that a single Alembic ``target_metadata`` continues to cover the whole schema.
Table names are namespaced with a ``gs_lms_`` prefix. The syllabus tree mirrors
the Optional ``SyllabusNode`` pattern: self-referencing, weighted, review-gated.

Covers entities: GsLmsSyllabusNode, GsLmsContentSection, GsLmsConcept,
GsLmsPyq, GsLmsMcqQuestion, and supporting enums.

Requirements: 1.4, 10.1, 10.4, 11.4
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Float,
    ForeignKey,
    Enum,
    JSON,
    DateTime,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.db.governance import InstitutionalAuditMixin, SoftDeleteMixin
from app.core.gs.models import GsReviewStatusEnum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class GsLmsNodeTypeEnum(str, enum.Enum):
    """Kind of node within the GS LMS syllabus tree."""
    MEGA_TOPIC = "MEGA_TOPIC"
    SUB_TOPIC = "SUB_TOPIC"
    LEAF_TOPIC = "LEAF_TOPIC"


class GsLmsExamTypeEnum(str, enum.Enum):
    """Exam type for Previous Year Questions."""
    PRELIMS = "PRELIMS"
    MAINS = "MAINS"


class GsLmsQuestionTypeEnum(str, enum.Enum):
    """Classification of MCQ/PYQ question patterns UPSC has historically used."""
    STATEMENT_BASED = "STATEMENT_BASED"
    MATCH_THE_FOLLOWING = "MATCH_THE_FOLLOWING"
    ASSERTION_REASON = "ASSERTION_REASON"
    MAP_BASED = "MAP_BASED"
    CAUSE_EFFECT = "CAUSE_EFFECT"
    CHRONOLOGICAL = "CHRONOLOGICAL"
    FACTUAL = "FACTUAL"


class GsLmsSectionLabelEnum(str, enum.Enum):
    """The five progressive-disclosure content sections per topic."""
    BASIC = "BASIC"
    ADVANCED = "ADVANCED"
    NCERT_LEVEL = "NCERT_LEVEL"
    CURRENT_AFFAIRS = "CURRENT_AFFAIRS"
    EXAMINER_TRAPS = "EXAMINER_TRAPS"


class GsLmsPaperEnum(str, enum.Enum):
    """GS Mains paper a question belongs to (R9.1)."""
    GS1 = "GS1"
    GS2 = "GS2"
    GS3 = "GS3"
    GS4 = "GS4"


class GsLmsAnswerModeEnum(str, enum.Enum):
    """How the student composed a descriptive answer (R10, R11)."""
    TYPED = "TYPED"
    HANDWRITTEN = "HANDWRITTEN"


class GsLmsAnswerAttemptStatusEnum(str, enum.Enum):
    """Lifecycle of a GS answer attempt through the evaluation pipeline."""
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    EVALUATED = "EVALUATED"
    FAILED = "FAILED"


class GsLmsVersionLevelEnum(str, enum.Enum):
    """How deep a concept version goes."""
    BASIC = "BASIC"
    STANDARD = "STANDARD"
    ADVANCED = "ADVANCED"


class GsLmsVersionStyleEnum(str, enum.Enum):
    """How a concept version teaches."""
    TEXT = "TEXT"
    VISUAL = "VISUAL"
    VIDEO = "VIDEO"
    STORY = "STORY"


class GsLmsVersionSourceEnum(str, enum.Enum):
    """Where a concept version's material comes from."""
    NCERT = "NCERT"
    COACHING = "COACHING"
    REFERENCE_BOOK = "REFERENCE_BOOK"
    ORIGINAL = "ORIGINAL"


class GsLmsStudyPathEnum(str, enum.Enum):
    """What a student mainly studies from."""
    COACHING = "COACHING"
    REFERENCE_BOOKS = "REFERENCE_BOOKS"
    NCERT_ONLY = "NCERT_ONLY"
    MIXED = "MIXED"


# ---------------------------------------------------------------------------
# Syllabus Tree (self-referencing weighted tree)
# ---------------------------------------------------------------------------

class GsLmsSyllabusNode(Base, InstitutionalAuditMixin):
    """Self-referencing weighted syllabus tree for GS Geography LMS.

    Mirrors the Optional ``SyllabusNode`` pattern: weighted nodes, display
    ordering, review-gated visibility, and a self-referencing parent chain.
    Bridges to existing ``GsDayLesson`` records via ``day_lesson_id`` FK on
    leaf nodes.
    """
    __tablename__ = "gs_lms_syllabus_nodes"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(
        Integer, ForeignKey("gs_subjects.id"), nullable=False, index=True
    )
    parent_id = Column(
        Integer, ForeignKey("gs_lms_syllabus_nodes.id"), nullable=True, index=True
    )
    # Bridge to existing day-lesson system (Requirement 11.2).
    day_lesson_id = Column(
        Integer, ForeignKey("gs_day_lessons.id"), nullable=True, index=True
    )
    title = Column(String, nullable=False)
    node_type = Column(
        Enum(GsLmsNodeTypeEnum), nullable=False
    )
    # Weight used for coverage/gap calculation.
    weight = Column(Float, default=0.0, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    # Metadata justifying the chosen topic ordering (R1.2, R1.5).
    ordering_justification = Column(Text, nullable=True)
    # URL of the video lecture associated with this node (Phase 1 video integration).
    video_url = Column(Text, nullable=True)
    # JSON array of concept strings for concept-level discussion scoring (Phase 2).
    # e.g. ["plate tectonics", "continental drift", "seafloor spreading"]
    concept_checklist = Column(JSON, nullable=True)
    review_status = Column(
        Enum(GsReviewStatusEnum),
        default=GsReviewStatusEnum.UNREVIEWED,
        nullable=False,
    )

    # Relationships
    subject = relationship("GsSubject")
    parent = relationship(
        "GsLmsSyllabusNode", remote_side=[id], back_populates="children"
    )
    children = relationship(
        "GsLmsSyllabusNode", back_populates="parent", cascade="all, delete-orphan"
    )
    day_lesson = relationship("GsDayLesson")
    content_sections = relationship(
        "GsLmsContentSection",
        back_populates="syllabus_node",
        cascade="all, delete-orphan",
        order_by="GsLmsContentSection.display_order",
    )
    pyqs = relationship(
        "GsLmsPyq",
        back_populates="syllabus_node",
        cascade="all, delete-orphan",
    )
    mcq_questions = relationship(
        "GsLmsMcqQuestion",
        back_populates="syllabus_node",
        cascade="all, delete-orphan",
        order_by="GsLmsMcqQuestion.display_order",
    )
    # Smallest learning units under a leaf topic (see GsLmsConcept).
    concepts = relationship(
        "GsLmsConcept",
        back_populates="syllabus_node",
        cascade="all, delete-orphan",
        order_by="GsLmsConcept.display_order",
    )


# ---------------------------------------------------------------------------
# Content Sections (progressive disclosure)
# ---------------------------------------------------------------------------

class GsLmsContentSection(Base, InstitutionalAuditMixin):
    """One of 4 progressive-disclosure sections per topic.

    Each leaf-level syllabus node has exactly four content sections:
    BASIC → ADVANCED → NCERT_LEVEL → EXAMINER_TRAPS, enforced by
    display_order (1-4).
    """
    __tablename__ = "gs_lms_content_sections"

    id = Column(Integer, primary_key=True, index=True)
    syllabus_node_id = Column(
        Integer, ForeignKey("gs_lms_syllabus_nodes.id"), nullable=False, index=True
    )
    section_label = Column(
        Enum(GsLmsSectionLabelEnum), nullable=False
    )
    title = Column(String, nullable=False)
    # Typed content blocks: [{type, content, ...}]
    blocks = Column(JSON, nullable=True)
    # 1-4, enforces section sequence.
    display_order = Column(Integer, nullable=False)
    review_status = Column(
        Enum(GsReviewStatusEnum),
        default=GsReviewStatusEnum.UNREVIEWED,
        nullable=False,
    )
    authored = Column(Boolean, default=False, nullable=False)

    # Relationships
    syllabus_node = relationship(
        "GsLmsSyllabusNode", back_populates="content_sections"
    )


# ---------------------------------------------------------------------------
# Concepts (smallest learning unit under a leaf topic)
# ---------------------------------------------------------------------------

class GsLmsConcept(Base, InstitutionalAuditMixin):
    """The smallest thing a student must understand within a leaf topic.

    Each concept carries 2-8 ``key_points``: short phrases a student has to
    convey when explaining it. The understanding grader
    (``app.core.gs_lms.understanding``) scores an explanation against them, and
    per-student results are kept in ``GsLmsConceptMastery``. ``misconceptions``
    lists common wrong beliefs, for tutors and later AI prompts.
    """
    __tablename__ = "gs_lms_concepts"
    __table_args__ = (
        UniqueConstraint(
            "syllabus_node_id", "title", name="uq_gs_lms_concepts_node_title"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    syllabus_node_id = Column(
        Integer, ForeignKey("gs_lms_syllabus_nodes.id"), nullable=False, index=True
    )
    display_order = Column(Integer, default=0, nullable=False)
    title = Column(String, nullable=False)
    # JSON list of short phrases (2-8), each one a point the student must convey.
    key_points = Column(JSON, nullable=False)
    # Optional JSON list of common wrong beliefs about this concept.
    misconceptions = Column(JSON, nullable=True)
    review_status = Column(
        Enum(GsReviewStatusEnum),
        default=GsReviewStatusEnum.UNREVIEWED,
        nullable=False,
        index=True,
    )

    # Relationships
    syllabus_node = relationship("GsLmsSyllabusNode", back_populates="concepts")
    versions = relationship(
        "GsLmsConceptVersion",
        back_populates="concept",
        cascade="all, delete-orphan",
        order_by="GsLmsConceptVersion.display_order",
    )
    book_refs = relationship(
        "GsLmsConceptBookRef",
        back_populates="concept",
        cascade="all, delete-orphan",
    )


# ---------------------------------------------------------------------------
# Concept versions, books and learner profile
# ---------------------------------------------------------------------------

class GsLmsConceptVersion(Base, InstitutionalAuditMixin):
    """One ready-made way of teaching a concept (level x style x source).

    ``blocks`` use the same block format as ``GsLmsContentSection.blocks``.
    ``app.core.gs_lms.versions`` picks the most suitable REVIEWED version for
    each student.
    """
    __tablename__ = "gs_lms_concept_versions"
    __table_args__ = (
        UniqueConstraint(
            "concept_id", "level", "style", "source",
            name="uq_gs_lms_concept_versions_combo",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(
        Integer, ForeignKey("gs_lms_concepts.id"), nullable=False, index=True
    )
    level = Column(Enum(GsLmsVersionLevelEnum), nullable=False)
    style = Column(Enum(GsLmsVersionStyleEnum), nullable=False)
    source = Column(Enum(GsLmsVersionSourceEnum), nullable=False)
    title = Column(String, nullable=False)
    blocks = Column(JSON, nullable=True)
    video_url = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    review_status = Column(
        Enum(GsReviewStatusEnum),
        default=GsReviewStatusEnum.UNREVIEWED,
        nullable=False,
        index=True,
    )

    concept = relationship("GsLmsConcept", back_populates="versions")


class GsLmsBook(Base, InstitutionalAuditMixin):
    """A book (and edition) students study from, e.g. Laxmikanth 7th edition."""
    __tablename__ = "gs_lms_books"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    edition = Column(String, nullable=False)
    publisher = Column(String, nullable=True)
    exam_tag = Column(String, default="UPSC", nullable=False)
    subject_slug = Column(String, nullable=True, index=True)

    chapters = relationship(
        "GsLmsBookChapter",
        back_populates="book",
        cascade="all, delete-orphan",
        order_by="GsLmsBookChapter.number",
    )


class GsLmsBookChapter(Base):
    """A numbered chapter of a book."""
    __tablename__ = "gs_lms_book_chapters"
    __table_args__ = (
        UniqueConstraint("book_id", "number", name="uq_gs_lms_book_chapters_number"),
    )

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(
        Integer, ForeignKey("gs_lms_books.id"), nullable=False, index=True
    )
    number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)

    book = relationship("GsLmsBook", back_populates="chapters")


class GsLmsConceptBookRef(Base):
    """Where a concept is covered in a book: a chapter and optional pages."""
    __tablename__ = "gs_lms_concept_book_refs"

    concept_id = Column(
        Integer, ForeignKey("gs_lms_concepts.id"), primary_key=True
    )
    chapter_id = Column(
        Integer, ForeignKey("gs_lms_book_chapters.id"), primary_key=True, index=True
    )
    pages = Column(String, nullable=True)

    concept = relationship("GsLmsConcept", back_populates="book_refs")
    chapter = relationship("GsLmsBookChapter")


class GsLmsLearnerProfile(Base, InstitutionalAuditMixin):
    """A student's learning preferences, used to pick concept versions."""
    __tablename__ = "gs_lms_learner_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True
    )
    preferred_style = Column(Enum(GsLmsVersionStyleEnum), nullable=True)
    preferred_level = Column(Enum(GsLmsVersionLevelEnum), nullable=True)
    study_path = Column(Enum(GsLmsStudyPathEnum), nullable=True)
    # JSON list of GsLmsBook ids the student studies from.
    book_ids = Column(JSON, nullable=True)

    student = relationship("User")


# ---------------------------------------------------------------------------
# Previous Year Questions
# ---------------------------------------------------------------------------

class GsLmsPyq(Base, InstitutionalAuditMixin):
    """Previous Year Question for GS Geography (Prelims or Mains).

    Carries year, exam_type, question text, answer/explanation (revealed
    separately per student), and review-gate status.
    """
    __tablename__ = "gs_lms_pyqs"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(
        Integer, ForeignKey("gs_subjects.id"), nullable=False, index=True
    )
    syllabus_node_id = Column(
        Integer, ForeignKey("gs_lms_syllabus_nodes.id"), nullable=False, index=True
    )
    exam_type = Column(Enum(GsLmsExamTypeEnum), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    # GS Mains paper discriminator (GS1–GS4); nullable (Prelims/free-form). R9.1
    gs_paper = Column(Enum(GsLmsPaperEnum), nullable=True, index=True)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    # Marks (relevant for Mains questions).
    marks = Column(Integer, nullable=True)
    question_type = Column(Enum(GsLmsQuestionTypeEnum), nullable=True)
    review_status = Column(
        Enum(GsReviewStatusEnum),
        default=GsReviewStatusEnum.UNREVIEWED,
        nullable=False,
        index=True,
    )

    # Relationships
    subject = relationship("GsSubject")
    syllabus_node = relationship("GsLmsSyllabusNode", back_populates="pyqs")


# ---------------------------------------------------------------------------
# MCQ Practice Questions
# ---------------------------------------------------------------------------

class GsLmsMcqQuestion(Base, InstitutionalAuditMixin):
    """MCQ practice question for sequential practice sessions.

    Each question belongs to a syllabus node and carries options (A-D),
    correct answer, explanation, question type classification, and
    display ordering for sequential presentation.
    """
    __tablename__ = "gs_lms_mcq_questions"

    id = Column(Integer, primary_key=True, index=True)
    syllabus_node_id = Column(
        Integer, ForeignKey("gs_lms_syllabus_nodes.id"), nullable=False, index=True
    )
    question_text = Column(Text, nullable=False)
    # Options: [{label: "A", text: "..."}, ...]
    options = Column(JSON, nullable=False)
    correct_option = Column(String, nullable=False)  # "A", "B", "C", "D"
    explanation = Column(Text, nullable=True)
    question_type = Column(
        Enum(GsLmsQuestionTypeEnum), nullable=False
    )
    display_order = Column(Integer, default=0, nullable=False)
    review_status = Column(
        Enum(GsReviewStatusEnum),
        default=GsReviewStatusEnum.UNREVIEWED,
        nullable=False,
        index=True,
    )

    # Relationships
    syllabus_node = relationship(
        "GsLmsSyllabusNode", back_populates="mcq_questions"
    )


# ---------------------------------------------------------------------------
# Answer writing + evaluation (Mains descriptive answers)
# ---------------------------------------------------------------------------

class GsLmsAnswerAttempt(Base, InstitutionalAuditMixin, SoftDeleteMixin):
    """A student's descriptive (Mains) answer attempt for a GS PYQ/practice
    question (R10, R11, R14).

    Mirrors the Optional ``AnswerAttempt`` shape with a ``gs_lms_`` prefix and
    FKs into the GS domain. Supports typed and handwritten (image) composition;
    handwritten drafts carry the confidence-gate fields (``ocr_confidence`` /
    ``review_acknowledged``). Ownership is scoped by ``student_id`` (R17).
    """
    __tablename__ = "gs_lms_answer_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # Linked PYQ (nullable for free-form practice questions — R9.5).
    pyq_id = Column(
        Integer, ForeignKey("gs_lms_pyqs.id"), nullable=True, index=True
    )
    gs_paper = Column(Enum(GsLmsPaperEnum), nullable=True, index=True)
    # Denormalized prompt text (free-form practice or snapshot of the PYQ).
    question_text = Column(Text, nullable=True)
    # Marking scheme context (R7, R8).
    max_marks = Column(Integer, nullable=True)

    mode = Column(Enum(GsLmsAnswerModeEnum), nullable=False)
    status = Column(
        Enum(GsLmsAnswerAttemptStatusEnum),
        default=GsLmsAnswerAttemptStatusEnum.DRAFT,
        nullable=False,
        index=True,
    )

    # The full answer text fed to the evaluator (typed, or OCR/assembled).
    raw_text = Column(Text, nullable=True)
    # Provider confidence for handwritten OCR + the review-ack gate (R14).
    ocr_confidence = Column(Float, nullable=True)
    review_acknowledged = Column(Boolean, default=False, nullable=False)

    # Length-bias bookkeeping (R8.4).
    word_count = Column(Integer, nullable=True)
    word_limit = Column(Integer, nullable=True)

    # Provider/usage + cache bookkeeping (R18).
    provider_key = Column(String, nullable=True)
    token_usage = Column(Integer, nullable=True)
    content_hash = Column(String, nullable=True, index=True)

    # Relationships
    student = relationship("User")
    pyq = relationship("GsLmsPyq")
    images = relationship(
        "GsLmsAnswerSheetImage",
        back_populates="attempt",
        cascade="all, delete-orphan",
        order_by="GsLmsAnswerSheetImage.page_order",
    )
    report = relationship(
        "GsLmsEvaluationReport",
        back_populates="attempt",
        uselist=False,
        cascade="all, delete-orphan",
    )


class GsLmsAnswerSheetImage(Base, InstitutionalAuditMixin):
    """One uploaded page of a handwritten answer (R11, R12, R17).

    One row per page so pages can be ordered, re-ordered, audited, and
    vision-graded. ``media_ref`` is a SERVER-authored object-storage key (never
    client-supplied — R11.2). Ownership is scoped by ``student_id`` (R17.3).
    """
    __tablename__ = "gs_lms_answer_sheet_images"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(
        Integer, ForeignKey("gs_lms_answer_attempts.id"), nullable=False, index=True
    )
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # Server-authored MediaStore key (R11.2).
    media_ref = Column(String, nullable=False)
    # Ascending assembly order (R12.1/R12.2).
    page_order = Column(Integer, nullable=False)
    content_type = Column(String, nullable=True)
    uploaded_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    attempt = relationship("GsLmsAnswerAttempt", back_populates="images")
    student = relationship("User")


class GsLmsEvaluationReport(Base, InstitutionalAuditMixin):
    """A complete evaluation report, 1:1 with a GsLmsAnswerAttempt (R7, R13, R16).

    Preserves the report-completeness honesty invariant (``incomplete_sections``;
    empty => complete) and adds marks-normalized scoring, factual-accuracy +
    value-addition payloads, and the human-override audit columns (R16).
    """
    __tablename__ = "gs_lms_evaluation_reports"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(
        Integer,
        ForeignKey("gs_lms_answer_attempts.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    sections = Column(JSON, nullable=True)
    incomplete_sections = Column(JSON, default=list, nullable=False)
    overall_score = Column(Float, nullable=True)
    # Marks-normalized scoring (R7).
    marks_awarded = Column(Float, nullable=True)
    max_marks = Column(Integer, nullable=True)
    # Factual-accuracy + value-addition payloads (R7.5/R7.6, R13.3).
    factual_accuracy = Column(JSON, nullable=True)
    value_addition = Column(JSON, nullable=True)
    # Human-in-the-loop override + audit (R16). ``original_report`` preserves
    # the machine output unchanged when an evaluator overrides it.
    original_report = Column(JSON, nullable=True)
    overridden_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    overridden_at = Column(DateTime, nullable=True)

    attempt = relationship("GsLmsAnswerAttempt", back_populates="report")

    @property
    def is_complete(self) -> bool:
        """A report is complete only when no sections are missing (Property 6)."""
        return not (self.incomplete_sections or [])


__all__ = [
    # Enums
    "GsLmsNodeTypeEnum",
    "GsLmsExamTypeEnum",
    "GsLmsQuestionTypeEnum",
    "GsLmsSectionLabelEnum",
    "GsLmsPaperEnum",
    "GsLmsAnswerModeEnum",
    "GsLmsAnswerAttemptStatusEnum",
    "GsLmsVersionLevelEnum",
    "GsLmsVersionStyleEnum",
    "GsLmsVersionSourceEnum",
    "GsLmsStudyPathEnum",
    # Models
    "GsLmsSyllabusNode",
    "GsLmsContentSection",
    "GsLmsConcept",
    "GsLmsConceptVersion",
    "GsLmsBook",
    "GsLmsBookChapter",
    "GsLmsConceptBookRef",
    "GsLmsLearnerProfile",
    "GsLmsPyq",
    "GsLmsMcqQuestion",
    "GsLmsAnswerAttempt",
    "GsLmsAnswerSheetImage",
    "GsLmsEvaluationReport",
]
