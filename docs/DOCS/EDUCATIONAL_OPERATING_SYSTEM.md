# Educational Operating System + Orchestration

Phase 16 introduces a coordinated pedagogical operating layer. Its purpose is to route evidence across existing engines, arbitrate conflicts, and explain educational decisions without creating opaque automation.

## Orchestrator

Orchestrator version: `educational-orchestrator.v1`

The orchestrator coordinates:

- telemetry intelligence
- longitudinal intelligence
- adaptive intelligence
- conceptual intelligence
- pedagogical memory
- content intelligence
- experimentation layer

It returns an educational decision, unified state summary, cross-engine reasoning, explanation payload, memory-aware context, and safety metadata.

## Unified Educational State

State version: `educational-state.v1`

The state manager unifies:

- telemetry reliability
- longitudinal reliability
- conceptual reliability
- adaptive reliability
- memory continuity
- graph stability

It also scans for contradictions such as load-vs-difficulty conflict, assertive adaptation with unresolved misconception memory, and low-reliability graph action.

## Policy Engine

Policy version: `educational-policy.v1`

Policies govern:

- adaptation aggressiveness
- overload prevention
- uncertainty thresholds
- recommendation safety
- intervention reversibility
- educator-review requirements

Low reliability or contradictions force soft guidance, blocked alternatives, and human-review escalation.

## Decision Arbitration

Arbitration prioritizes:

1. foundation-first remediation when conceptual recovery and memory risks agree
2. load reduction when pacing or cognitive-load risk is high
3. adaptive practice only when stability permits
4. soft guidance when confidence is below policy thresholds

The orchestrator avoids aggressive optimization and treats experimentation as policy-gated.

## Explainability

Every orchestration result exposes:

- why the decision was generated
- contributing systems
- reliability weighting
- uncertainty
- blocked alternatives
- safety overrides
- experiment assignment status

## Governance

Governance guards:

- runaway adaptation
- unsafe workload escalation
- skipping foundation repair
- low-confidence experimentation
- opaque recommendation logic

## Memory Integration

The orchestrator considers:

- historical failed recoveries
- repeated misconception collapse
- successful interventions
- pacing sensitivity history
- conceptual bottlenecks

Memory is used as educational evidence, not as a permanent learner label.

## Observability

Orchestration observability tracks:

- orchestrated user count
- action distribution
- arbitration conflicts
- blocked unsafe adaptations
- human-review escalation rate
- low-confidence orchestration rate

## Safety Boundaries

The platform must never:

- optimize education blindly
- prioritize engagement over learning stability
- aggressively automate pedagogy
- suppress uncertainty
- hide blocked alternatives

The orchestrator must remain transparent, evidence-linked, reversible, uncertainty-aware, and educator-aligned.

## Remaining Risks

- Orchestration currently computes synchronously and should later move to durable snapshots.
- Content intelligence contributes weak evidence until resource outcomes are linked.
- Policy thresholds are conservative heuristics and need calibration.
- Human-review workflows are flagged but not yet operationalized in UI.
- Orchestration observability samples persisted profiles rather than a dedicated decision log.
