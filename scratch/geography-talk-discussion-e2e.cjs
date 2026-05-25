const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-talk-discussion-e2e-evidence.json");
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

async function getProgress(page, day) {
  return page.evaluate(
    ({ storageKey: key, day: selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { storageKey, day }
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

  await page.goto(`${baseUrl}/upsc/geography/talk?day=6`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "6": {
          day: 6,
          watched: true,
          watchState: "Watched",
          watchMinutes: 75,
          watchSceneCompletedIds: ["6-briefing", "6-mechanism", "6-map", "6-trap", "6-recap"],
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, storageKey);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-initial", checks);

  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    "Ocean relief, salinity, temperature and currents affect climate and coastal effects. Currents matter for deserts, rainfall, fog and fisheries, but my map mechanism still needs correction."
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-peer-challenge").waitFor({ timeout: 15000 });
  await page.getByTestId("maic-discussion-turns").getByText("Peer Challenger", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Peer challenge pending", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-after-first-assessment", checks);

  const firstProgress = await getProgress(page, 6);
  if (
    !firstProgress?.talkTranscript?.length ||
    firstProgress?.talkDiscussionStep !== "challenge" ||
    typeof firstProgress?.talkPreliminaryScore !== "number" ||
    typeof firstProgress?.talkScore === "number"
  ) {
    throw new Error(`First discussion challenge did not persist: ${JSON.stringify(firstProgress)}`);
  }

  await page.getByTestId("talk-challenge-response").fill(
    [
      "The missing map proof is that ocean relief, salinity, temperature and currents work together.",
      "Cold currents on western continental margins reduce evaporation and help coastal deserts, while upwelling improves fisheries.",
      "Warm currents increase moisture and can affect rainfall near coasts.",
      "UPSC can trap by reversing warm and cold current locations or by saying salinity alone explains climate impact.",
    ].join(" ")
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-route-gate").getByText("Visual Lab required", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-after-challenge-reassessment", checks);

  const finalProgress = await getProgress(page, 6);
  if (
    !finalProgress?.talkChallengeResponse ||
    finalProgress?.talkDiscussionStep !== "verdict" ||
    !["lab", "mcq"].includes(finalProgress?.talkUnlockStage) ||
    !["Practice", "Command"].includes(finalProgress?.talkBand) ||
    finalProgress?.revisitQueued !== false
  ) {
    throw new Error(`Challenge reassessment did not persist correctly: ${JSON.stringify(finalProgress)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("talk-peer-challenge").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-discussion-mobile", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-talk-discussion-final.png"), fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    firstProgress,
    finalProgress,
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
