# CODEBASE GRAPH INTELLIGENCE SYSTEM: ROADMAP

## Mission Statement
To transition the codebase from a flat filesystem into a mathematically observable directed graph. This system will serve as the "brain" for future AI agents, preventing chaotic modifications by enforcing dependency awareness and impact calculation prior to any code alteration.

---

## Phase 1: Static Dependency Extraction & Mapping
**Objective:** Parse the existing codebase into a structured graph of files, imports, and exports.
- **Language Parsers:** Implement AST (Abstract Syntax Tree) parsing for TypeScript (Frontend) and Python (Backend).
- **Node Definition:** Every file, class, function, and database table is a Node.
- **Edge Definition:** `imports`, `calls`, `inherits`, `writes_to`, and `reads_from` are Edges.
- **Tooling:** Utilize `dependency-cruiser` for JS/TS and `pydeps` for Python to output static JSON adjacency lists.

## Phase 2: Graph Storage & Visualization
**Objective:** Make the dependencies observable to humans and queryable by AI.
- **Storage:** Export AST extractions into a local graph format (e.g., NetworkX in Python) or a dedicated Graph DB if scale demands (e.g., Neo4j).
- **Architectural Dashboard:** Create a local developer visualization tool (using D3.js or Cytoscape.js) to view the "MCQ Portal Universe."
- **Focus Areas:** Highlight tightly coupled monoliths, circular dependencies, and isolated modules.

## Phase 3: Impact Analysis & Blast Radius Calculation
**Objective:** Answer the question: *"If I change this file, what breaks?"*
- **Reverse Traversal:** When a file is targeted for an edit, traverse inbound edges to identify all dependent files.
- **Risk Scoring:** Assign a risk score based on:
  - Centrality (How many files depend on this?)
  - Layer (Is this a UI file or a Core Engine file?)
- **Agent Interceptor Logic:** AI agents must pass their proposed file edits to the Graph Engine. If the Risk Score exceeds a threshold, the edit is blocked pending architectural review.

## Phase 4: Runtime Relationship Mapping (Telemetry to Graph)
**Objective:** Map implicit dependencies that static AST cannot catch (e.g., API calls, event bus messaging).
- **API Tracing:** Inject correlation IDs into frontend requests and track them to backend endpoints and DB queries.
- **Overlaying Edges:** Merge runtime graph edges (e.g., `Frontend_Component_A` -> `HTTP_POST` -> `Backend_Route_B`) with the static AST graph.

## Phase 5: Protected Architectural Zones & Enforcement
**Objective:** Programmatic architectural governance.
- **Boundary Rules:** Define policies in code (e.g., "Files in `/core` cannot have outbound edges to `/infrastructure`").
- **CI/CD Gates:** If a developer or AI agent creates a PR that violates a boundary rule (creates an illegal edge in the graph), the build automatically fails.
- **Self-Healing Recommendations:** When the Graph Engine detects a violation, it instructs the AI agent on how to refactor via Facades or Dependency Injection to comply with the architecture.
