# Architectural Governance: Implementation Plan

## Objective
Establish the core systems for codebase cognition, provider-agnostic AI, and runtime observability as defined in the Project Constitution.

## Phase 1: Foundation & Cognition (COMPLETED)
- [x] **Codebase Graph Extraction**: Mathematical mapping of all backend dependencies (`ast_mapper.py`).
- [x] **AI Provider Abstraction (Shell)**: Implementation of `InferenceGateway` to decouple Gemini.
- [x] **Execution Observability**: Real-time `TraceID` tracking for the cognitive pipeline (`ExecutionTracer`).
- [x] **Protected Module Scaffolding**: Automated integrity checks for Tier 0 modules (`integrity_check.py`).

## Phase 2: Hardening & Observability (IN PROGRESS)
- [x] **Content Engine Protection**: Moved `content_intelligence_engine.py`, `inference_reliability.py`, and `telemetry_reconstruction.py` to protected Tier 0 zones (`app.core.pedagogy`).
- [x] **Founder Dashboard (Trace Viewer)**: Implemented Hierarchical Execution Viewer and `/api/v1/observability` API.
- [x] **Behavioral Regression Suite**: Created `tests/governance/test_behavioral_regression.py` to enforce logic immutability.
- [x] **Provider Expansion**: Added `MockProvider` to `InferenceGateway`.
- [ ] **Regression Guard**: Integrate `integrity_check.py` into the system's pre-commit pipeline.

## Phase 3: Advanced Governance
- **`DiffVerifier`**: AI-driven analysis of PRs affecting "Locked Directories" to compare logic against the Pedagogical Specification.
- **`CostOptimizer`**: Implementation of automatic model switching based on real-time token pricing telemetry.
- **`FailureResilience`**: Automated circuit breakers for the `AI_Gateway` to prevent chain-reaction failures.

---

## Technical Summary of Phase 1 Execution
- **Inference Gateway**: Located in `app/core/inference/`. Successfully refactored `narrative_service.py` and `narrative_evaluator.py` to use the unified gateway.
- **Observability**: New `ExecutionTrace` model in `app/models/domain.py` and `ExecutionTracer` utility in `app/core/observability/`.
- **Integrity**: `governance-tools/integrity_check.py` validates that core services do not depend on the API/Router layer, ensuring modularity.

> [!IMPORTANT]
> All changes follow **RULE 1 (Observe Before Mutate)**. The system now has a live mathematical graph and a tracing shell to ensure every future mutation is visible and audited.
