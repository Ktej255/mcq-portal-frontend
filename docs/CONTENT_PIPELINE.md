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
- at least one PYQ;
- **concepts**: the small ideas the topic teaches, one at a time. Each has a
  `title`, 2–8 `key_points` (short phrases a student must say back to show they
  understood) and optional `misconceptions`. The AI discussion checks the
  student's explanation against these key points.

Topics imported before concepts existed can get them from their old concept
checklist: add `--derive-concepts` to the import command, then review them.

The template has one complete leaf topic (the Preamble) to copy from. The
Geography file shows every block type in use (`para`, `heading`, `callout`,
`trap`, `points`, `compare`, `ncert_reference`, `statgrid`, `keyterms`,
`memory`, `analogy`, `timeline`, `collapsible`, `diagram`).

Write a whole mega-topic before starting the next one, so each import gives
students something complete.

## Optional: versions, books and book references

A concept can be explained in several ready-made ways. The app then shows each
student the version that suits them. You write the versions yourself; nothing is
generated. All of this is optional, and a file without it works exactly as before.

### Versions

Add a `versions` list to a concept. Each version has:

| Field | Meaning |
|---|---|
| `level` | `BASIC` (first time, simple words), `STANDARD` (the normal depth), `ADVANCED` (exam-depth detail) |
| `style` | `TEXT`, `VISUAL` (tables, comparisons, key terms), `VIDEO`, `STORY` |
| `source` | Where the material comes from: `NCERT`, `COACHING`, `REFERENCE_BOOK`, `ORIGINAL` (written by us) |
| `title` | Short heading the student sees |
| `blocks` | The content, in the same block format as the topic sections (`para`, `callout`, `compare`, `keyterms`, ...) |
| `video_url` | Optional link starting `http://` or `https://`. A `VIDEO` version may have only this and no blocks |
| `duration_minutes` | Optional reading or watching time |

A concept can have only one version of each level + style + source
combination. Every version needs `blocks`, a `video_url`, or both.

How a student's version is chosen: a student who has tried the concept twice
or more without passing gets `BASIC` first; otherwise their preferred level (or
`STANDARD`). Then their preferred style, then the source that matches how they
study (NCERT only, coaching, or reference books). If the exact match does not
exist, the nearest one is shown, so you do not need all 24 combinations. One
good `STANDARD` + `TEXT` version per concept is a sound start.

By default a concept with no versions is fine. To make versions compulsory, add
`"require_versions": true` at the top of the file: every concept without one is
then reported as a gap.

### Books and book references

Students study from different books and editions (for example Laxmikanth 7th
and 8th edition), and chapter numbers change between editions. So list each
book edition once, at the top of the file, and point concepts at its chapters:

```json
"books": [
  {
    "slug": "laxmikanth-indian-polity-7e",
    "title": "Indian Polity",
    "author": "M. Laxmikanth",
    "edition": "7th",
    "publisher": "McGraw Hill Education",
    "chapters": [{ "number": 1, "title": "Preamble of the Constitution" }]
  }
],
"tree": [ ... ]
```

On a concept:

```json
"book_refs": [
  { "book": "laxmikanth-indian-polity-7e", "chapter": 1, "pages": "12-15" }
],
"versions": [
  {
    "level": "BASIC", "style": "TEXT", "source": "ORIGINAL",
    "title": "The five descriptions, in plain words",
    "blocks": [{ "type": "para", "text": "..." }]
  }
]
```

- `slug` is a unique short name for the book edition. Use a new slug for a new
  edition (`...-8e`); do not reuse the old one.
- `book` in a reference must be a slug listed under `books` **in the same file**,
  and `chapter` must be a chapter number listed for that book. The check reports
  an error otherwise.
- `pages` is optional text such as `"12-15"`; leave it out or `null` if unsure.
- Only list chapters whose numbers and titles you have checked in that edition.

The check reports as **errors**: a level, style or source that is not in the
lists above, the same combination twice in one concept, a version with no
content, a video link that is not `http(s)`, a reference to an unlisted book or
chapter, and two books with the same slug.

Importing again updates the same books, chapters, versions and references; it
does not duplicate them. Versions follow the same review step as other content:
they are hidden from students until the import uses `--review-status REVIEWED`.

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
from students. Re-running the import updates the same topics and questions.
Topics are matched by their exact title and questions by their exact text. If you
rename a topic or reword a question, the old copy stays in the database, so ask a
developer to remove it before you open the subject.

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

## Retention questions for book chapters

Students who study from a book (Laxmikanth, Spectrum, NCERT...) can mark a
chapter as read and then take a 10-question check to see whether they remember
it. Chapters come back for review after a few days, sooner when the score was
weak. The questions come from the Eduecosystem banks, which are turned into
files first and then loaded into the database. These questions are separate
from the topic MCQs above.

1. **Make the files.** Run the converter as described in
   `backend/scripts/eduecosystem_import/README.md`. It writes one file per
   subject (long ones are split into `-part1`, `-part2`) to
   `backend/app/core/gs_lms/data/retention/`. These files are not committed;
   make them again whenever you need them.
2. **Load the books first.** A question can only be linked to a chapter that is
   already in the database, so import the subject file that lists the book and
   its chapters (see "Books and book references" above).
3. **Check the book map.** `backend/app/core/gs_lms/data/retention_book_map.json`
   says which book in the question files (for example "Laxmikanth") is which
   book edition in the database (for example `laxmikanth-indian-polity-7e`). Only
   Laxmikanth 7th edition is filled in. The others (Spectrum, RS Sharma, Satish
   Chandra, NCERT) are placeholders set to `null`; fill in the book slug when
   that book edition has been loaded. **Chapter numbers differ between
   editions**, so a question is linked to a chapter only when the numbers match.
   Check the numbering of each edition against the question files before you
   point them at each other, and use a separate entry per edition.
4. **Try it first.** Run
   `python -m app.core.gs_lms.retention_import --dir app/core/gs_lms/data/retention --dry-run`.
   It prints, for each subject, how many questions would be created, updated or
   skipped, and how many are linked to a chapter ("mapped") or not ("unmapped").
   Nothing is saved.
5. **Import for review.** Run the same command without `--dry-run`. Questions are
   saved as `UNREVIEWED` and students cannot see them. Running it again updates
   the same questions and keeps any that you already marked reviewed.
6. **Review, then open.** An expert checks the questions and answers for each
   chapter. Then import again with `--review-status REVIEWED` (add
   `--subjects polity-governance` to do one subject at a time). Questions whose
   answer is missing or marked unverified always stay `UNREVIEWED`, even with
   that flag, and students never see them.

A chapter offers a check once it has at least 3 reviewed questions with an
answer. Questions with no chapter link are kept in the database but are not
shown anywhere until the book map links them.

## On production

Run the same commands where the backend's `DATABASE_URL` points at the
production database (for example an ECS one-off task with the backend image),
after `alembic upgrade head`.
