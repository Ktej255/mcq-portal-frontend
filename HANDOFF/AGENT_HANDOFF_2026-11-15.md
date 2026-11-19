# MCQ Portal / UPSC Command — agent handoff

Written 2026-11-15 for the next agent who picks this workspace up. It records what
was done, on which day, what broke, what was tried that did not work, and what is
still owed to the founder. Everything here is traceable to a file you can open.

Working copy: `D:\Development\MCQ Portal` (Windows, Git Bash). Frontend
`frontend/` = Next.js **16.2.6** (App Router, Turbopack) + React **19.2.4**.
Backend `backend/` = FastAPI on `venv` Python 3.11.9, local SQLite
`backend/production.db`.

This file is one of five in `HANDOFF/` — the folder an incoming agent should open first.
Siblings: `README.md` (index + the five standing rules),
`DAY_BY_DAY_CHRONICLE_2026-11-15.md`, `VERIFICATION_GATES_2026-11-15.md`,
`OPEN_DECISIONS_FOR_FOUNDER.md`, plus `scripts/` and the two raw evidence dumps.

---

## 0. Read this first

**What the product is.** A paid beta for UPSC aspirants, sold by a UPSC educator
(founder profile and teaching methodology: `DOCS/FOUNDER_JOURNEY_AND_CONTEXT.md`).
Today the open subject is **Geography**: of its 69 visible syllabus leaves, **28 are
loop-ready** and open to a beta learner; the other 41 say "In preparation". Among the
*optional* subject catalog, only Geography optional carries reviewed content.
Everything else — the other GS subjects, the other 24 optionals, CSAT — is locked,
hidden, or coming-soon **on purpose**.

**Why the copy is like this.** The founder teaches from two proven constructs, and the
software must mirror them rather than invent: the **21-question subject mastery** frame
(each subject distilled into ~21 questions that cover the syllabus) and the **Mains
answer-writing loop** (20 min write → 60 min study the model answer, hidden topics and
connecting knowledge → 20 min rewrite → 10 min report). "Hidden topics" and "connecting
knowledge" are his terms for what examiners expect but the question text does not say.
Read `DOCS/FOUNDER_JOURNEY_AND_CONTEXT.md` §3–§5 before changing any learner-facing
copy: it also lists the four earlier architecture failures (WordPress LMS, the 10-portal
monolith, 40,000-question CSV dumps that corrupted the schema, and this clean-slate
MCQ Portal) and the lesson each produced.

**What the state is.** The learning loop is real and server-backed: a learner's
section completion, practice attempts, revisits and retro are written to database
rows that the next feature reads. The defects found in the last three weeks were
mostly *honesty* defects (a surface claiming something no code does) and
*routing* defects (a live button linking to a page that no longer exists). Both classes
were fixed in source wherever they were reachable, and the few deliberately left open
are in §8 — they change wording a student reads, so they are the founder's call. None of
it has **browser proof**, because of hardship H1.

**The one thing to know before you type a command.** This host cannot compile the
frontend: neither `next build` nor `next dev` has completed since the boot on
2026-10-28, and builds were already flaky for weeks before that (H15). Do not spend
your first hour rediscovering this; section 3 proves it and gives the substitutes that
do work.

---

## 1. The founder's rules of engagement (non-negotiable)

These are not style preferences. Each one came from a correction he made out loud.

1. **Understand first, then fix, then align.** His words: "what is there in the
   software first you need to see think understand … you are supposed to be fix
   the existing code base or software or feature and then … step by step …
   whatever features are there is it properly aligned link". Read before you edit;
   finish one feature's chain before starting the next.
2. **UPSC only.** The multi-exam / "any competitive exam" portability direction is
   **deprioritised and unauthorised**. `EXAM_PORTABILITY_AUDIT.md` exists as
   background; acting on it is not. Task #61 must not be resumed without a fresh
   yes.
3. **Ask before deciding.** "before taking any decision … For confirmation, you can
   ask from me." Scope changes, pricing, retiring a feature, moving data, deleting
   code → his call. Findings 8.1–8.3 below are held for exactly that reason.
4. **Honest surfaces.** Never present locked content as open, never report a failed
   read as an empty queue, never claim an AI call that no code makes, never promise
   a score, rank, or selection. This is the product's differentiator, not decoration.
5. **Nothing is committed unless he asks.** As of this writing the repo still has
   its original two commits and ~979 dirty paths. Never `git add -A` here (see 10).
6. **Secrets stay sealed.** Do not print, paste, test, copy, or commit values from
   `.env` files. Unrelated Pizza Blitz Vercel token must never be touched.
7. **Payments stay closed.** `READY_FOR_PAYMENT = false` until his sign-off plus
   Cashfree KYC/keys/webhook registration, sandbox testing and schema repair.
   Pilot checkout records plan *intent* only; it must never claim an active
   subscription or reallocated quota.
8. **Production = Postgres 16.** Local SQLite cannot be migrated in place from
   empty. Back the database up before any DDL.

---

## 2. Environment runbook (what works on this host)

Verified commands, re-run 2026-11-15:

| Purpose | Command | Result today |
| --- | --- | --- |
| Type check all 400+ frontend files | `cd frontend && npx tsc --noEmit` | works (this is the real gate) |
| Lint changed files | `npx eslint <paths>` | works |
| Wiring gate (6 checks) | `npm run verify:upsc-wiring` | see §7 |
| API base-url fixtures (5) | `npm run verify:api-base` | see §7 |
| Launch env boundary | `npm run verify:launch-env` | see §7 |
| Auth role hardening | `npm run verify:auth-role` | see §7 |
| Optional honesty (16 checks) | `npm run verify:optional-honest-failure` | see §7 |
| Optional catalog routes (9 checks) | `node scripts/validate-optional-catalog-routes.mjs` | works; **there is no npm alias for it** — a previous agent burned time on `verify:optional-catalog-routes`, which does not exist |
| Backend suite | `cd backend && venv/Scripts/python.exe -m pytest -q` | last full run 2026-10-31: **1188 passed** (an older doc says 1208; that number is stale) |
| Production build | `npm run build` / `node scripts/build-isolated.mjs` | **broken — H1** |
| Dev server | `npx next dev -p <port>` | binds, compiles nothing — H1 |

