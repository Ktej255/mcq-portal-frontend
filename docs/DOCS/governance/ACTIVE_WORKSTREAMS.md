# Institutional Active Workstreams

This document serves as the single source of truth for workstream synchronization between Chat #1 (Product) and Chat #2 (Governance).

## Current Workstreams

### Chat #1: Educational Product Maturity
- **Owner**: Chat #1
- **Focus**: Revision Queue, Spaced Repetition, Weak-Topic Recovery, UI/UX polish.
- **Active Files**: 
    - `frontend/src/app/revision/`
    - `backend/app/services/revision_service.py`
    - `frontend/src/app/exam/`
- **Status**: ACTIVE

### Chat #2: Institutional Stabilization
- **Owner**: Chat #2 (Governance Engine)
- **Focus**: Protection, Verification, Automation, Governance Enforcement.
- **Active Files**:
    - `backend/scripts/governance/`
    - `docs/governance/`
    - `run_operational_verification.py`
- **Status**: ACTIVE

## Resource Governance

### Locked Files (Tier-0 Core)
*Mutations strictly forbidden without explicit joint-session approval.*
- `backend/app/services/scoring_engine.py`
- `backend/app/services/report_service.py`
- `backend/app/models/domain.py`
- `backend/app/core/pedagogy/reliability_engine.py`

### Frozen Zones
*Entire directories that are considered architecture-complete.*
- `backend/app/core/inference/`
- `backend/app/core/observability/`
- `backend/app/api/v1/observability.py`

## Mutation Heatmap & Risks

| Component | Risk Level | Recent Mutation | Conflict Potential |
| :--- | :--- | :--- | :--- |
| **Report Service** | CRITICAL | 2026-05-13 | High (Product vs Forensic) |
| **Scoring Engine** | CRITICAL | 2026-05-13 | Medium |
| **Revision System**| MEDIUM   | 2026-05-13 | Low |

## Active Investigations
- **Frontend Decay**: 157 linting errors detected in `frontend/`. 
- **Telemtry Reconciliation**: Monitoring divergence in dwell-time logs.
