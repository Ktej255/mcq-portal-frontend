# UPSC LMS Roadmap

Last updated: 2026-05-21

## Product Direction

The MCQ Portal is now the stable exam/report engine. The next product step is to turn it into a UPSC LMS with the MCQ engine as one verified layer inside a wider learning loop:

1. Watch the topic.
2. Talk through the topic with AI/Socratic questioning.
3. Test through MCQs and answer writing.
4. Track mastery, retention, and gaps.
5. Revisit through spaced repetition.

The reference product identity is **Sarit Classes** with the tagline:

> One subject. One month. Command it.

## Local Reference Sources Found

### Student Portal Prototype

Path: `D:\Development\Student Portal`

Useful files:

- `PROMPT_3_FRONTEND_DESIGN_BUILD.md`
- `styles.css`
- `screen-home.jsx`
- `screen-watch-talk.jsx`
- `screen-test-track.jsx`
- `screen-revisit-mobile.jsx`
- `Sarit Classes.html`

Key takeaways:

- Mobile-first UPSC learning UI.
- Warm serious visual language, not generic edtech.
- Core palette: forest green, teal, amber, warm off-white.
- Geography primary color: `#1D9E75`, light: `#E1F5EE`, dark: `#085041`.
- Intended flow: Watch -> Talk -> Test -> Track -> Revisit.
- Dashboard copy and structure already match the June launch idea: daily plan, subject mastery, revision due today, teacher note.

### Sarit Student Core

Path: `D:\Development\sarit-student-core`

Useful findings:

- Full LMS-style repository with frontend, backend, mobile, docs, tests, UPSC APIs, drill logic, AI tutor concepts, admin views, gamification, and reports.
- Contains UPSC audit reports and readiness notes.
- `UPSC_PORTAL_DEEP_AUDIT.md` describes Daily Drill, Pomodoro, Synapse Engine, AI Tutor, Wolf Packs, Mood Tracker, Deep Reports, 3D Portal, and Payment Hub.

### EduEcosystem

Path: `D:\Development\EduEcosystem`

Useful findings:

- Contains a large Geography implementation and subject-specific assets.
- `Geography_Subject_Bible.md` reports **2,270 tagged Geography MCQs** across five books.
- Geography frontend modules exist under:
  - `frontend/src/app/(student-portal)/student/upsc/geography`
  - `frontend/src/components/upsc/subjects/geography`
- Geography includes dashboards, drill interfaces, MCQ sessions, revision, PYQ, Pomodoro, syllabus, AI tutor, guided lesson, topic pages, and 3D/visual modules.

## Geography Source Architecture

From `Geography_Subject_Bible.md`, Geography is organized around five strict `topic_tag` values:

| Book | Questions |
| --- | ---: |
| `Book1_NCERT11_Physical` | 657 |
| `Book2_NCERT11_India` | 287 |
| `Book3_NCERT12_Human` | 403 |
| `Book4_NCERT12_India` | 490 |
| `Book5_Savinder` | 433 |
| Total tagged Geography MCQs | 2,270 |

Important rule for later: if older EduEcosystem MCQs are ever imported, do not rename these tags. They are the backbone of that targeted Geography drill system.

Current user direction: do **not** import old Geography MCQs now. Fresh MCQs will be prepared separately. The old Geography structure is reference material for depth, sequencing, and possible future mapping only.

## Current MCQ Portal Content Reality

Local DB: `backend/production.db`

Current launchable MCQ state:

| Subject | Runnable Published Questions | Notes |
| --- | ---: | --- |
| Geography | 0 | June priority, content must be imported/mapped. |
| Environment | 396 | Already available across 8 batches, one batch has 49. |
| Polity | 61 | Partial. |
| Economy | 0 | Placeholder batches only. |
| Science | 0 | Placeholder batches only. |
| History | 0 | Placeholder batches only. |
| Runtime Truth | 15 | Control/test fixtures, not student content. |

