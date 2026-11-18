#!/usr/bin/env python3
"""Read-only deterministic inventory and preflight for canonical GS content.

This tool never imports, rewrites, merges, renames, or deletes content.  It
records raw-file SHA-256 hashes and compact metadata for the authored upgraded
Geography topics plus the compiled canonical syllabus.  Duplicate topic
identity and importer-aligned natural keys are reported as blocking failures;
the tool never selects a topic-24 candidate.

Exit codes:
  0  inventory is clean
  1  inventory completed with preflight failures
  2  an input or requested report was unavailable/invalid
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

TOOL_VERSION = "1.0.0"
SCHEMA_VERSION = "gs-content-preflight/v1"
SUBJECT = "geography"
DEFAULT_PARENT_PATH = "<unspecified>"
NUMBER_RE = re.compile(r"^(\d+)(?:_|$)")


class DuplicateJSONKeyError(ValueError):
    """Raised when JSON silently overwrites a repeated object key."""


def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateJSONKeyError(f"duplicate object key {key!r}")
        result[key] = value
    return result


def _json_load(raw: bytes) -> Any:
    return json.loads(raw.decode("utf-8"), object_pairs_hook=_reject_duplicate_keys)


def _path_text(path: Path, repo_root: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(repo_root.resolve()).as_posix()
    except ValueError:
        return resolved.as_posix()


def _topic_number(path: Path) -> int | None:
    match = NUMBER_RE.match(path.name)
    return int(match.group(1)) if match else None


def _nonempty_text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _parent_path(node: dict[str, Any]) -> str:
    for field_name in ("parent_path", "parent_title"):
        value = node.get(field_name)
        if _nonempty_text(value):
            return value.strip()
    return DEFAULT_PARENT_PATH


def _topic_key(node: dict[str, Any]) -> dict[str, str]:
    return {
        "subject": SUBJECT,
        "parent_path": _parent_path(node),
        "title": node.get("title", "").strip()
        if isinstance(node.get("title"), str)
        else "",
    }


def _key_tuple(key: dict[str, Any]) -> tuple[Any, ...]:
    return tuple(key.get(field) for field in ("subject", "parent_path", "title"))


def _relative_or_absolute(path: Path, repo_root: Path) -> str:
    return _path_text(path, repo_root)


def _iter_nodes(value: Any) -> Iterable[dict[str, Any]]:
    """Yield syllabus nodes without depending on application imports."""
    if isinstance(value, dict):
        if value.get("node_type") == "LEAF_TOPIC" and _nonempty_text(value.get("title")):
            yield value
        for child in value.get("children", []):
            yield from _iter_nodes(child)
        if "tree" in value:
            yield from _iter_nodes(value["tree"])
    elif isinstance(value, list):
        for item in value:
            yield from _iter_nodes(item)


def _artifact_record(
    path: Path, kind: str, repo_root: Path
) -> tuple[dict[str, Any], bytes | None, Any | None, str | None]:
    record: dict[str, Any] = {
        "kind": kind,
        "path": _relative_or_absolute(path, repo_root),
    }
    try:
        raw = path.read_bytes()
    except OSError as exc:
        record.update({"parse_status": "UNAVAILABLE", "error": type(exc).__name__})
        return record, None, None, f"cannot read {path}: {type(exc).__name__}"

    record.update({"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()})
    try:
        parsed = _json_load(raw)
    except (UnicodeDecodeError, ValueError, json.JSONDecodeError) as exc:
        record.update({"parse_status": "INVALID", "error": type(exc).__name__})
        return record, raw, None, f"cannot parse {path}: {type(exc).__name__}"
    record["parse_status"] = "VALID"
    return record, raw, parsed, None


def _topic_summary(path: Path, node: Any, repo_root: Path) -> dict[str, Any]:
    summary: dict[str, Any] = {
        "path": _relative_or_absolute(path, repo_root),
        "filename_topic_number": _topic_number(path),
        "title": None,
        "node_type": None,
        "display_order": None,
        "review_status": None,
        "section_labels": [],
        "pyq_count": 0,
        "mcq_count": 0,
        "natural_key": None,
        "natural_keys": {
            "sections": [],
            "pyqs": [],
            "mcqs": [],
        },
    }
    if not isinstance(node, dict):
        summary["parse_status"] = "VALID_NON_OBJECT"
        return summary

    title = node.get("title")
    summary.update(
        {
            "parse_status": "VALID",
            "title": title.strip() if isinstance(title, str) else None,
            "node_type": node.get("node_type"),
            "display_order": node.get("display_order"),
            "review_status": node.get("review_status"),
        }
    )
    key = _topic_key(node)
    if key["title"]:
        summary["natural_key"] = key

    sections = node.get("content_sections")
    if isinstance(sections, list):
        summary["section_labels"] = [
            section.get("section_label")
            for section in sections
            if isinstance(section, dict)
        ]
        if key["title"]:
            summary["natural_keys"]["sections"] = [
                {"topic": key, "section_label": section.get("section_label")}
                for section in sections
                if isinstance(section, dict)
            ]

    for collection_name, output_name in (("pyqs", "pyqs"), ("mcq_questions", "mcqs")):
        collection = node.get(collection_name)
        if not isinstance(collection, list):
            continue
        summary["pyq_count" if output_name == "pyqs" else "mcq_count"] = len(collection)
        if not key["title"]:
            continue
        if output_name == "pyqs":
            summary["natural_keys"][output_name] = [
                {
                    "topic": key,
                    "question_text": item.get("question_text"),
                    "year": item.get("year", 0),
                }
                for item in collection
                if isinstance(item, dict)
            ]
        else:
            summary["natural_keys"][output_name] = [
                {"topic": key, "question_text": item.get("question_text")}
                for item in collection
                if isinstance(item, dict)
            ]
    return summary


def _add_finding(
    findings: list[dict[str, Any]],
    category: str,
    message: str,
    *,
    paths: Iterable[str] = (),
    natural_key: Any = None,
    status: str = "FAIL",
) -> None:
    finding: dict[str, Any] = {
        "status": status,
        "category": category,
        "message": message,
    }
    normalized_paths = sorted(set(paths))
    if normalized_paths:
        finding["paths"] = normalized_paths
    if natural_key is not None:
        finding["natural_key"] = natural_key
    findings.append(finding)


def _duplicate_findings(
    values: dict[tuple[Any, ...], list[str]],
    findings: list[dict[str, Any]],
    category: str,
    label: str,
) -> None:
    for key, paths in sorted(values.items(), key=lambda item: repr(item[0])):
        if len(paths) < 2:
            continue
        if category in {"DUPLICATE_PYQ_NATURAL_KEY", "DUPLICATE_MCQ_NATURAL_KEY"}:
            serialized_key = json.dumps(
                list(key) if isinstance(key, tuple) else key,
                ensure_ascii=True,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
            manifest_key: Any = {
                "sha256": hashlib.sha256(serialized_key).hexdigest(),
            }
        else:
            manifest_key = list(key) if isinstance(key, tuple) else key
        _add_finding(
            findings,
            category,
            f"{label} occurs in multiple files/records: {', '.join(sorted(paths))}",
            paths=paths,
            natural_key=manifest_key,
        )


def inventory(
    upgraded_dir: Path,
    syllabus_path: Path,
    *,
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Build a deterministic, content-body-free manifest."""
    root = (repo_root or Path(__file__).resolve().parents[3]).resolve()
    upgraded_dir = upgraded_dir.resolve()
    syllabus_path = syllabus_path.resolve()
    findings: list[dict[str, Any]] = []
    artifacts: list[dict[str, Any]] = []
    topics: list[dict[str, Any]] = []

    topic_paths = sorted(upgraded_dir.glob("*.json"), key=lambda path: path.name)
    if not topic_paths:
        _add_finding(
            findings,
            "DISCOVERY",
            f"no JSON topic files found in {upgraded_dir.as_posix()}",
            status="BLOCKED",
        )

    syllabus_record, _, syllabus, syllabus_error = _artifact_record(
        syllabus_path, "compiled_syllabus", root
    )
    artifacts.append(syllabus_record)
    if syllabus_error:
        _add_finding(findings, "INPUT", syllabus_error, paths=[syllabus_record["path"]], status="BLOCKED")

    compiled_nodes = list(_iter_nodes(syllabus)) if syllabus is not None else []
    compiled_by_title: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for node in compiled_nodes:
        compiled_by_title[node["title"].strip()].append(node)
    compiled_natural_keys: dict[tuple[Any, ...], list[str]] = defaultdict(list)
    for node in compiled_nodes:
        key = _topic_key(node)
        compiled_natural_keys[_key_tuple(key)].append("compiled_syllabus")
    _duplicate_findings(
        compiled_natural_keys,
        findings,
        "DUPLICATE_COMPILED_TOPIC_NATURAL_KEY",
        "compiled topic natural key",
    )

    authored_by_number: dict[int, list[str]] = defaultdict(list)
    authored_by_order: dict[int, list[str]] = defaultdict(list)
    authored_by_topic_key: dict[tuple[Any, ...], list[str]] = defaultdict(list)
    section_keys: dict[tuple[Any, ...], list[str]] = defaultdict(list)
    pyq_keys: dict[tuple[Any, ...], list[str]] = defaultdict(list)
    mcq_keys: dict[tuple[Any, ...], list[str]] = defaultdict(list)

    for path in topic_paths:
        record, _, node, error = _artifact_record(path, "authored_topic", root)
        artifacts.append(record)
        if error:
            _add_finding(findings, "INPUT", error, paths=[record["path"]], status="BLOCKED")
            continue
        summary = _topic_summary(path, node, root)
        topics.append(summary)
        number = summary["filename_topic_number"]
        if number is not None:
            authored_by_number[number].append(summary["path"])
        order = summary["display_order"]
        if isinstance(order, int) and not isinstance(order, bool):
            authored_by_order[order].append(summary["path"])
        key = summary["natural_key"]
        if key is None:
            _add_finding(
                findings,
                "IDENTITY",
                "authored topic title must be a non-empty string",
                paths=[summary["path"]],
            )
            continue
        topic_tuple = _key_tuple(key)
        authored_by_topic_key[topic_tuple].append(summary["path"])
        for section_key in summary["natural_keys"]["sections"]:
            section_keys[
                (*topic_tuple, section_key.get("section_label"))
            ].append(summary["path"])
        for pyq_key in summary["natural_keys"]["pyqs"]:
            pyq_keys[
                (*topic_tuple, pyq_key.get("question_text"), pyq_key.get("year", 0))
            ].append(summary["path"])
        for mcq_key in summary["natural_keys"]["mcqs"]:
            mcq_keys[
                (*topic_tuple, mcq_key.get("question_text"))
            ].append(summary["path"])

        title_matches = compiled_by_title.get(key["title"], [])
        summary["canonical_title_match_count"] = len(title_matches)
        summary["canonical_matches"] = [
            {"title": item.get("title"), "display_order": item.get("display_order")}
            for item in title_matches
        ]
        if not title_matches:
            _add_finding(
                findings,
                "CANONICAL_MATCH",
                f"authored title has no exact compiled-syllabus match: {key['title']!r}",
                paths=[summary["path"]],
            )
        elif len(title_matches) > 1:
            _add_finding(
                findings,
                "CANONICAL_MATCH",
                f"authored title maps to {len(title_matches)} compiled-syllabus leaves",
                paths=[summary["path"]],
            )
        elif summary["display_order"] != title_matches[0].get("display_order"):
            _add_finding(
                findings,
                "CANONICAL_MATCH",
                "authored display_order differs from compiled-syllabus display_order",
                paths=[summary["path"]],
            )

    _duplicate_findings(
        authored_by_number,
        findings,
        "DUPLICATE_TOPIC_NUMBER",
        "filename topic number",
    )
    _duplicate_findings(
        authored_by_order,
        findings,
        "DUPLICATE_DISPLAY_ORDER",
        "display_order",
    )
    _duplicate_findings(
        authored_by_topic_key,
        findings,
        "DUPLICATE_TOPIC_NATURAL_KEY",
        "authored topic natural key",
    )
    _duplicate_findings(
        section_keys,
        findings,
        "DUPLICATE_SECTION_NATURAL_KEY",
        "section natural key",
    )
    _duplicate_findings(
        pyq_keys,
        findings,
        "DUPLICATE_PYQ_NATURAL_KEY",
        "PYQ natural key",
    )
    _duplicate_findings(
        mcq_keys,
        findings,
        "DUPLICATE_MCQ_NATURAL_KEY",
        "MCQ natural key",
    )

    artifacts.sort(key=lambda item: (item["kind"], item["path"]))
    for topic in topics:
        topic.pop("natural_keys", None)
    topics.sort(key=lambda item: item["path"])
    findings.sort(key=lambda item: (item["status"], item["category"], item["message"], repr(item.get("paths", []))))
    blocked = any(item["status"] == "BLOCKED" for item in findings)
    status = "BLOCKED" if blocked else ("FAIL" if findings else "PASS")
    return {
        "schema_version": SCHEMA_VERSION,
        "tool_version": TOOL_VERSION,
        "status": status,
        "inputs": {
            "upgraded_dir": _relative_or_absolute(upgraded_dir, root),
            "syllabus": _relative_or_absolute(syllabus_path, root),
        },
        "summary": {
            "authored_topic_files": len(topic_paths),
            "parsed_topic_files": len(topics),
            "compiled_leaf_topics": len(compiled_nodes),
            "artifact_count": len(artifacts),
            "finding_count": len(findings),
            "blocking_failure_count": sum(item["status"] == "FAIL" for item in findings),
        },
        "artifacts": artifacts,
        "topics": topics,
        "findings": findings,
        "candidate_policy": {
            "topic_24": "Both candidates remain reported; no candidate is selected, merged, renamed, or deleted.",
        },
    }


