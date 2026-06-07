# UPSC Command Local Product Audit

Date: 2026-05-31

Detailed feature register: `docs/UPSC_PORTAL_FEATURE_INVENTORY_2026-05-31.md`

Source-derived subject maturity matrix: `docs/UPSC_SUBJECT_READINESS_MATRIX_2026-05-31.md`

## Executive Status

The portal is a functional local pilot, not yet a production-grade student platform.

| Area | Status | Evidence-based estimate |
| --- | --- | --- |
| Local UPSC route structure | Built | 90% |
| Simplified learner funnel | Functional pilot | 93% |
| Geography pilot | Functional local pilot | 93% |
| Environment shared-flow pilot | Functional local pilot | 75% |
| Other subject shells | Structurally built, master-inspection only until Geography closes | 55-65% |
| Production data persistence | Locally wired; live migration pending | 65% |
| Real student authentication | Supabase branch wired; live OAuth not verified | 60% |
| Legacy API-backed exam suite | Frontend exists, backend unavailable locally | 35% |
| Real lecture assets and fresh MCQ corpus | Incomplete | Content work remains |
| Overall real-student production readiness | Not ready | Approximately 55% |

The strongest usable path is:

`Profile -> Today's Task -> Lesson or Diagnosis -> Discussion to 95% -> Fresh MCQ -> Next Topic`

That loop is locally functional and was browser-tested in the fresh production build. Visual Lab remains available as optional enrichment, while Track and Revisit support the path without interrupting it.

## Build Inventory

### Route and Code Inventory

| Inventory item | Count |
| --- | ---: |
| Generated Next.js application routes | 90 |
| Concrete app page routes | 89 |
| UPSC page routes | 67 |
| Admin page routes | 12 |
| UPSC components | 33 |
| UPSC library files | 43 |
| Browser verifier scripts in `scratch` | 118 |
| Filename-scoped UPSC-related browser verifier scripts | 109 |
| Internal API handlers | 3 |

### Subject Schedule Inventory

| Subject | Study days | Lab modes | Structural status |
| --- | ---: | ---: | --- |
| Geography | 30 | 7 | Dedicated pilot implementation |
| Environment | 20 | 6 | Shared implementation with subject depth |
| Disaster Management | 11 | 7 | Shared implementation |
| Economy | 20 | 7 | Shared implementation with tested sample flow |
| Science and Technology | 20 | 7 | Shared implementation |
| Polity and Governance | 20 | 8 | Shared implementation |
| Internal Security and Society | 20 | 10 | Shared implementation |
| History | 60 | 10 | Shared implementation with dedicated blueprint |
| Total | 201 | 62 | Route-wired locally |

The schedule inventory is not a launch-content claim. The generated subject maturity matrix records `30` local Geography rehearsal definitions and `0` founder-approved live packs. Days 1 and 2 remain honest portal-native drafts, so Content Command reports `28/30` staged locally. Every later subject intentionally remains a planned Content Command state until its real lecture assets are produced.

## Feature Register

### Verified Functional Features

