import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay16PortalLesson.ts",
    patterns: [
      'title: "Settlements"',
      'id: "site"',
      'id: "rural"',
      'id: "urban"',
      'id: "morphology"',
      'id: "trap"',
      "Map chain: physical base + land use + water + safety shape rural form.",
      "Recall chain: site -> situation -> morphology -> function -> hierarchy -> reject the swap.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay16SettlementsVisual.tsx",
    patterns: [
      'data-testid="day16-settlements-visual"',
      "data-active-stage={activeStage.id}",
      "day16-settlements-stage-${stage.id}",
      "RURAL PATTERNS",
      "URBAN HIERARCHY",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay16SettlementsVisual } from "@/components/upsc/GeographyDay16SettlementsVisual";',
      "activeSession.day === 16 ? <GeographyDay16SettlementsVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDaySixteenSettlements = activeSession.day === 16 && labSlug === "india-map";',
      "isDaySixteenSettlements && <GeographyDay16SettlementsVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 16) return geographyDay16PortalLesson.scenes;",
      "Start with ${geographyDay16PortalLesson.title}: separate the exact settlement site from its wider spatial situation.",
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
