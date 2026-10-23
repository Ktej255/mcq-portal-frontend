"""Write subject content in a spreadsheet (Google Sheets exports CSV) and merge it into the subject JSON.

    python -m app.core.gs_lms.sheets template --subject-file S.json --out-dir sheets/
    python -m app.core.gs_lms.sheets build --subject-file S.json --in-dir sheets/ --out S_new.json

``template`` writes four CSV files that list every leaf topic: concepts.csv,
versions.csv, mcqs.csv and pyqs.csv. Upload each to Google Sheets (File > Import),
fill it in, then download each sheet as CSV (File > Download > Comma-separated
values) back into one folder. ``build`` merges the filled rows into a *copy* of
the subject file, reports every problem with the file name and row number, and
runs the same content check the importer uses. The input file is never changed.
"""

from __future__ import annotations

import argparse
import copy
import csv
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

from app.core.gs_lms.content_check import check_subject_content, format_report
from app.core.gs_lms.content_tree import TopicIndex, normalise_question, normalise_title
from app.core.gs_lms.models import (
    GsLmsExamTypeEnum,
    GsLmsQuestionTypeEnum,
    GsLmsVersionLevelEnum,
    GsLmsVersionSourceEnum,
    GsLmsVersionStyleEnum,
)

MAX_KEY_POINTS = 8
MAX_MISCONCEPTIONS = 3

