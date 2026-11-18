"""Collect deterministic, sanitized release provenance from local repository metadata.

This collector is intentionally read-only. It does not import the application,
read environment files, access services, contact providers, or invoke commands
that mutate Git. By default it writes nothing; ``--report`` writes only to a
new, explicitly requested path that is not an input file.

Exit codes:
  0  no approval-gated blockers were observed
  1  evidence was collected, but approval-gated blockers were observed
  2  the requested report path or an essential local read was invalid
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

TOOL_VERSION = "1.0.0"
SCHEMA_VERSION = "release-provenance/v1"
MAX_METADATA_BYTES = 1_048_576

# This is an explicit allowlist. In particular, no .env file is ever opened.
DEPLOYMENT_METADATA_PATHS = (
    "docker-compose.yml",
    "backend/Dockerfile",
    "backend/buildspec.yml",
    "backend/codebuild-project.json",
    "backend/task-definition.json",
    "backend/vercel.json",
    "frontend/vercel.json",
    ".github/workflows/functional-recovery.yml",
)
BACKEND_LOCKFILE_NAMES = (
    "backend/poetry.lock",
    "backend/Pipfile.lock",
    "backend/pdm.lock",
    "backend/uv.lock",
    "backend/requirements.lock",
    "backend/requirements.txt.lock",
    "backend/requirements-dev.lock",
)
GENERAL_LOCKFILE_PATHS = (
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "frontend/package-lock.json",
    "frontend/yarn.lock",
    "frontend/pnpm-lock.yaml",
    *BACKEND_LOCKFILE_NAMES,
)
REQUIREMENTS_PATH = "backend/requirements.txt"
ENV_BASENAME_RE = re.compile(r"^\.env(?:\.|$)", re.IGNORECASE)
HEX_SHA_RE = re.compile(r"^[0-9a-f]{40}$", re.IGNORECASE)
DIGEST_RE = re.compile(r"@sha256:[0-9a-f]{64}\b", re.IGNORECASE)
LATEST_TAG_RE = re.compile(
    r"(?::latest\b|\b(?:tag|image_tag|version)\s*[=:]\s*[\"']?latest\b)",
    re.IGNORECASE,
)
MARKER_RES = {
    # Include configuration identifiers, not only standalone prose words: an
    # underscore is a word character, so ``ALLOW_MOCK_AUTH`` is not matched by
    # a simple ``\\bmock\\b`` expression.
    "mock": re.compile(r"(?:\bmock\b|allow[_-]?mock[_-]?auth\b)", re.IGNORECASE),
    "sandbox": re.compile(r"\bsandbox\b", re.IGNORECASE),
    "placeholder": re.compile(r"(?:\bplaceholder\b|configure[_-]?at[_-]?deployment)", re.IGNORECASE),
}
SAFE_BRANCH_CHARS_RE = re.compile(r"[^A-Za-z0-9._/\\-]")


def _safe_branch(value: str | None) -> str | None:
    if value is None:
        return None
    value = SAFE_BRANCH_CHARS_RE.sub("?", value.strip())
    return value[:200] or None


def _run_git(repo_root: Path, *args: str) -> tuple[str | None, str | None]:
    """Return stdout and a stable error category without exposing command output."""
    try:
        completed = subprocess.run(
            ["git", *args],
            cwd=repo_root,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=5,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return None, type(exc).__name__
    if completed.returncode != 0:
        return None, "command_failed"
    return completed.stdout, None


def _git_evidence(repo_root: Path) -> dict[str, Any]:
    head_raw, head_error = _run_git(repo_root, "rev-parse", "HEAD")
    branch_raw, branch_error = _run_git(repo_root, "rev-parse", "--abbrev-ref", "HEAD")
    status_raw, status_error = _run_git(repo_root, "status", "--porcelain=v1", "--untracked-files=all")
    remote_raw, remote_error = _run_git(repo_root, "remote")

    head = head_raw.strip().lower() if head_raw and HEX_SHA_RE.fullmatch(head_raw.strip()) else None
    branch_text = branch_raw.strip() if branch_raw is not None else None
    detached = branch_text == "HEAD"
    status_counts = {"changed": 0, "conflicts": 0, "staged": 0, "unstaged": 0, "untracked": 0}
    if status_raw is not None:
        for line in status_raw.splitlines():
            if line.startswith("??"):
                status_counts["untracked"] += 1
                status_counts["changed"] += 1
                continue
            if len(line) < 2:
                continue
            index_state, worktree_state = line[0], line[1]
            status_counts["changed"] += 1
            if index_state != " ":
                status_counts["staged"] += 1
            if worktree_state != " ":
                status_counts["unstaged"] += 1
            if index_state == "U" or worktree_state == "U" or (index_state == "A" and worktree_state == "A"):
                status_counts["conflicts"] += 1

    remote_count = 0
    if remote_raw is not None:
        remote_count = sum(1 for line in remote_raw.splitlines() if line.strip())

    return {
        "available": not any((head_error, branch_error, status_error, remote_error)),
        "head": head,
        "branch": _safe_branch(None if detached else branch_text),
        "detached": detached,
        "status_counts": status_counts,
        "remotes": {"present": remote_count > 0, "count": remote_count},
        "read_errors": sorted(
            name
            for name, error in {
                "head": head_error,
                "branch": branch_error,
                "status": status_error,
                "remotes": remote_error,
            }.items()
            if error is not None
        ),
    }


def _path_exists(repo_root: Path, relative_path: str) -> bool:
    path = repo_root / relative_path
    return path.is_file() and not ENV_BASENAME_RE.match(path.name)


def _lockfile_evidence(repo_root: Path) -> dict[str, Any]:
    present = sorted(path for path in GENERAL_LOCKFILE_PATHS if _path_exists(repo_root, path))
    backend_lockfiles = sorted(path for path in BACKEND_LOCKFILE_NAMES if _path_exists(repo_root, path))
    requirements_path = repo_root / REQUIREMENTS_PATH
    requirements_present = requirements_path.is_file()
    pinned_lines = 0
    requirement_lines = 0
    if requirements_present:
        try:
            raw = requirements_path.read_text(encoding="utf-8")
            for line in raw.splitlines():
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or stripped.startswith(("-", "--")):
                    continue
                requirement_lines += 1
                if "==" in stripped:
                    pinned_lines += 1
        except (OSError, UnicodeError):
            requirements_present = False

    if backend_lockfiles:
        backend_status = "LOCKFILE_PRESENT"
    elif requirements_present and requirement_lines == pinned_lines:
        backend_status = "PINNED_REQUIREMENTS_WITHOUT_LOCKFILE"
    elif requirements_present:
        backend_status = "REQUIREMENTS_PRESENT_WITHOUT_LOCKFILE"
    else:
        backend_status = "NO_BACKEND_DEPENDENCY_LOCK_OR_REQUIREMENTS"

    return {
        "present": present,
        "backend": {
            "status": backend_status,
            "lockfiles": backend_lockfiles,
            "requirements_file_present": requirements_present,
            "requirements_line_count": requirement_lines,
            "pinned_requirement_line_count": pinned_lines,
        },
    }


def _read_metadata(path: Path) -> str | None:
    if ENV_BASENAME_RE.match(path.name) or not path.is_file():
        return None
    try:
        if path.stat().st_size > MAX_METADATA_BYTES:
            return None
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None


def _deployment_evidence(repo_root: Path) -> dict[str, Any]:
    files_read: list[str] = []
    files_unavailable: list[str] = []
    latest_files: set[str] = set()
    digest_files: set[str] = set()
    marker_files: dict[str, set[str]] = {name: set() for name in MARKER_RES}
    latest_count = 0
    digest_count = 0
    marker_counts = {name: 0 for name in MARKER_RES}

    for relative_path in sorted(DEPLOYMENT_METADATA_PATHS):
        path = repo_root / relative_path
        text = _read_metadata(path)
        if text is None:
            files_unavailable.append(relative_path)
            continue
        files_read.append(relative_path)
        latest_matches = LATEST_TAG_RE.findall(text)
        digest_matches = DIGEST_RE.findall(text)
        latest_count += len(latest_matches)
        digest_count += len(digest_matches)
        if latest_matches:
            latest_files.add(relative_path)
        if digest_matches:
            digest_files.add(relative_path)
        for marker, pattern in MARKER_RES.items():
            count = len(pattern.findall(text))
            marker_counts[marker] += count
            if count:
                marker_files[marker].add(relative_path)

    return {
        "files_read": files_read,
        "files_unavailable": files_unavailable,
        "latest_tag_references": {
            "present": latest_count > 0,
            "count": latest_count,
            "files": sorted(latest_files),
        },
        "digest_references": {
            "present": digest_count > 0,
            "count": digest_count,
            "files": sorted(digest_files),
        },
        "markers": {
            marker: {
                "present": marker_counts[marker] > 0,
                "count": marker_counts[marker],
                "files": sorted(marker_files[marker]),
            }
            for marker in sorted(MARKER_RES)
        },
    }


def _blockers(payload: dict[str, Any]) -> list[dict[str, str]]:
    blockers: list[dict[str, str]] = []
    git = payload["git"]
    if not git["available"]:
        blockers.append({"id": "GIT_METADATA_UNAVAILABLE", "reason": "Root Git HEAD, branch, status, and remote evidence was not fully available."})

    backend = payload["lockfiles"]["backend"]
    if not backend["lockfiles"]:
        blockers.append({"id": "BACKEND_DEPENDENCY_LOCK_MISSING", "reason": "Backend dependencies have no recognized lockfile; pinned requirements alone do not establish a dependency lock."})

    deployment = payload["deployment_identity"]
    if deployment["latest_tag_references"]["present"]:
        blockers.append({"id": "MUTABLE_LATEST_TAG_REFERENCE", "reason": "Deployment metadata references a mutable latest tag; approve an immutable release identity before deployment."})
    if not deployment["digest_references"]["present"]:
        blockers.append({"id": "DEPLOYMENT_DIGEST_REFERENCE_MISSING", "reason": "No sha256 image digest reference was found in the allowlisted deployment metadata."})
    marker_names = [name for name, evidence in deployment["markers"].items() if evidence["present"]]
    if marker_names:
        blockers.append({"id": "NON_PRODUCTION_IDENTITY_MARKER", "reason": "Deployment metadata contains approval-gated marker(s): " + ", ".join(marker_names) + "."})
    return blockers


def collect(repo_root: Path) -> dict[str, Any]:
    lockfiles = _lockfile_evidence(repo_root)
    payload: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "tool_version": TOOL_VERSION,
        "repository_root": ".",
        "git": _git_evidence(repo_root),
        "lockfiles": lockfiles,
        "deployment_identity": _deployment_evidence(repo_root),
    }
    payload["approval_gated_blockers"] = _blockers(payload)
    payload["status"] = "BLOCKED" if payload["approval_gated_blockers"] else "PASS"
    return payload


def _protected_inputs(repo_root: Path) -> set[Path]:
    paths = {repo_root / relative for relative in DEPLOYMENT_METADATA_PATHS}
    paths.update(repo_root / relative for relative in GENERAL_LOCKFILE_PATHS)
    paths.add(repo_root / REQUIREMENTS_PATH)
    paths.add(Path(__file__))
    return {path.resolve() for path in paths}


def _report_is_safe(report: Path, repo_root: Path) -> bool:
    resolved = report.resolve()
    if resolved in _protected_inputs(repo_root) or resolved.exists():
        return False
    try:
        resolved.relative_to((repo_root / ".git").resolve())
    except ValueError:
        return True
    return False


def _render_text(payload: dict[str, Any]) -> str:
    git = payload["git"]
    locks = payload["lockfiles"]
    deployment = payload["deployment_identity"]
    lines = [
        f"Release provenance: {payload['status']}",
        f"Git HEAD: {git['head'] or 'unavailable'}",
        f"Git branch: {git['branch'] or ('detached' if git['detached'] else 'unavailable')}",
        "Git status counts: " + ", ".join(f"{key}={git['status_counts'][key]}" for key in sorted(git["status_counts"])),
        f"Git remotes present: {str(git['remotes']['present']).lower()} (count={git['remotes']['count']}; URLs omitted)",
        "Lockfiles present: " + (", ".join(payload["lockfiles"]["present"]) or "none"),
        f"Backend dependency-lock status: {locks['backend']['status']}",
        f"Latest tag references: {deployment['latest_tag_references']['count']}",
        f"Digest references: {deployment['digest_references']['count']}",
        "Deployment markers: " + ", ".join(
            f"{name}={str(evidence['present']).lower()}" for name, evidence in deployment["markers"].items()
        ),
        "Approval-gated blockers:",
    ]
    lines.extend(f"- {item['id']}: {item['reason']}" for item in payload["approval_gated_blockers"])
    if not payload["approval_gated_blockers"]:
        lines.append("- none")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    repo_root = Path(__file__).resolve().parents[3]
    parser.add_argument("--json", action="store_true", help="emit the deterministic JSON evidence document")
    parser.add_argument("--report", type=Path, help="write a new JSON evidence document to a safe path")
    args = parser.parse_args(argv)

    if args.report is not None and not _report_is_safe(args.report, repo_root):
        print("report path must be new, must not be an input file, and must not be inside .git", file=sys.stderr)
        return 2

    payload = collect(repo_root)
    rendered_json = json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True) + "\n"
    if args.report is not None:
        try:
            args.report.resolve().write_text(rendered_json, encoding="utf-8", newline="\n")
        except OSError as exc:
            print(f"cannot write report: {type(exc).__name__}", file=sys.stderr)
            return 2

    if args.json:
        print(rendered_json, end="")
    else:
        print(_render_text(payload))
    return 1 if payload["approval_gated_blockers"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
