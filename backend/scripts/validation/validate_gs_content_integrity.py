#!/usr/bin/env python3
"""Read-only integrity validator for the upgraded GS Geography content slice.

The validator never edits content.  It discovers upgraded topic JSON files,
checks their identity against the canonical syllabus where an exact title match
is available, validates the five rich-content sections and renderer-supported
block shapes, and reports deterministic findings to stdout.

Exit codes:
  0  no integrity failures
  1  one or more integrity failures
  2  validation was blocked by an unavailable/invalid input artifact
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

CANONICAL_SECTIONS = (
    "BASIC",
    "NCERT_LEVEL",
    "ADVANCED",
    "CURRENT_AFFAIRS",
    "EXAMINER_TRAPS",
)
SUPPORTED_BLOCKS = {
    "heading", "h2", "h3", "para", "callout", "statgrid", "stats",
    "keyterm", "keyterms", "definition", "compare", "comparison",
    "timeline", "trap", "memory", "mnemonic", "analogy", "quiz",
    "collapsible", "points", "diagram", "ncert_reference", "ncert_ref",
    "ncert",
}
CALLOUT_TONES = {"hook", "insight", "tip", "why", "note"}
STATUS_VALUES = {"REVIEWED", "DRAFT", "PENDING", "ARCHIVED"}
# The upgraded corpus is the reviewed Geography slice for topics 1–27.  Keep
# this explicit so a missing file cannot be mistaken for a clean partial run.
EXPECTED_TOPIC_NUMBERS = frozenset(range(1, 28))
NUMBER_RE = re.compile(r"^(\d+)(?:_|$)")


class DuplicateJSONKeyError(ValueError):
    """Raised when a JSON object repeats a key instead of silently overwriting it."""


@dataclass(frozen=True)
class Finding:
    status: str
    category: str
    message: str
    topic: str = ""


@dataclass
class Validation:
    findings: list[Finding] = field(default_factory=list)
    anomalies: list[str] = field(default_factory=list)
    topic_status: dict[str, str] = field(default_factory=dict)
    topic_counts: dict[str, dict[str, int]] = field(default_factory=dict)
    discovered: list[str] = field(default_factory=list)
    blocked: bool = False

    def add(self, status: str, category: str, message: str, topic: str = "") -> None:
        self.findings.append(Finding(status, category, message, topic))

    def fail(self, category: str, message: str, topic: str = "") -> None:
        self.add("FAIL", category, message, topic)

    def block(self, category: str, message: str, topic: str = "") -> None:
        self.blocked = True
        self.add("BLOCKED", category, message, topic)


# ---------------------------------------------------------------------------
# Safe, deterministic input helpers
# ---------------------------------------------------------------------------
def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateJSONKeyError(f"duplicate object key {key!r}")
        result[key] = value
    return result


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle, object_pairs_hook=_reject_duplicate_keys)


def discover_topic_files(directory: Path) -> list[Path]:
    return sorted(path for path in directory.glob("*.json") if path.is_file())


def walk_nodes(nodes: Iterable[Any]) -> Iterable[dict[str, Any]]:
    for node in nodes:
        if not isinstance(node, dict):
            continue
        if node.get("node_type") == "LEAF_TOPIC":
            yield node
        yield from walk_nodes(node.get("children") or [])


def syllabus_index(document: Any) -> dict[str, list[dict[str, Any]]]:
    if not isinstance(document, dict) or not isinstance(document.get("tree"), list):
        raise ValueError("syllabus root must contain a tree list")
    index: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for node in walk_nodes(document["tree"]):
        title = node.get("title")
        if isinstance(title, str) and title.strip():
            index[title.strip()].append(node)
    return dict(index)


def topic_number(path: Path) -> int | None:
    match = NUMBER_RE.match(path.stem)
    return int(match.group(1)) if match else None


def is_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def is_positive_int(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def list_of_strings(value: Any, *, nonempty: bool = True) -> bool:
    return isinstance(value, list) and (not nonempty or bool(value)) and all(
        is_nonempty_string(item) for item in value
    )


def shape_error(block: Any) -> str | None:
    """Return one conservative shape error, or None for a supported block."""
    if not isinstance(block, dict):
        return "block must be an object"
    block_type = block.get("type")
    if not is_nonempty_string(block_type):
        return "block type must be a non-empty string"
    if block_type not in SUPPORTED_BLOCKS:
        return f"unsupported renderer block type {block_type!r}"

    if block_type in {"heading", "h2", "h3", "para"}:
        return None if is_nonempty_string(block.get("text")) else "requires non-empty text"
    if block_type in {"callout"}:
        if block.get("tone") not in CALLOUT_TONES:
            return f"tone must be one of {sorted(CALLOUT_TONES)}"
        if not is_nonempty_string(block.get("text")) and not list_of_strings(block.get("items")):
            return "requires text or a non-empty items list"
        return None
    if block_type in {"statgrid", "stats"}:
        items = block.get("items")
        if not isinstance(items, list) or not items:
            return "requires a non-empty items list"
        if any(not isinstance(item, dict) or not is_nonempty_string(item.get("value"))
               or not is_nonempty_string(item.get("label")) for item in items):
            return "each stat item requires string value and label"
        return None
    if block_type in {"keyterm", "keyterms", "definition"}:
        terms = block.get("terms")
        if terms is None and "term" in block:
            return None if is_nonempty_string(block.get("term")) and is_nonempty_string(block.get("definition")) else "single term format requires term and definition"
        if not isinstance(terms, list) or not terms:
            return "requires terms or the supported single term format"
        if any(not isinstance(item, dict) or not is_nonempty_string(item.get("term"))
               or not is_nonempty_string(item.get("definition")) for item in terms):
            return "each key term requires string term and definition"
        return None
    if block_type in {"compare", "comparison"}:
        left, right = block.get("left"), block.get("right")
        if left is not None or right is not None:
            if not isinstance(left, dict) or not isinstance(right, dict):
                return "left/right format requires both objects"
            if not list_of_strings(left.get("items")) or not list_of_strings(right.get("items")):
                return "left/right format requires non-empty string items lists"
            return None
        columns, rows = block.get("columns"), block.get("rows")
        if not isinstance(columns, list) or len(columns) < 2 or not list_of_strings(columns):
            return "table format requires at least two column labels"
        if not isinstance(rows, list) or not rows:
            return "table format requires non-empty rows"
        if any(not isinstance(row, dict) or not is_nonempty_string(row.get("a"))
               or not is_nonempty_string(row.get("b")) for row in rows):
            return "each comparison row requires string a and b values"
        return None
    if block_type == "timeline":
        events = block.get("events") or block.get("items")
        if not isinstance(events, list) or not events:
            return "requires non-empty events/items list"
        if any(not isinstance(item, dict) or not is_nonempty_string(item.get("year"))
               or not is_nonempty_string(item.get("title") or item.get("event")) for item in events):
            return "each timeline item requires year and title/event strings"
        return None
    if block_type in {"trap"}:
        text_shape = is_nonempty_string(block.get("text"))
        paired_shape = is_nonempty_string(block.get("wrong")) and is_nonempty_string(block.get("correct"))
        return None if text_shape or paired_shape else "requires text or wrong/correct strings"
    if block_type in {"memory", "mnemonic", "analogy"}:
        return None if is_nonempty_string(block.get("text")) else "requires non-empty text"
    if block_type == "quiz":
        return None if is_nonempty_string(block.get("question")) and is_nonempty_string(block.get("answer")) else "requires question and answer strings"
    if block_type == "collapsible":
        has_text = is_nonempty_string(block.get("text")) or is_nonempty_string(block.get("content"))
        return None if is_nonempty_string(block.get("title")) and (has_text or list_of_strings(block.get("items"))) else "requires title and text/content/items"
    if block_type in {"points"}:
        return None if list_of_strings(block.get("items")) else "requires a non-empty items list"
    if block_type == "diagram":
        return None if is_nonempty_string(block.get("id")) and is_nonempty_string(block.get("caption")) else "requires non-empty id and caption"
    if block_type in {"ncert_reference", "ncert_ref", "ncert"}:
        if not is_nonempty_string(block.get("book")):
            return "requires a book string"
        if not is_nonempty_string(block.get("text") or block.get("content")):
            return "requires text/content"
        if "key_facts" in block and not list_of_strings(block.get("key_facts")):
            return "key_facts must be a non-empty string list when present"
        return None
    return None


# ---------------------------------------------------------------------------
# Topic-level checks
# ---------------------------------------------------------------------------
def validate_mcqs(node: dict[str, Any], result: Validation, topic: str) -> None:
    values = node.get("mcq_questions")
    if not isinstance(values, list):
        result.fail("MCQ", "mcq_questions must be a list", topic)
        return
    if not values:
        result.fail("MISSING_CONTENT", "mcq_questions is empty", topic)
        return
    orders: list[int] = []
    for index, item in enumerate(values, 1):
        prefix = f"mcq_questions[{index}]"
        if not isinstance(item, dict):
            result.fail("MCQ", f"{prefix} must be an object", topic)
            continue
        for key in ("question_text", "question_type", "explanation"):
            if not is_nonempty_string(item.get(key)):
                result.fail("MCQ", f"{prefix}.{key} must be a non-empty string", topic)
        order = item.get("display_order")
        if not is_positive_int(order):
            result.fail("MCQ", f"{prefix}.display_order must be a positive integer", topic)
        else:
            orders.append(order)
        options = item.get("options")
        if not isinstance(options, list) or len(options) < 2:
            result.fail("MCQ", f"{prefix}.options requires at least two options", topic)
        else:
            labels = []
            for option in options:
                if not isinstance(option, dict) or not is_nonempty_string(option.get("label")) or not is_nonempty_string(option.get("text")):
                    result.fail("MCQ", f"{prefix}.options entries require label and text", topic)
                else:
                    labels.append(option["label"])
            correct = item.get("correct_option")
            if not is_nonempty_string(correct) or correct not in labels:
                result.fail("MCQ", f"{prefix}.correct_option must match an option label", topic)
    if len(orders) == len(values) and sorted(orders) != list(range(1, len(values) + 1)):
        result.fail("MCQ", "display_order values must be the contiguous sequence 1..count", topic)


def validate_pyqs(node: dict[str, Any], result: Validation, topic: str) -> None:
    values = node.get("pyqs")
    if not isinstance(values, list):
        result.fail("PYQ", "pyqs must be a list", topic)
        return
    if not values:
        result.fail("MISSING_CONTENT", "pyqs is empty", topic)
        return
    for index, item in enumerate(values, 1):
        prefix = f"pyqs[{index}]"
        if not isinstance(item, dict):
            result.fail("PYQ", f"{prefix} must be an object", topic)
            continue
        if not is_nonempty_string(item.get("exam_type")):
            result.fail("PYQ", f"{prefix}.exam_type must be a non-empty string", topic)
        if not isinstance(item.get("year"), int) or isinstance(item.get("year"), bool):
            result.fail("PYQ", f"{prefix}.year must be an integer", topic)
        question = item.get("question_text") or item.get("question")
        answer = item.get("answer_text") or item.get("answer")
        if not is_nonempty_string(question) or not is_nonempty_string(answer):
            result.fail("PYQ", f"{prefix} requires question_text/question and answer_text/answer", topic)
        if not is_nonempty_string(item.get("explanation")):
            result.fail("PYQ", f"{prefix}.explanation must be a non-empty string", topic)


def validate_topic(path: Path, node: Any, syllabus: dict[str, list[dict[str, Any]]], result: Validation) -> None:
    topic = path.name
    result.topic_counts[topic] = {
        "pyqs": len(node.get("pyqs", [])) if isinstance(node, dict) and isinstance(node.get("pyqs"), list) else 0,
        "mcqs": len(node.get("mcq_questions", [])) if isinstance(node, dict) and isinstance(node.get("mcq_questions"), list) else 0,
    }
    before = len(result.findings)
    number = topic_number(path)
    if number is None:
        result.fail("IDENTITY", "filename must begin with a numeric topic number", topic)
    if not isinstance(node, dict):
        result.fail("JSON_SHAPE", "root must be an object", topic)
        result.topic_status[topic] = "FAIL"
        return
    title = node.get("title")
    if not is_nonempty_string(title):
        result.fail("IDENTITY", "title must be a non-empty string", topic)
        title = ""
    if node.get("node_type") != "LEAF_TOPIC":
        result.fail("IDENTITY", "node_type must be LEAF_TOPIC", topic)
    if not is_positive_int(node.get("display_order")):
        result.fail("IDENTITY", "display_order must be a positive integer", topic)
    elif number is not None and node["display_order"] != number:
        result.fail("IDENTITY", f"display_order {node['display_order']} does not match filename number {number}", topic)

    matches = syllabus.get(title.strip(), []) if title else []
    if not matches:
        result.fail("SYLLABUS", "title has no exact match in canonical syllabus", topic)
    elif len(matches) > 1:
        result.block("SYLLABUS", "title maps to multiple canonical syllabus leaves", topic)
    elif is_positive_int(node.get("display_order")) and node["display_order"] != matches[0].get("display_order"):
        result.fail("SYLLABUS", f"display_order {node['display_order']} differs from syllabus display_order {matches[0].get('display_order')}", topic)

    if node.get("review_status") not in STATUS_VALUES:
        result.fail("REVIEW_STATUS", "topic review_status is missing or unsupported", topic)
    elif node.get("review_status") != "REVIEWED":
        result.fail("REVIEW_STATUS", f"topic review_status is {node['review_status']!r}, expected REVIEWED", topic)

    sections = node.get("content_sections")
    if not isinstance(sections, list):
        result.fail("SECTIONS", "content_sections must be a list", topic)
        sections = []
    labels = [section.get("section_label") for section in sections if isinstance(section, dict)]
    if labels != list(CANONICAL_SECTIONS):
        result.fail("SECTIONS", f"section labels/order are {labels!r}; expected {list(CANONICAL_SECTIONS)!r}", topic)
    for expected_order, section in enumerate(sections, 1):
        prefix = f"content_sections[{expected_order}]"
        if not isinstance(section, dict):
            result.fail("SECTIONS", f"{prefix} must be an object", topic)
            continue
        if not is_positive_int(section.get("display_order")) or section.get("display_order") != expected_order:
            result.fail("SECTIONS", f"{prefix}.display_order must be {expected_order}", topic)
        if not is_nonempty_string(section.get("title")):
            result.fail("SECTIONS", f"{prefix}.title must be a non-empty string", topic)
        if section.get("authored") is not True:
            result.fail("SECTIONS", f"{prefix}.authored must be true", topic)
        blocks = section.get("blocks")
        if not isinstance(blocks, list) or not blocks:
            result.fail("BLOCKS", f"{prefix}.blocks must be a non-empty list", topic)
            continue
        for block_index, block in enumerate(blocks, 1):
            error = shape_error(block)
            if error:
                result.fail("BLOCKS", f"{prefix}.blocks[{block_index}]: {error}", topic)

    validate_pyqs(node, result, topic)
    validate_mcqs(node, result, topic)

    # Nested review status was not consistently present in the existing JSON
    # contract, so it is recorded as an anomaly rather than auto-required.
    for collection_name in ("pyqs", "mcq_questions"):
        collection = node.get(collection_name)
        if isinstance(collection, list):
            for index, item in enumerate(collection, 1):
                if isinstance(item, dict) and item.get("review_status") != "REVIEWED":
                    result.anomalies.append(
                        f"{topic}: {collection_name}[{index}] review_status="
                        f"{item.get('review_status', '<missing>')!r}"
                    )

    if isinstance(matches, list) and len(matches) == 1:
        expected = matches[0]
        if expected.get("node_type") != "LEAF_TOPIC":
            result.fail("SYLLABUS", "canonical title resolves to a non-leaf node", topic)
        if expected.get("review_status") != "REVIEWED":
            result.fail("REVIEW_STATUS", "compiled topic is not REVIEWED", topic)
        expected_sections = expected.get("content_sections")
        if not isinstance(expected_sections, list):
            result.fail("COMPILED", "compiled content_sections must be a list", topic)
        elif sections != expected_sections:
            result.fail("COMPILED", "compiled content_sections differ from authored content", topic)
        for field_name, label in (("pyqs", "PYQ"), ("mcq_questions", "MCQ")):
            expected_values = expected.get(field_name)
            actual_values = node.get(field_name)
            if not isinstance(expected_values, list):
                result.fail("COUNTS", f"compiled {field_name} must be a list", topic)
                continue
            if not isinstance(actual_values, list):
                continue
            if len(expected_values) != len(actual_values):
                result.fail("COUNTS", f"{label} count {len(actual_values)} differs from compiled count {len(expected_values)}", topic)
            elif expected_values != actual_values:
                result.fail("COMPILED", f"compiled {field_name} content differs from authored content", topic)
    result.topic_status[topic] = "FAIL" if any(f.status in {"FAIL", "BLOCKED"} and f.topic == topic for f in result.findings[before:]) else "PASS"


def validate(upgraded_dir: Path, syllabus_path: Path) -> Validation:
    result = Validation()
    paths = discover_topic_files(upgraded_dir)
    result.discovered = [path.name for path in paths]
    if not paths:
        result.block("DISCOVERY", f"no JSON topic files found in {upgraded_dir.as_posix()}")
        return result
    result.add("PASS", "DISCOVERY", f"discovered {len(paths)} upgraded topic JSON files")

    numbers: dict[int, list[str]] = defaultdict(list)
    for path in paths:
        number = topic_number(path)
        if number is not None:
            numbers[number].append(path.name)
    for number, names in sorted(numbers.items()):
        if len(names) > 1:
            result.fail("DUPLICATE_NUMBER", f"candidate topic number {number} appears in: {', '.join(names)}")
    missing_numbers = sorted(EXPECTED_TOPIC_NUMBERS - set(numbers))
    extra_numbers = sorted(set(numbers) - EXPECTED_TOPIC_NUMBERS)
    if missing_numbers:
        result.fail("MISSING_NUMBER", f"expected topic numbers are missing: {missing_numbers}")
    if extra_numbers:
        result.fail("UNEXPECTED_NUMBER", f"topic numbers are outside the upgraded corpus: {extra_numbers}")

    try:
        syllabus = syllabus_index(load_json(syllabus_path))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        result.block("SYLLABUS", f"cannot load canonical syllabus: {type(exc).__name__}")
        return result
    result.add("PASS", "SYLLABUS", f"indexed {sum(len(values) for values in syllabus.values())} canonical leaf topics")
    for title, leaves in sorted(syllabus.items()):
        if len(leaves) > 1:
            result.block("DUPLICATE_TITLE", f"canonical title appears {len(leaves)} times: {title!r}")

    loaded: dict[str, Any] = {}
    for path in paths:
        try:
            loaded[path.name] = load_json(path)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            result.fail("JSON", f"cannot parse JSON: {type(exc).__name__}", path.name)
            result.topic_status[path.name] = "FAIL"

    authored_titles: dict[str, list[str]] = defaultdict(list)
    authored_orders: dict[int, list[str]] = defaultdict(list)
    for name, node in loaded.items():
        if isinstance(node, dict):
            title = node.get("title")
            if is_nonempty_string(title):
                authored_titles[title.strip()].append(name)
            order = node.get("display_order")
            if is_positive_int(order):
                authored_orders[order].append(name)
    for title, names in sorted(authored_titles.items()):
        if len(names) > 1:
            result.fail("DUPLICATE_TITLE", f"authored title appears in: {', '.join(names)}")
    for order, names in sorted(authored_orders.items()):
        if len(names) > 1:
            result.fail("DUPLICATE_DISPLAY_ORDER", f"display_order {order} appears in: {', '.join(names)}")

    for path in paths:
        if path.name in loaded:
            validate_topic(path, loaded[path.name], syllabus, result)

    # Count deviations are retained as deterministic anomalies even when the
    # canonical syllabus has the same count (for example, an empty MCQ field
    # can be a missing-content condition rather than an intentional omission).
    for collection_name, label in (("pyqs", "PYQ"), ("mcqs", "MCQ")):
        values = [counts[collection_name] for counts in result.topic_counts.values()]
        if values:
            modal_count, modal_frequency = Counter(values).most_common(1)[0]
            if modal_frequency >= 2:
                for topic, counts in sorted(result.topic_counts.items()):
                    if counts[collection_name] != modal_count:
                        result.anomalies.append(
                            f"{topic}: {label} count {counts[collection_name]} differs from modal count {modal_count}"
                        )
    return result


def status(result: Validation) -> str:
    if result.blocked:
        return "BLOCKED"
    if any(f.status == "FAIL" for f in result.findings):
        return "FAIL"
    return "PASS"


def render_text(result: Validation) -> str:
    lines = [f"GS content integrity: {status(result)}", f"Discovered files: {len(result.discovered)}"]
    for item in result.findings:
        scope = f" [{item.topic}]" if item.topic else ""
        lines.append(f"{item.status} {item.category}{scope}: {item.message}")
    lines.append("Topic status:")
    for topic, topic_status in sorted(result.topic_status.items()):
        counts = result.topic_counts.get(topic, {})
        lines.append(f"  {topic}: {topic_status} (PYQs={counts.get('pyqs', 0)}, MCQs={counts.get('mcqs', 0)})")
    lines.append(f"Anomalies: {len(result.anomalies)}")
    for anomaly in sorted(result.anomalies):
        lines.append(f"ANOMALY {anomaly}")
    return "\n".join(lines)


def render_json(result: Validation) -> str:
    payload = {
        "status": status(result),
        "discovered_files": result.discovered,
        "findings": [finding.__dict__ for finding in result.findings],
        "topic_status": result.topic_status,
        "topic_counts": result.topic_counts,
        "anomalies": sorted(result.anomalies),
    }
    return json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    root = Path(__file__).resolve().parents[3]
    parser.add_argument("--upgraded-dir", type=Path, default=root / "backend/app/core/gs_lms/data/upgraded_topics")
    parser.add_argument("--syllabus", type=Path, default=root / "backend/app/core/gs_lms/data/gs_geography_syllabus.json")
    parser.add_argument("--json", action="store_true", dest="as_json", help="emit deterministic machine-readable JSON")
    args = parser.parse_args(argv)
    result = validate(args.upgraded_dir, args.syllabus)
    print(render_json(result) if args.as_json else render_text(result))
    return 2 if result.blocked else (1 if status(result) == "FAIL" else 0)


if __name__ == "__main__":
    raise SystemExit(main())
