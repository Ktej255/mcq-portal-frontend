const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const contentKey = "sarit-upsc-content-command-v1";
const evidencePath = path.join(__dirname, "geography-content-handoff-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-content-handoff-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function waitForBodyText(page, text, label) {
  try {
    await page.waitForFunction(
      (expectedText) => document.body.innerText.toLowerCase().includes(expectedText.toLowerCase()),
      text,
      { timeout: 15000 }
    );
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      url: window.location.href,
      body: document.body.innerText.slice(0, 1200),
    }));
    throw new Error(`${label} missing text "${text}": ${JSON.stringify(diagnostic, null, 2)}\n${error.message}`);
  }
}

async function assertNoOverflowOrPrototypeText(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
      containsPrototypeWording: /Demo fallback|Play demo|Backend persistence|placeholder page|coming soon/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsOldBranding) throw new Error(`${label} still shows old branding.`);
  if (metrics.containsPrototypeWording) throw new Error(`${label} still shows prototype wording.`);
}

async function readGeographyContentPack(page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    const states = raw ? JSON.parse(raw) : {};
    const geographyEntries = Object.entries(states).filter(([entryKey]) => /^geography:D\d{2}$/.test(entryKey));
    const readyEntries = geographyEntries.filter(([, state]) => {
      return state.videoStatus === "Ready" && state.notesStatus === "Ready" && state.transcriptStatus === "Ready";
    });

    return {
      total: geographyEntries.length,
      ready: readyEntries.length,
      sampleDay1: states["geography:D01"],
      sampleDay30: states["geography:D30"],
    };
  }, contentKey);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  await page.addInitScript(() => {
    window.MOCK_TOKEN = "MOCK_TOKEN_geography_content_handoff";
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_content_handoff");
  });

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/upsc/content-command?subject=geography&day=1`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.getByTestId("content-subject-pack-command").waitFor({ timeout: 15000 });
  await waitForBodyText(page, "Geography: 0/30 classes ready", "content-pack-initial");
  await waitForBodyText(page, "Local simulator", "content-source-label");
  await assertNoOverflowOrPrototypeText(page, "content-command-initial", checks);

  await page.getByTestId("content-mark-subject-ready").click();
  await page.waitForFunction(
    (key) => {
      const states = JSON.parse(window.localStorage.getItem(key) || "{}");
      return Array.from({ length: 30 }, (_, index) => `geography:D${String(index + 1).padStart(2, "0")}`).every(
        (entryKey) =>
          states[entryKey]?.videoStatus === "Ready" &&
          states[entryKey]?.notesStatus === "Ready" &&
          states[entryKey]?.transcriptStatus === "Ready"
      );
    },
    contentKey,
    { timeout: 15000 }
  );
  await waitForBodyText(page, "Geography: 30/30 classes ready", "content-pack-ready");
  const packState = await readGeographyContentPack(page);
  await assertNoOverflowOrPrototypeText(page, "content-command-pack-ready", checks);

  await page.getByTestId("content-watch-route").click();
  await page.waitForURL("**/upsc/geography/watch?day=1", { timeout: 15000 });
  await page.getByTestId("watch-content-asset-gate").waitFor({ timeout: 15000 });
  await waitForBodyText(page, "Institutional content ready", "watch-content-ready-day-1");
  await waitForBodyText(page, "3/3 assets ready | Source: Local simulator", "watch-source-ready-day-1");
  await assertNoOverflowOrPrototypeText(page, "watch-day-1-content-ready", checks);

  await page.goto(`${baseUrl}/upsc/geography/watch?day=30`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("watch-content-asset-gate").waitFor({ timeout: 15000 });
  await waitForBodyText(page, "Geography Command Day", "watch-day-30-title");
  await waitForBodyText(page, "Institutional content ready", "watch-content-ready-day-30");
  await assertNoOverflowOrPrototypeText(page, "watch-day-30-content-ready", checks);

  await page.goto(`${baseUrl}/upsc/geography/mcq-readiness?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("mcq-readiness-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-csv-template-preview").waitFor({ timeout: 15000 });
  await waitForBodyText(page, "GEO-D01", "mcq-template-batch-code");
  await waitForBodyText(page, "Fresh MCQ slot: Earth basics and coordinates.", "mcq-template-test-command");
  const bulkUploadHref = await page.getByTestId("mcq-bulk-upload-route").getAttribute("href");
  if (bulkUploadHref !== "/admin/questions/bulk") {
    throw new Error(`Unexpected bulk upload href: ${bulkUploadHref}`);
  }
  await assertNoOverflowOrPrototypeText(page, "mcq-import-handoff", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    packState,
    checks,
    bulkUploadHref,
    finalUrl: `${baseUrl}/upsc/geography/mcq-readiness?day=1`,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
