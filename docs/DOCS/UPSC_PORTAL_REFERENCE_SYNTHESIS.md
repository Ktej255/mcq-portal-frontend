# UPSC Portal Reference Synthesis

Last updated: 2026-05-21

## Clear Product Direction

The platform should become a UPSC LMS, not just an MCQ portal.

The MCQ engine remains important, but its role changes:

- It is a button/action inside the subject room.
- It should accept fresh uploads cleanly when new MCQs are prepared.
- It should not define the entire student experience.

The first paid UPSC landing experience should guide the student into a subject command room. Geography is the first room for June.

## Reference Sources

Local references already identified:

- `D:\Development\Student Portal`
  - Sarit Learn design direction.
  - Warm study-room theme.
  - Watch -> Talk -> Test -> Track -> Revisit flow.
  - Geography palette: teal, forest green, amber, warm off-white.

- `D:\Development\sarit-student-core`
  - Full LMS concepts: dashboards, courses, quizzes, assignments, notes, discussion, certificates, gamification, AI recommendations.
  - UPSC audit notes around Daily Drill, AI Tutor, Deep Reports, Payment Hub, and 3D Portal.

- `D:\Development\EduEcosystem`
  - Deep UPSC and Geography reference implementation.
  - Many Geography modules, including 3D/visual map and simulation ideas.
  - Old MCQ bank exists, but current direction is fresh MCQs later.

- `D:\Development\EDUECOSYSTEM_BRAIN`
  - Subject-wise UPSC knowledge folders exist.
  - Geography brain folder should be used next for deeper subject sequencing before building detailed modules.

## Implemented Now In MCQ Portal

Frontend additions:

- `/upsc`
  - UPSC command page.
  - Subject calendar.
  - Learning loop.
  - Geography entry.
  - MCQ engine action button.

- `/upsc/geography`
  - June Geography subject room.
  - 30-day sprint blocks.
  - daily Watch/Talk/Test/Track flow.
  - visual lab roadmap cards.
  - MCQ and revision action buttons.

- Sidebar:
  - Added UPSC Portal navigation item.

- Shared plan data:
  - `frontend/src/lib/upsc/plan.ts`
  - `frontend/src/lib/upsc/subjectPlans.ts`

Follow-up implementation:

- `/upsc/geography` is now an interactive command room.
  - 30-day Geography session model.
  - Week selector.
  - Day selector.
  - Supports `?day=<number>` so returning from another room preserves the selected Geography day.
  - Selected session plan for Watch, Talk, Test, Track, Revisit.
  - Visual lab selector.
  - Fresh MCQ upload mapping contract by subject, day, chapter, topic, and batch code.
  - MCQ remains an action button, not the whole product.

- `/upsc/geography/lab` is now the first Geography visual lab shell.
  - Supports `mode=earth-layers`, `mode=monsoon`, `mode=india-map`, `mode=disaster-link`, `mode=environment-bridge`, and `mode=mcq-engine`.
  - Supports `day=<number>` so the lab stays attached to the selected class day.
  - Earth Layers includes an interactive interior layer board.
  - Monsoon includes an interactive stage selector.
  - India Map includes an interactive region selector.
  - Disaster, Environment, and MCQ modes provide checkpoint boards and route actions.
  - The command room opens the selected lab mode through the visual lab action.
  - Visual Lab now includes Previous day and Next day controls and links back into Watch, Talk, MCQ readiness, Revisit, Track, and the day-specific command room.

- `/upsc/geography/talk` is now the first Socratic Talk room shell.
  - Supports `day=<number>` query routing.
  - Pulls the selected Geography day from the 30-day session model.
  - Provides a five-step prompt ladder: Observe, Explain, Apply, UPSC Angle, Revisit.
  - Includes mentor modes: Map logic, Cause-effect, UPSC trap.
  - Includes local answer drafting, save reflection feedback, confidence marking, and revisit queue toggle.
  - The command room opens the correct Talk room for the selected day.

- `/upsc/geography/track` is now the first local Track room.
  - Talk reflections, confidence state, mentor mode, active prompt, and revisit queue are persisted in browser localStorage.
  - Track page reads the stored state and shows saved reflections, command days, shaky days, revisit queue, and completion percentage.
  - 30-day heatmap links each day back into its Talk room.
  - Revisit queue lists days marked from the Talk room.
  - This is intentionally local-first while cloud/backend persistence is unavailable.

- `/upsc/geography/revisit` is now the first focused Revisit room.
  - Supports `day=<number>` query routing.
  - Reads the same local progress/revisit queue as Track.
  - Lets the student select queued or shaky days.
  - Provides a five-step recovery drill: Recall, Explain, Map, Trap, Retest.
  - Shows the saved Talk reflection as recovery context.
  - Mark recovered clears the local revisit queue flag and keeps a recovery note in the saved reflection.
  - Links back into Talk, visual lab, Track, and MCQ Engine.

