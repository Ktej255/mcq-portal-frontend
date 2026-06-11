const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-lab-proof-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-lab-proof-final.png");
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function metrics(page) {
  return page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function assertNoOverflow(page, label, checks) {
  const pageMetrics = await metrics(page);
  checks.push({ label, metrics: pageMetrics });
  if (pageMetrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
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
  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_lab_proof");
      localStorage.setItem(
        key,
        JSON.stringify({
          level: "advanced",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          updatedAt: new Date().toISOString(),
        })
      );
    },
    { key: profileKey }
  );

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=monsoon&day=10`, { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        10: {
          day: 10,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["10-briefing", "10-mechanism", "10-map", "10-trap", "10-recap"],
          talkScore: 96,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          talkVerdict: "MCQ route conditionally unlocked.",
          confidence: "Command",
          reflection: "Monsoon mechanism is ready for applied visual proof.",
        },
      })
    );
  }, progressKey);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  const stageVisible = await page.getByTestId("geography-lab-proof-stages").isVisible();
  if (stageVisible) {
    throw new Error("Manual lab proof stages should remain folded on first load.");
  }
  await page.getByTestId("geography-lab-proof-input").fill(
    "Monsoon proof: map the pressure shift first, then connect wind reversal, relief rainfall, one Indian example and one statement trap."
  );
  await page.getByTestId("geography-lab-save-proof").click();

  const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["10"], progressKey);
  if (!stored?.labCompleted || stored?.labMode !== "monsoon" || stored?.labProofCompletedIds?.length !== 5) {
    throw new Error(`Lab proof did not complete correctly: ${JSON.stringify(stored)}`);
  }
  checks.push({
    label: "stored-geography-lab-proof",
    labCompleted: stored.labCompleted,
    labMode: stored.labMode,
    labProofCompletedIds: stored.labProofCompletedIds,
    labEvidenceStatus: stored.labEvidenceStatus,
    labNextRoute: stored.labNextRoute,
  });
  await assertNoOverflow(page, "geography-lab-proof", checks);

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=10`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("geography-mcq-level-shell").waitFor({ timeout: 15000 });
  await page.getByText("Practice is being prepared", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-talk-clearance-proof").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-mcq-advanced-tools").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-mcq-lab-proof-gate", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
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

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
