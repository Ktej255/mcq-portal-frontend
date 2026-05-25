const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-revisit-recovery-ledger-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-revisit-recovery-ledger-final.png");
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

  await page.goto(`${baseUrl}/upsc/geography/revisit?day=16`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "16": {
          day: 16,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["16-briefing", "16-mechanism", "16-map", "16-trap", "16-recap"],
          confidence: "Shaky",
          revisitQueued: true,
          reflection: "Climatology explanation was incomplete because the UPSC trap and exception were weak.",
          talkScore: 49,
          talkBand: "Practice",
          talkDiscussionStep: "challenge",
          talkRubric: [
            { label: "Recall", score: 22, max: 30, status: "Ready", evidence: "Core definitions are present." },
            { label: "Mechanism", score: 13, max: 20, status: "Forming", evidence: "Process chain needs tightening." },
            { label: "Map proof", score: 13, max: 20, status: "Forming", evidence: "Map anchor is partial." },
            { label: "UPSC trap", score: 3, max: 15, status: "Weak", evidence: "No exception was named." },
            { label: "Expression", score: 12, max: 15, status: "Ready", evidence: "Expression is usable." },
          ],
          talkRepairHints: [
            "Create one tempting wrong statement and correct the exception.",
            "Use concept -> mechanism -> map -> trap before retesting.",
          ],
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, storageKey);
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });

  await page.getByTestId("revisit-recovery-ledger").waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-recovery-status").getByText("Recovery pending", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-next-decision").getByText("Finish recovery proof", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-recovery-anchor").getByText("UPSC trap", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-ledger-initial", checks);

  await page.getByTestId("revisit-load-proof-scaffold").click();
  await page.getByTestId("revisit-save-proof").click();
  await page.waitForFunction(
    ({ key }) => {
      const day = JSON.parse(window.localStorage.getItem(key) || "{}")["16"];
      return (
        day?.recoveryStatus === "recovery-pending" &&
        day?.recoveryNextRoute === "/upsc/geography/revisit?day=16" &&
        day?.recoveryNextActionLabel === "Finish recovery proof" &&
        day?.recoveryEvidenceAnchor?.includes("UPSC trap")
      );
    },
    { key: storageKey },
    { timeout: 15000 }
  );

  for (let index = 1; index < 5; index += 1) {
    await page.getByTestId("revisit-load-proof-scaffold").click();
    await page.getByTestId("revisit-save-proof").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["16"];
        return (day?.recoveryProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: storageKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  await page.getByTestId("revisit-recovery-status").getByText("Talk ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-next-decision").getByText("Return to AI teacher", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("revisit-return-gate").waitFor({ timeout: 15000 });

  const recoveredProgress = await getProgress(page, 16);
  if (
    recoveredProgress?.revisitQueued !== false ||
    recoveredProgress?.recoveryCompleted !== true ||
    recoveredProgress?.recoveryStatus !== "talk-ready" ||
    recoveredProgress?.recoveryNextRoute !== "/upsc/geography/talk?day=16" ||
    recoveredProgress?.recoveryNextActionLabel !== "Return to AI teacher" ||
    recoveredProgress?.talkRubric !== undefined ||
    recoveredProgress?.talkBand !== undefined ||
    recoveredProgress?.talkScore !== undefined ||
    recoveredProgress?.talkDiscussionStep !== "explain"
  ) {
    throw new Error(`Recovery ledger did not save the final Talk decision: ${JSON.stringify(recoveredProgress, null, 2)}`);
  }

  await assertNoOverflow(page, "revisit-ledger-complete", checks);

  await page.getByTestId("revisit-primary-route").click();
  await page.waitForURL("**/upsc/geography/talk?day=16", { timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Awaiting MAIC oral check", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-after-ledger-return", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/revisit?day=16`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("revisit-recovery-ledger").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-ledger-mobile", checks);

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
