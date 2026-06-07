import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const checks = [
  {
    file: "src/lib/upsc/geographyDay30PortalLesson.ts",
    patterns: [
      'title: "Geography Command Day"',
      'id: "recall"',
      'id: "map"',
      'id: "proof"',
      'id: "revision"',
      'id: "verdict"',
      "Command check: explain the subject, do not merely recognize it.",
      "Recall chain: explain -> locate -> prove -> schedule -> decide.",
    ],
  },
  {
    file: "src/components/upsc/GeographyRevisionCloseoutVisual.tsx",
    patterns: [
      'testId: "day30-geography-command-day-visual"',
      'stageTestIdPrefix: "day30-geography-command-day-stage"',
      'banner: "GEOGRAPHY COMMAND"',
      "data-active-stage={activeStage.id}",
      "data-testid={`${config.stageTestIdPrefix}-${stage.id}`}",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      "GeographyDay30GeographyCommandDayVisual,",
      "activeSession.day === 30 ? <GeographyDay30GeographyCommandDayVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayThirtyGeographyCommandDay = activeSession.day === 30 && labSlug === "india-map";',
      "isDayThirtyGeographyCommandDay && <GeographyDay30GeographyCommandDayVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 30) return geographyDay30PortalLesson.scenes;",
      "Start with ${geographyDay30PortalLesson.title}: explain every major theme through cause and location before marking the subject complete.",
    ],
  },
];

const results = checks.flatMap((check) => check.patterns.map((pattern) => ({ file: check.file, pattern, passed: read(check.file).includes(pattern) })));
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ checks: results.length, failed, passed: failed.length === 0 }, null, 2));
if (failed.length) process.exit(1);
