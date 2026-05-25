const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-talk-maic-rubric-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-talk-maic-rubric-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: storageKey, selectedDay: day }
  );
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

  await page.goto(`${baseUrl}/upsc/geography/talk?day=7`, { waitUntil: "networkidle" });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "7": {
          day: 7,
          watched: true,
          watchState: "Watched",
          watchMinutes: 75,
          watchSceneCompletedIds: ["7-briefing", "7-mechanism", "7-map", "7-trap", "7-recap"],
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, storageKey);
  await page.reload({ waitUntil: "networkidle" });

  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("talk-maic-role-cycle").getByText("UPSC Examiner", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-maic-initial", checks);

  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    [
      "Climate and natural vegetation are linked through temperature, rainfall, relief and soil.",
      "Rainfall and temperature affect forest type, grassland and desert vegetation, while relief changes local climate.",
      "In India, evergreen forest, deciduous forest and desert vegetation show the map pattern, but my answer needs a stronger UPSC trap.",
    ].join(" ")
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-peer-challenge").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-rubric-board").getByText("Map proof", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-challenge-scaffold").getByText("Suggested repair frame", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-maic-after-first", checks);

  const preliminary = await getProgress(page, 7);
  if (
    preliminary?.talkDiscussionStep !== "challenge" ||
    typeof preliminary?.talkPreliminaryScore !== "number" ||
    !Array.isArray(preliminary?.talkPreliminaryRubric) ||
    preliminary.talkPreliminaryRubric.length !== 5 ||
    !Array.isArray(preliminary?.talkPreliminaryRepairHints)
  ) {
    throw new Error(`Preliminary MAIC rubric did not persist: ${JSON.stringify(preliminary, null, 2)}`);
  }

  await page.getByTestId("talk-load-challenge-scaffold").click();
  const challengeDraft = await page.getByTestId("talk-challenge-response").inputValue();
  if (!challengeDraft.includes("Core concept") || !challengeDraft.includes("UPSC trap")) {
    throw new Error(`Challenge scaffold did not load correctly: ${challengeDraft}`);
  }

  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-route-gate").getByText("Visual Lab required", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-rubric-board").getByText("Expression", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-maic-after-verdict", checks);

  const finalProgress = await getProgress(page, 7);
  if (
    finalProgress?.talkDiscussionStep !== "verdict" ||
    !Array.isArray(finalProgress?.talkRubric) ||
    finalProgress.talkRubric.length !== 5 ||
    !Array.isArray(finalProgress?.talkRepairHints) ||
    !["lab", "mcq"].includes(finalProgress?.talkUnlockStage) ||
    !["Practice", "Command"].includes(finalProgress?.talkBand) ||
    finalProgress?.revisitQueued !== false
  ) {
    throw new Error(`Final MAIC rubric verdict did not persist: ${JSON.stringify(finalProgress, null, 2)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("talk-rubric-board").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-maic-mobile", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    preliminary,
    finalProgress,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