def _report_is_safe(report_path: Path, upgraded_dir: Path, syllabus_path: Path) -> bool:
    resolved = report_path.resolve()
    if resolved == syllabus_path.resolve() or resolved in {
        path.resolve() for path in upgraded_dir.glob("*.json")
    }:
        return False
    try:
        resolved.relative_to(upgraded_dir.resolve())
    except ValueError:
        return True
    return False


def render_text(payload: dict[str, Any]) -> str:
    lines = [
        f"GS content preflight: {payload['status']}",
        f"Authored topic files: {payload['summary']['authored_topic_files']}",
        f"Compiled leaf topics: {payload['summary']['compiled_leaf_topics']}",
        f"Findings: {payload['summary']['finding_count']}",
    ]
    for finding in payload["findings"]:
        scope = f" [{', '.join(finding.get('paths', []))}]" if finding.get("paths") else ""
        lines.append(f"{finding['status']} {finding['category']}{scope}: {finding['message']}")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    root = Path(__file__).resolve().parents[3]
    parser.add_argument(
        "--upgraded-dir",
        type=Path,
        default=root / "backend/app/core/gs_lms/data/upgraded_topics",
    )
    parser.add_argument(
        "--syllabus",
        type=Path,
        default=root / "backend/app/core/gs_lms/data/gs_geography_syllabus.json",
    )
    parser.add_argument("--json", action="store_true", help="emit the machine-readable manifest")
    parser.add_argument("--report", type=Path, help="write the machine-readable manifest to this path")
    args = parser.parse_args(argv)

    upgraded_dir = args.upgraded_dir.resolve()
    syllabus_path = args.syllabus.resolve()
    if args.report is not None and not _report_is_safe(args.report, upgraded_dir, syllabus_path):
        print("report path must not overwrite or reside under canonical content inputs", file=sys.stderr)
        return 2

    payload = inventory(upgraded_dir, syllabus_path, repo_root=root)
    rendered = json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True) + "\n"
    if args.report is not None:
        try:
            args.report.write_text(rendered, encoding="utf-8", newline="\n")
        except OSError as exc:
            print(f"cannot write report: {type(exc).__name__}", file=sys.stderr)
            return 2
    print(rendered if args.json else render_text(payload), end="" if args.json else "\n")
    return 2 if payload["status"] == "BLOCKED" else (1 if payload["status"] == "FAIL" else 0)


if __name__ == "__main__":
    raise SystemExit(main())
