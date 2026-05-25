const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";

const blockedText = [
  "Network Error",
  "Critical Error",
  "Command Sync Failed",
  "Verification Failed",
  "Forensic Debug Mode",
  "History fetch failed",
];

async function verifyRoute(page, path, expectedText) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  const text = await page.locator("body").innerText();
  for (const blocked of blockedText) {
    if (text.includes(blocked)) {
      throw new Error(`${path} exposed blocked failure text: ${blocked}`);
    }
  }
  if (expectedText && !text.includes(expectedText)) {
    throw new Error(`${path} did not contain expected text: ${expectedText}`);
  }
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 2) {
    throw new Error(`${path} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  return { path, ok: true };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  checks.push(await verifyRoute(page, "/dashboard", "Earth as a System"));
  checks.push(await verifyRoute(page, "/upsc", "Earth as a System"));
  checks.push(await verifyRoute(page, "/tests", "Start with today's MCQ only"));
  checks.push(await verifyRoute(page, "/revision", "Your next revision is after practice"));
  checks.push(await verifyRoute(page, "/history", "Your path is just starting"));
  checks.push(await verifyRoute(page, "/reports", "No real gap yet"));
  await browser.close();
  console.log(JSON.stringify({ baseUrl, checks, passed: true }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
