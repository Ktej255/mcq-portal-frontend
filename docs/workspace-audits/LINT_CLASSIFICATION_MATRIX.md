# Lint Classification Matrix

Date: 2026-05-18

## Current Totals

- Before cleanup: `105 errors`, `75 warnings`.
- After Phase 3 cleanup: `32 errors`, `37 warnings`.

## A. Release-Critical

Status: fixed in focused slice.

- `frontend/src/app/exam/[testId]/page.tsx`
- `frontend/src/app/(dashboard)/reports/page.tsx`
- `frontend/src/lib/contexts/AuthContext.tsx`
- `frontend/src/lib/auth/token-strategy.ts`
- `frontend/src/services/api/client.ts`
- `frontend/src/lib/hooks/useAutoSave.ts`
- `frontend/src/services/api/dashboardService.ts`
- `frontend/src/services/api/contracts.ts`
- `frontend/src/services/api/eventsService.ts`

## B. Runtime-Risk

Status: fixed in student journey slice.

- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/app/(dashboard)/tests/page.tsx`
- `frontend/src/app/(dashboard)/history/page.tsx`
- `frontend/src/app/(dashboard)/revision/page.tsx`
- `frontend/src/components/dashboard/DailyWorkspace.tsx`
- `frontend/src/components/dashboard/ConceptRecoveryModal.tsx`
- `frontend/src/components/exam/ExamHeader.tsx`
- `frontend/src/components/exam/ExamTimer.tsx`
- `frontend/src/components/exam/FeedbackModal.tsx`
- `frontend/src/components/exam/QuestionPalette.tsx`

## C. Hygiene-Only

Remaining warnings:

- `frontend/src/components/layout/DashboardSidebar.tsx`
- `frontend/src/components/shared/LanguageSwitcher.tsx`
- `frontend/src/components/dashboard/StudentTrajectoryCard.tsx`
- `frontend/src/components/dashboard/RevisionHistory.tsx`
- `frontend/src/components/dashboard/EnergyMonitor.tsx`

## D. Legacy/Deferred

Remaining errors are concentrated outside the student attempt/report path:

- Admin: `admin/founder`, `admin/dashboard`, `admin/questions/bulk`
- Observability: `observabilityService`, `MutationTimeline`
- Scripts: `prod-validation.cjs`, `runtime-validation-cdp.cjs`
- Shared UI: `components/ui/textarea.tsx`

## Release Decision

Lint is improved but not closed. Do not mark the release approved until remaining errors are either fixed or explicitly waived by governance.
