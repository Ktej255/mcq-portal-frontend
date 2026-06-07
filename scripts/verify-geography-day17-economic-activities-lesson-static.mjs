import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay17PortalLesson.ts",
    patterns: [
      'title: "Economic Activities"',
      'id: "primary"',
      'id: "secondary"',
      'id: "tertiary"',
      'id: "knowledge"',
      'id: "shift"',
      "Chain: resource input -> processing -> infrastructure -> market-facing output.",
      "Recall chain: input -> transformation -> service -> knowledge -> structural shift -> reject overlap trap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay17EconomicActivitiesVisual.tsx",
    patterns: [
      'data-testid="day17-economic-activities-visual"',
      "data-active-stage={activeStage.id}",
      "day17-economic-activities-stage-${stage.id}",
      "PRIMARY",
      "CLASSIFY THE SPECIFIC ACTIVITY",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay17EconomicActivitiesVisual } from "@/components/upsc/GeographyDay17EconomicActivitiesVisual";',
      "activeSession.day === 17 ? <GeographyDay17EconomicActivitiesVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDaySeventeenEconomicActivities = activeSession.day === 17 && labSlug === "india-map";',
      "isDaySeventeenEconomicActivities && <GeographyDay17EconomicActivitiesVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 17) return geographyDay17PortalLesson.scenes;",
      "Start with ${geographyDay17PortalLesson.title}: classify resource use, transformation, services, knowledge, and high-order decisions separately.",
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
