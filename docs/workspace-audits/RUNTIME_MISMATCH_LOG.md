# Runtime Mismatch Log

Date: 2026-05-18

## Mismatch 1: Report First Render vs Final Report Truth

Observed during controlled browser attempts.

Evidence:

- Immediately after submit, browser report snippets showed `PENDING VERIFICATION` and `0% RELIABILITY`.
- Later API/DB for the same attempts showed `truth_status=VERIFIED`, `processing_status=COMPLETED`, and nonzero `reliability_score`.
- Direct reload of attempt `22` later rendered `TRUTH VERIFIED` and `77% RELIABILITY`.

Root cause hypothesis:

- `POST /submit` returns the synchronously generated report before `run_async_cognitive_pipeline` completes.
- The report page fetches once and does not deterministically poll or reconcile until `processing_status=COMPLETED`.

Impacted files:

- `backend/app/api/v1/attempts.py`
- `backend/app/services/report_service.py`
- `frontend/src/app/(dashboard)/reports/page.tsx`
- `frontend/src/services/api/dashboardService.ts`

Status:

- Local staging mitigation applied in this pass.
- `frontend/src/services/api/dashboardService.ts` now exposes `waitForReportReady(...)` and `isReportReadyForStudent(...)`.
- `frontend/src/app/exam/[testId]/page.tsx` now waits on report readiness after submit before route transition.
- `frontend/src/app/(dashboard)/reports/page.tsx` now polls readiness on direct report loads and refreshes.
- Validation evidence is recorded in `DETERMINISTIC_REPORT_VALIDATION.md`.
- Production verification is still unavailable; do not treat this as production release clearance.

## Mismatch 2: Console Auth Errors During Mock Flow

Evidence:

- Browser console reports missing Firebase env vars.
- Browser console reports `FORENSIC | Auth Not Found during mount`.
- Mock token requests still succeed.

Impacted files:

- `frontend/src/lib/firebase/config.ts`
- `frontend/src/lib/contexts/AuthContext.tsx`
- `frontend/src/lib/auth/token-strategy.ts`

Status:

- Mock auth local runtime is now console-clean in browser validation.
- Real Firebase auth still requires production/env validation.
- Evidence: full student journey attempt `39` captured `events: []`.

## Mismatch 3: Static Resource 404

Evidence:

- Browser console repeatedly logs `Failed to load resource: the server responded with a status of 404`.

Impacted surface:

- Frontend static assets or favicon/noise URL.

Status:

- Fixed locally.
- Evidence: login/tests/report Playwright probe captured no 404 responses after replacing the external noise URL with `/noise.svg`.

## Mismatch 4: Recharts Container Warning

Evidence:

- Browser warning: chart width/height reports `-1`.

Impacted file:

- `frontend/src/app/(dashboard)/reports/page.tsx`

Status:

- Fixed locally.
- Evidence: report route and full student journey attempt `39` captured no Recharts warnings after measured chart-frame replacement.

## Mismatch 5: Lint Gate Failure

Evidence:

- Initial lint reported `105 errors, 75 warnings`.
- Phase 3 lint reported `32 errors, 37 warnings`.
- Phase 4 lint reports `0 errors, 0 warnings`.

Status:

- Fixed locally.
- Production release remains blocked by infrastructure/auth, not lint.
