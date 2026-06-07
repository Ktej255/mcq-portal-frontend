import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay4PortalLesson.ts",
    patterns: [
      'title: "Geomorphic Processes"',
      'id: "exposure"',
      'id: "weathering"',
      'id: "erosion"',
      'id: "deposition"',
      'id: "slope"',
      "Trap: weathering is breakdown in place; it does not require removal.",
      "Recall chain: exposure -> weathering -> erosion and transport -> deposition; gravity can move slopes suddenly.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay4GeomorphicVisual.tsx",
    patterns: [
      'data-testid="day4-geomorphic-visual"',
      "data-active-stage={activeStage.id}",
      "day4-geomorphic-stage-${stage.id}",
      "erosion removes and transports sediment",
      "gravity drives mass wasting",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay4GeomorphicVisual } from "@/components/upsc/GeographyDay4GeomorphicVisual";',
      "activeSession.day === 4 ? <GeographyDay4GeomorphicVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayFourDisasterLink = activeSession.day === 4 && labSlug === "disaster-link";',
      "isDayFourDisasterLink && <GeographyDay4GeomorphicVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 4) return geographyDay4PortalLesson.scenes;",
      "Start with ${geographyDay4PortalLesson.title}: uplift exposes rock to external processes.",
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
