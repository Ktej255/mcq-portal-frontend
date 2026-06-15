# PROJECT CONSTITUTION v1
**System Identity:** Adaptive UPSC Self-Study Operating System

## 1. Product Identity & Core Mission
We are not building an "AI App" or a standalone MCQ platform. We are building a **Long-Term Educational Infrastructure**. This system serves as a cognitive operating system designed to map, track, and adapt to a student's multi-year UPSC preparation journey. 

## 2. Architectural Philosophy
- **Stability Over Speed:** Feature velocity must never compromise the mathematical accuracy of grading, testing, or telemetry.
- **Graph-Governed Dependencies:** Code is not a flat directory; it is a directed acyclic graph. Dependencies must be explicit, observable, and strictly unidirectional.
- **Causal Modularity:** Systems must be physically and logically separated into bounded contexts. An error in the UI must never corrupt the grading engine.
- **Cognitive Protection:** The system's educational logic (how we score, how we recommend) is sacred. It must be insulated from infrastructure logic (how we cache, how we route).

## 3. Folder Boundaries & Protected Systems
### Protected Zones (Tier 0 - Critical)
Changes to these zones require multi-layered governance and impact analysis:
- `core/educational-engine`: Grading, negative marking, adaptive logic.
- `core/telemetry`: Behavioral tracking, event schemas, cognitive telemetry.
- `infrastructure/database`: Migrations, schema definitions.

### Integration Zones (Tier 1 - Managed)
- `apps/backend/api`: Route handlers, controllers.
- `apps/frontend/state`: Zustand stores, data fetching.

### Presentation Zones (Tier 2 - Fluid)
- `apps/frontend/components/ui`: Visual presentation, Tailwind styling.

## 4. Module Ownership & Dependency Rules
- **Educational Logic != Infrastructure Logic:** Modules that calculate pedagogical outcomes must not know about PostgreSQL or Redis. They must operate on pure data structures.
- **Unidirectional Data Flow:** Presentation layers depend on State layers. State layers depend on API layers. API layers depend on Domain/Core logic. **Core logic depends on nothing.**
- **No Hidden Coupling:** If Module A needs data from Module B, it must pass through an explicit, versioned interface. 

## 5. AI Agent Safety Rules & Edit Governance
To prevent the chaotic mutation of the codebase by AI agents:
1. **Pre-Edit Graph Querying:** Before an agent modifies a file, it must query the Codebase Intelligence Graph to determine the "blast radius" of the edit.
2. **Zone Restrictions:** Agents operating on UI tasks are strictly prohibited from modifying Tier 0 Protected Systems.
3. **Intent Declaration:** Agents must declare their architectural intent before writing code (e.g., "I am modifying X, which impacts Y and Z").
4. **No Cross-Domain Spanning:** An agent cannot simultaneously refactor a database schema and a frontend UI component in the same unverified context.

## 6. Regression Prevention Strategy
- **Architectural Linting:** Enforce boundary rules in CI (e.g., using tools like `dependency-cruiser` to fail builds if the UI imports directly from the database).
- **Snapshot & Contract Testing:** All mathematical grading and telemetry payloads must have immutable snapshot tests.
- **Impact Radius Sign-off:** Any PR or automated edit modifying a file with an inbound dependency count > 5 requires explicit human sign-off.

## 7. Scalability & Educational Infrastructure Philosophy
- **Longitudinal Durability:** The system must accurately reconstruct a student's state from 3 years ago. Data is immutable. We append events; we do not overwrite history.
- **Stateless Execution:** Test solving and MCQ evaluation must be horizontally scalable and stateless.
- **First, Do No Harm:** Avoid hallucinated educational interventions. If the AI is uncertain about a pedagogical recommendation, it must default to standard structured revision.
