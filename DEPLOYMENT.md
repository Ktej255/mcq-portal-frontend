# Deployment Guide

Owner-confirmed stack: **Vercel** (frontend), **Supabase** (data), **Clerk** (auth).
The build is deploy-ready (`tsc` + `eslint` pass). The agent does not hold hosting
credentials, so the steps below are performed by the project owner / deployment agent.

## Frontend → Vercel

1. In Vercel, **Import** `Ktej255/mcq-portal-frontend`.
2. Framework preset: **Next.js** (auto-detected). Default build command; no `vercel.json` needed.
3. Set **Environment Variables** (Production + Preview):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base, e.g. `https://<backend-host>/api/v1` |
| `NEXT_PUBLIC_AUTH_PROVIDER` | `clerk` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | e.g. `/login` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only) |
| `RESEND_API_KEY` | Enables lead-magnet email delivery (`/api/lead`) |
| `LEADS_NOTIFY_EMAIL` | Inbox that receives new leads |

4. Deploy, then point the domain (e.g. `upsccommand.com`) at the Vercel project.
5. After the domain is live, add it to the backend CORS allow-list.

## Lead magnet (Resend)

The diagnostic at `/start` posts captured leads to `/api/lead`. With
`RESEND_API_KEY` + `LEADS_NOTIFY_EMAIL` set, each lead is emailed to your team.
Without them, the flow still works for the user; leads are just not delivered.
Update the `from` address in `src/app/api/lead/route.ts` to a verified Resend
domain for production.

## Backend → host of choice

The backend repo (`mcq-portal-backend`) is a FastAPI app with a `Dockerfile`.
Deploy to Cloud Run / Render / Railway / Fly, and set:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed origins (add the live frontend domain) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase/GCP service-account JSON path |
| `FIREBASE_PROJECT_ID` | Firebase project id |
| `GOOGLE_API_KEY` | Gemini key |

See `INTEGRATION.md` (backend repo) for the full API/CORS/auth contract.

> If the project standardises on **Supabase + Clerk** end-to-end, aligning the
> backend's auth (currently Firebase) and data layer is a separate, scoped task.

## Status

Deployment is owned by the project's Vercel/Supabase setup (or the designated
deployment agent). This repository is ready; no code changes are required to deploy.


## Analytics (optional, env-gated)

Set these in Vercel to enable analytics (the app loads them only when present):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID (e.g. `G-XXXXXXX`) — loads gtag |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console `google-site-verification` token (adds the meta tag) |
