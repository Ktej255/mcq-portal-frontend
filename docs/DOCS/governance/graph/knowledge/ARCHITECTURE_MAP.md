# ARCHITECTURE MAP

```mermaid
graph TD
    subgraph Frontend
        Dashboard[dashboard/page.tsx]
        Simulation[simulation/lobby/page.tsx]
        Workspace[DailyWorkspace.tsx]
        Services[frontend/src/services/]
    end

    subgraph API_Layer
        AuthAPI[api/v1/auth.py]
        TestsAPI[api/v1/tests.py]
        ReportsAPI[api/v1/reports.py]
        SimAPI[api/v1/simulation.py]
    end

    subgraph Service_Layer
        Scoring[ScoringEngine]
        ReportSvc[ReportService]
        SimSvc[SimulationService]
        Cognition[CognitionEngine]
    end

    subgraph Core_Data
        Models[models/domain.py]
        DB[db/session.py]
    end

    %% Dependencies
    Dashboard --> Services
    Workspace --> Services
    Services --> AuthAPI
    Services --> ReportsAPI
    
    AuthAPI --> Models
    ReportsAPI --> ReportSvc
    ReportSvc --> Scoring
    Scoring --> Models
    SimAPI --> Models
    
    %% Governance Boundaries
    classDef boundary stroke:#f00,stroke-width:4px;
    class Models,Scoring boundary;
```

## LAYER DEFINITIONS

1.  **Core Data (L0)**: The frozen foundation. `models/domain.py`. Any mutation here has a global blast radius.
2.  **Service Layer (L1)**: Business logic and mathematical truth. `ScoringEngine` is the anchor.
3.  **API Layer (L2)**: RESTful entry points. Translates external requests into service calls.
4.  **Interface Layer (L3)**: The student-facing experience. Governed by the "Calm Student UX" philosophy.

## BLAST RADIUS ANALYSIS
*   **L0 Change**: Impacts ~110 files. Requires full system regression test.
*   **L1 Change**: Impacts all related APIs and Frontend reports.
*   **L2 Change**: Impacts specific frontend features.
*   **L3 Change**: Localized impact unless modifying shared components.
