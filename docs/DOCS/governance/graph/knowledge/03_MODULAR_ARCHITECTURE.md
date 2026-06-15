# MODULAR FOLDER ARCHITECTURE
**Evolution Path:** MCQ Portal → Self Study System → Adaptive Learning OS

This folder architecture enforces the Project Constitution. It relies on a monorepo structure utilizing strict domain boundaries.

```text
mcq-portal-os/
│
├── docs/                           # Architectural Memory & Governance
│   ├── governance/                 # Constitutions, Rules, Graph Policies
│   └── architecture/               # ADRs (Architecture Decision Records)
│
├── packages/                       # Shared, Agnostic Infrastructure (No App Logic)
│   ├── ui-kit/                     # Dumb UI components (Buttons, Inputs)
│   ├── design-system/              # Tokens, Tailwind Config, Colors
│   ├── core-types/                 # Universal interfaces (e.g., IQuestion, IUser)
│   └── logger/                     # Standardized telemetry and logging interfaces
│
├── domains/                        # The Educational Operating System (Protected Zone)
│   ├── evaluation-engine/          # Pure math: Grading, negative marking algorithms
│   ├── behavioral-telemetry/       # Pure logic: Event processing, dwell time analysis
│   ├── adaptive-planner/           # Recommendation systems and study planning
│   └── spaced-repetition/          # Revision and memory decay algorithms
│
├── services/                       # Backend Microservices (Infrastructure & APIs)
│   ├── api-gateway/                # Routing, Rate Limiting, Auth Validation
│   ├── exam-service/               # Test delivery, state saving, submission
│   ├── ingestion-service/          # Parsing PDFs, inserting questions into DB
│   └── intelligence-worker/        # Async graph processing, heavy ML tasks
│
├── apps/                           # Presentation Layers (Consumes Domains & Services)
│   ├── student-portal/             # Main Next.js App (MCQs, Dashboards)
│   ├── institutional-dashboard/    # Admin/Teacher analytics interface
│   └── ingestion-tool/             # Internal tool for adding questions
│
└── governance-tools/               # Codebase Cognition System
    ├── graph-extractor/            # AST parsers and dependency extraction scripts
    ├── agent-interceptor/          # Wrappers for AI tools to verify blast radius
    └── ci-boundary-enforcer/       # Scripts that fail the build if rules are broken
```

## Transition Strategy from Current State
1. **Do not rewrite everything.**
2. Begin by moving shared types and utility functions out of specific apps into `/packages`.
3. Isolate the mathematical grading logic from the API routes into the `/domains/evaluation-engine`. Ensure it has ZERO dependencies on HTTP requests or database ORMs.
4. Set up `governance-tools` to map the current state before further decoupling.
