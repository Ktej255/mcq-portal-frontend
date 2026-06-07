const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-day1-source-backed-watch-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day1-source-backed-watch-mobile.png");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, geographyProgressKey }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_day1_source_backed_watch");
      localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "no-attempt",
          learningPattern: "guided",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      localStorage.removeItem(geographyProgressKey);
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey }
  );

  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.locator("h1").getByText("Geographic Thinking and Map Relationships", { exact: true }).waitFor();
  const duration = await page.getByTestId("watch-topic-duration").innerText();
  await page.getByTestId("geography-watch-checkpoints").locator("summary").click();
  const sceneTitles = await Promise.all(
    [1, 2, 3, 4, 5].map((index) => page.getByTestId(`watch-scene-${index}`).locator("span.block").first().innerText())
  );
  const expectedScenes = [
    "Ask the geographic question",
    "Read location as a relationship",
    "Use site, situation, and scale",
    "Practice India map relationships",
    "Explain why here, not there",
  ];
  if (duration !== "12 min topic" || sceneTitles.join("|") !== expectedScenes.join("|")) {
    throw new Error(`Day 1 source-backed scene mismatch: ${JSON.stringify({ duration, sceneTitles })}`);
  }

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL("**/upsc/geography/talk?day=1", { timeout: 15000 });
  await page.getByTestId("talk-answer-draft").waitFor({ timeout: 15000 });
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["1"], progressKey);
  if (
    progress?.watched !== true ||
    progress?.watchHandoffReady !== true ||
    progress?.watchSceneCompletedIds?.length !== 5 ||
    progress?.labMode !== "india-map" ||
    !progress?.watchHandoffSummary?.includes("Geographic Thinking and Map Relationships") ||
    !progress?.watchHandoffSummary?.includes("India map relationship")
  ) {
    throw new Error(`Day 1 source-backed handoff mismatch: ${JSON.stringify(progress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  if (metrics.hasHorizontalOverflow) throw new Error(`Day 1 mobile overflow: ${JSON.stringify(metrics)}`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const evidence = {
    baseUrl,
    checks: { duration, sceneTitles, progress, metrics },
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
