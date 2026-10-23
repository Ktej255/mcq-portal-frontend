# Exams: UPSC, NEET and JEE on one learning engine

The GS LMS learning engine (14-step funnel, recall gates, MCQ lab, topic order,
checkpoints, study search) is exam-neutral. What differs between exams is data:
an **exam** (a row in `gs_exams`) and an **exam profile** (a code registry).

## Exams

`gs_exams` has `code` (unique: `upsc`, `neet`, `jee`), `name`, `display_order`,
`is_active`, `created_at`. Every `gs_subjects` row has a NOT NULL `exam_id`.
Migration `p3d4e5f6a7b8` creates the table, inserts UPSC (active) plus NEET and
JEE (inactive), and backfills every existing subject to UPSC, so UPSC
behaviour, URLs, API paths and stored progress are unchanged. Turn an exam on
with `UPDATE gs_exams SET is_active = true WHERE code = 'neet'` once its first
subject is ready (inactive exams are not listed by `GET /gs-lms/exams` and a
student cannot pick them).

### Slug convention

Subject slugs stay **globally unique** because routing is `/{subject_slug}`.
UPSC subjects keep their plain slugs (`geography`, `polity-governance`).
Subjects of other exams use an exam prefix: `neet-physics`, `neet-chemistry`,
`neet-biology`, `jee-physics`, `jee-chemistry`, `jee-maths`.

## Exam profiles

`backend/app/core/gs_lms/exam_profiles.py` holds one `ExamProfile` per exam
code. Nothing in the database duplicates it.

| | UPSC | NEET | JEE |
|---|---|---|---|
| Content levels shown | Basic / NCERT / Advanced | Basics / NCERT / Beyond NCERT | Basics / NCERT / Advanced problems |
| Section labels | BASIC, NCERT_LEVEL, ADVANCED, CURRENT_AFFAIRS, EXAMINER_TRAPS | BASIC, NCERT_LEVEL, ADVANCED, EXAMINER_TRAPS | same as NEET |
| Funnel steps | 1-14 | 1-14 except 8, 9, 13 | same as NEET |
| PYQ exam types | PRELIMS, MAINS | NEET | JEE_MAIN, JEE_ADVANCED |
| MCQ question types | STATEMENT_BASED, MATCH_THE_FOLLOWING, ASSERTION_REASON, MAP_BASED, CAUSE_EFFECT, CHRONOLOGICAL, FACTUAL | FACTUAL, ASSERTION_REASON, STATEMENT_BASED, MATCH_THE_FOLLOWING (single-correct only) | NEET's, plus MULTI_CORRECT and NUMERICAL |
| Marking (correct / wrong / unattempted) | 2 / -0.66 / 0 | 4 / -1 / 0 | per answer format, see "Question formats and marking" |
| Answer writing | yes | no | no |

* **Progression constants** (`recall_pass_score` 0.5, `recall_max_attempts` 3,
  `topic_mcq_pass` 0.6, `checkpoint_every` 3, `checkpoint_min_leaves` 2,
  `checkpoint_questions` 10, `checkpoint_pass` 0.6) are on the profile. The
  module constants in `progression.py` are the defaults and a test pins that
  the UPSC profile equals them. `progression.py` reads the values from the
  subject's profile and falls back to the constants when a subject is unknown.
* **Per-subject override** (small, optional) in `GsSubject.config`:

  ```json
  {"exam_overrides": {
      "enabled_funnel_steps": [1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 14],
      "section_labels": ["BASIC", "ADVANCED"],
      "progression": {"checkpoint_every": 4}
  }}
  ```

  Step 14 must stay enabled (finishing it is what completes a topic). Invalid
  values are ignored.

### Funnel step skipping

`GET /gs-lms/{slug}/funnel/{node}/state` returns `enabled_steps`. The server
computes `current_step` as the lowest enabled step not yet completed, and
refuses a disabled step with 409. No rows are stored for skipped steps and
nothing is renumbered, so stored UPSC rows stay valid. The frontend
(`useFunnelState`, `FunnelOrchestrator`) hides tabs whose steps are all
disabled and counts "Step n of N" over the enabled steps; a response without
`enabled_steps` means all 14.

## Student's exam

`GsLmsLearnerProfile.exam_code` (null = `upsc`). `GET/PUT /gs-lms/profile`:
`exam_code` appears in the response once set, and `PUT` keeps it when omitted
(send `null` to reset). An unknown or inactive exam is a 422.

* `GET /gs-lms/exams` lists active exams.
* `GET /gs-lms/subjects?exam=` lists that exam's subjects (default: the
  student's exam, else UPSC). Each non-UPSC subject carries `exam`; for UPSC
  subjects the field is omitted (absent = `upsc`) so the UPSC response keeps its
  old shape.
