import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay19PortalLesson.ts",
    patterns: [
      'title: "Industry Location"',
      'id: "classic"',
      'id: "modern"',
      'id: "regions"',
      'id: "clusters"',
      'id: "trap"',
      "Map chain: resource base -> transport link -> industry -> old industrial region.",
      "Recall chain: industry -> dominant factor -> region -> network -> reject the mismatch.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay19IndustryLocationVisual.tsx",
    patterns: [
      'data-testid="day19-industry-location-visual"',
      "data-active-stage={activeStage.id}",
      "day19-industry-location-stage-${stage.id}",
      "CLASSICAL FACTORS",
      "NEW CLUSTER",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay19IndustryLocationVisual } from "@/components/upsc/GeographyDay19IndustryLocationVisual";',
      "activeSession.day === 19 ? <GeographyDay19IndustryLocationVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayNineteenIndustryLocation = activeSession.day === 19 && labSlug === "india-map";',
      "isDayNineteenIndustryLocation && <GeographyDay19IndustryLocationVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 19) return geographyDay19PortalLesson.scenes;",
      "Start with ${geographyDay19PortalLesson.title}: compare classical input-market factors with newer skill, data, innovation, logistics, policy, and value-chain logic.",
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
