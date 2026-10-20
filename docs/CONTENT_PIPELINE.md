# Adding a GS subject

Geography is the only GS subject with content today. The other subjects (Polity,
Economy, Environment, History, Science & Tech, Disaster Management, Internal
Security & Society) already exist in the database and the app already serves any
subject at `/upsc/<slug>/lms`. What they need is content. This is the process.

## 1. Write the content file

Copy `backend/app/core/gs_lms/data/templates/gs_subject_template.json` to
`backend/app/core/gs_lms/data/gs_<subject>_syllabus.json` and set
`subject_slug`:

| Subject | slug |
|---|---|
| Polity & Governance | `polity-governance` |
| Economy | `economy` |
| History | `history` |
| Science & Tech | `science-tech` |
| Environment | `environment` |
| Disaster Management | `disaster-management` |
| Internal Security & Society | `internal-security-society` |

The file is a tree: **mega-topics → sub-topics → leaf topics**. Students study
leaf topics. A leaf topic is **ready** when it has:

- all five sections: `BASIC`, `NCERT_LEVEL`, `ADVANCED`, `CURRENT_AFFAIRS`,
  `EXAMINER_TRAPS`, each with at least one content block;
- **15 MCQs** (the MCQ Lab serves 15), each with four options A–D, a
  `correct_option` and an explanation;
- at least one PYQ.

The template has one complete leaf topic (the Preamble) to copy from. The
Geography file shows every block type in use (`para`, `heading`, `callout`,
`trap`, `points`, `compare`, `ncert_reference`, `statgrid`, `keyterms`,
`memory`, `analogy`, `timeline`, `collapsible`, `diagram`).

Write a whole mega-topic before starting the next one, so each import gives
students something complete.

## 2. Check it

```bash
cd backend
python -m app.core.gs_lms.importer --artifact app/core/gs_lms/data/gs_polity_syllabus.json --check-only
```

The check prints how many topics are ready and lists:

- **Errors**: the file is broken (a wrong section name, an MCQ answer that is not
  A–D, two topics with the same title). The importer refuses the file until these
  are fixed.
- **Gaps**: the file is valid, but these topics are not ready yet (missing a
  section, fewer than 15 MCQs, no PYQs). You can import with gaps.

## 3. Import it for review

```bash
python -m app.core.gs_lms.importer --artifact app/core/gs_lms/data/gs_polity_syllabus.json
```

By default content is imported as `UNREVIEWED`: it is in the database but hidden
from students. Re-running the import updates what is there; it never duplicates.

Have a subject expert check every fact, MCQ answer and explanation (the Preamble
example included).

## 4. Open it to students

Import again with `--review-status REVIEWED`. Students then see the subject: the
sidebar stops showing it as "Soon" as soon as the subject has one reviewed topic
with reviewed MCQs. No code change or deploy is needed.

`GET /api/v1/gs-lms/subjects` shows which subjects are open and how many topics
each has. Each import also records the check summary on the subject
(`gs_subjects.completeness_status`) and sets `is_complete` when every topic is
ready.

## On production

Run the same commands where the backend's `DATABASE_URL` points at the
production database (for example an ECS one-off task with the backend image),
after `alembic upgrade head`.