- `/upsc/geography/watch` is now the first day-aware Watch/Class room.
  - Supports `day=<number>` query routing.
  - Opens from the selected day inside the Geography command room.
  - Shows the teacher-led class slot, concept objective, map anchor, Talk bridge, and Test bridge.
  - Lets the student mark a class as Queued, In class, or Watched.
  - Persists watched status, class minutes, and class notes in the same local Geography progress record used by Track/Revisit.
  - Links forward into Talk, Visual Lab, MCQ Engine, and Track.

- `/upsc/geography/track` now includes Watch completion.
  - Shows watched class count as a first-class metric.
  - Marks watched days in the 30-day heatmap.
  - Reads `watched`, `watchState`, `watchMinutes`, and `watchNote` from the shared local progress record.

- `/upsc/geography/mcq-readiness` is now the fresh Geography MCQ mapping room.
  - Supports `day=<number>` query routing.
  - Opens from the selected day inside the Geography command room.
  - Generates stable batch codes such as `GEO-D10`.
  - Shows the selected day, week, chapter, topic, batch code, test title, difficulty, and CSV schema.
  - Lets the user plan expected/drafted question counts and see readiness progress.
  - Generates a downloadable CSV template for the selected day and difficulty.
  - Supports Previous day, Next day, and day-grid URL updates.
  - Links to Watch, Talk, Visual Lab, Revisit, Track, bulk upload, and the existing student MCQ engine.
  - Keeps the current direction intact: fresh MCQs are prepared separately; old EduEcosystem MCQs are reference only.

- `/upsc/environment` is now the first reusable subject command room.
  - Built from a generic `SubjectSprintPlan` data model, not a Geography-only component.
  - Uses `SubjectCommandRoom` as a reusable route-level UI pattern.
  - Adds a 20-day Environment plan for July 1-20.
  - Includes week/day selector, Watch/Talk/Test/Track/Revisit session plan, subject lab selector, and fresh MCQ batch contract.
  - Generates stable batch codes such as `ENV-D11`.
  - UPSC landing page now links directly to Environment and marks it as `Structure ready`.
  - Header route label now recognizes `Environment Command`.

- Environment now has reusable deep learning-loop pages.
  - `/upsc/environment/watch` uses the generic `SubjectWatchRoom`.
  - `/upsc/environment/talk` uses the generic `SubjectTalkRoom`.
  - `/upsc/environment/track` uses the generic `SubjectTrackRoom`.
  - `/upsc/environment/revisit` uses the generic `SubjectRevisitRoom`.
  - `/upsc/environment/mcq-readiness` uses the generic `SubjectMcqReadinessRoom`.
  - Environment state persists locally under `sarit-upsc-environment-progress-v1`.
  - The generic rooms save watched status, class minutes, class notes, Talk reflection, confidence, revisit flag, and fresh MCQ template readiness.
  - The Revisit room supports day-specific entry through `?day=<number>`, reads weak or queued days, appends recovery notes, clears the revisit queue locally, and sends Track back to the clean queue state.

Verification:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Browser interaction check: passed for initial render and Week 2 -> Day 10 selection.
- Browser visual lab check: passed for command room -> lab, Earth Layers, Monsoon, India Map, and zero console errors.
- Browser talk room check: passed for command room -> Day 10 Talk room, mentor mode change, UPSC Angle prompt, reflection save, and zero console errors.
- Browser persistence check: passed for Day 10 Talk save -> Track page revisit queue, with zero console errors.
- Browser revisit check: passed for queued Day 10 -> Revisit -> mark recovered -> Track queue cleared, with zero console errors.
- Browser watch room check: passed for command room -> Day 10 Watch room -> mark watched -> Talk -> Track, with zero console errors and zero page errors.
- Browser MCQ readiness check: passed for command room -> Day 10 -> Prepare MCQs -> PYQ_STYLE -> 25/25 ready -> CSV template download, with zero console errors and zero page errors.
- Browser Geography stabilization check: passed for Day 10 Command -> Watch -> Command -> Talk -> Visual Lab -> Command -> Revisit -> MCQ readiness -> Track, including Visual Lab and MCQ Previous/Next day movement, with zero console errors and zero page errors.
- Clean production build passed after Geography stabilization.
- Browser Environment check: passed for UPSC portal -> Environment -> Week 2 -> Day 11, with zero console errors and zero page errors.
- Browser Environment loop check: passed for Day 11 Watch -> mark watched -> Talk reflection -> Track -> MCQ readiness -> CSV template download, with zero console errors and zero page errors.
- Browser Environment revisit check: passed for Day 11 Talk queue -> Revisit room -> mark recovered -> Track queue cleared, with zero console errors and zero page errors.

## Next Decisions Needed

Before deep feature work, the next focused questions are:

1. Should `/upsc` be the default page after paid UPSC access, replacing `/dashboard` for UPSC users?
2. For Geography, should the first functional module be a 3D/visual map lab or the daily session planner?
3. Should the Talk step be UI-only first, or should it connect to an AI tutor immediately?
4. Should fresh MCQ uploads be chapter-wise first or daily-mixed-batch first?
5. Should paid access gating be assumed already handled by the market/payment page, or should MCQ Portal add a local UPSC access guard now?
