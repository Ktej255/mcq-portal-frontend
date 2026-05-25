const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-geography-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const evidencePath = path.join(__dirname, "geography-track-diagnostics-e2e-evidence.json");
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

async function seedTrackState(page) {
  await page.evaluate(
    ({ progressKey: pKey, mcqKey: mKey }) => {
      window.localStorage.setItem(
        pKey,
        JSON.stringify({
          "2": {
            day: 2,
            watched: true,
            watchState: "Watched",
            watchMinutes: 90,
            confidence: "Working",
            updatedAt: new Date().toISOString(),
          },
          "3": {
            day: 3,
            watched: true,
            watchState: "Watched",
            watchMinutes: 90,
            confidence: "Shaky",
            reflection: "Weak explanation that needs repair.",
            revisitQueued: true,
            talkBand: "Revisit",
            talkScore: 25,
            activePromptLabel: "Explain",
            updatedAt: new Date().toISOString(),
          },
          "4": {
            day: 4,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            confidence: "Command",
            reflection: "Strong command explanation.",
            revisitQueued: false,
            talkBand: "Command",
            talkScore: 82,
            labCompleted: true,
            labMode: "india-map",
            labInsight: "Map logic saved for MCQ practice.",
            updatedAt: new Date().toISOString(),
          },
          "5": {
            day: 5,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            confidence: "Working",
            reflection: "Practice-level explanation.",
            revisitQueued: false,
            talkBand: "Practice",
            talkScore: 76,
            labCompleted: true,
            labMode: "india-map",
            labInsight: "Relief and drainage lab saved.",
            updatedAt: new Date().toISOString(),
          },
          "6": {
            day: 6,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            confidence: "Working",
            reflection: "Practice-level ocean explanation.",
            revisitQueued: false,
            talkBand: "Practice",
            talkScore: 74,
            labCompleted: true,
            labMode: "monsoon",
            labInsight: "Current and climate lab saved.",
            updatedAt: new Date().toISOString(),
          },
          "7": {
            day: 7,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            confidence: "Working",
            reflection: "Practice-level geomorphology explanation.",
            revisitQueued: false,
            talkBand: "Practice",
            talkScore: 75,
            updatedAt: new Date().toISOString(),
          },
        })
      );
      window.localStorage.setItem(
        mKey,
        JSON.stringify({
          "GEO-D04": {
            planned: 25,
            drafted: 25,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
          "GEO-D05": {
            planned: 25,
            drafted: 5,
            difficulty: "MEDIUM",
            status: "DRAFT",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    { progressKey, mcqKey }
  );
}

async function expectDay(page, day, expectedText, expectedHref) {
  const card = page.getByTestId(`track-day-${day}`);
  await card.getByText(expectedText, { exact: false }).first().waitFor({ timeout: 15000 });
  const href = await card.getAttribute("href");
  if (href !== expectedHref) {
    throw new Error(`Day ${day} expected href ${expectedHref}, got ${href}`);
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

  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await seedTrackState(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Geography sprint state", { exact: false }).first().waitFor({ timeout: 15000 });

  await expectDay(page, 1, "Watch pending", "/upsc/geography/watch?day=1");
  await expectDay(page, 2, "Talk pending", "/upsc/geography/talk?day=2");
  await expectDay(page, 3, "Revisit required", "/upsc/geography/revisit?day=3");
  await expectDay(page, 4, "MCQ batch ready", "/upsc/geography/mcq-readiness?day=4");
  await expectDay(page, 5, "MCQ drafting", "/upsc/geography/mcq-readiness?day=5");
  await expectDay(page, 6, "Fresh MCQ needed", "/upsc/geography/mcq-readiness?day=6");
  await expectDay(page, 7, "Lab pending", "/upsc/geography/lab?mode=earth-layers&day=7");
  await page.getByText("Talk passed", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Lab completed", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Blocked days", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-diagnostics-desktop", checks);

  await page.getByTestId("track-day-3").click();
  await page.waitForURL("**/upsc/geography/revisit?day=3", { timeout: 15000 });
  await page.getByText("Focused recovery", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-day-3-routes-revisit", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/track`, { waitUntil: "networkidle" });
  await page.getByText("Geography sprint state", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "track-diagnostics-mobile", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-track-diagnostics-final.png"), fullPage: true });

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
