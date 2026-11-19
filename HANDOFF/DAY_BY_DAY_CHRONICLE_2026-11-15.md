# Day-by-day chronicle — MCQ Portal / UPSC Command

Evidence-based, not remembered. Source: `scripts/handoff_mtime_map.cjs` (raw output at
`RAW_MODIFICATION_MAP_2026-11-15.txt`), the dated sections of
`frontend/docs/workspace-audits/BUILD_GATE_STATUS.md`, `LEARNER_PURPOSE_MATRIX.md`,
`UPSC_FEATURE_WIRING.md`, and the project memory file.

Measured span: **2026-05-11 → 2026-11-15, 69 distinct working days**, of which 62 fall
before 2026-10-01. Git is not a usable clock: the repo has two commits, both dated
2026-07-06, while the working tree holds work through November and **nothing from the
audit era has been committed**.

## 2026-05-11 → 2026-09-07 — inherited history (62 days)

Summarised, not re-verified. The authoritative chronicle is
`DOCS/ANTI_GRAVITY_HANDOFF_2026-08-26.md` — read its §3.2 timeline, §8 P0/P1 blockers
and §9 approved/prohibited decisions before touching payments, deployment, migrations or
content generation. Headline: a 10-portal monolith was slashed down after the founder's
honest conversation with students (turning point **2026-03-22**); the clean-slate MCQ
Portal workspace began April 2026; recovery ran as Waves A–D locally, while Waves E–G
(staging DB, providers/payments, release) were **never completed**; the feature registry
recorded 47 features with zero `PRODUCTION_VERIFIED`. Local slices D1–D3 fixed
provider/API contracts, retry/unavailable boundaries and content/schema safeguards
without reading secrets or writing to a database. Topic 1's five-section contract was
repaired deterministically on 2026-08-26; Topics 26/27 were knowingly left incomplete
rather than filled with invented MCQs.

## 2026-10-27 → 2026-11-15 — the audit era (first-hand)

