# Report Render State Machine

Date: 2026-05-18

## States

`ANSWERING`

- Student is in `frontend/src/app/exam/[testId]/page.tsx`.
- Autosave is active while the attempt is editable.

`FINAL_SYNC`

- Triggered by final submit.
- The exam page calls `examService.saveAnswers(...)`.
- Autosave is disabled once the report-processing state mounts to prevent post-submit 409 autosave retries.

`BACKEND_SUBMITTED`

- The exam page calls `examService.submitTest(...)`.
- Backend returns a synchronous report row, but the frontend does not render that report.

`REPORT_PROCESSING`

- Fullscreen student-facing state: `Generating Forensic Intelligence Report`.
- Visible steps: scoring reconciliation, telemetry verification, cognitive analysis, recommendation generation.
- No score, accuracy, truth status, or reliability placeholders are rendered.

`POLLING_FOR_TRUTH`

- `dashboardService.waitForReportReady(...)` polls `GET /reports/{attemptId}` every 1200 ms.
- The reports page uses the same loop for direct loads and refreshes.

`REPORT_READY`

- Required condition:
  - `processingStatus || processing_status == COMPLETED`
  - `truth_status == VERIFIED`
  - `reliability_score` is finite and greater than `0`
  - `behavioral_analysis` exists
  - `telemetry_summary` exists

`REPORT_RESTRICTED`

- If `processing_status == FAILED` or `truth_status == FAILED`, polling throws and the report is not rendered.

## Forbidden Transition

`BACKEND_SUBMITTED -> REPORT_READY` without polling is forbidden because `POST /submit` can return `PENDING/UNVERIFIED/0`.

## Direct URL/Refresh Behavior

`/reports?attemptId={id}` starts in `REPORT_PROCESSING` and remains there until `REPORT_READY`. A browser refresh during backend processing repeats the same state machine rather than mounting partial report content.
