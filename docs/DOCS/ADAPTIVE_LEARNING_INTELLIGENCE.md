# Phase 11 Adaptive Learning Intelligence

This phase converts longitudinal intelligence into cautious, evidence-aware adaptation. The system should adapt learning support, not manipulate learners or overstate certainty.

## 1. Adaptive Learning Engine

Backend service: `adaptive_learning_engine.py`.

The engine adjusts:

- topic priority
- difficulty mix
- revision intensity
- pacing buffer
- session workload
- recommendation confidence

Inputs:

- longitudinal profile
- learning velocity
- confidence evolution
- behavioral stability
- telemetry reliability
- revision effectiveness

## 2. Personalized Difficulty Calibration

Difficulty is student-relative.

The same question can be:

- under-challenging for a strong topic
- productive for a recovering topic
- frustration-risk for a weak topic

The calibration emits:

- base difficulty
- relative difficulty
- challenge band
- metric version

Low reliability adds uncertainty instead of forcing aggressive adaptation.

## 3. Dynamic Test Generation

Backend service: `dynamic_test_generator.py`.

Test assembly considers:

- weak topics
- revision decay
- confidence instability
- pacing weakness
- fatigue-aware ordering
- historical trajectory reliability

The generator returns candidate question IDs and rationale. It does not create polished UX or permanent tests yet.

## 4. Revision Intelligence

Revision scheduling is spacing-aware:

- high decay or unstable topics: near-term revision
- moderate risk: medium interval
- stable topics: longer interval

Revision intensity is reduced when trajectory reliability is low or cognitive load risk is high.

## 5. Cognitive Load Balancing

The load model considers:

- fatigue-sensitive state probability
- pacing volatility
- behavioral consistency

Outputs:

- load risk
- session intensity
- fatigue-aware ordering flag
- pacing buffer

## 6. Learning State Machine

Backend service: `learning_state_machine.py`.

States are probabilistic adaptation hints:

- unstable learner
- recovering learner
- calibrated learner
- fatigue-sensitive learner
- high-volatility learner
- stabilized learner

They are not psychological labels.

## 7. Personalized Study Orchestration

The study plan includes:

- revision schedule
- workload size
- difficulty mix
- pacing buffer
- learning state
- adaptive reliability

Weak history produces soft recommendations.

## 8. Adaptive Reliability Framework

Every adaptive recommendation exposes:

- recommendation confidence
- evidence quality
- trajectory reliability
- adaptation mode

Modes:

- `SOFT`
- `GUIDED`
- `ASSERTIVE_BUT_REVERSIBLE`

## 9. Adaptive Observability

Pipeline observability includes:

- profile count
- low reliability profile rate
- high volatility profile rate
- adaptation stability status

Future metrics:

- recommendation acceptance
- recovery persistence
- overload frequency
- improvement after adaptation
- recommendation reversal rate

## 10. Scientific Safety for Adaptation

The platform must never:

- force unstable adaptation
- aggressively manipulate pace
- overfit sparse signals
- present learning states as fixed traits
- use pseudo-psychological certainty

Adaptation must remain:

- evidence-aware
- uncertainty-aware
- reversible
- reliability-weighted

## 11. Remaining Adaptation Risks

- Dynamic tests currently return assembly plans, not persisted test records.
- Revision scheduling infers revision need from attempt history, not explicit study-session completion.
- Recommendation effectiveness tracking needs acceptance/outcome telemetry.
- Low-history users should receive soft suggestions only.
- Cognitive load is modeled from telemetry and pacing, not direct learner feedback yet.
