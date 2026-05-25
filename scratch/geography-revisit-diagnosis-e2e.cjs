const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-revisit-diagnosis-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-revisit-diagnosis-final.png");
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

  await page.goto(`${baseUrl}/upsc/geography/revisit?day=11`, { waitUntil: "networkidle" });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "11": {
          day: 11,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["11-briefing", "11-mechanism", "11-map", "11-trap", "11-recap"],
          confidence: "Shaky",
          revisitQueued: true,
          reflection: "Settlement geography explanation was weak because the map proof was not precise.",
          talkScore: 52,
          talkBand: "Practice",
          talkUnlockStage: "retry",
          talkDiscussionStep: "challenge",
          assessmentSummary: "The explanation needs a stronger map proof before forward movement.",
          talkRubric: [
            { label: "Recall", score: 22, max: 30, status: "Ready", evidence: "Core terms are present." },
            { label: "Mechanism", score: 14, max: 20, status: "Forming", evidence: "Mechanism is forming." },
            { label: "Map proof", score: 4, max: 20, status: "Weak", evidence: "No region, river, or settlement pattern was anchored." },
            { label: "UPSC trap", score: 10, max: 15, status: "Forming", evidence: "Trap exists but needs exception." },
            { label: "Expression", score: 12, max: 15, status: "Ready", evidence: "Enough structure." },
          ],
          talkRepairHints: [
            "Add one map proof: region, river, coast, relief, climate belt, or Indian example.",
            "Add a because-chain: cause -> process -> effect -> exception.",
          ],
          talkPreliminaryRubric: [
            { label: "Map proof", score: 4, max: 20, status: "Weak", evidence: "Preliminary map proof weak." },
          ],
          talkPreliminaryRepairHints: ["Preliminary hint should be cleared after recovery."],
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, storageKey);
  await page.reload({ waitUntil: "networkidle" });

  await page
    .getByTestId("revisit-diagnosis-board")
    .getByRole("heading", { name: "Map proof" })
    .waitFor({ timeout: 15000 });
  await page
    .getByTestId("revisit-diagnosis-board")
    .locator("p")
    .filter({ hasText: "Add one map proof" })
    .last()
    .waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-proof-scaffold").getByText("Map proof repair", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-diagnosis-initial", checks);

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("revisit-load-proof-scaffold").click();
    const note = await page.getByTestId("revisit-recovery-note").inputValue();
    if (!note.includes("Map proof repair")) {
      throw new Error(`Recovery seed did not use rubric diagnosis: ${note}`);
    }
    await page.getByTestId("revisit-save-proof").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["11"];
        return (day?.recoveryProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: storageKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  await page.getByTestId("revisit-return-gate").getByText("Recovery saved locally", { exact: false }).waitFor({ timeout: 15000 });
  const recoveredProgress = await getProgress(page, 11);
  if (
    recoveredProgress?.revisitQueued !== false ||
    recoveredProgress?.recoveryCompleted !== true ||
    recoveredProgress?.recoveryWeakSkill !== "Map proof" ||
    !recoveredProgress?.recoveryDiagnosisSummary?.includes("Map proof") ||
    !recoveredProgress?.recoveryReturnPrompt?.includes("Recovered weak skill: Map proof") ||
    recoveredProgress?.talkRubric !== undefined ||
    recoveredProgress?.talkRepairHints !== undefined ||
    recoveredProgress?.talkPreliminaryRubric !== undefined ||
    recoveredProgress?.talkPreliminaryRepairHints !== undefined ||
    recoveredProgress?.talkDiscussionStep !== "explain"
  ) {
    throw new Error(`Diagnosis recovery did not reset Talk rubric fields: ${JSON.stringify(recoveredProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "revisit-diagnosis-complete", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("revisit-diagnosis-board").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-diagnosis-mobile", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    recoveredProgress,
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
