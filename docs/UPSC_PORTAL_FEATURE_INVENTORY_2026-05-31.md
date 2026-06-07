# UPSC Command Feature Inventory

Date: 2026-05-31

This inventory separates verified local behavior from partial wiring and live-dashboard work. A route existing in the build is not treated as proof that it is ready for real students.

## Readiness Legend

| Label | Meaning |
| --- | --- |
| Verified local | Built and exercised against the local production bundle |
| Partial | Code exists, but content depth or live service proof remains incomplete |
| External apply | Local code is ready; a Supabase or Vercel dashboard action is still required |
| Isolated | Retained for internal review but hidden from students |

## Student Experience

| Feature | Status | Current behavior | Evidence |
| --- | --- | --- | --- |
| Marketing entry | Verified local | UPSC Command entry works on desktop and mobile without old branding | `upsc-marketing-entry-e2e.cjs` |
| Local preview entry | Verified local | Localhost study routes open without cloud login for testing | `verify-student-dashboard.cjs` |
| Public Google login | Partial | Supabase OAuth branch is wired; deployed callback rehearsal remains open | `AuthContext.tsx`, live checklist |
| Self-study intake | Verified local | One explicit preparation-history answer identifies Beginner, Intermediate, or Advanced before path generation can continue; daily duration and study preferences stay folded as optional tuning | `verify-upsc-intake-self-study.cjs`, `verify-level-aware-guided-session.cjs` |
| Level-aware guided session | Verified local | Beginner opens a 10-15 minute lesson first; Intermediate and Advanced open explanation-first diagnosis; direct-route bypasses are closed; experienced Repair stays locked until diagnosis; retry Talk requires repair proof; cleared Advanced learners skip unnecessary content and move directly to MCQ; MCQ command advances the generated syllabus path | `verify-level-aware-guided-session.cjs`, `verify-generated-daily-path.cjs` |
| Controlled Geography tester link | Verified local | Shareable Day 1 pilot exposes exactly three read-only orientation steps: Learn, Discuss, MCQ; one current action prevents skip-ahead; a fresh tester can check in, complete the 12-minute lesson, clear discussion at 96/100, complete a reviewed fresh MCQ set at 2/2, save feedback, and still open optional India-map support without making it a gate; blocker feedback pauses the route until review | `geography-pilot-simple-loop-e2e.cjs`, `geography-pilot-zero-start-e2e.cjs`, `geography-share-ready-rehearsal-e2e.cjs`, `geography-testing-cockpit-e2e.cjs` |
| Live conversational AI service | Partial | Browser speech capture, local scoring, a single teacher-led follow-up question, persisted repair answer and turn count, the 95% recall gate, duplicate-submit protection, stale-response rejection, malformed-success recovery, 13-second browser timeout recovery, and provider-failure local continuation work; the provider-isolated server route accepts JSON only, caps learner and provider bytes before parsing, rejects oversized coaching, and keeps deterministic local fallback; the local evaluation harness and Supabase distributed-limiter adapter are ready, while live SQL apply, a server-only Gemini key, streaming UX, and live evaluation remain open | `verify-adaptive-teacher-api.cjs`, `verify-adaptive-teacher-evaluation.cjs`, `verify-adaptive-teacher-talk.cjs`, `verify-adaptive-teacher-transition.cjs`, `verify-adaptive-teacher-production-boundary-static.mjs`, live AI checklist |
| Student dashboard | Verified local | Exactly four visible decisions: Today, Gaps, Revise, Progress; Today advances from the first incomplete MCQ-command topic and exposes a compact time-aware path | `verify-student-signal-pages.cjs`, `verify-generated-daily-path.cjs` |
| Learning preferences | Verified local | Student settings show study preferences without technical controls | `verify-student-signal-pages.cjs` |
| Hidden practice fallback | Verified local | `/tests` follows the active Geography gate and does not expose batch browsing | `verify-student-signal-pages.cjs` |

## Geography Pilot

