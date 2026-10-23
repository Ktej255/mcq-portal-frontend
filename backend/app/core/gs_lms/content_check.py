"""Check a GS LMS subject content file before it is imported.

Two kinds of findings:

* errors   — the file is malformed and must not be imported (bad node type,
             invalid section label, an MCQ whose correct option is not one of
             its options, two sibling topics with the same title, ...).
* gaps     — the file is valid but a topic is not ready for students yet
             (missing one of the five sections, fewer MCQs than the MCQ Lab
             needs, an MCQ without an explanation, no PYQs, a mega- or
             sub-topic with no topics under it, a topic with no concepts).

``check_subject_content`` returns a report; ``format_report`` turns it into the
text the importer CLI prints. A subject is "ready" when it has no errors and
no gaps.

Concept versions and books (all optional): a concept may carry ``versions``
(level / style / source plus blocks and/or a video_url) and ``book_refs`` (a
book slug, chapter number and pages). Books are declared once at the top of the
file under ``"books"``. The checker only sees the file, so every book a
``book_refs`` entry names must be declared in that same file. A concept without
versions is a gap only when the file sets ``"require_versions": true``.

Exam profiles: the file may carry ``"exam": "<code>"`` (default ``upsc``). The
section labels, PYQ exam types and MCQ question types are checked against that
exam's profile (``app.core.gs_lms.exam_profiles``). A NEET or JEE topic needs
no CURRENT_AFFAIRS section; a UPSC file is checked exactly as before.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Optional

from app.core.gs_lms.exam_profiles import (
    DEFAULT_EXAM_CODE,
    ExamProfile,
    UnknownExamError,
    get_profile,
)
from app.core.gs_lms.models import (
    GsLmsExamTypeEnum,
    GsLmsNodeTypeEnum,
    GsLmsQuestionTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsVersionLevelEnum,
    GsLmsVersionSourceEnum,
    GsLmsVersionStyleEnum,
)

# The MCQ Lab serves exactly this many questions per topic.
MCQS_PER_TOPIC = 15
# A concept lists the points a student must convey: at least 2, at most 8.
MIN_KEY_POINTS = 2
MAX_KEY_POINTS = 8
# Section labels required of a UPSC topic (every label the engine knows).
REQUIRED_SECTIONS = [label.value for label in GsLmsSectionLabelEnum]
OPTION_LABELS = ["A", "B", "C", "D"]

_NODE_TYPES = {e.value for e in GsLmsNodeTypeEnum}
_QUESTION_TYPES = {e.value for e in GsLmsQuestionTypeEnum}
_EXAM_TYPES = {e.value for e in GsLmsExamTypeEnum}
_VERSION_LEVELS = {e.value for e in GsLmsVersionLevelEnum}
_VERSION_STYLES = {e.value for e in GsLmsVersionStyleEnum}
_VERSION_SOURCES = {e.value for e in GsLmsVersionSourceEnum}


@dataclass
class ContentReport:
    errors: list[str] = field(default_factory=list)
    gaps: list[str] = field(default_factory=list)
    topics: int = 0
    topics_ready: int = 0
    # Mega- or sub-topics with nothing under them yet. They keep the subject
    # from counting as ready, so a half-written syllabus is never marked complete.
    unfinished: int = 0
    mega_topics: int = 0
    sub_topics: int = 0
    sections: int = 0
    concepts: int = 0
    versions: int = 0
    books: int = 0
    mcqs: int = 0
    pyqs: int = 0
    # The exam profile the file is checked against (the file's "exam", default upsc).
    exam_code: str = DEFAULT_EXAM_CODE
    profile: Optional[ExamProfile] = field(default=None, repr=False)
    # Set from the file's top-level "require_versions" flag.
    require_versions: bool = False
    # Book slug -> chapter numbers listed for it in the file (for book_refs checks).
    book_chapters: dict[str, set[int]] = field(default_factory=dict, repr=False)

    @property
    def ok_to_import(self) -> bool:
        return not self.errors

    @property
    def ready(self) -> bool:
        return (
            not self.errors
            and self.topics > 0
            and self.topics_ready == self.topics
            and self.unfinished == 0
        )

    def summary(self) -> dict[str, Any]:
        """Compact stats stored on GsSubject.completeness_status."""
        out = {
            "topics": self.topics,
            "topics_ready": self.topics_ready,
            "unfinished": self.unfinished,
            "mega_topics": self.mega_topics,
            "sub_topics": self.sub_topics,
            "sections": self.sections,
            "concepts": self.concepts,
            "versions": self.versions,
            "books": self.books,
            "mcqs": self.mcqs,
            "pyqs": self.pyqs,
            "gaps": len(self.gaps),
            "ready": self.ready,
        }
        if self.exam_code != DEFAULT_EXAM_CODE:
            out["exam"] = self.exam_code
        return out


def check_subject_content(data: dict[str, Any]) -> ContentReport:
    report = ContentReport()
    exam_value = data.get("exam")
    try:
        report.profile = get_profile(exam_value if isinstance(exam_value, str) and exam_value.strip() else None)
        report.exam_code = report.profile.code
    except UnknownExamError as exc:
        report.errors.append(f'"exam": {exc}')
        report.profile = get_profile(None)
    tree = data.get("tree")
    if not isinstance(tree, list):
        report.errors.append('The file needs a "tree" list of top-level topics.')
        return report
    if not tree:
        report.gaps.append("The tree has no topics yet.")
    if not (data.get("subject_slug") or data.get("subject_id")):
        report.errors.append('The file needs "subject_slug" (e.g. "polity-governance").')
    report.require_versions = data.get("require_versions") is True
    _check_books(_items(data.get("books"), "books", report), report)
    _check_siblings(tree, "", report)
    return report


def _text(value: Any) -> str:
    """A field's text, stripped. Empty when the field is missing, null or not a string."""
    return value.strip() if isinstance(value, str) else ""