| Date | Files touched | What was solved | What was navigated |
| --- | --- | --- | --- |
| **10-27** | 4 | Audit kickoff: full feature inventory, live UI audit with screenshots, Mobbin reference mapping, technical health signals, interactive HTML report (`audit-2026-10-27/`). Readiness engine started (`readiness_models.py`, `test_readiness_engine.py`); `GapsPage.tsx`, `LmsProgressCard.tsx`. | Found the pattern that drives everything after: a failed read was being displayed as empty data. |
| **10-28** | 57 | Readiness schema + drift repair; Gaps dashboard replaced by Readiness with honest confidence states; hard discussion lock removed; content-access failure modes fixed; auth roles hardened and GS LMS entitlements enforced (`ProtectedRoute.tsx`, `AuthContext.tsx`, `access-events.ts`, `client.ts`, `validate-auth-role-hardening.mjs`). | The host booted **16:28:57** and has not rebooted since. Builds that had been stalling for weeks (H15) went permanently dead around this window; journey27 was the last bundle to compile. |
| **10-29** | 81 | Paid-beta scope decided with the founder. Every Geography learner surface audited against the five learner questions; practice/MCQ, revision/revisit/planner defects fixed; entitlement enforcement made mandatory at production startup; operator content-coverage view; per-topic UPSC demand strip; CSAT seeding hardened; beta scoping; CSAT hidden from learner nav; honest Mains outcome estimate. Also: 36 dangling learner rows from the June reseed deleted (`production.db.bak-orphan-repair-20261029155246`), `PRAGMA foreign_keys=ON` per connection, destructive orphan script replaced by a read-only auditor. | 16 defects of the "the screen claims what the data does not support" class, each fixed with a test rather than a screenshot: growth "0%" → "Not taken"; unevidenced sections averaged as zero; a zero recall score presented as an attempt; revisit completion never reaching the planner; MCQ Lab 409 as a dead end; the first lab visit logging a 404 on every open; practice listing topics with no reviewed set; Mains PYQs counted in demand while the API reported only Prelims; the planner implying one topic a day; two schedules both labelled "recall"; **the planner scheduling a locked topic and sending a learner into a 409**; onboarding offering a locked first leaf then rejecting its own default with 422; the Mains reference answer hidden though all 30 stored Mains PYQs have one. |
| **10-30** | 101 (incl. 49 legacy room `page.tsx` stubs = 7 locked subjects × 7 rooms) | `BUILD_GATE_STATUS.md` opened as the release-gate ledger. Pricing quotas removed and marketing aligned to the live product (founder-approved); locked subjects' legacy day rooms given redirect stubs (founder-approved); Current Affairs authoring pipeline built with the first sourced items; RBI MPC item cleared verification; the admin CA API now rejects the taxonomy that corrupted the feed; optional-subject workspace audit ("what is real and what the frontend invents"). Live backend checks green on :8000 (`/health` 200, `/auth/me` resolves ADMIN, coverage API agrees on 28/69). | Five webpack builds and one Turbopack build frozen mid-compile; dev server tried as a lighter path (240 s timeout, then a port that bound and answered nothing). Reboot identified as the unblock; the founder was asked rather than bypassed. Old `1208 passed` figure found stale — 1188 is current. |
| **10-31** | 19 | Two founder decisions executed: delete the 11 same-origin optional route handlers so optional data can only come from FastAPI, and mark Anthropology and Sociology coming-soon until content is reviewed. Optional learner surfaces made to fail honestly (`PyqExplorer`, `ReadView`, `SyllabusView`, `PracticeBoard`, `GapPanel`: clear data, record `"error"`, retry with a real call; PYQ rows render only when `REVIEWED`; coverage says "Not measured yet"). Two more sourced CA drafts (five total, ids 2–6). Gemini key moved out of the discuss-route URL. `EXAM_PORTABILITY_AUDIT.md` written. | Verified what is actually in the DB: only Geography optional has reviewed content (14 nodes, 26 PYQs); Sociology has 69 unreviewed nodes and no content; Anthropology has no row, so its endpoints 404. The 131st Amendment item resolved by reading PRS in full (introduced 16 Apr 2026, **negatived** 17 Apr 2026). The tiger item teaches 3,682 with its round named and states the increase is not in a published NTCA report. COP 31 host/dates **left out** because `unfccc.int/cop31` is not quotable and `pib.gov.in` 403s to automated fetch. |
| **11-01** | 0 | — | No source changes. The portability detour opened 10-31 and the founder's "start with the UPSC only" correction landed before the next pass. |
| **11-02** | 16 | **UPSC-only wiring pass** (`UPSC_FEATURE_WIRING.md`): 181 served FastAPI routes dumped, every `apiClient` path diffed against them, every internal `href`/`router.push`/`redirect` diffed against the real 171-page tree, callers counted for `gsLmsService` (36 methods) and `caService` (15), each loop's write side paired with its read side. Verdict: the loop is logically wired, the routing was broken. Five fixes: locked subjects no longer 404 (`lms/layout.tsx` renders `SubjectNotOpen`); the planner CTA and ~35 room hrefs resolve through `lib/upsc/lmsRoomRouting.ts`; the Today retro button stops pointing at a route that never existed; syllabus-loop stages stop 404ing; `/admin/cms` gained the missing status actions so a CA draft can be published in-app, plus a real failure panel. New gate `npm run verify:upsc-wiring`. | Compiler re-probed rather than remembered (`✓ Ready in 710ms`, then `http=000` on two 45 s curls; the stale PID on the dev port killed and it did not help). An import typo surfaced only because `tsc` works. Two harnesses produced false positives before being trusted (query strings left in paths; `${slug}` sampled as a literal `x`). Importer counting prevented wrong "fixes" to `ZenDashboard`, `UpscCurrentAffairsBridge` and the observability endpoints. New gate failed twice on its own first run (a dead-code file, then my own docstring) and was then mutation-proven. |
| **11-03 → 11-14** | 0 | — | Nothing moved for twelve days. The unblock was a reboot, not effort. Tasks #35 and #53 stayed blocked the whole time. |
| **11-15** | this folder | Founder asked for the handoff. All static gates re-run green (see `VERIFICATION_GATES_2026-11-15.md`); chronicle built from timestamps; the three open decisions and the copy decisions written up for sign-off. | The leftover background dev server from 11-02 was found still running on :3111 and stopped. Discovered that `eslint` takes over 5 minutes for 11 files on this host, and that `verify:optional-catalog-routes` has no npm alias despite the script existing. |

## Standing gaps that no day closed

1. No browser verification exists for anything after journey27.
2. Five Current Affairs drafts are sourced and none is `PUBLISHED`, so the learner-visible
   count is still 0.
3. Payments remain closed.
4. Real auth, staging, Postgres 16 cutover, Cashfree onboarding and the security headers /
   rate-limit review are untouched.
5. Three product decisions (§8 of the handoff, and `OPEN_DECISIONS_FOR_FOUNDER.md`) are
   still the founder's to make.
