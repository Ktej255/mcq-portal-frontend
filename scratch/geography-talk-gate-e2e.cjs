const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const storageKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "geography-talk-gate-e2e-evidence.json");
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

  await page.goto(`${baseUrl}/upsc/geography/talk?day=3`, { waitUntil: "networkidle" });
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        "3": {
          day: 3,
          watched: true,
          watchState: "Watched",
          watchMinutes: 75,
          watchSceneCompletedIds: ["3-briefing", "3-mechanism", "3-map", "3-trap", "3-recap"],
          updatedAt: new Date().toISOString(),
        },
      })
    );
  }, storageKey);
  await page.reload({ waitUntil: "networkidle" });

  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("talk-route-gate").getByText("Awaiting MAIC oral check", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-gate-initial-desktop", checks);

  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    "I am confused about this lesson and cannot explain the idea clearly enough for class."
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-route-gate").getByText("MCQ locked: revisit first", { exact: false }).waitFor({ timeout: 15000 });

  const lockedHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (lockedHref !== "/upsc/geography/revisit?day=3") {
    throw new Error(`Expected revisit route after weak answer, got ${lockedHref}`);
  }

  const weakProgress = await getProgress(page, 3);
  if (
    weakProgress?.confidence !== "Shaky" ||
    weakProgress?.revisitQueued !== true ||
    weakProgress?.talkBand !== "Revisit" ||
    typeof weakProgress?.talkScore !== "number"
  ) {
    throw new Error(`Weak answer did not persist the revisit gate: ${JSON.stringify(weakProgress)}`);
  }

  await page.getByPlaceholder("Write the explanation in your own words.").fill(
    [
      "Plate tectonics explains why earthquakes, volcanoes and mountains are not randomly distributed.",
      "Lithospheric plates move over the asthenosphere because convection and slab pull create the mechanism of drift.",
      "At divergent boundaries sea-floor spreading builds mid ocean ridges, at convergent boundaries trenches, subduction and fold mountains form, and at transform boundaries earthquakes occur.",
      "On a map these belts match plate boundaries such as the Himalaya, Andes, Pacific Ring of Fire, Indian plate collision, ridges and trenches.",
      "UPSC trap: continental drift evidence is not the same as the present plate boundary type, so every statement needs location, relief, cause and effect.",
    ].join(" ")
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-route-gate").getByText("Peer challenge pending", { exact: false }).waitFor({ timeout: 15000 });
  const pendingHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (pendingHref !== null) {
    throw new Error(`Expected no route before peer challenge verdict, got ${pendingHref}`);
  }

  await page.getByTestId("talk-challenge-response").fill(
    [
      "The challenge answer is that plate tectonics must be proved through boundary evidence and map distribution.",
      "Divergent boundaries create mid-ocean ridges and sea-floor spreading, convergent boundaries create trenches, subduction, fold mountains and volcanoes, and transform boundaries create earthquakes.",
      "India example: Himalaya forms from Indian plate and Eurasian plate collision, while the Pacific Ring of Fire links subduction, volcanoes and earthquakes.",
      "UPSC trap: continental drift evidence, present plate boundary type and earthquake belt should not be mixed without location and mechanism.",
    ].join(" ")
  );
  await page.getByTestId("talk-reassess-challenge").click();
  await page.getByTestId("talk-route-gate").getByText("Visual Lab required", { exact: false }).waitFor({ timeout: 15000 });

  const unlockedHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (unlockedHref !== "/upsc/geography/lab?mode=earth-layers&day=3") {
    throw new Error(`Expected Visual Lab route after strong answer with no lab proof, got ${unlockedHref}`);
  }

  const strongProgress = await getProgress(page, 3);
  if (
    strongProgress?.confidence === "Shaky" ||
    strongProgress?.revisitQueued !== false ||
    !["Practice", "Command"].includes(strongProgress?.talkBand) ||
    typeof strongProgress?.talkScore !== "number"
  ) {
    throw new Error(`Strong answer did not pass the Talk gate: ${JSON.stringify(strongProgress)}`);
  }

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/geography/lab?mode=earth-layers&day=3", { timeout: 15000 });
  await page.getByText("Earth Layers Lab", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "lab-after-talk-pass-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/geography/talk?day=3`, { waitUntil: "networkidle" });
  await page.getByText("AI teacher oral check", { exact: false }).first().waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "talk-gate-mobile", checks);

  await page.screenshot({ path: path.join(__dirname, "geography-talk-gate-final.png"), fullPage: true });

  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    lockedHref,
    unlockedHref,
    weakProgress,
    strongProgress,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors: consoleErrors.filter(
      (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
    ),
    pageErrors,
    passed:
      consoleErrors.every((message) => allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))) &&
      pageErrors.length === 0,
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
