"""Loading questions into a test, with a check before anything is saved.

One code path serves the operator's upload screen, the older bulk endpoint and
single-question creation:

* every row is checked on its own, so one bad row is reported by its position
  instead of failing the whole file with a server error;
* a question already in the test, or repeated inside the file, is recognised by
  its wording and options (ignoring case, spacing and option order) and skipped;
* a dry run returns exactly what a real run would do and saves nothing;
* a real run saves every accepted row in one transaction, or none of them.

Options are stored as ``{"A": "...", "B": "..."}``, the shape the exam screen
and the scoring code read.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.domain import Question, Test, Topic, WorkflowStatusEnum
from app.services.domain_contracts import ContractViolation, normalize_option_id

OPTION_IDS = ("A", "B", "C", "D")
DIFFICULTIES = {"EASY", "MEDIUM", "HARD"}
MAX_IMPORT_ROWS = 500
_STATUSES = {status.value for status in WorkflowStatusEnum}
_QUESTION_TYPES = {
    "STANDARD",
    "MULTI_STATEMENT",
    "ASSERTION_REASON",
    "MATCH_FOLLOWING",
    "CHRONOLOGY",
    "PAIR_MATCHING",
}


def _clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value if value is not None else "")).strip()


def _option_id(value: Any) -> str:
    """The option letter, or the value as typed when it is not a valid one."""
    try:
        return normalize_option_id(value) or ""
    except ContractViolation:
        return _clean(value).upper()


def _fold(value: Any) -> str:
    return _clean(value).casefold()


def question_fingerprint(text: str, options: Dict[str, str], statements: List[str]) -> str:
    """Identity of a question for duplicate detection.

    Two rows are the same question when the wording, the statements and the set
    of option texts match after ignoring case, spacing and option order.
    """
    payload = {
        "text": _fold(text),
        "statements": [_fold(item) for item in statements],
        "options": sorted(_fold(item) for item in options.values()),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


@dataclass
class RowResult:
    row: int  # 1-based position in the upload
    outcome: str  # "ready" | "duplicate" | "invalid" (dry run) or "created" (real run)
    problems: List[str] = field(default_factory=list)
    question_number: Optional[int] = None
    question_id: Optional[int] = None
    text: str = ""


@dataclass
class ImportResult:
    dry_run: bool
    saved: bool
    rows: List[RowResult]
    topics_created: List[str]
    questions: List[Question] = field(default_factory=list)

    def count(self, outcome: str) -> int:
        return sum(1 for row in self.rows if row.outcome == outcome)


class ImportTargetNotFound(Exception):
    """The test, or the fallback topic, named in the request does not exist."""


def _options_from(raw: Dict[str, Any], problems: List[str]) -> Dict[str, str]:
    source = raw.get("options_en", raw.get("options"))
    options: Dict[str, str] = {}
    if isinstance(source, dict):
        for key, value in source.items():
            options[_option_id(key)] = _clean(value)
    elif isinstance(source, list):
        for index, item in enumerate(source):
            if isinstance(item, dict):
                key = item.get("id") or (OPTION_IDS[index] if index < len(OPTION_IDS) else str(index))
                options[_option_id(key)] = _clean(item.get("text", item.get("text_en")))
            elif index < len(OPTION_IDS):
                options[OPTION_IDS[index]] = _clean(item)
    else:
        # Spreadsheet style: columns option_a .. option_d, or simply A .. D.
        for option_id in OPTION_IDS:
            value = raw.get(f"option_{option_id.lower()}")
            if value is None:
                value = raw.get(option_id, raw.get(option_id.lower()))
            if value is not None:
                options[option_id] = _clean(value)

    if sorted(options) != list(OPTION_IDS):
        problems.append("Needs exactly four options labelled A, B, C and D.")
    elif any(not text for text in options.values()):
        problems.append("Every option needs text.")
    elif len({_fold(text) for text in options.values()}) < len(options):
        problems.append("Two options have the same text.")
    return options


def _string_list(value: Any) -> List[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [_clean(value)] if _clean(value) else []
    return [_clean(item) for item in value if _clean(item)]


def _hindi_options(raw: Dict[str, Any]) -> Optional[Dict[str, str]]:
    source = raw.get("options_hi")
    if not isinstance(source, dict) or not source:
        return None
    return {_option_id(key): _clean(value) for key, value in source.items()}


def run_question_import(
    db: Session,
    *,
    test_id: int,
    rows: List[Dict[str, Any]],
    dry_run: bool,
    default_topic_id: Optional[int] = None,
    default_status: str = WorkflowStatusEnum.DRAFT.value,
    create_missing_topics: bool = False,
    reject_duplicates: bool = False,
) -> ImportResult:
    """Check ``rows`` against the test and, unless ``dry_run``, save the good ones.

    Nothing is saved when any row is invalid. With ``reject_duplicates`` a
    duplicate counts as invalid instead of being skipped. The caller's
    transaction is committed on a real run and rolled back on a dry run.
    """
    test = db.query(Test).filter(Test.id == test_id).first()
    if test is None:
        raise ImportTargetNotFound("Test not found")

    topics = db.query(Topic).filter(Topic.subject_id == test.subject_id).all()
    topics_by_id = {topic.id: topic for topic in topics}
    topics_by_name = {_fold(topic.name): topic for topic in topics}
    if default_topic_id is not None and default_topic_id not in topics_by_id:
        raise ImportTargetNotFound("Topic not found in this test's subject")

    existing = (
        db.query(Question)
        .filter(Question.test_id == test_id, Question.is_deleted.is_(False))
        .all()
    )
    seen = {
        question_fingerprint(
            question.text_en,
            _stored_options(question.options_en),
            _string_list(question.statements_en),
        ): f"question {question.question_number or question.id} already in this test"
        for question in existing
    }
    used_numbers = {q.question_number for q in existing if q.question_number}
    next_number = (
        db.query(func.max(Question.question_number)).filter(Question.test_id == test_id).scalar()
        or 0
    ) + 1

    results: List[RowResult] = []
    accepted: List[Dict[str, Any]] = []
    new_topic_names: Dict[str, str] = {}

    for position, raw in enumerate(rows, start=1):
        problems: List[str] = []
        if not isinstance(raw, dict):
            results.append(RowResult(position, "invalid", ["Row is not a question record."]))
            continue

        text = _clean(raw.get("text_en", raw.get("question")))
        if len(text) < 5:
            problems.append("Question text is missing or too short.")

        options = _options_from(raw, problems)
        correct = _option_id(raw.get("correct_option") or raw.get("correct") or raw.get("answer"))
        if correct not in OPTION_IDS:
            problems.append("Correct option must be A, B, C or D.")
        elif options and correct not in options:
            problems.append(f"Correct option {correct} is not one of the options.")

        difficulty = _clean(raw.get("difficulty") or "MEDIUM").upper()
        if difficulty not in DIFFICULTIES:
            problems.append("Difficulty must be EASY, MEDIUM or HARD.")

        status = _clean(raw.get("status") or default_status).upper()
        if status not in _STATUSES:
            problems.append(f"Status must be one of {', '.join(sorted(_STATUSES))}.")

        question_type = _clean(raw.get("question_type") or "STANDARD").upper()
        if question_type not in _QUESTION_TYPES:
            question_type = "STANDARD"

        topic_id: Optional[int] = None
        topic_name: Optional[str] = None
        raw_topic_id = raw.get("topic_id")
        raw_topic_name = _clean(raw.get("topic") or raw.get("topic_name"))
        if raw_topic_id not in (None, "", 0):
            try:
                topic_id = int(raw_topic_id)
            except (TypeError, ValueError):
                topic_id = None
            if topic_id not in topics_by_id:
                problems.append("Topic does not belong to this test's subject.")
        elif raw_topic_name:
            match = topics_by_name.get(_fold(raw_topic_name))
            if match is not None:
                topic_id = match.id
            elif create_missing_topics:
                topic_name = new_topic_names.setdefault(_fold(raw_topic_name), raw_topic_name)
            else:
                problems.append(f'Topic "{raw_topic_name}" does not exist in this subject.')
        elif default_topic_id is not None:
            topic_id = default_topic_id
        else:
            problems.append("No topic given for this question.")

        number: Optional[int] = None
        raw_number = raw.get("question_number")
        if raw_number not in (None, "", 0):
            try:
                number = int(raw_number)
            except (TypeError, ValueError):
                problems.append("Question number must be a whole number.")
            else:
                if number < 1:
                    problems.append("Question number must be 1 or more.")

        statements = _string_list(raw.get("statements_en"))
        fingerprint = question_fingerprint(text, options, statements) if not problems else ""

        if problems:
            results.append(RowResult(position, "invalid", problems, number, text=text[:120]))
            continue

        if fingerprint in seen:
            outcome = "invalid" if reject_duplicates else "duplicate"
            results.append(
                RowResult(position, outcome, [f"Same as {seen[fingerprint]}."], number, text=text[:120])
            )
            continue
        seen[fingerprint] = f"row {position} of this upload"

        if number is None or number in used_numbers:
            while next_number in used_numbers:
                next_number += 1
            number = next_number
        used_numbers.add(number)

        results.append(RowResult(position, "ready", [], number, text=text[:120]))
        accepted.append(
            {
                "position": position,
                "topic_id": topic_id,
                "topic_name": topic_name,
                "fingerprint": fingerprint,
                "columns": {
                    "text_en": text,
                    "text_hi": _clean(raw.get("text_hi")) or None,
                    "options_en": options,
                    "options_hi": _hindi_options(raw),
                    "correct_option": correct,
                    "statements_en": statements or None,
                    "statements_hi": _string_list(raw.get("statements_hi")) or None,
                    "explanation_en": _clean(raw.get("explanation_en", raw.get("explanation"))) or None,
                    "explanation_hi": _clean(raw.get("explanation_hi")) or None,
                    "source": _clean(raw.get("source")) or None,
                    "difficulty": difficulty,
                    "question_number": number,
                    "status": WorkflowStatusEnum(status),
                    "quality_notes": raw.get("quality_notes") if isinstance(raw.get("quality_notes"), dict) else None,
                    "integrity_metadata": {"question_type": question_type},
                },
            }
        )

    topics_created = sorted(new_topic_names.values())
    has_invalid = any(row.outcome == "invalid" for row in results)
    result = ImportResult(dry_run=dry_run, saved=False, rows=results, topics_created=topics_created)
    if dry_run or has_invalid or not accepted:
        return result

    try:
        created_topics: Dict[str, Topic] = {}
        for folded, name in new_topic_names.items():
            topic = Topic(name=name, subject_id=test.subject_id)
            db.add(topic)
            created_topics[folded] = topic
        db.flush()

        by_position = {row.row: row for row in results}
        for item in accepted:
            topic_id = item["topic_id"]
            if topic_id is None:
                topic_id = created_topics[_fold(item["topic_name"])].id
            question = Question(
                test_id=test_id,
                topic_id=topic_id,
                content_hash=item["fingerprint"],
                **item["columns"],
            )
            db.add(question)
            result.questions.append(question)
        db.flush()
        for item, question in zip(accepted, result.questions):
            row = by_position[item["position"]]
            row.outcome = "created"
            row.question_id = question.id
        db.commit()
    except Exception:
        db.rollback()
        raise

    for question in result.questions:
        db.refresh(question)
    result.saved = True
    return result


def _stored_options(value: Any) -> Dict[str, str]:
    """Options as stored, whichever of the two historical shapes the row has."""
    if isinstance(value, dict):
        return {str(key): _clean(text) for key, text in value.items()}
    if isinstance(value, list):
        return {
            str(item.get("id", index)): _clean(item.get("text", ""))
            for index, item in enumerate(value)
            if isinstance(item, dict)
        }
    return {}
