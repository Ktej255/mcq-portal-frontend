# Educational Records Governance Policy

## Principles

The system has entered **LONG-LIFECYCLE SOFTWARE MODE**. The primary success metric is: **"Can the system remain trustworthy after 3 years of continuous institutional usage?"**

Educational data now holds institutional sensitivity. Every student's journey must be auditable, authentic, and historically accurate.

### Rule 1: Immutable Reports
- Reports are institutional artifacts. Once generated, a report is **frozen**.
- Future UI changes, logic updates, or telemetry adjustments must **NEVER** alter historical reports.
- Each report explicitly records its `report_version`, `rendering_version`, `evaluation_version`, and `telemetry_version`.
- A student should be able to open a report from years ago and see the exact evaluation they received at the time.

### Rule 2: Append-Only Attempts
- The Attempt Lifecycle is strictly append-only.
- Event timelines (`ExamEvent`) must not be rewritten, edited, or "fixed". If there is an issue, a new attempt or a compensatory action must be appended.
- The Attempt Lock Manager enforces idempotent submission and single-authoritative state.

### Rule 3: Preserved Telemetry
- Telemetry reconstruction is forensically locked. It is never overwritten retroactively.
- The `forensic_data` block ensures absolute transparency about the evaluation process at the time of submission.

### Rule 4: Question History Preservation
- Editing a question must never invalidate previous reports. If a question undergoes significant structural changes, a new version of the question should be created, or old answers must be safely bound to historical metadata.

### Rule 5: Timestamped Exports
- All exports (like PDFs) must bear the generation timestamp, the version of the layout engine used, and the report authenticity metadata.

## Enforcement
This policy is enforced through the Database Governance Layer and the Versioning columns on the `Report` and `Attempt` models. Any violation of these rules is treated as a critical production incident.