The portal mechanics are stable, but the new UPSC product should not be framed as an MCQ-only portal. Geography currently needs the LMS subject room first; fresh MCQs can then be uploaded into the existing engine when ready.

## Subject Calendar

Working schedule based on user direction:

| Period | Subject Focus |
| --- | --- |
| June | Geography |
| July, first 15-20 days | Environment |
| July, remaining days | Disaster Management |
| August | Economy |
| September | Science & Tech |
| October | Polity + Governance |
| November | Internal Security + Indian Society |
| December-January, 60 days | Modern History, Ancient History, Medieval History, Art & Culture, 15 days each |
| After History block | Full revision and command phase across all subjects |

If Economy and Science & Tech need to become a 15/15 split instead, update this table before implementation.

## Integration Strategy

Do not rebuild from scratch.

Use MCQ Portal as the stable engine and gradually add LMS layers:

1. **Phase 1: Geography launch shell**
   - Add Sarit Classes design tokens.
   - Add UPSC subject plan model/data.
   - Add Geography LMS route/dashboard.
   - Link existing MCQ engine as the Test step.

2. **Phase 2: Geography content and MCQ upload readiness**
   - Keep the MCQ engine ready for fresh Geography uploads.
   - Add chapter/topic mapping so new MCQs can attach to the correct subject room.
   - Treat the old 2,270 EduEcosystem MCQs as reference or optional future migration, not the current build path.

3. **Phase 3: Learning loop**
   - Topic page: Watch.
   - AI conversation shell: Talk.
   - MCQ session: Test.
   - Report/mastery map: Track.
   - Revision queue: Revisit.

4. **Phase 4: Admin readiness**
   - Add admin content readiness table.
   - Show subject/batch question counts.
   - Flag empty or unlaunchable content.

5. **Phase 5: Expand subject by subject**
   - Repeat the same architecture for Environment, DM, Economy, Science & Tech, Polity/Governance, Internal Security, Society, and History.

## Immediate 1-2 Hour Execution Plan

Status update on 2026-05-20:

1. Built the first UPSC LMS shell.
   - Added `/upsc` as the paid UPSC landing/command page.
   - Added `/upsc/geography` as the June Geography subject room.
   - Added sidebar navigation for UPSC Portal.
   - Added shared UPSC plan data in `frontend/src/lib/upsc/plan.ts`.

2. Applied the corrected product model.
   - MCQ is now represented as an action button inside the broader LMS flow.
   - Geography is framed around Watch -> Talk -> Test -> Track -> Revisit.
   - Old MCQs are not imported at this stage.

3. Built the local-first Geography learning loop.
   - `/upsc/geography/watch` handles class state, watched minutes, and class notes.
   - `/upsc/geography/talk` handles Socratic reflection, confidence, and revisit queue.
   - `/upsc/geography/lab` handles the first visual geography labs.
   - `/upsc/geography/track` reads watched classes, reflections, confidence, and revisit state.
   - `/upsc/geography/revisit` repairs weak/queued days and clears the revisit queue locally.

4. Built fresh Geography MCQ readiness.
   - `/upsc/geography/mcq-readiness` generates the day/chapter/topic/batch mapping for fresh MCQs.
   - Batch codes use the stable `GEO-Dxx` pattern.
   - CSV templates can be generated per selected day and difficulty.
   - Readiness can be checked by planned versus drafted question count.
   - Links are wired from the Geography command room and learning loop pages.

5. Extracted the reusable subject architecture.
   - Added `frontend/src/lib/upsc/subjectPlans.ts`.
   - Added `SubjectSprintPlan`, `SubjectSession`, `SubjectWeek`, and `SubjectLab`.
   - Added reusable `SubjectCommandRoom`.
   - Added `/upsc/environment` as the next subject command room.
   - Environment now has a 20-day July plan with week/day selector, learning-loop mapping, subject labs, and fresh MCQ batch contract.
   - UPSC landing page links Environment and marks it as `Structure ready`.

