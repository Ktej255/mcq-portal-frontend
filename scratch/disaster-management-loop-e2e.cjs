const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-disaster-management-progress-v1";
const evidencePath = path.join(__dirname, "disaster-management-loop-e2e-evidence.json");
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
  await page.getByText(`Day ${day} of 11`, { exact: false }).waitFor({ timeout: 15000 });
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

  await page.goto(`${baseUrl}/upsc/disaster-management`, { waitUntil: "networkidle" });
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Watch\s+Class/i }).first().waitFor({ timeout: 15000 });
  await selectCommandDay(page, 4, "Floods and Urban Flooding");
  await assertNoOverflow(page, "disaster-command-day-4", checks);

  await page.getByRole("link", { name: /Lab\s+Visual/i }).first().click();
  await page.waitForURL("**/upsc/disaster-management/lab?mode=hazard-map&day=4", { timeout: 15000 });
  await page.getByText("India Hazard Board", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "disaster-lab-day-4", checks);

  await page.getByRole("link", { name: /MCQ\s+Practice/i }).first().click();
  await page.waitForURL("**/upsc/disaster-management/mcq-readiness?day=4", { timeout: 15000 });
  await page.getByText("Plan the fresh MCQ batch", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "disaster-mcq-readiness-day-4", checks);

  await page.getByRole("link", { name: /Disaster Management command room/i }).first().click();
  await page.waitForURL("**/upsc/disaster-management", { timeout: 15000 });
  await selectCommandDay(page, 4, "Floods and Urban Flooding");
  await page.getByRole("link", { name: /Watch\s+Class/i }).first().click();
  await page.waitForURL("**/upsc/disaster-management/watch?day=4", { timeout: 15000 });
  await page.getByText("Build the topic before testing", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "disaster-watch-day-4", checks);
  await page.getByRole("button", { name: /Play demo/i }).click();
  await page.getByText("Demo lesson running", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Complete and discuss/i }).click();
  await page.waitForURL("**/upsc/disaster-management/talk?day=4", { timeout: 15000 });
  await page.getByText("Socratic Talk", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "disaster-talk-day-4", checks);
  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    "I watched urban flooding, but I cannot explain drainage failure, encroachment, river basin logic, warning, mitigation, or UPSC traps properly yet."
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByText("AI teacher assessment", { exact: false }).first().waitFor({ timeout: 15000 });

  const queuedProgress = await getProgress(page, 4);
  if (
    !queuedProgress?.watched ||
    !queuedProgress?.reflection ||
    queuedProgress.revisitQueued !== true ||
    queuedProgress.talkBand !== "Revisit" ||
    typeof queuedProgress.talkScore !== "number"
  ) {
    throw new Error(`Disaster Talk progress did not persist correctly: ${JSON.stringify(queuedProgress)}`);
  }

  await page.getByRole("link", { name: /Track\s+Progress/i }).first().click();
  await page.waitForURL("**/upsc/disaster-management/track", { timeout: 15000 });
  await page.getByText("Track Disaster Management command", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Day 4", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "disaster-track-with-revisit-day-4", checks);

  await page.getByRole("link", { name: /Revisit\s+Repair/i }).first().click();
  await page.waitForURL("**/upsc/disaster-management/revisit?day=4", { timeout: 15000 });
  await page.getByText("Focused recovery", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "disaster-revisit-day-4", checks);
  await page.getByPlaceholder("Write the recovery note or corrected explanation here.").fill(
    "Recovered: urban flood answer should connect rainfall, drainage, encroachment, land use, warning, evacuation, and resilient city planning."
  );
  await page.getByRole("button", { name: /Mark recovered/i }).click();
  await page.getByText("Recovery saved locally", { exact: false }).first().waitFor({ timeout: 15000 });

  const recoveredProgress = await getProgress(page, 4);
  if (recoveredProgress?.revisitQueued !== false || recoveredProgress?.confidence !== "Working") {
    throw new Error(`Disaster revisit recovery did not persist correctly: ${JSON.stringify(recoveredProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/disaster-management/track`, { waitUntil: "networkidle" });
  await page.getByText("Track Disaster Management command", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "disaster-track-after-recovery", checks);

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
  await page.screenshot({ path: path.join(__dirname, "disaster-management-loop-wiring-final.png"), fullPage: true });
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
