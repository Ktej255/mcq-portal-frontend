# Knowledge Graph + Conceptual Intelligence

Phase 13 introduces graph-calibrated conceptual inference. This layer models knowledge topology separately from behavioral analytics so the platform can reason about prerequisite weakness, dependency risk, and foundation-first recovery without presenting conceptual certainty as fact.

## Canonical Graph Model

Graph version: `knowledge-graph.v1`

Nodes:

- `TOPIC_CONCEPT`: one node per persisted `topics` row.
- Node fields: `id`, `name`, `subject_id`, `subject`, `question_count`, `prerequisites`, `metric_version`.

Edges:

- `PREREQUISITE`: directed edge from prerequisite topic to dependent topic.
- Edge fields: `from`, `to`, `dependency_strength`, `dependency_confidence`, `metric_version`.
- Default dependency strength is conservative until curriculum authors provide calibrated weights.

Current persistence source:

- `topics.prerequisites` is the canonical storage field for prerequisite topic IDs.
- Questions remain attached to topics through `questions.topic_id`.

## Mastery Propagation

Observed topic mastery remains the raw report-derived score. Dependency-adjusted mastery is an inference that applies a downgrade when prerequisite chains contain weak foundations.

Propagation rule:

- If a dependent topic has weak prerequisite evidence, its dependency-adjusted mastery may be lower than observed mastery.
- The downgrade is reliability-weighted and never treated as ground truth.
- Each propagated record includes `observed_mastery`, `dependency_adjusted_mastery`, `dependency_confidence`, `prerequisite_chain`, and `reliability_downgrade`.

Safety boundary:

- A high score on a dependent concept cannot prove prerequisite mastery.
- A weak prerequisite can reduce confidence in dependent mastery, but cannot diagnose the exact cause alone.

## Weak-Foundation Detection

The engine separates likely causes into cautious categories:

- `prerequisite weakness`
- `unstable understanding`
- `confidence illusion`
- `fatigue-related collapse`
- `memorization or local recall failure`

These are analytic hypotheses, not labels. Narrative or recommendation layers must present them with uncertainty qualifiers.

## Recovery Sequencing

Conceptual recovery is foundation-first:

1. Repair prerequisite topics that support weak dependents.
2. Then repair the dependent target topic.
3. Avoid surface remediation when graph evidence suggests a foundational gap.

Output items include `topic`, `reason`, `priority`, and `metric_version`.

## Curriculum Topology

Topology analysis exposes:

- `centrality`: prerequisite/dependent connectivity score.
- `bottleneck_concepts`: concepts with multiple dependents.
- `bridge_concepts`: concepts with both prerequisites and dependents.
- `graph_coverage`: question coverage, dependency coverage, and edge count.

These metrics support curriculum quality work and graph-aware adaptive planning.

## Cross-Topic Reasoning

The engine detects linked conceptual failures when multiple weak dependent topics share the same prerequisite. This supports transfer-weakness analysis and prevents treating repeated failures as isolated topic-local problems.

## Graph-Aware Adaptation Hooks

Adaptive learning now receives:

- `conceptual_recovery_sequence`
- `conceptual_mastery`
- `graph_observability`

Dynamic test assembly can prioritize prerequisite repair before dependent topic practice. This remains reliability-weighted and reversible.

## Observability

Conceptual observability tracks:

- graph coverage
- unresolved prerequisite chains
- bottleneck count
- bridge count
- unstable dependency regions

Operational alerts should watch for low dependency coverage, high unresolved prerequisite count, and repeated remediation failure in the same graph region.

## Remaining Risks

- Prerequisite edges are only as reliable as curriculum authoring.
- Dependency strength is not yet empirically calibrated.
- Concept-level mastery can still be confounded by test quality, fatigue, and sparse question coverage.
- Cross-topic transfer inference needs larger longitudinal samples before strong recommendations.
- Graph topology should be versioned when curriculum structures change.
