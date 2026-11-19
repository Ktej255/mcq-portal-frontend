# Build Gate Status

Date: 2026-10-30

Scope: local release gate for the private paid beta (Geography, self-study
Prelims aspirant). Production is still blocked; see the end of this document.

## Gate summary

| Gate | Command | Result |
| --- | --- | --- |
| Production build | `NEXT_PUBLIC_USE_MOCK_AUTH=true NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 NEXT_DIST_DIR=.next-build-journey27 node scripts/build-isolated.mjs` | exit 0, compiled in 4.9 min, TypeScript in 39.2 s, 215 static pages |
| ESLint | `npm run lint` | 0 errors |
| TypeScript | `npm run typecheck` | exit 0 |
| Full backend suite | `pytest -q` | 1208 passed, 0 failed (90.5 s) |
| Onboarding + paid-beta scope | `pytest app/tests/test_gs_lms_onboarding.py app/tests/test_gs_lms_beta_scope.py -q` | 36 passed (6.4 s) |
| Mains outcome + paid-beta scope | `pytest app/tests/test_gs_lms_mains_outcome.py app/tests/test_gs_lms_beta_scope.py -q` | 31 passed (5.3 s) |
| Mains reference reveal (hermetic) | `pytest app/tests/test_gs_lms_mains_scope.py -q` | 7 passed |
| Planner, readiness, Mains focused | `pytest app/tests/test_gs_lms_planner.py app/tests/test_gs_lms_planner_api.py app/tests/test_readiness_api.py app/tests/test_readiness_engine.py app/tests/test_gs_lms_mains_outcome.py -q` | 114 passed (7.5 s) |
| Browser journey | `node scratch/production-readiness-journey-e2e.cjs` against the built bundle | 65 passed, 0 failed (journey27) |
| Focused Mains reference check | `node scratch/mains-reference-e2e.cjs` against the previous built bundle | 10 passed, 0 failed (Mains code unchanged since) |
| Focused navigation check | `node scratch/nav-purpose-e2e.cjs` against the built bundle | 13 passed, 0 failed |
| Focused Mains uploader truth check | `node scratch/mains-upload-truth-e2e.cjs` | blocked — no bundle can be produced on this host (see "Compiler deadlock") |
| Focused learner-surface truth check | `node scratch/learner-surface-truth-e2e.cjs` | blocked — no bundle can be produced on this host (see "Compiler deadlock") |

The journey ran against `.next-build-journey27` served by `next start` on :3000,
with the backend on :8000 started as `APP_ENVIRONMENT=development`,
`ALLOW_MOCK_AUTH=true`, `GS_LMS_ENFORCE_ACCESS=true`, and
`GS_LMS_BETA_SCOPE=true` to match production. The learner was reset with
`backend/scratch/reset_lms_student.py 2` so the first-run wizard itself was
proved, then fixtures were reseeded with
`backend/scratch/seed_journey_progress.py` (backup taken first); the topic ids
come from `scratch/journey-seeded-nodes.json`, computed from the same
loop-ready gate as the product rather than hardcoded. Evidence:
`scratch/production-readiness-journey-evidence.json` (65 checks, 19
screenshots, 0 uncaught page errors). The console log contains only three
deliberate failed requests: the 409 for a beta-locked topic, the aborted growth
report used to prove the retry path, and the 403 during entitlement revocation.
All three are scoped test phases and filtered from the console-error check.

The first pass of this journey run failed one check ("MCQ Lab is progressively
locked for a new learner", 63/65) because `reset_lms_student.py` did not clear
`gs_lms_funnel_progress`: an earlier Mains check had parked node 156 at step 13,
so the "new" learner resumed mid-funnel. The reset script now also deletes that
learner's funnel progress and Mains attempts with their evaluation reports, so
the first-run assumptions hold on a reused database. The rerun passed 65/65.

## Focused Mains reference check

`scratch/mains-reference-e2e.cjs` submits a real typed answer as student 2 on
node 156, polls the evaluation job to `COMPLETED`, then opens the topic with the
job id restored in `sessionStorage`. It passed 10/10 checks against the
journey25 bundle and mock-auth backend (`OPTIONAL_EVAL_PROVIDER=mock`,
`ENABLE_OPTIONAL_EVAL_MOCK=true`; node 156 was parked at step 13 first so the
Mains workspace opens directly):

- the Mains question list returns prompts with no `model_answer`, `answer_text`,
  or `explanation` field, so the reference cannot be read before writing;
- the status endpoint reveals a 207-character reference answer and a
  149-character reference outline once the job is terminal (the hermetic suite
  also proves it stays hidden while the job is `STARTED` and still appears after
  a `FAILED` evaluation);
- the result view renders "Compare with the examiner's reference" collapsed by
  default, and expanding it shows both "Reference answer" and "Reference
  outline" with the copy "not a perfect answer to memorise";
- no console or page errors.

Evidence: `scratch/mains-reference-evidence.json` and
`scratch/mains-reference-result.png`.

## Focused navigation check

`scratch/nav-purpose-e2e.cjs` passed 13/13 against the journey27 bundle:

- the sidebar offers Readiness at `/upsc/geography/lms/gaps` and Revision at
  `/upsc/geography/lms/planner`, and no longer links the legacy `/reports` or
  `/revision` pages;
- exactly one sidebar item is marked current on each destination — Readiness
  on the demand dashboard, Revision on Today's plan, GS on the syllabus, and
  Practice inside the MCQ Lab — so a page never highlights two global
  destinations at once;
- the legacy `/revision` page still renders and now states that its queue is
  fed by full-length exam attempts only, with a working link to Today's plan
  for Day 3/7/21 revisits;
- no uncaught page errors and no unexpected console errors.

Evidence: `scratch/nav-purpose-evidence.json`, `scratch/nav-readiness.png`,
`scratch/nav-revision.png`.

## Focused Mains uploader truth check (blocked)

The Mains Uploader (`/upsc/answer-upload`) only posts ordered JPEGs to
`/mains-upload/assemble-pdf`, which assembles them into one PDF; the endpoint
does no OCR and no evaluation. Four learner surfaces overclaimed that: the
Today quick link promised "handwritten OCR checking", the uploader success
state told the learner to "submit it for evaluation", and the first-run
orientation promised pages "evaluated automatically" and a webcam gaze check.
The copy is corrected to assembly-only wording on the card, the page metadata,
and the success state; the orientation slide now describes the timer-based
focus check and its camera-blocked checkpoint. Every surface points to the
topic Mains step for scored typed and reviewed handwritten practice.

An earlier pass claimed the metadata was fixed but left
`app/(dashboard)/upsc/answer-upload/page.tsx` describing the PDF as assembled
"for submission", and the truth script asserted that same stale phrase, so it
could not catch the regression. Both are corrected this round: the meta
description now reads "assemble them into a single downloadable PDF to review
or share", and "for submission" joined the script's forbidden list. The step-3
heading now reads "Label & assemble" instead of "Label & submit".

`scratch/mains-upload-truth-e2e.cjs` asserts the uploader page and Today quick
link contain the assembly wording, the meta description requires the
"downloadable PDF to review or share" outcome, none of the forbidden
OCR/evaluation/submission phrases appear, the document title and back link are
correct, and there are no console or page errors. It has not run: no
production bundle containing the corrected strings could be built on this host
(see "Compiler deadlock"), and a fresh dev server accepted connections but
never finished its first page compile. `npm run typecheck` and per-file
`eslint` are clean for this copy-only change.

## Focused learner-surface truth check (blocked)

`scratch/learner-surface-truth-e2e.cjs` creates one temporary PUBLISHED Current
Affairs item through the admin API (one content block, one MCQ, one Mains
prompt), drives the student browser through Read → Discuss → MCQ → optional
Mains, and asserts:

- the Mains step renders after completion and shows the authored prompt with
  paper, marks, and word limit — this was unreachable before, because the UI
  gated step 5 on `!is_completed` while the backend completes the item at
  step 4;
- the funnel says it does not score written answers and never invents a score;
- the Discussion step points to the real Ask a Doubt chat;
- the feed's empty state says nothing is published yet (only when the feed is
  genuinely empty) and does not blame filters;
- pricing and the yearly planner say "Selected plan (pilot)" and "No payment
  has been collected", with no "Paid & Active" or "Active subscription" claim;
- the yearly planner links only the two beta-open windows (`/upsc/geography`
  and `/upsc/geography/lms/planner`), marks the other seven as `aria-disabled`
  "In preparation", links nowhere to the operator-only `/upsc/source-library`,
  states "25 subjects catalogued, 3 live" with the remaining 22 coming-soon,
  and drops the old "Current Plan Price" / "All Optional Seeds Are Configured"
  / preload-ledger claims;
- the pilot checkout (`/upsc/pricing/checkout?plan=foundation-monthly`) renders
  `data-ready-for-payment="false"`, headed "Record your plan intent" with "No
  payment is collected", and never "Confirm Pilot Activation", "Active
  subscription updated", "Usage limits have been reallocated", or "Plan is
  currently active";
- `/upsc/billing` with no active subscription renders
  `data-ready-for-payment="false"`, states that payments are not open and
  nothing is charged, and never promises a "first purchase";
- a stale bookmark to `/upsc?tab=history` renders Today's Study, not the
  retired day-based history view: the Today router clamps every requested tab
  to `today` or `yearly`, so no legacy localStorage model is reachable even by
  URL.

