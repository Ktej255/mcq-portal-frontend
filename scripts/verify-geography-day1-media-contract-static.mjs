import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const checks = [
  {
    file: ".env.example",
    patterns: [
      "NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_APPROVED=false",
      "NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_URL=",
      "NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_TRANSCRIPT_URL=",
    ],
  },
  {
    file: "src/lib/upsc/geographyDay1Media.ts",
    patterns: [
      '"portal-native-fallback"',
      '"approved-recording"',
      '!trimmed.startsWith("//")',
      "approvedRecordingAttached",
      "releaseAssetPairReady",
      'status: releaseAssetPairReady ? "approved-recording" : "portal-native-fallback"',
      "Students remain on the verified portal-native fallback.",
      "No approved Day 1 recording is attached.",
    ],
  },
  {
    file: "src/components/upsc/GeographyWatchRoom.tsx",
    patterns: [
      'data-testid="watch-approved-day1-video"',
      "dayOneMedia?.releaseAssetPairReady",
      "dayOneMedia.transcriptUrl",
    ],
  },
  {
    file: "src/app/admin/feature-inventory/page.tsx",
    patterns: [
      'data-testid="admin-geography-day1-media-contract"',
      "Portal-native fallback active",
      "Approved recording and transcript attached",
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
