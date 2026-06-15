# Graph Report - MCQ Portal  (2026-05-13)

## Corpus Check
- 299 files · ~308,881 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1710 nodes · 3132 edges · 83 communities detected
- Extraction: 59% EXTRACTED · 41% INFERRED · 0% AMBIGUOUS · INFERRED: 1276 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 145|Community 145]]

## God Nodes (most connected - your core abstractions)
1. `Attempt` - 74 edges
2. `Question` - 64 edges
3. `StandardResponse` - 60 edges
4. `User` - 55 edges
5. `Report` - 54 edges
6. `Topic` - 50 edges
7. `Test` - 48 edges
8. `AttemptStatusEnum` - 42 edges
9. `ExamEvent` - 40 edges
10. `SoftDeleteMixin` - 38 edges

## Surprising Connections (you probably didn't know these)
- `create_subject()` --calls--> `Subject`  [INFERRED]
  backend\app\crud\admin.py → backend\app\models\domain.py
- `create_topic()` --calls--> `Topic`  [INFERRED]
  backend\app\crud\admin.py → backend\app\models\domain.py
- `create_question()` --calls--> `Question`  [INFERRED]
  backend\app\crud\admin.py → backend\app\models\domain.py
- `create_test()` --calls--> `Test`  [INFERRED]
  backend\app\crud\admin.py → backend\app\models\domain.py
