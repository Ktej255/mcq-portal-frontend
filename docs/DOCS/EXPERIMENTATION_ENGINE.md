# Phase 12 Experimentation Engine and Learning Science Infrastructure

This phase measures whether adaptive recommendations are associated with better learning outcomes while preventing false causal claims.

## 1. Intervention Tracking Engine

Backend service: `intervention_tracking_engine.py`.

Tracked lifecycle:

- `GENERATED`
- `VIEWED`
- `ACCEPTED`
- `IGNORED`
- `PARTIALLY_FOLLOWED`
- `FOLLOWED`
- `ABANDONED`

Each intervention stores:

- recommendation ID
- strategy ID
- experiment/variant assignment
- recommendation payload
- reliability snapshot
- acceptance metadata
- outcome metadata
- metric version

## 2. Recommendation Effectiveness Model

Backend service: `recommendation_effectiveness.py`.

Measures:

- post-intervention accuracy delta
- post-intervention score delta
- stability improvement
- confidence correction
- pacing stabilization
- retention topics

The model reports evidence confidence, not causal certainty.

## 3. Adaptive Experimentation Framework

Backend service: `adaptive_experimentation.py`.

Supported experiment families:

- revision intensity variation
- pacing strategy variation
- future adaptive difficulty/workload variation

Assignment is deterministic by user and experiment ID, but reliability-gated. Low-confidence situations can be excluded.

## 4. Causal Safety Layer

Backend service: `causal_safety_rules.py`.

Rules:

- never say an intervention caused improvement
- penalize sparse pre/post data
- surface confounding warnings
- use cautious language

Approved language:

- "Outcomes improved after this intervention; causal attribution remains provisional."
- "Outcomes are consistent with possible intervention benefit, with meaningful uncertainty."
- "Evidence is too limited for causal claims."

## 5. Acceptance Telemetry

Acceptance events are represented in intervention status and metadata.

Tracked:

- viewed
- accepted
- ignored
- partially followed
- followed
- abandoned

Future frontend events should call status updates directly when recommendation UX exists.

## 6. Strategy Registry

Backend service: `strategy_registry.py`.

Versioned strategies:

- low-intensity recovery
- fatigue-sensitive pacing
- confidence recalibration
- revision reinforcement
- high-volatility stabilization

Each strategy exposes:

- intended effect
- evidence quality
- adaptation aggressiveness
- reversibility
- safety notes

## 7. Longitudinal Intervention Analytics

Backend service: `intervention_analytics.py`.

Aggregates:

- acceptance rates
- abandonment rates
- average evidence confidence
- average post-intervention deltas
- overload markers
- unstable outcome rate

These metrics are observational, not causal proof.

## 8. Experiment Observability

Pipeline observability now includes:

- intervention count
- acceptance rate
- abandonment rate
- unstable outcome rate
- strategy count

Future metrics:

- recommendation acceptance by strategy
- overload after adaptation
- reversal frequency
- recovery persistence
- low-confidence experiment usage

## 9. Ethics and Experimentation Safety

The platform must never:

- run hidden harmful experiments
- optimize purely for engagement
- aggressively manipulate student pace
- sacrifice educational stability
- overfit interventions to sparse data

Experiments must remain:

- reversible
- low-risk
- educationally aligned
- reliability-aware
- transparent in system metadata

## 10. Research Dataset Foundations

Future anonymized datasets should include:

- intervention history
- recommendation metadata
- strategy assignment
- variant assignment
- longitudinal outcomes
- reliability snapshots
- metric versions

Reproducibility requires preserving metric and strategy versions alongside outcomes.

## 11. Remaining Experimentation Risks

- Recommendation UX does not yet emit acceptance/rejection events.
- Intervention outcome windows are still approximate.
- Confounding controls are basic and conservative.
- No anonymized dataset export pipeline yet.
- Experiments are infrastructure-only; no learner-facing experiment disclosure UI exists yet.
