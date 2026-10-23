"""Tests for the Eduecosystem -> retention JSON converter.

Everything runs on small in-memory / tmp_path fixtures; the real external repos
(eduecosystem_v2.db, eduecosystem-frontend) are NOT required.
"""

from __future__ import annotations

import collections
import importlib.util
import json
import sqlite3
import sys
from pathlib import Path

import pytest

_SCRIPT_DIR = Path(__file__).resolve().parents[2] / "scripts" / "eduecosystem_import"


def _load(name: str):
    sys.path.insert(0, str(_SCRIPT_DIR))
    try:
        spec = importlib.util.spec_from_file_location(f"eduimport_{name}", _SCRIPT_DIR / f"{name}.py")
        mod = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = mod
        spec.loader.exec_module(mod)
        return mod
    finally:
        sys.path.remove(str(_SCRIPT_DIR))


C = _load("convert")
T = sys.modules.get("tsparse") or _load("tsparse")

OPTS = ["Alpha", "Beta", "Gamma", "Delta"]


_DEFAULT = object()


def raw(text="Which river is the longest in India?", options=None, answer=_DEFAULT, explanation="", **kw) -> "C.Raw":
    return C.Raw(
        text=text,
        options=list(options or OPTS),
        answer={"text": "Beta"} if answer is _DEFAULT else answer,
        explanation=explanation,
        subject=kw.pop("subject", "geography"),
        **kw,
    )


LONG_EXPL = "The Ganga is the longest river within India, rising at Gangotri and flowing east to the Bay of Bengal."


# --------------------------------------------------------------------------- normalisation / ids


def test_normalise_ignores_case_punctuation_and_quotes():
    assert C.normalise("Which  of the  “following”  is TRUE?") == C.normalise("which of the 'following' is true")
    assert C.normalise("A\r\nB") == "a b"


def test_normalise_keeps_operators_distinct():
    assert C.normalise("Fiscal Deficit - Interest") == C.normalise("Fiscal Deficit Interest")
    assert C.normalise("Fiscal Deficit + Interest") != C.normalise("Fiscal Deficit - Interest")


def test_question_id_is_stable_and_text_based():
    a = C.question_id("What is X?")
    assert a == C.question_id("  what is   x ")
    assert a != C.question_id("What is Y?")
    assert a.startswith("ee_") and len(a) == 19


def test_dedupe_merges_same_text_and_prefers_pyq():
    mcq = raw(explanation=LONG_EXPL, ordinal=0, chapter=3, book="Spectrum", bank_title="CH3")
    pyq = raw(text="which river is the LONGEST in india", explanation=LONG_EXPL, is_pyq=True, year=2019, origin="ts-pyq", ordinal=1)
    recs, stats = C.process([mcq, pyq])
    assert len(recs["geography"]) == 1
    rec = recs["geography"][0]
    assert rec["is_pyq"] is True and rec["pyq"] == {"exam": "PRELIMS", "year": 2019}
    # gaps are filled from the duplicate
    assert rec["source_ref"]["chapter"] == 3 and rec["source_ref"]["book"] == "Spectrum"
    st = stats["geography"]
    assert (st["input_rows"], st["unique"], st["duplicates_removed"], st["kept"], st["pyqs"]) == (2, 1, 1, 1, 1)


def test_dedupe_keeps_valid_copy_over_invalid_copy():
    bad = raw(answer={"text": "Nope"}, ordinal=0)
    good = raw(explanation=LONG_EXPL, ordinal=1)
    recs, stats = C.process([bad, good])
    assert len(recs["geography"]) == 1
    assert not stats["geography"]["dropped"]


# --------------------------------------------------------------------------- answer mapping


@pytest.mark.parametrize(
    "answer,expected",
    [
        ({"text": "Gamma"}, 2),
        ({"text": "  gamma. "}, 2),
        ({"index": 3}, 3),
        ({"text": "B"}, 1),
        ({"text": "(c)"}, 2),
        ({"text": "Option D"}, 3),
        ({"letter": "A", "text": "a"}, 0),
        (None, None),
        ({"text": ""}, None),
    ],
)
def test_resolve_answer_text_index_letter(answer, expected):
    assert C.resolve_answer(OPTS, answer) == expected


def test_resolve_answer_text_beats_letter_when_option_is_a_letter():
    # option texts that are themselves letters: exact text match wins
    assert C.resolve_answer(["D", "C", "B", "A"], {"text": "A"}) == 3