CONCEPT_COLUMNS = (
    ["topic_title", "concept_title"]
    + [f"key_point_{i}" for i in range(1, MAX_KEY_POINTS + 1)]
    + [f"misconception_{i}" for i in range(1, MAX_MISCONCEPTIONS + 1)]
    + ["book_slug", "chapter", "pages"]
)
VERSION_COLUMNS = ["topic_title", "concept_title", "level", "style", "source", "title", "text", "video_url", "duration_minutes"]
MCQ_COLUMNS = ["topic_title", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_option", "explanation", "question_type"]
PYQ_COLUMNS = ["topic_title", "exam_type", "year", "question_text", "answer_text", "explanation", "marks", "question_type"]

FILES = {
    "concepts.csv": CONCEPT_COLUMNS,
    "versions.csv": VERSION_COLUMNS,
    "mcqs.csv": MCQ_COLUMNS,
    "pyqs.csv": PYQ_COLUMNS,
}

_LEVELS = [e.value for e in GsLmsVersionLevelEnum]
_STYLES = [e.value for e in GsLmsVersionStyleEnum]
_SOURCES = [e.value for e in GsLmsVersionSourceEnum]
_QTYPES = [e.value for e in GsLmsQuestionTypeEnum]
_EXAMS = [e.value for e in GsLmsExamTypeEnum]


# --- template --------------------------------------------------------------


def _write_csv(path: Path, columns: list[str], rows: list[list[Any]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(columns)
        writer.writerows(rows)


def _concept_row(title: str, concept: dict[str, Any] | None) -> list[Any]:
    row: dict[str, Any] = {"topic_title": title}
    if concept:
        row["concept_title"] = concept.get("title", "")
        for i, kp in enumerate((concept.get("key_points") or [])[:MAX_KEY_POINTS], start=1):
            row[f"key_point_{i}"] = kp
        for i, m in enumerate((concept.get("misconceptions") or [])[:MAX_MISCONCEPTIONS], start=1):
            row[f"misconception_{i}"] = m
        refs = concept.get("book_refs") or []
        if refs and isinstance(refs[0], dict):
            row["book_slug"], row["chapter"], row["pages"] = refs[0].get("book", ""), refs[0].get("chapter", ""), refs[0].get("pages") or ""
    return row  # type: ignore[return-value]


def write_templates(subject_data: dict[str, Any], out_dir: Path, *, force: bool = False) -> dict[str, int]:
    """Write the four CSV files into ``out_dir``. Returns the number of data rows per file.

    Refuses to overwrite a file that already exists unless ``force`` is set, so a
    filled-in sheet is never replaced by accident."""
    out_dir.mkdir(parents=True, exist_ok=True)
    existing = [name for name in FILES if (out_dir / name).exists()]
    if existing and not force:
        raise FileExistsError(
            f"{', '.join(existing)} already exist in {out_dir}. Use another folder, or --force to replace them."
        )
    index = TopicIndex(subject_data.get("tree") or [])
    concepts: list[dict[str, Any]] = []
    versions: list[list[Any]] = []
    mcqs: list[list[Any]] = []
    pyqs: list[list[Any]] = []
    for leaf in index.leaves:
        title = str(leaf.get("title") or "")
        existing_concepts = [c for c in leaf.get("concepts") or [] if isinstance(c, dict)]
        if existing_concepts:
            for concept in existing_concepts:
                concepts.append(_concept_row(title, concept))
                versions.append([title, concept.get("title", ""), "STANDARD", "TEXT", "ORIGINAL", "", "", "", ""])
        else:
            items = [i for i in leaf.get("concept_checklist") or [] if isinstance(i, str) and i.strip()]
            for item in items:
                concepts.append(_concept_row(title, {"title": item}))
            if not items:
                concepts.append(_concept_row(title, None))
            versions.append([title] + [""] * (len(VERSION_COLUMNS) - 1))
        mcqs.append([title] + [""] * (len(MCQ_COLUMNS) - 1))
        pyqs.append([title] + [""] * (len(PYQ_COLUMNS) - 1))
    _write_csv(out_dir / "concepts.csv", CONCEPT_COLUMNS, [[r.get(c, "") for c in CONCEPT_COLUMNS] for r in concepts])
    _write_csv(out_dir / "versions.csv", VERSION_COLUMNS, versions)
    _write_csv(out_dir / "mcqs.csv", MCQ_COLUMNS, mcqs)
    _write_csv(out_dir / "pyqs.csv", PYQ_COLUMNS, pyqs)
    return {"concepts.csv": len(concepts), "versions.csv": len(versions), "mcqs.csv": len(mcqs), "pyqs.csv": len(pyqs)}


# --- build -----------------------------------------------------------------


@dataclass
class BuildResult:
    data: dict[str, Any]
    problems: list[str] = field(default_factory=list)  # rows that could not be used
    notes: list[str] = field(default_factory=list)  # things worth knowing, not wrong
    counts: dict[str, int] = field(default_factory=dict)


def _read_rows(path: Path, columns: list[str], result: BuildResult) -> Optional[list[tuple[int, dict[str, str]]]]:
    """Rows as ``(spreadsheet row number, {column: text})``; None when the file is unusable."""
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.reader(fh)
        try:
            header = next(reader)
        except StopIteration:
            result.problems.append(f"{path.name}: the file is empty (it needs the header row from the template).")
            return None
        names = [re.sub(r"\s+", "_", h.strip().lower()) for h in header]
        required = {"topic_title"}
        required |= {"concept_title"} if path.name in ("concepts.csv", "versions.csv") else set()
        required |= {"question_text"} if path.name in ("mcqs.csv", "pyqs.csv") else set()
        missing = [c for c in sorted(required) if c not in names]
        if missing:
            result.problems.append(
                f"{path.name}, row 1: the column(s) {', '.join(missing)} are missing. Start from the template and do not rename the headings."
            )
            return None
        rows = []
        for number, record in enumerate(reader, start=2):
            if not any(cell.strip() for cell in record):
                continue
            rows.append((number, {names[i]: (record[i].strip() if i < len(record) else "") for i in range(len(names))}))
        return rows


def _whole_number(text: str) -> Optional[int]:
    try:
        value = float(text)
    except ValueError:
        return None
    return int(value) if value == int(value) and value >= 0 else None


def _choice(text: str, allowed: list[str]) -> Optional[str]:
    value = re.sub(r"[\s-]+", "_", text.strip()).upper()
    return value if value in allowed else None


def build_from_dir(subject_data: dict[str, Any], in_dir: Path) -> BuildResult:
    """Merge the filled CSV files in ``in_dir`` into a copy of ``subject_data``."""
    result = BuildResult(data=copy.deepcopy(subject_data))
    index = TopicIndex(result.data.get("tree") or [])
    books = {b.get("slug"): b for b in result.data.get("books") or [] if isinstance(b, dict)}
    handlers: dict[str, Callable[..., None]] = {
        "concepts.csv": _merge_concepts,
        "versions.csv": _merge_versions,
        "mcqs.csv": _merge_mcqs,
        "pyqs.csv": _merge_pyqs,
    }
    for name, columns in FILES.items():
        path = in_dir / name
        if not path.exists():
            result.notes.append(f"{name} was not found in {in_dir}; skipped.")
            continue
        rows = _read_rows(path, columns, result)
        if rows is None:
            continue
        added = handlers[name](name, rows, index, result, books) or 0
        result.counts[name] = added
    return result


def _topic(name: str, number: int, row: dict[str, str], index: TopicIndex, result: BuildResult) -> Optional[dict[str, Any]]:
    leaf, why = index.find(row.get("topic_title", ""))
    if leaf is None:
        result.problems.append(f"{name}, row {number}: {why}")
    return leaf


def _merge_concepts(name: str, rows, index: TopicIndex, result: BuildResult, books: dict[str, Any]) -> int:
    added = 0
    seen: dict[tuple[int, str], int] = {}
    for number, row in rows:
        title = row.get("concept_title", "")
        key_points = [row[c] for c in (f"key_point_{i}" for i in range(1, MAX_KEY_POINTS + 1)) if row.get(c)]
        misconceptions = [row[c] for c in (f"misconception_{i}" for i in range(1, MAX_MISCONCEPTIONS + 1)) if row.get(c)]
        if not key_points and not misconceptions:
            continue  # prefilled title only: not written yet
        leaf = _topic(name, number, row, index, result)
        if leaf is None:
            continue
        if not title:
            result.problems.append(f"{name}, row {number}: the concept has key points but no concept_title.")
            continue
        if not 2 <= len(key_points) <= MAX_KEY_POINTS:
            result.problems.append(
                f'{name}, row {number}: concept "{title}" has {len(key_points)} key point(s); it needs 2 to {MAX_KEY_POINTS}.'
            )
            continue
        dup_key = (id(leaf), normalise_title(title))
        if dup_key in seen:
            result.problems.append(
                f'{name}, row {number}: concept "{title}" is already on row {seen[dup_key]} for the same topic.'
            )
            continue
        ref = None
        slug = row.get("book_slug", "")
        if slug or row.get("chapter") or row.get("pages"):
            chapter = _whole_number(row.get("chapter", ""))
            chapters = {c.get("number") for c in (books.get(slug) or {}).get("chapters") or [] if isinstance(c, dict)}
            if slug not in books:
                result.problems.append(
                    f'{name}, row {number}: book_slug "{slug}" is not listed under "books" in the subject file. Add the book first.'
                )
                continue
            if chapter is None or chapter not in chapters:
                result.problems.append(
                    f'{name}, row {number}: chapter "{row.get("chapter", "")}" is not a chapter number of book "{slug}".'
                )
                continue
            ref = {"book": slug, "chapter": chapter, "pages": row.get("pages") or None}
        seen[dup_key] = number
        concepts = leaf.setdefault("concepts", [])
        concept = next((c for c in concepts if normalise_title(c.get("title")) == normalise_title(title)), None)
        if concept is None:
            concept = {"title": title}
            concepts.append(concept)
        concept["key_points"] = key_points
        if misconceptions:
            concept["misconceptions"] = misconceptions
        if ref:
            refs = [r for r in concept.get("book_refs") or [] if (r.get("book"), r.get("chapter")) != (ref["book"], ref["chapter"])]
            concept["book_refs"] = refs + [ref]
        added += 1
    return added


def _merge_versions(name: str, rows, index: TopicIndex, result: BuildResult, books: dict[str, Any]) -> int:
    added = 0
    seen: set[tuple[int, str, str, str, str]] = set()
    for number, row in rows:
        title, text, video = row.get("title", ""), row.get("text", ""), row.get("video_url", "")
        if not (title or text or video or row.get("duration_minutes")):
            continue  # prefilled defaults only: not written yet
        leaf = _topic(name, number, row, index, result)
        if leaf is None:
            continue
        concept_title = row.get("concept_title", "")
        concept = next(
            (c for c in leaf.get("concepts") or [] if normalise_title(c.get("title")) == normalise_title(concept_title)), None
        )
        if concept is None:
            result.problems.append(
                f'{name}, row {number}: topic "{leaf["title"]}" has no concept titled "{concept_title}". '
                "Add the concept in concepts.csv (with its key points) first."
            )
            continue
        values = {}
        bad = False
        for column, allowed in (("level", _LEVELS), ("style", _STYLES), ("source", _SOURCES)):
            choice = _choice(row.get(column, ""), allowed)
            if choice is None:
                result.problems.append(f'{name}, row {number}: {column} "{row.get(column, "")}" must be one of {", ".join(allowed)}.')
                bad = True
            values[column] = choice
        if bad:
            continue
        if not title:
            result.problems.append(f"{name}, row {number}: the version needs a title (the heading students see).")
            continue
        if not text and not video:
            result.problems.append(f"{name}, row {number}: the version needs text, a video_url, or both.")
            continue
        if video and not video.lower().startswith(("http://", "https://")):
            result.problems.append(f'{name}, row {number}: video_url "{video}" must start with http:// or https://.')
            continue
        minutes = None
        if row.get("duration_minutes"):
            minutes = _whole_number(row["duration_minutes"])
            if minutes is None:
                result.problems.append(f'{name}, row {number}: duration_minutes "{row["duration_minutes"]}" must be a whole number of minutes.')
                continue
        combo = (id(concept), values["level"], values["style"], values["source"], "")
        if combo in seen:
            result.problems.append(
                f'{name}, row {number}: concept "{concept_title}" already has a {values["level"]}/{values["style"]}/{values["source"]} version on an earlier row.'
            )
            continue
        seen.add(combo)
        version: dict[str, Any] = {**values, "title": title}
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        if paragraphs:
            version["blocks"] = [{"type": "para", "text": p} for p in paragraphs]
        if video:
            version["video_url"] = video
        if minutes is not None:
            version["duration_minutes"] = minutes
        versions = concept.setdefault("versions", [])
        same = [i for i, v in enumerate(versions) if (v.get("level"), v.get("style"), v.get("source")) == (values["level"], values["style"], values["source"])]
        if same:
            versions[same[0]] = version
        else:
            versions.append(version)
        added += 1
    return added


def _merge_mcqs(name: str, rows, index: TopicIndex, result: BuildResult, books: dict[str, Any]) -> int:
    added = 0
    for number, row in rows:
        if not any(v for k, v in row.items() if k != "topic_title"):
            continue
        leaf = _topic(name, number, row, index, result)
        if leaf is None:
            continue
        text = row.get("question_text", "")
        if not text:
            result.problems.append(f"{name}, row {number}: the question_text is empty.")
            continue
        options = [row.get(f"option_{c}", "") for c in "abcd"]
        empty = [c.upper() for c, o in zip("abcd", options) if not o]
        if empty:
            result.problems.append(f"{name}, row {number}: option {', '.join(empty)} is empty. Every question needs four options.")
            continue
        correct = row.get("correct_option", "").strip().upper()
        if correct not in ("A", "B", "C", "D"):
            what = "is empty" if not correct else f'"{row.get("correct_option", "")}" is not A, B, C or D'
            result.problems.append(f"{name}, row {number}: the correct_option {what}.")
            continue
        qtype = _choice(row.get("question_type", ""), _QTYPES) if row.get("question_type") else "FACTUAL"
        if qtype is None:
            result.problems.append(f'{name}, row {number}: question_type "{row["question_type"]}" must be one of {", ".join(_QTYPES)} (or left empty).')
            continue
        mcqs = leaf.setdefault("mcq_questions", [])
        if normalise_question(text) in {normalise_question(m.get("question_text")) for m in mcqs}:
            result.notes.append(f'{name}, row {number}: skipped, the topic "{leaf["title"]}" already has this question.')
            continue
        order = max([m.get("display_order") or 0 for m in mcqs] + [len(mcqs)]) + 1
        mcqs.append(
            {
                "question_text": text,
                "options": [{"label": lab, "text": o} for lab, o in zip("ABCD", options)],
                "correct_option": correct,
                "explanation": row.get("explanation", ""),
                "question_type": qtype,
                "display_order": order,
            }
        )
        added += 1
    return added


def _merge_pyqs(name: str, rows, index: TopicIndex, result: BuildResult, books: dict[str, Any]) -> int:
    added = 0
    for number, row in rows:
        if not any(v for k, v in row.items() if k != "topic_title"):
            continue
        leaf = _topic(name, number, row, index, result)
        if leaf is None:
            continue
        exam = _choice(row.get("exam_type", ""), _EXAMS)
        if exam is None:
            result.problems.append(f'{name}, row {number}: exam_type "{row.get("exam_type", "")}" must be PRELIMS or MAINS.')
            continue
        if not row.get("question_text"):
            result.problems.append(f"{name}, row {number}: the question_text is empty.")
            continue
        year = _whole_number(row.get("year", ""))
        if year is None or not 1950 <= year <= 2100:
            result.problems.append(f'{name}, row {number}: year "{row.get("year", "")}" must be a four-digit year such as 2021.')
            continue
        marks = None
        if row.get("marks"):
            marks = _whole_number(row["marks"])
            if marks is None:
                result.problems.append(f'{name}, row {number}: marks "{row["marks"]}" must be a whole number.')
                continue
        qtype = None
        if row.get("question_type"):
            qtype = _choice(row["question_type"], _QTYPES)
            if qtype is None:
                result.problems.append(f'{name}, row {number}: question_type "{row["question_type"]}" must be one of {", ".join(_QTYPES)} (or left empty).')
                continue
        pyqs = leaf.setdefault("pyqs", [])
        if any(normalise_question(p.get("question_text")) == normalise_question(row["question_text"]) and p.get("year") == year for p in pyqs):
            result.notes.append(f'{name}, row {number}: skipped, the topic "{leaf["title"]}" already has this PYQ for {year}.')
            continue
        pyqs.append(
            {
                "exam_type": exam,
                "year": year,
                "question_text": row["question_text"],
                "answer_text": row.get("answer_text") or None,
                "explanation": row.get("explanation") or None,
                "marks": marks,
                "question_type": qtype,
            }
        )
        added += 1
    return added


# --- CLI -------------------------------------------------------------------


def _load(path: str) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _cmd_template(args: argparse.Namespace) -> int:
    try:
        counts = write_templates(_load(args.subject_file), Path(args.out_dir), force=args.force)
    except FileExistsError as exc:
        print(exc)
        return 1
    for name, n in counts.items():
        print(f"  {name}: {n} rows")
    index = TopicIndex(_load(args.subject_file).get("tree") or [])
    for title in sorted({t for t in index.titles if index.titles.count(t) > 1}):
        print(f'note: more than one topic is titled "{title}". Rename one in the subject file, or rows for it cannot be matched.')
    print(f"Wrote 4 files to {args.out_dir}. Import each into Google Sheets, fill them in, then export each as CSV.")
    return 0


def _cmd_build(args: argparse.Namespace) -> int:
    if Path(args.out).resolve() == Path(args.subject_file).resolve():
        print("--out must be a different file from --subject-file: the original is never overwritten.")
        return 1
    result = build_from_dir(_load(args.subject_file), Path(args.in_dir))
    for note in result.notes:
        print(f"note: {note}")
    for name, n in result.counts.items():
        print(f"{name}: {n} row(s) merged")
    if result.problems:
        print(f"\n{len(result.problems)} row(s) need fixing before the file can be built:")
        for problem in result.problems:
            print(f"  - {problem}")
    report = check_subject_content(result.data)
    print("\n" + format_report(report))
    if result.problems:
        print("\nNothing was written. Fix the rows above in the sheet, export again and re-run.")
        return 1
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result.data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote {out}.")
    return 0 if report.ok_to_import else 1


def main(argv: Optional[list[str]] = None) -> int:  # pragma: no cover - thin CLI wrapper
    parser = argparse.ArgumentParser(prog="python -m app.core.gs_lms.sheets", description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    t = sub.add_parser("template", help="Write blank-but-prefilled CSV files for the team.")
    t.add_argument("--subject-file", required=True)
    t.add_argument("--out-dir", required=True)
    t.add_argument("--force", action="store_true", help="Replace files that already exist.")
    t.set_defaults(handler=_cmd_template)
    b = sub.add_parser("build", help="Merge filled CSV files into a copy of the subject JSON and check it.")
    b.add_argument("--subject-file", required=True)
    b.add_argument("--in-dir", required=True)
    b.add_argument("--out", required=True)
    b.set_defaults(handler=_cmd_build)
    args = parser.parse_args(argv)
    return args.handler(args)


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