| Feature | Status | Current behavior | Evidence |
| --- | --- | --- | --- |
| 30-day schedule | Verified local structure | Geography schedule is mapped from Day 1 to Day 30; every command page and lesson page exposes the same 12-minute short-topic contract and exactly three primary steps | `plan.ts`, `geography-30-day-simple-flow-e2e.cjs` |
| Talk room | Verified local | Speech or typed explanation produces one AI-teacher question and stays in repair until the 95% recall target is cleared; the longer speaking scaffold stays folded; the repair answer, turn count, and coach trace persist; direct entry is blocked when the learner still owes a lesson, diagnosed repair, or queued revisit; cleared responses remove the duplicate mastery panel and quiet steady-state backend labels so MCQ is the single forward action | `geography-talk-simple-e2e.cjs`, `verify-adaptive-teacher-talk.cjs`, `verify-adaptive-teacher-transition.cjs`, `verify-level-aware-guided-session.cjs` |
| Watch room | Verified local | Beginner receives a large 10-15 minute lesson first; experienced learners receive the same surface only after diagnosis exposes a repair gap; a cleared experienced learner is routed directly to MCQ instead of reopening content; all 30 learner lessons resolve to the 12-minute contract; Day 1 uses a source-backed foundation lesson, Days 2-6 add compact causal visuals, Day 7 consolidates the first physical-geography week, Days 8-9 open India Map Command with relief and drainage methods, Days 10-11 add monsoon and climate-region sequences, Day 12 bridges soil and vegetation into environment logic, Day 13 adds resource-and-crop location logic, Day 14 consolidates Week 2 through a layered India map drill, Days 15-20 launch human geography through population, settlement, economic-activity, transport-trade, industry-location, and regional-development patterns, Day 21 consolidates the complete human-geography chain with weak-link repair, Day 22 opens Atlas Mastery through orientation, neighboring areas, map layers, quick recall, and regional-swap traps, Day 23 opens PYQ Pattern Reading through tested-idea classification, relationship checks, explanation validity, and repair cards, Day 24 bridges physical geography into disaster risk through hazard, exposure, vulnerability, capacity, and mismatch checks, Day 25 bridges geography into environment through biome controls, habitat logic, biodiversity, climate exposure, conservation regions, and cross-match traps, Day 26 converts knowledge into a 10-marker through context, causal flow, spatial proof, example, conclusion, and fact-dump repair, Day 27 runs the full subject drill through physical base, India map, human outcomes, bridges, and weak-area heatmap repair, Day 28 applies targeted weak-area repair, Day 29 turns final-mock mistakes into a 24-hour queue, and Day 30 closes the sprint with recall, proof, revision lock, and an honest command verdict | `verify-level-aware-guided-session.cjs`, `geography-day1-source-backed-watch-e2e.cjs`, `geography-day2-universe-lesson-e2e.cjs`, `geography-day3-plate-lesson-e2e.cjs`, `geography-day4-geomorphic-lesson-e2e.cjs`, `geography-day5-climatology-lesson-e2e.cjs`, `geography-day6-ocean-lesson-e2e.cjs`, `geography-day7-consolidation-lesson-e2e.cjs`, `geography-day8-india-relief-lesson-e2e.cjs`, `geography-day9-drainage-lesson-e2e.cjs`, `geography-day10-monsoon-lesson-e2e.cjs`, `geography-day11-climate-regions-lesson-e2e.cjs`, `geography-day12-soils-vegetation-lesson-e2e.cjs`, `geography-day13-resources-agriculture-lesson-e2e.cjs`, `geography-day14-india-map-drill-lesson-e2e.cjs`, `geography-day15-population-lesson-e2e.cjs`, `geography-day16-settlements-lesson-e2e.cjs`, `geography-day17-economic-activities-lesson-e2e.cjs`, `geography-day18-transport-trade-lesson-e2e.cjs`, `geography-day19-industry-location-lesson-e2e.cjs`, `geography-day20-regional-development-lesson-e2e.cjs`, `geography-day21-human-geography-consolidation-lesson-e2e.cjs`, `geography-day22-atlas-mastery-lesson-e2e.cjs`, `geography-day23-pyq-pattern-reading-lesson-e2e.cjs`, `geography-day24-disaster-geography-bridge-lesson-e2e.cjs`, `geography-day25-environment-geography-bridge-lesson-e2e.cjs`, `geography-day26-mains-geography-application-lesson-e2e.cjs`, `geography-day27-full-geography-drill-lesson-e2e.cjs`, `geography-day28-weak-area-repair-lesson-e2e.cjs`, `geography-day29-final-mock-review-lesson-e2e.cjs`, `geography-day30-geography-command-day-lesson-e2e.cjs`, `geography-30-day-simple-flow-e2e.cjs` |
| Visual Lab | Verified local prototype | Map and mechanism proof remains optional; Day 1 saves a selected India-map proof, Days 3 and 7 reuse Earth Layers visuals, Day 4 reuses the Disaster Link visual, Days 5-6 reuse their compact boards inside Monsoon Simulator review, Days 8-9 reuse relief and drainage maps inside India Interactive Map, Days 10-11 reuse Indian-monsoon and regional-climate sequences inside Monsoon Simulator, Day 12 reuses its soil-vegetation board inside Environment Bridge, Days 13-19 reuse resource-and-crop, integrated map-drill, population, settlement, economic-activity, transport-trade, and industry-location visuals inside India Interactive Map, Day 20 reuses its disparity-and-planning board inside Environment Bridge, Days 21-22 reuse human-geography consolidation and atlas-mastery visuals inside India Interactive Map, Day 23 reuses its trap-reading board inside MCQ Engine, Day 24 reuses its hazard-to-risk board inside Disaster Link, Day 25 reuses its biome-to-conservation board inside Environment Bridge, Day 26 reuses its answer-writing board inside India Interactive Map, Days 27-29 reuse their integration, targeted-recovery, and mock-review boards inside MCQ Engine, and Day 30 reuses its command-closeout board inside India Interactive Map after discussion clearance before optional MCQ handoff | `verify-level-aware-guided-session.cjs`, `geography-lab-simple-proof-e2e.cjs`, `geography-day1-map-relationship-lab-e2e.cjs`, `geography-day3-plate-lesson-e2e.cjs`, `geography-day4-geomorphic-lesson-e2e.cjs`, `geography-day5-climatology-lesson-e2e.cjs`, `geography-day6-ocean-lesson-e2e.cjs`, `geography-day7-consolidation-lesson-e2e.cjs`, `geography-day8-india-relief-lesson-e2e.cjs`, `geography-day9-drainage-lesson-e2e.cjs`, `geography-day10-monsoon-lesson-e2e.cjs`, `geography-day11-climate-regions-lesson-e2e.cjs`, `geography-day12-soils-vegetation-lesson-e2e.cjs`, `geography-day13-resources-agriculture-lesson-e2e.cjs`, `geography-day14-india-map-drill-lesson-e2e.cjs`, `geography-day15-population-lesson-e2e.cjs`, `geography-day16-settlements-lesson-e2e.cjs`, `geography-day17-economic-activities-lesson-e2e.cjs`, `geography-day18-transport-trade-lesson-e2e.cjs`, `geography-day19-industry-location-lesson-e2e.cjs`, `geography-day20-regional-development-lesson-e2e.cjs`, `geography-day21-human-geography-consolidation-lesson-e2e.cjs`, `geography-day22-atlas-mastery-lesson-e2e.cjs`, `geography-day23-pyq-pattern-reading-lesson-e2e.cjs`, `geography-day24-disaster-geography-bridge-lesson-e2e.cjs`, `geography-day25-environment-geography-bridge-lesson-e2e.cjs`, `geography-day26-mains-geography-application-lesson-e2e.cjs`, `geography-day27-full-geography-drill-lesson-e2e.cjs`, `geography-day28-weak-area-repair-lesson-e2e.cjs`, `geography-day29-final-mock-review-lesson-e2e.cjs`, `geography-day30-geography-command-day-lesson-e2e.cjs` |
| Fresh MCQ practice | Verified local engine | Student sees one reviewed-practice action without batch codes, upload language, or draft-review labels; the calm preparing state remains usable before review; a completed score survives reload; weak performance opens short revision; command performance opens the next generated topic directly; the Day 1 boundary blocks a weak one-question CSV, accepts a reviewed 25-question set, dismisses operator toasts, and returns to a clean learner-only practice page | `geography-mcq-simple-practice-e2e.cjs`, `geography-share-ready-rehearsal-e2e.cjs`, `geography-final-audit-e2e.cjs` |
| Revisit room | Verified local | One short correction note is required and auto-saved; the optional five-point checklist stays folded; one visible action clears the queue and returns to discussion. The permitted compiled MCQ journey proves the weak-score branch through Revisit and back to Talk on mobile | `geography-mcq-simple-practice-e2e.cjs`, `geography-revisit-simple-e2e.cjs`, `geography-final-audit-e2e.cjs` |
| Track room | Verified local | One Today's Task action and three compact read-only signals stay visible; the duplicate closeout panel is removed; diagnostics and the 30-day map stay folded; folded detail avoids authoring language; a cleared day routes directly to the next topic; short revision appears only for a real weak point | `geography-command-next-action-e2e.cjs`, `geography-track-diagnostics-e2e.cjs`, `upsc-track-revision-targeting-e2e.cjs`, `geography-final-audit-e2e.cjs` |
| Animation Studio | Partial | Protected operator catalog and all 24 portal-motion storyboard previews are browser-verified; the first Universe pilot advances the tilted-Earth orbit continuously during Play, the Earth-interior pilot circulates mantle-current markers, and the Volcanism pilot adds continuous magma ascent, effusive lava advance, and explosive ash lift; the compact Day 2 learner lesson stays separate from the operator-heavy studio; Three.js depth and export-grade Remotion or HyperFrames production remain open | `geography-animation-studio-e2e.cjs`, `geography-day2-universe-lesson-e2e.cjs` |
| Real Day 1 pack | Partial | Source-backed portal-native foundation draft and five-choice India map-relationship drill pass locally; approved recording playback activates only when the recording and transcript pair are both attached, while a partial attachment stays on the portal-native fallback; final recorded lecture media, transcript approval, detailed visual production depth, and fresh advanced MCQs remain required | `geography-day1-source-backed-watch-e2e.cjs`, `geography-day1-map-relationship-lab-e2e.cjs`, `geography-day1-media-contract-e2e.cjs`, release gate |

