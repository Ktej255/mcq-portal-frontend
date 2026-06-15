# Content Corruption Report

Date: 2026-05-18

Scope: Environment Batch 1, local staging DB `backend/production.db`

## Summary

- Questions audited: 50
- Corrupted records found: 1
- Quarantined records: 1
- Production exposure after quarantine: 49 usable questions

## Corrupted Records

| Test | Question ID | Question No. | Issue | Evidence |
| --- | ---: | ---: | --- | --- |
| Environment Batch 1 | 42 | 42 | Truncated stem | `4 finalisation. Q40 ->` |
| Environment Batch 1 | 42 | 42 | Footer leakage in options | `Total = 50`, `Distribution balanced`, `Single Source of Truth` found inside options |
| Environment Batch 1 | 42 | 42 | Duplicated/malformed options | Options B/C/D contain footer fragments instead of MCQ options |

## Quarantine Action

Migration: `backend/alembic/versions/b29e6d8c4a12_quarantine_corrupted_environment_batch1.py`

DB state after migration:

- `questions.id = 42`
- `status = ARCHIVED`
- `is_deleted = 1`

API state after backend restart:

- `GET /api/v1/tests/1/questions` returns 49 questions.
- Quarantined question 42 is excluded.

## Release Blocker

Environment Batch 1 is not content-complete until question 42 is replaced or repaired. Do not present it as a full 50-question batch in production.
