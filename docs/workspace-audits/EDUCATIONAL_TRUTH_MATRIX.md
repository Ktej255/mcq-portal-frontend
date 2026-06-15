# Educational Truth Matrix

Date: 2026-05-18

Marking scheme:

- Correct: `+2.0`
- Incorrect: `-0.66`
- Skipped: `0`

Accuracy formula observed:

- `correct / attempted * 100`
- Attempted = `correct + incorrect`

## Controlled Attempts

| Test | Attempt | Total | Correct | Incorrect | Skipped | Sum Reconciles | Score | Accuracy | Negative Marks | DB Truth |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | --- |
| A | 22 | 5 | 5 | 0 | 0 | yes | 10.0 | 100.0 | 0.0 | VERIFIED |
| B | 23 | 10 | 5 | 0 | 5 | yes | 10.0 | 100.0 | 0.0 | VERIFIED |
| C | 24 | 5 | 2 | 3 | 0 | yes | 2.02 | 40.0 | 1.98 | VERIFIED |
| D | 25 | 5 | 5 | 0 | 0 | yes | 10.0 | 100.0 | 0.0 | VERIFIED |
| E | 26 | 5 | 4 | 1 | 0 | yes | 7.34 | 80.0 | 0.66 | VERIFIED |

## Formula Checks

Attempt 22:

- `5 + 0 + 0 = 5`
- Score: `(5 * 2.0) - (0 * 0.66) = 10.0`
- Accuracy: `5 / 5 * 100 = 100.0`

Attempt 23:

- `5 + 0 + 5 = 10`
- Score: `(5 * 2.0) - (0 * 0.66) = 10.0`
- Accuracy: `5 / 5 * 100 = 100.0`

Attempt 24:

- `2 + 3 + 0 = 5`
- Score: `(2 * 2.0) - (3 * 0.66) = 2.02`
- Accuracy: `2 / 5 * 100 = 40.0`

Attempt 25:

- `5 + 0 + 0 = 5`
- Score: `(5 * 2.0) - (0 * 0.66) = 10.0`
- Accuracy: `5 / 5 * 100 = 100.0`

Attempt 26:

- `4 + 1 + 0 = 5`
- Score: `(4 * 2.0) - (1 * 0.66) = 7.34`
- Accuracy: `4 / 5 * 100 = 80.0`

## Educational Truth Lock Status

Report math reconciled for controlled local attempts.

Release is still blocked because report first-render can lag async truth/reliability updates, frontend lint fails, Firebase env is missing, and production backend is unavailable.