The temporary item is soft-deleted in a `finally` block. The admin lifecycle
was exercised directly against the local API — create, DRAFT → IN_REVIEW →
PUBLISHED, student feed, Mains list, DELETE, feed back to zero — so only the
browser half is unproven. It cannot run until a bundle exists (see "Compiler
deadlock"). `tsc --noEmit` and targeted eslint are clean.
`scratch/verify-pricing-planner.cjs` has been rewritten against the current
tier × cycle pricing page (see the next section); its old pricing assertions
encoded the retired four-duration ladder.

## Pricing truth script aligned to the tier × cycle model (post-journey27, unbuilt)

The old `scratch/verify-pricing-planner.cjs` had drifted two redesigns behind
the page. It expected four duration plans (`monthly`, `yearly`,
`eighteen-month`, `three-year`) at ₹399 / ₹3,999 / ₹5,499 / ₹8,999 and a
₹8,999 checkout. The page now renders four tiers per selected billing cycle,
and the legacy `three-year` alias actually opens `foundation-three-year` at
₹9,340. The rewritten check now:

- drives all four billing cycles and verifies all 16 tier cards plus their 16
  discount-proof rows, including CTA hrefs, savings lines, and billing terms;
- opens the Discount Matrix Math, inclusions, and launch-rules disclosures and
  requires the live recall loop, Geography-only beta scope, teacher discussion,
  plan-change-free wording, and `Payments open only after` gate summary;
- requires the hero to state the live split — "GS live 1 of 8" and "Optional
  live 3 of 25" — instead of advertising all 8 GS subjects and 25 optional
  pages as usable, and requires the Foundation/Plus feature lists to name the
  live Geography path and the three live optional libraries;
- requires `data-commerce-mode="pilot-plan-intent"`,
  `data-ready-for-payment="false"`, "No payment collected today", zero
  `source-library` links, and the absence of `upgrade anytime`,
  instant-credit, talk-room, "Ready Database Anchors", and
  "All Optional Seeds Are Configured" claims;
- drives `?plan=plus-yearly` (₹7,130, 15% off) through the pilot checkout and
  verifies the intent receipt, storage payload, tier-base math, and the absence
  of "Payable now", "Complete Payment", "Active subscription updated",
  "Usage limits have been reallocated", and "Plan is currently active";
- keeps the updated yearly-planner and mobile overflow checks.

The page gained only instrumentation for this: a boundary status line carrying
the commerce mode, proof-section/row attributes, and a corrected
`data-monthly-base` on the checkout proof (it hardcoded ₹399 even for Plus,
Pro, and Ultimate plans).

## Monthly launch-price rounding fix (post-journey27, unbuilt)

`buildPlan` in `yearlyPlanner.ts` rounded every launch price to the nearest
₹10. On the 0%-discount monthly cycle that pushed the ₹399 base to a ₹400
launch price, so each monthly card exceeded its own list price and its proof
row read "Saves ₹-1". Monthly plans now keep the list price unchanged; only
discounted cycles receive the ₹10 presentation rounding. The proof row, pilot
checkout proof, and intent receipt omit the savings clause when there is no
discount. This affects every consumer of `productPricingPlans`, including the
yearly planner's active-plan price, and is covered by the rewritten script.

The backend engine claimed to mirror `buildPlan` "exactly" but still rounded
the 0% monthly cycle, so a server-created order would have charged ₹400 for a
₹399 plan. `compute_plan_amount` in `backend/app/core/payments/pricing.py` now
uses the same rule (list price at 0% discount, ₹10 rounding only for
discounted cycles), and a new hermetic regression module,
`backend/app/tests/test_payments_pricing.py`, pins all 16 tier × cycle amounts
(₹399/₹4,070/₹7,180/₹9,340; ₹699/₹7,130/₹12,580/₹16,360;
₹999/₹10,190/₹17,980/₹23,380; ₹1,299/₹13,250/₹23,380/₹30,400), asserts that
no amount exceeds its list price, that monthly equals the tier base, and that
invalid tiers/cycles raise `ValueError`. 21 tests pass. `node --check`,
`tsc --noEmit`, targeted eslint, and the backend module are clean; browser
verification remains blocked by the compiler deadlock.

## Pricing toggle now honors the saved billing cycle (post-journey27, unbuilt)

`UpscPricingCommand` initialized its billing toggle with
`useState(profile?.billingCycle ?? "three-year")`, but the profile is read
from localStorage in an effect after mount, so the initial value was always
the three-year fallback. A learner whose saved intent was
`foundation/monthly` saw a "Billed Monthly" header above three-year cards and
three-year prices. The toggle now keeps a manual selection as an override and
falls back to the hydrated profile cycle, so the seeded monthly intent opens
the monthly cards. The rewritten truth script asserts this explicitly before
it drives the four cycles: four cards ending in `-monthly`, "Billed Monthly",
and "Pilot rate of ₹399 reserved". `normalizeStudentProfile` now also rejects
saved tier/cycle strings that are not part of the current model (for example
the retired `eighteen-month` id), falling back to the defaults, so a legacy
local profile cannot filter the plan grid down to zero cards. `tsc --noEmit`,
targeted eslint, and `node --check` are clean; the browser assertion remains
unrun until reboot. The full backend suite (root, `app/tests` plus `tests`)
passes: 1188 tests, 0 failures — 1150 before the 16-plan pricing module,
1171 before the 10 Current Affairs funnel tests (4 adapter, 6 API), 1181
before the 5 knowledge-graph API tests, and 1186 before the 2 analytics
coherence tests. The billing pills now expose
`aria-pressed`, and the three
disclosures expose `aria-expanded` plus panel ids, so the selected cycle and
open panels are readable to assistive technology; no visible copy changed.
The truth script asserts one pressed cycle (Monthly) and all three expanded
disclosures before it drives the four cycles.

The Current Affairs funnel had a stuck-state defect with the same shape as the
pricing toggle. `CAItemFunnel` hides the Watch step when an item has no video,
but it renders step content only when `current_step === 1 && video_available`.
A learner who had saved progress at step 1 and later saw the item's video
removed landed on a funnel with no visible step and no control to advance.
`get_ca_funnel_state` now reconciles saved progress on read: when the video is
gone and the saved step is below 2, it returns step 2 and counts step 1 as
skipped. The next completed step persists the reconciled set, so the repair is
not re-derived forever. `app/tests/test_ca_funnel_adapter.py` covers the four
cases (no-video start, video start, saved-watch recovery that then persists
`[1, 2]`, saved watch step preserved while the video exists) on a hermetic
SQLite session. The MCQ list, MCQ submit, and Mains prompt endpoints did not
share the published-only filter that guarded funnel state and complete-step,
so an unpublished or deleted item could still be read and scored by ID; all
five now use one helper. `app/tests/test_ca_funnel_api.py` pins the gate on
every endpoint, deleted items included, and checks that a refused submit
writes no progress row. The same component failed silently twice more: a rejected
funnel-state load left the pulsing skeleton forever, and a rejected MCQ load
was indistinguishable from "no MCQs" (which offers Continue). Both now render
an explicit retry, and an MCQ submit failure keeps the chosen answers and says
they were not scored, rather than rejecting unhandled. The item page now tells
a missing item ("does not exist or is no longer published") apart from a
failed request and offers a retry for the latter. The doubt chat now states
when earlier messages failed to load instead of showing an empty room, caps
its panel to the viewport width, and labels its close button. Quick Test now
keeps "no MCQs in this scope" apart from "the request failed" and offers a
retry for the latter; its panel is announced as a dialog. The progress bar,
threads timeline, and thread page stopped reporting failure as an empty result
(each now says the data could not be loaded and retries; a real missing thread
still reads "Thread not found"). The knowledge graph's silent `catch` is gone:
a failed load no longer renders the "No data for current filters" canvas and
offers a retry instead. Malformed item and thread URLs are rejected as a final
"not found" before any request, instead of sending `NaN` and mislabelling the
resulting 422 as a retryable failure. The graph page's data endpoint had never
been mounted, so `/current-affairs/graph` always answered 404; it now returns
published and non-deleted items, reviewed syllabus nodes, thread, causality,
and syllabus edges, and per-student completion flags, with no edge touching an
excluded node. Analytics coverage had the reverse leak: stored completions of
draft or soft-deleted items counted toward "completed" while the denominator
counted published items only, so coverage could exceed 100%; both the overall
and per-subject completed counts now join through the published, non-deleted
gate, pinned by two API tests.
`tsc --noEmit` and the full `npm run lint`
are clean (0 errors, 2026-10-30); the browser check stays unrun until reboot.

## Compiler deadlock

After journey27 compiled normally, the host stopped completing Next builds.
The first five webpack builds (journey28 twice, journey29, journey30, journey31)
and one Turbopack build (turbo1) each stopped at "Creating an optimized
production build…" with process CPU frozen at roughly 95–105 s, a frozen build
trace, and a flat working set — while the host itself was idle (about 4% total
CPU, 4.25 GB physical memory free). Deleting the partial dist and retrying with
a fresh `NEXT_DIST_DIR` and a 6144 MB heap did not change it; CI mode and
disabled telemetry did not either. A sixth attempt after the Mains copy round
(journey33, fresh isolated dist, same heap) froze the same way: CPU advanced
from 104.16 s to 104.84 s across 34 seconds of wall time with 1.63 GB resident,
then stopped; the process was terminated and the partial dist deleted. The
host had not been rebooted between attempts. The journey27 bundle remains the
last successful gate, and it predates the Mains copy correction, the Current
Affairs copy corrections, and the pilot-plan wording. Reboot the host before
re-running the build gate; the deadlock is an environment block, not a product
failure — typecheck and lint pass on the current tree.

On 2026-10-30 a dev server was tried as a lighter path around the build. Next
16.2.6 logged "Ready in 32.3s" and the port accepted a TCP listener, but a
request for `/upsc/answer-upload` never produced a compile log line and timed
out after 240 seconds; a second server could not bind because the first still
held :3000. The process was killed and the port freed. Dev mode is blocked the
same way as the build, so the reboot requirement stands.

Before the pricing script rewrite a further dev retry was made: `npm run dev`
on :3001 wrote no stdout or stderr at all and never bound the port; 16 probe
requests received no HTTP response. The process was stopped. No code bundle
exists for this round, and the host still reports its original boot time
(2026-10-28 16:28:57), so all browser checks remain unrun until reboot.

## What the journey proves

- A first-run student signs in on the welcome step, picks a level, and the
  final step names the starting topic ("Big Bang Theory and Origin of the
  Universe") with its reason (first open topic in syllabus order), its reviewed
  evidence (3 Prelims + 2 Mains PYQs mapped, 15 practice questions ready), and
  the beta boundary (28 of 69 Geography topics open now, 41 in preparation).
  "Get Started" records node 156 and hands over to the syllabus. The wizard
  only offers a `beta_ready` leaf, mirroring the server's tested 422 for a
  locked first topic instead of submitting a topic the learner cannot enter.
- The syllabus marks every one of its 69 leaves as either open now or in
  preparation (none undecided), and the interactive tree expands to 56 visible
  nodes under three collapsed roots.
- Each leaf on the map carries the reviewed PYQ evidence behind its demand:
  a `3P · 2M` chip whose tooltip names the Prelims and Mains counts (Mains
  counted at lower weight), plus a legend above the tree. The journey reads 27
  visible chips after expanding Geomorphology. Locked leaves keep their
  evidence, so a topic still in preparation says whether UPSC asks about it.
- The recorded starting topic is beta-open (node 156). The topic page renders
  its title, the 14-step funnel, and the demand strip from the same readiness
  model the dashboard uses: 3 reviewed Prelims PYQs, last Prelims 2022, 2 Mains
  PYQs (latest 2023) counted at lower weight, 4.7% of Geography demand, plus
  the learner's covered/depth and test-evidence state. It reads readiness with
  `persist=false`, so opening a topic never writes a snapshot.
- Learner navigation never links to the hidden CSAT shell (0 links). Other
  subjects are shown as "SOON" rather than as enterable rooms.
- The optional knowledge check opens and closes without blocking content.
- Planner and the readiness dashboard ("What UPSC asks vs. what you have
  covered") render for the student. The readiness card's Prelims band is
  withheld below 25% assessed demand and says so, and the demand copy names
  both Prelims and lower-weighted Mains PYQs per topic.
- Today's Plan contains only loop-ready topics: the beta-locked node 168 is
  absent even though a plan saved before scope enforcement used to name it.
  The plan regenerates from the scoped sequence, so a learner is never sent
  into a 409 from their own daily plan.
- Each scheduled topic explains why it is there: the two seeded rows read
  "Topic 1 of 28 · 3 Prelims + 2 Mains PYQs mapped" and "Topic 2 of 28 · 2
  Prelims + 1 Mains PYQs mapped". The journey reads that context from the
  rendered plan, and `journey-06-planner.png` captures both rows. The full
  demand share stays on the topic strip instead of being recomputed here, so
  the two surfaces do not drift.
- The Mains card renders the endpoint's insufficient state honestly: "0 of 3
  scored answers", "Insufficient evidence — no band shown", not a zero. The
  card states that it is built only from complete evaluator reports and prints
  "no selection, rank, or cut-off guarantee".
- The planner lists both seeded due recalls under "Topic revisits due", states
  the Day 3/7/21 track, and marks section recall as a separate track. Marking
  one reviewed changes today's queue from 2 to 1 and the API still queues only
  the other node (206).
- Opening a due topic shows its "Day 3 recall is due" banner and records the
  revisit, so spaced recall is a real loop, not planner-only copy.
- A topic outside the paid-beta scope (node 168, "Straits, Isthmuses, and
  Inland Waterways") shows "This topic is not open yet" with the authored
  explanation and a working "Back to the syllabus" link instead of a dead end.
- A failed growth report is visible, retryable, and still offers an explicit
  finish path; after retry the report shows "Not taken" / "Reading not
  recorded" / "No recall check" instead of zeros, the "Next section recall"
  date explains its conservative schedule, and the card states that it is
  separate from the Day 3/7/21 topic revisits.
- Finishing step 14 records completion, the completed-topic state opens the
  persisted growth report again, and the API keeps the stored snapshot's
  evidence flags and `has_mcq_evidence=false`.
- Practice lists only the 28 topics that pass the paid-beta gate, shows each
  topic's reviewed Prelims + Mains PYQ count and demand share (28 of 28 rows),
  discloses the topics still in preparation, and starts a session with its
  first question. A readiness failure leaves the practice list usable instead
  of hiding it.
- The weekly retrospective renders the completed-topic summary.
- `/auth/me` resolves ADMIN for the operator token, operator navigation is
  visible, and `/upsc/readiness-audit` renders.
- The operator content-coverage page reads the same database gates the learner
  hits: 28 of 69 Geography leaves are loop-ready. Each partial topic names its
  missing asset (for example node 168 is "15 short" of the lab minimum) and
  states that the lab never backfills from another topic.
- Operator navigation links the ADMIN console to `/upsc/content-coverage`, and
  the page points gaps at the real authoring path (extend the topic artifact,
  re-run the GS LMS importer). The page also states the refresh contract the
  importer honors: it updates in place, never clears tables, so learner
  progress and record IDs survive, and it rejects malformed MCQs rather than
  publishing them as reviewed.
- Revoking the cohort grant produces the deliberate "Beta access not active"
  state with the server message, not a crash; re-granting restores access.
- The breadcrumb no longer links to the parameterless `/lms/topic` route, so
  no RSC prefetch 404 is emitted from the topic page.
- No unexpected console errors and no uncaught page errors.

## Notes and residual warnings

- `middleware` convention is deprecated in Next 16; the build still emits a
  Proxy (Middleware) entry and works. Migration to `proxy.ts` is pending.
- Fonts are self-hosted (`src/app/fonts.css`, `public/fonts`, 24 woff2 files)
  instead of fetched from Google Fonts at compile time, so the build is
  offline-reproducible. Fallback `size-adjust` overrides are kept to avoid
  layout shift.
- The webpack build worker still stalls intermittently on this Windows host
  even with `experimental.webpackBuildWorker: false`: journey10, journey12,
  journey14, journey15, and journey17 idled at "Creating an optimized
  production build…" with no CPU growth, once for more than 30 minutes. The
  successful pattern is to kill only this project's build tree, delete the
  partial isolated dist dir, free port :3000, and retry with a fresh
  `NEXT_DIST_DIR` and `NODE_OPTIONS=--max-old-space-size=6144`. Journey16
  compiled that way in 4.3 min; journey17 stalled once at 2.5 GB RSS with
  ~3 GB free, then compiled in 9.0 min after the same reset; journey18
  compiled cleanly in 4.3 min (57 s TypeScript), and journey19 in 7.6 min
  (90 s TypeScript) with the same heap. Journey20 took 13.1 min (63 s
  TypeScript) on the same host; an earlier journey20 attempt was stopped
  deliberately to include a final copy edit, not because it stalled. Journey22,
  journey23, and journey24 each stalled at the same line; a second Next build
  from an unrelated workspace was competing for the host, and each partial dist
  dir was deleted rather than reused. Once that build exited, journey25
  compiled in 8.8 min (70 s TypeScript). Journey26 then idled at the same line
  for about 38 minutes (roughly 100 s CPU, no new dist files after the first
  two minutes); it was stopped and deleted, and journey27 compiled in 4.9 min
  (39.2 s TypeScript) on a fresh dist dir. The retry
  is a host workaround, not a product fix; the successful run is the gate.
  Next prints "Experiments (use with caution): ⨯ webpackBuildWorker", where ⨯
  marks the disabled experiment, not a failure.
- The local build writes to an isolated dist dir (`NEXT_DIST_DIR`). Next appends
  that dir's type shims to `tsconfig.json` on each isolated build; the
  `.next-build-journey27` shims were removed after this gate and `tsc --noEmit`
  was re-run clean. They are
  gitignored build artifacts, not source, and must be cleared before a plain
  `tsc --noEmit` if a later build re-adds them.
- CSAT direct access is honest rather than blocked: `/upsc/csat/lms/syllabus`
  still resolves (200) for a signed-in learner, but all 26 CSAT leaves report
  "in preparation" and every topic entry returns the beta-locked 409. The
  synthetic sections are never served as study material, and no learner surface
  links there.
- The readiness breadcrumb previously read "Gaps" above a page titled
  Readiness. `DashboardHeader` now labels the segment "Readiness"; the fix
  landed before the journey19 build, so the current bundle and screenshots
  carry it.
- Database integrity after the June destructive reseed: 36 dangling learner
  rows were deleted (backup `production.db.bak-orphan-repair-20261029155246`),
  and a later full FK scan found one more reference: `gs_lms_onboarding`
  student 1 pointed at deleted node 3. The title could not be recovered from
  any local backup, so the reference is NULL (backup
  `production.db.bak-onboarding-repair-*`) rather than silently pointing at an
  unrelated topic. A repeat scan reports 0 dangling references.
- SQLite now enforces foreign keys per connection (`PRAGMA foreign_keys=ON` in
  `app/db/session.py`). SQLite ignores FK constraints by default, which is how
  the destructive reseed silently orphaned learner rows; a broken delete now
  fails loudly locally the way it already does on Postgres. The seed still
  runs cleanly under enforcement, and the full suite reports no FK failures.
- The old `backend/scripts/delete_orphan_nodes.py` (opened the learner DB with
  `PRAGMA foreign_keys=OFF` and deleted nodes plus dependent progress rows,
  unreferenced by any code) is replaced by a read-only
  `backend/scripts/audit_orphan_nodes.py`. It opens the DB in SQLite read-only
  mode, reports empty-leaf counts and every dangling learner reference, exits 1
  if any are found, and never writes. Current run: 114 nodes, 0 empty visible
  leaves, 0 dangling references across the six learner tables.
- Full backend suite: 1150 passed, 0 failed, including the 31 Mains-outcome
  and paid-beta-scope tests, the new Mains reference-reveal tests (withheld
  while the job is running, revealed on completion, still revealed after a
  failed evaluation), the syllabus demand-evidence test, and the planner
  scope/plan-context tests. The earlier 20
  pre-existing failures were traced
  to test isolation, not product defects: `.env` optional-provider settings
  leaked into tests (now forced to the non-production mock policy by an autouse
  conftest), answer-eval fixtures lacked a `gs_subjects` row, used UNREVIEWED
  PYQs, and selected live Gemini (now seeded subject, REVIEWED PYQ, and
  `OPTIONAL_EVAL_PROVIDER=mock`), and two endpoint tests overrode auth with a
  bare `object()`.
- The backend on :8000 was restarted with the FK change and
  `APP_ENVIRONMENT=development ALLOW_MOCK_AUTH=true GS_LMS_ENFORCE_ACCESS=true
  GS_LMS_BETA_SCOPE=true`; `/health` returns 200, `/auth/me` resolves the ADMIN
  validator, the Mains endpoint returns an honest insufficient state (raw UTF-8
  em dash verified in the response bytes), and the operator coverage API
  reports the same 28/69 loop-ready state recorded by the journey.
- The production seed is now non-destructive for both subjects: Geography and
  CSAT are upserted by natural key, and nodes that fall out of the canonical
  tree are hidden (UNREVIEWED), never deleted. Verified against a copy of
  `production.db`: two runs created 0 nodes/sections and left all ID hashes
  and 4 section-progress rows identical (114 nodes, 408 sections, 29 CSAT
  nodes, 104 CSAT sections). The `ALLOW_DESTRUCTIVE_SEED=true` acknowledgement
  remains as a guard against accidental content replacement, but nothing is
  deleted.
- Payments remain closed (`READY_FOR_PAYMENT = false`).

## Induction plan copy correction (post-journey27, unbuilt)

The legacy `InductionChecklist` plan screen presented all eight GS subjects as
startable sprints although only Geography is beta-open, hardcoded "2026" in the
launch-month picker, plan subtitle, and congratulations screen, and printed a
2-day buffer for the 2026 attempt where the sequence allocates 1 day. It now
calls itself a target subject sequence, discloses the Geography-only beta scope
(28 of 69 topics) with per-sprint open / in-preparation state, resolves the
launch year from the chosen month (defaulting to the first offered month that
has not already passed), warns when the launch window falls at or after the
attempt year, and no longer claims a plan lock or Vision Document
registration (only attempt year and month are saved to the student profile).
The same walkthrough's "audited parameters" listed four features that do not
exist as written (AI keyword verification, comparative verdict sheets, 2–3 day
buffers, mood-adaptive pacing); those lists now name the real syllabus map,
reviewed PYQ evidence, inline self-check quizzes, deterministic concept-matched
recall, mood check-ins, planned buffers, and attempt-year planning.
`tsc --noEmit` and `npx eslint` are clean; this change is not in the journey27
bundle and has not been browser-verified.
The yearly planner's collapsed GS-blueprint cards also stopped offering an
"Open" link into the seven beta-gated subject roots; they now carry the same
"In preparation" badge as the timeline. `tsc --noEmit` and `npx eslint` are
clean on `UpscYearlyPlanner.tsx`; the planner truth check does not inspect
this collapsed section yet. The orientation slideshow likewise replaced its
false "95% recall gate" and "Active Attention Monitoring" slides with the real
recall check and reviewed-PYQ demand chips, and the launch animation no longer
announces an "Active Attention Guard".

## Billing and percentile copy correction (post-journey27, unbuilt)

`/upsc/billing` ignored the closed-payments boundary. Its no-subscription state
invited the learner to "Choose a plan to start your UPSC preparation journey"
and its empty history promised a "first purchase", although
`READY_FOR_PAYMENT = false` means no payment can be taken. Both states now read
`publicCommerceLaunchBoundary` and state that payments are not open, choosing
a plan only records intent, nothing is charged, and access stays unchanged;
the status line renders "No payment collected today" behind
`data-testid="upsc-billing-payment-boundary"`.
`dashboardService` also fabricated a percentile from the learner's own
accuracy (`Math.max(5, Math.min(99, Math.round(accuracy * 0.9 + 10)))`). No
backend endpoint computes or supplies a peer percentile, and no component or
test consumes the field, so it was removed from `PerformanceReport` and the
mapper. `tsc --noEmit` and `npx eslint` are clean on both files; neither change
is in the journey27 bundle and neither has been browser-verified.

## Optional Geography copy correction (post-journey27, unbuilt)

The live optional-Geography home and syllabus map claimed "the 25-year
question trend", but the trend data is a curated set of recurring themes with
frequency bands and best-effort year tags (the syllabus table itself says
"Years (best-effort)"). The home now says "a curated PYQ trend" and the card
describes the actual layer; the syllabus footer no longer says "Climatology is
next" (Climatology is already authored and mapped) and instead states that
Paper I Section B and Paper II are not authored. The unmounted legacy
`GeographyMapRoom` also promised "the official government-approved India map"
and "AI-generated handwritten / 3D" diagrams; it now labels itself a schematic
study outline with a Survey of India pointer for boundaries and marks diagram
cards "Illustration not authored yet". The component is not mounted by any
route and is recorded as dead code. `tsc --noEmit` and `npx eslint` are clean;
these changes are not in the journey27 bundle and are not browser-verified.

The pricing page carried the same pilot mismatch: "upgrade anytime" and
"Upgrades/downgrades take effect instantly, calculating credit values
dynamically" described a live billing engine that does not exist, the
"Systematic subject path" promised all GS subjects with "10-year trend maps",
and the inclusions named legacy talk rooms. Those lines now follow the
commerce boundary, name Geography as the open GS subject, describe the real
recall/practice loop, and replace the operator-only Source library link with
Optional subjects. The "Ready Database Anchors" heading is now "Coverage
snapshot". `tsc --noEmit` and `npx eslint` are clean on
`UpscPricingCommand.tsx`; not in the journey27 bundle and not browser-verified.

## Pricing quotas removed and marketing aligned to the live product (2026-10-30, founder-approved)

Two public promises had no backing in code: a per-day AI-hour quota and peer
ranking. There is no usage metering anywhere in the backend — `ProductPlan.limits`
existed only to be rendered — and no endpoint computes a percentile or rank.

The quota left the data model: `limits` is gone from `ProductPlan`, from all
four `planBases` entries and from `buildPlan` in
`frontend/src/lib/upsc/yearlyPlanner.ts`, along with the blocks that rendered
it in `UpscPricingCommand.tsx`, `UpscPricingCheckoutIntent.tsx` and the
"Includes: … AI hours" sentence in `UpscYearlyPlanner.tsx`. Pro now promises
"Deep diagnostics, unlimited practice, and mobile mains uploading" and Ultimate
"Complete command of the live portal, with direct guidance".

Public marketing was mirrored to the same truth. `site-data.ts` dropped the
`usage` field and its four "N hours daily AI interaction" strings; `/pricing`
deleted the usage callout, states that plans are recorded as intent while
payment collection is closed, replaced "Can I upgrade later?" with the
plan-intent answer, and changed the stats row from "GS subjects 8 / Optional
pages 48" to "GS live 1 of 8 / Optional live 3 of 25". Foundation now reads
"Live Geography GS path, more subjects as they ship", Plus "3 live optional
libraries, 22 more coming soon", and Ultimate no longer claims "Unlimited AI
interaction hours" or "No hourly or daily rate limits at all". The expired
"Launch pricing continued till 11/4" line is gone from `/pricing` and the home
pricing band.

Percentile and mock language followed. The home `testFeatures` card and the
`/tests` metadata now read "personal accuracy trend" instead of "All-India
percentile"; the home loop card says "Personal trend… progress, not a peer
rank"; `/test-series` marks "Rank/percentile among test takers" and
"Full-length mock tests" as not offered (`ours: false`), and its "100-question,
2-hour simulations" card became "Sectional Practice Sets… full-length mocks are
on the roadmap", matching `testFormats`, `/tests`, `/prelims` and `/llms.txt`.
No timed full-length mock exists in the product: the only `mock` references in
the code base are AI provider provenance. `/llms.txt` and `/llms-full.txt` now
describe the live Geography beta, the 3 of 25 optional libraries, the four
tiers with the plan-intent boundary, an explicit "no rank, score or selection
outcome is guaranteed" FAQ, and they no longer promise daily current affairs,
which has zero learner-visible items until reviewed items publish.

## Locked subjects' legacy day rooms redirect to the LMS (2026-10-30, founder-approved)

49 pages under
`src/app/(dashboard)/upsc/{economy,environment,history,polity-governance,science-tech,disaster-management,internal-security-society}/{watch,talk,lab,mcq-readiness,retro,revisit,track}`
rendered day-based rooms for subjects with no authored GS LMS content. Each is
now a server `redirect()` to `/upsc/{subject}/lms`, the same pattern the
subject root pages already used, so a bookmarked or linked room lands on the
page that honestly states the subject's beta status instead of an empty shell.
The `*SubjectRoutes` wrapper components (`EconomySubjectRoutes.tsx` and
friends) are no longer imported by any route and are recorded as dead code, not
deleted.

`npm run lint` (0 errors) and `npx tsc --noEmit` (exit 0) both pass after the
pricing, marketing and redirect batches (2026-10-30). None of this is in the
journey27 bundle and none of it is browser-verified; the host still cannot
produce a build.

## Current Affairs authoring pipeline and the first sourced items (2026-10-30, founder-approved)

The CA feed was empty because nothing authored content: no seed or ingestion
path existed, and the admin API accepts `subject`, `gs_paper`, `exam_relevance`
and `source_authority` as unvalidated free strings (which is how the one
soft-deleted `polity-governance` / `GS-II` artifact got in). Three pieces now
close that:

- `backend/content/current_affairs/items.json` is the authored content file.
  Each item carries its citation in a `source` content block, plus prelims
  statement frames, a so-what analysis, MCQs with explanations and Mains
  questions.
- `backend/scripts/seed_current_affairs.py` validates before writing. It checks
  the taxonomy against `CASubject`, `GSPaper`, `ExamRelevance` and
  `SourceAuthority`, the 1-5 relevance range, MCQ option-label/correct-answer
  agreement (mirroring the learner-side `quick_test._option_labels` rule), Mains
  marks/word-limit ranges, a required URL-bearing source block, and it rejects
  any payload that tries to set `review_status`. Everything it writes is
  `DRAFT`, so an item reaches a learner only after a reviewer moves it
  DRAFT → IN_REVIEW → PUBLISHED. `--check` validates without touching the
  database, and re-running skips rows already present.
- `backend/app/tests/test_ca_authoring_seed.py` (6 tests) pins those promises:
  the shipped content file validates and is cited, seeding writes drafts with
  their MCQ and Mains children, seeding is idempotent, an invalid
  `subject`/`gs_paper` is blocked with nothing written, a correct answer that
  matches no option label is rejected, and an uncited or self-publishing item is
  rejected.

Two items were authored from primary sources read in this session and seeded
into the local database as DRAFT (ids 2 and 3): the ISRO mission-list entry for
GSLV-F18/NVS-03 scheduled 30 October 2026, and IMD National Bulletin No. 22 of
27 October 2026 on the Very Severe Cyclonic Storm "Arnab" along and off the
Andhra Pradesh-Odisha coasts. Verified after seeding: `ca_items` holds 3 rows,
**learner-visible published count is still 0**, and both drafts carry 3 MCQs
each. `production.db.bak-20261030-085057-before-ca-seed` was taken first.

Three candidates were deliberately not authored because no primary source could
be read here, and they are recorded in the content file's `pending_verification`
list with the page to read: the RBI MPC meeting of 5-7 October 2026 (secondary
sources conflict — "unchanged at 5.5 per cent, neutral stance" versus "repo rate
5.25 per cent"), the all-India tiger estimation figure (only secondary
reporting), and the COP 31 Antalya schedule (the UNFCCC page returned no
quotable detail). Nothing was dated and quoted from a snippet.

Backend suite after this round: 1194 passed, 0 failed. Still open in this area:
publishing the drafts is a founder/reviewer action, and the local database is not
the production one. (The admin API's missing taxonomy validation was closed the
same round — see the next section.)

## The RBI item cleared verification and the second CA round (2026-10-30)

The conflict that held the RBI item out was resolved against the primary source.
The Monetary Policy Statement of 7 October 2026 (RBI's own page, press release
prid 63742) records a 25 bps **increase** of the policy repo rate to **5.50 per
cent**, the new stance **calibrated tightening**, minutes published 21 October
2026, FY 2026-27 real GDP growth projected at **7.1 per cent** and headline CPI
inflation at **5.2 per cent**, with the projected peak in the third quarter. The
earlier "unchanged at 5.5 per cent with a neutral stance" reading was wrong, and
the "Repo Rate: 5.25 per cent" figure was the pre-meeting rate quoted by a
pre-decision article. Two independent sources (the RBI statement and The Hindu's
same-day report) agree on the decision, the stance, 5.5 per cent, 5.2 per cent
and 7.1 per cent.

- Third authored item added to `backend/content/current_affairs/items.json` and
  seeded as **DRAFT id 4** (`economy` / `GS3` / relevance 5): four content blocks
  plus a status-of-this-note block, two cited source blocks, 3 prelims statement
  frames, 3 MCQs with explanations (how-many-correct on repo-rate mechanics and
  the Governor's casting vote; a stance-interpretation question; a
  multi-statement question on the statutory inflation framework) and 2 Mains
  questions (15/250 and 10/15). `production.db.bak-*-before-ca-rbi` was taken
  first; re-running the seeder skipped ids 2 and 3 as already present.
- Verified after seeding through the app's own ORM session: `ca_items` holds 4
  rows (1 soft-deleted legacy artifact + 3 DRAFT), id 4 has 3 MCQs and 2 Mains
  children, `created_by = seed_current_affairs`, and **learner-visible published
  count is still 0**. `seed_current_affairs.py --check` reports 3 valid items.
- The other two candidates stayed out and the `pending_verification` list now
  says why, with today's re-check recorded: **tiger estimation** — the NTCA
  reports page still shows the 2022 round as the latest published estimate, so
  the reported 10-15 per cent rise has no official release behind it (the PIB
  note that would cite it returns 403 to automated retrieval and needs a manual
  read); **COP 31** — `unfccc.int/cop31` and the UNFCCC COP body page returned no
  quotable content, so host and dates remain snippet-sourced.
- One new candidate was added and deliberately not authored: the **Constitution
  (131st Amendment) Bill, 2026 / delimitation package**. A single automated
  summary of the PRS page produced a Lok Sabha maximum of 850 on the 2011 census
  and the word "negatived", which contradicts the usual account of the package.
  Too central to polity prep to rest on one truncated summary — the full PRS page
  and the Gazette notification must be read first.

## The admin Current Affairs API now rejects the taxonomy that corrupted the feed (2026-10-30)

The seeder stopped bad rows from being *authored*, but the admin API was still the
open door. `app/api/v1/admin/ca_items.py` now validates at the schema layer, so a
bad payload fails as a 422 before any handler runs:

- `subject`, `gs_paper`, `exam_relevance` and `source_authority` are checked
  against `CASubject`, `GSPaper`, `ExamRelevance` and `SourceAuthority` on both
  create and update, and `secondary_subjects` against `CASubject`. `polity` is the
  polity value — the `polity-governance` / `GS-II` artifact already in the database
  could not be created through this API today (pinned by a test).
- `publish_date` must parse as an ISO date. Previously a value like `07/10/2026`
  reached `date.fromisoformat` inside the handler and produced a 500 instead of a
  rejection.
- Every MCQ must carry `{label, text}` options with unique non-empty labels and
  non-empty text, and a `correct_answer` that casefold-matches one of those labels
  (the same rule the learner-side `quick_test._option_labels` applies), so an
  unscoreable question cannot be saved.
- Mains children keep their existing `marks` 10-15 and `word_limit` 150-250 ranges
  and now also validate `gs_paper` against the enum.

`app/tests/test_ca_admin_schema_validation.py` (14 tests) pins all of the above and
asserts the API's enum map is the same object set the seeder validates against, so
the two doors cannot drift apart. Full backend suite after this change: **1208
passed, 0 failed** (90.5 s), up from 1194 before the new module. Not browser or
HTTP-transport verified: the tests exercise the schemas, and the host still cannot
produce a build to drive the real endpoint.

## Optional-subject workspace audit: what is real and what the frontend invents (2026-10-30)

The General Studies surfaces had been audited; the optional workspaces had not.
Audited against the backend through the app's own SQLAlchemy session
(`optional_subjects` = 2 rows: `sociology`, `geography`):

- **Geography optional is genuinely live**: 14 REVIEWED syllabus nodes, 14
  authored + reviewed content units, 26 reviewed PYQs.
- **Sociology has a row but no reviewed material**: 69 UNREVIEWED nodes, 0
  content units, 0 PYQs. Its completeness line reads `0/69 topics reviewed`.
- **Anthropology has no row at all**, so every `/api/v1/optional/anthropology/*`
  call 404s and `PUT /optional/selection` returns 404
  (`backend/app/api/v1/optional/selection.py:49-58`), yet the catalog marked it
  `available` and `SubjectShell.tsx:122-123` treats it as bespoke-authored, so a
  failed tree fetch leaves working Read buttons on topics with no reviewed
  content. `optional_video_segments`, `optional_map_locations`,
  `optional_map_questions`, `answer_attempts`, `progress_events` and `coverage`
  all hold **0 rows**.

Copy fixed this round (tsc exit 0, eslint clean; nothing browser-verified):
`OptionalCatalog.tsx`, `OptionalHomeEntry.tsx`, `site-data.ts` (the `/pricing`
stat is now "Optional reviewed 1 of 25" and the Plus tier says "Geography
optional with reviewed content; 24 more opening as they are authored"),
`yearlyPlanner.ts`, `llms.txt`, `llms-full.txt`, and the in-app
`UpscPricingCommand` stat, relabelled "Optional workspaces" at the time because
the number it rendered was derived from a hardcoded frontend flag rather than
reviewed content. (Once that flag came to mean reviewed content on 2026-10-31,
the label went back to "Optional reviewed 1 of 25" — see the next section.)
`optionalSubjectsCatalog.ts` now documents exactly what `available` means.

Defects found and NOT yet fixed, each needing a decision or a real endpoint:

1. **Local API mirrors fabricate data.** `frontend/src/app/api/v1/optional/**`
   held 11 route handlers that answered the review-gated optional endpoints
   in-process. `.../[slug]/completeness/route.ts` returned a hardcoded payload for
   any slug, including Geography's `imported_topics` list, and
   `src/lib/upsc/optionalDataResolver.ts:405-439` stamped `review_status:
   "REVIEWED"` on frontend TypeScript data, inventing years. With
   `NEXT_PUBLIC_API_BASE_URL` empty in `.env.production.local` (verified, not
   printed) a production build resolved `/api/v1/...` to these mirrors instead of
   FastAPI, so the workspace would display invented "reviewed" content. This was
   the single biggest threat to the one-stop promise. **Resolved 2026-10-31** —
   founder chose "point client at backend, delete mirrors"; see the section below.
2. **`PyqExplorer.tsx:166-171` renders the fabricated local resolver data with
   `state="loaded"`** when the API call fails; `ReadView.tsx:120-142` and
   `SyllabusView.tsx:163` share the same silent fallback pattern.
   **Resolved 2026-10-31** — see "Optional surfaces fail honestly" below.
3. **`GapPanel.tsx:245` shows `covered_percent.toFixed(1)`% as a measurement**
   while `progress_events` has 0 rows and no frontend caller of
   `recordProgressEvent` exists — so coverage is a permanent 0.0% presented as
   "your own tracked activity". **Resolved as a honesty defect 2026-10-31** (the
   panel now says "Not measured yet"); the underlying gap — nothing in the app
   records a progress event — is still open and is a feature decision, not a
   copy fix.
4. **`SubjectCompletenessLine` renders nothing when the fetch fails**
   (`SubjectShell.tsx:780`) instead of an honest "not measured".
   **Resolved 2026-10-31**, together with the sibling defect at
   `SubjectShell.tsx:160` where a failed syllabus-tree read fell back to the
   static structure heuristic and offered Read for every topic.
5. **Optional Q4 is unanswered**: no reachable optional surface tells the learner
   what to revise next; the plan generator lives only in the never-imported
   `OptionalSubjectLMS.tsx` (848 lines of dead code with its own false promises:
   "answer-writing + AI evaluation", "Readiness {avgScore}%" averaged from
   localStorage, a no-op "Download PDF", "Unlock course").

### Resolver de-claiming applied the same round

`src/lib/upsc/optionalDataResolver.ts` no longer asserts a review status it has
no authority to grant: all 8 `review_status: "REVIEWED"` stamps it built (including
the `isAuthored ? "REVIEWED" : "DRAFT"` ternary) now say `UNREVIEWED`, and the two
PYQ builders stopped inventing years — an entry with no parsable year is skipped
instead of being published as 2023 or 2022. Verified with `npx tsc --noEmit`
(exit 0) and `npx eslint` (exit 0) on the touched files.

This is a partial fix and must not be read as complete: `PyqExplorer.tsx` does not
filter on `review_status` at all (grep for `review_status` in it returns nothing),
so after a failed fetch it still renders the offline list to the learner. The
component-level fallbacks therefore stay open as task #57.

Frontend test coverage for this area is effectively zero: the only test file under
`src/__tests__` is `funnel-properties.test.ts`, which fails to collect ("no tests",
an audio/recording property test unrelated to these files but still a broken test),
and no test imports `optionalDataResolver`, `PyqExplorer`, `GapPanel` or
`SubjectShell`. There is nothing today that would catch a regression in the
optional surfaces, and no automated assertion backs any of the copy fixes above.

## The optional mirrors are gone and the client reaches FastAPI (2026-10-31, founder decision)

Founder decision: **"Point client at backend, delete mirrors."** All 11 handlers
under `frontend/src/app/api/v1/optional/**` were deleted
(`selection`, `[slug]/access`, `[slug]/completeness`, `[slug]/config`,
`[slug]/practice/status`, `[slug]/progress`, `[slug]/pyqs`,
`[slug]/pyqs/by-topic`, `[slug]/syllabus-analysis`, `[slug]/syllabus-tree`,
`[slug]/topics/[nodeId]/content`). Nothing fabricated optional data in the
request path any more.

Why the deletion is sufficient, verified rather than assumed:

- The browser never takes the env var. `src/services/api/base-url.mjs:18`
  returns `/api/v1/` whenever `isBrowser`, so `apiClient` always issues
  same-origin `/api/v1/optional/...` requests.
- Those requests are served by the `fallback` rewrite in `next.config.ts:25-31`
  → `buildApiRewriteDestination(backendUrl)` → `{origin}/api/v1/:path*`. A
  `fallback` rewrite is consulted **after** filesystem routes, which is exactly
  why the deleted route handlers were winning before: same path, real file.
- `backend/app/main.py:116` mounts the optional router at `/api/v1/optional`,
  and enumerating the live FastAPI app shows 27 optional endpoints covering
  **every** deleted mirror path plus `mapping`, `current-affairs`, `segments`,
  `answers`, `transcribe`, `ocr`, `review/queue` and `import-subject`. So no
  path lost a server; several that never had a mirror now stop being shadowed by
  a sibling file.
- No code referenced the mirrors: `npx tsc --noEmit` exits 0 with them gone, and
  the only remaining `/api/v1/optional/...` strings in `src` are doc comments in
  `optionalService.ts` and the module headers of `PyqExplorer`, `PracticeBoard`,
  `GapPanel`, `SyllabusView`, `MappingModule`, `ThinkersModule`,
  `CurrentAffairsFeed` — all of which call through `optionalService`/`apiClient`.
- The one same-origin handler that stays is `src/app/api/optional/discuss/route.ts`
  (no `/v1`, so it shadows nothing). It returns 503 with `retryable: true` when
  no Gemini key is configured instead of inventing a mentor reply. Fixed this
  round: the key is now sent in the `x-goog-api-key` header, not as `?key=` in
  the URL, so it no longer appears in the request target that upstream and proxy
  logs record. **New defect surfaced while fixing it, awaiting a founder
  decision:** the route is an unauthenticated AI proxy — `optionalDiscussService.ts:5`
  posts with no session token, so anyone can reach it and spend the operator's
  Gemini quota, with no per-user limit anywhere in the chain. Closing it means
  either attaching the Clerk token client-side and verifying it in the route, or
  routing optional doubt chat through the backend that already authenticates and
  scopes sessions to a student — `app/api/v1/gs_lms/discussion.py`'s
  `/api/v1/gs-lms/{subject_slug}/discussion/start` and `/discussion/{id}/turn`
  pair (`app/main.py:117`). Neither is a copy fix and neither is
  browser-verifiable while the host build is blocked, so it is listed as a
  security blocker rather than half-implemented.

Consequence for the deploy environment, added to the blockers below: with the
mirrors gone, `NEXT_PUBLIC_API_BASE_URL` is load-bearing. `env.ts:8` throws if it
is unset outside dev/build, and `next.config.ts:16` silently falls back to
`http://localhost:8000` — correct on this machine, wrong on a host where the
backend is not local. `launchEnvironmentBoundary.ts:121` already reports this as
`pending` when the var is missing.

Closed in the same area this round (task #57, section below): the component-level
offline fallbacks that rendered resolver data as loaded, and `GapPanel`
presenting 0 progress events as measured coverage. Still open: zero frontend
test coverage for these surfaces — the static validator and the new Playwright
checker cover them, but there is no unit-test runner in `package.json`.

## Anthropology and Sociology are coming-soon again (2026-10-31, founder decision)

Founder decision: **"Mark coming-soon until reviewed."** Neither subject has
reviewed content (Sociology: a row with 69 unreviewed nodes; Anthropology: no
`optional_subjects` row at all, verified again this round — the table holds
exactly 2 rows), so both flipped back to `status: "coming-soon"` in
`optionalSubjectsCatalog.ts`, which leaves Geography as the only `available`
optional. What that flag actually drives was checked, not guessed:

- `SubjectShell.tsx` gates the entire affordance group — Syllabus, PYQs,
  Practice, Gap, Recall, Mapping, Thinkers — plus `onOpenRead` and the
  completeness line on `status === "available"`, so hiding the Read affordance
  needed no new code; the buttons simply stop rendering. The config-driven
  `currentAffairs` affordance is independent of status, but only Geography and
  Sociology have DB rows and neither config enables it, so nothing live was
  hidden.
- The now-redundant `slug !== "sociology"` guard in the `authored` computation
  was removed; `status === "available" && hasBespokeStructure(slug)` is the whole
  rule, with a comment recording why the bespoke Anthropology/Sociology
  structures must not light the fallback up.
- The static `SUBJECTS_WITH_THINKERS` fallback for Sociology is documented as
  dormant until Sociology is reviewed.
- Because `available` now means reviewed content rather than "a skeleton
  renders", `SUBJECT_STATUS_META.available.description`, the catalog header and
  the `/pricing` stat were re-anchored to that meaning: the in-app stat reads
  "Optional reviewed 1 of 25", matching `site-data.ts` rather than contradicting
  it.
- Copy corrected in the same pass: `OptionalCatalog.tsx` hero,
  `OptionalHomeEntry.tsx`, `UpscYearlyPlanner.tsx` (the live planner section and
  the unmounted `OptionalSubjectsCatalog` export), `llms-full.txt`. `llms.txt`
  and the Plus tier already said "1 of 25 with reviewed content".

Behavior change worth stating plainly: a `coming-soon` card in the catalog now
**navigates** to `/upsc/optional-subjects/{slug}` instead of calling
`PUT /optional/selection` and labelling the result "Selected". A subject we
describe as not open cannot be persisted as the learner's choice, and for the 23
subjects with no backend row the PUT 404s — previously that surfaced as "could
not be saved; retry when the connection is available", which blamed the network
for a product state. The card's call to action reads "View structure", and the
target page states that no reviewed content is published and that nothing shown
is reviewed.

Verified with `npx tsc --noEmit` (exit 0) and `npm run lint` (0 errors, whole
project). Nothing here is browser-verified: the host compiler deadlock described
above still blocks a build.

### Verification harness realigned to the live optional pages

Four post-reboot checkers asserted copy and page shapes that no longer exist, so
they would have failed for reasons unrelated to the product:

- `scratch/verify-pricing-planner.cjs` expected the pricing stat
  `Optional live = 3 of 25`, the Plus feature "3 live optional libraries, 22
  more coming soon", and the planner line "25 subjects catalogued, 3 live". It
  now expects `Optional reviewed = 1 of 25`, the shipped Plus feature string, and
  "25 subjects catalogued, 1 with reviewed content", and fails if the retired
  "3 live" / "live Paper I/II workspaces" phrasing returns. (The Plus feature
  assertion had already been stale for a round — the tier string was rewritten on
  2026-10-30 and this checker was never updated.)
- `scratch/learner-surface-truth-e2e.cjs` got the same optional-count update.
- `scratch/verify-syllabus-pyq-trend-library.cjs` ended by waiting for
  `upsc-optional-detail` on `/upsc/optional-subjects/anthropology` and asserting
  ≥10 fabricated "Anthropology Paper I" year rows. That block now asserts the
  opposite: the retired testid is absent, and the coming-soon page has zero
  affordances, zero Read buttons and the honest note.
- `scratch/verify-optional-subject-pages.cjs` was rewritten. Its old version
  targeted a 48-card `upsc-optional-catalog` and `upsc-optional-readiness` /
  `upsc-optional-assembly-proof` detail pages; those testids live only in the
  unmounted exports inside `UpscYearlyPlanner.tsx`, so it could never have passed
  against the shipped app. It now checks the real contract: 25 cards with exactly
  one `available`, Anthropology/Sociology `coming-soon` with "View structure",
  clicking a coming-soon card navigates without selecting, the coming-soon shell
  renders no `open-*` affordance and no Read button, Geography keeps all five
  standard affordances, and mobile has no horizontal overflow. It also fails fast
  unless `${BASE_URL}/api/v1/optional/health` answers 200, which is the browser-
  side proof that the fallback rewrite now reaches FastAPI with the mirrors gone.

`scratch/verify-source-library-optional-pyq.cjs` still has the retired optional
detail leg (same dead testids) and asserts `optional subjects = 48`. That 48 is
the PYQ source-registry count on the operator `/upsc/source-library` page
(`syllabusPyqRegistrySummary.optionalSubjectCount`), a different measure from the
25 standard optionals in the learner catalog; the page is operator-facing and not
a coverage promise, so it was left alone, but the checker needs the same rewrite
before it is trusted. Tracked under task #35.

`scripts/validate-optional-catalog-routes.mjs` reported one violation this round:
it required `optionalSubjectRoute` to return
`` `${OPTIONAL_CATALOG_ROUTE}/${slug}` `` literally, while the shipped helper
resolves the slug through the catalog first and falls back to the catalog base for
an unknown slug. The guarded form can never link to a subject page that 404s, so
the rule now accepts both shapes and states which one it saw; the validator
passes (9 checks).

## Optional surfaces fail honestly instead of inventing data (2026-10-31, task #57)

The mirrors were deleted and the catalog status was corrected, but the learner
surfaces still had a second way to invent content: each one caught its own fetch
error and rendered the frontend's offline modules as if the backend had answered.
Founder rule applied here: a failed read is a failure, and a computed default is
not a measurement.

What changed, per surface:

- **`PyqExplorer.tsx`** — both request effects (year-wise and by-topic) dropped
  `resolvePyqs` / `resolvePyqsByTopic`. A rejected or malformed response now
  clears `data`, records the message and sets `state="error"`; the panel gained a
  `pyq-error-retry` control that bumps a request nonce, so "Try again" re-issues
  the real call. The by-topic effect also stops on `topicState === "error"`, so a
  failure is not a background retry loop. Defence in depth for the REVIEWED
  contract: `hasOnlyReviewedPyqs()` refuses any response whose rows are not
  `review_status === "REVIEWED"` with a finite year and non-empty question text,
  instead of rendering them — this closes the "never filters on review status"
  half of defect 2.
- **`ReadView.tsx`** — the tree effect, the content effect and the error panel's
  retry no longer call `resolveSyllabusTree` / `resolveTopicContent`. The old
  retry path was the worst case: it re-ran the offline fallback and marked the
  tree `loaded`. All three now clear the state they hold and show the failure;
  `reloadNonce` in both effect dependency lists makes Retry a genuine refetch.
  This also removes the invented `node_id`s (the offline resolver numbered topics
  1..N from the frontend structure, which are not backend ids).
- **`SyllabusView.tsx`** — dropped `resolveSyllabusAnalysis`; the request key
  gained a `nonce`, the catch stores `status: "error"` with the message, and
  `syllabus-view-error-retry` re-issues the call.
- **`PracticeBoard.tsx`** — dropped `resolvePracticeStatus`; a failed status read
  clears the board and shows `practice-error` with `practice-error-retry`.
- **`GapPanel.tsx`** — `isMeasuredCoverage()` decides whether a percentage is a
  measurement at all. With `covered_nodes === 0` (or an empty tree) the overall
  block renders `data-measured="false"`, a "Not measured yet" chip and the
  sentence "No syllabus activity is recorded for you in this subject yet, so
  there is nothing to measure — this is not a 0% score against your gaps"; no
  `gap-covered-percent` element and no progress bar are emitted. Per-paper rows
  get the same treatment. The header copy no longer claims the figure reflects
  "reading, practice, and recall", because nothing writes those events yet.
- **`SubjectShell.tsx`** — two fixes. `SubjectCompletenessLine` keeps a
  `{slug, status, data}` request state and renders a "Not verified" line when the
  read fails rather than returning `null`. The syllabus-tree effect that drives
  topic rows replaced the `treeReady` boolean with `AvailabilityStatus`
  (`loading | loaded | error`): on `error` every row is `data-authored="unknown"`,
  no Read button is offered, and an "Availability not verified" panel with a
  "Check availability again" control appears above the list. Previously a failed
  tree read fell through to the static `authored` heuristic, which lit up Read
  for every topic of an available subject exactly when nothing was known — the
  same defect that made Anthropology look readable.

`src/lib/upsc/optionalDataResolver.ts` is now imported by nothing in `src/app` or
`src/components`; its header records that it must not return as a client fallback.
Deleting it (with the other optional dead code) is still an open founder decision.

Verification, all of it static because this host cannot compile a bundle:
`npx tsc --noEmit` exit 0; `npm run lint` (project-wide) exit 0; `npx eslint`
clean on each touched file; `node scripts/validate-optional-honest-failure.mjs`
PASS with 16 checks (mirrors still absent, no learner surface imports the
resolver, every `.catch()` body records `"error"` and never `"loaded"`, each
failure panel has a nonce-backed retry, the REVIEWED guard is present, the gap
panel exposes both measured branches, the completeness line says "Not verified")
— the validator found one defect while being written, the `SubjectShell.tsx:170`
tree catch described above, which is why that catch changed shape; and
`node scripts/validate-optional-catalog-routes.mjs` still PASSes (9 checks).
Registered as `npm run verify:optional-honest-failure`.

The browser proof is `scratch/verify-optional-honest-failure.cjs` (syntax
checked, not run — no bundle can be built here). It aborts every `/api/v1/**`
call through Playwright routing and asserts the shell marks topics unknown with
zero Read buttons and a "Not verified" completeness line, that PYQ / syllabus /
practice / gap surfaces show their error panel plus retry with zero content rows,
then answers `/optional/geography/progress` with the untracked default and
asserts "Not measured yet" with no percentage element. It needs no backend, only
a served frontend, so it can run immediately after the reboot.

Remaining test gap, unchanged and now explicit: the frontend has **no test
runner** (`package.json` devDependencies are typescript/eslint/fast-check only,
and `src/__tests__/funnel-properties.test.ts` collects no tests). Component-level
regression cover therefore rests on the static validator plus the post-reboot
checker. Adding vitest + testing-library is a dependency decision held for the
founder, not something to slip into an honesty fix.

## Current Affairs: two more sourced drafts, and the discussion key moved out of the URL (2026-10-31, task #55)

**Feature verdict first.** Current Affairs is the one built feature that does not
yet serve its purpose: the learner-visible count is still zero. `production.db`
holds six `ca_items` — id 1 is the soft-deleted "E2E API cycle" artifact, ids 2-6
are authored drafts — and the gate that task #46 installed was re-confirmed by
reading it rather than assuming: `ca_engine.get_ca_feed`, `get_ca_item_detail` and
`get_daily_count` all filter `review_status == PUBLISHED` **and**
`is_deleted == False` (`backend/app/core/current_affairs/ca_engine.py:103-106`,
`148-152`, `157-161`), so nothing drafts or deletes its way into a feed. The
blocking step is a human reading the sources and moving each draft
DRAFT → IN_REVIEW → PUBLISHED; the seeder cannot do it by design.

**Two drafts added from sources that were actually read.** The held-out list in
`backend/content/current_affairs/items.json` used to carry three candidates that
automated retrieval could not confirm. This round:

- *Constitution (131st Amendment) Bill, 2026 and the Delimitation Bill, 2026* —
  authored as id 5. The earlier hold was that one truncated summary "does not
  match the usual account"; the full PRS pages were read and the account is what
  the tracker records: introduced 16 April 2026, **negatived** 17 April 2026,
  amending Articles 81-82 and raising the Lok Sabha maximum from 550 to 850 on
  the 2011 census, with the companion Delimitation Bill marked "Infructuous:
  Lok Sabha, Apr 17, 2026". The item states the 550-versus-543 distinction
  (Article 81's ceiling against present sanctioned strength) because the two
  cited sources use the two different numbers, and it derives the Article 368
  arithmetic from the reported 298-230 tally while labelling that derivation as
  computed. It asserts **no cause** of the defeat: the Gazette text and the
  debates are still unread and stay in the held list.
- *All-India Tiger Estimation* — authored as id 6, and authored **against** the
  claim that was held out. NTCA's own reports page and home page, read 31 October
  2026, still end at the 2022 round ("Status of Tigers-2022"), so the item teaches
  the 3,682 figure with its round named and says plainly that the percentage
  increase in secondary reporting is not in a published report. Two numbers in it
  could not be read off a primary page: the report PDF is 42 MB (over the fetch
  limit) and `pib.gov.in` PRID 2290233 returned 403 to automated retrieval again.
  Those two are written into the item's own status block with the links to open,
  and mirrored in `pending_verification`, so a reviewer cannot publish it without
  seeing the check.
- *COP 31 host and dates* — still not authored. `unfccc.int/cop31` again returned
  no quotable content, so the candidate stays in `pending_verification` untouched.

`venv/Scripts/python.exe scripts/seed_current_affairs.py --check` reports
"5 authored item(s) valid; 4 candidate(s) held for primary-source verification",
the seed run created ids 5 and 6 in DRAFT and skipped 2-4, the database was copied
to `production.db.bak-2026-10-31-ca-drafts` first, and the CA test subset still
passes (`pytest app/tests -k "current_affairs or ca_" -q` → 44 passed).

**The Gemini key left the query string.** `src/app/api/optional/discuss/route.ts`
now sends it in the `x-goog-api-key` header instead of `?key=` in the URL. While
fixing that, the route's other exposure became impossible to ignore: it accepts
unauthenticated POSTs and spends the operator's key with no per-user limit. That
is raised as task #59 for a founder decision (session-token gate in the route, or
move optional doubt chat onto the authenticated `/api/v1/gs-lms/{subject}/…`
discussion endpoints), not half-implemented here. `npx tsc --noEmit` exits 0 and
`npx eslint` is clean on the changed route.

## Exam portability: the answer to "is this a UPSC app or a revision platform?"

`EXAM_PORTABILITY_AUDIT.md` (2026-10-31) records that sweep and its verified
evidence. The headline for this gate document: the learning loop — syllabus tree,
content sections, MCQ mechanics, spaced revision, attempt telemetry, growth
reporting — is already exam-neutral (`scripts/seed_data.py:39-42` seeds Physics
and Mathematics through the same `Subject/Topic/Question/Test` tables), but there
is **no `exams` entity anywhere** in `backend/app`, and UPSC assumptions are
carried by `gs_lms_*`/`optional_*` naming, by two-valued enums
(`GsLmsExamTypeEnum` = PRELIMS/MAINS at `app/core/gs_lms/models.py:54-57`, used at
`:232` as a `NOT NULL` column), and by scoring constants that are inside the
"pure" readiness engine (`app/core/gs_lms/readiness.py:37-56`). Full backend suite
green at 1188 passed on 2026-10-31. Nothing in that audit was implemented: the
only step recommended during the beta is a no-behaviour, no-schema extraction of
those constants into a scored-profile module, and that is a founder decision.

## Release blockers still open

- `NEXT_PUBLIC_API_BASE_URL` (or `NEXT_PUBLIC_API_URL`) must be set to the real
  backend origin in the deploy environment. The optional surfaces now depend on
  it absolutely: the browser always requests `/api/v1/...`, the `fallback`
  rewrite forwards it to `buildApiRewriteDestination(backendUrl)`, and
  `next.config.ts:16` defaults that to `http://localhost:8000` when the var is
  missing — which would point a production site at itself.
- Postgres 16 cutover with a rehearsed backup/restore drill; SQLite cannot be
  migrated in place from empty.
- Cashfree schema repair, sandbox end-to-end test, webhook registration, and
  refund policy sign-off before any price is shown.
- `/health/ready`, observability, and SLOs for the paid cohort.
- Security headers, rate limits, and CORS review. Includes the decision on
  `src/app/api/optional/discuss/route.ts`: it is an unauthenticated Gemini
  proxy with no per-user limit (see the section above), so it is both a rate
  limit and an entitlement question, not a copy fix.
- Content truth sweep plus PYQ/MCQ coverage for the Geography beta scope.
  Coverage is measured, not guessed: 69 visible leaves, 69 with reviewed
  content, 28 loop-ready, 41 short of the 15-question lab, 40 with no reviewed
  PYQ demand, 41 missing a canonical section. Operators can trace each one in
  `/upsc/content-coverage`. CSAT is seeded with synthetic placeholder sections
  and is not beta-grade content; it is hidden from learner navigation and every
  topic is behind the beta gate, but it stays outside the beta until authored.
- Production startup refuses to boot unless `GS_LMS_ENFORCE_ACCESS=true` and
  `GS_LMS_BETA_SCOPE=true` (tested). Remaining: confirm the production
  environment sets them and that every invited learner has an ACTIVE
  `gs_lms_beta_access` grant.
- Paid subscription to GS LMS entitlement mapping (no existing capability flag
  is treated as entitlement).
- The Mains estimate is machine-scored, needs three distinct complete evaluator
  reports, and never claims a selection, rank, or cut-off. It is not a
  substitute for human evaluation in the beta.
- Privacy, terms, refund, support, and grievance pages; founder decisions on
  price, dates, refunds, keys, and legal review.
- Marketing copy is aligned to the live product (see the sections above), but
  it is text-only verification: no marketing page has been rendered from a
  built bundle on this host. Two founder decisions remain open in this area —
  whether `/test-series` should keep describing a full-length mock series that
  does not exist yet, and the unanswered "Sunday AI-Guided Retros" label, which
  promises an AI call that no code makes.
- Build and journey evidence above is local mock-auth only. Production
  deployment, real auth, and production E2E verification remain unproven.

## 2026-11-02: the compiler gate is still closed, and `tsc` is the usable check

Re-probed rather than remembered. The stale dev server that was squatting port
3111 (`PID 17456`) was killed with `taskkill /PID 17456 /F`, the port confirmed
free, and a fresh `npx next dev -p 3111` started cleanly —
`▲ Next.js 16.2.6 (Turbopack)`, `✓ Ready in 710ms` — and still served nothing:
two separate curls to `/` and `/upsc/geography/lms` each ran the full 45 seconds
and returned `http=000`. So the blocker is the host Next compiler, not a stuck
process or a port conflict, and **a reboot remains the only unblock**. Nothing
in this session changed that.

What can still be verified on this host, and was:

- `npx tsc --noEmit -p tsconfig.json` — exit 0. This is not a substitute for a
  bundle, but it does catch broken imports and type errors across all 400+
  source files, and it is the gate that proved the wiring fixes below compile.
- `npx eslint <changed files>` — exit 0, including the
  `react-hooks/set-state-in-effect` rule, satisfied the same way the LMS pages
  do it (defer the load by one tick with `window.setTimeout(…, 0)`).
- `npm run verify:upsc-wiring` — new, 6 checks, PASS, plus a planted-regression
  test proving it fails when a live surface re-introduces a retired room link.
- `verify:api-base` (5 fixtures), `verify:launch-env`, `verify:auth-role`,
  `verify:optional-honest-failure` (16), `validate-optional-catalog-routes` (9)
  — all re-run green, unchanged.
- Backend was not modified, so no `pytest` re-run was claimed.

Post-reboot, the checks that matter most from this pass are: a locked-subject
card on `/reports` (expect the not-open panel, not a 404), a Today-page planner
CTA and its syllabus-loop stages (expect LMS tabs), and the `/admin/cms` row
actions (Send to review / Publish actually moving a draft). Evidence and
reasoning for all of it: `UPSC_FEATURE_WIRING.md` in this directory.

## 2026-11-19: Full-app SRTR stabilization, P0 runtime/security fixes & multi-model cross-check (Pages 16–24)

**Host state:** Still under hardship H1 — `next build` and `next dev` did **not** run on this host, so zero browser rendering/click checks were executed. `frontend/tsconfig.json` confirmed clean of `.next-build-*` shims (H16).

**What passed on disk after all final edits (2026-11-19):**

- `npx tsc --noEmit -p tsconfig.json` — **exit 0, 0 errors** (fixed stray brace at `upsc/billing/page.tsx:261`, resolved all TS diagnostics across 400+ files).
- `eslint` across all `117` modified frontend `.ts/.tsx` files (Pages 17–24) — **exit 0, 0 errors** (including fixing React 19 `react-hooks/set-state-in-effect` at `MainsPracticeStep.tsx` L50/L96 and `billing/page.tsx`; 6 pre-existing non-blocking unused-var warnings remain only in `MobileAnswerUploader.tsx`).
- `npm run verify:srtr-stabilization` (`scripts/validate-srtr-stabilization.mjs`, new) — **PASS 6/6** (0 nested `<main>` across 271 scanned active `(dashboard)` & dashboard component files, `text-base` enforced on active inputs/textareas/selects, `/api/optional/discuss` learner auth + dual rate limit + header-only key + no `gemini-1.5-flash`, `source-archive` internal auth, `next.config.ts` security headers present, 0 hardcoded `:8000` URLs across 447 files).
- `npm run verify:upsc-wiring` (`6/6`), `npm run verify:auth-role` (`8/8`), `npm run verify:optional-honest-failure` (`16/16`), `node scripts/validate-optional-catalog-routes.mjs` (`9/9`, 8 dynamic skips), `npm run verify:api-base` (`5/5`), `npm run verify:launch-env` (`localReady: true`, `externalApplyReady: false`) — **all PASS**.
- `backend/venv/Scripts/python.exe -m pytest -q` — **1220 passed, 0 failed** (including unauthenticated `401` verification via FastAPI `TestClient` on `POST /api/v1/engagement/welcome` after adding `Depends(get_current_user)`).
- `backend/venv/Scripts/python.exe scripts/audit_orphan_nodes.py` — **exit 0** (114 nodes, 0 empty visible leaves, **0 dangling learner references**).

**Key technical closures verified by independent top-tier cross-check (`verifier-neon` & `verifier-argon`):**

- Eliminated all 35+ live nested `<main>` tags inside `(dashboard)` routes/components while preserving single `<main>` on public pages and keeping D3 retired files & D5 founder copy untouched.
- Fixed `ExamTimer.tsx` interval tear-down on rapid clicks and `00:00` persistence lockup across repeat attempts (`${testId}:${attemptId}` key), plus `McqLabStep.tsx` `coverageGap` reset across topic navigation and `exam/[testId]/page.tsx` revision drill normalization.
- Closed Task #59 (`/api/optional/discuss` auth + dual rate limits + 16KB/JSON bounds + `gemini-2.5-flash`), eliminated unauthenticated disk scans in `api/upsc/prelims-2026/{source-archive-summary,release-decision,main-site-handoff}`, auth-gated `POST /api/v1/engagement/welcome`, and added security headers in `next.config.ts`.
- **Note on sync:** GitHub `Ktej255/mcq-portal-frontend` `main` currently carries PRs #6–#9; local disk changes remain uncommitted per rule #5 pending founder approval for commit/PR #10 and post-reboot (D0) browser QA.

## 2026-11-19 (Phase 2): Safe De-Clutter (171 files removed), Unified Revision-First Command Center & Phase 0 `ExamProfile`

**Host state:** Still under hardship H1 — neither `next build` nor `next dev` ran, and zero browser checks were performed on this host.

**What was removed and verified (0 broken imports across 440 remaining frontend source files):**

- **Bucket 1 (84 Funnel/VSL source files + 3 funnel validator scripts):** Removed `src/app/dashboard/{funnels,vsl,all-funnels}`, `src/app/{f,vsl}`, `src/app/api/v1/{funnels,vsl,workspaces,cron,test-backbone,test-require-module}`, `src/components/{funnels,vsl}`, `src/lib/{funnels,vsl}`, and empty `src/app/dashboard` & `src/app/api/v1` parent directories.
- **Bucket 2 (26 zero-importer dead files + 2 empty directories):** Removed `Subject*Room.tsx` (9), `FragmentedSlideViewer.tsx`, `*SubjectRoutes.tsx` (7), `UpscCurrentAffairsBridge.tsx`, `OptionalSubjectLMS.tsx`, `ZenDashboard.tsx`, `subjectGuidedStudy.ts`, `optionalDataResolver.ts`, `observabilityService.ts`, and `components/admin/observability/{GovernanceGraph,MutationTimeline,TraceNode}.tsx` + empty `src/app/api/universe-topic`. Kept `SubjectFeatureSlot.tsx`, `GeographyReadContent.tsx`, `content-preview/**`, `.git_disabled/`, and `observability.py` (D4).
- **Bucket 3 (49 locked-subject room stub `page.tsx` files):** Replaced by a single `async redirects()` rule in `frontend/next.config.ts` (`/upsc/:subject(disaster-management|economy|environment|history|internal-security-society|polity-governance|science-tech)/:room(watch|talk|track|retro|revisit|mcq-readiness|lab)` → `/upsc/:subject/lms`, `permanent: false`).
- **Bucket 5 (6 zero-ref unmounted backend routers):** Removed `backend/app/api/v1/{causal,email_webhook,flourishing,governance,grounding,institutional}.py`.
- **Validator & Lint Tightening:** Emptied `RETIRED_CLUSTER`/`RETIRED_ROUTES` in `scripts/validate-upsc-feature-wiring.mjs`, shrank `RETIRED_D3_FILES` in `scripts/validate-srtr-stabilization.mjs` to `GeographyReadContent.tsx` only (plus checking `async redirects()`), and cleared all 6 unused-var warnings in `src/components/upsc/MobileAnswerUploader.tsx`.

**What was built (zero DB schema migrations):**

- **Unified Revision-First Backend & Frontend (`revision_service.py`, `revision.py`, `tests.py`, `revisionService.ts`, `(dashboard)/revision/page.tsx`, `exam/[testId]/page.tsx`, `UpscDailyMissionControl.tsx`):** Overconfidence Trap capture (`HUNDRED_PERCENT`/`FAIRLY_SURE` wrong answers → `is_overconfident=True`, `priority=1.5`), `mode=high_confidence_mistake` rapid drill, adaptive `spaced_repetition.py` (`1–90d`) + `blank|shaky|solid` calibration on `POST /api/v1/revision/{id}/complete`, unified `GET /api/v1/revision/command-center` (merging `RevisionQueue`, beta-scoped `GsLmsRevisitSchedule`, beta-scoped weak GS topics, `educational_memory_engine` alerts, and exam-countdown pacing), `POST /api/v1/revision/triage/evaluate` (`SOLID`/`RUSTY`/`BLIND_SPOT`), and `A..D` option key mapping for string-list `options_en` in `tests.py:104`.
- **Phase 0 `ExamProfile` (`backend/app/core/exam_profiles.py`, `test_exam_profiles.py`):** Parameterized `readiness.py`, `mains_outcome.py`, and `mcq_lab_scoring.py` via `ExamProfile` (`UPSC_CSE_PROFILE` default) with 100% constant & behavior parity.

**Final 11-gate verification results on disk (2026-11-19):**

- `npx tsc --noEmit -p tsconfig.json` — **exit 0, 0 errors**.
- `npx eslint --max-warnings=0` on all modified frontend files — **exit 0, 0 errors, 0 warnings**.
- `verify:upsc-wiring` (`6/6`), `verify:auth-role` (`8/8`), `verify:optional-honest-failure` (`16/16`), `validate-optional-catalog-routes.mjs` (`9/9`), `verify:api-base` (`5/5`), `verify:launch-env` (`localReady: true`), `verify:srtr-stabilization` (`6/6` across 199 dashboard files and 305 total files) — **all PASS**.
- `backend/venv/Scripts/python.exe -m pytest -q` — **`1234 passed, 0 failed`** (`96.26s`).
- `backend/venv/Scripts/python.exe scripts/audit_orphan_nodes.py` — **exit 0, 0 dangling learner references**.

## 2026-11-19 (Phase 3): 1-Screen Surgical Repair Cards, Paraphrase-Resilient Active-Recall Scoring, Adaptive Topic Revisits & Optional Progress Event Wiring

**Host state:** Still under hardship H1 — neither `next build` nor `next dev` ran, and zero browser checks were performed on this host.

**What was built and verified on disk (2026-11-19):**

- **Paraphrase-Resilient Active-Recall Scoring & Adaptive Topic Revisits (`backend/app/core/gs_lms/recall_scoring.py`, `backend/app/core/gs_lms/revisit.py`, `backend/app/api/v1/gs_lms/recall.py`, `backend/app/api/v1/gs_lms/revisit.py`, `backend/app/tests/test_gs_lms_recall_adaptive.py`):**
  - Added Strategy 4 (Stemmed Content-Token Paraphrase Match) to `score_recall` while keeping Strategies 1–3 intact.
  - Added `schedule_adaptive_revisit` (using `spaced_repetition.py` interval math and nested savepoint idempotency) and wired it into `submit_recall_text`, `submit_recall_audio` (when `recall_score < 0.8`), and `POST /api/v1/gs-lms/{subject}/revisits/{id}/complete?recall_score=...`.
- **Surgical 1-Screen Concept Repair Cards & 1-Tap Syllabus Triage Loader (`backend/app/api/v1/revision.py`, `frontend/src/services/api/revisionService.ts`, `frontend/src/app/(dashboard)/revision/page.tsx`):**
  - Enriched `GET /api/v1/revision/command-center` `priority_queue` items with real DB-backed `repair_card` payloads (`kind: "mcq_mistake"` for `revision_queue` items; `kind: "topic_concept"` with up to 5 reviewed concept bullets + 1 reviewed sample `GsLmsMcqQuestion` for `topic_revisit` and `weak_topic` items).
  - Added collapsible `"1-Screen Surgical Repair"` drawers with `"Core Concepts to Recall"` and interactive `"Instant Re-Test"` MCQs on `/revision`, plus a `"Load Top Geography Topics"` 1-tap bulk loader in `"Test Before You Read — 60s Topic Triage"`.
- **Optional Subject Progress Event Wiring (`frontend/src/components/upsc/ReadView.tsx`, `frontend/src/components/upsc/AnswerWorkspace.tsx` — Task #62 / D6):**
  - Wired `optionalService.recordProgressEvent` for `READ_COMPLETE` (`"Mark Topic Read · Update Coverage"` in `ReadView.tsx` with honest `role="alert"` error state) and `PRACTICE_PASS` (after persisted non-`review_required` evaluation in `AnswerWorkspace.tsx`).

**Final 11-gate verification results on disk (2026-11-19):**

- `npx tsc --noEmit -p tsconfig.json` — **exit 0, 0 errors**.
- `npx eslint --max-warnings=0` on all modified frontend files — **exit 0, 0 errors, 0 warnings**.
- `verify:upsc-wiring` (`6/6`), `verify:auth-role` (`8/8`), `verify:optional-honest-failure` (`16/16`), `validate-optional-catalog-routes.mjs` (`9/9`), `verify:api-base` (`5/5`), `verify:launch-env` (`localReady: true`), `verify:srtr-stabilization` (`6/6` across 199 dashboard files and 305 total files) — **all PASS**.
- `backend/venv/Scripts/python.exe -m pytest -q` — **`1246 passed, 0 failed`** (`90.61s`).
- `backend/venv/Scripts/python.exe scripts/audit_orphan_nodes.py` — **exit 0, 0 dangling learner references**.