The founder-corpus intake decision is documented in `docs/GEOGRAPHY_DAY1_REAL_CONTENT_INTAKE_2026-05-31.md` and exposed inside the protected Feature Inventory page.

## Shared Subject Structure

| Subject | Status | Notes |
| --- | --- | --- |
| Environment | Master-inspection scaffold | Shared loop and sample evidence exist; real content depth remains incomplete |
| Disaster Management | Master-inspection scaffold | Shared Talk, Watch, Lab, MCQ, Revisit, and Track routes exist |
| Economy | Master-inspection scaffold | Shared structure and sample browser flow exist |
| Science and Technology | Master-inspection scaffold | Shared room routes exist |
| Polity and Governance | Master-inspection scaffold | Shared room routes exist |
| Internal Security and Society | Master-inspection scaffold | Shared room routes exist |
| History | Master-inspection scaffold with blueprint | 60-day shell exists; real content depth remains incomplete |

The source-derived detail is recorded in `docs/UPSC_SUBJECT_READINESS_MATRIX_2026-05-31.md` and exposed inside the protected Feature Inventory page. Across eight subjects, the portal contains `201` planned study days and `62` lab routes. Only Geography has local rehearsal definitions (`30`); Days 1 and 2 remain honest portal-native drafts, so Content Command reports `28/30` staged locally. Founder-approved live packs remain `0`. Environment through History redirect learners to Today while preserving master inspection.

