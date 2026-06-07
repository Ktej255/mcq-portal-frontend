const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-day2-universe-lesson-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day2-universe-lesson-final.png");
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

async function assertStage(page, stage, checks) {
  await page.getByTestId(`day2-universe-stage-${stage}`).click();
  const activeStage = await page.getByTestId("day2-universe-visual").getAttribute("data-active-stage");
  checks.push({ label: `day2-visual-stage-${stage}`, activeStage });
  if (activeStage !== stage) throw new Error(`Expected active Day 2 stage ${stage}, received ${activeStage}`);
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_day2_universe_lesson");
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

  await page.goto(`${baseUrl}/upsc/geography/watch?day=2`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Origin and Evolution of Earth", { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-duration").getByText("12 min topic", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("day2-universe-visual").waitFor({ timeout: 15000 });

  const initialStage = await page.getByTestId("day2-universe-visual").getAttribute("data-active-stage");
  checks.push({ label: "day2-visual-initial-stage", initialStage });
  if (initialStage !== "expansion") throw new Error(`Expected expansion initial stage, received ${initialStage}`);

  await page.getByText("Trap: do not imagine a central blast moving through pre-existing empty space.", { exact: true }).waitFor({
    timeout: 15000,
  });
  await assertStage(page, "structure", checks);
  await assertStage(page, "accretion", checks);
  await assertStage(page, "differentiation", checks);
  await assertStage(page, "surface", checks);
  await page
    .getByText("Recall chain: expansion -> gravity -> accretion -> differentiation -> atmosphere and hydrosphere.", {
      exact: true,
    })
    .waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day2-universe-watch-desktop", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(/\/upsc\/geography\/talk\?day=2/, { timeout: 15000 });
  checks.push({ label: "day2-watch-to-talk-handoff", url: page.url() });
  await assertNoOverflow(page, "day2-universe-talk-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=2`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day2-universe-visual").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day2-universe-watch-mobile", checks);
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
