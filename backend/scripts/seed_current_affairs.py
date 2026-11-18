"""Seed reviewed-pending Current Affairs items from the authored content file.

The learner-facing Current Affairs surfaces publish only rows with
``review_status == "PUBLISHED"``. This script never publishes anything: every
item it writes lands in ``DRAFT`` and has to move DRAFT -> IN_REVIEW ->
PUBLISHED through the admin status endpoint, so an authored item cannot reach a
learner without a reviewer touching it.

It also closes the taxonomy gap the admin API leaves open. ``subject``,
``gs_paper``, ``exam_relevance`` and ``source_authority`` are unvalidated free
strings on ``POST /api/v1/admin/current-affairs/items``, which is how an invalid
subject value once reached the database. Here they are checked against the
engine enums before anything is written, and every item must carry at least one
``source`` content block quoting a real URL, so nothing enters the review queue
without a citation.

Run from the backend directory:

    venv/Scripts/python.exe scripts/seed_current_affairs.py --check
    venv/Scripts/python.exe scripts/seed_current_affairs.py

``--check`` validates ``content/current_affairs/items.json`` without touching
the database. Without it, the script inserts missing items in ``DRAFT`` and
reports what it skipped, so re-running is safe.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session  # noqa: E402

from app.core.current_affairs import ca_models  # noqa: E402,F401
from app.models import domain as domain_models  # noqa: E402,F401  (registers User for CA mappers)
from app.core.current_affairs.ca_engine import (  # noqa: E402
    ExamRelevance,
    GSPaper,
    CASubject,
    ReviewStatus,
    SourceAuthority,
)
from app.db.session import SessionLocal  # noqa: E402

CONTENT_PATH = Path(__file__).resolve().parents[1] / "content" / "current_affairs" / "items.json"

MAX_MCQS = 10
MAX_MAINS = 3
_SOURCE_MARKERS = ("http://", "https://")


def _option_labels(options: Any) -> list[str] | None:
    """Mirror the learner-side MCQ shape rule (quick_test._option_labels).

    Returns the label list when the options are usable, otherwise None.
    """
    if not isinstance(options, list) or not options:
        return None
    labels: list[str] = []
    for option in options:
        if not isinstance(option, dict):
            return None
        label = option.get("label")
        text = option.get("text")
        if not isinstance(label, str) or not label.strip():
            return None
        if not isinstance(text, str) or not text.strip():
            return None
        if label.strip().casefold() in [existing.casefold() for existing in labels]:
            return None
        labels.append(label.strip())
    return labels


def validate_item(payload: dict, position: int) -> list[str]:
    """Return every reason this authored item must not enter the review queue."""

    errors: list[str] = []
    where = f"items[{position}] {str(payload.get('title') or '')[:60]!r}"

    title = payload.get("title")
    if not isinstance(title, str) or not 1 <= len(title.strip()) <= 500:
        errors.append(f"{where}: title must be 1-500 characters")

    raw_date = payload.get("publish_date")
    try:
        date.fromisoformat(str(raw_date))
    except ValueError:
        errors.append(f"{where}: publish_date {raw_date!r} is not an ISO date")

    allowed_subjects = {subject.value for subject in CASubject}
    if payload.get("subject") not in allowed_subjects:
        errors.append(
            f"{where}: subject {payload.get('subject')!r} is not one of {sorted(allowed_subjects)}"
        )

    allowed_papers = {paper.value for paper in GSPaper}
    if payload.get("gs_paper") not in allowed_papers:
        errors.append(f"{where}: gs_paper {payload.get('gs_paper')!r} is not one of {sorted(allowed_papers)}")

    allowed_relevance = {value.value for value in ExamRelevance}
    if payload.get("exam_relevance") not in allowed_relevance:
        errors.append(
            f"{where}: exam_relevance {payload.get('exam_relevance')!r} is not one of {sorted(allowed_relevance)}"
        )

    allowed_authority = {value.value for value in SourceAuthority}
    if payload.get("source_authority") not in allowed_authority:
        errors.append(
            f"{where}: source_authority {payload.get('source_authority')!r} is not one of {sorted(allowed_authority)}"
        )

    score = payload.get("relevance_score", 3)
    if not isinstance(score, int) or not 1 <= score <= 5:
        errors.append(f"{where}: relevance_score must be an integer from 1 to 5")

    blocks = payload.get("content_blocks")
    if not isinstance(blocks, list) or not blocks:
        errors.append(f"{where}: content_blocks must be a non-empty list")
    else:
        for index, block in enumerate(blocks):
            if not isinstance(block, dict) or not str(block.get("text") or block.get("content") or "").strip():
                errors.append(f"{where}: content_blocks[{index}] needs text")
        sourced = [
            block
            for block in blocks
            if isinstance(block, dict)
            and block.get("type") == "source"
            and any(marker in str(block.get("text") or block.get("content") or "").lower() for marker in _SOURCE_MARKERS)
        ]
        if not sourced:
            errors.append(f"{where}: a source block quoting at least one URL is required")

    if "review_status" in payload:
        errors.append(f"{where}: review_status cannot be authored; seeding always writes DRAFT")

    mcqs = payload.get("mcqs") or []
    if not isinstance(mcqs, list):
        errors.append(f"{where}: mcqs must be a list")
        mcqs = []
    if len(mcqs) > MAX_MCQS:
        errors.append(f"{where}: at most {MAX_MCQS} MCQs per item")
    for index, mcq in enumerate(mcqs):
        if not isinstance(mcq, dict):
            errors.append(f"{where}: mcqs[{index}] must be an object")
            continue
        if not str(mcq.get("question_text") or "").strip():
            errors.append(f"{where}: mcqs[{index}].question_text is required")
        if not str(mcq.get("question_type") or "").strip():
            errors.append(f"{where}: mcqs[{index}].question_type is required")
        labels = _option_labels(mcq.get("options"))
        if labels is None:
            errors.append(
                f"{where}: mcqs[{index}].options must be a list of {{label, text}} with unique non-empty labels"
            )
        else:
            answer = str(mcq.get("correct_answer") or "")
            if not answer or not any(answer.casefold() == label.casefold() for label in labels):
                errors.append(f"{where}: mcqs[{index}].correct_answer must match one of {labels}")
            if not str(mcq.get("explanation") or "").strip():
                errors.append(f"{where}: mcqs[{index}].explanation is required for a reviewed item")

    mains = payload.get("mains_questions") or []
    if not isinstance(mains, list):
        errors.append(f"{where}: mains_questions must be a list")
        mains = []
    if len(mains) > MAX_MAINS:
        errors.append(f"{where}: at most {MAX_MAINS} Mains questions per item")
    for index, question in enumerate(mains):
        if not isinstance(question, dict):
            errors.append(f"{where}: mains_questions[{index}] must be an object")
            continue
        if not str(question.get("question_text") or "").strip():
            errors.append(f"{where}: mains_questions[{index}].question_text is required")
        if question.get("gs_paper") not in allowed_papers:
            errors.append(f"{where}: mains_questions[{index}].gs_paper must be one of {sorted(allowed_papers)}")
        marks = question.get("marks")
        if not isinstance(marks, int) or not 10 <= marks <= 15:
            errors.append(f"{where}: mains_questions[{index}].marks must be 10-15")
        limit = question.get("word_limit")
        if not isinstance(limit, int) or not 150 <= limit <= 250:
            errors.append(f"{where}: mains_questions[{index}].word_limit must be 150-250")

    return errors


def load_payload(path: Path = CONTENT_PATH) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def seed_items(db: Session, items: list[dict], *, actor: str = "seed_current_affairs") -> dict:
    """Insert each valid item as DRAFT, skipping rows already present."""

    created: list[str] = []
    skipped: list[str] = []
    blocked: list[str] = []

    for position, payload in enumerate(items):
        problems = validate_item(payload, position)
        if problems:
            blocked.extend(problems)
            continue

        title = payload["title"].strip()
        publish_date = date.fromisoformat(payload["publish_date"])
        existing = (
            db.query(ca_models.CAItem)
            .filter(ca_models.CAItem.title == title, ca_models.CAItem.publish_date == publish_date)
            .first()
        )
        if existing is not None:
            skipped.append(f"{title} (id {existing.id}, {existing.review_status})")
            continue

        item = ca_models.CAItem(
            title=title,
            publish_date=publish_date,
            subject=payload["subject"],
            secondary_subjects=payload.get("secondary_subjects") or [],
            gs_paper=payload["gs_paper"],
            exam_relevance=payload["exam_relevance"],
            video_url=payload.get("video_url"),
            content_blocks=payload["content_blocks"],
            upsc_statement_frames=payload.get("upsc_statement_frames"),
            so_what_analysis=payload.get("so_what_analysis"),
            source_authority=payload["source_authority"],
            relevance_score=payload.get("relevance_score", 3),
            review_status=ReviewStatus.DRAFT.value,
            created_by=actor,
        )
        db.add(item)
        db.flush()

        for mcq_index, mcq in enumerate(payload.get("mcqs") or [], start=1):
            db.add(
                ca_models.CAMcq(
                    ca_item_id=item.id,
                    question_text=mcq["question_text"],
                    question_type=mcq["question_type"],
                    options=mcq["options"],
                    correct_answer=str(mcq["correct_answer"]).strip().upper(),
                    explanation=mcq.get("explanation"),
                    display_order=mcq.get("display_order", mcq_index),
                )
            )
        for mains_index, question in enumerate(payload.get("mains_questions") or [], start=1):
            db.add(
                ca_models.CAMainsQuestion(
                    ca_item_id=item.id,
                    question_text=question["question_text"],
                    gs_paper=question["gs_paper"],
                    marks=question["marks"],
                    word_limit=question["word_limit"],
                    model_answer=question.get("model_answer"),
                    display_order=question.get("display_order", mains_index),
                )
            )

        # No CAAuditLog row here: that table requires a real admin user id and
        # records API actions taken by a person. The authoring path identifies
        # itself through CAItem.created_by instead.
        created.append(f"{title} (id {item.id})")

    if created:
        db.commit()
    return {"created": created, "skipped": skipped, "blocked": blocked}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="validate the content file only")
    parser.add_argument("--path", default=str(CONTENT_PATH), help="alternate content JSON to seed")
    args = parser.parse_args()

    document = load_payload(Path(args.path))
    items = document.get("items") or []
    pending = document.get("pending_verification") or []

    if not items:
        print("No items in the content file.")
        return 1

    errors: list[str] = []
    for position, payload in enumerate(items):
        errors.extend(validate_item(payload, position))
    if errors:
        print("Authored items rejected:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"{len(items)} authored item(s) valid; {len(pending)} candidate(s) held for primary-source verification.")
    for candidate in pending:
        print(f"  held: {candidate.get('candidate')}")

    if args.check:
        return 0

    db = SessionLocal()
    try:
        result = seed_items(db, items)
    finally:
        db.close()

    for line in result["created"]:
        print(f"  drafted: {line}")
    for line in result["skipped"]:
        print(f"  already present: {line}")
    print(
        "Nothing published. Move each draft through IN_REVIEW to PUBLISHED with "
        "PATCH /api/v1/admin/current-affairs/items/{id}/status after reading the source."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
