const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "polity-governance-content-depth-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "polity-governance-content-depth-final.png");
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

  await page.goto(`${baseUrl}/upsc/polity-governance/watch?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("polity-governance-watch-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "watch-pack-lens", "Right-scope-restriction-remedy frame"));
  findings.push(await expectText(page, "watch-case-anchor", "Article 12 state definition"));
  findings.push(await expectText(page, "watch-polity-scene", "Article-to-governance chain"));
  await assertNoOverflow(page, "polity-watch-depth", checks);

  await page.goto(`${baseUrl}/upsc/polity-governance/talk?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("polity-governance-talk-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "talk-rubric", "Polity and Governance oral rubric"));
  findings.push(await expectText(page, "talk-trap", "Calling Fundamental Rights absolute without reasonable restrictions and public interest tests"));
  await assertNoOverflow(page, "polity-talk-depth", checks);

  await page.goto(`${baseUrl}/upsc/polity-governance/lab?mode=rights-justice-lab&day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("polity-governance-lab-evidence-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("polity-governance-lab-selected-evidence").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "lab-evidence-title", "Right Restriction Remedy Grid"));
  findings.push(await expectText(page, "lab-proof-hint", "Use Article 19 or Article 21 to show scope, restriction, and remedy"));
  await assertNoOverflow(page, "polity-lab-depth", checks);

  await page.goto(`${baseUrl}/upsc/polity-governance/mcq-readiness?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-mcq-shell").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mcq-template-source", "FRESH_POLITY_GOVERNANCE_AUTHORING"));
  findings.push(await expectText(page, "mcq-template-trap", "absolute-right trap"));
  await assertNoOverflow(page, "polity-mcq-depth", checks);

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