- [x] UPSC Command marketing entry page.
- [x] Student-preview entry for local testing.
- [x] One-question preparation-history intake identifies Beginner, Intermediate, or Advanced.
- [x] Required intake stays small; study preferences remain folded and optional.
- [x] Profile gate before direct entry into subject rooms.
- [x] Four-signal dashboard: Today's Task, Learning Gap, Next Revision, Trend.
- [x] Standardized subject shell with subject-specific accent colors.
- [x] Seven shared subject shells verified for master inspection: Environment, Economy, Disaster Management, Polity and Governance, Science and Technology, Internal Security and Society, History.
- [x] Future subject cards are non-clickable for learners and direct Environment-through-History URLs redirect students to Today.
- [x] Beginner opens one 10-15 minute lesson first; Intermediate and Advanced open explanation-first diagnosis.
- [x] Core learner loop is reduced to Learn -> Discuss -> MCQ -> next topic.
- [x] Direct-route bypasses are closed: Beginner Talk requires lesson proof; experienced Repair stays locked until diagnosis; retry Talk requires repair or revisit proof; cleared Advanced learners skip unnecessary content and move directly to MCQ.
- [x] All 30 Geography learner lessons expose one consistent 12-minute topic contract.
- [x] Today advances from the first incomplete MCQ-command topic and generates one, two, or three syllabus topics from the learner's available study window.
- [x] Talk room accepts speech or typed explanation, creates a local mastery plan, and targets 95% recall.
- [x] Talk room now exposes one teacher-led follow-up question, keeps the longer speaking scaffold folded, persists the learner repair answer and turn count, ignores stale coach responses after edits, and keeps local guidance usable during provider failure.
- [x] Talk client now aborts a stalled adaptive-teacher browser request after 13 seconds, releases the disabled action, and preserves the local repair route instead of leaving the learner waiting indefinitely.
- [x] Geography conditional repair question only for the retry band.
- [x] Strong Geography answers skip repair and route directly to fresh MCQ.
- [x] Shared Talk transcript and teacher tools preserved behind optional drawers.
- [x] Watch room opens as the beginner lesson and remains diagnosis-gated for experienced learners.
- [x] Watch room exposes one finish-and-discuss action and keeps checkpoints optional.
- [x] Geography Day 1 Watch now uses a source-backed 12-minute foundation lesson: what, where, why; absolute-relative location; site-situation; scale; and India map relationships.
- [x] Geography Day 1 Visual Lab now offers five source-backed relationship drills and saves the chosen map proof before MCQ handoff.
- [x] Geography Day 2 Watch now teaches one Universe-to-Earth causal chain through five compact visual stages.
- [x] Geography Day 3 Watch and optional Earth Layers review now teach one seismic-evidence-to-plate-boundary chain through five compact visual stages, with mantle-current motion during Play.
- [x] Geography Day 4 Watch and optional Disaster Link review now teach one denudation chain through five compact visual stages.
- [x] Geography Day 5 Watch and optional Monsoon Simulator review now teach one unequal-heating-to-planetary-winds chain through five compact visual stages.
- [x] Geography Day 6 Watch and optional Monsoon Simulator review now teach one relief-to-current-location chain through five compact visual stages.
- [x] Geography Day 7 Watch and optional Earth Layers review now consolidate the physical-geography foundation through five compact integration stages.
- [x] Geography Day 8 Watch and optional India Interactive Map review now teach one connected relief-to-river-climate-resource-risk framework through five compact stages.
- [x] Geography Day 9 Watch and optional India Interactive Map review now teach one source-to-slope-to-basin-to-outlet drainage method through five compact stages.
- [x] Geography Day 10 Watch and optional Monsoon Simulator review now teach one thermal-contrast-to-variability monsoon sequence through five compact stages.
- [x] Geography Day 11 Watch and optional Monsoon Simulator review now teach one climate-control-to-regional-contrast framework through five compact stages.
- [x] Geography Day 12 Watch and optional Environment Bridge review now teach one soil-formation-to-conservation framework through five compact stages.
- [x] Geography Day 13 Watch and optional India Interactive Map review now teach one resource-and-crop-location framework through five compact stages.
- [x] Geography Day 14 Watch and optional India Interactive Map review now consolidate Week 2 through one layered blank-map drill and five weak-location repair cards.
- [x] Geography Day 15 Watch and optional India Interactive Map review now launch human geography through one indicator-to-pattern population framework.
- [x] Geography Day 16 Watch and optional India Interactive Map review now teach one site-to-hierarchy settlement-classification framework.
- [x] Geography Day 17 Watch and optional India Interactive Map review now teach one resource-input-to-structural-shift economic-activity framework.
- [x] Geography Day 18 Watch and optional India Interactive Map review now teach one node-to-hinterland connectivity framework.
- [x] Geography Day 19 Watch and optional India Interactive Map review now teach one classical-factor-to-modern-cluster industry-location framework.
- [x] Geography Day 20 Watch and optional Environment Bridge review now teach one spatial-gap-to-sustainable-response regional-development framework.
- [x] Geography Day 21 Watch and optional India Interactive Map review now teach one people-to-region human-geography consolidation framework with weak-link repair.
- [x] Geography Day 22 Watch and optional India Interactive Map review now teach one orientation-to-regional-swap atlas-recall framework.
- [x] Geography Day 23 Watch and optional MCQ Engine review now teach one classify-to-retest PYQ trap-reading framework.
- [x] Geography Day 24 Watch and optional Disaster Link review now teach one hazard-to-risk disaster-geography framework.
- [x] Geography Day 25 Watch and optional Environment Bridge review now teach one biome-to-conservation environment-geography framework.
- [x] Geography Day 26 Watch and optional India Interactive Map review now teach one context-to-conclusion mains-answer framework.
- [x] Geography Day 27 Watch and optional MCQ Engine review now teach one physical-to-heatmap full-subject integration framework.
- [x] Geography Day 28 Watch and optional MCQ Engine review now teach one classify-to-schedule weak-area recovery framework.
- [x] Geography Day 29 Watch and optional MCQ Engine review now teach one score-to-retest final-mock review framework.
- [x] Geography Day 30 Watch and optional India Interactive Map review now teach one recall-to-verdict command-day framework.
- [x] Visual Lab remains available as optional map or mechanism support without obstructing MCQ.
- [x] Visual Lab exposes one meaningful written-proof action, rejects thin notes, and folds manual stages.
- [x] Fresh MCQ room exposes one student-only next action, hides batch codes and draft-review language, keeps the preparing state calm, persists completed results across reload, routes weak performance into a short Revisit, and advances a command result directly to the next topic.
- [x] Day 1 fresh-intake boundary blocks a weak one-question CSV, accepts a reviewed 25-question set, dismisses operator toasts before routing back, and opens a clean learner-only practice page without batch, upload, draft-bank, or operator-command leakage. This proves the engine boundary; the final student-grade Day 1 MCQ corpus is still required.
- [x] Shared learner-state labels now say `Practice ready`, `Practice in progress`, `Practice complete`, or `Practice is being prepared`; dashboard, Track, command-page, and overview surfaces no longer expose batch drafting workflow.
- [x] Revisit requires one short correction note, auto-saves it on blur, folds the optional five-point checklist, clears the queue, and returns the student to discussion through one visible action. The permitted compiled MCQ browser journey proves the weak-score route through Revisit and back to Talk on mobile.
- [x] Day-3 spaced-revision targeting is wired to the source topic.
- [x] Subject Track pages route to the next focused action.
- [x] Geography Track exposes one Today's Task action, keeps diagnostics and the 30-day map folded, removes the duplicate closeout panel, hides recovery unless needed, avoids authoring language inside folded diagnostics, and routes a cleared day directly into the next topic.
- [x] Local Readiness Audit, Daily Command, Content Command, MCQ Command, and Revision Command routes load.
- [x] Admin launch-plan page loads on desktop and mobile.
- [x] Admin question bank and bulk upload run in explicit local draft mode without calling the retired API.
- [x] Prelims 2026 Morning Batch V2 audit is master-only and public claims remain locked.
- [x] Internal Prelims audit APIs validate real Supabase sessions before checking master email.
- [x] Local audit API bypass accepts explicit localhost master tokens only.

### Built but Partial

- [~] Supabase authentication branch exists and local public configuration is present.
  Real Google OAuth login has not been proven end-to-end in this local audit.
