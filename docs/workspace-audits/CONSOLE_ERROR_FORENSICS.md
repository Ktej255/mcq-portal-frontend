# Console Error Forensics

Date: 2026-05-18

## Firebase Runtime Env Errors

- Source file: `frontend/src/env.ts`, `frontend/src/lib/firebase/config.ts`
- Trigger: local/mock runtime lacked Firebase public env vars.
- Failure mode: Firebase config warnings/errors appeared despite mock auth being the intended local auth path.
- Dependency chain: `env.ts` -> `firebase/config.ts` -> `AuthContext.tsx` -> login/dashboard.
- Fix: added `NEXT_PUBLIC_USE_MOCK_AUTH`; Firebase initializes only when config is complete and mock auth is off.
- Proof: Playwright login/tests/report probe returned `events: []`.

## Auth Not Found During Mount

- Source file: `frontend/src/lib/contexts/AuthContext.tsx`
- Trigger: `auth` was null in mock auth mode.
- Failure mode: console emitted auth-not-found even though mock token requests succeeded.
- Dependency chain: `AuthContext.tsx` -> token strategy -> API client interceptor.
- Fix: mock auth path now supplies a mock user and avoids Firebase-auth errors when mock mode is active.
- Proof: full journey attempt `39` completed with `events: []`.

## Static Asset 404

- Source file: `frontend/src/app/(auth)/login/[[...login]]/page.tsx`
- Trigger: external `https://grainy-gradients.vercel.app/noise.svg`.
- Failure mode: browser reported static resource 404.
- Fix: replaced external URL with local `/noise.svg`.
- Proof: Playwright login/tests/report probe returned `events: []`.

## Exam Integrity Console Warning

- Source file: `frontend/src/lib/hooks/useExamIntegrity.ts`
- Trigger: route changes/browser automation caused visibility events during exam.
- Failure mode: `console.warn("Integrity Violation: Tab switch detected")`.
- Fix: integrity state remains recorded in React state/UI, but routine integrity events no longer emit console warnings.
- Proof: full browser journey attempt `39` returned `events: []`.
