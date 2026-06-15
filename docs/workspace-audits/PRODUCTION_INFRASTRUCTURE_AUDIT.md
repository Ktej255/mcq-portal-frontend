# Production Infrastructure Audit

Date: 2026-05-18

## Known Targets

- Frontend: `https://mcq-portal-frontend.vercel.app`
- Backend: `https://mcq-backend-822862054564.us-central1.run.app`
- GCP project: `mcq-intelligence-portal`

## Cloud Run Status

Command:

`gcloud run services list --project mcq-intelligence-portal`

Result:

- `PERMISSION_DENIED`
- `CONSUMER_SUSPENDED`
- Consumer: `projects/822862054564`

## Backend Health

Command:

`curl -i https://mcq-backend-822862054564.us-central1.run.app/health`

Result:

- HTTP `404 Not Found`
- Body: Google `Page not found`

## CORS Probe

Command:

`OPTIONS /api/v1/dashboard/summary` with origin `https://mcq-portal-frontend.vercel.app`

Result:

- HTTP `404 Not Found`
- No usable API/CORS validation possible because backend service is not reachable.

## Frontend Status

Command:

`curl -I https://mcq-portal-frontend.vercel.app`

Result:

- HTTP `307 Temporary Redirect`
- `Location: /dashboard`
- Served by Vercel.

Production browser probe:

- `/login` renders.
- Static noise asset still requests `https://grainy-gradients.vercel.app/noise.svg` and receives `404`.
- This proves production frontend is not yet redeployed with local Phase 3 fixes.

## Migration Status

Local migration status:

- `python -m alembic current` -> `b29e6d8c4a12 (head)`
- `python -m alembic heads` -> `b29e6d8c4a12 (head)`

Production migration status:

- Unverified. Cloud Run/GCP project is suspended and production DB cannot be inspected.

## Verdict

Production infrastructure is blocked. Backend, production DB, production CORS, production auth, and production E2E are not validated.
