import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay8PortalLesson.ts",
    patterns: [
      'title: "India Physiography"',
      'id: "frame"',
      'id: "himalayas"',
      'id: "plains"',
      'id: "plateau"',
      'id: "edges"',
      "Trap: the Himalayas are not only a boundary; they also shape drainage, climate, and hazard risk.",
      "Recall chain: locate relief zone -> explain process -> connect one use or risk -> reject the mixed-location trap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay8IndiaReliefVisual.tsx",
    patterns: [
      'data-testid="day8-india-relief-visual"',
      "data-active-stage={activeStage.id}",
      "day8-india-relief-stage-${stage.id}",
      "INDIA RELIEF FRAME",
      "COASTS + ISLANDS",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay8IndiaReliefVisual } from "@/components/upsc/GeographyDay8IndiaReliefVisual";',
      "activeSession.day === 8 ? <GeographyDay8IndiaReliefVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayEightIndiaPhysiography = activeSession.day === 8 && labSlug === "india-map";',
      "isDayEightIndiaPhysiography && <GeographyDay8IndiaReliefVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 8) return geographyDay8PortalLesson.scenes;",
      "Start with ${geographyDay8PortalLesson.title}: read India relief as the base layer behind connected map patterns.",
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
