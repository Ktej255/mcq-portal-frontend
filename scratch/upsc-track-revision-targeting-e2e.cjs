const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "upsc-track-revision-targeting-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "upsc-track-revision-targeting-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const subjectSlugs = [
  "geography",
  "environment",
  "disaster-management",
  "economy",
  "science-tech",
  "polity-governance",
  "internal-security-society",
  "history",
];

function progressKey(slug) {
  return `sarit-upsc-${slug}-progress-v1`;
}

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

async function clearAndSeed(page) {
  await page.goto(`${baseUrl}/upsc/daily-command`, { waitUntil: "domcontentloaded" });
  await page.evaluate((slugs) => {
    for (const slug of slugs) window.localStorage.removeItem(`sarit-upsc-${slug}-progress-v1`);
    window.localStorage.removeItem("sarit-upsc-content-command-v1");
    window.localStorage.removeItem("sarit-upsc-mcq-command-v1");
    window.localStorage.setItem(
      "sarit-upsc-environment-progress-v1",
      JSON.stringify({
        5: {
          day: 5,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["5-briefing", "5-mechanism", "5-application", "5-trap", "5-handoff"],
          talkScore: 74,
          talkBand: "Practice",
          talkUnlockStage: "lab",
          talkVerdict: "Visual Lab unlocked.",
          confidence: "Working",
          reflection: "Protected area classification needs applied proof before MCQ.",
          labMode: "biodiversity-map",
        },
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-polity-governance-progress-v1",
      JSON.stringify({
        2: {
          day: 2,
          watched: true,
          watchState: "Watched",
          watchSceneCompletedIds: ["2-briefing", "2-mechanism", "2-application", "2-trap", "2-handoff"],
          revisitQueued: true,
          talkScore: 35,
          talkBand: "Revisit",
          talkUnlockStage: "revisit",
          talkVerdict: "Revisit required.",
          activePromptLabel: "Article mapping",
          confidence: "Shaky",
          reflection: "The federalism article logic needs recovery.",
        },
      })
    );
  }, subjectSlugs);
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

  await clearAndSeed(page);

  await page.goto(`${baseUrl}/upsc/environment/track?day=5`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("track-focused-day").waitFor({ timeout: 15000 });
  await page.getByTestId("track-focused-day").getByText("Day 5", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("track-focused-day").getByText("Lab proof pending", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-track-focused-day", checks);
  await page.getByTestId("track-focused-route").click();
  await page.waitForURL("**/upsc/environment/lab?mode=biodiversity-map&day=5", { timeout: 15000 });
  checks.push({ label: "environment-track-focused-route", url: page.url() });

  await page.goto(`${baseUrl}/upsc/geography/track?day=10`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("geography-track-focused-day").waitFor({ timeout: 15000 });
  await page.getByTestId("geography-track-focused-day").getByText("Day 10", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "geography-track-focused-day", checks);

  await page.goto(`${baseUrl}/upsc/revision-command?subject=polity-governance&day=2`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByTestId("revision-target-focus").waitFor({ timeout: 15000 });
  await page.getByTestId("revision-target-focus").getByText("Polity and Governance Day 2", { exact: false }).waitFor({
    timeout: 15000,
  });
  await page.getByTestId("revision-target-focus").getByText("Revisit queued", { exact: false }).waitFor({
    timeout: 15000,
  });
  await assertNoOverflow(page, "revision-target-focus", checks);
  await page.getByTestId("revision-target-route").click();
  await page.waitForURL("**/upsc/polity-governance/revisit?day=2", { timeout: 15000 });
  checks.push({ label: "revision-target-route", url: page.url() });

  const seededPolity = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) || "{}")["2"], progressKey("polity-governance"));
  if (!seededPolity?.revisitQueued || seededPolity?.talkUnlockStage !== "revisit") {
    throw new Error(`Polity target seed was not preserved: ${JSON.stringify(seededPolity)}`);
  }

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
