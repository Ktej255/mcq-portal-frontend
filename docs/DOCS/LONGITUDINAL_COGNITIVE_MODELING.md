# Phase 10 Longitudinal Cognitive Modeling

This phase moves the platform from attempt analytics to trajectory intelligence. The system should describe how learning and behavior evolve over time while keeping uncertainty explicit.

## 1. Longitudinal Profile Engine

Backend service: `student_longitudinal_profile.py`.

The profile engine builds:

- cross-attempt trajectory points
- topic mastery trends
- confidence evolution
- pacing evolution
- telemetry-aware reliability
- behavioral stability
- adaptive recommendation context

Every output is versioned with:

```text
longitudinal-cognition.v1
```

## 2. Learning Velocity Model

Learning velocity is not just score gain.

Tracked signals:

- accuracy slope
- score slope
- recovery velocity
- stabilization detection
- confidence weighted by longitudinal reliability

Velocity is treated as low confidence when history is sparse.

## 3. Confidence Evolution

The confidence model tracks:

- blind guess reduction
- overconfidence reduction
- calibration slope
- confidence stability
- readiness for confidence-accuracy correlation

Confidence evolution should never be presented as a fixed learner trait.

## 4. Revision Effectiveness

Revision effectiveness is topic-scoped.

For each topic:

- improvement from first to latest evidence
- retention score against peak performance
- decay from peak
- relearning detection
- status: `INSUFFICIENT_EVIDENCE`, `IMPROVING`, `STABLE`, or `UNSTABLE`

Temporary improvement is preserved as instability rather than smoothed away.

## 5. Behavioral Stability

Behavioral stability combines:

- accuracy volatility
- pacing volatility
- telemetry temporal coherence
- smoothed accuracy trend

This distinguishes stable improvement from one-attempt spikes.

## 6. Adaptive Recommendation Framework

Recommendations can now consume trajectory context:

- unstable topics
- retention decay
- pacing volatility
- confidence calibration decline
- learning velocity status
- trajectory reliability

This is a data foundation only; no polished dashboard was added.

## 7. Cognitive State Transitions

Detected transitions are evidence-weighted labels, not diagnoses:

- `UNSTABLE -> STABLE`
- `IMPULSIVE -> CALIBRATED`
- `HESITANT -> CONFIDENT`

Transitions require enough history to compare earlier and later behavior.

## 8. Longitudinal Reliability

Reliability increases with:

- attempt count
- telemetry continuity
- behavioral consistency
- repeated signal evidence
- temporal stability

Current reliability levels:

- `LOW`: sparse history or weak continuity
- `MEDIUM`: at least 10 attempts with reasonable reliability
- `HIGH`: at least 50 attempts with strong reliability

## 9. Versioned Cognitive Snapshots

Each completed attempt can persist an immutable `cognitive_snapshots` row:

- cognitive snapshot
- telemetry snapshot
- reliability snapshot
- metric version
- creation timestamp

Snapshots are designed to be auditable and reconstructable even as future formulas evolve.

## 10. Remaining Longitudinal Risks

- Most learners will initially have sparse history, so reliability should remain low.
- Revision detection currently infers pre/post behavior from attempts, not explicit revision activity.
- Fatigue transitions remain primitive until late-attempt accuracy segments are modeled.
- Cross-device continuity is not yet unified.
- Snapshot creation runs in the async cognitive pipeline; failed background tasks can delay longitudinal freshness.
