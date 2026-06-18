# Optional Answer Evaluation Engine — Method & Parameters

Applies to the Geography optional answer workspace (`GeographyAnswerWorkspace`).
Engine: `src/lib/upsc/optionalEvaluation.ts`.

## 1. Method selected (and why)
- **Now:** a **deterministic, content-aware heuristic** that actually reads the
  student's text and scores it against the *question*. It is honest: a 1-line or
  off-topic answer scores low **with specific reasons**, a structured relevant
  answer scores higher. No more fixed 5/10.
- **Later (swap-in):** the function `evaluateAnswer()` returns a typed
  `EvaluationResult`. A real LLM (Gemini) call can replace the internal
  `scoreAnswer` step behind the **same interface** — UI does not change.

## 2. Pipeline (what happens on Evaluate)
1. **Tokenise** the answer and the question; drop stop-words + directive words.
2. **Relevance** = % of the question's content keywords that appear in the answer
   (this is what proves the answer matches the demand).
3. **Signal detection** on the answer text:
   - structure (intro/body/conclusion present + balance),
   - diagram/map keyword, example/case keyword, scholar/model/theory keyword,
   - recency/current-affairs keyword, redundancy (filler phrases).
4. **Verdict gates** (credibility):
   - `< 15 words` -> "Not a valid attempt".
   - `relevance < 15%` -> "Off-topic".
   - `relevance < 35%` or very short -> "Weak attempt".
   - else "On track" / "Strong".
5. **Parameter scoring** — each parameter of the chosen depth is scored 0-10 from
   the relevant signal, with a **specific feedback line** (e.g. word count vs
   expected, missing diagram, low question-coverage).
6. **Overall** (0-100) + **marks band** + matched / missing question keywords.


## 3. Parameter catalogue (the 5 / 11 / 20 / 35 depths)
Depth = number of parameters the answer is checked on. Each level is a superset.

- **Easy (5):** intro-body-conclusion structure, keyword coverage, directive
  compliance, word-limit adherence, legibility.
- **Medium (11):** Easy + concept accuracy, examples/case studies, diagram
  presence, syllabus linkage, balance of view, redundant-word detection.
- **Tough (20):** Medium + scholar/model citation, inter-linkage of dimensions,
  map accuracy, data & facts recency, flow & coherence, marks-per-segment.
- **UPSC-like (35):** Tough + examiner empathy/lift-value, value-addition /
  way-forward, answer-to-demand precision, diagram quality & labelling,
  time-pressure realism, predicted score band.

## 4. Diagrams & flowcharts
- **Now (text):** detects whether a diagram/map/flow-chart is *referenced* and
  whether the body integrates it — rewards presence, flags absence.
- **Later (vision):** an image/vision model will score the *uploaded* diagram on
  labelling, accuracy, relevance to the answer, and neatness. Flowcharts checked
  for logical sequence (nodes/arrows) and correctness of the cause-effect chain.

## 5. Uploaded handwritten copies (OCR)
- Upload accepts image/PDF. **OCR** (backend) digitises the handwriting, then the
  **same engine** scores the digitised text; **copy-marking** overlays
  underline / encircle / highlight on the regions that fall short (generic,
  factual gap, missing diagram, weak conclusion).
- Until OCR is wired, the upload path is honest: it shows "OCR pending" rather
  than faking a score. Typed answers get the full real evaluation today.

## 6. Topper comparison (planned)
- A 3-way view: **Your answer vs UPSC demand vs Topper approach**.
- Topper copies, where publicly published by institutions, are ingested and the
  engine highlights structural / content deltas (what the topper added that you
  missed). Sourcing + attribution handled in a later batch.

## 7. AI (Gemini) integration point
- `evaluateAnswer()` is the single seam. The backend route will call the model
  with: the question, the answer (typed or OCR text), the chosen parameter set,
  and a UPSC rubric; it returns the same `EvaluationResult` shape. The discussion
  popup then lets the student converse with the model about the report.
