const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-environment-progress-v1";
const evidencePath = path.join(__dirname, "environment-watch-talk-depth-e2e-evidence.json");
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

async function getDayProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day }
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

  await page.goto(`${baseUrl}/upsc/environment/watch?day=5`, { waitUntil: "networkidle" });
  await page.evaluate((key) => window.localStorage.removeItem(key), progressKey);
  await page.reload({ waitUntil: "networkidle" });

  await page.getByTestId("environment-watch-teacher-pack").waitFor({ timeout: 15000 });
  await page.getByText("Map-linked biodiversity", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Kaziranga floodplain", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Cause chain", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-watch-depth-desktop", checks);

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("subject-watch-scene-complete").click();
  }

  const watchedProgress = await getDayProgress(page, 5);
  if (
    !watchedProgress?.watched ||
    watchedProgress.watchSceneCompletedIds?.length !== 5 ||
    !watchedProgress.watchSceneCompletedIds.includes("5-environment-handoff")
  ) {
    throw new Error(`Environment watch scenes did not persist correctly: ${JSON.stringify(watchedProgress)}`);
  }

  await page.goto(`${baseUrl}/upsc/environment/talk?day=5`, { waitUntil: "networkidle" });
  await page.getByTestId("environment-talk-teacher-pack").waitFor({ timeout: 15000 });
  await page.getByText("Environment oral rubric", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Peer challenge bank", { exact: false }).first().waitFor({ timeout: 15000 });

  await page.getByPlaceholder("Write the explanation in your own words. Start with concept, then mechanism, then example.").fill(
    "Protected Areas must be explained through location, habitat, species, legal category, threat and institution. Compare national parks, wildlife sanctuaries, biosphere reserves and conservation reserves because protected-area rules are not identical. In a Kaziranga floodplain example, floods renew grassland habitat but also create corridor and human-wildlife conflict questions. A Great Indian Bustard grassland case proves biodiversity is not forest-only protection. The mechanism is habitat fragmentation causing species pressure, then conservation response through corridors, IUCN status, protected area rules, sanctuary or biosphere categories and monitoring. The UPSC trap is assuming all protected areas have identical restrictions or that hotspot means only high species richness without endemism and threat."
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("subject-maic-discussion-turns").waitFor({ timeout: 15000 });
  await page.getByText("Use the Environment chain", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByText("Challenge through Map-linked biodiversity", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });

  const talkProgress = await getDayProgress(page, 5);
  if ((talkProgress?.talkScore ?? 0) < 70 || !talkProgress?.talkTranscript?.some((turn) => turn.message.includes("Environment chain"))) {
    throw new Error(`Environment Talk depth did not persist expected MAIC state: ${JSON.stringify(talkProgress)}`);
  }

  const routeHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (!routeHref?.includes("/upsc/environment/lab?")) {
    throw new Error(`Expected Talk to route to Environment lab before MCQ readiness, got ${routeHref}`);
  }

  await assertNoOverflow(page, "environment-talk-depth-desktop", checks);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${baseUrl}/upsc/environment/talk?day=5`, { waitUntil: "networkidle" });
  await page.getByTestId("environment-talk-teacher-pack").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-talk-depth-mobile", checks);

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    watchedProgress,
    talkScore: talkProgress?.talkScore,
    routeHref,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(__dirname, "environment-watch-talk-depth-final.png"), fullPage: true });
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
