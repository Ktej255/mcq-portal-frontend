const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-internal-security-society-progress-v1";
const evidencePath = path.join(__dirname, "internal-security-society-loop-e2e-evidence.json");
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

async function selectCommandDay(page, day, title) {
  await page.getByRole("button", { name: new RegExp(`Day\\s+${day}.*${title}`, "i") }).click();
  await page.getByText(`Day ${day} of 20`, { exact: false }).waitFor({ timeout: 15000 });
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

  await page.goto(`${baseUrl}/upsc/internal-security-society`, { waitUntil: "networkidle" });
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Watch\s+Class/i }).first().waitFor({ timeout: 15000 });
  await selectCommandDay(page, 4, "Terrorism and Radicalisation");
  await assertNoOverflow(page, "security-society-command-day-4", checks);

  await page.getByRole("link", { name: /Lab\s+Visual/i }).first().click();
  await page.waitForURL("**/upsc/internal-security-society/lab?mode=terrorism-response-grid&day=4", { timeout: 15000 });
  await page.getByText("Threat To Response", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "security-society-lab-day-4", checks);

  await page.getByRole("link", { name: /MCQ\s+Practice/i }).first().click();
  await page.waitForURL("**/upsc/internal-security-society/mcq-readiness?day=4", { timeout: 15000 });
  await page.getByText("Plan the fresh MCQ batch", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "security-society-mcq-readiness-day-4", checks);

  await page.getByRole("link", { name: /Internal Security and Indian Society command room/i }).first().click();
  await page.waitForURL("**/upsc/internal-security-society", { timeout: 15000 });
  await selectCommandDay(page, 4, "Terrorism and Radicalisation");
  await page.getByRole("link", { name: /Watch\s+Class/i }).first().click();
  await page.waitForURL("**/upsc/internal-security-society/watch?day=4", { timeout: 15000 });
  await page.getByText("Build the topic before testing", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "security-society-watch-day-4", checks);
  await page.getByRole("button", { name: /Play demo/i }).click();
  await page.getByText("Demo lesson running", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Complete and discuss/i }).click();
  await page.waitForURL("**/upsc/internal-security-society/talk?day=4", { timeout: 15000 });
  await page.getByText("Socratic Talk", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "security-society-talk-day-4", checks);
  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    "I watched Terrorism and Radicalisation, but I cannot explain ideology, recruitment, financing, intelligence response, legal safeguards, deradicalisation, and UPSC traps properly yet."
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByText("AI teacher assessment", { exact: false }).first().waitFor({ timeout: 15000 });

  const queuedProgress = await getProgress(page, 4);
  if (
    !queuedProgress?.watched ||
    !queuedProgress?.reflection ||
    queuedProgress.revisitQueued !== true ||
    !["Revisit", "Practice"].includes(queuedProgress.talkBand) ||
    !["revisit", "retry"].includes(queuedProgress.talkUnlockStage) ||
    typeof queuedProgress.talkScore !== "number"
  ) {
    throw new Error(`Security and Society Talk progress did not persist correctly: ${JSON.stringify(queuedProgress)}`);
  }

  await page.getByRole("link", { name: /Track\s+Progress/i }).first().click();
  await page.waitForURL("**/upsc/internal-security-society/track", { timeout: 15000 });
  await page.getByText("Track Internal Security and Indian Society command", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Day 4", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "security-society-track-with-revisit-day-4", checks);

  await page.getByRole("link", { name: /Revisit\s+Repair/i }).first().click();
  await page.waitForURL("**/upsc/internal-security-society/revisit?day=4", { timeout: 15000 });
  await page.getByText("Focused recovery", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "security-society-revisit-day-4", checks);
  await page.getByPlaceholder("Write the recovery note or corrected explanation here.").fill(
    "Recovered: Terrorism answer should connect ideology, recruitment, finance, technology, intelligence, legal limits, deradicalisation, and rehabilitation."
  );
  await page.getByRole("button", { name: /Mark recovered/i }).click();
  await page.getByText("Recovery saved locally", { exact: false }).first().waitFor({ timeout: 15000 });

  const recoveredProgress = await getProgress(page, 4);
  if (recoveredProgress?.revisitQueued !== false || recoveredProgress?.confidence !== "Working") {
    throw new Error(`Security and Society revisit recovery did not persist correctly: ${JSON.stringify(recoveredProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/internal-security-society/track`, { waitUntil: "networkidle" });
  await page.getByText("Track Internal Security and Indian Society command", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "security-society-track-after-recovery", checks);

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    queuedProgress,
    recoveredProgress,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "internal-security-society-loop-wiring-final.png"), fullPage: true });
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
