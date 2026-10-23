# Eduecosystem question import (retention checks)

One-off but repeatable converter that turns the legacy Eduecosystem question bank into
clean, per-subject JSON for UPSC Command **chapter-retention checks**. Output lives in
`backend/app/core/gs_lms/data/retention/` (one file per subject slug, plus `REPORT.md`).

## What it does

Inputs (read-only, never modified):

* `eduecosystem_v2.db` (SQLite) - only the tables `bank_questions`, `question_banks`,
  `question_bank_questions` are queried. **Nothing from the `users` table, or any other
  non-question table, is read, copied or written.** (A test enforces this with a SQLite
  authorizer.)
* The Eduecosystem frontend TypeScript data files:
  * `*pyq*.ts` files (shape `{id, year, question, options[], correctIndex, explanation, ...}`) are the
    source of **PYQs** (with year). `upsc/subjects` wins over `batch1` for the same file.
  * All other `.ts` data files are scanned only to build an *answer-recovery index*: many DB rows
    lost their `correct_answer` during the original import, the TS files still hold it.

Pipeline per row: normalise text -> drop rules -> resolve answer (text / index / letter) ->
dedupe by normalised text (PYQ copy wins, gaps are filled from duplicates) -> deterministic
option rebalancing -> classify -> write.

| Rule | Result |
|---|---|
| "Placeholder question" / "to be injected" | dropped (`placeholder`) |
| Text contains `Answer:` + `Explanation:` or `Q61.`-style runs | dropped (`parse_dump`) |
| Options count != 4, empty option, duplicate options | dropped |
| Correct answer not among options / index out of range / no answer found anywhere | dropped (`answer_not_in_options`, `answer_index_out_of_range`, `no_answer`) |
| Statement stems ("Which of the statements given above...", "Select using the code...", options `1 and 2 only` / `Both 1 and 2`) whose numbered statements are missing | dropped (`broken_statement_stem`) |
| Empty / "coming soon" / "to be updated" / just repeats the answer / < 25 chars | kept, `explanation_quality: "missing"`, explanation blanked |
| 25-59 chars | kept, `explanation_quality: "short"` |
| Economy PYQs ("Answer to be updated.", `correctIndex` always 0) | kept, `answer_status: "unverified"`, `correct_option: null` (unless the same question exists elsewhere with a real answer) |

**Rebalancing.** Source files put the right answer at one position far too often (up to 84%).
Options are reordered with a permutation derived from `sha256(normalised question text)`, so the
output is deterministic and independent of run order, and `correct_option` is recomputed. Questions
whose options only make sense in their given order are **left untouched**: statement codes
(`1 and 2 only`), `Both 1 and 2`, `Only one/two`, `All/None of the above`, `Both B and C`,
assertion-reason option sets, sequences (`A-B-C-D`) and purely numeric options. Their residual
position bias is therefore unchanged (visible in `REPORT.md`).

**Question type** is rule-based, precedence: ASSERTION_REASON (also Statement-I/Statement-II), MATCH_THE_FOLLOWING,
CHRONOLOGICAL, STATEMENT_BASED, MAP_BASED, CAUSE_EFFECT, FACTUAL. `book` is a best guess from the
source file path (Laxmikanth for polity chapter files, Spectrum / RS Sharma / Satish Chandra for
modern / ancient / medieval history, NCERT / Savindra Singh for geography); `null` when unknown.

## Output schema

`{"source": "eduecosystem", "generated_at": ISO, "subject_slug": "...", "questions": [...]}`, one
question per line. Each question: `id` (`ee_` + 16 hex of sha256 of the normalised text),
`question_text`, `options [{label A-D, text}]`, `correct_option` (A-D or null), `explanation`,
`explanation_quality` (ok|short|missing), `answer_status` (ok|unverified), `question_type`,
`difficulty` (easy|medium|hard|null), `source_ref {bank_title, file, book, chapter}`, `is_pyq`,
`pyq {exam: "PRELIMS", year}|null`. Subjects over ~6 MB are split into `<subject>-partN.json`
(extra keys `part`, `parts`). `internal-security-society` currently has no questions: the source has none.

## Re-running

```bash
cd backend
python scripts/eduecosystem_import/convert.py \
    --db /path/to/eduecosystem_v2.db \
    --frontend-root /path/to/eduecosystem-frontend/frontend \
    [--out app/core/gs_lms/data/retention] [--subjects history,polity-governance] [--dry-run]
```

`--dry-run` prints the report and writes nothing. With `--subjects` only those subjects' files are
rewritten and `REPORT.md` is not overwritten (the partial report is printed instead). Output is
deterministic apart from `generated_at`. Needs only the Python standard library (about 25 s).
Tests: `pytest app/tests/test_eduecosystem_import.py` (self-contained fixtures; the external repos are not needed).

## Data caveats

* **Copyright / use.** Many questions were derived from paid books (Laxmikanth, Spectrum, RS Sharma, Satish
  Chandra, NCERT, Savindra Singh). They are for *chapter-retention checks* only; no book text is copied into
  this repo beyond the question/explanation strings already in the source bank. `source_ref.book` is a guess,
  not a licence statement. Review before any public/commercial redistribution.
* Answers come from the source banks and were not independently verified; AI-generated history sets in
  particular can contain wrong keys. `answer_status: "ok"` means "present and consistent", not "fact-checked".
* Many questions have no explanation (`explanation_quality: "missing"`, mostly medieval and modern history).
* Statement questions whose numbered statements were lost in the original parse are dropped, not repaired;
  this removes a large share of economy PYQs.
* TS MCQ files that are not in the DB are not imported as questions (only PYQ files are); the DB is the MCQ source.
* Duplicates are detected on normalised question text only (case, punctuation, whitespace); paraphrases survive.
