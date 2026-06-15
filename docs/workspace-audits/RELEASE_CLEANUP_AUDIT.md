# Release Cleanup Audit

Date: 2026-05-18

Scope: Local staging frontend/backend, mock auth, `backend/production.db`.

## Runtime Noise Cleanup

- Firebase env noise: removed in mock-auth local runtime by gating Firebase initialization on `NEXT_PUBLIC_USE_MOCK_AUTH=true`.
- Auth mount noise: removed by preventing Firebase-auth error logging when mock auth is active.
- Static 404: removed by replacing external grain texture URL with local `frontend/public/noise.svg`.
- Recharts width warning: removed by replacing report chart `ResponsiveContainer` usage with measured chart frames.
- Exam integrity console warning: removed from console path; integrity still records warning state in UI.

## Files Changed For Cleanup

- `frontend/src/env.ts`
- `frontend/src/lib/firebase/config.ts`
- `frontend/src/lib/contexts/AuthContext.tsx`
- `frontend/src/lib/auth/token-strategy.ts`
- `frontend/src/services/api/client.ts`
- `frontend/src/app/(auth)/login/[[...login]]/page.tsx`
- `frontend/src/app/(dashboard)/reports/page.tsx`
- `frontend/src/components/report/LongitudinalGrowth.tsx`
- `frontend/src/lib/hooks/useExamIntegrity.ts`
- `frontend/public/noise.svg`

## Build Gate

- `npm run build`: passed.
- Remaining build warning: Next.js `middleware` convention deprecation.

## Lint Gate

- Current full lint: `32 errors`, `37 warnings`.
- Runtime-critical student-flow slice cleaned: exam, reports, dashboard, tests, history, revision, auth/token, API client, autosave, report services.
- Remaining lint debt is concentrated in admin, observability, validation scripts, and low-risk dashboard display components.

## Runtime Evidence

- Browser console probe across login -> tests -> report: `events: []`.
- Full browser journey attempt `39`: `events: []`.
- Download evidence: `mcq-report-attempt-39.txt`.

## Remaining Release Blockers

- Full lint gate is not closed.
- Production backend and deployment remain unverified.
- Next middleware deprecation remains.
