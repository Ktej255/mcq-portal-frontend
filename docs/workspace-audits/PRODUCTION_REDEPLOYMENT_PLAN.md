# Production Redeployment Plan

Date: 2026-05-18

## Trigger

The current `mcq-intelligence-portal` Google project is suspended:

- `CONSUMER_SUSPENDED`
- Backend Cloud Run URL returns Google `404`.
- Firebase Identity Toolkit returns `403` suspended consumer.

## Strategy

If the existing project cannot be restored, redeploy into an approved active GCP/Firebase project and repoint the frontend.

## Backend Deployment Sequence

1. Provision active GCP project.
2. Enable required APIs:
   - Cloud Run
   - Artifact Registry
   - Cloud Build
   - Secret Manager
   - Cloud SQL or approved PostgreSQL provider
3. Create production database.
4. Apply migrations in order through Alembic head `b29e6d8c4a12`.
5. Deploy backend service.
6. Verify:
   - `/health`
   - `/api/v1/dashboard/summary`
   - `/api/v1/tests`
   - `/api/v1/reports/{attempt_id}`
7. Configure CORS for production frontend origin.

## Firebase/Auth Migration

1. Create or restore Firebase project.
2. Enable Google provider.
3. Register production frontend domain.
4. Export frontend public vars:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. Confirm backend accepts Firebase tokens from the new project.

## Frontend Env Migration

Set production frontend:

- `NEXT_PUBLIC_API_BASE_URL=https://<new-backend>/api/v1`
- `NEXT_PUBLIC_USE_MOCK_AUTH=false`
- Firebase public vars from the active project.
- `NEXT_PUBLIC_DEBUG_API=false`

Then redeploy frontend and confirm the static noise asset is local `/noise.svg`.

## Rollback Strategy

- Keep old frontend deployment available but do not route student traffic to it while backend/auth are suspended.
- Use Cloud Run revision traffic splitting for backend rollback.
- Snapshot production DB before migration.
- Do not run destructive data migrations without backup verification.

## DNS/Env Impact

- Backend URL replacement affects frontend env, CORS allowlist, Firebase authorized domains, and operational validation scripts.
- Firebase project replacement affects token issuer/audience validation in backend auth middleware.

## Release Gate After Redeploy

Run:

1. `npm run build`
2. `npx eslint`
3. `python run_operational_verification.py`
4. `python institutional_release_check.py`
5. Production browser E2E
6. Production DB reconciliation
7. Production Firebase token refresh validation