## Learner Data And Authentication

| Feature | Status | Current behavior | Evidence |
| --- | --- | --- | --- |
| Offline-first learner profile | Verified local | Profile saves locally immediately; remote writes serialize so the newest payload wins; newer offline state retries after authentication or reconnect; logout and authenticated account switches clear learner-only local state; mounted UPSC rooms immediately re-run the profile gate after cleanup | `verify-supabase-learner-state-static.mjs`, `verify-student-dashboard.cjs`, `verify-upsc-profile-gate.cjs` |
| Offline-first subject progress | Verified local | Talk, Watch, Lab, MCQ, and Revisit state save locally; remote writes serialize so a slower stale upload cannot overwrite newer progress; newer offline state retries after hydration or reconnect | `verify-supabase-learner-state-static.mjs`, `verify-student-dashboard.cjs` |
| Adaptive teacher API boundary | Verified local | Learner-authenticated no-store endpoint requires JSON, rejects oversized learner payloads before parsing, isolates the provider key on the server, caps provider bytes and coach text before rendering, applies a local 12-request guard, prepares a Supabase-backed distributed limit with non-local fail-closed behavior, enforces a timeout, version-tags prompt and rubric traces, and returns structured local guidance when Gemini is not configured; the browser validates the successful response contract again before persisting teacher trace data | `verify-adaptive-teacher-api.cjs`, `verify-adaptive-teacher-evaluation.cjs`, `verify-adaptive-teacher-talk.cjs`, `verify-adaptive-teacher-transition.cjs`, `verify-adaptive-teacher-production-boundary-static.mjs` |
| Supabase distributed teacher limiter | External apply | Migration, privilege check, hashed request identity, server-only secret adapter, and non-local fail-closed route are prepared. Apply the SQL and configure `SUPABASE_SECRET_KEY` on Vercel before live Talk requests | `20260531_upsc_adaptive_teacher_rate_limit.sql`, `verify-adaptive-teacher-production-boundary-static.mjs` |
| Supabase profile sync | External apply | Adapter exists; live table migration and continuity rehearsal remain open | `verify-supabase-learner-state-static.mjs` |
| Supabase subject progress sync | External apply | Adapter exists; live table migration and continuity rehearsal remain open | `verify-supabase-learner-state-static.mjs` |
| Row-level security | External apply | Migration defines `auth.uid() = user_id` policies | migration and SQL checklist |
| Google OAuth | External apply | Client branch exists; provider callback must be verified on deployed URL | live checklist |

## Operator And Admin Tools

