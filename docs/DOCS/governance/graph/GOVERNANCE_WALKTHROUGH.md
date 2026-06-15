# Walkthrough: Graphify Architectural Governance

This guide explains how to use the **Graphify-based Architectural Governance** system to prevent unsafe code mutations and maintain systemic integrity.

## 1. The Cognition Layer
All architectural knowledge is consolidated in `/docs/governance/graph/`.
- **`graph.json`**: The machine-readable dependency map.
- **`graph.html`**: The interactive visual explorer.
- **`SYSTEM_STATE.md`**: The current high-level architectural state and governance rules.

## 2. Mandatory Pre-Edit Audit
Before making any changes to the codebase, you **must** run the governance audit script.

### Command:
```bash
python backend/scripts/governance/graphify_audit.py <file1> <file2> ...
```

### What it checks:
1. **L0 Boundary Protection**: Blocks any mutation to core files (e.g., `domain.py`) unless a systemic override is documented.
2. **Blast Radius Analysis**: Calculates how many files depend on your changes.
3. **Safety Threshold**: If more than **20 files** are impacted, the audit will block the mutation to prevent architectural instability.

## 3. Visual Impact Analysis
If you are unsure about the dependencies of a file, open `docs/governance/graph/graph.html` in a browser.
- Search for your file node.
- Use the "Neighbors" view to see immediate dependencies.
- Use the "Paths" view to find circular dependencies or deep chains.

## 4. Governance Logs
Every successful mutation batch should be recorded in `/docs/governance/graph/mutations/` with:
- The `graphify_audit.py` output.
- The intended architectural shift.
- The roll-back plan.

---

**Institutional Mandate**: No AI agent or developer should modify production logic without first consulting the Graphify Knowledge Graph.
