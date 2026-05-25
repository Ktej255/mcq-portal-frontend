const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "science-tech-content-depth-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "science-tech-content-depth-final.png");
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

  await page.goto(`${baseUrl}/upsc/science-tech/watch?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("science-tech-watch-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "watch-pack-lens", "Data-to-decision digital governance frame"));
  findings.push(await expectText(page, "watch-case-anchor", "AI lifecycle audit"));
  findings.push(await expectText(page, "watch-science-scene", "Principle-to-impact chain"));
  await assertNoOverflow(page, "science-tech-watch-depth", checks);

  await page.goto(`${baseUrl}/upsc/science-tech/talk?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("science-tech-talk-teacher-pack").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "talk-rubric", "Science and Tech oral rubric"));
  findings.push(await expectText(page, "talk-trap", "Treating AI as magic instead of data, model, training, validation, deployment, and audit"));
  await assertNoOverflow(page, "science-tech-talk-depth", checks);

  await page.goto(`${baseUrl}/upsc/science-tech/lab?mode=digital-ai-lab&day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("science-tech-lab-evidence-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("science-tech-lab-selected-evidence").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "lab-evidence-title", "AI Lifecycle Audit"));
  findings.push(await expectText(page, "lab-proof-hint", "Name two safeguards before deployment and one after deployment"));
  await assertNoOverflow(page, "science-tech-lab-depth", checks);

  await page.goto(`${baseUrl}/upsc/science-tech/mcq-readiness?day=4`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("subject-mcq-shell").waitFor({ timeout: 15000 });
  findings.push(await expectText(page, "mcq-template-source", "FRESH_SCIENCE_TECH_AUTHORING"));
  findings.push(await expectText(page, "mcq-template-trap", "AI lifecycle sequence"));
  await assertNoOverflow(page, "science-tech-mcq-depth", checks);

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