* `GET /gs-lms/study/search` and `/study/next` without a subject, and
  `GET /gs-lms/books` without a subject, are scoped to the student's exam.
  An explicit subject always wins.

## Adding a NEET or JEE subject

1. Create the subject row with the right exam and a prefixed slug. The standard
   NEET/JEE subjects come from `exam_admin seed-subjects`; for any other subject:

   ```python
   from app.db.session import SessionLocal
   from app.core.gs.models import GsExam, GsSubject
   db = SessionLocal()
   neet = db.query(GsExam).filter_by(code="neet").one()
   db.add(GsSubject(slug="neet-biology", name="NEET Biology", exam_id=neet.id, display_order=1))
   db.commit()
   ```
2. Copy `backend/app/core/gs_lms/data/templates/neet_subject_template.json`
   (set `"exam": "neet"` or `"jee"`, and `subject_slug`). The template is one
   complete leaf topic, "Cell Theory and Types of Cells", with 4 sections, 3
   concepts, 15 MCQs and one clearly marked SAMPLE PYQ (year 0): replace the
   PYQ with a verified one.
3. Upload it in the Content studio (`/admin/content/<slug>`) or run the
   importer CLI. The checker validates against the exam in the file, a NEET
   topic needs no CURRENT_AFFAIRS section, and the import is **refused if the
   file's exam differs from the subject's exam**.
4. Approve topics, then activate the exam (`is_active`). The Content studio
   shows each subject's exam and its readiness rules.

## Routes, branding and the picker (NEET / JEE)

UPSC keeps `/upsc/...` exactly as before. NEET and JEE use their own top-level
paths and **reuse the same page components** (thin re-exports under
`src/app/(dashboard)/[exam]/`):

| Path | What |
|---|---|
| `/neet`, `/jee` | Subject list for the exam (`GET /gs-lms/subjects?exam=`), or "coming soon" when the exam is inactive or has no open subject |
| `/{exam}/study`, `/{exam}/books`, `/{exam}/wellbeing` | The UPSC study, My books and Wellbeing pages |
| `/{exam}/{subject}/lms/...` | The generic subject engine: `onboarding`, `syllabus`, `topic/[nodeId]`, `practice`, `practice/[sessionId]`, `planner`, `gaps`, `retro`, `checkpoint/[id]` (subject slug is the prefixed one, e.g. `/neet/neet-physics/lms`) |

* `[exam]` is limited to `neet` and `jee` (`generateStaticParams` +
  `dynamicParams = false` + a `notFound()` guard in `[exam]/layout.tsx`).
  `/notanexam` is a 404; existing static top-level routes always win over the
  dynamic segment. Deeper paths under an unknown exam render the 404 page but
  Next streams them with HTTP 200.
* `SubjectLmsContext` reads the exam from the pathname (`src/lib/exams/examRoutes.ts`),
  so `lmsBase` is `/neet/neet-physics/lms` there and `/upsc/<slug>/lms` for UPSC.
  The study page's links do the same.
* **Auth**: `src/proxy.ts` protects `/neet(.*)` and `/jee(.*)` exactly like
  `/upsc(.*)` (no public pages; the patterns are in `src/lib/auth/protected-routes.ts`,
  checked in `e2e/proxy-routes.spec.ts`). `/admin` rules are unchanged. The UPSC
  self-study profile gate is not applied on `/neet` and `/jee`; each subject's
  onboarding is the gate there.
* **Branding**: the sidebar and header say "NEET Command" / "JEE Command" on
  those paths ("UPSC Command" everywhere else). The NEET/JEE sidebar has Home,
  Study, My books and Wellbeing plus the exam's subjects; Current affairs,
  Optional, GS, Practice (prelims) and UPSC billing are not shown.
* **Exam picker**: "Exam I'm preparing for" on My books (`/upsc/books`,
  `/{exam}/books`). It lists `GET /gs-lms/exams` (active exams only, and hides
  itself when only UPSC is active) and saves `PUT /gs-lms/profile` with the
  current style/level/path/books unchanged plus `exam_code`
  (`src/services/api/gsExamService.ts`; `examService.ts` is the unrelated mock-test
  service). After saving a non-UPSC exam it links to `/<exam>`.

## Seeding and activating an exam (owner CLI)

No migration needed. From `backend/`:

```
python -m app.core.gs_lms.exam_admin seed-subjects --exam neet   # or jee
python -m app.core.gs_lms.exam_admin activate --exam neet
python -m app.core.gs_lms.exam_admin deactivate --exam neet      # UPSC is refused
python -m app.core.gs_lms.exam_admin status
```

