# Using the Content studio (no command line)

Admins can check, import and approve a subject's content from the browser. Open
**Content studio** in the admin menu (`/admin/content`).

1. **See what is live.** The first page lists every subject with bars for
   topics fully written, topics approved and MCQs approved. Open a subject to
   see each topic: its status (Draft or Approved), the sections still missing,
   MCQs written out of 15, PYQs, concepts, and a plain "next to write" list.
   **Download worklist (CSV)** gives the same table for a spreadsheet.
2. **Upload a file.** On the subject page choose the subject's `.json` content
   file (see section 1 below for how it is written) and press **Check file**.
   Problems that stop the import are listed in plain words; "still to write"
   items do not stop it. Nothing is saved by a check. When there are no
   problems, press **Import as draft**. Tick "Create concepts from the topic
   checklist" if the file has topics with a concept checklist but no concepts.
   Every upload is logged (who, when, file, result) under **Recent uploads**.
3. **Approve.** Imported content is a draft and students cannot see it. Press
   **Approve** on a topic, after reading it, to publish the topic with its
   sections, MCQs, concepts, concept versions and PYQs. A sub-topic's
   **Approve all ready** approves every fully written topic under it in one go.
   **Unapprove** takes content back off the student screens. Approvals are
   logged with who and when. A subject opens for students as soon as one
   approved topic has approved MCQs.

Things to know: importing a file again keeps the approval of everything you did
not change. A section, MCQ, concept or topic whose text you edited goes back to
draft and needs approving again; new content starts as draft. (Importing with
`--review-status REVIEWED` from the command line approves everything it loads.) Approving
a topic also approves the sub-topic and mega-topic above it so students can find
it. Uploads are limited to 15 MB.

The command-line steps below do the same work and remain available.

---

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
from students. Re-running the import updates the same topics and questions;
anything already approved stays approved unless its content changed.
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

## Writing in a spreadsheet

Concepts, concept versions, MCQs and PYQs are easier to write in Google Sheets
than in JSON. A developer runs two commands; the team only uses the sheets.

1. **Get the sheets.** From the `backend` folder:
   ```bash
   python -m app.core.gs_lms.sheets template \
     --subject-file app/core/gs_lms/data/gs_geography_syllabus.json \
     --out-dir app/core/gs_lms/data/sheets/geography
   ```
   This writes four files, each listing every topic by its exact title:
   `concepts.csv`, `versions.csv`, `mcqs.csv`, `pyqs.csv`. In `concepts.csv`,
   every item of a topic's concept checklist is already a row (the key points
   are empty), so nobody starts from a blank page. The command will not
   overwrite sheets that already exist (use `--force` only if you mean it).
2. **Fill them in.** In Google Sheets choose File > Import > Upload for each
   file. Do not rename the headings or change the topic titles.
   - `concepts.csv`: one row per concept. Give 2 to 8 key points (short phrases a
     student must say back), up to 3 common misconceptions, and optionally the
     book (`book_slug` must already be listed under `books` in the subject file),
     chapter number and pages. Rows with only a title are ignored.
   - `versions.csv`: one row per ready-made version of a concept. The concept
     must be in `concepts.csv` (or already in the subject file). `level` is
     BASIC, STANDARD or ADVANCED; `style` TEXT, VISUAL, VIDEO or STORY; `source`
     NCERT, COACHING, REFERENCE_BOOK or ORIGINAL. Leave a blank line between
     paragraphs in `text`. A version needs a `title` and `text`, a `video_url`,
     or both.
   - `mcqs.csv`: one row per question, four options, `correct_option` A to D,
     an explanation, and optionally the question type (empty means FACTUAL).
   - `pyqs.csv`: `exam_type` PRELIMS or MAINS, a four-digit `year`, the question,
     and optionally answer, explanation, marks.
3. **Export.** For each sheet choose File > Download > Comma-separated values
   (.csv), and put the four files in one folder. Keep the file names.
