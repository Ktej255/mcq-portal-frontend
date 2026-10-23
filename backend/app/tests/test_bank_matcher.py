"""Bank-to-topic matcher, the reviewed-CSV apply step and supplement merging.

Synthetic fixtures only: no question bank data is used or needed.
"""

from __future__ import annotations

import copy
import csv
import json
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms import bank_matcher as bm
from app.core.gs_lms.content_check import check_subject_content
from app.core.gs_lms.importer import DEFAULT_ARTIFACT_PATH, import_gs_subject, merge_supplement
from app.core.gs_lms.models import GsLmsMcqQuestion
from app.db.session import Base

TEMPLATE_PATH = DEFAULT_ARTIFACT_PATH.parent / "templates" / "gs_subject_template.json"

GLACIERS = "Himalayan Glaciers and Snowfields"
MONSOON = "Indian Monsoon Mechanism"
EROSION = "Soil Erosion and Conservation"


def _mcq(text: str, correct: str = "A") -> dict:
    return {
        "question_text": text,
        "options": [{"label": lab, "text": f"option {lab} of {text[:20]}"} for lab in "ABCD"],
        "correct_option": correct,
        "explanation": "Because.",
        "question_type": "FACTUAL",
    }


def _leaf(title: str, checklist: list[str], text: str, mcqs: list[dict]) -> dict:
    return {
        "title": title,
        "node_type": "LEAF_TOPIC",
        "concept_checklist": checklist,
        "content_sections": [{"section_label": "BASIC", "blocks": [{"type": "para", "text": text}]}],
        "mcq_questions": mcqs,
        "pyqs": [],
    }


def _subject() -> dict:
    return {
        "subject_slug": "geography",
        "tree": [
            {
                "title": "Physical Geography",
                "node_type": "MEGA_TOPIC",
                "children": [
                    {
                        "title": "Mountains and Climate",
                        "node_type": "SUB_TOPIC",
                        "children": [
                            _leaf(
                                GLACIERS,
                                ["Gangotri glacier is the source of the Bhagirathi", "Siachen glacier lies in the Karakoram"],
                                "Himalayan glaciers such as Gangotri, Siachen and Zemu feed rivers. Snowfields and snowline altitude decide glacier mass balance.",
                                [_mcq("Which glacier is the source of the Bhagirathi river?")],
                            ),
                            _leaf(
                                MONSOON,
                                ["Differential heating of land and sea drives the monsoon", "Inter Tropical Convergence Zone shifts north in summer"],
                                "The monsoon winds reverse seasonally. The ITCZ shifts, the jet stream withdraws and El Nino weakens rainfall.",
                                [_mcq("Which wind system brings summer rainfall to India?")],
                            ),
                            _leaf(
                                EROSION,
                                ["Gully erosion creates ravines", "Contour ploughing and terracing conserve soil"],
                                "Soil erosion by water forms rills and gullies. Terracing, contour ploughing and shelterbelts conserve soil.",
                                [],
                            ),
                        ],
                    }
                ],
            }
        ],
    }


def _bank_q(qid: str, text: str, correct: str = "A", **extra) -> dict:
    q = {
        "id": qid,
        "question_text": text,
        "options": [{"label": lab, "text": f"choice {lab} for {qid}"} for lab in "ABCD"],
        "correct_option": correct,
        "explanation": "Explained.",
        "answer_status": "ok",
        "question_type": "FACTUAL",
    }
    q.update(extra)
    return q


def _bank() -> dict:
    return {
        "subject_slug": "geography",
        "questions": [
            _bank_q("q-glacier", "Siachen is a large glacier in the Karakoram. Gangotri glacier feeds which snowfields?"),
            _bank_q("q-monsoon", "How does the shift of the ITCZ and differential heating of land and sea cause the monsoon winds?"),
            _bank_q("q-erosion", "Terracing and contour ploughing help conserve soil against gully erosion. What do gullies form?"),
            _bank_q("q-offtopic", "Who composed the national anthem of Bangladesh?"),
            _bank_q("q-dup-existing", "Which glacier is the source of the Bhagirathi river?"),
            _bank_q("q-dup-existing-2", "which GLACIER is the source of the bhagirathi river"),
            _bank_q("q-unverified", "Gully erosion on slopes forms ravines and rills.", answer_status="unverified", correct_option=None),
            _bank_q("q-bad-options", "Terracing conserves soil on hill slopes.", options=[{"label": "A", "text": "only one"}]),
        ],
    }


