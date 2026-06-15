# Institutional Regression Memory

This document tracks bugs that have reappeared and prevents systemic institutional amnesia.

| Date | Incident | Root Cause | Prevention Strategy | Fix Verified |
| :--- | :--- | :--- | :--- | :--- |
| 2026-05-13 | Forensic Scoring Divergence | Telemetry reconstruction logic was missing dwell-time validation. | Injected forensic diagnostic logging into `scoring_engine.py`. | YES |
| 2026-05-13 | Report Payload Schema Drift | Frontend expected `question_number` but backend was sending raw IDs. | Created `test_schema_integrity.py` with baseline protection. | YES |
| 2026-05-13 | Revision Queue Silent Failure | Report generation was completing even if revision population failed. | Wrapped revision population in try-except with critical logging. | YES |

## Critical Invariants to Watch
- `Total = Correct + Incorrect + Skipped`
- `Negative Marking = Correct Marks / 3` (UPSC Standard)
- `Attempt ID` must always match `Report ID` during reconciliation.
