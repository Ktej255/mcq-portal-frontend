# PRODUCTION DATA GOVERNANCE RULES
# Phase 8 — Priority 7
# MCQ Intelligence Portal — Institutional Data Discipline

---

## GOVERNING PRINCIPLE

Educational records are institutional records.
They must be treated with the same discipline as:
* official examination records
* legal audit documents
* financial ledgers

---

## RULE 1 — NO DIRECT DATABASE MUTATIONS

**NEVER** run raw SQL UPDATE/DELETE on production data without:
1. Creating a backup snapshot first
2. Recording the reason in the SystemEvent log
3. Running the mutation in staging first
4. Having a verified rollback script ready

**Allowed:** Read-only SQL for debugging.
**Restricted:** Any mutation via psql/Cloud SQL console requires written justification.

---

## RULE 2 — NO SILENT RE-INGESTION

**NEVER** re-ingest questions without:
1. Verifying the new content_hash is different from the existing
2. Creating a versioned snapshot of existing questions
3. Logging the ingestion event with `source_file`, `operator`, and `timestamp`
4. Running the ingestion in `DRY_RUN` mode first

```python
# Always use the ingestion engine, never raw DB inserts
engine = MCQIngestionEngine()
result = engine.ingest(question_data, dry_run=True)  # Verify first
```

---

## RULE 3 — ALL INGESTION MUST BE LOGGED

Every ingestion event must write a `SystemEvent` record:
```python
SystemEvent(
    event_type="INGESTION",
    severity="INFO",
    component="MCQIngestionEngine",
    message=f"Ingested {n} questions from {source_file}",
    metadata={"source": source_file, "count": n, "operator": operator_id}
)
```

---

## RULE 4 — ALL QUESTION CHANGES MUST BE VERSIONED

When a question is updated:
1. The `forensic_data` JSON must contain the previous `content_hash`
2. The update timestamp must be recorded
3. Any reports that referenced the old question version must be flagged as `UNVERIFIED` (to trigger re-validation)

---

## RULE 5 — ALL REPORT SNAPSHOTS ARE IMMUTABLE

Once a `Report` is generated:
* The `snapshot_bundle` field (JSON) must never be modified
* Score corrections require creating a NEW report version, not overwriting
* Any attempt to modify a frozen report must be rejected at the API layer

---

## RULE 6 — TRUTH STATUS IS SOVEREIGN

A report with `truth_status = "FAILED"`:
* **Must NOT** be rendered to students
* **Must** trigger a `SystemEvent` alert at `CRITICAL` severity
* **Must** be reviewed by the founder before any manual override

---

## RULE 7 — DEPLOYMENT DATA PROTOCOL

Before every production deployment:
1. `pg_dump` the production database (verify backup integrity)
2. Run `alembic upgrade head` in staging first
3. Review the migration plan with `alembic upgrade head --sql`
4. Only then run on production

---

## VIOLATION CONSEQUENCES

Any violation of these rules:
* Invalidates the institutional trustworthiness of affected records
* Requires a full forensic audit of affected attempt IDs
* Must be disclosed to all affected students

---

## ENFORCEMENT

These rules are enforced by:
* Code review requirements for any DB-touching PRs
* The `verify_report_integrity()` function running on every report
* The `truth_status` field blocking display of corrupted reports
* The `forensic_audit_log` recording every calculation step

---

*Last updated: 2026-05-13*
*Governed by: Phase 8 Operational Discipline Protocol*
