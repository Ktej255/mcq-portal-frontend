const { runCloseoutLesson } = require("./geography-revision-closeout-lesson-e2e-helper.cjs");

runCloseoutLesson({
  day: 29,
  title: "Final Mock and Review",
  fileSlug: "geography-day29-final-mock-review-lesson",
  visualTestId: "day29-final-mock-review-visual",
  stagePrefix: "day29-final-mock-review-stage",
  initialStage: "score",
  clickStages: ["classify", "map", "queue", "confidence"],
  initialProof: "Score check: the number is not the diagnosis.",
  recapProof: "Recall chain: score -> classify -> repair -> prioritize -> retest.",
  labMode: "mcq-engine",
  labTitle: "MCQ Engine",
  reflection: "Mock score, error category, map repair, 24-hour queue, and confidence control are connected.",
}).catch((error) => { console.error(error); process.exit(1); });
