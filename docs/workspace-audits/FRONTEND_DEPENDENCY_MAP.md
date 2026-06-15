# Frontend Dependency Map

Date: 2026-05-18

## Owning Feature: Exam Attempt Runtime

Primary route:

`frontend/src/app/exam/[testId]/page.tsx`

Component tree:

- `ExamInterface`
- `ExamHeader`
- `QuestionPalette`
- `RadioGroup` / `RadioGroupItem`
- `ConfidenceSelector`
- `ExamReviewOverlay`
- `FeedbackModal`

Dependent hooks:

- `useExamStore`
- `useTimerStore`
- `useAutoSave`
- `useSessionRecovery`
- `useExamIntegrity`

API dependencies:

- `examService.getQuestions`
- `examService.getTestById`
- `examService.saveAnswers`
- `examService.submitTest`
- `eventsService.record`
- `eventsService.flush`

Shared UI constraints:

- shadcn-style `Button`, `Badge`, `RadioGroup`, `Label`
- `lucide-react` icons
- no layout redesign during stabilization

Mutation risk:

- Any change to `setAnswer`, `clearResponse`, `saveAnswers`, or submit ordering affects educational truth.
- Submit has no answer body; the source of truth is persisted answer rows before submit.

## Owning Feature: Report Rendering

Primary route:

`frontend/src/app/(dashboard)/reports/page.tsx`

Component tree:

- `ReportsPage`
- metric summary cards
- topic reconciliation section
- detailed review table
- adaptive recommendation blocks

Dependent services:

- `dashboardService.getReport`
- `dashboardService.getReportReview`
- `dashboardService.getEvolution`
- `dashboardService.getRecommendations`

API dependencies:

- `GET /api/v1/reports/{attempt_id}`
- `GET /api/v1/reports/{attempt_id}/review`
- `GET /api/v1/dashboard/evolution`
- `GET /api/v1/dashboard/recommendations`

Shared UI constraints:

- Recharts responsive containers require stable nonzero dimensions.
- Report truth badges must not render optimistic state from stale initial data.

Mutation risk:

- Any display fallback can hide report truth mismatch.
- Any frontend-calculated score is forbidden; report page must render backend values.

## Owning Feature: API Token Resolution

Files:

- `frontend/src/services/api/client.ts`
- `frontend/src/lib/auth/token-strategy.ts`
- `frontend/src/lib/contexts/AuthContext.tsx`

Dependency chain:

`AuthContext` -> `token-strategy` -> `apiClient interceptor` -> every protected API request

Runtime evidence:

- `MOCK_TOKEN` works locally.
- Firebase runtime is not clean because required Firebase env vars are missing.

Mutation risk:

- Any ad-hoc token handling risks 401 loops and false report failures.
