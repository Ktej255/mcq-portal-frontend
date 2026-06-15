# Educational Records Governance Policy (v1.0)
## UPSC MCQ Intelligence Portal

### 1. Scope
This policy governs the management, lifecycle, and integrity of all educational records within the platform, including Student Attempts, Performance Reports, Cognitive Snapshots, and Learning Interventions.

### 2. Data Integrity and Immutability
All core educational records are subject to the following institutional standards:
- **Immutability of Outcome**: Once a `Report` is generated and transitioned to `VERIFIED` status, it shall not be modified. Any correction requires the generation of a new versioned report.
- **Forensic Traceability**: All records must maintain an audit trail including `created_at`, `updated_at`, and the `actor` (system or user) responsible for the record.
- **Versioned Evaluation**: Reports must track the version of the evaluation engine, rendering schema, and telemetry reconstruction logic used at the time of creation.

### 3. Data Preservation and Soft-Deletion
To satisfy institutional auditability requirements:
- **No Hard Deletion**: No educational record shall be permanently deleted from the database through standard application interfaces.
- **Soft-Delete Mechanism**: Records marked for deletion will use the `is_deleted` flag and `deleted_at` timestamp. They will be filtered from student views but remain available for forensic audit.
- **Permanent Archiving**: Records older than the institutional retention period (default 7 years) may be moved to cold storage but must remain reconstructible.

### 4. Forensic Reconstruction
In the event of data corruption or dispute:
- The system must be capable of reconstructing the "Educational Truth" of an attempt from the raw `ExamEvent` telemetry traces.
- System health snapshots must be recorded periodically to correlate institutional performance with infrastructure stability.
- Discrepancies between reconstructed truth and stored reports must be flagged to the Founder Command Center immediately.

### 5. Automated Governance Mixins
Implementation of this policy is enforced at the database layer using the following SQLAlchemy mixins:
- `InstitutionalAuditMixin`: Enforces timestamp and actor tracking.
- `SoftDeleteMixin`: Prevents data loss by intercepting delete operations.

---
**Institutional Authority**: Founder / Chief Academic Officer
**Last Updated**: 2026-05-13
**Status**: ACTIVE / ENFORCED
