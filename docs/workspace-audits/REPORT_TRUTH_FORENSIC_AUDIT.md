# Report Truth Forensic Audit

Date: 2026-05-18

Runtime target:

- Frontend: `http://127.0.0.1:3001`
- Backend: `http://127.0.0.1:8000`
- DB: local SQLite `backend/production.db`
- Auth: `MOCK_TOKEN_sim_*`

## Dependency Impact Map

`exam/[testId]/page.tsx`
-> `useExamStore`
-> `useAutoSave`
-> `examService.saveAnswers`
-> `PUT /api/v1/attempts/{attempt_id}/answers`
-> `test_engine_service.save_answer`
-> `attempt_answers`
-> `POST /api/v1/attempts/{attempt_id}/submit`
-> `report_service.generate_report`
-> `ScoringEngine.calculate_score`
-> `reports`
-> `GET /api/v1/reports/{attempt_id}`
-> `dashboardService.getReport`
-> `reports/page.tsx`

Submit contract:

- Final submit request has no answer body.
- Submitted answer truth is the latest successful answer `PUT` before `POST /submit`.

## Controlled Fixtures

- `Runtime Truth 5Q Control`, test id `49`, questions `459-463`
- `Runtime Truth 10Q Control`, test id `50`, questions `464-473`
- Marking: `correct_marks=2.0`, `negative_marking_value=0.66`

## TEST A: 5 Answered, 0 Skipped, 0 Marked

Attempt: `22`

Report API/DB:

- Correct: `5`
- Incorrect: `0`
- Skipped: `0`
- Score: `10.0`
- Accuracy: `100.0`
- Negative marks: `0.0`
- Truth status after pipeline: `VERIFIED`

Q1:
UI selected = A
autosave payload = A, A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q2:
UI selected = B
autosave payload = B, B
DB stored = B
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q3:
UI selected = C
autosave payload = C, C
DB stored = C
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q4:
UI selected = D
autosave payload = D, D
DB stored = D
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q5:
UI selected = A
autosave payload = A, A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

## TEST B: 5 Answered, 5 Skipped

Attempt: `23`

Report API/DB:

- Correct: `5`
- Incorrect: `0`
- Skipped: `5`
- Score: `10.0`
- Accuracy: `100.0`
- Negative marks: `0.0`
- Truth status after pipeline: `VERIFIED`

Q1:
UI selected = A
autosave payload = A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q2:
UI selected = B
autosave payload = B
DB stored = B
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q3:
UI selected = C
autosave payload = C
DB stored = C
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q4:
UI selected = D
autosave payload = D
DB stored = D
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q5:
UI selected = A
autosave payload = A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q6:
UI selected = null
autosave payload = none
DB stored = no `attempt_answers` row
submit payload = no body
scoring engine evaluated = SKIPPED
report rendered = SKIPPED
skipped calculation = skipped because no persisted answer exists

Q7:
UI selected = null
autosave payload = none
DB stored = no `attempt_answers` row
submit payload = no body
scoring engine evaluated = SKIPPED
report rendered = SKIPPED
skipped calculation = skipped because no persisted answer exists

Q8:
UI selected = null
autosave payload = none
DB stored = no `attempt_answers` row
submit payload = no body
scoring engine evaluated = SKIPPED
report rendered = SKIPPED
skipped calculation = skipped because no persisted answer exists

Q9:
UI selected = null
autosave payload = none
DB stored = no `attempt_answers` row
submit payload = no body
scoring engine evaluated = SKIPPED
report rendered = SKIPPED
skipped calculation = skipped because no persisted answer exists

Q10:
UI selected = null
autosave payload = none
DB stored = no `attempt_answers` row
submit payload = no body
scoring engine evaluated = SKIPPED
report rendered = SKIPPED
skipped calculation = skipped because no persisted answer exists

## TEST C: 2 Correct, 3 Incorrect

Attempt: `24`

Report API/DB:

- Correct: `2`
- Incorrect: `3`
- Skipped: `0`
- Score: `2.02`
- Accuracy: `40.0`
- Negative marks: `1.98`
- Truth status after pipeline: `VERIFIED`

Q1:
UI selected = A
autosave payload = A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q2:
UI selected = B
autosave payload = B
DB stored = B
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q3:
UI selected = A
autosave payload = A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = INCORRECT
report rendered = INCORRECT
skipped calculation = not skipped

Q4:
UI selected = A
autosave payload = A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = INCORRECT
report rendered = INCORRECT
skipped calculation = not skipped

Q5:
UI selected = B
autosave payload = B
DB stored = B
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = INCORRECT
report rendered = INCORRECT
skipped calculation = not skipped

## TEST D: Answer, Refresh, Resume, Submit

Attempt: `25`

Report API/DB:

- Correct: `5`
- Incorrect: `0`
- Skipped: `0`
- Score: `10.0`
- Accuracy: `100.0`
- Negative marks: `0.0`
- Truth status after pipeline: `VERIFIED`

Q1:
UI selected = A before refresh
autosave payload = A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q2:
UI selected = B before refresh
autosave payload = B
DB stored = B
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q3:
UI selected = C after resume
autosave payload = C
DB stored = C
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q4:
UI selected = D after resume
autosave payload = D
DB stored = D
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q5:
UI selected = A after resume
autosave payload = A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

## TEST E: Change Answer Multiple Times Before Submit

Attempt: `26`

Report API/DB:

- Correct: `4`
- Incorrect: `1`
- Skipped: `0`
- Score: `7.34`
- Accuracy: `80.0`
- Negative marks: `0.66`
- Truth status after pipeline: `VERIFIED`

Q1:
UI selected = B -> C -> A -> D
autosave payload = D, D
DB stored = D
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = INCORRECT
report rendered = INCORRECT
skipped calculation = not skipped

Q2:
UI selected = B
autosave payload = B, B
DB stored = B
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q3:
UI selected = C
autosave payload = C, C
DB stored = C
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q4:
UI selected = D
autosave payload = D, D
DB stored = D
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

Q5:
UI selected = A
autosave payload = A, A
DB stored = A
submit payload = no body; answer supplied by pre-submit PUT
scoring engine evaluated = CORRECT
report rendered = CORRECT
skipped calculation = not skipped

## Blocking Runtime Mismatch

During the browser-controlled attempt immediately after submit, rendered report text showed `PENDING VERIFICATION` and `0% RELIABILITY` while the later report API and DB state for the same attempts showed `truth_status=VERIFIED` and nonzero reliability.

Evidence after direct report load for attempt `22`:

- Browser body: `TRUTH VERIFIED`, `FINAL SCORE 10.00`, `77% RELIABILITY`
- Error overlay: `false`
- Console errors still present for missing Firebase env and static 404.
