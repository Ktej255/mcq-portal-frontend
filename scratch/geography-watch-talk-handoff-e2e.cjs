const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-watch-talk-handoff-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-watch-talk-handoff-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function readProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => JSON.parse(window.localStorage.getItem(key) || "{}")[String(selectedDay)],
    { key: storageKey, selectedDay: day }
  );
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

  await page.goto(`${baseUrl}/upsc/geography/watch?day=13`, { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("watch-demo-player").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-talk-handoff-packet").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-handoff-initial", checks);

  await page.getByTestId("watch-load-handoff").click();
  const loadedHandoff = await page.getByTestId("watch-handoff-draft").inputValue();
  if (!loadedHandoff.includes("Concept:") || !loadedHandoff.includes("UPSC trap:")) {
    throw new Error(`Watch handoff did not load correctly: ${loadedHandoff}`);
  }

  await page.getByTestId("watch-save-handoff").click();
  await page.waitForFunction(
    ({ key }) => {
      const day = JSON.parse(window.localStorage.getItem(key) || "{}")["13"];
      return day?.watchHandoffReady === true && typeof day?.watchHandoffSummary === "string";
    },
    { key: storageKey },
    { timeout: 15000 }
  );

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("watch-scene-complete").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["13"];
        return (day?.watchSceneCompletedIds?.length ?? 0) >= expected;
      },
      { key: storageKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  await page.getByTestId("watch-route-gate").getByText("AI teacher unlocked", { exact: false }).waitFor({ timeout: 15000 });
  const watchProgress = await readProgress(page, 13);
  if (
    watchProgress?.watched !== true ||
    watchProgress?.watchState !== "Watched" ||
    watchProgress?.watchHandoffReady !== true ||
    !watchProgress?.watchHandoffSummary?.includes("Concept:") ||
    !watchProgress?.watchHandoffSummary?.includes("UPSC trap:")
  ) {
    throw new Error(`Watch handoff did not persist with scene proof: ${JSON.stringify(watchProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "watch-handoff-complete", checks);

  await page.getByTestId("watch-primary-route").click();
  await page.waitForURL("**/upsc/geography/talk?day=13", { timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Awaiting MAIC oral check", { exact: false }).waitFor({ timeout: 15000 });
  const talkDraft = await page.getByTestId("talk-answer-draft").inputValue();
  if (!talkDraft.includes("Concept:") || !talkDraft.includes("UPSC trap:")) {
    throw new Error(`Talk did not preload Watch handoff: ${talkDraft}`);
  }
  await assertNoOverflow(page, "talk-prefilled-from-watch", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/watch?day=13`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("watch-talk-handoff-packet").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "watch-handoff-mobile", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    watchProgress,
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
