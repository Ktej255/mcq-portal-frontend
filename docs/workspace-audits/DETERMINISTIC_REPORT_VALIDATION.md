# Deterministic Report Validation

Date: 2026-05-18

Environment: local staging only. Production infrastructure was not available for this validation.

## Gates Run

- Graphify audit before report gate mutation: PASSED, blast radius 4.
- Graphify audit after report gate mutation: PASSED, blast radius 4.
- Graphify audit before/after autosave disable mutation: PASSED, blast radius 2.
- `npm run build`: passed after report gate and autosave disable changes.
- `npm run lint`: failed with `105 errors, 75 warnings`.

## Attempt A: 5 Correct

Attempt: `29`

Expected math:

- Correct: 5
- Incorrect: 0
- Skipped: 0
- Score: 10.00
- Accuracy: 100%
- Negative marks: 0

Evidence:

- First processing state at 1389 ms: `Generating Forensic Intelligence Report`; no report content.
- API at 1808 ms: `PENDING/UNVERIFIED/0`.
- DB at 1829 ms: `PENDING/UNVERIFIED/0`, score `10`, accuracy `100`.
- DB at 2845 ms: `COMPLETED/VERIFIED/97`.
- First report state at 3799 ms: `TRUTH VERIFIED`; no `PENDING VERIFICATION`; no `0% Reliability`.
- Final DB: correct `5`, incorrect `0`, skipped `0`, score `10`, accuracy `100`, reliability `97`.
- Forbidden visible state: false.

## Attempt B: 2 Correct / 3 Incorrect

Attempt: `30`

Expected math:

- Correct: 2
- Incorrect: 3
- Skipped: 0
- Score: 2.02
- Accuracy: 40%
- Negative marks: 1.98

Evidence:

- First processing state at 620 ms: `Generating Forensic Intelligence Report`; no report content.
- API at 1333 ms: `PENDING/UNVERIFIED/0`.
- DB at 1029 ms: `PENDING/UNVERIFIED/0`, score `2.02`, accuracy `40`.
- DB at 2533 ms: `COMPLETED/VERIFIED/97`.
- First report state at 3299 ms: `TRUTH VERIFIED`; no `PENDING VERIFICATION`; no `0% Reliability`.
- Final DB: correct `2`, incorrect `3`, skipped `0`, score `2.02`, accuracy `40`, reliability `97`.
- Forbidden visible state: false.

## Attempt C/D: Refresh During Processing + Slow Pipeline

Attempt: `33`

Backend delay: `REPORT_PIPELINE_DELAY_SECONDS=10`

Expected math:

- Correct: 5
- Incorrect: 0
- Skipped: 0
- Score: 10.00
- Accuracy: 100%
- Negative marks: 0

Evidence:

- Exam page after submit at 1446 ms: processing screen; no report content.
- Direct report URL at 2525 ms: processing screen; no report content.
- Browser refresh during processing at 3604 ms: processing screen; no report content.
- DB at 2756 ms: `PENDING/UNVERIFIED/0`.
- DB at 12867 ms: `PENDING/UNVERIFIED/97`; report still not rendered.
- DB at 13375 ms: `COMPLETED/VERIFIED/97`.
- API at 13704 ms: `COMPLETED/VERIFIED/97`.
- Final report visible at 15192 ms: `TRUTH VERIFIED`; no `PENDING VERIFICATION`; no `0% Reliability`.
- Final DB: correct `5`, incorrect `0`, skipped `0`, score `10`, accuracy `100`, reliability `97`.
- Forbidden visible state: false.

## Console Evidence

Current controlled attempts no longer show post-submit autosave `409 Conflict`.

Remaining console issues:

- `FORENSIC | Auth Not Found during mount`
- `Failed to load resource: the server responded with a status of 404`
- Recharts width/height warnings on report charts

## Release Status

This local staging pass demonstrates deterministic report rendering for the tested controlled attempts. It does not clear production release because production infra was unavailable, lint still fails, Firebase runtime remains noisy, static 404 remains, and Recharts warnings remain.
