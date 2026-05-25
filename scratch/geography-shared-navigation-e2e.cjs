const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-shared-navigation-e2e-evidence.json");
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

async function clickLoopNextDay(page) {
  await page.getByTestId("loop-next-day").click();
}

async function clickLoopPreviousDay(page) {
  await page.getByTestId("loop-previous-day").click();
}

async function expectHref(page, testId, expectedHref, checks, label) {
  const href = await page.getByTestId(testId).getAttribute("href");
  checks.push({ label, href });
  if (href !== expectedHref) {
    throw new Error(`${label} expected ${expectedHref}, got ${href}`);
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

  await page.goto(`${baseUrl}/upsc/geography/watch?day=10`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-command-route").waitFor({ timeout: 15000 });
  await expectHref(page, "loop-previous-day", "/upsc/geography/watch?day=9", checks, "watch-previous-href");
  await expectHref(page, "loop-next-day", "/upsc/geography/watch?day=11", checks, "watch-next-href");
  await expectHref(page, "loop-day-dashboard-route", "/upsc/geography?day=10", checks, "watch-dashboard-href");
  await page.getByTestId("loop-sequence-spine").getByText("Step 01", { exact: false }).waitFor({ timeout: 15000 });
  const trackHref = await page
    .getByTestId("loop-sequence-spine")
    .locator("a")
    .filter({ hasText: "Track" })
    .first()
    .getAttribute("href");
  if (trackHref !== "/upsc/geography/track?day=10") {
    throw new Error(`Track sequence should preserve selected day, got ${trackHref}`);
  }
  await assertNoOverflow(page, "watch-loop-navigation", checks);
  checks.push({ label: "watch-track-sequence-href", trackHref });
  await clickLoopNextDay(page);
  await page.waitForURL("**/upsc/geography/watch?day=11", { timeout: 15000 });
  checks.push({ label: "watch-next-day-url", url: page.url() });
  await clickLoopPreviousDay(page);
  await page.waitForURL("**/upsc/geography/watch?day=10", { timeout: 15000 });
  checks.push({ label: "watch-previous-day-url", url: page.url() });
  await page.getByTestId("loop-command-route").click();
  await page.waitForURL("**/upsc/geography?day=10", { timeout: 15000 });
  checks.push({ label: "watch-command-route-url", url: page.url() });

  await page.goto(`${baseUrl}/upsc/geography/talk?day=12`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-day-controls").waitFor({ timeout: 15000 });
  await expectHref(page, "loop-previous-day", "/upsc/geography/talk?day=11", checks, "talk-previous-href");
  await expectHref(page, "loop-next-day", "/upsc/geography/talk?day=13", checks, "talk-next-href");
  await assertNoOverflow(page, "talk-loop-navigation", checks);
  await clickLoopNextDay(page);
  await page.waitForURL("**/upsc/geography/talk?day=13", { timeout: 15000 });
  checks.push({ label: "talk-next-day-url", url: page.url() });
  await clickLoopPreviousDay(page);
  await page.waitForURL("**/upsc/geography/talk?day=12", { timeout: 15000 });
  checks.push({ label: "talk-previous-day-url", url: page.url() });

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=india-map&day=14`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-day-controls").waitFor({ timeout: 15000 });
  await expectHref(page, "loop-previous-day", "/upsc/geography/lab?mode=india-map&day=13", checks, "lab-previous-href");
  await expectHref(page, "loop-next-day", "/upsc/geography/lab?mode=india-map&day=15", checks, "lab-next-href");
  await assertNoOverflow(page, "lab-loop-navigation", checks);
  await clickLoopNextDay(page);
  await page.waitForURL("**/upsc/geography/lab?mode=india-map&day=15", { timeout: 15000 });
  checks.push({ label: "lab-next-day-url", url: page.url() });
  await clickLoopPreviousDay(page);
  await page.waitForURL("**/upsc/geography/lab?mode=india-map&day=14", { timeout: 15000 });
  checks.push({ label: "lab-previous-day-url", url: page.url() });

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=16`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-day-controls").waitFor({ timeout: 15000 });
  await expectHref(page, "loop-previous-day", "/upsc/geography/mcq-readiness?day=15", checks, "mcq-previous-href");
  await expectHref(page, "loop-next-day", "/upsc/geography/mcq-readiness?day=17", checks, "mcq-next-href");
  await assertNoOverflow(page, "mcq-loop-navigation", checks);
  await clickLoopNextDay(page);
  await page.waitForURL("**/upsc/geography/mcq-readiness?day=17", { timeout: 15000 });
  checks.push({ label: "mcq-next-day-url", url: page.url() });
  await clickLoopPreviousDay(page);
  await page.waitForURL("**/upsc/geography/mcq-readiness?day=16", { timeout: 15000 });
  checks.push({ label: "mcq-previous-day-url", url: page.url() });

  await page.goto(`${baseUrl}/upsc/geography/track?day=20`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-day-controls").waitFor({ timeout: 15000 });
  await expectHref(page, "loop-previous-day", "/upsc/geography/track?day=19", checks, "track-previous-href");
  await expectHref(page, "loop-next-day", "/upsc/geography/track?day=21", checks, "track-next-href");
  await assertNoOverflow(page, "track-loop-navigation", checks);
  await clickLoopNextDay(page);
  await page.waitForURL("**/upsc/geography/track?day=21", { timeout: 15000 });
  checks.push({ label: "track-next-day-url", url: page.url() });
  await page.goto(`${baseUrl}/upsc/geography/track?day=20`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await clickLoopPreviousDay(page);
  await page.waitForURL("**/upsc/geography/track?day=19", { timeout: 15000 });
  checks.push({ label: "track-previous-day-url", url: page.url() });

  await page.goto(`${baseUrl}/upsc/geography/revisit?day=18`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-day-controls").waitFor({ timeout: 15000 });
  await expectHref(page, "loop-previous-day", "/upsc/geography/revisit?day=17", checks, "revisit-previous-href");
  await expectHref(page, "loop-next-day", "/upsc/geography/revisit?day=19", checks, "revisit-next-href");
  await assertNoOverflow(page, "revisit-loop-navigation", checks);
  await clickLoopNextDay(page);
  await page.waitForURL("**/upsc/geography/revisit?day=19", { timeout: 15000 });
  checks.push({ label: "revisit-next-day-url", url: page.url() });
  await clickLoopPreviousDay(page);
  await page.waitForURL("**/upsc/geography/revisit?day=18", { timeout: 15000 });
  checks.push({ label: "revisit-previous-day-url", url: page.url() });

  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-previous-day-disabled").waitFor({ timeout: 15000 });
  await expectHref(page, "loop-next-day", "/upsc/geography/watch?day=2", checks, "watch-day-1-next-href");
  await assertNoOverflow(page, "watch-day-1-boundary", checks);

  await page.goto(`${baseUrl}/upsc/geography/watch?day=30`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-next-day-disabled").waitFor({ timeout: 15000 });
  await expectHref(page, "loop-previous-day", "/upsc/geography/watch?day=29", checks, "watch-day-30-previous-href");
  await assertNoOverflow(page, "watch-day-30-boundary", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("loop-day-controls").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-loop-navigation-mobile", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-shared-navigation-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
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
