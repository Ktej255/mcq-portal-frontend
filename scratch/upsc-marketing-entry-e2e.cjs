const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "upsc-marketing-entry-evidence.json");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function collectMetrics(page, label) {
  return page.evaluate((metricLabel) => {
    const bodyText = document.body.innerText;
    return {
      label: metricLabel,
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding:
        bodyText.includes("AntiGravity") ||
        bodyText.includes("ANTIGRAVITY") ||
        bodyText.toLowerCase().includes("antigravity"),
      containsUpscCommand: bodyText.includes("UPSC Command"),
    };
  }, label);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("MOCK_TOKEN");
    localStorage.removeItem("sarit-upsc-access-pass-v1");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "UPSC Command", exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /Activate local UPSC access/i }).waitFor({ timeout: 15000 });

  const entryMetrics = await collectMetrics(page, "desktop-marketing-entry");
  checks.push(entryMetrics);
  await page.screenshot({ path: path.join(__dirname, "upsc-marketing-entry.png"), fullPage: true });

  if (entryMetrics.containsOldBranding) {
    throw new Error("Marketing entry still contains old AntiGravity branding.");
  }
  if (!entryMetrics.containsUpscCommand) {
    throw new Error("Marketing entry does not show UPSC Command.");
  }
  if (entryMetrics.hasHorizontalOverflow) {
    throw new Error(`Marketing entry has horizontal overflow: ${JSON.stringify(entryMetrics)}`);
  }

  await page.getByRole("button", { name: /Activate local UPSC access/i }).click();
  await page.waitForURL(`${baseUrl}/upsc`, { timeout: 15000 });
  await page.getByText("UPSC self-study profile", { exact: false }).waitFor({ timeout: 15000 });

  const storedAccess = await page.evaluate(() => {
    const rawPass = localStorage.getItem("sarit-upsc-access-pass-v1");
    return {
      token: localStorage.getItem("MOCK_TOKEN"),
      pass: rawPass ? JSON.parse(rawPass) : null,
      bodyText: document.body.innerText,
    };
  });

  checks.push({
    label: "local-access-routing",
    url: page.url(),
    tokenPresent: Boolean(storedAccess.token && storedAccess.token.startsWith("MOCK_TOKEN")),
    passStatus: storedAccess.pass?.status,
    passProduct: storedAccess.pass?.product,
    landedOnUpsc: storedAccess.bodyText.includes("UPSC self-study profile"),
    containsOldBranding:
      storedAccess.bodyText.includes("AntiGravity") ||
      storedAccess.bodyText.includes("ANTIGRAVITY") ||
      storedAccess.bodyText.toLowerCase().includes("antigravity"),
  });

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await mobile.getByRole("heading", { name: "UPSC Command", exact: true }).waitFor({ timeout: 15000 });
  const mobileMetrics = await collectMetrics(mobile, "mobile-marketing-entry");
  checks.push(mobileMetrics);
  await mobile.screenshot({ path: path.join(__dirname, "upsc-marketing-entry-mobile.png"), fullPage: true });

  if (mobileMetrics.hasHorizontalOverflow) {
    throw new Error(`Mobile marketing entry has horizontal overflow: ${JSON.stringify(mobileMetrics)}`);
  }
  if (mobileMetrics.containsOldBranding) {
    throw new Error("Mobile marketing entry still contains old AntiGravity branding.");
  }

  await browser.close();

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
    passed:
      blockingConsoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      checks.every((check) => !check.containsOldBranding) &&
      checks.every((check) => check.hasHorizontalOverflow !== true),
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
