# Agent Vision & Command Registry

This document tracks the evolution of the project vision, user commands, and agent decisions for the **MCQ Intelligence Portal**.

## Project Vision
- **Core Goal**: A production-ready MCQ examination and analytics portal.
- **Key Features**:
  - Bilingual question support.
  - Configurable scoring (negative marking).
  - Secure attempt lifecycle.
  - Performance analytics and reports.
- **Tech Stack**: Next.js (Frontend), FastAPI (Backend), PostgreSQL (Database), Firebase (Auth).

## Command History & Evolution

### Day 1: Project Initiation
- **User Command**: Start a new project "MCQ Portal" in `D:\Development\MCQ Portal`.
- **Status**: Completed structure.

### Forensic Debugging & Systemic Documentation (Current)
- **User Command**: 
    1. Debug persistent 403 Forbidden errors in the production portal.
    2. Register all commands and vision evolution into a persistent document.
    3. Ensure the agent checks for "counter-commands" (changes that conflict with previous vision).
- **Status**: 
    - Created `DOCS/AGENT_VISION.md`.
    - Injected `FORENSIC` logging into `backend/app/api/dependencies.py` and `backend/app/main.py`.
- **Vision Update**: The agent now operates with a "Decision Memory" stored in the project files, acting as a ledger of the user's intent.
- **Counter-Command Tracking**: Currently tracking decision stability. No conflicts detected yet.

## Decision Log & Patterns

| Date | Decision | Rationale | Impact |
| 2026-05-12 | Day 1: I have identified the likely root cause as API rou... | Direct Command | Updated Ledger |

|------|----------|-----------|--------|
| 2026-05-12 | Implement Forensic Logging | 403 errors are happening at a level that generic logs don't capture. | Will expose the source of 403 (Auth vs Role vs CORS). |

## Gaps & Recommendations
1. **User Role Management**: Users are auto-created as `STUDENT`. There is currently no UI for elevating a user to `ADMIN`.
2. **Auth Consistency**: Intermittent 403s when `Auth Present: False` suggests frontend token attachment race conditions.
3. **Database Visibility**: We need a way to check user roles in production without manual SQL queries.
