# Institutional Incident Response Playbook

This document defines the protocols for responding to production failures in the MCQ Intelligence Portal.

## 1. Report Forensic Mismatch
**Symptom**: Student reports "I marked X, but the report says Y" or scoring doesn't add up.
**Probable Cause**: Forensic divergence between exam events and finalized attempt answer state.
**Verification Command**:
```bash
python backend/scripts/governance/runtime_flow_verifier.py
```
**Action**:
- Run `AttemptReconciliationEngine` for the specific `attempt_id`.
- Check `snapshot_bundle` in the `reports` table for the immutable state.
- Rollback: Manual database correction only if forensic evidence (ExamEvent) proves mismatch.

## 2. Failed Deployment / Boot Error
**Symptom**: Backend 500 errors or Frontend blank screen after update.
**Probable Cause**: Database migration mismatch or broken API contract.
**Verification Command**:
```bash
python institutional_release_check.py
```
**Action**:
- Run `alembic upgrade head`.
- Check `test_schema_integrity.py` for API drift.
- Rollback: `git revert` to the last known stable commit tagged by Chat #2.

## 3. Broken Scoring / Negative Marking Failure
**Symptom**: Systemic error in student scores.
**Probable Cause**: Regression in `scoring_engine.py`.
**Verification Command**:
```bash
python backend/tests/educational_truth.py
```
**Action**:
- Inspect `scoring_engine.py` for unauthorized mutations (check `auto_governance` logs).
- Rollback: Restore `scoring_engine.py` from Tier-0 core backup.

## 4. Telemetry Corruption
**Symptom**: Dwell times or interaction logs show "NaN" or "0".
**Probable Cause**: Frontend `eventsService` failing to send payloads correctly.
**Action**:
- Inspect browser console for 422 errors on `/events` endpoint.
- Verify `ExamEvent` model in `domain.py`.

## 5. Revision Queue Failure
**Symptom**: Students report weak topics not appearing in revision.
**Probable Cause**: `populate_revision_queue_from_attempt` failing silently in `report_service.py`.
**Action**:
- Check backend logs for "Revision Queue Population Failed".
- Run manual sync script for the user.

## 6. Stale Frontend Cache
**Symptom**: UI shows old question data or layout.
**Probable Cause**: Next.js cache or CDN layer issues.
**Action**:
- Clear Vercel/Production cache.
- Hard reload browser.
