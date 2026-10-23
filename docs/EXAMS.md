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
| MCQ question types | STATEMENT_BASED, MATCH_THE_FOLLOWING, ASSERTION_REASON, MAP_BASED, CAUSE_EFFECT, CHRONOLOGICAL, FACTUAL | FACTUAL, ASSERTION_REASON, STATEMENT_BASED, MATCH_THE_FOLLOWING (+ NUMERICAL, MULTI_CORRECT reserved) | same as NEET |
| Marking (correct / wrong / unattempted) | 2 / -0.66 / 0 | 4 / -1 / 0 | JEE Main 4 / -1 / 0 |
| Answer writing | yes | no | no |

* **Marking is stored only.** The MCQ lab does not apply it yet (next round).
* **NUMERICAL and MULTI_CORRECT** exist in the database enum now but are listed
  as "not yet supported in the MCQ lab": the content checker rejects them so a
  question the lab cannot serve is never imported.
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

1. Create the subject row with the right exam and a prefixed slug (the seed
   script only seeds UPSC subjects):

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

## What the next round still needs

* Question formats: render and score NUMERICAL and MULTI_CORRECT in the MCQ
  lab and the checker (options, answer shape), then remove them from the
  profiles' `unsupported_question_types`.
* Negative marking: apply the profile's marking scheme in the MCQ lab and
  checkpoints (quota, scoring, result screens); JEE Advanced marking varies by
  question format.
* Routes: the frontend still uses `/upsc/...` everywhere (about 270
  references) and the sidebar header says "UPSC Command". NEET/JEE subjects are
  reachable at `/upsc/<slug>` only. Exam-aware routes, an exam picker that
  writes `exam_code`, and exam-specific labels (content levels, "Mains" tab)
  are not built.
* Checkpoint question count is read from the profile on the server, but the
  submit schema and `mcq_quota` still cap it at the UPSC value of 10.
* Subject/section naming for science (formulas, diagrams, units) in content
  blocks and the PDF generator.
