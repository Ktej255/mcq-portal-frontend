const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-lab-simple-proof-e2e-evidence.json");

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
}

async function seed(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(({ progressStorageKey, profileStorageKey }) => {
    localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER");
    localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
    localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        "10": {
          day: 10,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["10-briefing", "10-mechanism", "10-map", "10-trap", "10-recap"],
          baselineKnowledge: "I know river and relief locations create map traps.",
          talkScore: 96,
          talkBand: "Command",
          talkUnlockStage: "mcq",
          talkVerdict: "Visual Lab unlocked.",
          confidence: "Command",
          reflection: "India map logic is ready for applied atlas proof.",
        },
      })
    );
  }, { progressStorageKey: progressKey, profileStorageKey: profileKey });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seed(page);
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=10`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-lab-simple-surface").waitFor({ timeout: 30000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  const simpleSurfaceContract = await page.getByTestId("geography-lab-simple-surface").evaluate((element) => ({
    visibleMode: element.getAttribute("data-visible-mode"),
    studentSurface: element.getAttribute("data-student-surface"),
  }));
  checks.push({ label: "lab-simple-surface-contract", simpleSurfaceContract });
  if (
    simpleSurfaceContract.visibleMode !== "one-optional-note-one-action" ||
    simpleSurfaceContract.studentSurface !== "optional-lab-first"
  ) {
    throw new Error(`Visual Lab simple surface contract changed: ${JSON.stringify(simpleSurfaceContract)}`);
  }
  const actionCardContract = await page.getByTestId("geography-lab-action-card").evaluate((element) => ({
    studentSurface: element.getAttribute("data-student-surface"),
    text: element.textContent,
  }));
  checks.push({ label: "lab-action-card-contract", actionCardContract });
  if (actionCardContract.studentSurface !== "primary-action" || !actionCardContract.text.includes("Skip visual and open MCQ")) {
    throw new Error(`Visual Lab primary action contract changed: ${JSON.stringify(actionCardContract)}`);
  }
  const proofBoardContract = await page.getByTestId("lab-proof-command-board").evaluate((element) => ({
    visibleMode: element.getAttribute("data-visible-mode"),
    studentSurface: element.getAttribute("data-student-surface"),
  }));
  checks.push({ label: "lab-proof-board-contract", proofBoardContract });
  if (proofBoardContract.visibleMode !== "one-visual-note" || proofBoardContract.studentSurface !== "note-first") {
    throw new Error(`Visual Lab proof board contract changed: ${JSON.stringify(proofBoardContract)}`);
  }
  await page.getByTestId("lab-evidence-status").getByText("proof pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-flow-strip").getByText("Optional proof", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-one-action-rule").getByText("Write one useful note", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-lab-visual-board").waitFor({ timeout: 15000 });
  const visualBoardOpen = await page.getByTestId("geography-lab-visual-board").evaluate((element) => element.open);
  checks.push({ label: "lab-visual-board-folded", visualBoardOpen });
  if (visualBoardOpen) {
    throw new Error("Visual board should be folded on first load.");
  }
  await page.getByTestId("geography-lab-advanced-tools").waitFor({ timeout: 15000 });
  const stageVisible = await page.getByTestId("geography-lab-proof-stages").isVisible();
  checks.push({ label: "lab-advanced-stages-hidden", stageVisible });
  if (stageVisible) {
    throw new Error("Visual Lab proof stages should be folded on first load.");
  }
  const optionalSkipHref = await page.getByTestId("lab-continue-without-visual").getAttribute("href");
  checks.push({ label: "lab-optional-skip-route", optionalSkipHref });
  if (optionalSkipHref !== "/upsc/geography/mcq-readiness?day=10") {
    throw new Error(`Visual Lab should allow an optional direct MCQ return, got ${optionalSkipHref}.`);
  }
  const saveDisabledBeforeNote = await page.getByTestId("geography-lab-save-proof").isDisabled();
  await page.getByTestId("geography-lab-proof-input").fill("Map");
  const saveDisabledForThinNote = await page.getByTestId("geography-lab-save-proof").isDisabled();
  checks.push({ label: "lab-meaningful-note-required", saveDisabledBeforeNote, saveDisabledForThinNote });
  if (!saveDisabledBeforeNote || !saveDisabledForThinNote) {
    throw new Error("Visual Lab should require one meaningful note before saving optional proof.");
  }
  await assertNoOverflow(page, "geography-lab-simple-desktop", checks);

  await page.getByTestId("geography-lab-proof-input").fill(
    "India map proof: connect physical region, river or relief, example, and one UPSC trap before solving MCQs."
  );
  await page.getByTestId("geography-lab-save-proof").click();

  await page.waitForURL("**/upsc/geography/mcq-readiness?day=10", { timeout: 15000 });
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}")["10"], progressKey);
  if (
    !progress?.labCompleted ||
    progress.labMode !== "india-map" ||
    progress.labProofCompletedIds?.length !== 5 ||
    progress.labEvidenceStatus !== "mcq-ready" ||
    progress.labNextRoute !== "/upsc/geography/mcq-readiness?day=10"
  ) {
    throw new Error(`Lab proof did not persist correctly: ${JSON.stringify(progress)}`);
  }
  await page.getByText("Practice is being prepared", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-mcq-advanced-tools").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-lab-mcq-handoff-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=10`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("geography-lab-simple-surface").waitFor({ timeout: 15000 });
  await page.getByTestId("lab-proof-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("lab-evidence-status").getByText("mcq ready", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-lab-simple-mobile", checks);

  await browser.close();

  const evidence = {
    baseUrl,
    checks,
    progress,
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
