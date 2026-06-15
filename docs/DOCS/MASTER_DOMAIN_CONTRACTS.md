# MCQ Portal Master Domain Contracts

Status: Phase 7 canonical contract source of truth.

This document defines the semantic contracts for IDs, events, analytics, reports, and persistence. No dashboard, AI narrative, or downstream analytics code should infer meanings outside this document.

## 1. Canonical IDs

### Option Identity

Canonical option IDs are uppercase option keys: `A` through `Z`.

UI-only option IDs may include question context for DOM/radio uniqueness, such as `1_opt_B`. These are never persisted and never used for scoring. Every inbound answer or event payload is normalized to `B` before persistence.

Normalization flow:

```text
Question serializer
  -> UI option id: <question_id>_opt_<option_key>
  -> frontend save/event contract normalizeOptionId()
  -> API payload selected_option / payload.option_id: <option_key>
  -> backend SaveAnswerRequest / ExamEventRequest validation
  -> database attempt_answers.selected_option / exam_events.payload.option_id: <option_key>
  -> report scoring compares selected_option == questions.correct_option
```

Validation rules:

- `questions.correct_option` must be one of the keys in `questions.options_en`.
- `attempt_answers.selected_option` must be null or a canonical option key.
- event `ANSWER_CHANGED.payload.option_id` must be a canonical option key.
- legacy UI IDs are accepted only at API edges and normalized immediately.

### Confidence Identity

Canonical confidence IDs:

- `BLIND_GUESS`
- `FIFTY_FIFTY`
- `EDUCATED_GUESS`
- `FAIRLY_SURE`
- `HUNDRED_PERCENT`

Legacy aliases `50_50` and `100_SURE` are accepted at API edges and normalized.

## 2. Event Schema

All exam events are append-only observations for an attempt session. Timestamps are client event time in ISO-8601 UTC or timezone-aware datetime. Missing timestamps are filled by the backend ingestion time. Future timestamps beyond five minutes of server time are rejected.

| Event | Required fields | Payload | Ordering semantics | Deduplication |
| --- | --- | --- | --- | --- |
| `QUESTION_VIEWED` | `question_id`, `timestamp` | optional | Must occur before answer/confidence/review actions for that question within a batch. | Repeated views are allowed. |
| `ANSWER_CHANGED` | `question_id`, `timestamp` | `option_id`; optional `old_id` | Requires prior question view in the batch when present. | Repeated identical option changes may be compressed later, but raw ingestion preserves events. |
| `CONFIDENCE_SELECTED` | `question_id`, `timestamp` | `level` | Requires prior question view in the batch when present. | Last confidence is authoritative for answer state; events remain append-only. |
| `REVIEW_MARKED` | `question_id`, `timestamp` | boolean `status` | Requires prior question view in the batch when present. | Last review state is authoritative for answer state; events remain append-only. |
| `TAB_SWITCH` | `timestamp` | optional `violation` | Attempt-level integrity event. | Repeated events are allowed for integrity counts. |
| `FULLSCREEN_EXIT` | `timestamp` | optional `violation` | Attempt-level integrity event. | Repeated events are allowed for integrity counts. |
| `SUBMIT_CLICKED` | `timestamp` | optional | Must be flushed before or with final submit when possible. | Duplicate submit clicks should be ignored by submit endpoint idempotency. |
| `HEARTBEAT` | `timestamp` | optional `client_elapsed_seconds` | Attempt-level timing continuity event. | Heartbeats may be aggregated for trust scoring. |
| `FOCUS_STATE_CHANGED` | `timestamp` | `state`: `FOCUSED` or `BLURRED` | Attempt-level focus continuity event. | Consecutive identical states may be compressed downstream. |
| `IDLE_STATE_CHANGED` | `timestamp` | `state`: `ACTIVE` or `IDLE` | Attempt-level idle-state event. | Consecutive identical states may be compressed downstream. |

Session semantics:

- Events belong to exactly one `attempt_id`.
- The authenticated user must own the attempt.
- Event ingestion returns count, first timestamp, last timestamp, event types, and audit summary.

## 3. Analytics Semantics

### Timing

`time_taken_seconds` is the absolute accumulated client-observed time for a question at the moment of autosave. It is not a delta. Repeated autosave requests replace the stored value and must not add to it.

Valid timing:

- non-negative integer
- per-question average must be less than six hours
- impossible timings are analytics anomalies

### Score

Score is deterministic:

```text
total_score = correct_count * test.correct_marks - incorrect_count * test.negative_marking_value
```

Unattempted questions do not add or subtract score.

### Accuracy

Accuracy is answer accuracy among attempted questions:

```text
accuracy = correct_count / (correct_count + incorrect_count) * 100
```

If no question was attempted, accuracy is `0`.

### Derived Metrics

These are formal metric definitions for future analytics. Until implemented as tested code, they must not be used as scientific claims.

- hesitation: high time on ultimately correct answers, thresholded against test/question distribution.
- confidence drift: change in confidence level across attempts for the same topic or question class.
- review dependency: share of correct answers that were marked for review before submission.
- impulsiveness: answer changes or submission actions occurring below a minimum time threshold.
- fatigue: degradation in accuracy or time efficiency across attempt order.

## 4. Report Contract

Attempt reports must include:

- `attemptId`
- `totalScore` and `total_score`
- `accuracy`
- `correctCount` and `correct_count`
- `incorrectCount` and `incorrect_count`
- `unattemptedCount` and `unattempted_count`
- `topicWiseAnalysis` and `topic_wise_analysis`
- `confidenceAnalytics`
- `confidence_analysis`
- `subjectScores`
- `averageTimePerQuestion` and `average_time_per_question`
- `generatedAt`

Frontend report rendering must validate numeric fields. Missing attempt report score is a contract failure and must not fall back silently to zero.

## 5. Persistence Rules

- `questions.correct_option`: canonical option key.
- `attempt_answers.selected_option`: canonical option key or null.
- `attempt_answers.time_taken_seconds`: absolute accumulated seconds.
- `attempt_answers.interaction_history`: optional raw answer-local interaction snapshots.
- `exam_events`: append-only event log.
- `reports`: deterministic scoring snapshot plus analytics metadata.

## 6. Runtime Validation

Validation exists at:

- frontend API contract helpers before outbound payloads
- Pydantic request schemas at backend API boundary
- event ingestion audit before persistence
- report anomaly detection before report persistence
- startup schema drift checks

## 7. Analytics Safety Rules

Reject or alert on:

- score/count contradictions
- outcome counts not summing to test question count
- accuracy outside `0..100`
- impossible timings
- unknown option or confidence IDs
- unknown event types
- event action for question with no question context

## 8. Remaining Semantic Risks

- Event ordering currently audits batches, not full historical attempt streams.
- Browser timing can still be manipulated by clients.
- Confidence drift, fatigue, impulsiveness, hesitation, and review dependency are defined but not yet fully implemented as longitudinal tested metrics.
- Production DB migration execution still needs deployment proof after applying Alembic head.
