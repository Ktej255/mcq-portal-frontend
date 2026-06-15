# DEPLOYMENT FREEZE POLICY
# Phase 9 — Priority 7
# MCQ Intelligence Portal — Production Discipline

---

## STATUS: ACTIVE
**Effective from Phase 9 onward. This is non-negotiable governance.**

---

## RULE 1 — NO FRIDAY DEPLOYMENTS

**NEVER** push to production on:
- Fridays (no weekend monitoring)
- The day before public holidays
- During active exam windows

Safe deployment windows:
- Monday–Thursday, 10:00 AM – 4:00 PM IST
- After confirming no active student sessions in Mission Control

---

## RULE 2 — MANDATORY STAGING VERIFICATION

Every deploy must follow this sequence:

```
1. git push → staging branch
2. Run: python migrate.py (staging DATABASE_URL)
3. Run: alembic upgrade head --sql  → review SQL diff
4. Smoke test: login, take 5 questions, submit, view report
5. Verify truth_status = VERIFIED on staging report
6. Only then: merge to main and push to production
```

No exceptions.

---

## RULE 3 — MIGRATION DRY-RUN REQUIRED

Before any production migration:
```bash
alembic upgrade head --sql > migration_plan.sql
# Review migration_plan.sql manually before executing
```

If migration_plan.sql contains DROP or ALTER TABLE without IF EXISTS:
- Stop.
- Rewrite migration to be idempotent.
- Re-review.

---

## RULE 4 — DATABASE BACKUP BEFORE EVERY DEPLOY

```bash
pg_dump $PRODUCTION_DATABASE_URL > backup_$(date +%Y%m%d_%H%M).sql
```

Backup must be:
- Verified (pg_restore --list backup.sql should succeed)
- Stored locally AND in Cloud Storage
- Retained for minimum 7 days

---

## RULE 5 — ROLLBACK PLAN REQUIRED

For every deployment, document:
1. Which revision is the current head before deploy
2. The rollback command: `alembic downgrade <previous_revision>`
3. Whether rollback is safe (no data-destructive steps)

If rollback is unsafe (e.g., involves column drops):
- The migration must be split into two separate deploys.

---

## RULE 6 — NO DIRECT PRODUCTION PATCHING

**NEVER** directly SSH into the Cloud Run container or modify production code in-place.

All changes must go through:
```
Local → Git commit → Staging → Smoke test → Production
```

---

## RULE 7 — POST-DEPLOY VERIFICATION

After every production deploy:
1. Check `/observability/health` endpoint → must return `"status": "HEALTHY"`
2. Verify 1 real report attempt → `truth_status` must be `VERIFIED`
3. Check SystemEvent table for any `CRITICAL` severity events in the last 15 minutes
4. Monitor for 30 minutes before declaring deploy successful

---

## VIOLATION CONSEQUENCES

A rule violation triggers:
- Mandatory post-mortem document
- Full audit of all reports generated during the affected window
- Truth-status reset to UNVERIFIED for affected attempts

---

*Last updated: 2026-05-13*
*Governed by: Phase 9 Institutional Reliability Protocol*