- [~] Geography Animation Studio has 24 browser-verified portal previews.
  It remains an operator catalog and portal-preview library, not an export-grade Remotion, HyperFrames, or Three.js production library.
- [~] Local teacher scoring, speech capture, gap hints, and the 95% recall gate are functional.
The learner-authenticated server route, structured local fallback, provider isolation, local 12-request burst guard, prepared Supabase distributed limiter, non-local fail-closed boundary, 12-second server timeout, 13-second browser timeout recovery, and persisted prompt/rubric trace versions are functional. Apply the distributed-limiter SQL, configure the server-only Supabase key, add a live Gemini key, and complete streaming UX plus the live evaluation pass before production AI claims.
- [~] Generic `Gaps`, `Progress`, and `Tests` pages exist.
  They are simplified starter surfaces and are not yet fully driven by persisted student analytics.
- [x] Admin bulk CSV import uses explicit local draft mode for the UPSC pilot.
  The demonstration template now carries a UPSC-style Geography row that passes strict quality preflight, saves locally, appears in the review bank, and routes back to the mapped Geography day room.
- [~] Live MCQ publishing remains isolated.
  `NEXT_PUBLIC_ENABLE_LEGACY_API` defaults off until an approved authenticated replacement backend is deliberately verified.
- [~] Legacy API-driven exam interface exists with timer, recovery, autosave, events, integrity warnings, submit flow, and report generation hooks.
  It cannot operate locally because the backend API is not running. Direct exam URLs and the simulation lobby are now master-only so students cannot enter this incomplete path.
- [~] Admin observability and backend question management surfaces exist.
  They depend on the unavailable API backend.

### Not Production-Ready

- [x] Learner profile and subject progress now have a Supabase persistence adapter.
  Profile, daily progress, Talk scores, Watch completion, Lab proof, MCQ outcomes, and Revisit state save locally first and sync to RLS-protected Supabase tables for authenticated students. Remote writes serialize so the newest payload wins; newer offline state retries after hydration or reconnect; logout and authenticated account switches clear learner-only local profile and progress state; mounted UPSC rooms immediately re-run the profile gate after cleanup. Applying the included migration is still required before live use.
- [x] The frontend API environment compatibility mismatch is fixed.
  The frontend now accepts either `NEXT_PUBLIC_API_BASE_URL` or the existing `NEXT_PUBLIC_API_URL`.
- [ ] Local API backend is absent on port `8000`.
- [ ] Real lecture videos, transcripts, detailed visual assets, and fresh MCQ batches are not complete for all 201 days.
- [ ] Real Google OAuth callback and row-level security behavior need a live Supabase verification pass.
- [x] Student-preview and mock-token paths are restricted to `localhost` and `127.0.0.1`.
- [ ] Several older browser verifiers still expect removed cluttered UI and need cleanup or archival.
- [x] The learner-facing `Today`, `Gaps`, `Revise`, `Progress`, and hidden `/tests` fallback now read the Geography learner-state engine.
  The sidebar exposes only the four simple student decisions. The hidden practice fallback follows the same guided learner-state engine and does not expose the legacy batch grid.

## Prelims 2026 Morning Batch V2 Audit

Source folder:

`D:\Graphology\Paid Students\Mians ready Dec 2025\Morning Batch`

### Indexed Corpus

| Item | Count |
| --- | ---: |
| All files | 1,504 |
| Supported documents | 1,247 |
| Non-text or media assets | 257 |
| Supported files with extractable text | 577 |
| Searchable text chunks | 24,131 |
| Empty PDF pages requiring OCR consideration | 14,671 |

### Candidate Matching

| Candidate class | Count |
| --- | ---: |
| Direct candidate leads | 37 |
| Partial candidate leads | 63 |
| Verified public claims | 0 |

These are discovery leads only. The portal correctly keeps the public percentage locked until manual source-page proof and OCR review are completed.

## Verification Evidence