def _by_id(result: bm.MatchResult) -> dict[str, bm.MatchRow]:
    return {r.bank_question_id: r for r in result.rows}


# ---- matching ---------------------------------------------------------------


def test_on_topic_questions_rank_the_right_topic_and_are_suggested_for_adding():
    rows = _by_id(bm.match_bank(_subject(), _bank()))
    assert rows["q-glacier"].best_topic_title == GLACIERS
    assert rows["q-monsoon"].best_topic_title == MONSOON
    assert rows["q-erosion"].best_topic_title == EROSION
    for qid in ("q-glacier", "q-monsoon", "q-erosion"):
        assert rows[qid].suggested_action == "add", rows[qid]
        assert rows[qid].margin > 0
        assert rows[qid].second_topic_title and rows[qid].second_topic_title != rows[qid].best_topic_title


def test_off_topic_question_is_not_added():
    row = _by_id(bm.match_bank(_subject(), _bank()))["q-offtopic"]
    assert row.suggested_action == "check"
    assert row.best_score < bm.T1_SCORE


def test_duplicates_and_unusable_answers_are_skipped_with_a_reason():
    rows = _by_id(bm.match_bank(_subject(), _bank()))
    assert rows["q-dup-existing"].suggested_action == "skip"
    assert "already a question" in rows["q-dup-existing"].reason
    assert rows["q-dup-existing-2"].suggested_action == "skip"  # same text apart from case and punctuation
    assert rows["q-unverified"].suggested_action == "skip" and "unverified" in rows["q-unverified"].reason
    assert rows["q-bad-options"].suggested_action == "skip"


def test_a_repeat_inside_the_bank_is_skipped_but_the_first_copy_is_kept():
    bank = _bank()
    bank["questions"].append(copy.deepcopy(bank["questions"][0]) | {"id": "q-glacier-again"})
    rows = _by_id(bm.match_bank(_subject(), bank))
    assert rows["q-glacier"].suggested_action == "add"
    assert rows["q-glacier-again"].suggested_action == "skip"
    assert "earlier in the bank" in rows["q-glacier-again"].reason


def test_matching_is_deterministic_and_leaves_inputs_alone():
    subject, bank = _subject(), _bank()
    before = copy.deepcopy((subject, bank))
    first = [r.as_csv() for r in bm.match_bank(subject, bank).rows]
    second = [r.as_csv() for r in bm.match_bank(subject, bank).rows]
    assert first == second
    assert (subject, bank) == before


