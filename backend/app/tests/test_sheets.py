"""Spreadsheet authoring: template CSVs, merging filled rows, row-level messages."""

from __future__ import annotations

import copy
import csv
import json
import tempfile
from pathlib import Path

import pytest

from app.core.gs_lms import sheets
from app.core.gs_lms.content_check import check_subject_content
from app.core.gs_lms.importer import DEFAULT_ARTIFACT_PATH

TEMPLATE_PATH = DEFAULT_ARTIFACT_PATH.parent / "templates" / "gs_subject_template.json"
TOPIC = "Preamble — Ideals and Legal Status"
CONCEPT = "The five descriptions of the Indian state"


def _subject() -> dict:
    return json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))


def _leaf(data: dict) -> dict:
    return data["tree"][0]["children"][0]["children"][0]


def _read(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), list(reader)


def _write(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


@pytest.fixture()
def folder(tmp_path: Path) -> Path:
    out = tmp_path / "sheets"
    sheets.write_templates(_subject(), out)
    return out


def _mcq_row(**over) -> dict[str, str]:
    row = {
        "topic_title": TOPIC, "question_text": "A brand new synthetic question?",
        "option_a": "one", "option_b": "two", "option_c": "three", "option_d": "four",
        "correct_option": "c", "explanation": "Because three.", "question_type": "",
    }
    row.update(over)
    return row


# ---- template ---------------------------------------------------------------


def test_template_lists_every_leaf_topic_with_the_agreed_columns(folder: Path):
    for name, columns in sheets.FILES.items():
        header, rows = _read(folder / name)
        assert header == columns
        assert {r["topic_title"] for r in rows} == {TOPIC}
    assert sheets.FILES["concepts.csv"][:3] == ["topic_title", "concept_title", "key_point_1"]
    assert sheets.FILES["concepts.csv"][-3:] == ["book_slug", "chapter", "pages"]
    assert "misconception_3" in sheets.FILES["concepts.csv"] and "key_point_8" in sheets.FILES["concepts.csv"]


def test_template_prefills_concepts_from_the_checklist_when_there_are_none():
    data = _subject()
    leaf = _leaf(data)
    leaf.pop("concepts")
    with tempfile.TemporaryDirectory() as tmp:
        counts = sheets.write_templates(data, Path(tmp))
        _, rows = _read(Path(tmp) / "concepts.csv")
    assert counts["concepts.csv"] == len(leaf["concept_checklist"]) == len(rows)
    assert [r["concept_title"] for r in rows] == leaf["concept_checklist"]
    assert all(r["key_point_1"] == "" for r in rows)


def test_template_never_overwrites_filled_sheets(folder: Path):
    with pytest.raises(FileExistsError, match="already exist"):
        sheets.write_templates(_subject(), folder)
    sheets.write_templates(_subject(), folder, force=True)


# ---- build ------------------------------------------------------------------


def test_untouched_template_round_trips_to_a_ready_subject(folder: Path):
    original = _subject()
    result = sheets.build_from_dir(original, folder)
    assert result.problems == []
    assert check_subject_content(result.data).ready
    assert result.data["tree"] == original["tree"]  # existing concepts survive the round trip


def test_filled_rows_are_merged_and_the_output_passes_the_check(folder: Path):
    subject = _subject()
    _write(folder / "mcqs.csv", sheets.MCQ_COLUMNS, [_mcq_row()])
    _write(folder / "pyqs.csv", sheets.PYQ_COLUMNS, [{
        "topic_title": TOPIC, "exam_type": "mains", "year": "2021", "question_text": "Discuss the Preamble.",
        "answer_text": "", "explanation": "", "marks": "15", "question_type": "",
    }])
    header, rows = _read(folder / "concepts.csv")
    rows.append({**{c: "" for c in header}, "topic_title": TOPIC, "concept_title": "A new concept",
                 "key_point_1": "first point", "key_point_2": "second point", "misconception_1": "a wrong belief",
                 "book_slug": "laxmikanth-indian-polity-7e", "chapter": "1", "pages": "12-15"})
    _write(folder / "concepts.csv", header, rows)
    _write(folder / "versions.csv", sheets.VERSION_COLUMNS, [{
        "topic_title": TOPIC, "concept_title": "A new concept", "level": "basic", "style": "text", "source": "original",
        "title": "In plain words", "text": "First paragraph.\n\nSecond paragraph.", "video_url": "", "duration_minutes": "3",
    }])

    result = sheets.build_from_dir(subject, folder)
    assert result.problems == []
    leaf = _leaf(result.data)
    mcq = leaf["mcq_questions"][-1]
    assert mcq["correct_option"] == "C" and mcq["question_type"] == "FACTUAL" and mcq["display_order"] == len(leaf["mcq_questions"])
    assert leaf["pyqs"][-1]["exam_type"] == "MAINS" and leaf["pyqs"][-1]["year"] == 2021 and leaf["pyqs"][-1]["marks"] == 15
    concept = next(c for c in leaf["concepts"] if c["title"] == "A new concept")
    assert concept["book_refs"] == [{"book": "laxmikanth-indian-polity-7e", "chapter": 1, "pages": "12-15"}]
    version = concept["versions"][0]
    assert version["blocks"] == [{"type": "para", "text": "First paragraph."}, {"type": "para", "text": "Second paragraph."}]
    assert (version["level"], version["style"], version["source"], version["duration_minutes"]) == ("BASIC", "TEXT", "ORIGINAL", 3)
    report = check_subject_content(result.data)
    assert report.ok_to_import and report.ready, report.errors + report.gaps


def test_build_is_idempotent_for_the_same_filled_sheets(folder: Path):
    _write(folder / "mcqs.csv", sheets.MCQ_COLUMNS, [_mcq_row()])
    first = sheets.build_from_dir(_subject(), folder)
    again = sheets.build_from_dir(first.data, folder)
    assert again.data == first.data
    assert any("already has this question" in n for n in again.notes)


def test_problems_name_the_file_and_row_in_plain_language(folder: Path):
    _write(folder / "mcqs.csv", sheets.MCQ_COLUMNS, [
        _mcq_row(topic_title="Preamble - Ideals and Legal Statu"),  # row 2: typo in topic
        _mcq_row(correct_option=""),  # row 3
        _mcq_row(correct_option="E"),  # row 4
        _mcq_row(option_b=""),  # row 5
        _mcq_row(question_type="TRICKY"),  # row 6
    ])
    _write(folder / "pyqs.csv", sheets.PYQ_COLUMNS, [
        {"topic_title": TOPIC, "exam_type": "FINALS", "year": "2021", "question_text": "q", "answer_text": "", "explanation": "", "marks": "", "question_type": ""},
        {"topic_title": TOPIC, "exam_type": "PRELIMS", "year": "last year", "question_text": "q", "answer_text": "", "explanation": "", "marks": "", "question_type": ""},
    ])
    _write(folder / "versions.csv", sheets.VERSION_COLUMNS, [
        {"topic_title": TOPIC, "concept_title": "No such concept", "level": "BASIC", "style": "TEXT", "source": "ORIGINAL", "title": "T", "text": "x", "video_url": "", "duration_minutes": ""},
        {"topic_title": TOPIC, "concept_title": CONCEPT, "level": "EASY", "style": "TEXT", "source": "ORIGINAL", "title": "T", "text": "x", "video_url": "", "duration_minutes": ""},
        {"topic_title": TOPIC, "concept_title": CONCEPT, "level": "BASIC", "style": "VIDEO", "source": "ORIGINAL", "title": "T", "text": "", "video_url": "ftp://x", "duration_minutes": ""},
    ])
    header, rows = _read(folder / "concepts.csv")
    thin_row = len(rows) + 2  # header is row 1
    rows.append({**{c: "" for c in header}, "topic_title": TOPIC, "concept_title": "Thin", "key_point_1": "only one"})
    _write(folder / "concepts.csv", header, rows)

    problems = "\n".join(sheets.build_from_dir(_subject(), folder).problems)
    assert 'mcqs.csv, row 2: there is no topic titled "Preamble - Ideals and Legal Statu". Did you mean "Preamble' in problems
    assert "mcqs.csv, row 3: the correct_option is empty." in problems
    assert 'mcqs.csv, row 4: the correct_option "E" is not A, B, C or D.' in problems
    assert "mcqs.csv, row 5: option B is empty." in problems
    assert 'mcqs.csv, row 6: question_type "TRICKY" must be one of' in problems
    assert 'pyqs.csv, row 2: exam_type "FINALS" must be PRELIMS or MAINS.' in problems
    assert 'pyqs.csv, row 3: year "last year" must be a four-digit year' in problems
    assert 'versions.csv, row 2: topic "Preamble — Ideals and Legal Status" has no concept titled "No such concept"' in problems
    assert 'versions.csv, row 3: level "EASY" must be one of BASIC, STANDARD, ADVANCED.' in problems
    assert "versions.csv, row 4: video_url" in problems
    assert f'concepts.csv, row {thin_row}: concept "Thin" has 1 key point(s); it needs 2 to 8.' in problems


def test_a_sheet_with_renamed_headings_is_reported_not_crashed(folder: Path):
    (folder / "mcqs.csv").write_text("topic,question\nx,y\n", encoding="utf-8")
    result = sheets.build_from_dir(_subject(), folder)
    assert any(p.startswith("mcqs.csv, row 1:") and "topic_title" in p for p in result.problems)


def test_a_missing_sheet_is_skipped_with_a_note(folder: Path):
    (folder / "pyqs.csv").unlink()
    result = sheets.build_from_dir(_subject(), folder)
    assert result.problems == [] and any("pyqs.csv was not found" in n for n in result.notes)


# ---- CLI --------------------------------------------------------------------


def test_cli_build_never_changes_the_input_and_writes_a_copy(folder: Path, tmp_path: Path, capsys):
    subject_file = tmp_path / "subject.json"
    subject_file.write_text(json.dumps(_subject()), encoding="utf-8")
    before = subject_file.read_bytes()
    _write(folder / "mcqs.csv", sheets.MCQ_COLUMNS, [_mcq_row()])
    out = tmp_path / "out" / "new.json"

    code = sheets.main(["build", "--subject-file", str(subject_file), "--in-dir", str(folder), "--out", str(out)])
    text = capsys.readouterr().out
    assert code == 0 and out.exists()
    assert subject_file.read_bytes() == before
    assert "Topics ready" in text and "mcqs.csv: 1 row(s) merged" in text
    assert len(_leaf(json.loads(out.read_text(encoding="utf-8")))["mcq_questions"]) == len(_leaf(_subject())["mcq_questions"]) + 1


def test_cli_build_with_problems_writes_nothing_and_refuses_to_overwrite_the_input(folder: Path, tmp_path: Path, capsys):
    subject_file = tmp_path / "subject.json"
    subject_file.write_text(json.dumps(_subject()), encoding="utf-8")
    _write(folder / "mcqs.csv", sheets.MCQ_COLUMNS, [_mcq_row(correct_option="")])
    out = tmp_path / "new.json"
    assert sheets.main(["build", "--subject-file", str(subject_file), "--in-dir", str(folder), "--out", str(out)]) == 1
    assert not out.exists() and "mcqs.csv, row 2" in capsys.readouterr().out
    assert sheets.main(["build", "--subject-file", str(subject_file), "--in-dir", str(folder), "--out", str(subject_file)]) == 1


def test_cli_template_reports_row_counts(tmp_path: Path, capsys):
    subject_file = tmp_path / "subject.json"
    subject_file.write_text(json.dumps(_subject()), encoding="utf-8")
    assert sheets.main(["template", "--subject-file", str(subject_file), "--out-dir", str(tmp_path / "t")]) == 0
    assert "concepts.csv:" in capsys.readouterr().out
    assert sheets.main(["template", "--subject-file", str(subject_file), "--out-dir", str(tmp_path / "t")]) == 1
