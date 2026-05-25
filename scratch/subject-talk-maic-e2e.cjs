const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-talk-maic-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-talk-maic-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function storageKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

async function metrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  async function verifyEnvironmentTalk(viewportName, viewport) {
    const page = await browser.newPage({ viewport });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${viewportName}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${viewportName}] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/environment/talk?day=5`, { waitUntil: "domcontentloaded" });
    await page.evaluate((key) => window.localStorage.removeItem(key), storageKey("environment"));
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByTestId("talk-discussion-window").waitFor({ timeout: 15000 });
    await page.getByPlaceholder("Write the explanation", { exact: false }).fill(
      "Protected Areas in biodiversity include national parks, wildlife sanctuaries, biosphere reserves and conservation reserves. The mechanism is category, governance, permitted activities, institution, map location and ecology. In India, a tiger reserve or wetland example shows why UPSC mixes protected area rules with biodiversity, habitat, conservation, national park, sanctuary and location traps."
    );
    await page.getByRole("button", { name: /Assess explanation/i }).click();
    await page.getByTestId("subject-maic-discussion-turns").waitFor({ timeout: 15000 });
    await page.getByText("Peer Challenger", { exact: false }).first().waitFor({ timeout: 15000 });
    await page.getByTestId("subject-talk-peer-challenge").waitFor({ timeout: 15000 });

    await page.getByTestId("subject-talk-challenge-response").fill(
      "Peer challenge answer: compare national park, wildlife sanctuary, biosphere reserve and conservation reserve through governance, permitted activities, map location, institution and ecology. The UPSC trap is assuming all protected areas have the same rules or that conservation is only species protection."
    );
    await page.getByTestId("subject-talk-reassess-challenge").click();
    await page.getByText("Examiner verdict saved", { exact: false }).waitFor({ timeout: 15000 });

    const progress = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)["5"] : null;
    }, storageKey("environment"));
    const pageMetrics = await metrics(page);
    if (viewportName === "desktop") await page.screenshot({ path: screenshotPath, fullPage: true });
    checks.push({ viewport: viewportName, route: "environment-talk", progress, metrics: pageMetrics });

    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Environment Talk has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }
    if (!progress?.talkTranscript?.length || !progress?.talkChallengeResponse || !progress?.talkUnlockStage || !progress?.talkVerdict) {
      throw new Error(`Environment Talk MAIC state did not persist correctly: ${JSON.stringify(progress)}`);
    }

    await page.close();
  }

  async function verifyEconomyTalk() {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[economy] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[economy] ${error.message}`));

    await page.goto(`${baseUrl}/upsc/economy/talk?day=3`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("talk-discussion-window").waitFor({ timeout: 15000 });
    await page.getByPlaceholder("Write the explanation", { exact: false }).fill(
      "Inflation has concept, cause, mechanism, impact, policy response and India example. Demand, supply, monetary policy, fiscal policy, food prices and RBI action connect the economy topic with UPSC statement traps and current affairs."
    );
    await page.getByRole("button", { name: /Assess explanation/i }).click();
    await page.getByTestId("subject-maic-discussion-turns").waitFor({ timeout: 15000 });
    await page.getByText("UPSC Examiner", { exact: false }).first().waitFor({ timeout: 15000 });
    const pageMetrics = await metrics(page);
    checks.push({ viewport: "desktop", route: "economy-talk", metrics: pageMetrics });
    if (pageMetrics.hasHorizontalOverflow) {
      throw new Error(`Economy Talk has horizontal overflow: ${JSON.stringify(pageMetrics)}`);
    }

    await page.close();
  }

  await verifyEnvironmentTalk("desktop", { width: 1366, height: 900 });
  await verifyEnvironmentTalk("mobile", { width: 390, height: 844 });
  await verifyEconomyTalk();

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
