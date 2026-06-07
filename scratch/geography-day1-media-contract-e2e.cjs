const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-day1-media-contract-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day1-media-contract-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
      document.body.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(({ studentProfileKey }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_day1_media_contract");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "beginner",
        preparationStage: "not-started",
        studyWindow: "60",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        attemptHistory: "no-attempt",
        learningPattern: "deep-work",
        mindState: "calm",
        updatedAt: new Date().toISOString(),
      }),
    );
  }, { studentProfileKey: profileKey });

  await page.goto(`${baseUrl}/admin/feature-inventory`, { waitUntil: "domcontentloaded", timeout: 45000 });
  const mediaContract = page.getByTestId("admin-geography-day1-media-contract");
  await mediaContract.getByText("Approved-media contract", { exact: true }).waitFor({ timeout: 15000 });
  await mediaContract.getByText("Awaiting approved URL", { exact: false }).waitFor({ timeout: 15000 });
  await mediaContract.getByText("Awaiting URL", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Portal-native fallback active", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "admin-day1-media-contract-desktop", checks);

  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  const player = page.getByTestId("watch-topic-player");
  await player.getByText("Geographic Thinking and Map Relationships", { exact: true }).waitFor({ timeout: 15000 });
  const mediaSource = await player.getAttribute("data-media-source");
  const approvedVideoCount = await page.getByTestId("watch-approved-day1-video").count();
  if (mediaSource !== "portal-native-fallback" || approvedVideoCount !== 0) {
    throw new Error(`Expected portal-native fallback without fake approved video: ${JSON.stringify({ mediaSource, approvedVideoCount })}`);
  }
  checks.push({ label: "day1-media-fallback", mediaSource, approvedVideoCount });
  await assertNoOverflow(page, "watch-day1-media-fallback-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-topic-player").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day1-media-fallback-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment)),
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