def test_csv_has_the_agreed_columns_and_an_empty_approved_column(tmp_path: Path):
    result = bm.match_bank(_subject(), _bank(), top=3)
    out = tmp_path / "m.csv"
    bm.write_matches_csv(result, out)
    with out.open(encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    assert list(rows[0].keys()) == bm.CSV_COLUMNS
    assert all(r["approved"] == "" for r in rows)
    assert all(len(r["question_preview"]) <= 120 for r in rows)
    assert {r["suggested_action"] for r in rows} <= {"add", "check", "skip"}


def test_summary_reports_counts_and_projected_totals():
    result = bm.match_bank(_subject(), _bank())
    text = bm.format_summary(result)
    assert "add: 3" in text and "skip: 4" in text
    assert f"/15  (has 1)  {GLACIERS}" in text
    assert result.projected()[GLACIERS] == 2


def test_two_topics_with_one_title_are_never_suggested_for_adding():
    subject = _subject()
    twin = copy.deepcopy(subject["tree"][0]["children"][0]["children"][0])
    subject["tree"][0]["children"][0]["children"].append(twin)
    result = bm.match_bank(subject, _bank())
    assert result.duplicate_titles == [GLACIERS]
    row = _by_id(result)["q-glacier"]
    assert row.suggested_action == "check" and "share this title" in row.reason


def test_calibration_scores_a_subjects_own_questions_without_them_leaking_into_topics():
    subject = _subject()
    sample = bm.calibrate(subject)
    assert len(sample) == 2
    assert all(isinstance(c, bool) for _, _, c in sample)
    assert "Calibration on 2 existing MCQs" in bm.format_calibration(sample)


# ---- apply ------------------------------------------------------------------


def _reviewed(tmp_path: Path, approvals: dict[str, str], bank: dict | None = None, subject: dict | None = None) -> Path:
    result = bm.match_bank(subject or _subject(), bank or _bank())
    for row in result.rows:
        row.approved = approvals.get(row.bank_question_id, "")
    path = tmp_path / "reviewed.csv"
    bm.write_matches_csv(result, path)
    return path


def test_apply_uses_only_approved_rows_and_converts_options(tmp_path: Path):
    csv_path = _reviewed(tmp_path, {"q-glacier": "yes", "q-monsoon": "Y", "q-erosion": "no"})
    supplement, problems, _ = bm.apply_reviewed_csv(csv_path, _bank(), _subject())
    assert problems == []
    assert supplement["kind"] == "mcq_supplement" and supplement["subject_slug"] == "geography"
    titles = {t["title"]: t["mcq_questions"] for t in supplement["topics"]}
    assert set(titles) == {GLACIERS, MONSOON}
    mcq = titles[GLACIERS][0]
    assert [o["label"] for o in mcq["options"]] == list("ABCD")
    assert mcq["correct_option"] == "A" and mcq["bank_id"] == "q-glacier"
    assert mcq["question_type"] == "FACTUAL" and mcq["explanation"]


def test_apply_moves_a_question_to_a_corrected_topic_and_relabels_options(tmp_path: Path):
    bank = _bank()
    odd = _bank_q("q-odd", "Gully erosion creates ravines.", correct="C")
    odd["options"] = [{"label": lab, "text": f"text {lab}"} for lab in "WXYZ"]
    odd["correct_option"] = "Y"
    bank["questions"].append(odd)
    csv_path = _reviewed(tmp_path, {"q-odd": MONSOON.lower()}, bank)  # corrected title, different case
    supplement, problems, _ = bm.apply_reviewed_csv(csv_path, bank, _subject())
    assert problems == []
    (topic,) = supplement["topics"]
    assert topic["title"] == MONSOON
    assert [o["label"] for o in topic["mcq_questions"][0]["options"]] == list("ABCD")
    assert topic["mcq_questions"][0]["correct_option"] == "C"  # Y was the third option


def test_apply_reports_bad_rows_in_plain_language_with_row_numbers(tmp_path: Path):
    csv_path = _reviewed(tmp_path, {"q-glacier": "Glaciers of Mars", "q-monsoon": "yes"})
    supplement, problems, _ = bm.apply_reviewed_csv(csv_path, _bank(), _subject())
    assert len(problems) == 1
    assert problems[0].startswith("Row 2:") and "Glaciers of Mars" in problems[0] and "no topic titled" in problems[0]

    missing_bank = {"subject_slug": "geography", "questions": []}
    _, problems, _ = bm.apply_reviewed_csv(csv_path, missing_bank, _subject())
    assert any("is not in the bank file" in p for p in problems)


def test_apply_refuses_a_csv_without_the_expected_columns(tmp_path: Path):
    path = tmp_path / "x.csv"
    path.write_text("a,b\n1,2\n", encoding="utf-8")
    _, problems, _ = bm.apply_reviewed_csv(path, _bank(), _subject())
    assert problems and "missing the column" in problems[0]


def test_apply_ignores_approved_rows_that_are_duplicates_or_unusable(tmp_path: Path):
    csv_path = _reviewed(tmp_path, {"q-dup-existing": "yes", "q-unverified": "yes", "q-bad-options": "yes", "q-glacier": "yes"})
    supplement, problems, notes = bm.apply_reviewed_csv(csv_path, _bank(), _subject())
    assert problems == []
    assert [q["bank_id"] for t in supplement["topics"] for q in t["mcq_questions"]] == ["q-glacier"]
    assert len(notes) == 3


def test_apply_never_exceeds_the_cap_and_keeps_the_best_scoring_rows(tmp_path: Path):
    subject = _subject()
    bank = {"subject_slug": "geography", "questions": []}
    for i in range(30):
        bank["questions"].append(_bank_q(f"q{i}", f"Gully erosion and terracing for soil conservation, case {i} {'ravine ' * (i % 4)}"))
    csv_path = _reviewed(tmp_path, {f"q{i}": "yes" for i in range(30)}, bank, subject)
    supplement, problems, notes = bm.apply_reviewed_csv(csv_path, bank, subject, cap=25)
    assert problems == []
    (topic,) = [t for t in supplement["topics"] if t["title"] == EROSION]
    assert len(topic["mcq_questions"]) == 25  # the topic had none
    assert sum("(the limit)" in n for n in notes) == 5

    # A topic that already has MCQs gets only the remaining room.
    subject["tree"][0]["children"][0]["children"][2]["mcq_questions"] = [_mcq(f"already {i} about soil") for i in range(20)]
    csv_path = _reviewed(tmp_path, {f"q{i}": "yes" for i in range(30)}, bank, subject)
    supplement, _, _ = bm.apply_reviewed_csv(csv_path, bank, subject, cap=25)
    (topic,) = [t for t in supplement["topics"] if t["title"] == EROSION]
    assert len(topic["mcq_questions"]) == 5


def test_apply_does_not_add_the_same_question_twice(tmp_path: Path):
    bank = _bank()
    bank["questions"].append(_bank_q("q-glacier-copy", "SIACHEN is a large glacier in the Karakoram: Gangotri glacier feeds which snowfields"))
    csv_path = _reviewed(tmp_path, {"q-glacier": "yes", "q-glacier-copy": "yes"}, bank)
    supplement, _, _ = bm.apply_reviewed_csv(csv_path, bank, _subject())
    assert sum(len(t["mcq_questions"]) for t in supplement["topics"]) == 1


# ---- supplement merge + import ----------------------------------------------


def _supplement(*, topic: str = EROSION, n: int = 2) -> dict:
    return {
        "subject_slug": "geography",
        "kind": "mcq_supplement",
        "topics": [{"title": topic, "mcq_questions": [_mcq(f"Supplement question {i} on terracing") for i in range(n)]}],
    }


def _leaf_of(data: dict, title: str) -> dict:
    return next(l for l in data["tree"][0]["children"][0]["children"] if l["title"] == title)


def test_merge_adds_questions_to_a_copy_and_is_idempotent():
    subject = _subject()
    original = copy.deepcopy(subject)
    once = merge_supplement(subject, _supplement())
    twice = merge_supplement(once, _supplement())
    assert subject == original  # input untouched
    assert len(_leaf_of(once, EROSION)["mcq_questions"]) == 2
    assert twice == once
    assert [m["display_order"] for m in _leaf_of(once, EROSION)["mcq_questions"]] == [1, 2]
    # numbering carries on after the questions a topic already has
    glaciers = _leaf_of(merge_supplement(subject, _supplement(topic=GLACIERS)), GLACIERS)["mcq_questions"]
    assert [m["display_order"] for m in glaciers[1:]] == [2, 3]


def test_merge_with_unknown_topics_raises_and_lists_every_one():
    supplement = _supplement(topic="No Such Topic")
    supplement["topics"].append({"title": "Also Missing", "mcq_questions": [_mcq("x")]})
    with pytest.raises(ValueError) as err:
        merge_supplement(_subject(), supplement)
    assert "No Such Topic" in str(err.value) and "Also Missing" in str(err.value)


def test_merge_rejects_the_wrong_kind_or_subject():
    with pytest.raises(ValueError, match="not an MCQ supplement"):
        merge_supplement(_subject(), {"topics": []})
    with pytest.raises(ValueError, match="polity-governance"):
        merge_supplement(_subject(), _supplement() | {"subject_slug": "polity-governance"})


@pytest.fixture()
def session_factory():
    engine = create_engine("sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with factory() as db:
        db.add(GsSubject(id=1, slug="polity-governance", name="Polity & Governance", display_order=1))
        db.commit()
    return factory


def test_import_with_a_supplement_is_idempotent_and_unreviewed(session_factory):
    template = json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))
    leaf = template["tree"][0]["children"][0]["children"][0]
    supplement = {
        "subject_slug": "polity-governance",
        "kind": "mcq_supplement",
        "topics": [{"title": leaf["title"], "mcq_questions": [_mcq("Extra synthetic question one"), _mcq("Extra synthetic question two", "B")]}],
    }
    with session_factory() as db:
        first = import_gs_subject(db, template, supplements=[supplement])
        db.commit()
        count_after_first = db.query(GsLmsMcqQuestion).count()
        second = import_gs_subject(db, template, supplements=[supplement])
        db.commit()
        rows = db.query(GsLmsMcqQuestion).all()
    assert count_after_first == len(rows) == len(leaf["mcq_questions"]) + 2
    assert first["subject_slug"] == "polity-governance"
    assert {r.review_status for r in rows} == {GsReviewStatusEnum.UNREVIEWED}
    assert second["subject_slug"] == "polity-governance"
    assert len(template["tree"][0]["children"][0]["children"][0]["mcq_questions"]) == len(leaf["mcq_questions"])  # input dict untouched


def test_merged_supplement_still_passes_the_checker():
    template = json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))
    title = template["tree"][0]["children"][0]["children"][0]["title"]
    merged = merge_supplement(template, _supplement(topic=title) | {"subject_slug": "polity-governance"})
    assert check_subject_content(merged).ok_to_import