- `Operational Alert Service — Phase 9, Priority 9 ================================` --uses--> `Report`  [INFERRED]
  backend\app\services\operational_alert_service.py → backend\app\models\domain.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (129): InstitutionalAuditMixin, Attempt, AttemptAnswer, Cohort, CohortMembership, ExamEvent, Question, Report (+121 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (87): get_current_user(), BaseSettings, assemble_cors_origins(), Config, Settings, verify_token(), calculate_blast_radius(), GraphExtractor (+79 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (71): Base, InstitutionalAuditMixin, Enforces data preservation requirements.      Educational records must not be ha, Standard institutional audit trail for educational records., SoftDeleteMixin, Exception, CausalInference, CognitiveSnapshot (+63 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (84): BaseModel, Enum, AttemptStatusEnum, ConfidenceEnum, validate_correct_option(), validate_options_count(), shuffle_options(), BulkQuestionCreate (+76 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (55): STRICT GOVERNANCE SUITE: Ensures core educational calculations remain immutable., TestBehavioralRegression, adaptive_reliability(), build_adaptive_learning_plan(), candidate_questions_for_topic(), cognitive_load_balance(), difficulty_mix(), personalized_difficulty() (+47 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (59): conceptual_density(), conceptual_overlap(), content_observability(), extract_content_concepts(), map_resource_to_graph(), modality_profile(), _normalize(), remediation_library() (+51 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (33): ExecutionTrace, JobExecutionRegistry, RoleEnum, ExecutionTracer, Config, JobListResponse, MetricListResponse, TraceBase (+25 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (36): attempt_reliability_profile(), behavioral_data_quality(), clamp(), contradiction_detector(), event_completeness(), focus_continuity(), narrative_uncertainty_guidance(), ReliabilityResult (+28 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (19): ABC, CrossAgentReasoningEngine, get_agent_consensus(), Phase 25B & 25C: Negotiate consensus and expose disagreements., Produce a weighted consensus that exposes participating agents., get_institution_aware_cognition(), InstitutionalAgentCoordinator, Phase 25G: Adapt agent coordination based on institutional policy context. (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (32): replay_orchestration_decision(), replay_telemetry_stream(), verify_replay_integrity(), cross_engine_reasoning(), explain_orchestration_decision(), orchestrate_education(), orchestrate_live_session(), orchestration_observability() (+24 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (24): assign_experiment(), experiment_observability(), causal_confidence(), confounding_warnings(), safe_claim_language(), longitudinal_intervention_analytics(), acceptance_summary(), attach_intervention_outcome() (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (10): IInferenceProvider, IInferenceProvider, InferenceRequest, InferenceResponse, generate(), generate_async(), get_provider(), InferenceGateway (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.1
Nodes (11): EducationalHumilityEngine, get_human_reality_risk_documentation(), HumanContextEngine, HumanRealityResilienceEngine, Phase 32J: Full documentation of risks where models replace human reality., Phase 32H: Document what the system cannot measure and where it is likely wrong., Phase 32G: Anchor educational reasoning to socioeconomic and cultural reality., Phase 32F: Require periodic educator challenges to all autonomous educational mo (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (9): CuriosityPreservationEngine, ExistentialEducationEngine, get_wonder_preservation_report(), KnowledgeDignityEngine, Phase 33D: Detect when optimization is killing exploratory learning., Ensure content recommendations include non-linear, surprise-inducing pathways., Phase 33E: Recognize education as human becoming, not industrial throughput., Phase 33F: Protect knowledge domains that resist economic justification. (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (9): get_flourishing_risk_documentation(), HumanFlourishingResilienceEngine, HumanFreedomEngine, PostOptimizationGovernanceEngine, Phase 33J: Full documentation of risks to human flourishing in educational AI., Phase 33G: Track when adaptation subtly narrows human educational freedom., Trigger alert if adaptation is silently constraining educational freedom., Phase 33H: Govern optimization to never sacrifice flourishing for efficiency. (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (11): clamp(), _intensity_multiplier(), _pressure_multiplier(), simulate_educational_scenario(), format_scientific_simulation_output(), predictive_observability_report(), Phase 22F: Simulate adaptation changes before deployment., Phase 22G: Ensure strict predictive ethics and uncertainty exposure. (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (4): create_question(), create_subject(), create_test(), create_topic()

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (8): EducationalResilienceSimulationEngine, get_existential_risk_documentation(), PedagogicalPluralismEngine, Phase 28E: Ensure multiple pedagogical paradigms can coexist., Phase 28G: Ensure every adaptation has a clear rollback path., Phase 28I: Stress-test governance collapse and systemic failures., Phase 28J: Document existential educational risks and mitigation status., ReversibleAdaptationEngine

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (7): detect_confidence_inflation(), detect_scoring_drift(), production_drift_analysis(), calculate_calibration_curve(), _calculate_confidence_intervals(), monitor_signal_calibration(), StatisticalObservabilityEngine

### Community 19 - "Community 19"
Cohesion: 0.16
Nodes (8): calculate_half_life(), mean_score(), validate_intervention_durability(), MetaLearningEngine, Phase 23A: Learn which interventions remain effective long-term., Learn which calibration systems tend to drift over time., Phase 23F: Learn which strategies generalize across cohorts., track_strategy_generalization()

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (6): normalizeConfidence(), normalizeOptionId(), normalizeReportPayload(), requireFiniteNumber(), handleConfidenceSelect(), handleOptionChange()

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (7): AntiAbstractionEngine, CulturalLearningEngine, get_anti_abstraction_report(), Phase 32D: Detect when the system is reducing humanity into telemetry., Prevent standardized metrics from erasing cultural educational diversity., Phase 32E: Protect indigenous pedagogies, oral traditions, and regional cognitio, Confirm the system has not begun replacing human educational reality with models

### Community 22 - "Community 22"
Cohesion: 0.27
Nodes (9): assert_attempt_belongs_to_user(), assert_attempt_in_progress(), AttemptLockError, get_server_elapsed_seconds(), is_timer_expired(), lock_for_save(), lock_for_submit(), AttemptLockManager — Phase 9, Priority 2 ======================================= (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (6): DependencyRecoveryEngine, PostAutonomousContinuityEngine, Phase 30C: Model AI withdrawal and regional autonomy restoration., Phase 30H: Stress-test complete platform loss and recovery., Phase 30D: Detect educator deskilling and learner autonomy decay., Generate a structured path to restore independent human educational capability.

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (7): record_evolution(), update_student_evolution(), generate_performance_narrative(), generate_rule_based_narrative(), Heuristic fallback when AI is unavailable - providing high-fidelity structured a, run_async_cognitive_pipeline(), verify_report_integrity()

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (1): EventsService

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (5): AntiPerformanceEngine, IdentitySafetyEngine, Phase 33B: Detect when optimization has consumed the learner's identity., Phase 33C: Protect learners from predictive identity locking and determinism., Detect deterministic framing in generated educational reports.

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (6): agent_observability_report(), AgentGovernanceService, Phase 25D: Track agent performance across different educational domains., Phase 25E: Multi-perspective causal validation., Phase 25F: Ensure originating agent and evidence basis are exposed., Phase 25H: Monitor agent disagreement and specialization drift.

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (6): AntiCaptureGovernanceEngine, DecentralizedResilienceEngine, get_anti_capture_alert_log(), Phase 29C: Detect institutional over-centralization and ideological capture., Phase 29F: Ensure ecosystem survival against institutional collapse., Return historical alerts regarding governance concentration or capture attempts.

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (6): CivilizationalGovernanceEngine, get_governance_drift_alert(), Phase 28D: Track governance drift and centralization risks., Phase 28H: Prevent false certainty amplification and dogmatism., Detect signs of systemic governance erosion at the civilizational scale., UncertaintyPreservationEngine

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (6): CurriculumEvolutionEngine, GenerationalLearningMemory, get_historical_pedagogical_trends(), Phase 27B: Analyze curriculum drift and sequencing instability., Phase 27C & 27H: Persist ecosystem-scale educational memory., Phase 27G: Track historical intervention success and strategy evolution.

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (6): EducationalFreedomEngine, EducationalRightsFramework, get_learner_bill_of_rights(), Phase 29B: Protect learner autonomy, educator freedom, and the right to dissent., Phase 29H: Track freedom of educational exploration and pedagogical creativity., Return the fundamental rights of every learner in the ecosystem.

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (6): get_coevolution_safety_audit(), GovernanceMemoryEngine, HumanCoevolutionEngine, Phase 29D: Model dependency formation, skill atrophy, and replacement pressure., Phase 29G: Persist constitutional amendments and historical safeguards., Audit the system to ensure it is self-limiting and human-first.

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (6): EducationalDissentEngine, get_anti_monoculture_report(), HumanSovereigntyEngine, Phase 28B: Protect educator authority and student agency., Phase 28C: Model disagreement with dominant pedagogy and alternative pathways., Phase 28C: Ensure the system is not forcing a single educational ideology.

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (6): CivilizationalLearningEngine, get_ecosystem_evolution_snapshot(), InstitutionalCultureEngine, Phase 27E: Model institutional pacing identity and educational culture., Phase 27F: Estimate long-term mastery durability and knowledge sustainability., Phase 27H: Provide a summary of the educational ecosystem's multi-year evolution

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (5): HumanPriorityEnforcementEngine, Phase 30F: Ensure the platform behaves as caretaker, not ruler., Reject any action that crosses from stewardship into authority., Phase 30I: Enforce permanent human-priority guarantees over all optimization., StewardshipEthicsEngine

### Community 37 - "Community 37"
Cohesion: 0.2
Nodes (5): useAuth(), DashboardLayout(), DashboardHome(), useApiConfig(), ProtectedRoute()

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (5): AutonomousObservabilityEngine, get_autonomous_observability_plan(), Phase 23G: Learn which alerts matter and which signals are noisy., Learn which metrics lose reliability over time., Return the current plan for self-improving observability metrics.

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (5): EcosystemEvolutionEngine, get_ecosystem_health_snapshot(), Phase 23I: Model system-level educational evolution over years., Identify emerging educational bottlenecks before they occur., Provide a high-level view of the entire educational ecosystem's health.

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (5): EducationalAlignmentEngine, get_alignment_drift_report(), Phase 28A: Evaluate whether adaptations remain human-aligned., Phase 28F: Reason about educational fairness and long-term flourishing., Monitor long-term alignment drift between system goals and human values.

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (5): EducationalArchiveEngine, get_archive_health_report(), Phase 30E: Archive pedagogical diversity, governance history, and dissent tradit, Retrieve a historically proven recovery strategy for a given failure scenario., Verify archive integrity and accessibility.

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (5): EducationalBeliefAuditEngine, get_institutional_reasoning_diagnostics(), Phase 26B: Track persistent pedagogical assumptions and their stability., Phase 26E: Structured educational self-analysis of failures., Phase 26G: Diagnose institutional adaptation drift and curriculum rigidity.

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (5): EducationalConstitutionEngine, get_constitutional_amendment_history(), Phase 29A: Ensure all educational actions comply with immutable principles., Phase 29E: Hard-limit adaptation intensity and autonomous expansion., Phase 29G: Retrieve history of multi-generational governance continuity.

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (5): EducationalExitabilityEngine, Phase 30B: Ensure institutions can disengage safely and operate independently., Generate a complete self-contained educational package for system exit., Phase 30B: Confirm the system imposes no technical or contractual exit barriers., verify_no_exit_barriers()

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (5): get_human_legacy_integrity_report(), HumanLegacyEngine, Phase 30A: Archive human-created pedagogies and educator craftsmanship., Capture the full breadth of current human educational approaches for posterity., Verify that legacy preservation is not being silently eroded by optimization.

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (5): get_generational_misconception_report(), KnowledgeEvolutionEngine, Phase 27A: Track concept durability and decay over long horizons., Phase 27D: Dynamic educational graph intelligence., Phase 27C: Identify misconceptions that recur across cohort generations.

### Community 47 - "Community 47"
Cohesion: 0.28
Nodes (4): MetaReasoningEngine, Phase 26A: Analyze reasoning chains and failed predictions., Phase 26C: Trace which agents and assumptions dominated reasoning., trace_decision_lineage()

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): get_calibration_audit_trail(), Phase 23B: Continuously recalibrate thresholds based on actual outcomes., Ensure all self-adjustments are traceable, versioned, and reversible., Return the history of self-calibration adjustments for a specific metric., SelfCalibrationEngine

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (5): identify_robust_pedagogical_pathways(), Phase 23C: Track strategy durability and fatigue accumulation., Phase 23D: Compare simulation predicted outcomes vs actual outcomes., Identify pathways that consistently generalize across different cohorts., StrategyEvolutionSystem

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (5): get_remaining_post_autonomous_risks(), Phase 30G: Define how systems are retired and authority is safely relinquished., Emergency rapid handoff to human governance in crisis scenarios., Phase 30J: Document all remaining post-autonomous stewardship risks., SunsetGovernanceEngine

### Community 51 - "Community 51"
Cohesion: 0.5
Nodes (7): _add_column_if_missing(), _create_index_if_missing(), downgrade(), _has_column(), _has_table(), Align integrity and event schema  Revision ID: 9b2c7d4e8f10 Revises: 1a4a1f9a032, upgrade()

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (4): CivilizationalAntifragilityEngine, get_remaining_constitutional_risks(), Phase 29I: Stress-test erosion, capture, and monoculture collapse., Phase 29J: Document constitutional risks, loopholes, and drift.

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (4): CognitiveIntegrityMonitor, get_reflective_observability_report(), Phase 26H: Protect against reasoning collapse and silent confidence inflation., Phase 26I: Monitor introspection quality and reflective drift.

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (4): EducationalFutureForecastingEngine, get_remaining_civilizational_risks(), Phase 27I: Forecast future curriculum bottlenecks and ecosystem drift., Phase 27J: Document civilizational-scale risks and biases.

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (4): get_reflective_governance_metrics(), MetaUncertaintyEngine, Phase 26D: Estimate uncertainty about uncertainty and detect false confidence., Phase 26F: Track governance quality and self-critique metrics.

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (4): Phase 23E: Automatic response to reliability degradation., Execute a self-calibration workflow for a degraded metric., ReliabilitySelfHealingService, trigger_recalibration_protocol()

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (1): ResearchReproducibilityEngine

### Community 58 - "Community 58"
Cohesion: 0.52
Nodes (6): clean_text(), extract_blocks(), parse_answer_key(), parse_explanations(), parse_question_block(), run_ingestion()

### Community 59 - "Community 59"
Cohesion: 0.52
Nodes (6): check_governance(), classify_risk(), get_blast_radius(), load_graph(), log_mutation(), main()

### Community 62 - "Community 62"
Cohesion: 0.4
Nodes (4): Run migrations in 'offline' mode.      This configures the context with just a U, Run migrations in 'online' mode.      In this scenario we need to create an Engi, run_migrations_offline(), run_migrations_online()

### Community 63 - "Community 63"
Cohesion: 0.6
Nodes (4): downgrade(), _has_table(), Add cognitive snapshots  Revision ID: 2c6f1a7d0b91 Revises: 9b2c7d4e8f10 Create, upgrade()

### Community 64 - "Community 64"
Cohesion: 0.6
Nodes (4): downgrade(), _has_table(), Add learning interventions  Revision ID: 5d9a8c3e1f22 Revises: 2c6f1a7d0b91 Crea, upgrade()

### Community 65 - "Community 65"
Cohesion: 0.5
Nodes (3): _has_column(), Add forensic_data to Report  Revision ID: 64afae94d021 Revises: ce88a5aa7844 Cre, upgrade()

### Community 66 - "Community 66"
Cohesion: 0.5
Nodes (3): _has_column(), add user behavioral profile columns  Revision ID: ff64f4eededb Revises: 5d9a8c3e, upgrade()

### Community 67 - "Community 67"
Cohesion: 0.4
Nodes (4): Focus Area 2: Edge Case Execution.     Manual scenarios for corrupted state veri, Focus Area 7: Load & Performance Testing.     Simulates concurrent report genera, simulate_concurrent_load(), test_edge_cases()

### Community 68 - "Community 68"
Cohesion: 0.4
Nodes (3): Simulates a student attempt based on persona behaviors., simulate_attempt(), StudentPersona

### Community 70 - "Community 70"
Cohesion: 0.5
Nodes (1): Add truth_status to reports  Revision ID: 0006_truth_status Revises: 5d9a8c3e1f2

### Community 71 - "Community 71"
Cohesion: 0.5
Nodes (1): Initial schema creation  Revision ID: 1a4a1f9a032c Revises:  Create Date: 2026-0

### Community 72 - "Community 72"
Cohesion: 0.5
Nodes (1): Add institutional governance fields  Revision ID: 1a6510b47dd9 Revises: 7f9633e9

### Community 73 - "Community 73"
Cohesion: 0.5
Nodes (1): add_question_authoring_and_revision_queue  Revision ID: 4db43a970cab Revises: bd

### Community 74 - "Community 74"
Cohesion: 0.5
Nodes (1): Phase 33 integrated  Revision ID: 6a54c4d280dd Revises: 757a11800717 Create Date

### Community 75 - "Community 75"
Cohesion: 0.5
Nodes (1): Sync schema  Revision ID: 757a11800717 Revises: ff64f4eededb Create Date: 2026-0

### Community 76 - "Community 76"
Cohesion: 0.5
Nodes (1): Add report versioning and job registry  Revision ID: 7f9633e90c49 Revises: e8b7b

### Community 77 - "Community 77"
Cohesion: 0.5
Nodes (1): Add governance mixins to learning and cognitive models  Revision ID: bd3e1ee4ba1

### Community 78 - "Community 78"
Cohesion: 0.5
Nodes (1): add_intelligence_fields_to_report  Revision ID: ce88a5aa7844 Revises: 6a54c4d280

### Community 79 - "Community 79"
Cohesion: 0.5
Nodes (1): Add forensic metrics to Report  Revision ID: dbdacf5ea416 Revises: 4db43a970cab

### Community 80 - "Community 80"
Cohesion: 0.5
Nodes (1): merge_operational_branches  Revision ID: e8b7bfcab8da Revises: 0006_truth_status

### Community 81 - "Community 81"
Cohesion: 0.83
Nodes (3): _calculate_volatility(), construct_cohort_twin(), simulate_curriculum_impact()

### Community 83 - "Community 83"
Cohesion: 0.5
Nodes (2): cn(), Badge()

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (2): check_schema(), run_migrations()

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (2): check_governance(), run_blast_radius()

### Community 96 - "Community 96"
Cohesion: 1.0
Nodes (2): check_integrity(), load_graph()

### Community 145 - "Community 145"
Cohesion: 1.0
Nodes (1): Centralized Single Scoring Authority.         All score math must come from this

## Knowledge Gaps
- **151 isolated node(s):** `Run migrations in 'offline' mode.      This configures the context with just a U`, `Run migrations in 'online' mode.      In this scenario we need to create an Engi`, `Add truth_status to reports  Revision ID: 0006_truth_status Revises: 5d9a8c3e1f2`, `Initial schema creation  Revision ID: 1a4a1f9a032c Revises:  Create Date: 2026-0`, `Add institutional governance fields  Revision ID: 1a6510b47dd9 Revises: 7f9633e9` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 25`** (13 nodes): `EventsService`, `.evaluateIdleState()`, `.flush()`, `.getOrCreateSessionId()`, `.init()`, `.markActive()`, `.record()`, `.recordFocusState()`, `.recordHeartbeat()`, `.startTelemetry()`, `.stop()`, `.stopTelemetry()`, `eventsService.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (7 nodes): `research_reproducibility_engine.py`, `ResearchReproducibilityEngine`, `.create_experiment_snapshot()`, `._generate_logic_hash()`, `.__init__()`, `.verify_reproducibility()`, `run_reproducible_evaluation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (4 nodes): `0006_add_truth_status_to_reports.py`, `downgrade()`, `Add truth_status to reports  Revision ID: 0006_truth_status Revises: 5d9a8c3e1f2`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (4 nodes): `1a4a1f9a032c_initial_schema_creation.py`, `downgrade()`, `Initial schema creation  Revision ID: 1a4a1f9a032c Revises:  Create Date: 2026-0`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (4 nodes): `1a6510b47dd9_add_institutional_governance_fields.py`, `downgrade()`, `Add institutional governance fields  Revision ID: 1a6510b47dd9 Revises: 7f9633e9`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (4 nodes): `4db43a970cab_add_question_authoring_and_revision_.py`, `downgrade()`, `add_question_authoring_and_revision_queue  Revision ID: 4db43a970cab Revises: bd`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (4 nodes): `6a54c4d280dd_phase_33_integrated.py`, `downgrade()`, `Phase 33 integrated  Revision ID: 6a54c4d280dd Revises: 757a11800717 Create Date`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (4 nodes): `757a11800717_sync_schema.py`, `downgrade()`, `Sync schema  Revision ID: 757a11800717 Revises: ff64f4eededb Create Date: 2026-0`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (4 nodes): `7f9633e90c49_add_report_versioning_and_job_registry.py`, `downgrade()`, `Add report versioning and job registry  Revision ID: 7f9633e90c49 Revises: e8b7b`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (4 nodes): `bd3e1ee4ba10_add_governance_mixins_to_learning_and_.py`, `downgrade()`, `Add governance mixins to learning and cognitive models  Revision ID: bd3e1ee4ba1`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (4 nodes): `ce88a5aa7844_add_intelligence_fields_to_report.py`, `downgrade()`, `add_intelligence_fields_to_report  Revision ID: ce88a5aa7844 Revises: 6a54c4d280`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (4 nodes): `dbdacf5ea416_add_forensic_metrics_to_report.py`, `downgrade()`, `Add forensic metrics to Report  Revision ID: dbdacf5ea416 Revises: 4db43a970cab`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (4 nodes): `e8b7bfcab8da_merge_operational_branches.py`, `downgrade()`, `merge_operational_branches  Revision ID: e8b7bfcab8da Revises: 0006_truth_status`, `upgrade()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (4 nodes): `badge.tsx`, `utils.ts`, `cn()`, `Badge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (3 nodes): `check_schema()`, `migrate.py`, `run_migrations()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (3 nodes): `governance_check.py`, `check_governance()`, `run_blast_radius()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (3 nodes): `check_integrity()`, `load_graph()`, `integrity_check.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (1 nodes): `Centralized Single Scoring Authority.         All score math must come from this`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `StandardResponse` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `Question` connect `Community 0` to `Community 2`, `Community 4`, `Community 5`, `Community 16`, `Community 58`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Attempt` (e.g. with `Simulated learning evolution data.` and `Priority 9: Data Export for Student Sovereignty.`) actually correct?**
  _`Attempt` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Are the 60 inferred relationships involving `Question` (e.g. with `Get the pending revision items for the current user.` and `Priority 2: Micro-Revision Mode.     Fast retrieval for daily consistency drill`) actually correct?**
  _`Question` has 60 INFERRED edges - model-reasoned connections that need verification._
- **Are the 58 inferred relationships involving `StandardResponse` (e.g. with `Priority 3: Batch Calibration.     Recalculates batch difficulty and student al` and `Returns the current user profile. If the user doesn't exist in the database yet,`) actually correct?**
  _`StandardResponse` has 58 INFERRED edges - model-reasoned connections that need verification._
- **Are the 53 inferred relationships involving `User` (e.g. with `Priority 3: Batch Calibration.     Recalculates batch difficulty and student al` and `Returns the current user profile. If the user doesn't exist in the database yet,`) actually correct?**
  _`User` has 53 INFERRED edges - model-reasoned connections that need verification._