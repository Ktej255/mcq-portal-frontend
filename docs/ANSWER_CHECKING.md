# Answer checking in production

Handwritten and typed answers are read (OCR) and graded by Gemini. Without the
settings below the backend uses a built-in **mock** that returns fake text and
fake scores. Mocks are off by default: the answer endpoints return
`503 "Answer checking is not set up yet"` and the GS answer screen says so.

## Turn real checking on

| Variable | Value | Notes |
| --- | --- | --- |
| `GOOGLE_API_KEY` | Gemini API key | **Secret.** Put it in Secrets Manager (the task definition already maps it). `GEMINI_API_KEY` is read as a fallback. |
| `OPTIONAL_OCR_PROVIDER` | `gemini-vision` | Reads handwriting. |
| `EVALUATION_PROVIDER` | `gemini` | GS answer evaluation. |
| `OPTIONAL_EVAL_PROVIDER` | `gemini` | Optional-subject answer evaluation. |
| `GEMINI_MODEL_ID` | `gemini-2.5-flash` (default) | Change here when Google retires a model. |
| `GEMINI_TIMEOUT_SECONDS` | `60` (default) | Per-request timeout. |
| `MEDIA_STORE_BACKEND` | `s3` | Where answer images are kept. |
| `MEDIA_STORE_S3_BUCKET` | bucket name | Private bucket; the task role needs get/put/delete on it. |
| `AWS_REGION` | `ap-south-1` | |
| `ANSWER_IMAGE_RETENTION_DAYS` | `180` (default) | See "Image retention". |
| `ALLOW_MOCK_AI` | `false` (default) | Only set `true` for local dev, tests and e2e. |

The non-secret values are in `backend/deploy/aws/task-definition.example.json`.

A Gemini provider with no API key is also treated as "not set up" (503), not as
a silent failure. `GET /api/v1/gs-lms/{subject}/answers/capabilities` reports
`ocr_live` / `evaluation_live` without calling any model.

## What students see

- A page whose handwriting could not be read is still saved. The upload
  response has `ocr_status: "failed"` and `retry_possible: true`; the student
  retries (`POST .../answers/{id}/pages/{n}/retry-ocr`) or types that page's
  text. Submitting is refused with 409 until no page is in the failed state.
- Grading sends up to 8 pages, in order, to the model.

## Image retention

Students can delete their own page images
(`DELETE .../answers/{id}/pages`). The extracted text and the report are kept.

Images older than `ANSWER_IMAGE_RETENTION_DAYS` are removed by a command that
should run daily (for example as an ECS scheduled task using the backend
image):

```
python -m app.core.gs_lms.answer_retention --dry-run   # count only
python -m app.core.gs_lms.answer_retention             # delete
```

## Database

Run `alembic upgrade head` (revision `m0a1b2c3d4e5` adds per-page OCR columns
and `deleted_at` to `gs_lms_answer_sheet_images`).
