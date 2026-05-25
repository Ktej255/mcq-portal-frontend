const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "internal-security-society-content-depth-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "internal-security-society-content-depth-final.png");
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

  await page.goto(`${baseUrl}/upsc/internal-security-society/watch?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("internal-security-society-watch-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "watch-pack-lens", "Network-finance-ideology-response frame"));
  findings.push(await expectText(page, "watch-case-anchor", "Radicalisation prevention loop"));
  findings.push(await expectText(page, "watch-security-scene", "Cause-to-reform chain"));
  await assertNoOverflow(page, "security-society-watch-depth", checks);

  await page.goto(`${baseUrl}/upsc/internal-security-society/talk?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("internal-security-society-talk-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "talk-rubric", "Internal Security and Indian Society oral rubric"));
  findings.push(await expectText(page, "talk-trap", "Giving only a hard-security answer while ignoring prevention, grievance, and rehabilitation"));
  await assertNoOverflow(page, "security-society-talk-depth", checks);

  await page.goto(`${baseUrl}/upsc/internal-security-society/lab?mode=terrorism-response-grid&day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("internal-security-society-lab-evidence-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("internal-security-society-lab-selected-evidence").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "lab-evidence-title", "Radicalisation Prevention Loop"));
  findings.push(await expectText(page, "lab-proof-hint", "Give one hard-security and one social-prevention measure"));
  await assertNoOverflow(page, "security-society-lab-depth", checks);

  await page.goto(`${baseUrl}/upsc/internal-security-society/mcq-readiness?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-mcq-shell").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mcq-template-source", "FRESH_INTERNAL_SECURITY_SOCIETY_AUTHORING"));
  findings.push(await expectText(page, "mcq-template-trap", "terrorism-insurgency distinction"));
  await assertNoOverflow(page, "security-society-mcq-depth", checks);

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