* `seed-subjects` creates the exam row if missing (inactive) and the standard
  subjects if missing: NEET `neet-physics`, `neet-chemistry`, `neet-biology`;
  JEE `jee-physics`, `jee-chemistry`, `jee-maths` (named Physics, Chemistry,
  Mathematics), with `display_order` 1..3. Existing subjects are never changed;
  a slug that belongs to another exam is refused. Run twice = no duplicates.
* Seeded subjects have no content, so `GET /gs-lms/subjects?exam=` lists them
  with `available: false` ("Soon") until topics with MCQs are imported and
  reviewed (see "Adding a NEET or JEE subject" below; step 1 is now this CLI).
* `activate` / `deactivate` flip `gs_exams.is_active`. Go-live order: seed,
  import and review content, then activate. The Playwright seed
  (`backend/scripts/e2e_seed.py`) seeds both exams, leaves NEET off and turns JEE on.

## Question formats and marking

Topic MCQs (`GsLmsMcqQuestion`, used by the MCQ lab, funnel step 12, and by
review checkpoints) have an **answer format**, derived from `question_type`:

| Format | question_type | Stored answer | Student answers with |
|---|---|---|---|
| `single` | everything else (UPSC, NEET, legacy) | `correct_option` "A".."D" | `chosen_answer` (alias `selected_option`) |
| `multi` | `MULTI_CORRECT` | `correct_options` ["A","C"]; `correct_option` holds "A,C" | `selected_options` ["A","C"] |
| `numerical` | `NUMERICAL` | `numeric_answer`, `numeric_tolerance`; `correct_option` holds the number as text; `options` is `[]` | `numeric_answer` (number) |

No answer field = unanswered. NEET is single-correct only; JEE allows all three.
`backend/app/core/gs_lms/scoring.py` is the one place that decides correctness
(`is_correct`) and marks (`marks_for`); the lab and checkpoints only call it.
Multi-correct is correct only for the exact set. A numerical answer is correct
when `abs(response - answer) <= max(numeric_tolerance, 0.005)` (a tolerance of 0
means "exact after rounding to 2 decimals"); NaN, infinity and non-numbers are
wrong, never an error. `GET .../mcq-lab/questions` and
`POST .../checkpoints/{id}/start` send `answer_format` for every question
(numerical ones with `options: []`) and never the answer. Sequential practice
(`/practice`) only serves single-correct questions.

**Marks vs pass marks.** Results carry `marks` per attempt, `marks_total`,
`marks_max` and the `marking_scheme` used, but mastery, `TOPIC_MCQ_PASS` and
`CHECKPOINT_PASS` stay **accuracy based** (correct / total), exactly as before:
negative marking never blocks or unlocks a student, it is shown in addition.
A UPSC result made only of single-answer questions has no marks keys at all, so
UPSC responses are unchanged.

`ExamProfile.format_marking` lists the scheme per paper and per format
(`scheme_for` uses the paper named by `config["exam_overrides"]["marking_paper"]`,
else `default`):

| Exam / paper | single | multi | numerical |
|---|---|---|---|
| UPSC | +2 / -0.66 / 0 | - | - |
| NEET | +4 / -1 / 0 | - | - |
| JEE `default` (JEE Main style) | +4 / -1 / 0 | JEE Advanced scheme | +4 / -1 / 0 |
| JEE `JEE_MAIN` | +4 / -1 / 0 | - | +4 / -1 / 0 |
| JEE `JEE_ADVANCED` | +3 / -1 / 0 | +4 all correct; +1 per correct option chosen when only correct options were chosen (+3 / +2 / +1); -2 if any wrong option; 0 unanswered | +3 / 0 / 0 |

JEE numerical negative marking and every JEE Advanced value vary by year and
must be verified against the current NTA / IIT paper before launch.

Content: `MULTI_CORRECT` questions have four options and `correct_options` (1-4
distinct labels); `NUMERICAL` questions have `numeric_answer`, optional
`numeric_tolerance` >= 0 and no options. In the spreadsheets, `mcqs.csv` has
`correct_options` (e.g. `A;C`), `numeric_answer` and `numeric_tolerance` columns.
`data/templates/jee_subject_template.json` is a complete JEE Maths leaf mixing
all three formats. Migration `q4e5f6a7b8c9` adds the question columns and
`gs_lms_mcq_lab_attempts.marks`.

## What the next round still needs

* Exam-specific labels (content levels, "Mains" tab) in the topic page.
* Checkpoint question count is read from the profile on the server, but the
  submit schema and `mcq_quota` still cap it at the UPSC value of 10.
* Subject/section naming for science (formulas, diagrams, units) in content
  blocks and the PDF generator.
* `/{exam}/{subject}` (without `/lms`) is not a page; links go to `/lms`.
