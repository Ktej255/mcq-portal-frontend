const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-earth-lab-depth-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-earth-lab-depth-final.png");
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

  await page.addInitScript(() => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_earth_lab_depth");
  });

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=earth-layers&day=3`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("earth-seismic-cutaway").waitFor({ timeout: 15000 });
  await page.getByTestId("earth-seismic-ray-map").waitFor({ timeout: 15000 });
  await page.getByTestId("earth-seismic-evidence-console").getByText("Wave behavior", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("earth-seismic-evidence-console").getByText("Hazard link", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("earth-seismic-evidence-console").getByText("UPSC trap", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "earth-lab-initial-desktop", checks);

  await page.getByTestId("earth-layer-outer-core").click();
  await page.getByTestId("earth-active-ray-label").getByText("S-wave block", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("S-waves stop here", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("liquid outer core", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "earth-lab-outer-core-desktop", checks);

  await page.getByTestId("earth-layer-mantle").click();
  await page.getByTestId("earth-active-ray-label").getByText("Refraction zone", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("Mantle convection supplies", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "earth-lab-mantle-desktop", checks);

  const desktopBox = await page.getByTestId("earth-seismic-cutaway").boundingBox();
  const rayBox = await page.getByTestId("earth-seismic-ray-map").boundingBox();
  const consoleBox = await page.getByTestId("earth-seismic-evidence-console").boundingBox();
  checks.push({ label: "earth-lab-depth-boxes", desktopBox, rayBox, consoleBox });
  if (!desktopBox?.width || !rayBox?.width || !consoleBox?.width) {
    throw new Error(`Earth lab depth elements did not render with dimensions: ${JSON.stringify({ desktopBox, rayBox, consoleBox })}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/lab?mode=earth-layers&day=3`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("earth-seismic-evidence-console").waitFor({ timeout: 15000 });
  await page.getByTestId("earth-layer-inner-core").click();
  await page.getByTestId("earth-active-ray-label").getByText("Core proof", { exact: true }).waitFor({ timeout: 15000 });
  await page.getByText("pressure is decisive", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "earth-lab-mobile", checks);
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
