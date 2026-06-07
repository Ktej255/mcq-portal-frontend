const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const contentKey = "sarit-upsc-content-command-v1";
const profileKey = "sarit-upsc-student-profile-v1";
const evidencePath = path.join(__dirname, "geography-week3-content-pack-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-week3-content-pack-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const weekThreeChecks = [
  [15, "Population Geography"],
  [16, "Settlements"],
  [17, "Economic Activities"],
  [18, "Transport and Trade"],
  [19, "Industry Location"],
  [20, "Regional Development"],
  [21, "Human Geography Consolidation"],
];

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
    throw new Error(`${label} still contains old protected branding.`);
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

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(({ key, studentProfileKey }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_geography_week3_content_pack");
    window.localStorage.removeItem(key);
    window.localStorage.setItem(studentProfileKey, JSON.stringify({
      level: "beginner",
      preparationStage: "not-started",
      studyWindow: "60",
      learningStyle: "mixed",
      weakSignal: "retention",
      studyTime: "morning",
      attemptHistory: "no-attempt",
      learningPattern: "deep-work",
      mindState: "calm",
      updatedAt: new Date().toISOString(),
    }));
  }, { key: contentKey, studentProfileKey: profileKey });

  for (const [day, title] of weekThreeChecks) {
    await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=${day}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.getByTestId("content-pack-preview").locator("h3").filter({ hasText: title }).waitFor({ timeout: 15000 });
    await page.getByTestId("content-pack-preview").locator("p").filter({ hasText: "UPSC trap" }).first().waitFor({ timeout: 15000 });
    await page.getByText("STAGED LOCAL", { exact: true }).waitFor({ timeout: 15000 });
    await assertNoOverflow(page, `content-command-week3-day-${day}`, checks);
  }

  await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=22`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByTestId("content-pack-preview").locator("h3").filter({ hasText: "Atlas Mastery" }).waitFor({ timeout: 15000 });
  await page.getByText("STAGED LOCAL", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "content-command-day22-adjacent-pack", checks);

  await page.goto(`${baseUrl}/upsc/geography/watch?day=18`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-topic-duration").filter({ hasText: "12 min topic" }).waitFor({ timeout: 15000 });
  await page.getByTestId("watch-topic-player").getByText("Transport and Trade", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByTestId("geography-watch-checkpoints").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day18-week3-pack", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=21`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-topic-player").getByText("Human Geography Consolidation", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-day21-week3-pack-mobile", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

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