@pytest.mark.parametrize("answer,reason", [({"index": 4}, "answer_index_out_of_range"), ({"index": -1}, "answer_index_out_of_range"), ({"text": "Omega"}, "answer_not_in_options")])
def test_resolve_answer_errors(answer, reason):
    with pytest.raises(C.Dropped) as e:
        C.resolve_answer(OPTS, answer)
    assert e.value.reason == reason


def test_embedded_option_labels_are_stripped_and_answer_mapped():
    opts = ["(a) It is void", "(b) It remains valid", "(c) It lapses", "(d) It is re-passed"]
    cand = C.validate(raw(options=opts, answer={"text": "(b) It remains valid"}))
    assert cand.valid and cand.options[1] == "It remains valid" and cand.idx == 1


def test_answer_recovered_from_ts_index_when_db_answer_is_empty():
    r = raw(answer=None, explanation=LONG_EXPL)
    rec_index = {C.normalise(r.text): ["Gamma"]}
    cand = C.validate(r, rec_index)
    assert cand.valid and cand.idx == 2 and cand.recovered
    assert C.validate(raw(answer=None, explanation=LONG_EXPL)).reason == "no_answer"


# --------------------------------------------------------------------------- rebalancing


def _stem(i):
    return f"Synthetic question number {i} about topic {i % 7}?"


def test_rebalance_is_deterministic_and_keeps_correct_answer():
    for i in range(200):
        opts = [f"opt {i} w", f"opt {i} x", f"opt {i} y", f"opt {i} z"]
        correct = i % 4
        a = C.rebalance_options(_stem(i), opts, correct)
        b = C.rebalance_options(_stem(i), opts, correct)
        assert a == b
        new_opts, new_idx = a
        assert sorted(new_opts) == sorted(opts)
        assert new_opts[new_idx] == opts[correct]


def test_rebalance_flattens_strong_position_bias():
    before, after = collections.Counter(), collections.Counter()
    for i in range(1200):
        opts = [f"a{i}", f"b{i}", f"c{i}", f"d{i}"]
        before[1] += 1  # 100% of answers at index 1 (B)
        _, idx = C.rebalance_options(_stem(i), opts, 1)
        after[idx] += 1
    for pos in range(4):
        assert 0.19 < after[pos] / 1200 < 0.31


def test_rebalance_does_not_touch_order_dependent_options():
    for opts in (
        ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
        ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        ["Only one", "Only two", "Only three", "All four"],
        ["Delhi", "Mumbai", "Both of the above", "None of the above"],
        ["Both A and R are true and R explains A", "Both true, R does not explain A", "A true, R false", "A false, R true"],
        ["5", "7", "9", "11"],
        ["A-B-C-D", "B-A-C-D", "C-B-A-D", "D-C-B-A"],
    ):
        assert C.rebalance_options("whatever stem", opts, 2) == (opts, 2), opts


def test_rebalance_end_to_end_label_matches_text():
    r = raw(options=["Alpha", "Beta", "Gamma", "Delta"], answer={"text": "Delta"}, explanation=LONG_EXPL)
    recs, stats = C.process([r])
    rec = recs["geography"][0]
    chosen = next(o for o in rec["options"] if o["label"] == rec["correct_option"])
    assert chosen["text"] == "Delta"
    assert [o["label"] for o in rec["options"]] == ["A", "B", "C", "D"]
    assert stats["geography"]["answer_before"]["D"] == 1 and sum(stats["geography"]["answer_after"].values()) == 1


# --------------------------------------------------------------------------- drop rules


