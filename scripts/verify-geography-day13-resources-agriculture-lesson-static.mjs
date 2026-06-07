import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay13PortalLesson.ts",
    patterns: [
      'title: "Resources and Agriculture"',
      'id: "locate"',
      'id: "resources"',
      'id: "crops"',
      'id: "water"',
      'id: "cluster"',
      "Map chain: soil + rain + temperature + water + market shape the crop belt.",
      "Recall chain: factor -> belt -> use -> pressure -> response -> swapped-pair trap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay13ResourcesAgricultureVisual.tsx",
    patterns: [
      'data-testid="day13-resources-agriculture-visual"',
      "data-active-stage={activeStage.id}",
      "day13-resources-agriculture-stage-${stage.id}",
      "LOCATION LOGIC",
      "EXPLAIN ONE CLUSTER",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay13ResourcesAgricultureVisual } from "@/components/upsc/GeographyDay13ResourcesAgricultureVisual";',
      "activeSession.day === 13 ? <GeographyDay13ResourcesAgricultureVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayThirteenResourcesAgriculture = activeSession.day === 13 && labSlug === "india-map";',
      "isDayThirteenResourcesAgriculture && <GeographyDay13ResourcesAgricultureVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 13) return geographyDay13PortalLesson.scenes;",
      "Start with ${geographyDay13PortalLesson.title}: explain why resources and crops cluster before memorizing belts.",
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
