# Phase 8 Inference Reliability Engineering

This phase calibrates cognitive analytics so the system can say how trustworthy an inference is, not merely generate one.

## 1. Temporal Trust Architecture

Timing-derived metrics must combine client timing with telemetry continuity:

```text
answer timing
  + HEARTBEAT continuity
  + FOCUS_STATE_CHANGED continuity
  + IDLE_STATE_CHANGED intervals
  + suspicious inactivity checks
  -> behavioral_data_quality
  -> timing_trust.signal_confidence
  -> downstream signal confidence
```

Temporal trust factors:

- heartbeat coverage: presence and density of attempt heartbeat events
- focus continuity: tab switches, blur events, fullscreen exits
- idle continuity: active/idle transitions and long inactive intervals
- timing plausibility: non-negative and bounded question timing
- server reconciliation: server rejects impossible future timestamps and stores event ingestion order

Every timing-derived metric must expose:

```json
{
  "value": 0.73,
  "signal_confidence": 0.61,
  "metric_version": "inference-reliability.v1"
}
```

## 2. Signal Confidence Framework

Signals are scored with:

- minimum sample thresholds: 1 test is low confidence, 10 medium, 50 high
- behavioral data quality score
- anomaly penalties
- missing telemetry penalties
- contradiction downgrades

The service returns reliability metadata for:

- guessing detection
- impulsiveness
- fatigue
- review dependency
- confidence drift
- timing trust

## 3. Contradiction Detector

Current contradiction families:

- `CONFIDENCE_INSTABILITY`: high confidence with frequent answer changes
- `HESITATION_TIMING_MISMATCH`: low hesitation claim with high average timing
- `FATIGUE_STABILITY_MISMATCH`: fatigue inference despite stable late accuracy

Contradictions produce:

- `contradiction_score`
- `reliability_downgrade`
- narrative safety warning
- human review requirement when severe

## 4. Narrative Uncertainty System

AI narratives must:

- distinguish evidence from inference
- use qualifiers such as "may indicate" and "is consistent with"
- avoid fixed trait labels and diagnosis
- include uncertainty when data quality is low or contradictions exist
- support human review for high-impact claims

Forbidden posture:

- "You panic under pressure."
- "You are overconfident."
- "This proves a cognitive weakness."

Preferred posture:

- "Recent timing patterns may indicate increased hesitation under time pressure."
- "Available evidence is consistent with possible overconfidence on this topic."

## 5. Human Review Workflow

High-impact inference metadata includes `requires_human_review`.

Teacher/educator review should support:

- approve narrative
- request revision
- add expert comments
- override unsupported claims
- mark claim as not enough evidence

No high-impact psychological interpretation should be treated as final without evidence quality and uncertainty indicators.

## 6. Behavioral Data Quality Score

Attempt-level score components:

- event completeness
- timing plausibility
- focus continuity
- telemetry density

Known degradation causes:

- missing heartbeat events
- answered questions with zero time
- focus interruptions
- sparse event stream
- impossible timestamps or timings

## 7. Scientific Safety Policy

The platform must not:

- diagnose
- imply medical or psychological certainty
- overfit sparse data
- present speculation as fact
- market cognitive labels as stable truth

All cognitive outputs are educational analytics, not clinical assessments.

## 8. Metric Versioning Strategy

All inference outputs include `metric_version`.

Current version:

```text
inference-reliability.v1
```

Version changes are required when:

- formulas change
- thresholds change
- event requirements change
- confidence weighting changes
- narrative safety rules change

## 9. Research Mode Preparation

Future research datasets must be:

- anonymized
- versioned
- reproducible
- auditable from raw events and answers
- tied to metric version and prompt/evaluator version

## 10. Remaining Inference Risks

- heartbeat, focus, and idle telemetry are defined but not yet emitted by the frontend
- full-attempt event ordering is not yet reconciled across persisted history
- fatigue and confidence drift need longitudinal data, not single-attempt inference
- human review UI/workflow is not yet implemented
- timing remains partly client-trusted
