# Production Browser E2E

Date: 2026-05-18

## Target

- `https://mcq-portal-frontend.vercel.app`

## Execution Status

Full production E2E was not executable because production auth and backend are blocked.

## Browser Evidence Collected

Route:

- `/login`

Observed:

- Login page renders.
- Clicking `Connect with Google` opens Firebase auth handler.

Failures:

- Static asset 404: `https://grainy-gradients.vercel.app/noise.svg`
- Firebase Identity Toolkit 403.
- Console error: Firebase `auth/permission-denied` because the API key consumer is suspended.

## Required Flow Status

| Step | Status |
| --- | --- |
| Login | Failed |
| Dashboard | Blocked |
| Tests | Blocked |
| Start exam | Blocked |
| Refresh during exam | Blocked |
| Resume attempt | Blocked |
| Submit | Blocked |
| Deterministic report | Blocked |
| Review answers | Blocked |
| Revision queue | Blocked |
| History | Blocked |
| Export report | Blocked |
| Mobile viewport | Blocked |

## Verdict

Production browser E2E is blocked. Local browser E2E evidence does not substitute for production evidence.