4. **Build.**
   ```bash
   python -m app.core.gs_lms.sheets build \
     --subject-file app/core/gs_lms/data/gs_geography_syllabus.json \
     --in-dir app/core/gs_lms/data/sheets/geography \
     --out app/core/gs_lms/data/gs_geography_syllabus_new.json
   ```
   The command adds your rows to a copy of the subject file (the original is
   never changed), then prints the usual check. If a row cannot be used it says
   which file and row, in plain words, for example
   `mcqs.csv, row 14: the correct_option is empty.` Nothing is written until
   every row is fixed; fix the sheet, export again and re-run. Running it again
   with the same sheets gives the same result.
5. **Import.** Check the new file and import it as in steps 2 and 3 above.

Rows are added to what is already in the file: a concept with the same title is
replaced, a version with the same level, style and source is replaced, and an
MCQ or PYQ already in the topic is skipped.

## Filling MCQs from the question bank

Most topics have fewer than 15 MCQs. The Eduecosystem question bank (see
"Retention questions for book chapters") can supply candidates. The matcher
suggests a topic for each bank question; people decide. Nothing is generated and
no AI is involved.

**Keep it private.** Bank questions may come from paid books and this repository
is public. The matches file, the supplement and the bank itself live in folders
that git ignores. Never copy their contents into a committed file.

1. **Match.**
   ```bash
   python -m app.core.gs_lms.bank_matcher \
     --subject-file app/core/gs_lms/data/gs_geography_syllabus.json \
     --bank app/core/gs_lms/data/retention/geography.json \
     --out app/core/gs_lms/data/bank_matches/geography.csv
   ```
   Each topic is described by its title, its parents' titles, its concept
   checklist, its section text and its MCQs. Each bank question is scored against
   every topic (0 to 1, higher is closer). The command prints how many questions
   are suggested as add, check or skip, and how many topics would reach 15 MCQs.
2. **Review.** Open the CSV in Google Sheets. Each row has the best topic, its
   score, the **margin** over the second-best topic, and a suggestion:
   - `add`: score of at least 0.06 **and** a margin of at least 0.03.
   - `check`: the match is weak or two topics are close (common where the syllabus
     has near-twin topics such as two Wegener topics). The `other_candidates`
     column lists the next best topics.
   - `skip`: the answer is not marked ok, the options are unusable, or the
     question is already in the subject (or earlier in the bank).

   Fill the `approved` column: **yes** to accept the best topic, **no** (or
   leave empty) to leave the question out, or **type the exact topic title** when
   another topic is the right one. Read the question before approving: the score
   only measures shared words, so it can be wrong.
3. **Apply.** Export the sheet as CSV, then:
   ```bash
   python -m app.core.gs_lms.bank_matcher apply \
     --csv app/core/gs_lms/data/bank_matches/geography_reviewed.csv \
     --bank app/core/gs_lms/data/retention/geography.json \
     --subject-file app/core/gs_lms/data/gs_geography_syllabus.json \
     --out app/core/gs_lms/data/supplements/geography_mcqs.json
   ```
   Only approved rows are used. Options become A to D, duplicates are dropped and a
   topic never goes above 25 MCQs in total (`--cap` changes this). A mistyped topic
   title stops the command and names the row.
4. **Import.** Add the supplement to the normal check and import:
   ```bash
   python -m app.core.gs_lms.importer --artifact app/core/gs_lms/data/gs_geography_syllabus.json \
     --supplement app/core/gs_lms/data/supplements/geography_mcqs.json --check-only
   ```
   Drop `--check-only` to import. The supplement is merged in memory; the subject
   file is not edited. The questions arrive as `UNREVIEWED`, like everything else,
   and importing again does not duplicate them. The `--supplement` option can be
   repeated.

**How the thresholds were chosen.** Scores are low because a topic is a long
document and a question is short. As a test, the Geography file's own 257 MCQs
were matched against topics built without any MCQs (`python -m
app.core.gs_lms.bank_matcher calibrate --subject-file ...`). The right topic came
first for 80% of them. Requiring a margin of 0.03 raised that to about 94% while
keeping 59% of the questions; a margin of 0.05 gave about 97% on 37%. The score
floor of 0.06 only removes questions that share almost no words with any topic.
Bank questions are written differently from the file's own, so expect somewhat
lower accuracy; that is why a person approves every row. Change the limits with
`--t1` and `--t2` if a subject behaves differently.

## On production

Run the same commands where the backend's `DATABASE_URL` points at the
production database (for example an ECS one-off task with the backend image),
after `alembic upgrade head`.