### Passed Today

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `node scratch\verify-student-dashboard.cjs`
- [x] `node scratch\verify-student-signal-pages.cjs`
- [x] `node scratch\verify-upsc-operator-route-gate.cjs`
- [x] `node scripts\verify-supabase-learner-state-static.mjs`
- [x] `node scratch\verify-upsc-intake-self-study.cjs`
- [x] `node scratch\verify-upsc-profile-gate.cjs`
- [x] `node scratch\verify-level-aware-guided-session.cjs`
- [x] `node scratch\verify-generated-daily-path.cjs`
- [x] `node scratch\geography-30-day-simple-flow-e2e.cjs`
- [x] `node scratch\subject-standard-ui-e2e.cjs`
- [x] `node scratch\geography-talk-simple-e2e.cjs`
- [x] `node scratch\subject-talk-maic-e2e.cjs`
- [x] `node scratch\geography-watch-simple-e2e.cjs`
- [x] `node scratch\subject-watch-scenes-e2e.cjs`
- [x] `node scratch\geography-lab-simple-proof-e2e.cjs`
- [x] `node scratch\subject-lab-proof-e2e.cjs`
- [x] `node scratch\geography-mcq-simple-practice-e2e.cjs`
- [x] `node scratch\geography-revisit-simple-e2e.cjs`
- [x] `node scratch\environment-mcq-practice-outcome-e2e.cjs`
- [x] `node scratch\subject-revisit-simple-e2e.cjs`
- [x] `node scratch\upsc-track-revision-targeting-e2e.cjs`
- [x] `node scratch\verify-prelims-audit-v2.cjs`
- [x] `node scratch\admin-launch-plan-e2e.cjs`
- [x] `node scratch\bulk-upload-upsc-csv-e2e.cjs`
- [x] `node scripts\build-upsc-route-inventory.mjs`
- [x] `node scratch\verify-upsc-route-matrix.cjs`
- [x] `node scripts\build-upsc-subject-readiness-matrix.mjs`
- [x] `node scratch\verify-future-subject-isolation.cjs`
- [x] `node scratch\verify-content-rehearsal-boundary.cjs`
- [x] `node scratch\verify-level-aware-guided-session.cjs`
- [x] `node scratch\geography-pilot-simple-loop-e2e.cjs`
- [x] `node scratch\geography-pilot-zero-start-e2e.cjs`
- [x] `node scratch\geography-share-ready-rehearsal-e2e.cjs`
- [x] `node scratch\geography-30-day-simple-flow-e2e.cjs`
- [x] `node scratch\geography-final-audit-e2e.cjs`
- [x] `node scratch\geography-testing-cockpit-e2e.cjs`
- [x] `node scratch\verify-adaptive-teacher-api.cjs`
- [x] `node scratch\verify-adaptive-teacher-evaluation.cjs`
- [x] `node scratch\verify-adaptive-teacher-talk.cjs`
- [x] `node scratch\verify-adaptive-teacher-transition.cjs`
- [x] `node scripts\verify-adaptive-teacher-production-boundary-static.mjs`
- [x] `node scratch\verify-generated-daily-path.cjs`
- [x] `node scratch\geography-day1-source-backed-watch-e2e.cjs`
- [x] `node scratch\geography-day1-map-relationship-lab-e2e.cjs`
- [x] `node scratch\geography-day2-universe-lesson-e2e.cjs`
- [x] `node scratch\geography-day3-plate-lesson-e2e.cjs`
- [x] `node scratch\geography-day4-geomorphic-lesson-e2e.cjs`
- [x] `node scratch\geography-day5-climatology-lesson-e2e.cjs`
- [x] `node scratch\geography-day6-ocean-lesson-e2e.cjs`
- [x] `node scratch\geography-day7-consolidation-lesson-e2e.cjs`
- [x] `node scratch\geography-day8-india-relief-lesson-e2e.cjs`
- [x] `node scratch\geography-day9-drainage-lesson-e2e.cjs`
- [x] `node scratch\geography-day10-monsoon-lesson-e2e.cjs`
- [x] `node scratch\geography-day11-climate-regions-lesson-e2e.cjs`
- [x] `node scratch\geography-day12-soils-vegetation-lesson-e2e.cjs`
- [x] `node scratch\geography-day13-resources-agriculture-lesson-e2e.cjs`
- [x] `node scratch\geography-day14-india-map-drill-lesson-e2e.cjs`
- [x] `node scratch\geography-day15-population-lesson-e2e.cjs`
- [x] `node scratch\geography-day16-settlements-lesson-e2e.cjs`
- [x] `node scratch\geography-day17-economic-activities-lesson-e2e.cjs`
- [x] `node scratch\geography-day18-transport-trade-lesson-e2e.cjs`
- [x] `node scratch\geography-day19-industry-location-lesson-e2e.cjs`
- [x] `node scratch\geography-day20-regional-development-lesson-e2e.cjs`
- [x] `node scratch\geography-day21-human-geography-consolidation-lesson-e2e.cjs`
- [x] `node scratch\geography-day22-atlas-mastery-lesson-e2e.cjs`
- [x] `node scratch\geography-day23-pyq-pattern-reading-lesson-e2e.cjs`
- [x] `node scratch\geography-day24-disaster-geography-bridge-lesson-e2e.cjs`
- [x] `node scratch\geography-day25-environment-geography-bridge-lesson-e2e.cjs`
- [x] `node scratch\geography-day26-mains-geography-application-lesson-e2e.cjs`
- [x] `node scratch\geography-day27-full-geography-drill-lesson-e2e.cjs`
- [x] `node scratch\geography-day28-weak-area-repair-lesson-e2e.cjs`
- [x] `node scratch\geography-day29-final-mock-review-lesson-e2e.cjs`
- [x] `node scratch\geography-day30-geography-command-day-lesson-e2e.cjs`
- [x] `node scratch\geography-content-pack-e2e.cjs`
- [x] `node scratch\geography-week1-content-pack-e2e.cjs`
- [x] `npm run verify:launch-env`
- [x] `node scratch\geography-track-diagnostics-e2e.cjs`
- [x] `node scratch\geography-command-next-action-e2e.cjs`
- [x] `node scratch\upsc-marketing-entry-e2e.cjs`
- [x] Direct browser spot audit of operator and admin routes.
- [x] `git diff --check` with line-ending warnings only.

### Legacy or Intentionally Blocked Checks

- [!] `scratch\verify-mcq-revisit-simple.cjs`
  Exercises a learner-visible Environment path. Environment is intentionally master-inspection-only until the Geography pilot is complete; Geography Revisit is covered by `geography-revisit-simple-e2e.cjs`.
- [!] `scratch\geography-day1-student-journey-e2e.cjs`
  Preserves the earlier controlled-pilot rehearsal with mandatory Visual handoff and pilot feedback return. The current release path is covered by the level-aware, generated-path, Track, MCQ, Revisit, and command-next-action proofs above.
- [!] `scratch\geography-visual-lab-e2e.cjs`
  Preserves the earlier detailed Visual-to-MCQ gate rehearsal. Visual Lab is now optional enrichment and its current behavior is covered by `geography-lab-simple-proof-e2e.cjs`.
- [!] `scratch\environment-mcq-quality-gate-e2e.cjs`
  Expects the previous MCQ planning UI. The current simplified student UI is covered by newer passing checks.
- [!] `scratch\readiness-audit-e2e.cjs`
  Expects a removed UPSC home link. The Readiness Audit route itself loads directly and is functional.
- [!] `scratch\verify-diagnostic-first-loop.cjs`
  Expects baseline entry in Watch. Baseline capture intentionally moved to recall-first Talk.
