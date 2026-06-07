# Gemini Live Apply Checklist

## Current Boundary

The Geography Talk room is safe for local rehearsal. It uses a learner-authenticated server route, structured fallback guidance, a local 12-request burst limit, a prepared Supabase distributed limiter, a 12-second provider timeout, a 13-second browser timeout that releases stalled learner actions back to local guidance, and persisted prompt/rubric trace versions.

It is not yet production AI. The live provider key is intentionally absent.

## Server Configuration

- [ ] Add `GEMINI_API_KEY` as a server-only Vercel secret. Never create a `NEXT_PUBLIC_GEMINI_API_KEY`.
- [ ] Optionally add `GEMINI_MODEL`. The current default is `gemini-2.5-flash`.
- [ ] Apply `supabase/migrations/20260531_upsc_adaptive_teacher_rate_limit.sql`.
- [ ] Run `supabase/verify/20260531_upsc_adaptive_teacher_rate_limit_checks.sql`.
- [ ] Add `SUPABASE_SECRET_KEY` as a server-only Vercel secret using the `sb_secret_...` backend key. Never create a `NEXT_PUBLIC_SUPABASE_SECRET_KEY`.
- [ ] Deploy a preview build and confirm the browser bundle does not contain the key.
- [ ] Confirm `/api/upsc/teacher/discuss` returns `mode: "gemini"` and `providerConfigured: true` for a real authenticated learner.

## Live Evaluation

- [ ] Run `node scratch/verify-adaptive-teacher-api.cjs`.
- [ ] Run `node scratch/verify-adaptive-teacher-evaluation.cjs`.
- [ ] Run `node scratch/verify-adaptive-teacher-talk.cjs`.
- [ ] Review at least 15 curated Geography answers across weak, developing, and command bands.
- [ ] Compare live provider guidance with the persisted prompt version, rubric version, recall target, and local score.
- [ ] Reject any prompt version that invents facts, skips a UPSC trap, or advances a learner below the 95% recall gate.

## Before Wider Release

- [ ] Confirm deployed Talk requests use the Supabase-backed distributed limiter. Non-local AI requests intentionally fail closed until it is configured.
- [ ] Add streaming UI only after the non-streaming live response is stable.
- [ ] Apply the Supabase learner-state migration and verify same-account continuity across two browser profiles.
- [ ] Complete a controlled tester wave before public sharing.