6. Added reusable deep subject rooms.
   - Added `useSubjectProgress` for subject-specific local progress state.
   - Added generic `SubjectWatchRoom`, `SubjectTalkRoom`, `SubjectTrackRoom`, `SubjectRevisitRoom`, and `SubjectMcqReadinessRoom`.
   - Added `/upsc/environment/watch`, `/upsc/environment/talk`, `/upsc/environment/track`, `/upsc/environment/revisit`, and `/upsc/environment/mcq-readiness`.
   - Environment now persists watched status, class minutes, class notes, Talk reflection, confidence, revisit queue, and MCQ readiness locally.
   - Environment Revisit now opens queued or day-specific weak concepts, runs the recovery drill, stores recovery notes, and clears the revisit flag locally.
   - Environment MCQ templates now download with stable batch names such as `ENV-D11-mcq-template.csv`.

7. Verified locally.
   - Frontend `npm run typecheck`: passed.
   - Frontend `npm run lint`: passed.
   - Frontend `npm run build`: passed.
   - Next build recognizes `/upsc`, `/upsc/environment`, `/upsc/environment/watch`, `/upsc/environment/talk`, `/upsc/environment/track`, `/upsc/environment/revisit`, `/upsc/environment/mcq-readiness`, `/upsc/geography`, `/upsc/geography/watch`, `/upsc/geography/talk`, `/upsc/geography/lab`, `/upsc/geography/mcq-readiness`, `/upsc/geography/track`, and `/upsc/geography/revisit`.
   - Browser check passed for Command -> Watch -> Talk -> Track, with no console or page errors.
   - Browser check passed for Command -> MCQ readiness -> CSV template download, with no console or page errors.
   - Browser check passed for UPSC portal -> Environment -> Week 2 -> Day 11, with no console or page errors.
   - Browser check passed for Environment Day 11 Watch -> Talk -> Track -> MCQ readiness -> CSV template download, with no console or page errors.
   - Browser check passed for Environment Day 11 Talk queue -> Revisit -> mark recovered -> Track queue cleared, with no console or page errors.

8. Stabilized Geography to near release-ready local flow.
   - Geography command room now supports `?day=<number>` and returns to the selected day.
   - Watch, Talk, Visual Lab, Revisit, Track, and MCQ readiness preserve the selected Geography day through forward and backward movement.
   - Visual Lab supports `mode` plus `day`, including Previous day and Next day controls inside the lab.
   - MCQ readiness supports Previous day and Next day controls, day-grid URL updates, Visual Lab return, Revisit return, Track return, Watch return, and Talk return.
   - Revisit supports direct day routing, recovery notes, queue clearing, and Track queue verification.
   - Browser check passed for Geography Day 10: Command -> Watch -> Command -> Talk -> Visual Lab -> Command -> Revisit -> MCQ readiness -> Track, with no console or page errors.
   - Browser check passed for Visual Lab Day 10 -> Day 11 -> Day 10 and MCQ readiness Day 10 -> Day 11 -> Day 10, with no console or page errors.
   - Clean production build passed after the Geography stabilization pass.

Next 1-2 hour plan:

1. Add Disaster Management as the next reusable subject room for the July remaining-days sprint.
2. Wire backend persistence for Watch/Talk/Revisit state when cloud/local backend is available.
3. Decide whether `/upsc` should become the default post-payment landing route for paid UPSC users.
4. Add subject-level dashboards for visual labs and answer-writing once the reusable subject rooms cover Disaster Management.
5. Convert Geography gradually to generic subject rooms only if visual parity can be preserved.

## Decision For Next Implementation

The best next code action is:

**Add Disaster Management as the next reusable subject room for the July remaining-days sprint.**

Reason: Geography and Environment now both have complete local learning loops. Disaster Management is the next calendar block after Environment and can reuse the same Watch, Talk, Test, Track, Revisit, and MCQ readiness architecture.
