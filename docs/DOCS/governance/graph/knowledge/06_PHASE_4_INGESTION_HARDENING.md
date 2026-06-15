# Phase 4: MCQ Ingestion Hardening - Implementation Specification

Objective: Transform the MCQ ingestion pipeline into a deterministic, auditable, and structurally sound "compiler-like" system.

## 1. Objective
Establish absolute integrity for educational content by enforcing structural schemas and forensic fingerprinting.

## 2. Why this matters educationally
The MCQ is the primary unit of evaluation. If its structure (statements, options, answers) mutates silently, the entire pedagogical feedback loop (scoring, cognitive analysis) becomes invalid.

## 3. Files to be Added
- `backend/app/core/pedagogy/contracts.py`: Structural definitions and enums.
- `backend/app/core/pedagogy/ingestion_validator.py`: Strict schema enforcement logic.
- `backend/app/core/pedagogy/forensics.py`: Hashing and fingerprinting logic.
- `tests/data/canonical_upsc_v1.json`: The validation dataset.

## 4. Files to be Modified
- `backend/app/crud/admin.py`: To integrate the new ingestion pipeline.
- `backend/app/models/domain.py`: Adding hash and integrity metadata fields to `Question`.
- `backend/app/services/report_service.py`: Adding mathematical reconciliation checks.
- `backend/app/core/pedagogy/ingestion.py`: UPSC-aware parsing logic.

## 5. Blast Radius
- **Moderate**: Impact is restricted to the ingestion pipeline and report generation logic. No mutation of existing test attempt data.

## 6. Failure Scenarios
- **Validation Error**: Pipeline stops and returns a detailed structural error (e.g., "Statement 2 is missing a numbering prefix").
- **Fingerprint Mismatch**: Detects if a question is being re-uploaded with silent formatting changes.

## 7. Rollback Strategy
- Atomic database transactions. If any question in a batch fails validation or persistence, the entire batch is rolled back.

## 8. Validation Strategy
- Comparison of pre-ingestion JSON and post-persistence database records using the generated hashes.

## 9. Observability Integration
- `ExecutionTracer` points for: `UPLOAD_STARTED`, `SCHEMA_VALIDATED`, `FORENSICS_GENERATED`, `PERSISTENCE_COMPLETE`.

## 10. Determinism Guarantees
- SHA-256 hashes are derived from normalized content (trimmed whitespace, lowercased keys).
- Shuffling uses a fixed seed per question to ensure reproducibility.
