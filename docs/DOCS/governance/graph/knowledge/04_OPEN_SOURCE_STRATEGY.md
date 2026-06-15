# OPEN SOURCE STRATEGY

## Philosophy
We do not build infrastructure from scratch unless it is our core intellectual property (pedagogical evaluation, cognitive telemetry, adaptive algorithms). For all other capabilities—orchestration, graphs, memory, and routing—we integrate, adapt, and govern established open-source tools. 

## 1. Codebase Graph & Intelligence
**Do not write a custom AST parser.**
- **`dependency-cruiser` (JavaScript/TypeScript):** Excellent for extracting static graphs and validating rules in CI/CD pipelines. It outputs JSON that can be visualized or fed into an AI context.
- **`pydeps` or `griffe` (Python):** For mapping the backend services.
- **Safishamsi/Graphify (Concept):** Use the structural philosophy to turn codebases into knowledge graphs, but rely on mature AST tools for the raw extraction.
- **Meta's Glean:** If we need to scale to multi-language indexing and symbol resolution.

## 2. Graph Storage & Visualization
**Do not build a custom visualization dashboard from scratch.**
- **NetworkX (Python):** For lightweight, in-memory graph traversal and impact radius calculations in our CI pipelines.
- **Neo4j / Memgraph:** If the graph becomes complex enough to require persistent storage and Cypher queries for architectural governance.
- **Cytoscape.js / D3.js:** For rendering the graph in developer dashboards.

## 3. Agent Orchestration & Workflows
**Do not write a custom while-loop agent runner.**
- **LangGraph:** Crucial for creating cyclical, stateful, and governable multi-agent workflows. It allows us to explicitly define boundaries and state passing between a "Teacher AI" and an "Evaluator AI."
- **Microsoft AutoGen / SmolAgents:** For specific swarm-like tasks where multiple agents need to converse (e.g., discussion systems).

## 4. Architectural Memory Systems
**Do not use a raw text file for long-term memory.**
- **Mem0 (Memory for AI):** Excellent for maintaining a personalized memory layer for students over a multi-year journey, recording facts, preferences, and past performance.
- **ChromaDB / Qdrant:** For vectorizing curriculum content and past agent architectural decisions.

## 5. Educational AI & Discussion Systems
**Do not rely solely on closed-source APIs for core educational logic.**
- **HuggingFace Models (Llama 3.x, Qwen 2.5 Math):** Leverage strong open-weights models for mathematical reasoning and evaluation. They can be fine-tuned on our specific UPSC evaluation criteria to avoid API drift.
- **vLLM / Ollama:** For serving local/internal models during development or for privacy-preserving telemetry processing.

## Integration Mandate
Whenever a new feature is proposed (e.g., "We need a discussion system"), the AI Architect must first present 2-3 open-source frameworks that could serve as the foundation, detailing the integration tradeoffs, before proposing custom code.
