import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const checks = [
  {
    file: "src/lib/upsc/geographyDay29PortalLesson.ts",
    patterns: [
      'title: "Final Mock and Review"',
      'id: "score"',
      'id: "classify"',
      'id: "map"',
      'id: "queue"',
      'id: "confidence"',
      "Score check: the number is not the diagnosis.",
      "Recall chain: score -> classify -> repair -> prioritize -> retest.",
    ],
  },
  {
    file: "src/components/upsc/GeographyRevisionCloseoutVisual.tsx",
    patterns: [
      'testId: "day29-final-mock-review-visual"',
      'stageTestIdPrefix: "day29-final-mock-review-stage"',
      'banner: "FINAL MOCK REVIEW"',
      "data-active-stage={activeStage.id}",
      "data-testid={`${config.stageTestIdPrefix}-${stage.id}`}",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      "GeographyDay29FinalMockReviewVisual,",
      "activeSession.day === 29 ? <GeographyDay29FinalMockReviewVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentyNineFinalMockReview = activeSession.day === 29 && labSlug === "mcq-engine";',
      "isDayTwentyNineFinalMockReview && <GeographyDay29FinalMockReviewVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 29) return geographyDay29PortalLesson.scenes;",
      "Start with ${geographyDay29PortalLesson.title}: treat the mock score as a signal, not the diagnosis.",
    ],
  },
];

const results = checks.flatMap((check) => check.patterns.map((pattern) => ({ file: check.file, pattern, passed: read(check.file).includes(pattern) })));
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ checks: results.length, failed, passed: failed.length === 0 }, null, 2));
if (failed.length) process.exit(1);