There is **no frontend unit-test runner in use**. Regression cover for the frontend
is the static `frontend/scripts/validate-*.mjs` + `verify:*` convention. When you
fix something user-visible, add a check to an existing validator or a new
`validate-*.mjs` + npm script, and prove it can fail by planting the bug once.

Search tooling: recursive `grep`/ripgrep over the whole repo **times out** (it has
happened twice). Use the scoped Grep tool per directory, or a Node walker with a
SKIP set (`node_modules`, `.next*`, `__pycache__`, `.git`, `.git_disabled`, `venv`).

React gotcha that bit twice: the `react-hooks/set-state-in-effect` rule fails a
`void load()` directly inside `useEffect`. The house pattern is to defer one tick:

```tsx
useEffect(() => {
  const timer = window.setTimeout(() => { void load(); }, 0);
  return () => window.clearTimeout(timer);
}, [load]);
```

---

## 3. The blockade, in full (hardship H1)

- **Origin:** the host booted 2026-10-28 16:28:57 and has not been rebooted since. Note
  the decline started earlier than the boot (H15: stalled builds back at journey10–26),
  so a reboot is the *known* unblock rather than a proven cure — if builds still freeze
  after one, look at competing Next builds and heap before blaming the code. The ledger
  does not pin journey27 to a calendar day, only to being the last build that finished.
- **Last good build:** journey27 — exit 0, 4.9 min compile, TypeScript 39.2 s,
  **215 static pages**, then a 65-check browser journey against `.next-build-journey27`
  served by `next start` on :3000 with the backend on :8000
  (`GS_LMS_ENFORCE_ACCESS=true`, `GS_LMS_BETA_SCOPE=true`, `ALLOW_MOCK_AUTH=true`).
- **What failed after it:** journey28 ×2, journey29, journey30, journey31 (webpack)
  and turbo1 (Turbopack) each froze at "Creating an optimized production build…"
  with process CPU stuck at ~95–105 s while the host sat at ~4% idle. Deleting
  `.next`, a fresh `NEXT_DIST_DIR`, a 6144 MB heap, CI mode and disabled telemetry
  changed nothing. journey33 froze identically (CPU 104.16 → 104.84 s over 34 s wall).
- **Dev mode is blocked too:** 2026-10-30 — "Ready in 32.3s", then a request for
  `/upsc/answer-upload` produced no compile log and timed out at 240 s. Same day,
  `npm run dev` on :3001 wrote no stdout/stderr at all and 16 probe requests got no
  response. 2026-11-02 — killed the stale `PID 17456` squatting :3111, confirmed the
  port free, started a fresh server: `✓ Ready in 710ms`, then two 45-second curls to
  `/` and `/upsc/geography/lms` both returned `http=000`.
- **Conclusion:** the host Next compiler, not a stuck process, not a port conflict,
  not the code. **A reboot is the only known unblock.** The previous agent asked the
  founder for permission rather than rebooting his laptop; that question is still
  unanswered as of 2026-11-15.
- **Consequence you must respect:** every claim in the docs written after
  2026-10-28 is *source* evidence. Say so in your own reports. Tasks #35 and #53 are
  blocked on this, not on code.

---

## 4. Architecture you must hold before editing

**4.1 The request chain.** Browser → `services/api/client.ts` (axios).
`services/api/base-url.mjs::normalizeApiBaseUrl` hardcodes the browser to request
`/api/v1/...` (`API_VERSION_PATH = "/api/v1"`). `next.config.ts` has a `fallback`
rewrite sending that to `buildApiRewriteDestination(backendUrl)`, which **defaults to
`http://localhost:8000`** when `NEXT_PUBLIC_API_BASE_URL` is unset (`next.config.ts:16`)
→ FastAPI (`app/main.py`). That default is a release blocker, because a deployed site
would point at itself.

**4.2 The learner loop, write side → read side.** This is the thing the founder asked
you to verify, feature by feature. It is genuinely wired:

| Loop step | Written by | Read by |
| --- | --- | --- |
| Onboarding | `POST /gs-lms/{s}/onboarding/complete` | planner, content gating |
| Read a section | `POST …/topics/{n}/sections/{id}/complete` → `GsLmsStudentSectionProgress` (`content.py:481-499`) | `progress.py::_compute_progress`, `planner.py:355`, `pdf.py:77` |
| Practice MCQs | `GsLmsPracticeAttempt` (`practice.py:382`, plus legacy `Attempt` at `:141`) | readiness engine, gaps |
| Revisit / recall gate | `revisits/{id}/complete`, `recall-gate` | LMS planner gate |
| Retro | `retro/complete` | progress reporting (`RetroPage.tsx:68`; **no AI call**) |
| Current Affairs | `PUBLISHED`-gated feed (`ca_engine.py:103-106`) | learner feed |

**4.3 Which subject is open.** `frontend/src/lib/gsLmsRoutePolicy.ts` —
`SUPPORTED_GS_LMS_SUBJECTS = { geography }`, `getSupportedGsLmsSubject()`,
`lmsBaseForSlug()`. Anything not in that map is not open, and the LMS layout must say
so honestly rather than 404.

**4.4 Workspace routes and tabs.** Tabs come from `LMS_TABS` in
`components/gs-lms/pages/LmsLayoutShell.tsx`: Today (`planner`, `retro`), Syllabus
(`syllabus`, `topic`), Practice (`practice`), Readiness (`gaps`). Pages live under
`app/(dashboard)/upsc/[subject]/lms/{onboarding,planner,syllabus,topic/[nodeId],
practice,practice/[sessionId],gaps,retro}`.

