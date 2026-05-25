const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-visual-lab-command-board-evidence.json");
const screenshotPath = path.join(__dirname, "geography-visual-lab-command-board-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still shows old branding.`);
  }
}

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day }
  );
}

async function saveStage(page, stageText, expectedCount) {
  await page.getByTestId("geography-lab-proof-stages").getByText(stageText, { exact: false }).click();
  await page.getByTestId("geography-lab-use-proof-suggestion").click();
  const proofInput = await page.getByTestId("geography-lab-proof-input").inputValue();
  if (!proofInput.includes("Wayanad WLS")) {
    throw new Error(`Proof suggestion did not use selected atlas anchor for ${stageText}: ${proofInput}`);
  }
  await page.getByTestId("geography-lab-save-proof").click();
  await page.waitForFunction(
    ({ key, expected }) => {
      const day = JSON.parse(window.localStorage.getItem(key) || "{}")["13"];
      return (day?.labProofCompletedIds?.length ?? 0) >= expected;
    },
    { key: progressKey, expected: expectedCount },
    { timeout: 15000 }
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

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_visual_lab_command_board");
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "13": {
          day: 13,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["13-briefing", "13-mechanism", "13-map", "13-trap", "13-recap"],
          talkScore: 88,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          talkClassroomStage: "examiner-verdict",
          talkNextRoute: "/upsc/geography/lab?mode=india-map&day=13",
          talkNextActionLabel: "Open visual lab",
          confidence: "Command",
          reflection: "Seeded Talk pass for Visual Lab command-board verification.",
          revisitQueued: false,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, progressKey);

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("lab-evidence-status").getByText("proof pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("lab-evidence-step-talk-verdict").getByText("Done", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("lab-evidence-step-lab-proof").getByText("0/5 stages saved", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("lab-route-decision").getByText("Finish lab proof", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-command-board-initial", checks);

  await page.getByTestId("india-layer-wildlife-sanctuaries").click();
  await page.getByTestId("india-atlas-point-wayanad-wls").click();
  await page.getByTestId("lab-evidence-step-map-anchor").getByText("Wildlife Sanctuaries: Wayanad WLS", { exact: false }).waitFor({ timeout: 15000 });
  await saveStage(page, "1. Concept lock", 1);
  const partial = await getProgress(page, 13);
  if (
    partial?.labEvidenceStatus !== "proof-pending" ||
    partial?.labNextActionLabel !== "Finish lab proof" ||
    !String(partial?.labNextRoute || "").includes("/upsc/geography/lab?mode=india-map&day=13") ||
    partial?.labEvidenceAnchor !== "Wildlife Sanctuaries: Wayanad WLS" ||
    partial?.labAtlasPoint !== "Wayanad WLS"
  ) {
    throw new Error(`Partial Lab command state did not persist: ${JSON.stringify(partial, null, 2)}`);
  }

  await saveStage(page, "2. Map mechanism", 2);
  await saveStage(page, "3. India example", 3);
  await saveStage(page, "4. UPSC trap", 4);
  await saveStage(page, "5. Answer hook", 5);
  await page.getByTestId("lab-evidence-status").getByText("mcq ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("lab-route-decision").getByText("Open MCQ readiness", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-command-board-complete", checks);

  const finalProgress = await getProgress(page, 13);
  if (
    finalProgress?.labEvidenceStatus !== "mcq-ready" ||
    finalProgress?.labNextActionLabel !== "Open MCQ readiness" ||
    finalProgress?.labNextRoute !== "/upsc/geography/mcq-readiness?day=13" ||
    finalProgress?.labCompleted !== true ||
    finalProgress?.labProofCompletedIds?.length !== 5
  ) {
    throw new Error(`Final Lab command state did not persist: ${JSON.stringify(finalProgress, null, 2)}`);
  }

  await page.getByTestId("lab-primary-route").click();
  await page.waitForURL("**/upsc/geography/mcq-readiness?day=13", { timeout: 15000 });
  await page.getByTestId("mcq-lab-gate").getByText("Lab proof 5/5", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-command-board-mcq-route", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=13`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-command-board-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    partial,
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