def _items(value: Any, label: str, report: ContentReport) -> list[Any]:
    """The items of a list field. Anything else is reported as an error, not a crash."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    report.errors.append(f"{label} must be a list.")
    return []


def _check_siblings(nodes: list[Any], path: str, report: ContentReport) -> None:
    # Titles are compared exactly, as the importer matches them: "Foo" and
    # "foo" are two different topics and import fine.
    titles = Counter(
        n["title"] for n in nodes if isinstance(n, dict) and isinstance(n.get("title"), str) and n["title"]
    )
    for title, count in titles.items():
        if count > 1:
            report.errors.append(f'{path or "top level"}: {count} topics are titled "{title}" (the importer would merge them).')
    for node in nodes:
        if not isinstance(node, dict):
            report.errors.append(f"{path or 'top level'}: every topic must be an object.")
            continue
        _check_node(node, path, report)


def _check_node(node: dict[str, Any], parent_path: str, report: ContentReport) -> None:
    title = _text(node.get("title"))
    path = f"{parent_path} › {title}" if parent_path else (title or "(untitled)")
    if not title:
        report.errors.append(f"{path}: topic has no title.")

    node_type = node.get("node_type")
    if node_type not in _NODE_TYPES:
        report.errors.append(f"{path}: node_type {node_type!r} must be one of {sorted(_NODE_TYPES)}.")
    elif node_type == "MEGA_TOPIC":
        report.mega_topics += 1
    elif node_type == "SUB_TOPIC":
        report.sub_topics += 1

    children = _items(node.get("children"), f"{path}: children", report)
    if children:
        for key in ("content_sections", "mcq_questions"):
            if node.get(key):
                report.errors.append(f"{path}: has child topics, so {key} belong on its leaf topics instead.")
        _check_siblings(children, path, report)
        return

    if node_type != "LEAF_TOPIC":
        # A mega- or sub-topic with nothing under it yet.
        if node_type in _NODE_TYPES:
            report.gaps.append(f"{path}: has no child topics yet.")
            report.unfinished += 1
        return
    report.topics += 1
    gaps_before = len(report.gaps)
    _check_sections(_items(node.get("content_sections"), f"{path}: content_sections", report), path, report)
    _check_concepts(_items(node.get("concepts"), f"{path}: concepts", report), path, report)
    _check_mcqs(_items(node.get("mcq_questions"), f"{path}: mcq_questions", report), path, report)
    _check_pyqs(_items(node.get("pyqs"), f"{path}: pyqs", report), path, report)
    if len(report.gaps) == gaps_before:
        report.topics_ready += 1


def _check_sections(sections: list[Any], path: str, report: ContentReport) -> None:
    required = list(report.profile.section_labels) if report.profile else REQUIRED_SECTIONS
    present = set()
    for section in sections:
        label = section.get("section_label") if isinstance(section, dict) else None
        if label not in required:
            report.errors.append(f"{path}: section_label {label!r} must be one of {required}.")
            continue
        if label in present:
            report.errors.append(f"{path}: section {label} appears twice.")
        present.add(label)
        report.sections += 1
        if not section.get("blocks"):
            report.gaps.append(f"{path}: section {label} has no content blocks.")
    missing = [label for label in required if label not in present]
    if missing:
        report.gaps.append(f"{path}: missing section(s) {', '.join(missing)}.")


def _check_concepts(concepts: list[Any], path: str, report: ContentReport) -> None:
    seen = set()
    for i, concept in enumerate(concepts, start=1):
        if not isinstance(concept, dict):
            report.errors.append(f"{path}: concept {i} must be an object.")
            continue
        report.concepts += 1
        title = _text(concept.get("title"))
        where = f'{path}: concept {i}' + (f' "{title}"' if title else "")
        if not title:
            report.errors.append(f"{where} has no title.")
        elif title in seen:
            report.errors.append(f'{where}: another concept in this topic is titled "{title}".')
        seen.add(title)

        key_points = _items(concept.get("key_points"), f"{where}: key_points", report)
        if not MIN_KEY_POINTS <= len(key_points) <= MAX_KEY_POINTS:
            report.errors.append(
                f"{where} has {len(key_points)} key points; it needs {MIN_KEY_POINTS} to {MAX_KEY_POINTS}."
            )
        if any(not _text(kp) for kp in key_points):
            report.errors.append(f"{where} has a blank key point.")
        misconceptions = _items(concept.get("misconceptions"), f"{where}: misconceptions", report)
        if any(not _text(m) for m in misconceptions):
            report.errors.append(f"{where} has a blank misconception.")
        versions = _items(concept.get("versions"), f"{where}: versions", report)
        _check_versions(versions, where, report)
        if report.require_versions and not versions:
            report.gaps.append(f"{where} has no versions.")
        _check_book_refs(_items(concept.get("book_refs"), f"{where}: book_refs", report), where, report)
    if not concepts:
        report.gaps.append(f"{path}: no concepts.")


def _check_books(books: list[Any], report: ContentReport) -> None:
    for i, book in enumerate(books, start=1):
        if not isinstance(book, dict):
            report.errors.append(f"books: book {i} must be an object.")
            continue
        slug = _text(book.get("slug"))
        where = f'books: book {i}' + (f' "{slug}"' if slug else "")
        if not slug:
            report.errors.append(f"{where} has no slug.")
        elif slug in report.book_chapters:
            report.errors.append(f'{where}: another book already uses the slug "{slug}".')
        for key in ("title", "author", "edition"):
            if not _text(book.get(key)):
                report.errors.append(f"{where} has no {key}.")
        report.books += 1
        numbers: set[int] = set()
        for j, chapter in enumerate(_items(book.get("chapters"), f"{where}: chapters", report), start=1):
            number = chapter.get("number") if isinstance(chapter, dict) else None
            if not isinstance(number, int) or isinstance(number, bool):
                report.errors.append(f"{where}: chapter {j} needs a whole-number \"number\".")
                continue
            if number in numbers:
                report.errors.append(f"{where}: chapter number {number} is listed twice.")
            numbers.add(number)
            if not _text(chapter.get("title")):
                report.errors.append(f"{where}: chapter {number} has no title.")
        if slug:
            report.book_chapters.setdefault(slug, set()).update(numbers)


def _check_versions(versions: list[Any], where: str, report: ContentReport) -> None:
    seen = set()
    for i, version in enumerate(versions, start=1):
        label = f"{where}: version {i}"
        if not isinstance(version, dict):
            report.errors.append(f"{label} must be an object.")
            continue
        report.versions += 1
        level, style, source = version.get("level"), version.get("style"), version.get("source")
        valid = True
        for name, value, allowed in (
            ("level", level, _VERSION_LEVELS),
            ("style", style, _VERSION_STYLES),
            ("source", source, _VERSION_SOURCES),
        ):
            if value not in allowed:
                report.errors.append(f"{label}: {name} {value!r} must be one of {sorted(allowed)}.")
                valid = False
        if valid:
            combo = (level, style, source)
            if combo in seen:
                report.errors.append(f"{label}: another version of this concept is already {level}/{style}/{source}.")
            seen.add(combo)
        if not _text(version.get("title")):
            report.errors.append(f"{label} has no title.")
        blocks = version.get("blocks")
        if blocks is not None and (not isinstance(blocks, list) or any(not isinstance(b, dict) for b in blocks)):
            report.errors.append(f"{label}: blocks must be a list of objects.")
            blocks = None
        video_url = version.get("video_url")
        if video_url is not None and not (
            isinstance(video_url, str) and video_url.strip().lower().startswith(("http://", "https://"))
        ):
            report.errors.append(f"{label}: video_url {video_url!r} must start with http:// or https://.")
        if not blocks and not video_url:
            report.errors.append(f"{label} has neither blocks nor a video_url.")
        minutes = version.get("duration_minutes")
        if minutes is not None and (not isinstance(minutes, int) or isinstance(minutes, bool) or minutes < 0):
            report.errors.append(f"{label}: duration_minutes must be a whole number of minutes.")


def _check_book_refs(refs: list[Any], where: str, report: ContentReport) -> None:
    seen = set()
    for i, ref in enumerate(refs, start=1):
        label = f"{where}: book_ref {i}"
        if not isinstance(ref, dict):
            report.errors.append(f"{label} must be an object.")
            continue
        slug, chapter = ref.get("book"), ref.get("chapter")
        if not isinstance(slug, str) or slug not in report.book_chapters:
            report.errors.append(f'{label}: book {slug!r} is not listed under "books" in this file.')
            continue
        if not isinstance(chapter, int) or isinstance(chapter, bool) or chapter not in report.book_chapters[slug]:
            report.errors.append(f'{label}: chapter {chapter!r} is not listed for book "{slug}".')
            continue
        if (slug, chapter) in seen:
            report.errors.append(f'{label}: chapter {chapter} of "{slug}" is referenced twice.')
        seen.add((slug, chapter))
        pages = ref.get("pages")
        if pages is not None and not isinstance(pages, str):
            report.errors.append(f'{label}: pages must be text such as "12-15".')


def _check_mcqs(mcqs: list[Any], path: str, report: ContentReport) -> None:
    seen = set()
    for i, mcq in enumerate(mcqs, start=1):
        where = f"{path}: MCQ {i}"
        if not isinstance(mcq, dict):
            report.errors.append(f"{where} must be an object.")
            continue
        report.mcqs += 1
        text = _text(mcq.get("question_text"))
        if not text:
            report.errors.append(f"{where} has no question_text.")
        elif text.lower() in seen:
            report.errors.append(f"{where} repeats an earlier question in this topic.")
        seen.add(text.lower())

        options = mcq.get("options")
        if isinstance(options, list) and all(isinstance(o, dict) for o in options):
            labels = [o.get("label") for o in options]
            texts = [_text(o.get("text")) for o in options]
        else:
            labels, texts = [], []
        if labels != OPTION_LABELS or not all(texts):
            report.errors.append(f"{where} needs exactly four options labelled A, B, C, D, each with text.")
        if mcq.get("correct_option") not in OPTION_LABELS:
            report.errors.append(f"{where}: correct_option {mcq.get('correct_option')!r} must be A, B, C or D.")
        _check_question_type(mcq.get("question_type"), where, report)
        if not _text(mcq.get("explanation")):
            report.gaps.append(f"{where} has no explanation.")
    if len(mcqs) < MCQS_PER_TOPIC:
        report.gaps.append(f"{path}: {len(mcqs)} MCQs; the MCQ Lab needs {MCQS_PER_TOPIC}.")


def _check_question_type(value: Any, where: str, report: ContentReport) -> None:
    profile = report.profile or get_profile(None)
    if value in profile.unsupported_question_types:
        report.errors.append(
            f"{where}: question_type {value!r} is not yet supported in the MCQ lab for {profile.name}."
        )
    elif value not in profile.question_types or value not in _QUESTION_TYPES:
        allowed = sorted(set(profile.question_types) - set(profile.unsupported_question_types))
        report.errors.append(f"{where}: question_type {value!r} must be one of {allowed}.")


def _check_pyqs(pyqs: list[Any], path: str, report: ContentReport) -> None:
    for i, pyq in enumerate(pyqs, start=1):
        where = f"{path}: PYQ {i}"
        if not isinstance(pyq, dict):
            report.errors.append(f"{where} must be an object.")
            continue
        report.pyqs += 1
        allowed_exam_types = report.profile.pyq_exam_types if report.profile else ("PRELIMS", "MAINS")
        if pyq.get("exam_type") not in allowed_exam_types or pyq.get("exam_type") not in _EXAM_TYPES:
            report.errors.append(
                f"{where}: exam_type {pyq.get('exam_type')!r} must be " + " or ".join(allowed_exam_types) + "."
            )
        if not _text(pyq.get("question_text")):
            report.errors.append(f"{where} has no question_text.")
    if not pyqs:
        report.gaps.append(f"{path}: no PYQs.")


def format_report(report: ContentReport, *, max_lines: int = 40) -> str:
    lines = [
        f"Topics ready: {report.topics_ready} of {report.topics} "
        f"({report.mega_topics} mega-topics, {report.sub_topics} sub-topics)",
        f"Content: {report.sections} sections, {report.concepts} concepts, {report.mcqs} MCQs, {report.pyqs} PYQs",
    ]
    if report.versions or report.books:
        lines.append(f"Versions and books: {report.versions} concept versions, {report.books} books")
    for heading, items in (("ERRORS (fix before importing)", report.errors), ("Gaps (topic not ready yet)", report.gaps)):
        if items:
            lines.append(f"{heading}: {len(items)}")
            lines.extend(f"  - {item}" for item in items[:max_lines])
            if len(items) > max_lines:
                lines.append(f"  … and {len(items) - max_lines} more")
    lines.append("Result: " + ("ERRORS, not importable" if report.errors else "READY" if report.ready else "importable, with gaps"))
    return "\n".join(lines)
