const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-loop-wiring-e2e-evidence.json");
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
    ({ storageKey: key, day: selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { storageKey, day }
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

  await page.goto(`${baseUrl}/upsc/geography?day=10`, { waitUntil: "networkidle" });
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Watch\s+Class/i }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "command-day-10", checks);

  await page.getByRole("link", { name: /MCQ\s+Practice/i }).first().click();
  await page.waitForURL("**/upsc/geography/mcq-readiness?day=10", { timeout: 15000 });
  await page.getByText("Plan the fresh MCQ batch", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "mcq-readiness-day-10", checks);

  await page.getByRole("link", { name: /Geography command room/i }).first().click();
  await page.waitForURL("**/upsc/geography?day=10", { timeout: 15000 });
  await page.getByRole("link", { name: /Watch\s+Class/i }).first().click();
  await page.waitForURL("**/upsc/geography/watch?day=10", { timeout: 15000 });
  await page.getByText("Demo video ready", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day-10-demo-ready", checks);
  await page.getByRole("button", { name: /Play demo/i }).click();
  await page.getByText("Demo lesson running", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Complete and discuss/i }).click();
  await page.waitForURL("**/upsc/geography/talk?day=10", { timeout: 15000 });
  await page.getByText("Socratic Talk", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-day-10", checks);

  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    "I do not know Indian Monsoon yet."
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByText("AI teacher assessment", { exact: false }).first().waitFor({ timeout: 15000 });

  const queuedProgress = await getProgress(page, 10);
  if (
    !queuedProgress?.reflection ||
    queuedProgress.confidence !== "Shaky" ||
    queuedProgress.revisitQueued !== true ||
    queuedProgress.talkBand !== "Revisit" ||
    typeof queuedProgress.talkScore !== "number"
  ) {
    throw new Error(`Talk progress did not persist correctly: ${JSON.stringify(queuedProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await page.getByText("Track command, doubt, and revisit.", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Day 10", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-with-revisit-day-10", checks);

  await page.getByRole("link", { name: /Revisit\s+Repair/i }).first().click();
  await page.waitForURL("**/upsc/geography/revisit?day=10", { timeout: 15000 });
  await page.getByText("Focused recovery", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "revisit-day-10", checks);

  const recoveryLines = [
    "Recall proof: Indian Monsoon requires ITCZ, jet streams, onset, break, retreat and variability.",
    "Explain proof: unequal heating shifts pressure, winds and rainfall through Arabian Sea and Bay branches.",
    "Map proof: Western Ghats, Himalaya, rain shadow and Bay branch must be placed on the India map.",
    "Trap proof: monsoon is not uniform, not only rainfall, and not explained by one pressure factor alone.",
    "Retest proof: I can now explain monsoon mechanism with map logic and one UPSC exception.",
  ];

  for (let index = 0; index < recoveryLines.length; index += 1) {
    await page.getByTestId("revisit-recovery-note").fill(recoveryLines[index]);
    await page.getByTestId("revisit-save-proof").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["10"];
        return (day?.recoveryProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: storageKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }
  await page.getByText("Recovery saved locally", { exact: false }).first().waitFor({ timeout: 15000 });

  const recoveredProgress = await getProgress(page, 10);
  if (recoveredProgress?.revisitQueued !== false || recoveredProgress?.confidence !== "Working") {
    throw new Error(`Revisit recovery did not persist correctly: ${JSON.stringify(recoveredProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await page.getByText("Track command, doubt, and revisit.", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-after-recovery", checks);

  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    queuedProgress,
    recoveredProgress,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors: consoleErrors.filter(
      (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
    ),
    pageErrors,
    passed:
      consoleErrors.every((message) => allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))) &&
      pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "geography-loop-wiring-final.png"), fullPage: true });
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