@pytest.mark.parametrize(
    "kwargs,reason",
    [
        (dict(text="Placeholder question for Geomorphology topic ID 1. (Actual question to be injected)"), "placeholder"),
        (dict(text="Who? A) x B) y C) z D) w Answer: B | Explanation: because"), "parse_dump"),
        (dict(text="Q61. Who was the first President?"), "parse_dump"),
        (dict(options=["a", "b", "c"], answer={"text": "a"}), "options_count_not_4"),
        (dict(options=["a", "b", "c", "d", "e"], answer={"text": "a"}), "options_count_not_4"),
        (dict(options=["Same", "same.", "Other", "Another"], answer={"text": "Other"}), "duplicate_options"),
        (dict(answer={"text": "Missing"}), "answer_not_in_options"),
        (dict(answer={"index": 7}), "answer_index_out_of_range"),
        (dict(text=""), "empty_text"),
        (dict(options=["a", "", "c", "d"], answer={"text": "a"}), "empty_option"),
        (
            dict(
                text="Which of the statements given above is/are correct?",
                options=["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"],
                answer={"index": 0},
            ),
            "broken_statement_stem",
        ),
        (
            dict(
                text="Consider the following regarding trade:",
                options=["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
                answer={"index": 2},
            ),
            "broken_statement_stem",
        ),
    ],
)
def test_drop_rules(kwargs, reason):
    cand = C.validate(raw(**kwargs))
    assert cand.reason == reason


def test_statement_question_with_numbered_statements_is_kept():
    text = "Consider the following statements:\n1. Ganga rises at Gangotri.\n2. Yamuna joins at Prayag.\nWhich of the statements given above is/are correct?"
    cand = C.validate(raw(text=text, options=["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"], answer={"index": 2}))
    assert cand.valid and cand.idx == 2


def test_numeric_value_options_are_not_mistaken_for_statement_codes():
    cand = C.validate(raw(text="What fraction of the Council is elected by graduates?", options=["1/3", "1/6", "1/12", "1/4"], answer={"text": "1/6"}))
    assert cand.valid


def test_drop_reasons_are_counted_in_stats():
    rows = [
        raw(text="Placeholder question one", ordinal=0),
        raw(text="Second question about rivers?", options=["a", "b", "c"], answer={"text": "a"}, ordinal=1),
        raw(text="Third question about lakes?", explanation=LONG_EXPL, ordinal=2),
    ]
    recs, stats = C.process(rows)
    st = stats["geography"]
    assert st["dropped"] == {"placeholder": 1, "options_count_not_4": 1}
    assert st["kept"] == 1 and st["unique"] == 3 and len(recs["geography"]) == 1


# --------------------------------------------------------------------------- explanation quality


@pytest.mark.parametrize(
    "expl,correct,quality",
    [
        ("", "Beta", "missing"),
        ("   ", "Beta", "missing"),
        ("Explanation coming soon.", "Beta", "missing"),
        ("Answer to be updated.", "Beta", "missing"),
        ("Beta", "Beta", "missing"),
        ("The correct answer is Beta.", "Beta", "missing"),
        ("Too short.", "Beta", "missing"),
        ("Rises at Gangotri in the Himalaya.", "Beta", "short"),
        (LONG_EXPL, "Beta", "ok"),
    ],
)
def test_explanation_quality(expl, correct, quality):
    q, stored = C.explanation_quality(expl, correct)
    assert q == quality
    if quality == "missing":
        assert stored == ""


def test_missing_explanation_question_is_kept_but_flagged():
    recs, _ = C.process([raw(explanation="Explanation coming soon.")])
    rec = recs["geography"][0]
    assert rec["explanation_quality"] == "missing" and rec["explanation"] == ""
    assert rec["answer_status"] == "ok"


# --------------------------------------------------------------------------- type inference & misc


@pytest.mark.parametrize(
    "text,options,expected",
    [
        ("Consider the following statements:\n1. A is true.\n2. B is true.\nWhich of the statements given above is/are correct?", [], "STATEMENT_BASED"),
        ("Consider the following pairs:\nRiver : Origin\n1. Ganga : Gangotri", [], "MATCH_THE_FOLLOWING"),
        ("Match List-I with List-II and select the correct answer", [], "MATCH_THE_FOLLOWING"),
        ("Assertion (A): X is true. Reason (R): Y is true.", [], "ASSERTION_REASON"),
        ("Statement-I: A. Statement-II: B. Which one is correct?", [], "ASSERTION_REASON"),
        ("Arrange the following events in chronological order:\n1. A\n2. B\n3. C", [], "CHRONOLOGICAL"),
        ("Which is the correct sequence of the following?", [], "CHRONOLOGICAL"),
        ("Arrange the following rivers from north to south", [], "MAP_BASED"),
        ("Which of the following cities is located on the Yamuna?", [], "MAP_BASED"),
        ("Inflation rises because of supply shocks. Which is the main reason?", [], "CAUSE_EFFECT"),
        ("The Green Revolution began in which decade?", [], "FACTUAL"),
        ("Consider the following:\n1. Ganga\n2. Yamuna\nWhich of these are rivers?", ["1 and 2 only", "2 only", "1 only", "None"], "STATEMENT_BASED"),
    ],
)
def test_infer_question_type(text, options, expected):
    assert C.infer_question_type(text, options) == expected


@pytest.mark.parametrize("raw_value,expected", [("Easy", "easy"), ("Moderate", "medium"), ("tough", "hard"), ("hard", "hard"), (None, None), ("weird", None)])
def test_difficulty_normalisation(raw_value, expected):
    assert C.normalise_difficulty(raw_value) == expected


def test_repo_relative_path_and_book_chapter_guesses():
    rel = C.to_repo_rel(r"D:\Graphology\Master Software\Eduecosystem\frontend\src\components\batch1\polity\data\mcqs\chapter12-mcqs.ts")
    assert rel == "frontend/src/components/batch1/polity/data/mcqs/chapter12-mcqs.ts" or rel.startswith("frontend/src/components/batch1/polity")
    assert "\\" not in rel and ":" not in rel
    assert C.subject_from_path(rel) == "polity-governance"
    assert C.chapter_from(rel, "CHAPTER_12_MCQS") == 12
    rel2 = "frontend/src/components/batch1/polity/data/chapter67-mcqs.ts"
    assert C.book_from(rel2, "CHAPTER_67_MCQS", "polity-governance") == "Laxmikanth"
    assert C.book_from("frontend/src/components/batch1/polity/data/day3-mcqs.ts", "DAY3_MCQS", "polity-governance") is None
    assert C.book_from("frontend/src/components/batch1/history/data/modern/chapter3/index.ts", "MODERN_CHAPTER_3_MCQS", "history") == "Spectrum"
    assert C.book_from("frontend/src/components/batch1/history/data/mcqs/ancient/chapter3-data.ts", "CH3_L1_MCQS", "history") == "RS Sharma"
    assert C.book_from(None, "Medieval History, Chapter 5: The Age of Conflict", "history") == "Satish Chandra"
    assert C.book_from("frontend/src/components/batch1/geography/data/mcqs/ncert-class11-physical.ts", "x", "geography") == "NCERT Class 11 Geography"
    assert C.book_from("frontend/src/components/batch1/geography/data/savinder-singh-data.ts", "x", "geography") == "Savindra Singh"


# --------------------------------------------------------------------------- economy PYQs


def test_economy_pyq_with_placeholder_answer_is_kept_but_unverified():
    r = C.Raw(
        text="Consider the following statements:\nStatement-I : A holds.\nStatement-II : B holds.\nWhich one of the following is correct?",
        options=[
            "Both Statement-I and Statement-II are correct and Statement-II explains Statement-I",
            "Both Statement-I and Statement-II are correct, but Statement-II does not explain Statement-I",
            "Statement-I is correct, but Statement-II is incorrect",
            "Statement-I is incorrect, but Statement-II is correct",
        ],
        answer={"index": 0},
        explanation="Answer to be updated.",
        subject="economy",
        is_pyq=True,
        year=2024,
        from_pyq_file=True,
        origin="ts-pyq",
    )
    recs, stats = C.process([r])
    rec = recs["economy"][0]
    assert rec["correct_option"] is None
    assert rec["answer_status"] == "unverified"
    assert rec["explanation_quality"] == "missing" and rec["explanation"] == ""
    assert rec["is_pyq"] and rec["pyq"]["year"] == 2024
    assert stats["economy"]["unverified"] == 1 and not stats["economy"]["answer_after"]
    # options are order dependent and must not be shuffled
    assert [o["text"] for o in rec["options"]] == r.options


def test_unverified_economy_pyq_adopts_answer_from_duplicate_mcq():
    pyq = raw(subject="economy", answer={"index": 0}, explanation="Answer to be updated.", is_pyq=True, year=2021, from_pyq_file=True, origin="ts-pyq", ordinal=0)
    mcq = raw(subject="economy", answer={"text": "Gamma"}, explanation=LONG_EXPL, ordinal=1)
    recs, _ = C.process([pyq, mcq])
    rec = recs["economy"][0]
    assert rec["is_pyq"] and rec["answer_status"] == "ok"
    assert next(o for o in rec["options"] if o["label"] == rec["correct_option"])["text"] == "Gamma"


# --------------------------------------------------------------------------- TS extraction


TS_SAMPLE = r"""
import { PYQQuestion } from '@/lib/pyq/pyq-types';
export const SAMPLE_PYQS: PYQQuestion[] = [
    // 2024
    {
        id: 'cse_2024_1',
        year: 2024,
        subject: 'Polity',
        question: "How many \"Delimitation\" Commissions have been constituted?\n1. First\n2. Second",
        options: ["One", 'Two', `Three`, "Four"],
        correctIndex: 3,
        explanation: 'It was ' + 'four.',
        exam: 'CSE Prelims', difficulty: 'Moderate'
    },
    {
        id: 'x2',
        question: 'Letter style?',
        options: [{ label: 'A', text: 'p', isCorrect: false }, { label: 'B', text: 'q', isCorrect: true }, { label: 'C', text: 'r' }, { label: 'D', text: 's' }],
        answer: 'B',
        explanation: "",
    },
    { id: 'notq', title: 'flashcard', front: 'a', back: 'b' },
];
"""


def test_tsparse_extracts_questions_with_varied_answer_shapes():
    qs = T.extract_questions(TS_SAMPLE)
    assert len(qs) == 2
    q1, q2 = qs
    assert q1["question"].startswith('How many "Delimitation"') and "\n1. First" in q1["question"]
    assert q1["options"] == ["One", "Two", "Three", "Four"]
    assert q1["answer"] == {"index": 3} and q1["year"] == 2024 and q1["explanation"] == "It was four."
    assert q1["difficulty"] == "Moderate" and q1["export_name"] == "SAMPLE_PYQS"
    assert q2["options"] == ["p", "q", "r", "s"] and q2["answer"]["letter"] == "B"


# --------------------------------------------------------------------------- end to end


def _make_db(path: Path) -> None:
    c = sqlite3.connect(path)
    c.executescript(
        """
        CREATE TABLE bank_questions(id INTEGER PRIMARY KEY, text TEXT, type TEXT, options TEXT, correct_answer TEXT,
                                    explanation TEXT, tags TEXT, difficulty TEXT);
        CREATE TABLE question_banks(id INTEGER PRIMARY KEY, title TEXT, description TEXT);
        CREATE TABLE question_bank_questions(question_bank_id INTEGER, question_id INTEGER);
        CREATE TABLE users(id INTEGER PRIMARY KEY, email TEXT, password_hash TEXT);
        INSERT INTO users VALUES (1, 'secret@example.com', 'hash');
        """
    )
    desc = "Auto-imported bank containing 3 questions from frontend (D:\\G\\Eduecosystem\\frontend\\src\\components\\batch1\\polity\\data\\mcqs\\chapter12-mcqs.ts)."
    c.execute("INSERT INTO question_banks VALUES (1, 'CHAPTER_12_MCQS', ?)", (desc,))
    rows = [
        (1, "Who chaired the Drafting Committee of the Constituent Assembly?", json.dumps(["Nehru", "Ambedkar", "Patel", "Rajendra Prasad"]), "Ambedkar", LONG_EXPL, "UPSC", "easy"),
        (2, "Placeholder question for X (Actual question to be injected)", json.dumps(OPTS), "Alpha", "", "UPSC", "easy"),
        (3, "who chaired the drafting committee of the constituent assembly", json.dumps(["Patel", "Ambedkar", "Nehru", "Rajendra Prasad"]), "Ambedkar", "", "UPSC", "medium"),
    ]
    for r in rows:
        c.execute("INSERT INTO bank_questions VALUES (?,?,?,?,?,?,?,?)", (r[0], r[1], "multiple_choice", r[2], r[3], r[4], r[5], r[6]))
        c.execute("INSERT INTO question_bank_questions VALUES (1, ?)", (r[0],))
    c.commit()
    c.close()


def test_db_loader_never_reads_non_question_tables(tmp_path):
    db = tmp_path / "e.db"
    _make_db(db)
    conn = C.open_db_readonly(str(db))
    read_tables: set[str] = set()

    def authorizer(action, arg1, arg2, dbname, source):
        if action == sqlite3.SQLITE_READ and arg1:
            read_tables.add(arg1)
        return sqlite3.SQLITE_OK

    conn.set_authorizer(authorizer)
    raws = C.load_db_raws(conn)
    conn.close()
    assert read_tables <= {"bank_questions", "question_banks", "question_bank_questions"}
    assert len(raws) == 3 and raws[0].file == "frontend/src/components/batch1/polity/data/mcqs/chapter12-mcqs.ts"
    assert raws[0].chapter == 12 and raws[0].subject == "polity-governance"


def test_cli_end_to_end_with_tmp_fixtures(tmp_path, monkeypatch):
    db = tmp_path / "e.db"
    _make_db(db)
    comp = tmp_path / "fe" / "src" / "components" / "upsc" / "subjects" / "economy" / "data"
    comp.mkdir(parents=True)
    (comp / "economy-pyqs.ts").write_text(
        "export const ECONOMY_PYQS: PYQQuestion[] = [\n"
        "{ id: 'e1', year: 2023, subject: 'Economy', question: 'Which body regulates banks in India?',"
        " options: ['SEBI','RBI','IRDAI','NABARD'], correctIndex: 0, explanation: 'Answer to be updated.', exam: 'CSE Prelims' },\n"
        "];\n",
        encoding="utf-8",
    )
    out = tmp_path / "out"
    assert C.main(["--db", str(db), "--frontend-root", str(tmp_path / "fe"), "--out", str(out)]) == 0
    pol = json.loads((out / "polity-governance.json").read_text(encoding="utf-8"))
    assert pol["source"] == "eduecosystem" and pol["subject_slug"] == "polity-governance" and pol["generated_at"]
    assert len(pol["questions"]) == 1  # placeholder dropped, duplicate merged
    q = pol["questions"][0]
    assert set(q) == {
        "id", "question_text", "options", "correct_option", "explanation", "explanation_quality", "answer_status",
        "question_type", "difficulty", "source_ref", "is_pyq", "pyq",
    }
    assert next(o for o in q["options"] if o["label"] == q["correct_option"])["text"] == "Ambedkar"
    assert q["source_ref"] == {"bank_title": "CHAPTER_12_MCQS", "file": "frontend/src/components/batch1/polity/data/mcqs/chapter12-mcqs.ts", "book": "Laxmikanth", "chapter": 12}
    eco = json.loads((out / "economy.json").read_text(encoding="utf-8"))["questions"]
    assert len(eco) == 1 and eco[0]["correct_option"] is None and eco[0]["answer_status"] == "unverified"
    assert eco[0]["is_pyq"] and eco[0]["pyq"] == {"exam": "PRELIMS", "year": 2023}
    report = (out / "REPORT.md").read_text(encoding="utf-8")
    assert "polity-governance" in report and "placeholder 1" in report

    # idempotent apart from generated_at; --dry-run writes nothing; --subjects filters
    first = [q for q in pol["questions"]]
    out2 = tmp_path / "out2"
    assert C.main(["--db", str(db), "--frontend-root", str(tmp_path / "fe"), "--out", str(out2)]) == 0
    assert json.loads((out2 / "polity-governance.json").read_text(encoding="utf-8"))["questions"] == first
    out3 = tmp_path / "out3"
    assert C.main(["--db", str(db), "--frontend-root", str(tmp_path / "fe"), "--out", str(out3), "--dry-run"]) == 0
    assert not out3.exists()
    out4 = tmp_path / "out4"
    assert C.main(["--db", str(db), "--frontend-root", str(tmp_path / "fe"), "--out", str(out4), "--subjects", "economy"]) == 0
    assert sorted(p.name for p in out4.iterdir()) == ["economy.json"]


def test_large_subjects_are_split_into_parts(tmp_path, monkeypatch):
    monkeypatch.setattr(C, "MAX_FILE_BYTES", 2000)
    recs = [{"id": f"ee_{i}", "question_text": "x" * 300, "options": []} for i in range(20)]
    written = C.write_subject_files(tmp_path, "history", recs, "2026-01-01T00:00:00+00:00")
    assert len(written) > 1 and written[0][0] == "history-part1.json"
    total = 0
    for i, (name, _) in enumerate(written, 1):
        d = json.loads((tmp_path / name).read_text(encoding="utf-8"))
        assert d["part"] == i and d["parts"] == len(written)
        total += len(d["questions"])
    assert total == 20
    # re-running with a small set removes the stale parts
    C.write_subject_files(tmp_path, "history", recs[:1], "2026-01-01T00:00:00+00:00")
    assert sorted(p.name for p in tmp_path.iterdir()) == ["history.json"]
