# Firebase Runtime Validation

Date: 2026-05-18

## Local Env Verification

Local `.env.local` contains Clerk placeholders and `NEXT_PUBLIC_API_URL`, but the app reads `NEXT_PUBLIC_API_BASE_URL`.

Missing local Firebase public env vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Local mock auth is browser-clean, but mock auth is not a Firebase production validation.

## Production Login Probe

Target:

- `https://mcq-portal-frontend.vercel.app/login`

Browser action:

- Clicked `Connect with Google`.

Observed popup:

- `https://mcq-intelligence-portal.firebaseapp.com/__/auth/handler?...providerId=google.com...`

Observed Firebase request failure:

- `https://identitytoolkit.googleapis.com/v1/projects?key=...`
- Status: `403`

Observed console error:

- `auth/permission-denied:-consumer-'api-key:...'-has-been-suspended`

## Required Scenarios

| Scenario | Status | Evidence |
| --- | --- | --- |
| Real Firebase login | Failed | Identity Toolkit returned 403 suspended consumer |
| Token refresh | Blocked | Login cannot complete |
| Dashboard auth persistence | Blocked | Login cannot complete |
| Report route auth | Blocked | Login cannot complete |
| Refresh after inactivity | Blocked | Login cannot complete |
| Logout/login recovery | Blocked | Login cannot complete |
| Expired token handling | Blocked | Login cannot complete |

## Verdict

Firebase production auth is blocked by suspended Google/Firebase consumer state. Do not claim production auth validation until the GCP/Firebase project is restored or replaced and these scenarios are re-run.
