# Handwriting trend (wellbeing)

An opt-in, student-only signal. When a student turns it on, each handwritten
answer page they upload is measured with simple image rules. If their last few
pages look different from their own usual handwriting, the Wellbeing page says so
gently. It is not a diagnosis and says nothing about personality.

## What is measured

Per page (numpy + Pillow, no AI, deterministic; `app/core/wellbeing/handwriting_features.py`,
`ALGORITHM_VERSION = "hw-v1"`):

| Feature | Meaning | Unit |
| --- | --- | --- |
| `slant_deg` | Dominant writing slant from vertical (+ = leaning right). Each text line is sheared -45..45 degrees; the angle with the sharpest column profile wins. | degrees |
| `letter_height_rel` | Median text-line height / page width. Comparable between photos of the same paper framed similarly; the one feature a very different framing can move. | ratio |
| `line_spacing_rel` | Median distance between line centres / median line height. | ratio |
| `baseline_slope_deg` | Mean absolute slope of each line's bottom edge (descenders trimmed). | degrees |
| `baseline_wobble` | Median spread of the bottom edge around its straight fit / line height. | ratio |
| `stroke_width_rel` | Median horizontal ink run (up to one line height) / line height. Called "stroke thickness", never "pressure". | ratio |
| `word_gap_rel` | Median gap between ink runs of at least 0.25 line heights / line height. | ratio |
| `ink_density`, `lines_detected` | Stored, not used in trends (pen and paper dependent). | |

Pipeline: EXIF-transpose, grayscale, downscale to 1600 px, even out lighting,
Otsu threshold, drop specks, find lines from the row-ink profile (smoothed,
30% of the 90th percentile). Margins (2%) are cropped.

Quality is 1.0 minus penalties; a sample under `0.6` is stored but not used.
Penalised: image shorter side < 400 px, fewer than 3 lines, too little (<0.3%) or
too much (>35%) ink, contrast < 0.25, Laplacian variance < 30 (blurry).
Non-images raise `HandwritingImageError`; other odd pixels give quality 0.

## How the trend works

`app/core/wellbeing/handwriting_trend.py` (pure functions):

1. Use usable samples of the current algorithm version, oldest first.
2. Baseline = the earliest samples until there are at least 5 spanning at least 7 days.
   Until then: `not_enough_data`, with how many more pages and days are needed.
3. Need at least 3 samples after the baseline. Recent window = the last 5 of them.
4. Per feature: `z = (median_recent - median_baseline) / spread`, where
   `spread = max(1.4826 * MAD_baseline, per-feature minimum, 5% of the baseline median)`.
5. A feature changed if `|z| >= 2.5` and at least 3 recent pages individually moved
   the same way by `|z| >= 2.0`.
6. Status is `changed` only if at least 2 features changed; otherwise `steady`.
   One odd page or one odd feature never triggers it.

Per-feature minimum spreads: slant 2.0 deg, letter height 0.004, line spacing 0.15,
line tilt 0.5 deg, wobble 0.03, stroke thickness 0.03, word gap 0.1.

## Privacy

* Opt-in, off by default. Consent lives in `gs_wellbeing_consents` (not on the
  learner profile, because `PUT /gs-lms/profile` replaces the whole profile).
* Only numbers are kept in `gs_wellbeing_handwriting_samples`: no image, no text.
  They stay after the image is deleted (retention or student request).
* Only the signed-in student can read, turn off or delete their data. There is no
  admin or staff view and nothing is aggregated across students.
* Turning it off deletes all the student's samples. "Delete my handwriting data"
  deletes them and keeps the consent.
* Logs carry exception types and counts only.

## API (no paywall, sign-in only)

* `GET /api/v1/gs-lms/wellbeing/handwriting`
* `PUT /api/v1/gs-lms/wellbeing/handwriting/consent` `{ "consent": true|false }`
  (turning on measures at most the 20 newest stored images, within about 10 seconds)
* `DELETE /api/v1/gs-lms/wellbeing/handwriting/data`

Samples are created in `POST /answers/{id}/pages` after the page is saved, in a
threadpool, with every failure swallowed; a retake of a page replaces its sample.

## Limitations

Different pens, paper, lighting, camera angles, tilted photos, page content and
answer length move the numbers. "Usual" is the first weeks of pages and does not
update. Lines that touch or run diagonally can merge into one band. This is not a
medical or psychological test.

## Backfill

For students who opted in, measure stored images that have no sample for the
current algorithm version (for example after bumping `ALGORITHM_VERSION`):

```
cd backend
python -m app.core.wellbeing.backfill [--user-id N] [--dry-run]
```

Prints counts only. Images already deleted by retention cannot be measured.
