# Final Student Journey Validation

Date: 2026-05-18

Environment:

- Frontend: `http://127.0.0.1:3001`
- Backend: `http://127.0.0.1:8000`
- Auth: `MOCK_TOKEN`
- DB: `backend/production.db`

## Browser Journey Evidence

Attempt: `39`

Steps completed:

- Login -> `/dashboard`
- Tests -> `/tests`
- Re-attempt -> `/exam/1?attemptId=39`
- Answered Q1-Q5: `A, B, C, D, A`
- Refresh during exam -> resumed same attempt
- Submit final test
- Report processing screen shown first
- Final report rendered after processing
- History contained attempt `39`
- Revision route rendered
- Mobile report rendered at `390x844`
- Export generated `mcq-report-attempt-39.txt`

Browser captured events:

- `[]`

## Report Truth Evidence

First report state:

- Processing screen: `Generating Forensic Intelligence Report`
- No partial report rendered first.

Final report state:

- `TRUTH VERIFIED`
- Reliability shown.
- No `PENDING VERIFICATION` visible.

## API Evidence

`GET /api/v1/reports/39`:

- `truth_status = VERIFIED`
- `processing_status = COMPLETED`
- `reliability_score = 57.0`
- `correctCount = 1`
- `incorrectCount = 4`
- `unattemptedCount = 45`
- `accuracy = 20.0`
- `totalScore = -0.64`

## DB Evidence

`attempts`:

- `id = 39`
- `status = SUBMITTED`
- `test_id = 1`

`attempt_answers`:

- Q1 selected `A`, correct `1`
- Q2 selected `B`, correct `0`
- Q3 selected `C`, correct `0`
- Q4 selected `D`, correct `0`
- Q5 selected `A`, correct `0`

`reports`:

- `attempt_id = 39`
- `total_score = -0.64`
- `accuracy = 20.0`
- `correct_count = 1`
- `incorrect_count = 4`
- `unattempted_count = 45`
- `truth_status = VERIFIED`
- `processing_status = COMPLETED`
- `reliability_score = 57.0`

## Math Reconciliation

- Correct + Incorrect + Skipped = `1 + 4 + 45 = 50`
- Accuracy = `1 / 5 answered = 20.0%`
- Score = `1*2 - 4*0.66 = -0.64`

## Remaining Blockers

- Full lint gate still has `32 errors`, `37 warnings`.
- Production deployment remains unverified.