- [!] `scratch\verify-upsc-shell-standardization.cjs`
  Expects older header copy. The current seven-subject shell is covered by `subject-standard-ui-e2e.cjs`.

## Production Risks

### P0: Student Data Durability

Code complete. Apply `supabase/migrations/20260531_upsc_learner_state.sql` to the live Supabase project, then rehearse profile and progress continuity across two real authenticated browser sessions.

### P0: API Configuration and Backend Decision

The API variable compatibility mismatch is fixed. Direct `/exam/[testId]` and `/simulation/lobby` entry is now hidden from students. Decide whether the legacy MCQ exam backend remains part of the June pilot. If it remains, connect and verify it before exposing any entry action.

### P0: Public Auth Hardening

Code complete for public preview and mock-token restriction. Verify Supabase Google OAuth callback behavior on the deployed student URL.

### P1: Geography Day 1 Launch Content

A source-backed portal-native Day 1 foundation draft now passes locally. The approved-media attachment contract is wired: the learner keeps the verified fallback until a founder-approved recording URL is configured, and the operator console reports recording and transcript status explicitly. Attach the final recorded lecture, transcript approval, detailed visual proof, and fresh MCQ set, then run the controlled student rehearsal.

### P1: Live Adaptive Teacher

The level-aware browser journey, speech capture, local mastery hints, 95% recall gate, learner-authenticated server endpoint, structured fallback, provider isolation, local 12-request guard, prepared Supabase distributed limiter, non-local fail-closed boundary, timeout handling, persisted prompt/rubric trace versions, and a three-band local evaluation harness are functional. Apply the distributed-limiter SQL, configure the server-only Supabase key, add the server-side Gemini key, add streaming response handling, and complete a curated live-provider evaluation pass before using production AI language with students. Follow `docs/GEMINI_LIVE_APPLY_CHECKLIST_2026-05-31.md`.

### P1: Analytics Pages

Geography pilot complete. `Gaps`, `Revise`, `Progress`, and the hidden practice fallback now show genuine Geography learner evidence and one correct next action. Extend the same overview approach only when a later subject becomes student-active.

### P1: Test Suite Cleanup

Archive or update legacy verifiers that target superseded UI. Older operator-screen checks must now use an explicit local master token instead of inheriting local mock admin access. Keep the current funnel checks as the release suite.

### P2: Animation Depth

Build the educational animation library topic by topic after the Day 1 release funnel is stable.

## Recommended Next Sequence

1. Apply the included Supabase learner-state migration to the live project.
2. Verify Google OAuth and cross-session learner-state continuity on the deployed student URL.
3. Decide whether the legacy MCQ exam backend belongs in the June pilot and hide backend-dependent legacy student routes until that decision is implemented.
4. Complete Geography Day 1 real assets and fresh MCQs.
5. Run a real-student rehearsal from login through Day 1 Revisit.
6. Update or archive stale browser verifiers.
7. Proceed to Geography Days 2-30, then Environment.

## Release Hardening Applied Today

- [x] Added `supabase/migrations/20260531_upsc_learner_state.sql`.
- [x] Added an offline-first learner persistence adapter for profile and per-subject progress.
- [x] Wired Geography and shared subject progress hooks to authenticated Supabase sync.
- [x] Wired the student dashboard and UPSC profile gate to hydrate synced profiles.
- [x] Restricted developer login, preview login, query-token login, saved mock restoration, and mock token resolution to local testing hosts.
- [x] Added backward-compatible API environment variable resolution.
- [x] Rebuilt the production bundle and replayed the local student funnel after hardening.
- [x] Replaced fixed learner-page starter copy with Geography engine-backed `Gaps`, `Revise`, `Progress`, and hidden practice fallback surfaces.
- [x] Verified that students see exactly four sidebar decisions and one level-aware learning loop: Learn -> Discuss -> MCQ. Optional India-map support, Revisit, and Track stay available without interrupting the next action.
- [x] Simplified the controlled Geography pilot route to exactly three read-only orientation steps and one current action; verified that a 96/100 discussion score routes directly to MCQ on desktop and mobile.
- [x] Replaced the technical student Settings screen with learning preferences and removed inactive notification and account buttons from the student header.
- [x] Restricted internal UPSC command, readiness, revision, testing, and Prelims audit routes to real master emails or explicit local master tokens.
- [x] Verified that an ordinary local learner is redirected away from all eight internal UPSC route aliases while Geography Talk remains reachable and master access still works.
- [x] Removed the internal Revision Command link from the learner-facing 12-month roadmap and updated the intake regression check to keep it hidden.
- [x] Added a secret-safe static Supabase preflight and a read-only post-migration SQL verification query.
- [x] Added `docs/SUPABASE_LIVE_APPLY_CHECKLIST_2026-05-31.md` for the live migration, OAuth, Vercel environment, and two-browser continuity rehearsal.
- [x] Removed the dead public `Continue as Student Preview` login button while retaining the localhost-only testing bypass.
- [x] Restricted the backend-dependent legacy `/exam/[testId]` and `/simulation/lobby` routes to master access.
- [x] Disabled the simulation prototype launch button and labeled the missing API dependency for master reviewers.
- [x] Replaced unsigned JWT email decoding in internal audit APIs with verified Supabase session lookup.
- [x] Verified that ordinary learner tokens and forged master-email JWTs receive `403`, while explicit localhost master tokens receive `200`.
- [x] Updated the visible admin launch tracker with honest May 31 readiness, live Supabase/OAuth gates, and a current six-day operating plan.
- [x] Added explicit MCQ local draft mode so Bulk Upload and Question Bank do not call the retired backend unless `NEXT_PUBLIC_ENABLE_LEGACY_API=true`.
- [x] Replaced the weak CSV example with a UPSC-style Geography sample and verified local storage, review-bank rendering, Geography day-room handoff, desktop/mobile fit, and zero failed legacy API calls.
- [x] Converted Integrity Logs into a read-only local-control view and removed its non-functional healthy-status button.
- [x] Added a generated route inventory at `docs/UPSC_PORTAL_ROUTE_MATRIX_2026-05-31.md` and a role-aware browser crawler covering public, learner, master-only, redirect, and isolated pages.
- [x] Added a generated subject-content maturity matrix at `docs/UPSC_SUBJECT_READINESS_MATRIX_2026-05-31.md` so schedules, teaching scaffolds, staged class packs, and founder-approved live packs remain visibly distinct.
- [x] Reduced learner choice overload by keeping Geography as the only active subject link and converting Environment through History into non-clickable roadmap cards plus master-only inspection routes.
- [x] Relabeled Content Command as a local rehearsal surface so `28/30` staged-local Geography packs and the Day 1-Day 2 portal-native drafts cannot be mistaken for founder-approved live lecture assets.

