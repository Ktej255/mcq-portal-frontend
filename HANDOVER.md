# Deployment Handover Prompt (for the deployment agent)

Copy everything below into your deployment agent.

---

You are taking over the **Sarit Classes — UPSC Command** project to deploy it to
production. The application code is complete and reviewed; your job is to merge
the open PRs and deploy. Do not rebuild features — deploy what exists.

## Repositories
- Frontend: `Ktej255/mcq-portal-frontend` — Next.js 16 / React 19 / Tailwind 4.
- Backend: `Ktej255/mcq-portal-backend` — FastAPI 2.0.0 / SQLAlchemy / PostgreSQL (has a `Dockerfile`).

## Target infrastructure (owner-confirmed)
- **Frontend hosting:** Vercel
- **Data:** Supabase
- **Auth:** Clerk

## Read these first (they contain everything)
- `PROJECT_LOG.md` (frontend root) — chronological record of all work + conventions + site map + status.
- `DEPLOYMENT.md` (frontend root) — full deploy steps and env-var tables for Vercel / Supabase / Clerk / backend.
- `INTEGRATION.md` (backend root) — API surface (`/api/v1`), CORS, auth flow, backend env vars.
- `beyond-seo/SKILL.md` (frontend `main`) — the SEO/AEO standard to preserve on any future page work.

## Current state
- **Frontend PR #2** (branch `feat/marketing-website`) — full marketing site + content + SEO/AX + diagnostic lead magnet + dashboard demo + real pricing + the docs above. Owner approved for merge.
- **Backend PR #1** (branch `docs/integration-guide`) — integration guide. Owner approved for merge.
- Type-check (`npx tsc --noEmit`) and lint (`npx eslint`) pass on the frontend.

## Your tasks (in order)
1. **Merge** frontend PR #2 and backend PR #1 into `main`.
2. **Deploy the backend** (FastAPI `Dockerfile`) to its host and note the public URL. Set env:
   `DATABASE_URL`, `BACKEND_CORS_ORIGINS` (include the live frontend domain), `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_PROJECT_ID`, `GOOGLE_API_KEY`.
3. **Deploy the frontend on Vercel** — import `Ktej255/mcq-portal-frontend`, framework auto-detects Next.js (no `vercel.json` needed). Set env:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://<backend-url>/api/v1`
   - `NEXT_PUBLIC_AUTH_PROVIDER` = `clerk`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`, `LEADS_NOTIFY_EMAIL` (activates the lead-magnet email at `/api/lead`)
4. **Point the domain** (e.g. `upsccommand.com`) at the Vercel project, then add that exact origin to the backend `BACKEND_CORS_ORIGINS`.
5. For the lead magnet, set the Resend `from` to a **verified domain** in `src/app/api/lead/route.ts` (currently `onboarding@resend.dev`).

## Post-deploy verification
- Home, `/start`, `/demo`, `/pricing`, `/subjects`, `/current-affairs`, `/pyqs`, `/tests`, `/guides`, `/methodology` all render.
- `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/opengraph-image` all return 200.
- Complete the `/start` diagnostic → submit the email step → confirm a lead email arrives at `LEADS_NOTIFY_EMAIL`.
- Clerk login works and `/login?redirect=/upsc` reaches the authed dashboard, which calls the backend (check browser network tab + CORS).
- Submit your sitemap in Google Search Console once live.

## Constraints
- Never push to `main` directly outside the merge; for any fixes, branch → PR.
- Don't duplicate the existing authed dashboard at `(dashboard)/upsc`.
- If standardizing auth/data on Supabase + Clerk, note the backend currently uses Firebase + PostgreSQL — treat that alignment as a separate scoped task, not part of this deploy.
- After deploying, append a dated entry to `PROJECT_LOG.md` recording the live URLs and any config decisions.

---

(End of handover prompt.)
