import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay9PortalLesson.ts",
    patterns: [
      'title: "Indian Drainage"',
      'id: "frame"',
      'id: "himalayan"',
      'id: "peninsular"',
      'id: "outlets"',
      'id: "traps"',
      "Start with the method: source -> slope -> basin -> tributary -> outlet -> consequence.",
      "Recall chain: locate source -> face downstream -> place tributary -> trace outlet -> reject the swapped pair.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay9DrainageVisual.tsx",
    patterns: [
      'data-testid="day9-drainage-visual"',
      "data-active-stage={activeStage.id}",
      "day9-drainage-stage-${stage.id}",
      "INDIAN DRAINAGE METHOD",
      "FACE DOWNSTREAM",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay9DrainageVisual } from "@/components/upsc/GeographyDay9DrainageVisual";',
      "activeSession.day === 9 ? <GeographyDay9DrainageVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayNineIndianDrainage = activeSession.day === 9 && labSlug === "india-map";',
      "isDayNineIndianDrainage && <GeographyDay9DrainageVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 9) return geographyDay9PortalLesson.scenes;",
      "Start with ${geographyDay9PortalLesson.title}: trace every river through source, slope, basin, tributaries, state path, and outlet.",
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