## Student Route Access Matrix

| Surface | Student access | Master access | Evidence |
| --- | --- | --- | --- |
| `/dashboard`, `/reports`, `/revision`, `/history`, hidden `/tests` fallback | Allowed | Allowed | Geography learner-state regressions |
| Subject Talk, Watch, Lab, MCQ, Revisit, Track rooms | Allowed after profile and loop gates | Allowed | Subject and Geography browser suites |
| `/settings` | Signed-in students only | Allowed | `ProtectedRoute` wrapper |
| UPSC command, readiness, revision, testing, and Prelims audit aliases | Redirected to `/dashboard` | Allowed | `verify-upsc-operator-route-gate.cjs` |
| `/simulation/lobby` | Redirected to `/dashboard` | Internal prototype only | `verify-upsc-operator-route-gate.cjs` |
| `/exam/[testId]` | Redirected to `/dashboard` | Internal legacy API inspection only | `verify-upsc-operator-route-gate.cjs` |
| `/admin/*` | Redirected to `/dashboard` | Allowed | Admin layout role gate |

## Internal API Access Matrix

| Endpoint | Ordinary learner token | Forged unsigned master JWT | Explicit localhost master token | Real production token |
| --- | --- | --- | --- | --- |
| `/api/admin/prelims-audit-v1` | `403` | `403` | `200` | Supabase session must verify and email must match master list |
| `/api/admin/prelims-audit-v2` | `403` | `403` | `200` | Supabase session must verify and email must match master list |

## Final Local Verification Snapshot

