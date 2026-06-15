# Report Truth Race Conditions

Date: 2026-05-18

## Race 1: Submit Response vs Background Pipeline

Evidence from attempt `33` with `REPORT_PIPELINE_DELAY_SECONDS=10`:

- API at 1945 ms: `processing=PENDING`, `truth=UNVERIFIED`, `reliability=0`
- API at 12945 ms: `processing=PENDING`, `truth=UNVERIFIED`, `reliability=97`
- API at 13704 ms: `processing=COMPLETED`, `truth=VERIFIED`, `reliability=97`

Risk: reliability can become nonzero before `processing_status` and `truth_status` are final. A reliability-only frontend check is insufficient.

Control: readiness requires all final signals, not only reliability.

## Race 2: Direct Report URL During Processing

Evidence from attempt `33`:

- Browser direct report page at 2525 ms: processing screen, no report, no pending badge, no zero reliability.
- DB at 2756 ms: `PENDING/UNVERIFIED/0`.

Control: `reports/page.tsx` does not set `report` state until `waitForReportReady(...)` returns.

## Race 3: Refresh During Processing

Evidence from attempt `33`:

- Browser reload at 3604 ms: processing screen, no report, no pending badge, no zero reliability.
- DB at 3763 ms: `PENDING/UNVERIFIED/0`.

Control: the report route reconstructs readiness from the API after reload and remains in processing state.

## Race 4: Autosave After Submit

Earlier A/B validation surfaced post-submit `409 Conflict` console errors from autosave attempting writes after the attempt lock moved to submitted.

Control: `useAutoSave(attemptId, disabled)` now accepts a disabled flag; the exam page disables autosave while report processing is active. Current attempts `29` and `30` no longer show post-submit autosave 409 errors.

## Remaining Runtime Mismatches

- Mock auth still logs `FORENSIC | Auth Not Found during mount`.
- Static resource 404 still appears in browser console.
- Recharts still logs width/height warnings on report render.
- `npm run lint` still fails with `105 errors, 75 warnings`.
