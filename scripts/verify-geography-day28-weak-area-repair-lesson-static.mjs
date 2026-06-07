import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const checks = [
  {
    file: "src/lib/upsc/geographyDay28PortalLesson.ts",
    patterns: [
      'title: "Weak Area Repair"',
      'id: "classify"',
      'id: "root"',
      'id: "repair"',
      'id: "retest"',
      'id: "schedule"',
      "First question: what kind of mistake actually happened?",
      "Recall chain: classify -> root cause -> repair -> retest -> schedule.",
    ],
  },
  {
    file: "src/components/upsc/GeographyRevisionCloseoutVisual.tsx",
    patterns: [
      'testId: "day28-weak-area-repair-visual"',
      'stageTestIdPrefix: "day28-weak-area-repair-stage"',
      'banner: "TARGETED RECOVERY"',
      "data-active-stage={activeStage.id}",
      "data-testid={`${config.stageTestIdPrefix}-${stage.id}`}",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      "GeographyDay28WeakAreaRepairVisual,",
      "activeSession.day === 28 ? <GeographyDay28WeakAreaRepairVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentyEightWeakAreaRepair = activeSession.day === 28 && labSlug === "mcq-engine";',
      "isDayTwentyEightWeakAreaRepair && <GeographyDay28WeakAreaRepairVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 28) return geographyDay28PortalLesson.scenes;",
      "Start with ${geographyDay28PortalLesson.title}: classify the weak signal as knowledge, map recall, concept confusion, or statement-reading error.",
    ],
  },
];

const results = checks.flatMap((check) => check.patterns.map((pattern) => ({ file: check.file, pattern, passed: read(check.file).includes(pattern) })));
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ checks: results.length, failed, passed: failed.length === 0 }, null, 2));
if (failed.length) process.exit(1);