- [x] Production bundle rebuilt successfully with `npm run build`: 90 routes.
- [x] Protected `/admin/feature-inventory` page exposes the verified feature ledger, release gate, and Morning Batch V2 corpus summary inside the operator console.
- [x] Protected Feature Inventory also exposes the Geography Day 1 founder-corpus intake packet and the exact media, transcript, visual-proof, and fresh-MCQ assets still required.
- [x] Added the Geography Day 1 approved-media contract with public-safe recording and transcript variables, real video rendering when configured, a visible operator receipt, and an honest portal-native fallback while the recording remains absent.
- [x] `verify-geography-day1-media-contract-static.mjs` passed 14 checks and `geography-day1-media-contract-e2e.cjs` proved the fallback, missing-asset receipt, desktop/mobile fit, and zero fake approved video elements.
- [x] `verify-geography-day2-universe-lesson-static.mjs` passed 21 checks and `geography-day2-universe-lesson-e2e.cjs` proved the five-stage visual, Talk handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day3-plate-lesson-static.mjs` passed 19 checks and `geography-day3-plate-lesson-e2e.cjs` proved the five-stage visual, Talk handoff, optional Earth Layers proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day4-geomorphic-lesson-static.mjs` passed 19 checks and `geography-day4-geomorphic-lesson-e2e.cjs` proved the five-stage visual, Talk handoff, optional Disaster Link proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day5-climatology-lesson-static.mjs` passed 19 checks and `geography-day5-climatology-lesson-e2e.cjs` proved the five-stage visual, Talk handoff, optional Monsoon Simulator proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day6-ocean-lesson-static.mjs` passed 19 checks and `geography-day6-ocean-lesson-e2e.cjs` proved the five-stage visual, Talk handoff, optional Monsoon Simulator proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day7-consolidation-lesson-static.mjs` passed 19 checks and `geography-day7-consolidation-lesson-e2e.cjs` proved the five-stage integration visual, Talk handoff, optional Earth Layers proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day8-india-relief-lesson-static.mjs` passed 19 checks and `geography-day8-india-relief-lesson-e2e.cjs` proved the five-stage relief-map visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day9-drainage-lesson-static.mjs` passed 19 checks and `geography-day9-drainage-lesson-e2e.cjs` proved the five-stage river-map visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day10-monsoon-lesson-static.mjs` passed 19 checks and `geography-day10-monsoon-lesson-e2e.cjs` proved the five-stage monsoon-sequence visual, Talk handoff, optional Monsoon Simulator proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day11-climate-regions-lesson-static.mjs` passed 19 checks and `geography-day11-climate-regions-lesson-e2e.cjs` proved the five-stage regional-comparison visual, Talk handoff, optional Monsoon Simulator proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day12-soils-vegetation-lesson-static.mjs` passed 19 checks and `geography-day12-soils-vegetation-lesson-e2e.cjs` proved the five-stage geography-environment bridge visual, Talk handoff, optional Environment Bridge proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day13-resources-agriculture-lesson-static.mjs` passed 19 checks and `geography-day13-resources-agriculture-lesson-e2e.cjs` proved the five-stage India location-logic visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day14-india-map-drill-lesson-static.mjs` passed 19 checks and `geography-day14-india-map-drill-lesson-e2e.cjs` proved the five-stage Week 2 consolidation visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day15-population-lesson-static.mjs` passed 19 checks and `geography-day15-population-lesson-e2e.cjs` proved the five-stage human-geography launch visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day16-settlements-lesson-static.mjs` passed 19 checks and `geography-day16-settlements-lesson-e2e.cjs` proved the five-stage settlement-classification visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day17-economic-activities-lesson-static.mjs` passed 19 checks and `geography-day17-economic-activities-lesson-e2e.cjs` proved the five-stage sector-transition visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day18-transport-trade-lesson-static.mjs` passed 19 checks and `geography-day18-transport-trade-lesson-e2e.cjs` proved the five-stage connectivity visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day19-industry-location-lesson-static.mjs` passed 19 checks and `geography-day19-industry-location-lesson-e2e.cjs` proved the five-stage location-factor visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day20-regional-development-lesson-static.mjs` passed 19 checks and `geography-day20-regional-development-lesson-e2e.cjs` proved the five-stage disparity-and-planning visual, Talk handoff, optional Environment Bridge proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day21-human-geography-consolidation-lesson-static.mjs` passed 19 checks and `geography-day21-human-geography-consolidation-lesson-e2e.cjs` proved the five-stage integration-and-repair visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day22-atlas-mastery-lesson-static.mjs` passed 19 checks and `geography-day22-atlas-mastery-lesson-e2e.cjs` proved the five-stage map-recall visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day23-pyq-pattern-reading-lesson-static.mjs` passed 19 checks and `geography-day23-pyq-pattern-reading-lesson-e2e.cjs` proved the five-stage trap-reading visual, Talk handoff, optional MCQ Engine proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day24-disaster-geography-bridge-lesson-static.mjs` passed 19 checks and `geography-day24-disaster-geography-bridge-lesson-e2e.cjs` proved the five-stage hazard-to-risk visual, Talk handoff, optional Disaster Link proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day25-environment-geography-bridge-lesson-static.mjs` passed 19 checks and `geography-day25-environment-geography-bridge-lesson-e2e.cjs` proved the five-stage biome-to-conservation visual, Talk handoff, optional Environment Bridge proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day26-mains-geography-application-lesson-static.mjs` passed 19 checks and `geography-day26-mains-geography-application-lesson-e2e.cjs` proved the five-stage answer-writing visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day27-full-geography-drill-lesson-static.mjs` passed 19 checks and `geography-day27-full-geography-drill-lesson-e2e.cjs` proved the five-stage integrated-revision visual, Talk handoff, optional MCQ Engine proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day28-weak-area-repair-lesson-static.mjs` passed 19 checks and `geography-day28-weak-area-repair-lesson-e2e.cjs` proved the five-stage targeted-recovery visual, Talk handoff, optional MCQ Engine proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day29-final-mock-review-lesson-static.mjs` passed 19 checks and `geography-day29-final-mock-review-lesson-e2e.cjs` proved the five-stage mock-analysis visual, Talk handoff, optional MCQ Engine proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] `verify-geography-day30-geography-command-day-lesson-static.mjs` passed 19 checks and `geography-day30-geography-command-day-lesson-e2e.cjs` proved the five-stage command-closeout visual, Talk handoff, optional India Interactive Map proof persistence, MCQ handoff, desktop/mobile fit, and zero browser errors.
- [x] Replaced the default admin landing page's fabricated demo statistics, unrelated charts, integrity counters, and backend-dependent recalibration control with an honest UPSC operator console.
- [x] `verify-upsc-operator-dashboard.cjs` passed on desktop and mobile, rejected legacy demo copy, and proved learner redirect to `/dashboard`.
- [x] Replaced fabricated Founder Health metrics with a real Geography founder-review center.
- [x] Isolated unsupported Observability, Analytics, and legacy Test Management routes with explicit dependency notices instead of dead API polling or placeholders.
- [x] `verify-upsc-admin-route-isolation.cjs` passed Founder Review desktop/mobile, isolated admin notices, and learner redirect checks.
- [x] `bulk-upload-upsc-csv-e2e.cjs` passed strict Geography quality preflight, local draft save, question-bank review, Geography day-room handoff, desktop/mobile fit, and zero failed legacy API requests.
- [x] Repository sweep found no retired Anti Gravity branding under `src`, `public`, or `docs`; the admin isolation verifier now also covers the honest Integrity Logs status.
- [x] `verify-upsc-route-matrix.cjs` visited all 89 concrete pages with expected destinations, nonblank content, no framework overlays, no retired branding, no unexpected legacy API failures, and no horizontal overflow.
- [x] `geography-week2-content-pack-e2e.cjs`, `geography-week3-content-pack-e2e.cjs`, and `geography-week4-content-pack-e2e.cjs` now prove Days 8-30 remain honestly `STAGED LOCAL`, learner lesson pages use the simplified 12-minute player, Environment stays a planned placeholder, and desktop/mobile layouts have no overflow.
- [x] Final rebuilt-bundle sweep passed the public Geography rehearsal, launch board, feature inventory, simple entry, Talk repair path, operator role gate, Week 1-4 content checks, and the 89/89 route matrix.
- [x] June 3 rebuilt content-depth sweep passed static Geography lesson/media contracts `30/30`, Week 1-4 browser content packs, the final Geography audit, and the `89/89` route matrix.
- [x] TypeScript completed successfully with `tsc --noEmit`.
- [x] Supabase learner-state static preflight passed all 27 checks, including serialized remote writes, offline recovery retries, mounted profile-gate recheck, account-switch reconciliation, learner-state cleanup, and localhost preview-token cleanup.
- [x] Student dashboard, learner signal pages, marketing entry, V2 corpus room, admin tracker, and operator route/API boundary browser suites passed against the rebuilt production bundle.
- [x] `verify-upsc-feature-inventory.cjs` passed on desktop and mobile, reported no overflow or retired branding, and proved learner redirect to `/dashboard`.
- [x] `git diff --check` reported line-ending warnings only.
- [x] Rebuilt local production bundle is available at `http://127.0.0.1:3001`.
- [x] Watch simplification is verified in the rebuilt bundle: the learner sees no visible day switcher or above-player completion shortcut, one player-level completion action saves the five-checkpoint Talk handoff, and approved recording playback completion routes directly into discussion.
- [x] Generated daily-path simplification is verified in the rebuilt bundle: Today remains the only executable learner action while the folded time-aware syllabus allocation renders read-only Current and Queued cards with zero skip-ahead links.
- [x] Dashboard drawer simplification is verified in the rebuilt bundle: the optional current-flow panel exposes zero study-room links and keeps Learn, Discuss, and MCQ as three read-only orientation cards.
- [x] Geography command-room simplification is verified in the rebuilt bundle: fresh Day 1 cannot open future unfinished days even through a typed query, completed or evidence-bearing days remain reviewable, and the optional controls fit desktop and mobile without overflow.
- [x] Geography Track simplification is verified in the rebuilt bundle: both folded maps lock untouched future topics, historical evidence remains reviewable, the redundant deep switcher is absent, and desktop/mobile layouts stay overflow-free.
- [x] Geography Visual Lab optionality is verified in the rebuilt bundle: incomplete proof exposes a direct MCQ return, saved proof requires one meaningful note before persisting five evidence stages, and desktop/mobile layouts stay overflow-free.
- [x] Workspace is linked to the existing Vercel `upsc-command` project, browser-safe Supabase variables are configured, and a protected preview deployment built successfully.
- [x] Authenticated Vercel edge checks return `200` for `/` and `/login`, and the intended `403 Learner access required` for an unauthenticated teacher request.
- [x] Learner classification is verified in the rebuilt local bundle: Beginner opens Watch first, Intermediate and Advanced open Talk diagnosis first, and stale contradictory local profiles normalize before routing.
- [x] Current intake proof requires one explicit preparation-history answer before path generation, keeps daily duration and optional tuning folded, saves the coherent Intermediate self-study profile, renders exactly four dashboard signals, and fits desktop and mobile without overflow.
- [x] Beginner Watch priority is verified: the redundant route-summary panel is absent while the lesson player expands to 616px on desktop and still fits mobile without overflow.
- [x] Watch revisit routing is verified: a Beginner with cleared recall sees one MCQ continuation, while the lesson player and unnecessary repeat-discussion path stay hidden.
- [x] Talk-room learner surface is verified: raw internal `Decision` stage text and steady-state backend labels are removed, one repair follow-up stays visible when needed, a cleared answer removes the duplicate mastery panel, provider failure and timeout preserve one local route, and 96% recall opens MCQ directly.
- [x] Production packaging is hardened: `npm run build` now uses Next.js Webpack mode, avoiding the Windows Turbopack missing-chunk failure observed during local room verification.
- [x] Geography MCQ result routing and first-attempt integrity are verified: active practice hides the competing route panel, unanswered skip-ahead stays disabled, reviewed answers lock after feedback, backward review remains available, weak and command outcomes each expose exactly one continuation action, and Revisit recovery plus next-topic progression remain connected.
- [x] Production packaging clears only the guarded local `.next` output before Webpack compilation, preventing stale server-manifest and client-chunk hash mixing during repeated local builds.
- [x] Geography Revisit is verified as a short repair branch: one correction note is required, the optional recovery checklist stays folded, one return-to-discussion action is visible, and Environment learner routes remain gated while that subject is still a future scaffold.
- [x] Geography Track closeout is verified: one focused next action and three compact read-only signals stay visible, while the 30-day map, evidence ledger, and deep diagnostics remain folded until requested.
- [x] Controlled Geography pilot entry is hardened: approved checked-in testers receive one start or resume action, while unchecked, unapproved, and blocker-paused states expose no lesson or optional-visual bypass.
- [x] Adaptive-teacher request and provider boundaries are hardened in the rebuilt bundle: learner requests require JSON, oversized learner payloads return `413`, non-JSON payloads return `415`, provider bytes are capped before parsing, oversized coaching falls back locally, stale or timed-out browser responses preserve one learner route, and local burst protection returns a no-store `429`.
- [x] Adaptive-teacher browser handoff is hardened: successful API payloads are validated again before persistence, and a malformed `200` response quietly returns to local guidance while keeping the learner's next route visible.
- [x] Geography Day 1 approved-media activation is hardened: learner video requires the approved recording and transcript pair, protocol-relative asset URLs are rejected, and partial attachment remains on the verified portal-native fallback without a fake approved-video element.
- [x] Geography Animation Studio visual-depth pass is verified across all 24 portal previews: Play advances the tilted-Earth orbit continuously inside the protected Universe storyboard, circulates mantle-current markers inside the Earth-interior storyboard, and drives magma ascent, effusive lava advance, and explosive ash lift inside the Volcanism storyboard; Pause remains controlled, desktop/mobile fit passes, and the compact Day 2 learner lesson does not expose the operator-heavy studio link.
- [x] Admin Launch Tracker now exposes one operator-only six-receipt live-release boundary with exact control planes, actions, and receipts for Supabase RLS, Talk limiting, server-side AI configuration, deployed OAuth continuity, the real Day 1 pack, and the first controlled wave; desktop/mobile and blocker stop-sharing proofs pass.
- [ ] Live Supabase apply, deployed Google OAuth continuity, and real Geography Day 1 content rehearsal remain open release gates.
