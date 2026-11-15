"""Hermetic tests for the read-only GS content integrity validator."""

from __future__ import annotations

import importlib
import json
from pathlib import Path

import pytest


@pytest.fixture(scope="module")
def validator():
    """Load the script directly without importing application configuration."""
    return importlib.import_module("scripts.validation.validate_gs_content_integrity")


SECTION_LABELS = (
    "BASIC",
    "NCERT_LEVEL",
    "ADVANCED",
    "CURRENT_AFFAIRS",
    "EXAMINER_TRAPS",
)


def _topic(number: int) -> dict:
    sections = [
        {
            "section_label": label,
            "display_order": section_order,
            "title": f"{label} section",
            "authored": True,
            "blocks": [{"type": "para", "text": f"Topic {number} {label}."}],
        }
        for section_order, label in enumerate(SECTION_LABELS, start=1)
    ]
    return {
        "title": f"Topic {number}",
        "node_type": "LEAF_TOPIC",
        "display_order": number,
        "review_status": "REVIEWED",
        "content_sections": sections,
        "pyqs": [
            {
                "exam_type": "UPSC",
                "year": 2020,
                "question_text": f"What is Topic {number}?",
                "answer_text": "A concise answer.",
                "explanation": "A concise explanation.",
            }
        ],
        "mcq_questions": [
            {
                "question_text": f"Which statement describes Topic {number}?",
                "question_type": "FACTUAL",
                "explanation": "The first option is correct.",
                "display_order": 1,
                "options": [
                    {"label": "A", "text": "Correct"},
                    {"label": "B", "text": "Incorrect"},
                ],
                "correct_option": "A",
            }
        ],
    }


def _write_fixture(tmp_path: Path, validator, mutate=None) -> tuple[Path, Path]:
    upgraded_dir = tmp_path / "upgraded_topics"
    upgraded_dir.mkdir()
    topics = {number: _topic(number) for number in range(1, 28)}
    authored_topics = [json.loads(json.dumps(topic)) for topic in topics.values()]
    if mutate is not None:
        mutate(authored_topics)

    for number, topic in enumerate(authored_topics, start=1):
        (upgraded_dir / f"{number}_topic.json").write_text(
            json.dumps(topic), encoding="utf-8"
        )

    syllabus = {
        "tree": [
            {
                **topic,
                "children": [],
            }
            for topic in topics.values()
        ]
    }
    syllabus_path = tmp_path / "syllabus.json"
    syllabus_path.write_text(json.dumps(syllabus), encoding="utf-8")
    return upgraded_dir, syllabus_path


def test_complete_1_to_27_corpus_passes(tmp_path, validator):
    upgraded_dir, syllabus_path = _write_fixture(tmp_path, validator)

    result = validator.validate(upgraded_dir, syllabus_path)

    assert validator.status(result) == "PASS"
    assert result.discovered == sorted(
        f"{number}_topic.json" for number in range(1, 28)
    )
    assert set(result.topic_status.values()) == {"PASS"}
    assert not [finding for finding in result.findings if finding.status in {"FAIL", "BLOCKED"}]


@pytest.mark.parametrize(
    ("mutation", "category"),
    [
        (
            lambda topics: topics[1].__setitem__("title", topics[0]["title"]),
            "DUPLICATE_TITLE",
        ),
        (
            lambda topics: topics[1].__setitem__("display_order", 1),
            "DUPLICATE_DISPLAY_ORDER",
        ),
        (
            lambda topics: topics[2]["content_sections"][0].__setitem__(
                "section_label", "MALFORMED"
            ),
            "SECTIONS",
        ),
        (
            lambda topics: topics[3]["content_sections"][1]["blocks"][0].__setitem__(
                "type", "not-supported"
            ),
            "BLOCKS",
        ),
    ],
    ids=["duplicate-topic-title", "duplicate-display-order", "malformed-section", "malformed-content"],
)
def test_duplicate_or_malformed_fixture_is_detected(tmp_path, validator, mutation, category):
    upgraded_dir, syllabus_path = _write_fixture(tmp_path, validator, mutation)

    result = validator.validate(upgraded_dir, syllabus_path)

    assert validator.status(result) == "FAIL"
    assert any(finding.category == category for finding in result.findings)


def test_duplicate_json_keys_are_rejected(tmp_path, validator):
    fixture = tmp_path / "duplicate-keys.json"
    fixture.write_text('{"title":"first", "title":"second"}', encoding="utf-8")

    with pytest.raises(validator.DuplicateJSONKeyError, match="duplicate object key"):
        validator.load_json(fixture)
