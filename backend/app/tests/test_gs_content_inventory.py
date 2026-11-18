"""Hermetic tests for the read-only GS content inventory/preflight tool."""

from __future__ import annotations

import hashlib
import importlib
import json
from pathlib import Path


SECTION_LABELS = ("BASIC", "NCERT_LEVEL", "ADVANCED", "CURRENT_AFFAIRS", "EXAMINER_TRAPS")


def _topic(title: str, number: int, *, duplicate_section: bool = False) -> dict:
    labels = list(SECTION_LABELS)
    if duplicate_section:
        labels[-1] = labels[-2]
    return {
        "title": title,
        "node_type": "LEAF_TOPIC",
        "display_order": number,
        "review_status": "REVIEWED",
        "content_sections": [
            {
                "section_label": label,
                "title": f"{label} section",
                "display_order": index,
                "authored": True,
                "blocks": [{"type": "para", "text": f"{title} {label}"}],
            }
            for index, label in enumerate(labels, start=1)
        ],
        "pyqs": [
            {
                "question_text": f"What is {title}?",
                "year": 2024,
                "exam_type": "PRELIMS",
            }
        ],
        "mcq_questions": [
            {"question_text": f"Which describes {title}?"},
        ],
    }


def _write_fixture(
    tmp_path: Path,
    topics: list[tuple[str, int, dict]],
) -> tuple[Path, Path]:
    upgraded_dir = tmp_path / "upgraded_topics"
    upgraded_dir.mkdir()
    authored_nodes = []
    for filename, number, node in topics:
        path = upgraded_dir / filename
        path.write_text(json.dumps(node, indent=2), encoding="utf-8")
        authored_nodes.append(node)

    syllabus_path = tmp_path / "syllabus.json"
    syllabus_path.write_text(
        json.dumps({"tree": [{**node, "children": []} for node in authored_nodes]}, indent=2),
        encoding="utf-8",
    )
    return upgraded_dir, syllabus_path


def test_inventory_is_deterministic_and_hashes_raw_files(tmp_path):
    tool = importlib.import_module("scripts.validation.inventory_gs_content")
    node = _topic("Topic One", 1)
    upgraded_dir, syllabus_path = _write_fixture(
        tmp_path, [("01_topic_one.json", 1, node)]
    )

    first = tool.inventory(upgraded_dir, syllabus_path, repo_root=tmp_path)
    second = tool.inventory(upgraded_dir, syllabus_path, repo_root=tmp_path)

    assert first == second
    assert first["status"] == "PASS"
    authored = next(item for item in first["artifacts"] if item["kind"] == "authored_topic")
    assert authored["sha256"] == hashlib.sha256(
        (upgraded_dir / "01_topic_one.json").read_bytes()
    ).hexdigest()
    assert first["topics"][0]["pyq_count"] == 1
    assert first["topics"][0]["mcq_count"] == 1
    assert "question_text" not in json.dumps(first)


def test_topic_24_number_and_display_order_are_blocking_without_selection(tmp_path):
    tool = importlib.import_module("scripts.validation.inventory_gs_content")
    first = _topic("Aeolian Processes and Desert Landforms", 24)
    second = _topic("Arid and Aeolian (Desert) Landforms", 24)
    upgraded_dir, syllabus_path = _write_fixture(
        tmp_path,
        [
            ("24_aeolian_desert_landforms.json", 24, first),
            ("24_arid_aeolian_landforms.json", 24, second),
        ],
    )

    result = tool.inventory(upgraded_dir, syllabus_path, repo_root=tmp_path)
    categories = {finding["category"] for finding in result["findings"]}

    assert result["status"] == "FAIL"
    assert "DUPLICATE_TOPIC_NUMBER" in categories
    assert "DUPLICATE_DISPLAY_ORDER" in categories
    assert len(result["topics"]) == 2
    assert result["candidate_policy"]["topic_24"].startswith("Both candidates remain reported")


def test_natural_key_duplicates_and_invalid_report_target_are_blocked(tmp_path):
    tool = importlib.import_module("scripts.validation.inventory_gs_content")
    duplicate = _topic("Same Topic", 1, duplicate_section=True)
    second = _topic("Same Topic", 2)
    upgraded_dir, syllabus_path = _write_fixture(
        tmp_path,
        [("01_same_topic.json", 1, duplicate), ("02_same_topic.json", 2, second)],
    )

    result = tool.inventory(upgraded_dir, syllabus_path, repo_root=tmp_path)
    categories = {finding["category"] for finding in result["findings"]}

    assert result["status"] == "FAIL"
    assert "DUPLICATE_TOPIC_NATURAL_KEY" in categories
    assert "DUPLICATE_SECTION_NATURAL_KEY" in categories
    assert not tool._report_is_safe(upgraded_dir / "manifest.json", upgraded_dir, syllabus_path)
    assert not tool._report_is_safe(syllabus_path, upgraded_dir, syllabus_path)
    assert tool._report_is_safe(tmp_path / "manifest.json", upgraded_dir, syllabus_path)