**4.5 The single room→tab map.** `frontend/src/lib/upsc/lmsRoomRouting.ts` (created
2026-11-02) maps the retired day-room names onto LMS tabs — `watch|talk → syllabus`,
`mcq-readiness|lab → practice`, `revisit → planner`, `track → gaps`, `retro → retro` —
and `lmsHrefForRoom(subjectSlug, room)` is the only place a room href should be
built. `dailyPlannerEngine.ts::routeFor()` and ~35 affordances across the Today
component, the syllabus/PYQ library, the operator command centres and two admin pages
route through it. **If you add a surface, call this — never hand-build an href.**

**4.6 Beta scope + access flags.** `GS_LMS_BETA_SCOPE` limits planner/scope to
loop-ready topics; `GS_LMS_ENFORCE_ACCESS` gates entitlements. Production startup
**refuses to boot** unless both are `true` (tested). Locked first topic = server 422;
locked topic in a plan = 409. Coverage measured in DB: 69 visible leaves, 69 with
reviewed content, 28 loop-ready, 41 short of the 15-question lab, 40 with no reviewed
PYQ demand, 41 missing a canonical section. **Two different "Geography" objects exist**
and their numbers must never be mixed: the GS LMS syllabus tree (69 leaves, served under
`/upsc/geography/lms/**` by `app/api/v1/gs_lms/**`) and the selected-Optional subject
(14 nodes, 26 PYQs, served by `/api/v1/optional/**`).

**4.7 Current Affairs review machine.** `backend/app/core/current_affairs/ca_engine.py:65-70`:
DRAFT→IN_REVIEW; IN_REVIEW→PUBLISHED|DRAFT; PUBLISHED→ARCHIVED; ARCHIVED→nothing.
`PATCH /api/v1/admin/current-affairs/items/{id}/status` with `StatusChangeIn{status}`
returns **409** on an illegal transition (`app/api/v1/admin/ca_items.py:329-344`).
The learner feed filters `PUBLISHED` **and** `is_deleted == False`, so a draft is
invisible no matter how good it is.

**4.8 Authoring CA content.** `backend/scripts/seed_current_affairs.py` +
`backend/content/current_affairs/items.json`. Validation rejects the taxonomy that
once corrupted the feed and requires citations; it writes **DRAFT only** by design.

**4.9 Database safety — learned expensively.** A June destructive reseed silently
orphaned learner rows because **SQLite ignores foreign keys by default**. 36 dangling
rows were deleted (backup `production.db.bak-orphan-repair-20261029155246`), and a full
FK scan then found `gs_lms_onboarding` student 1 pointing at deleted node 3; the title
was unrecoverable from every local backup, so the reference was set to NULL rather than
quietly repointed at an unrelated topic. Since then: `PRAGMA foreign_keys=ON` per
connection in `app/db/session.py`, so a broken delete fails locally the way it already
fails on Postgres; `backend/scripts/delete_orphan_nodes.py` was replaced by the
read-only `backend/scripts/audit_orphan_nodes.py` (read-only mode, reports counts,
exits 1 on any dangling reference, never writes — last run: 114 nodes, 0 empty visible
leaves, 0 dangling references across the six learner tables); and the production seed is
non-destructive for both subjects (Geography and CSAT upserted by natural key, nodes
falling out of the canonical tree hidden as UNREVIEWED rather than deleted — verified by
two runs against a copy of `production.db` producing 0 new nodes and identical ID
hashes across 114 nodes / 408 sections / 29 CSAT nodes / 104 CSAT sections).
`ALLOW_DESTRUCTIVE_SEED=true` remains only as a guard. Repeat this discipline: **backup
before DDL, verify by re-read, prefer NULL-and-say-so over inventing a value.**

---

## 5. Day-by-day chronicle

Dates come from three independent sources: file-modification timestamps
(`HANDOFF/scripts/handoff_mtime_map.cjs`, raw output kept at
`HANDOFF/RAW_MODIFICATION_MAP_2026-11-15.txt`),
the dated sections inside `frontend/docs/workspace-audits/BUILD_GATE_STATUS.md`, and
memory entries. Git is **not** a usable clock here — the repo's two commits are dated
2026-07-06 (`4b2fde8`, `e8675bb`) while the working tree contains work through
November. Treat mtimes as the primary evidence and remember they move if a file is
rewritten.

### 5.1 Before this audit era (2026-05-11 → 2026-09-07, summarized)

File activity exists on **62 distinct days** between 2026-05-11 and 2026-09-07 (the
whole measured span is 2026-05-11 → 2026-11-15, 69 days). The authoritative chronicle
is **`DOCS/ANTI_GRAVITY_HANDOFF_2026-08-26.md`** — read its §3.2 timeline table, §8
P0/P1 blockers, and §9 approved/prohibited decisions before touching payments,
deployment, migrations, or content generation. Key facts it governs: the workspace
grew out of a broken 10-portal monolith that the founder slashed down (turning point
2026-03-22); recovery was organised in Waves A–D done locally, Waves E–G (staging DB,
providers/payments, release) **never completed**; `RELEASE_READINESS.md` recorded a
47-feature inventory with **zero** `PRODUCTION_VERIFIED` / `DEPLOYED` / `PUSHED`
evidence; local slices D1–D3 fixed provider/API contracts, retry/unavailable
boundaries, and content/schema safeguards without reading secrets or touching a
database; GS Geography frontend stabilisation and a deterministic Topic 1 five-section
repair landed 2026-08-26. Standing prohibitions from that era still hold: no
fabricated Topic 26/27 MCQs, no silent selection between duplicate Topic 24
candidates, no `.env` reading, no DB imports or migrations without approval,
`readyForPayment=false`.

