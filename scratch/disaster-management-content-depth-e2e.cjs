const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "disaster-management-content-depth-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "disaster-management-content-depth-final.png");
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

  await page.goto(`${baseUrl}/upsc/disaster-management/watch?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("disaster-management-watch-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "watch-pack-lens", "Risk equation and resilience frame"));
  findings.push(await expectText(page, "watch-case-anchor", "Sendai risk-reduction logic"));
  findings.push(await expectText(page, "watch-disaster-scene", "Risk-reduction chain"));
  await assertNoOverflow(page, "disaster-watch-depth", checks);

  await page.goto(`${baseUrl}/upsc/disaster-management/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("disaster-management-talk-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "talk-rubric", "Disaster Management oral rubric"));
  findings.push(await expectText(page, "talk-trap", "Treating a hazard as a disaster without checking exposure and vulnerability"));
  await assertNoOverflow(page, "disaster-talk-depth", checks);

  await page.goto(`${baseUrl}/upsc/disaster-management/lab?mode=risk-matrix&day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("disaster-management-lab-evidence-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("disaster-management-lab-selected-evidence").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "lab-evidence-title", "Risk Equation Board"));
  findings.push(await expectText(page, "lab-proof-hint", "Write one line separating hazard, exposure, vulnerability, and capacity"));
  await assertNoOverflow(page, "disaster-lab-depth", checks);

  await page.goto(`${baseUrl}/upsc/disaster-management/mcq-readiness?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-mcq-shell").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mcq-template-source", "FRESH_DISASTER_MANAGEMENT_AUTHORING"));
  findings.push(await expectText(page, "mcq-template-trap", "hazard versus disaster"));
  await assertNoOverflow(page, "disaster-mcq-depth", checks);

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
