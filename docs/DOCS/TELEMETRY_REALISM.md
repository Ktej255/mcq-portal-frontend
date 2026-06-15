# Phase 9 Telemetry Realism and Behavioral Continuity

This document defines the continuity layer that turns event logging into high-fidelity behavioral telemetry.

## 1. Heartbeat Architecture

Frontend emits `HEARTBEAT` every 25 seconds while an attempt is active.

Properties:

- batched through the existing event buffer
- never blocks autosave or rendering
- includes `session_id`, monotonic `sequence`, client elapsed time, online state, focus state, idle state
- emits lifecycle markers: `START`, `RESUME`, `RECONNECT`, `OFFLINE`, `STOP`
- flushes through the same low-overhead 30 second batch interval

The heartbeat is continuity evidence, not a grading signal.

## 2. Focus Telemetry Flow

Focus telemetry emits `FOCUS_STATE_CHANGED`.

Inputs:

- `document.visibilitychange`
- `window.focus`
- `window.blur`
- `fullscreenchange`

Noise reconciliation:

- duplicate identical focus states within one second are suppressed
- fullscreen exits also emit `FULLSCREEN_EXIT`
- focus state is stored in heartbeat payload for reconciliation

## 3. Idle Detection Logic

Idle telemetry emits `IDLE_STATE_CHANGED`.

Rules:

- user interaction events reset active state
- idle threshold is 60 seconds
- polling interval is 5 seconds
- transition back to active emits `ACTIVE`
- repeated idle events are suppressed

Interactions tracked:

- pointer
- keyboard
- mouse movement
- touch
- scroll

## 4. Attempt Reconstruction Engine

Backend service: `telemetry_reconstruction.py`.

It reconstructs:

- question sequence
- answer evolution
- review behavior
- focus interruptions
- idle windows
- pacing shifts
- continuity gaps
- temporal anomalies

This engine is deterministic and versioned through `inference-reliability.v1`.

## 5. Temporal Reconciliation Rules

Detected issues:

- event gaps greater than 75 seconds
- negative ordering
- missing heartbeat density
- open-ended blur windows
- open-ended idle windows
- sparse event stream relative to question count

Client timing remains treated as partially trusted. Reconciled quality scores determine how much future behavioral inference should trust timing-derived claims.

## 6. Telemetry Quality Scoring

Metrics:

- `heartbeat_density`
- `continuity_score`
- `focus_reliability`
- `idle_reliability`
- `event_sparsity`
- `temporal_coherence`

These feed behavioral data quality and signal confidence.

## 7. Session Recovery Continuity

Session continuity uses `sessionStorage`.

Recovery markers:

- first telemetry start: `START`
- reload or same-tab resume: `RESUME`
- network recovery: `RECONNECT`
- offline transition: `OFFLINE`
- exam stop/unmount: `STOP`

Gaps are preserved, not hidden. Fragmented telemetry lowers reliability rather than being silently smoothed.

## 8. Storage and Retention Strategy

Short term:

- preserve raw `exam_events`
- compute reconstruction on demand
- use report metadata for snapshots

Scale strategy:

- retain raw hot events for 90 days
- store per-attempt telemetry snapshot after submission
- archive compressed raw events after hot retention
- keep aggregate reliability metrics indefinitely
- version every snapshot by metric version

## 9. Observability

Pipeline observability now includes:

- recent event count
- heartbeat density
- continuity score
- focus reliability
- idle reliability
- temporal coherence

Future production alerts should trigger on:

- low heartbeat density
- high continuity gap rate
- reconstruction failures
- high temporal anomaly rate
- sudden telemetry loss after deploy

## 10. Performance Safety

Telemetry must never degrade exam UX.

Rules:

- no synchronous network calls from interaction handlers
- all telemetry is buffered and batched
- heartbeat interval stays battery-safe
- event dedupe suppresses browser focus noise
- telemetry failure requeues events but does not block answers
- autosave and submit remain higher priority than telemetry

## 11. Remaining Telemetry Risks

- no server ingestion timestamp column yet, so ingestion lag is approximate
- heartbeat can still pause in throttled background tabs
- session continuity is tab-scoped, not device-scoped
- raw event retention/archival is documented but not automated
- no persisted telemetry snapshot table yet
