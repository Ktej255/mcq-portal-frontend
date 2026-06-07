import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay10PortalLesson.ts",
    patterns: [
      'title: "Indian Monsoon"',
      'id: "heating"',
      'id: "itcz"',
      'id: "branches"',
      'id: "rhythm"',
      'id: "variability"',
      "Map chain: seasonal heating -> ITCZ shift -> cross-equatorial flow -> southwest monsoon.",
      "UPSC trap: one variability factor can influence rainfall without becoming a complete one-factor explanation.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay10MonsoonVisual.tsx",
    patterns: [
      'data-testid="day10-monsoon-visual"',
      "data-active-stage={activeStage.id}",
      "day10-monsoon-stage-${stage.id}",
      "SUMMER HEATING",
      "READ THE SEASON AS A MOVING SEQUENCE",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay10MonsoonVisual } from "@/components/upsc/GeographyDay10MonsoonVisual";',
      "activeSession.day === 10 ? <GeographyDay10MonsoonVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTenIndianMonsoon = activeSession.day === 10 && labSlug === "monsoon";',
      "isDayTenIndianMonsoon && <GeographyDay10MonsoonVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 10) return geographyDay10PortalLesson.scenes;",
      "Start with ${geographyDay10PortalLesson.title}: build seasonal pressure contrast before memorizing rainfall dates.",
    ],
  },
];

const results = [];

for (const check of checks) {
  const source = read(check.file);
  for (const pattern of check.patterns) {
    results.push({
      file: check.file,
      pattern,
      passed: source.includes(pattern),
    });
  }
}

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ checks: results.length, failed, passed: failed.length === 0 }, null, 2));

if (failed.length) process.exit(1);
