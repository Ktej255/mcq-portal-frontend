const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-day13-resources-agriculture-lesson-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-day13-resources-agriculture-lesson-final.png");
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
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
}

async function assertStage(page, stage, checks) {
  await page.getByTestId(`day13-resources-agriculture-stage-${stage}`).first().click();
  const activeStage = await page.getByTestId("day13-resources-agriculture-visual").first().getAttribute("data-active-stage");
  checks.push({ label: `day13-visual-stage-${stage}`, activeStage });
  if (activeStage !== stage) throw new Error(`Expected active Day 13 stage ${stage}, received ${activeStage}`);
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_day13_resources_agriculture_lesson");
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

  await page.goto(`${baseUrl}/upsc/geography/watch?day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Resources and Agriculture", { exact: true }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-duration").getByText("12 min topic", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("day13-resources-agriculture-visual").waitFor({ timeout: 15000 });

  const initialStage = await page.getByTestId("day13-resources-agriculture-visual").getAttribute("data-active-stage");
  checks.push({ label: "day13-visual-initial-stage", initialStage });
  if (initialStage !== "locate") throw new Error(`Expected locate initial stage, received ${initialStage}`);

  await page
    .getByText("Method: location factor -> regional belt -> economic use -> constraint -> sustainability issue.", { exact: true })
    .waitFor({ timeout: 15000 });
  await assertStage(page, "resources", checks);
  await assertStage(page, "crops", checks);
  await assertStage(page, "water", checks);
  await assertStage(page, "cluster", checks);
  await page
    .getByText("Recall chain: factor -> belt -> use -> pressure -> response -> swapped-pair trap.", { exact: true })
    .waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day13-resources-agriculture-watch-desktop", checks);

  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(/\/upsc\/geography\/talk\?day=13/, { timeout: 15000 });
  checks.push({ label: "day13-watch-to-talk-handoff", url: page.url() });
  await assertNoOverflow(page, "day13-resources-agriculture-talk-desktop", checks);

  await page.evaluate((key) => {
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    current["13"] = {
      ...(current["13"] || {}),
      day: 13,
      watched: true,
      watchState: "Watched",
      talkScore: 96,
      talkBand: "Command",
      talkUnlockStage: "mcq",
      talkVerdict: "Optional India Interactive Map review available.",
      confidence: "Command",
      reflection: "Location factors, resource belts, crop suitability, irrigation pressure, and swapped-pair traps are connected.",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(current));
  }, progressKey);

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day13-resources-agriculture-visual").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofDraft = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofDraft.includes("Resources and Agriculture") || !proofDraft.includes("India Interactive Map")) {
    throw new Error(`Day 13 lab prompt did not preserve the optional visual context: ${proofDraft}`);
  }
  checks.push({ label: "day13-india-map-proof-starter", proofDraft });
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=13/, { timeout: 15000 });
  const savedProgress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["13"], progressKey);
  checks.push({ label: "day13-india-map-proof-save", savedProgress });
  if (savedProgress?.labCompleted !== true || savedProgress?.labMode !== "india-map") {
    throw new Error(`Day 13 optional India Interactive Map proof did not persist: ${JSON.stringify(savedProgress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("day13-resources-agriculture-visual").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "day13-india-map-lab-mobile", checks);
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
