import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay20PortalLesson.ts",
    patterns: [
      'title: "Regional Development"',
      'id: "disparity"',
      'id: "planning"',
      'id: "urban"',
      'id: "governance"',
      'id: "trap"',
      "Begin with the map: where is the gap, which indicator shows it, and what creates it?",
      "Recall chain: gap -> cause -> indicator -> region -> response -> reject the mismatch.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay20RegionalDevelopmentVisual.tsx",
    patterns: [
      'data-testid="day20-regional-development-visual"',
      "data-active-stage={activeStage.id}",
      "day20-regional-development-stage-${stage.id}",
      "SPATIAL INEQUALITY",
      "GOVERNANCE RESPONSE",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay20RegionalDevelopmentVisual } from "@/components/upsc/GeographyDay20RegionalDevelopmentVisual";',
      "activeSession.day === 20 ? <GeographyDay20RegionalDevelopmentVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentyRegionalDevelopment = activeSession.day === 20 && labSlug === "environment-bridge";',
      "isDayTwentyRegionalDevelopment && <GeographyDay20RegionalDevelopmentVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 20) return geographyDay20PortalLesson.scenes;",
      "Start with ${geographyDay20PortalLesson.title}: identify one spatial development gap, the indicator that reveals it, and the geography or governance factor that creates it.",
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
