# Deployment Checklist: Operational Excellence

This checklist must be followed for every production release during the stabilization phase.

## 1. Pre-Deployment (Staging)
- [ ] **Schema Verification**: Run `alembic current` and compare against `models/domain.py`.
- [ ] **Forensic Hashing Check**: Ingest a sample question and verify `content_hash` generation.
- [ ] **Stress Simulation**: Run `pytest backend/tests/operational/stress_tests.py` with 50 concurrent reports.
- [ ] **Replay Reconstruction**: Verify one session replay in the Mission Control panel.
- [ ] **Reliability Audit**: Ensure a sample report generates with `reliability_score > 95`.

## 2. Deployment Execution
- [ ] **Database Backup**: Trigger an automated snapshot of the Cloud SQL instance.
- [ ] **Environment Sync**: Verify `.env` variables match the production requirements.
- [ ] **Graceful Traffic Switch**: Use traffic splitting if available (e.g., Cloud Run revisions).
- [ ] **Release Tagging**: Tag the repository with the version number (e.g., `v1.0.4-stable`).

## 3. Post-Deployment (Mission Control)
- [ ] **Error Rate Monitoring**: Monitor the "Degradation Alerts" panel for 15 minutes.
- [ ] **Latency Watch**: Verify `REPORT_LATENCY` metrics are within normal range (< 5s).
- [ ] **AI Gateway Check**: Verify narrative generation is functional or degrading gracefully.
- [ ] **First Student Verification**: Monitor the first live attempt for end-to-end telemetry capture.

## 4. Rollback Readiness
- [ ] **Reversion Command Ready**: `gcloud run services update-traffic --to-revisions=PREVIOUS_REVISION=100`.
- [ ] **Database Migration Revert**: `alembic downgrade -1` (Only if non-destructive).

---
*Operational Stability > Rapid Deployment*
