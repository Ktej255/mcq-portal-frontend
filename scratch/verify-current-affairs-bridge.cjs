const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const evidencePath = path.join(__dirname, "verify-current-affairs-bridge-evidence.json");

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

async function seedProgress(page, progress) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, seededProgress }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_current_affairs_bridge");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
          studyWindow: "90",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      window.localStorage.removeItem(progressStorageKey);
      if (seededProgress) {
        window.localStorage.setItem(progressStorageKey, JSON.stringify(seededProgress));
      }
    },
    { profileStorageKey: profileKey, progressStorageKey: progressKey, seededProgress: progress }
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedProgress(page, null);
  await page.goto(`${baseUrl}/upsc/current-affairs`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-affairs-hero").waitFor({ timeout: 15000 });
  const initialUnlockedCards = await page.getByTestId("upsc-current-affairs-card").count();
  const initialNextUnlockText = await page.getByTestId("upsc-current-affairs-next-unlock").innerText();
  checks.push({ label: "initial-locked-state", initialUnlockedCards, initialNextUnlockText });
  if (initialUnlockedCards !== 0 || !initialNextUnlockText.includes("Day 2")) {
    throw new Error(`initial-locked-state failed: ${JSON.stringify({ initialUnlockedCards, initialNextUnlockText })}`);
  }
  await assertNoOverflow(page, "current-affairs-initial-desktop", checks);

  await seedProgress(page, {
    5: {
      day: 5,
      watched: true,
      talkScore: 82,
      updatedAt: new Date().toISOString(),
    },
    6: {
      day: 6,
      reflection: "Ocean currents and marine heatwaves are linked.",
      updatedAt: new Date().toISOString(),
    },
  });
  await page.goto(`${baseUrl}/upsc/current-affairs`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-affairs-hero").waitFor({ timeout: 15000 });
  await page.getByText("Monsoon variability", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByText("Marine heatwaves", { exact: false }).waitFor({ timeout: 15000 });
  const unlockedCards = await page.getByTestId("upsc-current-affairs-card").evaluateAll((cards) =>
    cards.map((card) => ({
      linkedDay: card.getAttribute("data-linked-day"),
      unlocked: card.getAttribute("data-unlocked"),
      text: card.textContent || "",
    }))
  );
  const hasWrongUnlock = unlockedCards.some((card) => card.unlocked !== "true" || !["5", "6"].includes(card.linkedDay));
  checks.push({ label: "covered-topic-unlocks-only-linked-hooks", unlockedCards });
  if (unlockedCards.length !== 2 || hasWrongUnlock) {
    throw new Error(`covered-topic-unlocks-only-linked-hooks failed: ${JSON.stringify(unlockedCards)}`);
  }
  await assertNoOverflow(page, "current-affairs-unlocked-desktop", checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/current-affairs`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("upsc-current-affairs-hero").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "current-affairs-mobile", checks);

  const evidence = {
    baseUrl,
    checks,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    passed: consoleErrors.length === 0 && pageErrors.length === 0,
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
