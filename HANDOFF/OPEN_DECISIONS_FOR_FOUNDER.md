# Open decisions for the founder

These are deliberately **not implemented**. Each one changes what a learner sees, where
learner data lives, or what the product claims — so they are yours, not an agent's.
Every line has file evidence so you can check it without asking. Status of all five as of
2026-11-15: **waiting on you**.

## D0 — Permission to reboot the machine (blocks two tasks)

The host Next compiler has not completed a build or served a page since journey27; the
boot at 2026-10-28 16:28:57 has not been repeated. Until it is, nothing in this app can
be clicked through in a browser, and tasks #35 (verify the copy fixes in a production
bundle) and #53 (review and publish the five Current Affairs drafts) stay blocked.

Tell me to reboot (and when), or do it yourself between tasks, and say which you prefer.
No code change is needed either way.

## D1 — Six admin-only links on the learner's home page

**Evidence.** `frontend/src/lib/navigation/studentNav.ts:59-79` labels `/upsc/question-bank`,
Prelims Showcase, 2027 Strategy, Content Command, MCQ Command and Revision Command as
"NOT student-facing". `upsc/layout.tsx` wraps them in `ProtectedRoute requiredRole="ADMIN"`;
a non-admin is pushed to `/dashboard`, and `app/(dashboard)/dashboard/page.tsx`
`redirect("/upsc")` — so a paying student who taps one of those buttons is silently
looped back to the page they were just on. The Today page renders six such links
(`UpscDailyMissionControl.tsx`).

**Options.** (a) Hide them from learner navigation — small change, honest, and the
operator centres stay where they belong. (b) Make them learner surfaces — then they must
stop being operator routes, which is a real design job (what does a student do in a
command centre?). (c) Leave as-is — students keep meeting a silent loop.

**Recommendation:** (a), plus a static check so learner nav cannot acquire an
admin-gated href again. Your call, because it changes what the home page advertises as
part of the product.

## D2 — Learner history that exists only in the browser

**Evidence.** The legacy half of the loop stores state in `localStorage` keys
`sarit-upsc-student-profile-v1`, `sarit-upsc-student-profile-daily-command-v1`,
`-question-bank-attempts-v1`, `-progress-updated`. Nothing under `frontend/src/services/api`
touches `localStorage`, so none of it can reach the backend. The GS LMS half is
server-backed and correct (`GsLmsStudentSectionProgress`, `GsLmsPracticeAttempt`).

**Consequences today.** A student who clears their phone browser or switches device
loses that progress, and you cannot see it as an operator. It also means any report built
on that half is per-device, not per-student.

**Options.** (a) Sync it — new API surface, a migration, and a merge rule for two
devices. (b) Retire the legacy loop and let the LMS be the single source of learner state
— smaller product, but existing beta students lose whatever history is only on their
device. (c) Keep it, and disclose on-screen that this part is device-only.

**Recommendation:** (b) with (c) as the interim text, since the LMS already tracks the
same loop properly — but retiring a feature is your decision, and (b) has a real cost to
the people already using it.

## D3 — Dead code that still looks alive to a search tool

**Evidence.** No importer outside themselves: the 19-file retired room cluster
(`*SubjectRoutes`, `Subject*Room`, `SubjectFeatureSlot`, `lib/upsc/subjectGuidedStudy.ts`),
`ZenDashboard.tsx`, `UpscCurrentAffairsBridge.tsx`, `lib/upsc/optionalDataResolver.ts`,
`OptionalSubjectLMS.tsx`, `services/api/observabilityService.ts` and its 3 components;
plus unused methods `gsLmsService.getGaps/getSyllabusNode/getDiscussionStatus/updateLearnerLevel`
and `caService.getDailyCount/searchItems`.

**Why it matters beyond tidiness.** These files are what produced the false alarms in the
wiring audit — they still contain retired-room hrefs and calls to endpoints no page can
reach, so every future grep has to be filtered by hand.

**Options.** (a) Delete them (they are recoverable from the working tree history, and
the wiring gate then needs no exclusion list). (b) Move them to a clearly labelled
`retired/` area with a note. (c) Leave them.

**Recommendation:** (a), except keep the legacy `.git_disabled` histories untouched — the
2026-08 policy says preserve alternatives until you approve a reconciliation. Say the
word and an agent can do it in one pass with the gate updated to drop its exclusions.

## D4 — Should `/api/v1/observability` be registered at all?

**Evidence.** `backend/app/api/v1/observability.py` is not mounted in `app/main.py`, and
as written it imports `get_current_user` and never uses it. Its tables are real
(`execution_traces`, `operational_metrics`, `job_execution_registry`). Registering it
unchanged would publish attempt traces and event timelines **without authentication**.
`/admin/observability` currently and deliberately shows a "Legacy Observability"
isolation panel instead.

**Options.** (a) Fix the dependency to `get_current_admin` + add limits, then register —
you gain operator telemetry that production actually needs (it is on the release-blocker
list). (b) Leave it unregistered and delete the module later. (c) Register it as-is — not
recommended, that is an unauthenticated data leak by config.

## D5 — Two pieces of copy that promise things the software does not do

1. **"Sunday AI Retro" / "Sunday AI-Guided Retros"** (`UpscDailyMissionControl.tsx:2046`
   label, plus marketing). `RetroPage.tsx` is a self-reflection form; it calls
   `completeRetro` and makes **no AI request**. Either rename it to what it is ("Sunday
   Review") or build the AI step and pay for it.
2. **`/test-series`** still describes a full-length mock series that does not exist.
   Either build the mocks, reword the page to what is live (topic-level MCQ sets and the
   15-question labs), or take the page down.

Both are honesty issues in front of paying students, so they need your wording call, not
an agent's guess.

## D6 — Small but open: nothing records optional-subject progress events

**Evidence.** No caller invokes `recordProgressEvent`, so optional coverage can never
move from "Not measured yet" to measured. Wiring read/practice/recall events is a product
decision (it also decides what you can truthfully claim about optional-subject
analytics).
