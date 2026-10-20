"""Check a GS LMS subject content file before it is imported.

Two kinds of findings:

* errors   — the file is malformed and must not be imported (bad node type,
             invalid section label, an MCQ whose correct option is not one of
             its options, two sibling topics with the same title, ...).
* gaps     — the file is valid but a topic is not ready for students yet
             (missing one of the five sections, fewer MCQs than the MCQ Lab
             needs, an MCQ without an explanation, no PYQs).

``check_subject_content`` returns a report; ``format_report`` turns it into the
text the importer CLI prints. A topic is "ready" when it has no gaps.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from typing import Any

from app.core.gs_lms.models import (
    GsLmsExamTypeEnum,
    GsLmsNodeTypeEnum,
    GsLmsQuestionTypeEnum,
    GsLmsSectionLabelEnum,
)

# The MCQ Lab serves exactly this many questions per topic.
MCQS_PER_TOPIC = 15
REQUIRED_SECTIONS = [label.value for label in GsLmsSectionLabelEnum]
OPTION_LABELS = ["A", "B", "C", "D"]

_NODE_TYPES = {e.value for e in GsLmsNodeTypeEnum}
_QUESTION_TYPES = {e.value for e in GsLmsQuestionTypeEnum}
_EXAM_TYPES = {e.value for e in GsLmsExamTypeEnum}


@dataclass
class ContentReport:
    errors: list[str] = field(default_factory=list)
    gaps: list[str] = field(default_factory=list)
    topics: int = 0
    topics_ready: int = 0
    mega_topics: int = 0
    sub_topics: int = 0
    sections: int = 0
    mcqs: int = 0
    pyqs: int = 0

    @property
    def ok_to_import(self) -> bool:
        return not self.errors

    @property
    def ready(self) -> bool:
        return not self.errors and self.topics > 0 and self.topics_ready == self.topics

    def summary(self) -> dict[str, Any]:
        """Compact stats stored on GsSubject.completeness_status."""
        return {
            "topics": self.topics,
            "topics_ready": self.topics_ready,
            "mega_topics": self.mega_topics,
            "sub_topics": self.sub_topics,
            "sections": self.sections,
            "mcqs": self.mcqs,
            "pyqs": self.pyqs,
            "gaps": len(self.gaps),
            "ready": self.ready,
        }


def check_subject_content(data: dict[str, Any]) -> ContentReport:
    report = ContentReport()
    tree = data.get("tree")
    if not isinstance(tree, list):
        report.errors.append('The file needs a "tree" list of top-level topics.')
        return report
    if not tree:
        report.gaps.append("The tree has no topics yet.")
    if not (data.get("subject_slug") or data.get("subject_id")):
        report.errors.append('The file needs "subject_slug" (e.g. "polity-governance").')
    _check_siblings(tree, "", report)
    return report


def _check_siblings(nodes: list[Any], path: str, report: ContentReport) -> None:
    titles = Counter(str(n.get("title", "")).strip().lower() for n in nodes if isinstance(n, dict))
    for title, count in titles.items():
        if title and count > 1:
            report.errors.append(f'{path or "top level"}: {count} topics are titled "{title}" (they would be merged on import).')
    for node in nodes:
        if not isinstance(node, dict):
            report.errors.append(f"{path or 'top level'}: every topic must be an object.")
            continue
        _check_node(node, path, report)


def _check_node(node: dict[str, Any], parent_path: str, report: ContentReport) -> None:
    title = str(node.get("title", "")).strip()
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

    children = node.get("children") or []
    if children:
        for key in ("content_sections", "mcq_questions"):
            if node.get(key):
                report.errors.append(f"{path}: has child topics, so {key} belong on its leaf topics instead.")
        _check_siblings(children, path, report)
        return

    if node_type != "LEAF_TOPIC":
        # A mega- or sub-topic placeholder whose topics are not written yet.
        if node_type in _NODE_TYPES:
            report.gaps.append(f"{path}: has no child topics yet.")
        return
    report.topics += 1
    gaps_before = len(report.gaps)
    _check_sections(node.get("content_sections") or [], path, report)
    _check_mcqs(node.get("mcq_questions") or [], path, report)
    _check_pyqs(node.get("pyqs") or [], path, report)
    if len(report.gaps) == gaps_before:
        report.topics_ready += 1


def _check_sections(sections: list[Any], path: str, report: ContentReport) -> None:
    present = set()
    for section in sections:
        label = section.get("section_label") if isinstance(section, dict) else None
        if label not in REQUIRED_SECTIONS:
            report.errors.append(f"{path}: section_label {label!r} must be one of {REQUIRED_SECTIONS}.")
            continue
        if label in present:
            report.errors.append(f"{path}: section {label} appears twice.")
        present.add(label)
        report.sections += 1
        if not section.get("blocks"):
            report.gaps.append(f"{path}: section {label} has no content blocks.")
    missing = [label for label in REQUIRED_SECTIONS if label not in present]
    if missing:
        report.gaps.append(f"{path}: missing section(s) {', '.join(missing)}.")


def _check_mcqs(mcqs: list[Any], path: str, report: ContentReport) -> None:
    seen = set()
    for i, mcq in enumerate(mcqs, start=1):
        where = f"{path}: MCQ {i}"
        if not isinstance(mcq, dict):
            report.errors.append(f"{where} must be an object.")
            continue
        report.mcqs += 1
        text = str(mcq.get("question_text", "")).strip()
        if not text:
            report.errors.append(f"{where} has no question_text.")
        elif text.lower() in seen:
            report.errors.append(f"{where} repeats an earlier question in this topic.")
        seen.add(text.lower())

        options = mcq.get("options")
        labels = [o.get("label") for o in options if isinstance(o, dict)] if isinstance(options, list) else []
        if labels != OPTION_LABELS or any(not str(o.get("text", "")).strip() for o in options):
            report.errors.append(f"{where} needs exactly four options labelled A, B, C, D, each with text.")
        if mcq.get("correct_option") not in OPTION_LABELS:
            report.errors.append(f"{where}: correct_option {mcq.get('correct_option')!r} must be A, B, C or D.")
        if mcq.get("question_type") not in _QUESTION_TYPES:
            report.errors.append(f"{where}: question_type {mcq.get('question_type')!r} must be one of {sorted(_QUESTION_TYPES)}.")
        if not str(mcq.get("explanation") or "").strip():
            report.gaps.append(f"{where} has no explanation.")
    if len(mcqs) < MCQS_PER_TOPIC:
        report.gaps.append(f"{path}: {len(mcqs)} MCQs; the MCQ Lab needs {MCQS_PER_TOPIC}.")


def _check_pyqs(pyqs: list[Any], path: str, report: ContentReport) -> None:
    for i, pyq in enumerate(pyqs, start=1):
        where = f"{path}: PYQ {i}"
        if not isinstance(pyq, dict):
            report.errors.append(f"{where} must be an object.")
            continue
        report.pyqs += 1
        if pyq.get("exam_type") not in _EXAM_TYPES:
            report.errors.append(f"{where}: exam_type {pyq.get('exam_type')!r} must be PRELIMS or MAINS.")
        if not str(pyq.get("question_text", "")).strip():
            report.errors.append(f"{where} has no question_text.")
    if not pyqs:
        report.gaps.append(f"{path}: no PYQs.")


def format_report(report: ContentReport, *, max_lines: int = 40) -> str:
    lines = [
        f"Topics ready: {report.topics_ready} of {report.topics} "
        f"({report.mega_topics} mega-topics, {report.sub_topics} sub-topics)",
        f"Content: {report.sections} sections, {report.mcqs} MCQs, {report.pyqs} PYQs",
    ]
    for heading, items in (("ERRORS (fix before importing)", report.errors), ("Gaps (topic not ready yet)", report.gaps)):
        if items:
            lines.append(f"{heading}: {len(items)}")
            lines.extend(f"  - {item}" for item in items[:max_lines])
            if len(items) > max_lines:
                lines.append(f"  … and {len(items) - max_lines} more")
    lines.append("Result: " + ("ERRORS, not importable" if report.errors else "READY" if report.ready else "importable, with gaps"))
    return "\n".join(lines)
