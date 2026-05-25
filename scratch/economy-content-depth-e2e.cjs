const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "economy-content-depth-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "economy-content-depth-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

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
    throw new Error(`${label} still shows old branding.`);
  }
}

async function expectText(page, label, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
  return { label, text };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const findings = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/upsc/economy/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("economy-watch-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "watch-pack-lens", "Macro circular flow"));
  findings.push(await expectText(page, "watch-case-anchor", "Household-firm income loop"));
  findings.push(await expectText(page, "watch-economy-scene", "Economic chain"));
  await assertNoOverflow(page, "economy-watch-depth", checks);

  await page.goto(`${baseUrl}/upsc/economy/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("economy-talk-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "talk-rubric", "Economy oral rubric"));
  findings.push(await expectText(page, "talk-trap", "Treating GDP, income, welfare, and development as identical"));
  await assertNoOverflow(page, "economy-talk-depth", checks);

  await page.goto(`${baseUrl}/upsc/economy/lab?mode=macro-flow-board&day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("economy-lab-evidence-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("economy-lab-selected-evidence").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "lab-evidence-title", "Household-Firm Loop"));
  findings.push(await expectText(page, "lab-proof-hint", "Use one line connecting income, output, consumption, and one leakage"));
  await assertNoOverflow(page, "economy-lab-depth", checks);

  await page.goto(`${baseUrl}/upsc/economy/mcq-readiness?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-mcq-shell").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mcq-template-source", "FRESH_ECONOMY_AUTHORING"));
  findings.push(await expectText(page, "mcq-template-trap", "nominal-real distinction"));
  await assertNoOverflow(page, "economy-mcq-depth", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    findings,
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