| Feature | Status | Current behavior | Evidence |
| --- | --- | --- | --- |
| Admin Console | Verified local | Default operator landing exposes audited readiness, release gates, next actions, Day 1 source decision, and corpus evidence without legacy sample statistics | `verify-upsc-operator-dashboard.cjs` |
| Launch tracker | Verified local | Shows honest May 31 readiness, pending live steps, controlled tester workflow, and an operator-only six-receipt live-release boundary for Supabase RLS, Talk limiting, server-side AI configuration, deployed OAuth continuity, the real Day 1 pack, and the first controlled wave | `admin-launch-plan-e2e.cjs` |
| Founder Review | Verified local | Seven-point human review center exposes Geography surfaces, release gates, and Day 1 content decision without fabricated health percentages | `verify-upsc-admin-route-isolation.cjs` |
| Integrity Logs | Verified local | Read-only local control view reports localhost preview, local MCQ drafts, and isolated legacy publishing without implying live health proof | `verify-upsc-admin-route-isolation.cjs` |
| Portal route matrix | Verified local | Role-aware browser crawl covers all 89 concrete pages across public, learner, master-only, redirect, and isolated surfaces | `verify-upsc-route-matrix.cjs` |
| Subject content maturity matrix | Verified local | Source-derived audit separates 201 planned days and 62 lab routes from 30 Geography rehearsal definitions and zero founder-approved live packs; Days 1 and 2 remain portal-native drafts | `build-upsc-subject-readiness-matrix.mjs` |
| Feature Inventory | Verified local | Protected operator ledger exposes verified, partial, external-apply, and isolated features plus the exact release gate | `verify-upsc-feature-inventory.cjs` |
| Geography Day 1 approved-media contract | Verified local | Final recording and transcript URLs can be attached through browser-safe deployment variables; students keep the verified portal-native fallback until a founder-approved recording is configured | `verify-geography-day1-media-contract-static.mjs`, `geography-day1-media-contract-e2e.cjs` |
| Daily Command | Verified internal | Operator-only local command screen | role-boundary verifier |
| Content Command | Verified internal | Operator-only local rehearsal screen; staged packs are visibly separated from founder-approved live lecture media and release approval | `verify-content-rehearsal-boundary.cjs` |
| MCQ Command | Verified internal | Operator-only fresh batch screen | role-boundary verifier |
| Revision Command | Verified internal | Operator-only cross-subject revision queue | role-boundary verifier |
| Readiness Audit | Verified internal | Operator-only local readiness screen | role-boundary verifier |
| Prelims 2026 V2 audit | Verified internal | Master-only Morning Batch corpus audit with locked public claim percentage | `verify-prelims-audit-v2.cjs` |
| Question bank and bulk upload | Verified local | Fresh CSV intake, strict quality preflight, local founder-review storage, draft-bank review, and clean Geography learner-room handoff work without calling the retired API or leaking operator toasts | `bulk-upload-upsc-csv-e2e.cjs`, `geography-mcq-simple-practice-e2e.cjs` |

## Security Boundaries

| Boundary | Status | Proof |
| --- | --- | --- |
| Student cannot enter operator UPSC routes | Verified local | Redirects to `/dashboard` |
| Student cannot enter `/admin/dashboard` | Verified local | Redirects to `/dashboard` |
| Student cannot enter `/simulation/lobby` | Verified local | Redirects to `/dashboard` |
| Student cannot enter `/exam/[testId]` | Verified local | Redirects to `/dashboard` |
| Student cannot enter Environment through History scaffolds | Verified local | Future subject roots and rooms redirect to `/dashboard`; master inspection remains available |
| Local learner token cannot call audit APIs | Verified local | Both API handlers return `403` |
| Forged master-email JWT cannot call audit APIs | Verified local | Both API handlers return `403` |
| Explicit localhost master token can call audit APIs | Verified local | Both API handlers return `200` |
| Real audit API token | Partial live proof | Must verify through Supabase and match the master-email list |

## Isolated Legacy Features

| Feature | Status | Reason |
| --- | --- | --- |
| Legacy exam interface | Isolated | UI exists, but the legacy backend API is not running locally |
| Legacy MCQ publishing API | Isolated | Live question-bank publishing stays off by default; enable `NEXT_PUBLIC_ENABLE_LEGACY_API` only after an approved authenticated replacement backend is verified |
| Prelims simulation lobby | Isolated | Master-only prototype; launch button stays disabled until API verification |
| Backend observability screens | Isolated or partial | Admin-only and dependent on the legacy API decision |
| Legacy observability | Isolated | Trace, jobs, metrics, and governance polling disabled until authenticated backend restoration |
| Student analytics | Isolated | Reserved for real learner evidence after the controlled tester wave |
| Legacy test management | Isolated | Retained internally while day-specific fresh MCQ readiness remains the pilot standard |

## Morning Batch V2 Corpus Audit

| Item | Count |
| --- | ---: |
| Indexed local files | 1,504 |
| Supported documents | 1,247 |
| Files with extractable text | 577 |
| Searchable chunks | 24,131 |
| Empty PDF pages requiring OCR consideration | 14,671 |
| Candidate direct leads | 37 |
| Candidate partial leads | 63 |
| Verified public claims | 0 |

Candidate matches remain internal discovery leads. Public coverage stays locked until manual source-page proof and OCR review are complete.

## Release Gate

