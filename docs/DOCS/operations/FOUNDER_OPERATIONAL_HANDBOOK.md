# Founder Operational Handbook: Adaptive UPSC Self-Study OS

This document serves as the canonical operational guide for maintaining institutional stability and educational truth.

## 1. System Architecture Map (Core Components)
- **Tier-0 (Pedagogy)**: Ingestion, structural validation, and forensic hashing. (Protected Zone: `app/core/pedagogy/`)
- **Tier-1 (Execution)**: Exam engine, telemetry capture, and real-time state management.
- **Tier-2 (Forensics)**: Report generation, reliability computation, and behavioral reconstruction.
- **Tier-3 (Inference)**: AI narratives and cognitive profiling. (Non-Critical Layer: System degrades gracefully if this fails).

## 2. Ingestion Lifecycle (The Compiler Path)
1. **Validation**: MCQ inputs are validated against `MCQStructure`.
2. **Fingerprinting**: SHA-256 hashes generated for content, structure, and options.
3. **Persistence**: Questions are committed with their structural statements (`statements_en`) preserved.
4. **Verification**: Ingestion integrity is checked against the Canonical UPSC Dataset.

## 3. Report Lifecycle (The Truth Pipeline)
1. **Scoring**: Deterministic matching of selections vs. answer key.
2. **Telemetry Reconstruction**: Raw `ExamEvents` are converted into a behavioral timeline.
3. **Reliability Scoring**: 0-100 score calculated based on math, telemetry, and inference.
4. **Snapshotting**: Immutable record of questions/answers stored in `snapshot_bundle`.
5. **AI Narrative**: Optional enrichment layer.

## 4. Failure Modes & Graceful Degradation
- **AI Gateway Failure**: Report still generates; narrative displays "AI Insights Unavailable."
- **Telemetry Corruption**: Scoring remains 100% accurate; behavioral analysis marked as "DEGRADED."
- **Database Latency**: Background workers prioritize scoring/snapshotting over narratives.

## 5. Rollback Procedures
- **Database**: Use Alembic migrations (`alembic downgrade -1`).
- **Logic**: Revert code to the last tagged Release Version.
- **Data**: Ingestion batches are atomic; failed batches do not leave partial data.

## 6. Operational Health Indicators
- **Math Reliability < 1.0**: CRITICAL. Manual audit required for scoring logic.
- **Telemetry Coverage < 70%**: WARNING. Check for student network issues or frontend event loss.
- **Report Latency > 30s**: PERFORMANCE WARNING. Check async worker queue and DB indexing.

## 7. Protected Zones (No Mutation Allowed)
- `app/core/pedagogy/`: Direct mutation risks educational truth.
- `app/models/domain.py`: Schema changes require mandatory forensic migration testing.
- `app/services/report_service.py`: Scoring logic is frozen.

---
*Created: May 13, 2026 | Chief Systems Architect*
