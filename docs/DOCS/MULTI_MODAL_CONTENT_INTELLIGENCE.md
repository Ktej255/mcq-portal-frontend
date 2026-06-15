# Multi-Modal Learning Intelligence + Content Understanding

Phase 14 introduces content intelligence as a conservative evidence layer. It helps the platform understand explanations, notes, formulas, tables, visual references, bilingual content, and remediation resources without treating content exposure as proof of mastery.

## Content Contract

Content engine version: `content-intelligence.v1`

Resource input:

- `id`: stable resource identifier.
- `type`: `MCQ_EXPLANATION`, `NOTE`, `PDF_EXTRACT`, `TEACHER_CONTENT`, `TOPIC_SUMMARY`, or similar.
- `text`: extracted educational text.
- `modalities`: optional declared modalities such as `TEXT`, `FORMULA`, `IMAGE`, `TABLE`, `BILINGUAL`.

Resource output:

- mapped graph topics
- prerequisite regions
- difficulty band
- remediation relevance
- extracted formulas, definitions, reasoning chains, and key terms
- modality profile
- metric version

## Concept Extraction

The initial extractor is deterministic and graph-calibrated. It extracts:

- topic/concept matches from the knowledge graph
- formulas such as `v = u + a t`
- definition-like sentences
- reasoning chains using causal and inferential markers
- repeated key terms
- conceptual density

Topic ranking uses match confidence and evidence position in the text.

## Resource-To-Graph Mapping

Every mapped resource can link to:

- topics
- prerequisite chains
- conceptual regions
- estimated difficulty band
- remediation relevance

This allows adaptive systems to prioritize foundational explanations and bridge concepts before dependent-topic drills.

## Explanation Quality

Explanation quality version: `explanation-quality.v1`

The explanation quality engine estimates:

- conceptual clarity
- dependency coverage
- cognitive overload risk
- explanation density
- remediation suitability
- beginner/intermediate/advanced level

Quality is a content signal only. Learning impact requires longitudinal outcome evidence.

## Multi-Modal Foundation

The current modality profile supports:

- text indexing
- formula detection
- visual-reference detection
- table detection
- bilingual mapping readiness

Future image/PDF processing should write into the same resource contract rather than bypassing it.

## Material Effectiveness

Material effectiveness is associative evidence, not causal proof. Outputs include:

- evidence count
- post-exposure improvement
- overload rate
- evidence confidence
- causal warning

The platform must never claim that a resource caused improvement without experimental evidence and causal safeguards.

## Remediation Library

The remediation library groups resources by mapped topic and ranks them by remediation relevance. This supports:

- foundational explanations
- prerequisite refreshers
- conceptual walkthroughs
- progressive reinforcement sequences
- bridge concept repair

## Educational Semantic Search

Semantic retrieval combines graph topic overlap and text-term overlap. It can retrieve:

- related explanations
- prerequisite resources
- bridge-concept material
- similar remediation pathways

Search outputs remain versioned and include matched topics, difficulty band, and remediation relevance.

## Content Observability

Content observability tracks:

- resource count
- concept coverage rate
- sparse concept regions
- overloaded content count
- low-quality explanation clusters
- bottleneck resource gaps

These metrics expose curriculum/content health without inferring student understanding.

## Scientific Safety

The platform must never:

- overclaim educational effectiveness
- infer mastery from reading alone
- confuse content exposure with conceptual understanding
- fabricate comprehension
- make causal claims from observational material outcomes

Content intelligence must remain evidence-aware, graph-calibrated, uncertainty-aware, and pedagogically conservative.

## Remaining Risks

- Deterministic extraction misses synonyms and deeper semantics.
- Formula parsing is intentionally basic and should later be replaced by a structured math parser.
- PDF/image/table extraction is represented at the contract layer but not yet backed by OCR or vision models.
- Bilingual matching is readiness-level only.
- Effectiveness modeling needs intervention linkage and controlled experiments before stronger claims.
