# Verification gates — re-run 2026-11-15

Raw, unedited output is in `RAW_GATE_OUTPUT_2026-11-15.txt`. Everything below was
executed on this host today, not quoted from an older session.

## What passes

| Command (run from `frontend/`) | Result today | What it actually proves |
| --- | --- | --- |
| `npx tsc --noEmit` | **exit 0, zero diagnostics** | All 400+ source files type-check, imports resolve. This is the real gate on this host — it is what caught the wrong import path in the 11-02 LMS layout. It does **not** prove anything renders. |
| `npx eslint <files>` | **exit 0** on the 11 files changed in the wiring pass — wall time **over 5 minutes** | Lint clean, including `react-hooks/set-state-in-effect`. Run it in the background; on this host it is slow enough to look hung. |
| `npm run verify:upsc-wiring` | **PASS 6/6** | No live surface links to a retired day room; the planner routes through the shared LMS map; all 5 mapped LMS segments have a `page.tsx`; a locked subject renders the not-open panel instead of 404ing; the CA reviewer can move an item through review from the list and a failed read shows as a failure; the CA status map matches `ca_engine.VALID_TRANSITIONS`. Mutation-proven: planting a retired-room href fails check 1. |
| `npm run verify:optional-honest-failure` | **PASS 16/16** | Optional learner surfaces fail honestly (error states, retry, reviewed-only rendering, "Not measured yet"). |
| `node scripts/validate-optional-catalog-routes.mjs` | **PASS 9/9** across 7 selected-Optional files | No literal subject-specific selected-Optional links; 4 dynamic templates deliberately not guessed. **There is no `verify:optional-catalog-routes` npm script** — run the file directly. |
| `npm run verify:api-base` | **PASS — "API base URL fixtures passed: 5"** | The browser always requests `/api/v1/...` and the rewrite destination is built correctly. |
| `npm run verify:launch-env` | exit 0 | Reports `"externalApplyReady": false` and the OAuth / two-profile continuity rehearsal as `"ready": false`. That is the honest state, not a pass toward launch. |
| `npm run verify:auth-role` | **8 passed, 0 missing** | Sidebar operator tools depend only on the server-derived `isAdmin`; `isOperatorRoute` no longer elevates navigation; operator write callers send the provider token via `resolveToken`. |
| `cd backend && venv/Scripts/python.exe -m pytest -q` | **not run today** | Last full run 2026-10-31: **1188 passed, 0 failed**. No backend file changed since, so the number stands — with its date attached. |

## What cannot be run on this host

| Command | State |
| --- | --- |
| `npm run build` / `node scripts/build-isolated.mjs` | **Dead.** No bundle has completed since journey27. Frozen at "Creating an optimized production build…" with process CPU stuck ~95–105 s while the host idles. Fresh dist dir, 6144 MB heap, CI mode, telemetry off, webpack vs Turbopack, and killing the stale dev-port process were all tried. |
| `npx next dev -p <port>` | **Dead.** Binds and prints `✓ Ready in 710ms`, then serves nothing — 45-second curls return `http=000`. |
| Any browser/E2E journey | **Blocked** by the two rows above. Requires a built bundle or a working dev server. |
| Frontend unit tests | **No runner in use.** `src/__tests__/funnel-properties.test.ts` collects no tests. Frontend regression cover is the `scripts/validate-*.mjs` + `verify:*` convention above. |

**The unblock is a reboot of the founder's laptop**, and it has not happened as of
2026-11-15. Ask before doing it. Note hardship H15 in the handoff: builds were already
stalling weeks before this boot, and one cause was a second Next build from another
workspace competing for the host — so after a reboot, run exactly one build at a time,
and treat a still-frozen build as an environment question rather than a code question.

## The two checks to run the moment the compiler lives

1. A locked-subject card on `/reports` — expect the "Not open in the beta yet" panel,
   not "Page not found".
2. A Today-page planner CTA and its syllabus-loop stages — expect LMS tabs, not retired
   rooms. Then `/admin/cms` row actions actually moving a draft through
   Send to review → Publish.

Closing those also closes tasks #35 (copy fixes verified in a production bundle) and #53
(review and publish the five Current Affairs drafts).
