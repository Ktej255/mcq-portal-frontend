# HANDOFF — read this first if you are an agent

This folder is the entry point for `D:\Development\MCQ Portal` (product name: **UPSC
Command**, a paid beta for UPSC aspirants). Everything an incoming agent needs to start
without re-deriving three weeks of work is here.

## Contents

| File | What it is | Read it when |
| --- | --- | --- |
| `AGENT_HANDOFF_2026-11-15.md` | The full handoff: rules of engagement, environment runbook, the build blockade, architecture, chronicle, 19-entry hardship log, verification ledger, open decisions, production blockers, repo hazards, first actions | **Always — start here** |
| `CLAUDE_OPUS_SYNC_2026-11-19.md` | **Direct Antigravity → Claude Opus sync manifest (2026-11-19): complete summary of Pages 17–24 SRTR stabilization, 171-file safe de-clutter, Unified Revision-First OS, 1-Screen Surgical Repair Cards, Paraphrase-Resilient Active Recall, Optional Progress Wiring, and Phase 0 `ExamProfile`** | **Read this first when reviewing or merging Nov 19 work on GitHub** |
| `UPSC_COMMAND_STABILIZATION_REPORT_2026-11-19.md` | **Latest 2026-11-19 full-stack stabilization, de-clutter (171 dead files removed), Unified Revision-First OS, 1-Screen Surgical Repair Cards, Paraphrase-Resilient Active Recall & Phase 0 `ExamProfile` report (11/11 gates, 1,246 backend tests passed)** | **Read immediately after `AGENT_HANDOFF_2026-11-15.md` for all Nov 19 work** |
| `PHASE_1_PRODUCTION_ROADMAP.md` | Chronological execution log including §5 (Pages 18–24 swarm), §6 (Phase 2 De-Clutter + Revision-First OS + `ExamProfile`), and §7 (Phase 3 Surgical Repair + Adaptive Topic Revisits + Optional Progress Wiring) | When checking milestone completion status |
| `../docs/workspace-audits/EXAM_PORTABILITY_AUDIT.md` (or `frontend/docs/workspace-audits/EXAM_PORTABILITY_AUDIT.md`) | Exam-portability audit & `ExamProfile` blueprint (Revision-First for any exam first, From-Scratch preparation second) | When checking multi-exam portability boundaries |
| `DAY_BY_DAY_CHRONICLE_2026-11-15.md` | What was done on which date, with the file evidence behind each day | Before you claim a date or "we already fixed that" |
| `VERIFICATION_GATES_2026-11-15.md` | Every check that passes on this host today, with exact commands and raw output | Before you report anything as verified |
| `OPEN_DECISIONS_FOR_FOUNDER.md` | The choices that are his, not yours, with options and consequences | Before you change scope, delete code, move learner data, or touch pricing |
| `RAW_MODIFICATION_MAP_2026-11-15.txt` | Machine-generated: every tracked source file bucketed by modification date | When you need to prove the chronicle |
| `RAW_GATE_OUTPUT_2026-11-15.txt` | Machine-generated: today's static-gate output, unedited | When you need to prove the gate results |
| `scripts/handoff_mtime_map.cjs` | Regenerates the modification-date map | When the chronicle goes stale (it will) |
| `scripts/handoff_day_counts.cjs` | Counts distinct working days and the legacy room stubs | Same |

## Start here, in order

1. Read `AGENT_HANDOFF_2026-11-15.md` §0–§3 (five minutes). §3 is the single most
   important one: **this host cannot compile the frontend**, so do not burn an hour
   rediscovering it.
2. Read `OPEN_DECISIONS_FOR_FOUNDER.md` and ask the founder about anything on it before
   acting.
3. Read `VERIFICATION_GATES_2026-11-15.md`, then re-run the gates yourself. Numbers in
   this folder need dates the way the backend test count does (see hardship H19).
4. Only then edit code. The scope is UPSC, one feature's full chain at a time.

## The five rules that survive every handoff

1. Understand the software as it exists → fix it → verify each feature is properly
   linked. Step by step, not wide.
2. UPSC only. Multi-exam portability is not authorised work.
3. Ask the founder before any decision that changes scope, pricing, learner-visible
   copy, or where learner data lives.
4. Be honest on screen and in reports: a failed read is not an empty queue, no claim
   without a call behind it, no score/rank/selection promise, and state what you did not
   verify.
5. Do not commit unless he asks, never `git add -A` in this repo, and never print or
   copy values from `.env` files. Payments stay closed (`READY_FOR_PAYMENT = false`).

Last updated 2026-11-19. If you change anything in here, add a dated line rather than
editing history out of existence.