- [x] Local production build passes with 90 routes.
- [x] Admin Feature Inventory exposes this readiness ledger inside the protected operator console.
- [x] Feature Inventory browser proof passes on desktop and mobile, rejects learner access, and reports no retired branding or console errors.
- [x] Founder Geography corpus triage is visible inside Feature Inventory with reusable source files and founder-required Day 1 assets.
- [x] Default admin landing page exposes only verified UPSC readiness and rejects legacy demo analytics.
- [x] Founder Review replaces fabricated institutional-health percentages with a real seven-point human checklist.
- [x] Unsupported Observability, Analytics, and Test Management routes expose explicit internal-isolation notices without dead API polling.
- [x] Fresh MCQ upload uses explicit local draft mode and completes without failed legacy API requests.
- [x] Integrity Logs is read-only and distinguishes visible local controls from isolated live dependencies.
- [x] Role-aware route matrix visits all 89 concrete pages without blank screens, framework overlays, unexpected legacy API failures, retired branding, or horizontal overflow.
- [x] Source-derived subject maturity matrix separates schedules and teaching scaffolds from staged and founder-approved live class packs.
- [x] Learner roadmap exposes one active Geography pilot link and seven non-clickable future-subject cards; direct future-subject URLs redirect learners to Today.
- [x] Content Command says staged locally rather than implying that rehearsal packs are founder-approved live lecture assets.
- [x] Geography content-pack regressions prove Days 1 and 2 remain visibly `IN PROGRESS`, Days 3-8 remain `STAGED LOCAL`, and the compact operator layout fits desktop and mobile.
- [x] Student-facing navigation is simple and legacy exam surfaces are isolated.
- [x] Internal page and API role boundaries reject learner and forged identities.
- [x] Supabase learner-state hardening passes the expanded local 27-check static preflight: newest-write serialization, offline recovery retries, mounted profile-gate recheck, authenticated account-switch reconciliation, learner-only logout cleanup, and localhost preview-token cleanup are present.
- [x] Level-aware guided session passes in the production bundle: Beginner lesson-first with direct-Talk bypass blocked, zero premature actions above the player, one player-level completion action, Intermediate diagnosis-first with premature Repair locked and retry Talk blocked until repair proof, Advanced direct-MCQ after 95% recall with unnecessary Watch content hidden, optional Visual Lab, speech-control presence, and mobile overflow check.
- [x] Watch simplification passes in the production bundle: visible day jumping is removed, one player-level action saves the five-checkpoint Talk handoff, folded learning details stay hidden until requested, and an attached approved recording opens Talk automatically when playback ends.
- [x] Teacher-led Talk follow-up passes in the production bundle: one visible repair question, one repair action, persisted two-turn evidence, 96% recall clearance, direct MCQ routing, duplicate-submit guard, stale-response rejection, provider-failure continuation, and desktop/mobile fit.
- [x] Adaptive-teacher stalled-network recovery passes in the production bundle: the browser releases the disabled discussion action after 13 seconds, preserves the local recommendation and repair route, and ignores the late coach response.
- [x] Student-only Geography MCQ handoff passes in the production bundle: preparing and reviewed states avoid operator language, weak and command outcomes persist after reload, weak performance opens short revision, strong performance opens the next topic, and desktop/mobile layouts do not overflow.
- [x] Day 1 fresh-intake boundary passes in the production bundle: a weak one-question CSV is blocked, a reviewed 25-question set is accepted, operator toasts are dismissed before routing back, and the learner preview opens without batch, upload, draft-bank, or operator-command leakage. The proof fixture validates the engine; final student-grade MCQs remain a separate content gate.
- [x] Learner-facing Geography state engine no longer exposes drafting or publishing workflow: command page and Track use calm practice-preparing, ready, in-progress, and complete labels; the shared desktop/mobile command proof passes.
- [x] Short Revisit flow requires one auto-saved correction note and one return-to-discussion action; the permitted compiled MCQ journey proves weak-score routing, disabled return before a note, folded checklist, persisted recovery evidence, Talk return, and mobile fit.
- [x] Geography Track simplification passes in the compiled bundle: one visible Today's Task action, no duplicate closeout panel, folded 30-day map, folded diagnostics, direct `Start Day 2` handoff after Day 1 command, desktop fit, and no browser errors.
- [x] Controlled Geography tester link exposes only Learn, Discuss, and MCQ as read-only orientation steps, keeps one current action, prevents skip-ahead jump links, and opens MCQ directly after a 96/100 discussion verdict while optional India-map support remains available.
- [x] Public-link rehearsal carries a fresh beginner through check-in, the 12-minute lesson, 96% Talk clearance, reviewed GEO-D01 MCQ practice, 2/2 command, feedback capture, optional India-map support, desktop fit, and mobile fit.
- [x] All-days Geography rehearsal opens 30/30 command pages and 30/30 lesson pages with the same 12-minute topic label, three-step funnel, desktop fit, mobile fit, and no browser errors.
- [x] Week 2-4 staged-content regressions prove Days 8-30 remain `STAGED LOCAL`, the simplified learner lesson player replaces retired asset-panel copy, Environment remains a planned placeholder, and desktop/mobile layouts emit no browser errors or retired branding.
- [x] Final compiled-bundle sweep passes the 90-route build, the public Geography rehearsal, operator launch board, feature inventory, simple entry, Talk repair path, operator access gate, Week 1-4 content checks, and the 89/89 route matrix.
- [x] June 3 rebuilt content-depth sweep passes static Geography lesson/media contracts `30/30`, Week 1-4 browser content packs, the final Geography audit, and the `89/89` route matrix.
- [x] Generated daily-path proof advances Today from Day 1 to Day 2 after MCQ command, scales the compact topic queue from one to three syllabus topics by study window, labels Current and Queued items, and exposes zero skip-ahead links from the folded queue.
- [x] Dashboard planning drawer proof keeps the main screen to Today, Gaps, Revise, and Progress; the folded current-flow panel renders three read-only Learn, Discuss, and MCQ orientation cards with zero study-room links.
- [x] Geography command-room proof keeps the optional 30-day map useful for review without turning it into a skip menu: future unfinished days stay locked, typed untouched-future URLs return to the current topic, and completed or evidence-bearing days remain open for backward review.
- [x] Geography Track proof applies the same review rule to both folded 30-day maps: saved historical days remain clickable, untouched future topics render read-only, and the duplicate advanced day switcher is removed.
- [x] Geography Visual Lab proof keeps enrichment truly optional: an incomplete learner can continue directly to MCQ, while a learner who wants support can still save one meaningful visual note, record all five visual-proof stages, and open MCQ.
- [x] Track proof keeps the 30-day map folded, hides recovery when command is clear, opens Day 2 directly after completed Day 1, and has no desktop or mobile overflow.
- [x] Geography Day 1 Watch uses the founder corpus: a 12-minute portal-native foundation lesson, five checkpoints, India-map Talk handoff, and mobile no-overflow proof.
- [x] Geography Day 1 Visual Lab adds five founder-corpus map relationships, persists the selected proof, opens MCQ, and fits mobile.
- [x] Geography Day 1 approved-media contract exposes recording and transcript attachment status to operators, renders a real video when approved, and keeps the portal-native 12-minute fallback active without a fake media claim while assets remain absent.
- [x] Day 2 Universe-to-Earth verifier proves five learner visual stages, Watch-to-Talk routing, desktop fit, and mobile fit.
- [x] Day 3 interior-to-plates verifier proves five learner visual stages, continuous mantle-current motion during Play, Watch-to-Talk routing, optional Earth Layers proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 4 geomorphic-process verifier proves five learner visual stages, Watch-to-Talk routing, optional Disaster Link proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 5 climatology-base verifier proves five learner visual stages, Watch-to-Talk routing, optional Monsoon Simulator proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 6 ocean-system verifier proves five learner visual stages, Watch-to-Talk routing, optional Monsoon Simulator proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 7 physical-geography-consolidation verifier proves five learner integration stages, Watch-to-Talk routing, optional Earth Layers proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 8 India-physiography verifier proves five learner relief-map stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 9 Indian-drainage verifier proves five learner river-map stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 10 Indian-monsoon verifier proves five learner sequence stages, Watch-to-Talk routing, optional Monsoon Simulator proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 11 India-climate-regions verifier proves five learner regional-comparison stages, Watch-to-Talk routing, optional Monsoon Simulator proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 12 soils-and-vegetation verifier proves five learner geography-environment bridge stages, Watch-to-Talk routing, optional Environment Bridge proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 13 resources-and-agriculture verifier proves five learner India location-logic stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 14 India-map-drill verifier proves five learner Week 2 consolidation stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 15 population-geography verifier proves five learner human-geography launch stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 16 settlements verifier proves five learner settlement-classification stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 17 economic-activities verifier proves five learner sector-transition stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 18 transport-and-trade verifier proves five learner connectivity stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 19 industry-location verifier proves five learner location-factor stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 20 regional-development verifier proves five learner disparity-and-planning stages, Watch-to-Talk routing, optional Environment Bridge proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 21 human-geography-consolidation verifier proves five learner integration-and-repair stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 22 atlas-mastery verifier proves five learner map-recall stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 23 PYQ-pattern-reading verifier proves five learner trap-reading stages, Watch-to-Talk routing, optional MCQ Engine proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 24 disaster-geography-bridge verifier proves five learner hazard-to-risk stages, Watch-to-Talk routing, optional Disaster Link proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 25 environment-geography-bridge verifier proves five learner biome-to-conservation stages, Watch-to-Talk routing, optional Environment Bridge proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 26 mains-geography-application verifier proves five learner answer-writing stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 27 full-geography-drill verifier proves five learner integrated-revision stages, Watch-to-Talk routing, optional MCQ Engine proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 28 weak-area-repair verifier proves five learner targeted-recovery stages, Watch-to-Talk routing, optional MCQ Engine proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 29 final-mock-review verifier proves five learner mock-analysis stages, Watch-to-Talk routing, optional MCQ Engine proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Day 30 geography-command-day verifier proves five learner command-closeout stages, Watch-to-Talk routing, optional India Interactive Map proof persistence, MCQ handoff, desktop fit, and mobile fit.
- [x] Launch-environment preflight verifies the safe local Supabase browser boundary and prepared SQL migrations without exposing credentials.
- [x] Protected Vercel preview is built from the current 90-route bundle; browser-safe Supabase deployment variables and edge access checks pass without promoting production.
- [x] Classification boundary is verified: one preparation-history answer selects Beginner, Intermediate, or Advanced; stale contradictory profiles self-heal before routing; Beginner opens lesson-first while Intermediate and Advanced open diagnosis-first.
- [x] `verify-upsc-intake-self-study.cjs`, `verify-level-aware-guided-session.cjs`, `verify-generated-daily-path.cjs`, and `verify-student-dashboard.cjs` pass against the rebuilt production bundle with desktop/mobile no-overflow proof.
- [x] Watch handoff edge case is closed: after recall reaches 95%, a direct Watch revisit hides the lesson player and opens MCQ instead of looping the learner back into discussion.
- [x] Talk simplification is verified: learners see recall score, one repair follow-up when needed, and one next action; raw internal route-stage labels stay hidden.
- [x] Production build now uses Next.js Webpack mode after Windows Turbopack emitted missing dynamic client-chunk references; the stable bundle compiles 90 routes and the route crawler passes 89/89 pages.
- [x] Geography MCQ result routing is simplified: weak and command outcomes each expose exactly one learner continuation action, while Revisit recovery and next-topic progression remain connected.
- [x] Geography MCQ first-attempt integrity is verified: active practice hides the competing route panel, unanswered skip-ahead stays disabled, reviewed answers lock after feedback, backward review remains available, and the Day 1 quality boundary still rejects a weak one-question launch set before accepting 25 reviewed questions.
- [x] Production packaging clears only the guarded local `.next` output before Webpack compilation, preventing stale server-manifest and client-chunk hash mixing during repeated local builds.
- [x] Geography Revisit is verified as a short repair branch: one correction note is required, the optional recovery checklist stays folded, one return-to-discussion action is visible, and Environment learner routes remain gated while that subject is still a future scaffold.
- [x] Geography Track closeout is verified: one focused next action and three compact read-only signals stay visible, while the 30-day map, evidence ledger, and deep diagnostics remain folded until requested.
- [x] Controlled Geography pilot entry is hardened: approved checked-in testers receive one start or resume action, while unchecked, unapproved, and blocker-paused states expose no lesson or optional-visual bypass.
- [x] Adaptive-teacher boundary hardening passes in the rebuilt bundle: learner requests require JSON, oversized learner payloads return `413`, non-JSON payloads return `415`, provider bytes are capped before parsing, oversized coaching falls back locally, stale or timed-out browser responses preserve one learner route, and local burst protection returns a no-store `429`.
- [x] Modernized Geography final-audit regression proves the current simplified Day 13 lesson -> Talk 100/100 -> reviewed MCQ 2/2 -> Day 14 path and the Day 10 weak-answer -> one saved short revision -> Talk-ready recovery branch on desktop and mobile.
- [x] Adaptive-teacher client handoff is hardened in the rebuilt bundle: successful API payloads are validated again in the browser, a malformed `200` response falls back to local guidance, and the learner keeps one visible route.
- [x] Geography Day 1 media activation is hardened: approved playback requires the recording and transcript pair, protocol-relative asset URLs are rejected, a partial attachment remains on the honest portal-native fallback, and the learner rehearsal renders zero fake approved-video elements.
- [x] Geography Animation Studio visual-depth pass is verified across all 24 portal previews: the Universe storyboard advances the tilted-Earth orbit continuously during Play; the Earth-interior storyboard circulates mantle-current markers; the Volcanism storyboard adds magma ascent, effusive lava advance, and explosive ash lift; Pause remains controlled; the protected studio fits desktop/mobile; and the Day 2 learner lesson exposes no operator-heavy studio link.
- [x] Admin Launch Tracker now exposes one operator-only six-receipt live-release boundary with the exact Supabase, Vercel, OAuth, content, and controlled-wave proof required before sharing; the rebuilt desktop/mobile regression passes without overflow.
- [x] Self-study classification is simplified and verified in the rebuilt bundle: one explicit preparation-history answer is required before path generation, optional duration stays folded, Beginner routes into the enlarged lesson-first player, and Intermediate or Advanced still route into diagnosis-first Talk.
- [x] Talk-room simplicity is verified in the rebuilt bundle: weak recall keeps one mastery repair prompt, cleared recall removes the duplicate mastery panel, steady-state backend labels stay hidden, provider timeout preserves one local route, and the 95% clearance path opens MCQ directly.
- [ ] Configure the server-side Gemini key, add streaming UX, and evaluate the live provider before describing the teacher as production AI.
- [ ] Apply the live Supabase learner-state migration.
- [ ] Configure and verify Google OAuth callbacks on the deployed URL.
- [ ] Prove same-account recovery and different-account isolation across browser profiles.
- [ ] Attach the final recorded Geography Day 1 lecture, transcript approval, detailed visual proof, and fresh MCQs.
- [ ] Run the first controlled tester wave and repair every blocker before widening.
