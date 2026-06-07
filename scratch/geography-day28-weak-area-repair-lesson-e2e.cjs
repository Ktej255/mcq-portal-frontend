const { runCloseoutLesson } = require("./geography-revision-closeout-lesson-e2e-helper.cjs");

runCloseoutLesson({
  day: 28,
  title: "Weak Area Repair",
  fileSlug: "geography-day28-weak-area-repair-lesson",
  visualTestId: "day28-weak-area-repair-visual",
  stagePrefix: "day28-weak-area-repair-stage",
  initialStage: "classify",
  clickStages: ["root", "repair", "retest", "schedule"],
  initialProof: "First question: what kind of mistake actually happened?",
  recapProof: "Recall chain: classify -> root cause -> repair -> retest -> schedule.",
  labMode: "mcq-engine",
  labTitle: "MCQ Engine",
  reflection: "Mistake classification, root cause, repair card, fresh retest, and revision scheduling are connected.",
}).catch((error) => { console.error(error); process.exit(1); });
