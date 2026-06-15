# Educational Memory + Pedagogical Reasoning

Phase 15 introduces persistent educational memory and evidence-linked pedagogical reasoning. This layer remembers how learning evolves over time without diagnosing learners, assigning permanent labels, or presenting sparse evidence as certainty.

## Memory Contract

Memory version: `educational-memory.v1`

The current persistence target is `users.behavioral_profile.educational_memory`. This avoids adding a new table before the contract stabilizes while still giving the platform durable, user-linked educational context.

Stored memory includes:

- misconception memory
- recovery memory
- pacing memory
- conceptual memory
- narrative continuity
- teacher summary
- memory aging policy
- metric version

## Misconception Tracking

Misconception records are probabilistic educational evidence. They can include:

- recurring low mastery
- prerequisite misunderstanding
- false mastery cycles
- recurring overconfidence risk
- concept confusion volatility

Each record includes supporting attempts, evidence count, latest score, volatility, prerequisite chain, probability, and a safety note.

## Learning Narrative Continuity

Narrative continuity builds longitudinal statements such as:

- repeated instability may indicate a learning issue around a concept
- recovery evidence is improving but durability should continue to be monitored

Narratives include evidence quality, supporting attempts, narrative confidence, and contradiction flags. They must never sound like psychological certainty.

## Pedagogical Reasoning

Reasoning version: `pedagogical-reasoning.v1`

The reasoning engine can evaluate:

- why recovery may have failed
- why stability may have improved
- which prerequisite chains repeatedly collapse
- which interventions have positive historical evidence

Every claim must expose:

- evidence source
- supporting attempts
- conceptual regions
- telemetry reliability
- narrative confidence
- contradiction flags
- safety boundary

## Teacher Support

Teacher summaries are educator-support artifacts, not diagnoses. They provide:

- conceptual risk regions
- recovery attempts
- intervention history
- pacing stability indicators
- unresolved bottlenecks
- safety note

## Long-Term Continuity

The memory aging policy is explicit:

- recent evidence is weighted first
- older memory should decay unless reconfirmed
- curriculum transitions should version conceptual regions
- year-scale continuity should preserve evidence links, not labels

## Observability

Educational memory observability tracks:

- memory profile count
- misconception persistence rate
- failed recovery count
- recovery durability rate
- narrative stability

## Scientific Safety

The platform must never:

- diagnose intelligence
- label learners permanently
- infer personality traits
- fabricate reasoning causes
- present sparse evidence as certainty

Pedagogical reasoning must remain educational, evidence-linked, uncertainty-aware, and longitudinally calibrated.

## Remaining Risks

- Memory currently persists in JSON profile state; a dedicated audited table may be needed later.
- Misconception inference depends on report quality and concept graph quality.
- Intervention success remains associative unless backed by experimentation.
- Narrative continuity needs human review before educator-facing rollout.
- Memory aging is policy-ready but not yet time-decay calibrated on real longitudinal data.
