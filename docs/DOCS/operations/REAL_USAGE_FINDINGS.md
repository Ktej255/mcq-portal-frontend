# REAL STUDENT USAGE FINDINGS
# Phase 9 — Priority 10
# MCQ Intelligence Portal — Evidence-Based Optimization Log

---

## GOVERNANCE RULE

**Do NOT optimize based on assumptions.**

Every entry in this file must be:
- Observed in real session data (friction tracker, event logs, or direct feedback)
- Attributed to a specific data source
- Tied to a specific action or hypothesis

Speculation is NOT allowed here.

---

## FORMAT

```
### FINDING-XXX
**Date Observed**: YYYY-MM-DD
**Source**: [friction_tracker / event_log / direct_feedback / session_replay]
**Observation**: What was actually seen
**Evidence**: Specific data points (counts, percentages, timestamps)
**Hypothesis**: What this might mean
**Action Taken**: What was changed (or: MONITORING — no action yet)
**Result**: Outcome after action (or: PENDING)
```

---

## ACTIVE FINDINGS

*(No findings yet — system is in pre-launch observation mode)*

---

## MONITORING TARGETS

The following behavioral signals are being actively tracked via `useFrictionTracker`:

| Signal | Tracking Method | Priority |
|---|---|---|
| Rage clicks on report sections | FrictionTracker `rage_click` events | HIGH |
| Tab abandonment during report reading | FrictionTracker `tab_visibility` events | HIGH |
| Most-revisited report sections | FrictionTracker scroll position events | MEDIUM |
| Questions with highest revision rate | `AttemptAnswer.is_changed` field | HIGH |
| Questions with longest time spent | `ExamEvent.payload.time_seconds` | MEDIUM |
| Exam sessions abandoned mid-way | `Attempt.status = IN_PROGRESS` with no submit | CRITICAL |
| Mobile-specific drop-off patterns | `ExamEvent` + user-agent analysis | HIGH |
| Report sections never scrolled to | Intersection Observer (future) | LOW |

---

## NEXT OBSERVATION CYCLE

**Target**: First 10 real student attempts after institutional launch.

Collect:
1. Export ExamEvent logs for all 10 attempts
2. Run `AttemptReconciliationEngine` on each — note any FORENSIC_DIVERGENCE
3. Check FrictionTracker events in browser console (route to SystemEvent in v2)
4. Interview 2–3 students: "Where did you feel confused or frustrated?"
5. Update this document with real findings

---

*Last updated: 2026-05-13*
*Owner: Founder Review — updated after each observation cycle*
