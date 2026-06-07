import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/lib/upsc/geographyDay25PortalLesson.ts",
    patterns: [
      'title: "Environment Geography Bridge"',
      'id: "biome"',
      'id: "biodiversity"',
      'id: "exposure"',
      'id: "conservation"',
      'id: "trap"',
      "Biome check: climate pattern first, ecological label second.",
      "Recall chain: biome -> habitat -> exposure -> region -> verify.",
    ],
  },
  {
    file: "src/components/upsc/GeographyDay25EnvironmentGeographyBridgeVisual.tsx",
    patterns: [
      'data-testid="day25-environment-geography-bridge-visual"',
      "data-active-stage={activeStage.id}",
      "day25-environment-geography-bridge-stage-${stage.id}",
      "BIOME CONTROLS",
      "CROSS-MATCH TRAP",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'import { GeographyDay25EnvironmentGeographyBridgeVisual } from "@/components/upsc/GeographyDay25EnvironmentGeographyBridgeVisual";',
      "activeSession.day === 25 ? <GeographyDay25EnvironmentGeographyBridgeVisual /> : null",
    ],
  },
  {
    file: "src/components/upsc/GeographyVisualLab.tsx",
    patterns: [
      'const isDayTwentyFiveEnvironmentGeographyBridge = activeSession.day === 25 && labSlug === "environment-bridge";',
      "isDayTwentyFiveEnvironmentGeographyBridge && <GeographyDay25EnvironmentGeographyBridgeVisual />",
    ],
  },
  {
    file: "src/lib/upsc/geographyLearning.ts",
    patterns: [
      "if (session.day === 25) return geographyDay25PortalLesson.scenes;",
      "Start with ${geographyDay25PortalLesson.title}: read biome controls through temperature, rainfall, seasonality, latitude, altitude, and soil before naming an ecological pattern.",
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
