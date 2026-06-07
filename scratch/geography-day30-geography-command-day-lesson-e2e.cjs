const { runCloseoutLesson } = require("./geography-revision-closeout-lesson-e2e-helper.cjs");

runCloseoutLesson({
  day: 30,
  title: "Geography Command Day",
  fileSlug: "geography-day30-geography-command-day-lesson",
  visualTestId: "day30-geography-command-day-visual",
  stagePrefix: "day30-geography-command-day-stage",
  initialStage: "recall",
  clickStages: ["map", "proof", "revision", "verdict"],
  initialProof: "Command check: explain the subject, do not merely recognize it.",
  recapProof: "Recall chain: explain -> locate -> prove -> schedule -> decide.",
  labMode: "india-map",
  labTitle: "India Interactive Map",
  reflection: "Full recall, map confidence, learning proof, revision lock, and honest command verdict are connected.",
}).catch((error) => { console.error(error); process.exit(1); });
