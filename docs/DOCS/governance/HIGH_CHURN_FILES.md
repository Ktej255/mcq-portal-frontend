# High Churn & Architectural Instability Tracker

This document tracks files with high mutation frequency or frequent regressions.

| File Path | Mutation Count (Last 7 Days) | Regression Count | Stability Status | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| `backend/app/services/report_service.py` | 14 | 3 | UNSTABLE | CRITICAL |
| `frontend/src/app/exam/[testId]/page.tsx` | 22 | 2 | CHURN ZONE | HIGH |
| `backend/app/models/domain.py` | 5 | 1 | STABILIZING | MEDIUM |
| `backend/app/services/scoring_engine.py` | 8 | 2 | FROZEN | CRITICAL |

## Unstable Modules (Zones of Confusion)
1. **Report Generation Pipeline**: High frequency of "AI confusion coding" (rewriting entire logic blocks instead of patching).
2. **Exam Interface State**: Frequent re-renders and logic duplication across mobile/desktop views.

## Instability Mitigation Plan
- **Frozen**: No mutations allowed to `scoring_engine.py` without forensic audit.
- **Strict Linting**: Block `exam` page commits if linting fails (high risk of regression).
