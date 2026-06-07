# Supabase Live Apply Checklist

Use this checklist before inviting real students. The local portal wiring is present, but the live database migration and Google OAuth callback still need dashboard-side application and rehearsal.

## 0. Run The Local Preflight

- [x] Run `npm run verify:launch-env`.
- [x] Confirm the browser-safe Supabase URL and key are configured locally without printing their values.
- [x] Confirm both prepared migration files are present.
- [x] Link this workspace to the existing `upsc-command` Vercel project before pulling or adding deployment secrets.

## 1. Apply The Learner-State Migration

- [ ] Open the Supabase project dashboard.
- [ ] Open **SQL Editor** and create a new query.
- [ ] Paste and run `supabase/migrations/20260531_upsc_learner_state.sql`.
- [ ] Confirm both tables are created:
  - `public.upsc_student_profiles`
  - `public.upsc_subject_progress`

## 2. Verify RLS And Policies

- [ ] Run `supabase/verify/20260531_upsc_learner_state_checks.sql`.
- [ ] Confirm both rows in the first result show `row_level_security_enabled = true`.
- [ ] Confirm one `ALL` policy exists for each learner-state table.
- [ ] Confirm each policy binds access to `auth.uid() = user_id`.

## 3. Apply The Adaptive-Teacher Rate Limit

- [ ] Paste and run `supabase/migrations/20260531_upsc_adaptive_teacher_rate_limit.sql`.
- [ ] Run `supabase/verify/20260531_upsc_adaptive_teacher_rate_limit_checks.sql`.
- [ ] Confirm `upsc_adaptive_teacher_rate_limits` has RLS enabled.
- [ ] Confirm only `service_role_can_execute = true`; both learner-facing execution checks must be false.
- [ ] Add `SUPABASE_SECRET_KEY` to Vercel as a server-only secret using the `sb_secret_...` backend key.
- [ ] Never create `NEXT_PUBLIC_SUPABASE_SECRET_KEY`.

## 4. Configure Google OAuth In Supabase

- [ ] In **Authentication > Providers**, enable Google.
- [ ] Add the Google OAuth client ID and client secret.
- [ ] In **Authentication > URL Configuration**, set the production site URL.
- [ ] Add the production callback allow-list entry for the deployed student URL.
- [ ] Keep localhost callback entries only for local testing.

## 5. Configure Vercel Browser Environment

- [x] Add `NEXT_PUBLIC_AUTH_PROVIDER=supabase`.
- [x] Add `NEXT_PUBLIC_SUPABASE_URL`.
- [x] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` using the browser-safe Supabase publishable key or legacy anon key.
- [ ] Never place a Supabase `sb_secret_...` key in a `NEXT_PUBLIC_...` variable.
- [x] Create a protected preview deployment after the browser variables are saved.
- [ ] Promote a verified preview to production only after the live SQL and OAuth continuity gates pass.

## 6. Rehearse A Real Student Session

- [ ] Open the deployed portal in a fresh browser profile.
- [ ] Sign in with Google.
- [ ] Complete the UPSC self-study profile.
- [ ] Finish one Geography Talk action and continue into the learning loop.
- [ ] Sign out.
- [ ] Open a second browser profile, sign in with the same Google account, and confirm the profile and Geography progress return.
- [ ] Sign in with a different account and confirm it cannot see the first student's state.

## 7. Release Boundary

- [ ] Keep legacy backend-dependent MCQ exam pages hidden until their API backend decision is complete.
- [ ] Keep internal command, audit, revision, and Geography testing routes master-only.
- [ ] Invite the first student only after the two-browser continuity rehearsal passes.
