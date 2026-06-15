# Production Recovery Plan

## Current Production Block

Cloud Run access for `mcq-intelligence-portal` is blocked:

`CONSUMER_SUSPENDED`

Live backend URL found in repo artifacts:

`https://mcq-backend-822862054564.us-central1.run.app`

Observed production result:

- `/health` returns Google 404
- Dashboard CORS/API sync fails from production frontend

## Recovery Steps

1. Unsuspend/reactivate the GCP project that owns Cloud Run.
2. Confirm `gcloud run services list --project mcq-intelligence-portal` works.
3. Deploy backend at Alembic head `b29e6d8c4a12`.
4. Confirm backend `/health` returns 200.
5. Confirm CORS accepts the production frontend origin.
6. Set production frontend API env to the working backend `/api/v1` base.
7. Rebuild/redeploy frontend.
8. Run browser E2E: login, tests, start, solve, submit, report, history, revision, download.
9. Replace or repair Environment Batch 1 question 42 before labeling the batch complete.

## Fallback

If the suspended project cannot be restored, deploy the backend to an approved active GCP project and repoint the frontend API URL. This requires explicit production approval.
