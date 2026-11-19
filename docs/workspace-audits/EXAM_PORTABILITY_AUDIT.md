# Exam-portability audit: is this a UPSC app or a revision platform?

Asked by the founder's standing goal: today the product is a one-stop solution for
the UPSC student; the stated future is revision for *any* exam — school boards,
other competitive exams — where the software tells the learner what to do, where
the gap is, and how to bridge it. This document answers the question that
precedes any build: **how much of what exists is already exam-neutral, and how
much is UPSC written into the schema?**

Method: a read-only sweep of `backend/app/**` and `frontend/src/**` by an
explorer agent, then every load-bearing claim re-opened by hand in this session.
One agent path was wrong and is corrected here: the "only `geography` is a valid
slug" guard lives at `backend/app/api/v1/gs_lms/dependencies.py:52`, not
`app/api/dependencies.py`. Surface counts below were measured directly, not
taken from the sweep.

No code was changed by this audit. Nothing here is a migration plan that has
been approved — it is the evidence and the options.

## Verdict

The core learning loop is genuinely exam-agnostic; the exam *identity* is not.

Reusable without a migration: the syllabus tree as a self-referencing weighted
structure, content sections per topic, MCQ mechanics, the revision engine
(`app/core/gs_lms/spaced_repetition.py:20-26` is bare interval maths —
`MIN/MAX_INTERVAL_DAYS` and score-banded ranges with no exam in sight;
`app/core/gs_lms/revisit.py:24-29` is the `day_3 / day_7 / day_21` table),
`RevisionQueue` (`models/domain.py:412`), and the attempt/telemetry and report
plumbing (`models/domain.py:197-244`). The legacy domain proves the
point: `backend/scripts/seed_data.py:39-42` seeds **Physics** and
**Mathematics** subjects with topics, tests and questions — the `Subject`,
`Topic`, `Question`, `Attempt` tables carry no UPSC column at all.

What is UPSC-only: there is **no `exams` entity anywhere**. `exam_id` does not
exist in `backend/app`; UPSC is implied by table prefixes (`gs_lms_*`,
`optional_*`), by enums whose values are exam names, and by scoring constants.
The GS LMS subject space is hard-scoped to `geography`
(`app/api/v1/gs_lms/dependencies.py:52`), and the readiness engine's weights are
UPSC's, not configuration.

So a second exam today is a schema change, not a content drop. That is the whole
finding.

## Coupling, with evidence

| # | Where | What it assumes | Cost to generalise |
|---|---|---|---|
| 1 | `app/core/gs_lms/models.py:54-57`, `:232` | `GsLmsExamTypeEnum` is exactly `PRELIMS`/`MAINS`, and `gs_lms_pyqs.exam_type` is `NOT NULL` | Postgres-native enum + a non-null column: migration, not config |
| 2 | `app/core/gs_lms/models.py:82-87`, `:235`, `:314` | `GsLmsPaperEnum` GS1–GS4 stamped on PYQs and answer attempts | Same: the paper concept must become a per-exam stage/paper entity |
| 3 | `app/core/current_affairs/ca_models.py:56-60` | `ca_items.gs_paper String(5) NOT NULL`, `exam_relevance String(10) NOT NULL`, and a column literally named `upsc_statement_frames` | Content model is the most visible one: every CA item must declare a UPSC paper |
| 4 | `app/core/current_affairs/ca_models.py:155-169`, `:243-244` | the `ca_mains_questions` table and `source/target_gs_paper` causality columns | A table that exists only because UPSC has a Mains paper |
| 5 | `app/core/gs_lms/readiness.py:37-56` | `PRELIMS_EXAM_WEIGHT = 1.0`, `MAINS_EXAM_WEIGHT = 0.15`, `GEOGRAPHY_BLOCK_QUESTIONS = 20`, `GEOGRAPHY_BLOCK_MARKS = 40`, `CORRECT_MARKS = 2.0`, `WRONG_MARKS = 2/3`, and `DEPTH_WEIGHTS` keyed to the five section labels | **The real generalisation blocker**: this is UPSC's marking scheme standing inside a "pure engine", so every readiness band silently means "against UPSC demand" |
| 6 | `app/core/gs_lms/mains_outcome.py:42` | `MARKS_PER_GS_PAPER = 250` | Same class of problem, smaller blast radius |
| 7 | `app/core/gs_lms/models.py:60-68`, `mcq_lab_scoring.py:28-31` | the UPSC question-type vocabulary, and a hard MCQ-lab quota (statement/assertion/matching mix) | Medium: types are UPSC-shaped but the mix is the part that must become config |
| 8 | `app/core/gs_lms/models.py:71-77` + `beta_scope.py:38-44` | the five canonical sections, including `NCERT_LEVEL` and `EXAMINER_TRAPS` | Section *labels* are India-school-specific; the section *mechanism* is not |
| 9 | `app/core/gs_lms/funnel_models.py:45-60` | a 14-step integer-keyed funnel embedding `NCERT_CONTENT`, `TRAPS_RECALL`, `MAINS_PRACTICE` | High: step numbers are persisted, so re-templating the funnel is a data migration |
| 10 | `app/core/optional/models.py:65-74`, `:107-144`, `:296-321` | `PAPER_I/PAPER_II`, `SECTION_A/B`, and the `optional_papers`/`optional_sections` tables | "Optional subject with two papers" is a UPSC-Civil-Services invention |
| 11 | `app/core/current_affairs/ca_engine.py:27-48` | `CASubject`, `GSPaper`, `ExamRelevance` Python validators (and the seeder that enforces them) | Low: validators are one file, but they gate the authoring pipeline |
| 12 | `app/core/entitlements.py:25-29` | plan flags named `optional_subjects`, `mains_upload` | Commercial packaging is UPSC-worded |
| 13 | `models/domain.py:108` | `Test.negative_marking_value` defaults to `0.33` | Cosmetic: a UPSC-flavoured default on an otherwise neutral column |
| 14 | Frontend surface shape | 112 pages under `src/app/(dashboard)/upsc/**`, 64 components in `src/components/upsc/**`, 75 files in `src/lib/upsc/**` (including `prelims2026*`, `prelims2027*`), and `src/app/api/upsc/prelims-2026/**` | Route naming, not logic: `upsc/[subject]/lms/**` is the most exam-neutral surface and the per-subject wrappers are 7-line config injectors (e.g. `EconomySubjectRoutes.tsx:10-38`) |