### 5.2 This audit era, day by day

| Day | Files touched | What was solved | What was navigated |
| --- | --- | --- | --- |
| **2026-10-27** | 4 | Audit kickoff: feature inventory across surfaces, live UI audit with screenshots, Mobbin reference mapping, technical health signals, interactive HTML audit report (`audit-2026-10-27/report.html` + `capture.mjs`, `mobbin*.mjs`, `trace.mjs`, `verify-report.mjs`). Readiness engine and its models started (`readiness_models.py`, `test_readiness_engine.py`); `GapsPage.tsx`, `LmsProgressCard.tsx`. | The first hard lesson: a failed read looked like empty data. Every later fix returns to it. |
| **2026-10-28** | 57 | Readiness schema + drift repair; Gaps dashboard replaced by a Readiness dashboard with honest confidence states; hard discussion lock removed and content-access failure modes fixed; auth roles hardened and GS LMS entitlements enforced (`ProtectedRoute.tsx`, `AuthContext.tsx`, `access-events.ts`, `client.ts`, `validate-auth-role-hardening.mjs`). | **The host booted at 16:28:57 and has not been rebooted since.** Around this window the compiler decline (H15) went total: journey27 was the last build to complete, and from then on nothing compiled or served a page. Browser E2E (task #11) became impossible. |
| **2026-10-29** | 81 | The paid-beta re-scope, decided with the founder that day (`LEARNER_PURPOSE_MATRIX.md` "Paid-beta decisions confirmed 2026-10-29"): audit of every Geography learner surface against the five learner questions; practice/MCQ flow defects; revision/revisit/planner defects; entitlement enforcement made mandatory at production startup; operator content-coverage view; per-topic UPSC demand strip; CSAT seeding hardened against orphaning learner rows; the journey9 and 52-check browser journey appear in the same ledger round — read them with §3 in mind, since no new bundle existed after 2026-10-28 and a journey in this era can only target the surviving pre-deadlock one; beta scoping of learner surfaces; CSAT hidden from learner nav; honest Mains outcome estimate built. Defects fixed the same day include: growth report "0%" → "Not taken"; unevidenced sections averaged as zero; legacy snapshots presenting a zero recall score as an attempt; revisit completion not reaching the planner; MCQ Lab 409 being a dead end; first-visit lab 404 logging a failure on every open; practice listing topics with no reviewed set; demand share counting Mains PYQs while the API reported only Prelims; the planner implying one topic per day; two different schedules both called "recall"; **the planner scheduling a locked topic and sending the learner into a 409**; onboarding offering a locked first leaf and then rejecting its own default with 422; Mains hiding a reference answer that all 30 stored Mains PYQs already have. | Every one of these was proven by reading code and writing tests, not by looking at a page. |
| **2026-10-30** | 101 | `BUILD_GATE_STATUS.md` opened as the release-gate ledger. Pricing quotas removed and marketing aligned to the live product (founder-approved); the seven locked GS subjects' legacy day rooms given redirect stubs (founder-approved) — 49 legacy room `page.tsx` files carry that day's timestamp, 7 subjects × 7 rooms; Current Affairs authoring pipeline built plus the first sourced items; the RBI MPC item cleared verification (CA round two); the admin CA API now rejects the taxonomy that corrupted the feed; optional-subject workspace audit ("what is real and what the frontend invents"). | Five webpack builds and one Turbopack build frozen mid-compile; dev server tried as a lighter path and also blocked (240 s timeout, then a port that bound and answered nothing). Reboot identified as the unblock; the founder was asked, not bypassed. Backend suite re-run: the 1208 figure in old notes was stale, 1188 is current. |
| **2026-10-31** | 19 | Two founder decisions executed: **"point client at backend, delete mirrors"** — the 11 same-origin route handlers under `frontend/src/app/api/v1/optional/**` deleted so optional data can only come from FastAPI; **"mark coming-soon until reviewed"** — Anthropology and Sociology set `coming-soon` in `optionalSubjectsCatalog.ts`, hiding every `SubjectShell` affordance including Read, and both stat surfaces now agree on "Optional reviewed 1 of 25". Optional learner surfaces made to fail honestly: `PyqExplorer`, `ReadView`, `SyllabusView`, `PracticeBoard`, `GapPanel` clear data on error, record `"error"`, and retry with a real backend call; PYQ rows render only when the backend says `REVIEWED`; coverage says "Not measured yet" instead of a 0% verdict. Two more sourced CA drafts authored (five total, ids 2–6). The Gemini key moved out of the discuss-route URL into `x-goog-api-key`. `EXAM_PORTABILITY_AUDIT.md` written. | Only Geography optional has reviewed content in the DB (14 nodes, 26 PYQs); Sociology has 69 unreviewed nodes and no content; Anthropology has no row at all, so its endpoints 404. The 131st Amendment item was resolved by reading PRS in full (introduced 16 Apr 2026, **negatived** 17 Apr 2026) and the tiger item teaches the 3,682 figure with its round named and an explicit note that the increase is not in a published NTCA report. COP 31 host/dates were **left out** because `unfccc.int/cop31` returns nothing quotable and `pib.gov.in` 403s to automated fetch — honesty over completeness. |
| **2026-11-01** | 0 | — | No source changes carry this date. The portability detour had opened on 10-31 (`EXAM_PORTABILITY_AUDIT.md`) and the founder's "start with the UPSC only" correction landed before the 11-02 pass — see 6.10. |
| **2026-11-02** | 16 | **The UPSC-only wiring pass** (`UPSC_FEATURE_WIRING.md`): dumped 181 served FastAPI routes, diffed every `apiClient` path against them, diffed every internal `href`/`router.push`/`redirect` against the real 171-page tree, counted callers for `gsLmsService` (36 methods) and `caService` (15), and paired each loop's write side with its read side. Verdict: the loop is logically wired; the routing was broken. Five fixes shipped — locked subjects stopped dead-ending in a 404 (`upsc/[subject]/lms/layout.tsx` now renders `SubjectNotOpen` instead of `notFound()`); the planner's primary CTA and ~35 room hrefs now resolve through `lib/upsc/lmsRoomRouting.ts`; the Today page's retro button (a route that never existed) points at `/lms/retro`; the syllabus/PYQ loop stages stop 404ing; and `/admin/cms` gained the missing status actions so a Current Affairs draft can finally be published from inside the app, plus a real failure panel where an unreachable backend used to render as "No items found". New gate `npm run verify:upsc-wiring`, mutation-proven. | Compiler re-probed rather than remembered (H1). Import path typo caught only because `tsc` works (`SubjectLmsProvider` → `SubjectLmsContext`). Two false-positive harnesses had to be fixed before believing them (6.4, 6.5). |
| **2026-11-03 → 2026-11-14** | 0 | — | Nothing moved. The reboot never happened, so #35 (copy fixes in a production bundle) and #53 (review/publish the five CA drafts) stayed blocked for 13 days. Worth internalising: **the blocker was environment, not effort.** |
| **2026-11-15** | this file | Founder asked for exactly this document. Static gates re-run today (§7). | Background dev server left over from 11-02 (task `bddofix37`) was stopped; scratch harness `handoff_mtime_map.cjs` added to date the chronicle. |

---

## 6. Hardship and dead-end log

Each entry is "what happened → what was tried → what to do instead". This is the
part the founder specifically asked to be encoded, because none of it is visible in
the finished code.

**6.1 H1 — the compiler deadlock.** See section 3 in full. Dead ends that were
actually tried and burned time: fresh `NEXT_DIST_DIR`, deleting partial dist,
`--max-old-space-size=6144`, CI mode, disabling telemetry, switching webpack →
Turbopack, killing the stale PID on the dev port, moving ports 3000/3001/3111.
Do instead: accept it, use `tsc` + eslint + static gates, state the verification gap
out loud, and ask the founder for a reboot window.

**6.2 H2 — no browser, therefore no "obvious" answers.** With 215 pages unverifiable
by eye, the audit had to be mechanical. Do instead: build the diff harnesses
(`scratch/wiring_api_diff.cjs`, `scratch/wiring_link_diff.cjs`,
`backend_routes.txt`) and let them enumerate, then read only what they flag.

**6.3 H3 — recursive search timeouts.** Whole-repo `grep -r` / ripgrep exceeded the
2-minute limit twice, once leaving a background job. Do instead: scope the Grep tool
to a directory, or use a Node walker with an explicit SKIP set.

**6.4 H4 — heredoc mangled a script.** A Node script written through a shell heredoc
came out with `\/` where `\\/` was needed → `SyntaxError: missing ) after argument
list`. Do instead: create scripts with the file-writing tool, never inline heredocs
containing backslashes or regex.

**6.5 H5 — the API diff lied.** Paths kept their query strings, so 17 endpoints looked
orphaned. Stripping `[?#].*$` cut it to 9, and reading the callers showed all 9 were
dead code — including `app/api/v1/observability.py`, which is **unregistered**. Do
instead: normalise before comparing, then prove reachability by importer count.

**6.6 H6 — dynamic hrefs are invisible to a text diff.** Template literals with
`${slug}` sampled as a literal `x`, producing `/upsc/x`, `/upsc/x/watch` — unverifiable
by tooling. Do instead: read the caller graph. That is how defect #1 and #2 were found,
and it is also what stopped a wrong "fix".

**6.7 H7 — near-misses that would have added damage.** Three surfaces
(`ZenDashboard.tsx`, `UpscCurrentAffairsBridge.tsx`, the `Subject*Room` cluster) had
broken room hrefs and were on the fix list. Counting importers proved they have
**zero**, so editing them would have been churn plus a false claim in the report. The
observability "orphan endpoints" were likewise not a live defect. Do instead: never fix
a link until you know something can reach it.

**6.8 H8 — the new gate failed its own first run.** `verify:upsc-feature-wiring.mjs`
flagged `lib/upsc/subjectGuidedStudy.ts` (legitimately still builds room hrefs but is
only imported by the retired cluster) and flagged my *own docstring* because it
mentioned `notFound()` and the regex was naive. Do instead: add a documented exclusion
list, tighten the pattern (from `/notFound\(\)/` to requiring the semicolon), and
mutation-test every new gate by planting the bug once.

**6.9 H9 — guessed database names.** First guesses `execution_trace`,
`operational_metric`, `trace_execution` were all wrong; the real tables are
`execution_traces`, `operational_metrics`, `job_execution_registry`. Do instead: query
`sqlite_master` before asserting anything about schema.

**6.10 H10 — scope drift, corrected by the founder.** An exam-portability audit
("is this a UPSC app or a revision platform?") was produced and pursued. His response:
"you stuck somewhere else which was not supposed to be asked from you … start with the
UP[S]C only". Do instead: stay inside the loop he named — understand, fix, align, one
feature at a time — and re-ask before widening.

**6.11 H11 — context ran out mid-audit.** Sessions ended twice; the work survived only
because it had been written into dated docs as it went. Do instead: append to
`BUILD_GATE_STATUS.md` / the relevant audit doc **while** working, not at the end.

**6.12 H12 — stale numbers in the docs.** `pytest 1208 passed` was quoted from an older
section long after the real number was 1188. Do instead: re-run, then quote. If you
cannot re-run, quote with its date attached.

**6.13 H13 — a missing npm alias.** `verify:optional-catalog-routes` does not exist;
the script file does. Ran it directly (`node scripts/validate-optional-catalog-routes.mjs`,
exit 0, 9 checks). Do instead: read `package.json` `scripts` before inventing a command.

**6.14 H14 — two findings that are not code problems.** The learner Today page renders
six links into ADMIN-gated operator routes; `ProtectedRoute` bounces a non-admin to
`/dashboard`, which `redirect("/upsc")` — a silent loop for a paying student. And the
legacy half of the loop keeps state only in browser `localStorage`
(`sarit-upsc-student-profile-v1`, `-daily-command-v1`, `-question-bank-attempts-v1`,
`-progress-updated`); nothing under `src/services/api` touches localStorage, so that
history cannot survive a second device or a cleared cache and the founder cannot see
it. Both are held, deliberately, in section 8.

**6.15 H15 — the deadlock was the end of a long decline, and the retry recipe is worth
knowing.** Builds on this host stalled intermittently well before 10-28: journey10, 12,
14, 15, 17 idled at "Creating an optimized production build…" with no CPU growth (one
for over 30 minutes), and journey22, 23, 24 each stalled because **a Next build from an
unrelated workspace was competing for the host**; journey26 idled ~38 minutes. The
pattern that reliably worked was: kill only this project's build tree, delete the
partial isolated dist dir, free port :3000, retry with a fresh `NEXT_DIST_DIR` and
`NODE_OPTIONS=--max-old-space-size=6144`. That produced journey16 (4.3 min), journey17
(9.0 min after a reset), journey18 (4.3 min), journey19 (7.6 min), journey20 (13.1 min),
journey25 (8.8 min) and journey27 (4.9 min) — the last good gate. Do instead: never run
two Next builds on this machine at once; and remember the retry is a host workaround,
not a product fix — the successful run is the gate.

**6.16 H16 — `tsconfig.json` gets polluted by isolated builds.** Next appends the
isolated dist dir's type shims to `tsconfig.json` on every `NEXT_DIST_DIR` build. If
they are still there, `tsc --noEmit` is checking build artifacts, not your tree. Do
instead: remove `.next-build-*` shim entries before a plain type check (done after the
journey27 gate and `tsc` re-run clean).

**6.17 H17 — this is not the Next you may know.** Next 16.2.6 deprecates the
`middleware` convention (the build still emits a Proxy (Middleware) entry and works;
migration to `proxy.ts` is pending), and `frontend/AGENTS.md` explicitly says to read
the relevant guide in `node_modules/next/dist/docs/` before writing Next code, because
breaking changes differ from training data. Do instead: check those docs before using an
API from memory.

**6.18 H18 — 20 backend test failures that were not product defects.** They traced to
test isolation: `.env` optional-provider settings leaked into tests (now forced to the
non-production mock policy by an autouse conftest); answer-eval fixtures lacked a
`gs_subjects` row, used UNREVIEWED PYQs, and selected live Gemini (now seeded subject,
REVIEWED PYQ, `OPTIONAL_EVAL_PROVIDER=mock`); two endpoint tests overrode auth with a
bare `object()`. Do instead: suspect the harness before the product, and never let a
test reach a real provider.

**6.19 H19 — every count in this repo needs a date on it.** The full backend suite is
recorded as 1150, then 1208, then 1188 passed in different sections of the same ledger,
because it genuinely changed as tests were added and stale ones fixed. Do instead:
re-run before quoting; if you cannot, quote with the date attached (that is how §7 is
written).

---

## 7. Verification ledger — proven vs not proven

Proven in source. Every gate below was **re-run on 2026-11-15** (raw output kept at
`HANDOFF/RAW_GATE_OUTPUT_2026-11-15.txt`), so this table describes the tree as it stands today,
not as of the last session:

| Gate | 2026-11-02 | 2026-11-15 (today, actually re-run) |
| --- | --- | --- |
| `npx tsc --noEmit` | exit 0 | **exit 0, no output at all** (400+ files) |
| `eslint` on changed files | exit 0 | **exit 0 on all 11 files from the 11-02 pass — but it took over 5 minutes for 11 files; run it in the background and keep working** |
| `verify:upsc-wiring` | PASS 6/6, mutation-proven | **PASS 6/6** (retired-room hrefs remain only inside the unreferenced legacy cluster; 5 LMS segments mapped, each with a page file; CA map mirrors `VALID_TRANSITIONS`) |
| `verify:optional-honest-failure` | PASS 16/16 | **PASS 16/16** |
| `validate-optional-catalog-routes.mjs` | PASS 9/9 | **PASS 9/9** across 7 selected-Optional files; 4 dynamic templates deliberately not guessed |
| `verify:api-base` | PASS 5 fixtures | **PASS — "API base URL fixtures passed: 5"** |
| `verify:launch-env` | exit 0 | exit 0; reports `"externalApplyReady": false` and the OAuth/two-profile continuity rehearsal `"ready": false` — that is the honest state, not a failure |
| `verify:auth-role` | exit 0 | **8 passed, 0 missing** (sidebar depends on the server-derived `isAdmin`; `isOperatorRoute` no longer elevates nav; write callers use `resolveToken`) |
| backend `pytest -q` | not re-run (backend untouched since 10-31) | not re-run today — **no backend file changed since 2026-10-31**, so 1188 passed is the current figure with its date attached |

**Proven against a running local backend** (2026-10-30, `APP_ENVIRONMENT=development
ALLOW_MOCK_AUTH=true GS_LMS_ENFORCE_ACCESS=true GS_LMS_BETA_SCOPE=true` on :8000):
`/health` → 200, `/auth/me` resolves the ADMIN validator, the Mains endpoint returns an
honest insufficient-evaluation state (raw UTF-8 em dash verified in the response bytes),
and the operator coverage API reports the same 28/69 loop-ready state the journey
recorded — i.e. frontend and backend agree on the coverage number.

**Not proven, and it matters.**

1. No browser has rendered this code since the journey27 gate (the last build that
   completed, and the 65-check journey run against it). Every Oct-30 room redirect,
   every Nov-02 wiring fix, the new not-open panel, and the new CMS publish buttons are
   *code*, not observed behaviour.
2. No marketing or pricing page has been rendered from a built bundle on this host.
3. Frontend unit-test coverage is effectively zero (`src/__tests__/funnel-properties.test.ts`
   collects no tests).
4. Real auth has never been exercised — all build/journey evidence is local mock-auth.
5. No production deployment, no staging DB rehearsal, no payment sandbox run, no
   provider (Gemini/STT/OCR) provenance evidence.
6. Five Current Affairs drafts exist and are sourced; the learner-visible count is
   **0** because nothing is `PUBLISHED`, and publishing needs his review of each cited
   source.

Two post-reboot checks to run first: a locked-subject card on `/reports` (expect the
not-open panel, not a 404) and a Today-page planner CTA plus its syllabus-loop stages
(expect LMS tabs). Then `/admin/cms` row actions actually moving a draft.

---

## 8. Held for the founder — do not decide these alone

**8.1 Are the operator command centres learner surfaces?** Six links on the learner's
Today page go to ADMIN-gated routes (`/upsc/question-bank` ×2 plus Prelims Showcase,
2027 Strategy, Content Command, MCQ Command, Revision Command). `studentNav.ts:59-79`
labels them "NOT student-facing". Either they belong to the learner (then they should
not be operator routes) or they do not (then the home page should not advertise them).
Recommendation: hide them from learner nav — a one-line change plus a nav test — but it
changes what a paying student sees, so it is his call.

**8.2 Sync or retire the legacy localStorage loop?** Syncing means new API surface and
a migration; retiring means deleting the legacy Today-page state and losing whatever
history beta students already have on their devices. Both are defensible. The GS LMS
half is already server-backed and correct, which is why "retire" is the smaller product
risk — but it is still a feature retirement, which needs sign-off.

**8.3 Delete the dead code or keep it?** ~19 files of the retired room cluster
(`*SubjectRoutes`, `Subject*Room`, `SubjectFeatureSlot`, `subjectGuidedStudy`), plus
`ZenDashboard.tsx`, `UpscCurrentAffairsBridge.tsx`,
`lib/upsc/optionalDataResolver.ts`, `OptionalSubjectLMS.tsx`, `observabilityService.ts`
and 3 components, plus unused service methods (`gsLmsService.getGaps/getSyllabusNode/
getDiscussionStatus/updateLearnerLevel`, `caService.getDailyCount/searchItems`). They
have no live importers. They are also the reason naive greps produce false alarms, so
deleting them makes the next audit cheaper. Keep the legacy Git histories — the 2026-08
policy says preserve alternatives until an owner-approved reconciliation.

**8.4 Registering `/api/v1/observability`?** `app/api/v1/observability.py` is
unregistered, and as written it imports `get_current_user` and never uses it — so
registering it unchanged would publish attempt traces and event timelines
**without authentication**. The live `/admin/observability` page deliberately shows an
isolation panel instead. Fix the auth dependency first, then decide whether to register.

**8.5 Two copy decisions still unanswered.** (a) "Sunday AI Retro" / "Sunday
AI-Guided Retros" labels an AI call that no code makes — rename to what it is, or build
the AI step. (b) `/test-series` still describes a full-length mock series that does not
exist.

**8.6 Task #62:** nothing calls `recordProgressEvent`, so optional coverage can never
become "measured" — wiring read/practice/recall events is an open product decision.

---

## 9. Production blockers before any paid launch

Carried from `BUILD_GATE_STATUS.md` "Release blockers still open" (2026-10-30) plus the
2026-08 P0 list. All still open.

1. `NEXT_PUBLIC_API_BASE_URL` set to the real backend origin in the deploy environment
   — unset, the rewrite silently targets `localhost:8000` and a deployed site points at
   itself.
2. Postgres 16 cutover with a rehearsed backup/restore drill.
3. Cashfree: schema repair (`ca_doubt_chats`, `ca_weekly_compilations`,
   `gs_lms_pyq_reveals` were recorded as missing migration coverage), sandbox E2E,
   webhook registration, refund policy sign-off. Prices stay hidden until then.
4. Real authentication (Clerk path has never been exercised; all evidence is mock-auth).
5. `/health/ready`, observability, SLOs for the paid cohort.
6. Security headers, rate limits, CORS review — including the unauthenticated,
   unlimited Gemini proxy at `src/app/api/optional/discuss/route.ts` (task #59).
7. Confirm `GS_LMS_ENFORCE_ACCESS=true` and `GS_LMS_BETA_SCOPE=true` in production and
   that every invited learner has an ACTIVE `gs_lms_beta_access` grant.
8. Paid-subscription → GS LMS entitlement mapping (no existing capability flag counts).
9. Privacy, terms, refund, support, grievance pages, and legal review.
10. Content truth sweep + PYQ/MCQ coverage for the beta scope; CSAT is synthetic
    placeholder content and stays outside the beta.
11. Rollback and monitoring ownership/window are not evidenced; backend deploy refs
    still use mutable `latest` with no immutable digest/source-SHA chain.

---

## 10. Repository hazards

- **Two commits only** (`4b2fde8`, `e8675bb`) and ~**979 dirty paths**. Three weeks of
  real work is uncommitted because the founder has not asked for commits. Do not "fix"
  that on your own initiative, and **never `git add -A` / `git commit -a`** here.
- `backend/.git_disabled/` and `frontend/.git_disabled/` are tracked legacy Git
  directories that show up as modified files. That is noise, not work — leave them.
- Git content filters are configured on this repo, so `git status` cleanliness does not
  fully describe the tree.
- `NEXT_DIST_DIR` variants (`.next-build-journey27`, …) are the only surviving build
  evidence. Do not delete them.
- The `audit-2026-10-27/` directory holds the original screenshot report and its probe
  scripts — the earliest browser-era evidence and still the only one with real
  screenshots.
- Localhost/admin-bypass auth must not be relied on for admin access in any deployed
  context.

---

## 11. Ordered first actions for the next agent

1. **Re-probe the environment before believing this file.** `cd frontend && npx tsc
   --noEmit` (must pass), then `npx next dev -p 3111` and curl `/` with a 45 s timeout.
   If a reboot happened, say so — that reopens tasks #35 and #53 and changes everything
   below.
2. **Read, don't write.** `frontend/docs/workspace-audits/UPSC_FEATURE_WIRING.md`, then
   the dated sections of `BUILD_GATE_STATUS.md` (from 2026-10-30) including "Notes and
   residual warnings", then `LEARNER_PURPOSE_MATRIX.md`'s defect list.
   `DOCS/ANTI_GRAVITY_HANDOFF_2026-08-26.md` §8–§9 before touching money, deployment, or
   migrations. Before writing any Next code, read `frontend/AGENTS.md` and the matching
   guide in `node_modules/next/dist/docs/` (H17), and check `tsconfig.json` for leftover
   `.next-build-*` type shims before trusting a type check (H16).
3. **Ask the founder for the reboot window** (it is his laptop; do not just do it) and,
   in the same message, put decisions 8.1–8.3 to him in one short list.
4. **If the compiler lives:** run the three checks in §7 (locked-subject card, planner
   CTA, CMS publish button), then take the five Current Affairs drafts through review
   with him and publish only what he signs off. Task #53 and #35 close here.
5. **If the compiler is still dead:** continue the founder's own sequence — pick the next
   UPSC feature, read its full chain (UI → service → route → engine → table → the
   feature that reads it), and fix or document what is misaligned, adding a static gate
   for anything you change. Then append the day to `BUILD_GATE_STATUS.md`.
6. **Commit only when told to**, and stage explicit paths.

---

## 12. Evidence index

| Where | What it holds |
| --- | --- |
| `frontend/docs/workspace-audits/UPSC_FEATURE_WIRING.md` | The 2026-11-02 wiring pass: method, loop table, five fixes, three held findings, verification limits |
| `frontend/docs/workspace-audits/BUILD_GATE_STATUS.md` | The release-gate ledger, 1222 lines, dated sections 2026-10-30 → 2026-11-02, "Compiler deadlock", "Release blockers still open" |
| `frontend/docs/workspace-audits/LEARNER_PURPOSE_MATRIX.md` | Paid-beta decisions (2026-10-29), the per-surface purpose matrix, and the full defect list fixed in that round |
| `frontend/docs/workspace-audits/EXAM_PORTABILITY_AUDIT.md` | The deprioritised question — background only, not a work order |
| `DOCS/ANTI_GRAVITY_HANDOFF_2026-08-26.md` | The authoritative chronicle for 2026-05→2026-08, plus P0/P1 blockers and the approved/prohibited decision lists |
| `DOCS/FOUNDER_JOURNEY_AND_CONTEXT.md` | Who the founder is, the teaching method the software must mirror, and the four prior architecture failures |
| `audit-2026-10-27/` | First browser audit: screenshots, probes, `report.html` |
| `HANDOFF/README.md` | The folder index and the five rules that survive every handoff |
| `HANDOFF/DAY_BY_DAY_CHRONICLE_2026-11-15.md` | The full dated chronicle, including the 10-29 defect list in one place |
| `HANDOFF/VERIFICATION_GATES_2026-11-15.md` | Exact commands that pass today, exact commands that cannot run here, and the two checks to run after a reboot |
| `HANDOFF/OPEN_DECISIONS_FOR_FOUNDER.md` | D0–D6 with evidence, options, consequences and recommendations — read before changing scope |
| `HANDOFF/scripts/handoff_mtime_map.cjs`, `HANDOFF/RAW_MODIFICATION_MAP_2026-11-15.txt` | The day-by-day file evidence this chronicle is built from |
| `scratch/wiring_api_diff.cjs`, `scratch/wiring_link_diff.cjs`, `backend_routes.txt` | Re-runnable wiring harnesses |
| `HANDOFF/RAW_GATE_OUTPUT_2026-11-15.txt` | Today's static-gate output, unedited |
| `frontend/scripts/validate-upsc-feature-wiring.mjs` | The gate that keeps room-href links from coming back |
| `~/.qoder/projects/D--Development-MCQ-Portal/memory/project-upsc-command.md` | The short-form memory of scope, dates, and open decisions |

---

## 13. Handoff acceptance checklist

An agent who has read this file can answer, without opening code:

- Which subjects are open, and which are honestly locked? (Geography; 28 of 69 leaves
  loop-ready. Everything else locked or coming-soon.)
- Why can't the site be built, and what is the substitute? (H1: host compiler deadlock
  since 2026-10-28; substitutes are `tsc`, eslint, and the static `verify:*` gates.)
- Which claims in the recent docs are *not* browser-verified? (Everything after
  2026-10-28, without exception.)
- What is the current learner-visible Current Affairs count, and why? (**0** — five
  drafts, feed filters `PUBLISHED` + not-deleted, and the founder must review the cited
  sources first.)
- What is the state of payments? (Closed: `READY_FOR_PAYMENT = false`; intent-only
  pilot checkout; Cashfree onboarding and schema repair outstanding.)
- What must never be printed or committed? (`.env` contents and any credential,
  including the unrelated Pizza Blitz Vercel token.)
- What are the three decisions held for the founder right now? (8.1 admin links on the
  learner home page; 8.2 legacy localStorage sync-or-retire; 8.3 dead-code deletion.)
- What is the scope? (UPSC. Not multi-exam portability.)
