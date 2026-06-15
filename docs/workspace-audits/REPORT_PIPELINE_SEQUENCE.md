# Report Pipeline Sequence

Date: 2026-05-18

Scope: local staging, `http://127.0.0.1:3001` frontend, `http://127.0.0.1:8000` backend, SQLite staging DB `backend/production.db`.

## Dependency Chain

`submit button -> final autosave flush -> POST /attempts/{id}/submit -> generate_report -> run_async_cognitive_pipeline -> reports table -> GET /reports/{id} polling -> report render`

## Synchronous Work

- `frontend/src/app/exam/[testId]/page.tsx`: flushes saveable answers with `examService.saveAnswers(...)`.
- `backend/app/api/v1/attempts.py`: `POST /submit` calls `generate_report(...)`.
- `backend/app/services/report_service.py`: `generate_report(...)` computes score, accuracy, counts, negative marks, and writes a report row with `processing_status=PENDING`, `truth_status=UNVERIFIED`, `reliability_score=0`.

## Async Work

- `backend/app/api/v1/attempts.py`: schedules `reconcile_and_pipeline(...)` as a background task.
- `backend/app/services/report_service.py`: `run_async_cognitive_pipeline(...)` reconstructs telemetry, cognitive analysis, reliability, snapshot bundle, narrative, longitudinal profile, truth validation, and revision queue population.
- Final backend row is authoritative only after `processing_status=COMPLETED`, `truth_status=VERIFIED`, and finite positive `reliability_score`.

## Initial Incomplete Fields

- `processing_status`: `PENDING`
- `truth_status`: `UNVERIFIED`
- `reliability_score`: `0`
- `behavioral_analysis`: absent or incomplete until pipeline writes it
- `telemetry_summary`: absent or incomplete until pipeline writes it
- Recommendations/revision side effects: not final until after the background pipeline completes

## Root Cause

Before this pass, the frontend navigated to `/reports?attemptId=...` immediately after `POST /submit`, and `reports/page.tsx` rendered after a single `getReport(...)`. That allowed the student to see the synchronous report row before the async truth pipeline finalized.

## Current Local Flow

- `exam/[testId]/page.tsx` shows `Generating Forensic Intelligence Report` after submit.
- `dashboardService.waitForReportReady(...)` polls `GET /reports/{attemptId}`.
- `reports/page.tsx` also gates direct report loads and refreshes through the same readiness loop.
- Report content is not mounted until the readiness condition passes.

## Validation Knob

`backend/app/services/report_service.py` supports `REPORT_PIPELINE_DELAY_SECONDS` for local slow-pipeline validation. Default is `0`; it is not active unless explicitly set in the backend process environment.
