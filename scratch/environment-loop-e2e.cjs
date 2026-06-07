const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const storageKey = "sarit-upsc-environment-progress-v1";
const evidencePath = path.join(__dirname, "environment-loop-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "environment-loop-wiring-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function seedProfile(page) {
  await page.addInitScript((studentProfileKey) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_environment_loop");
    window.localStorage.setItem(
      studentProfileKey,
      JSON.stringify({
        level: "advanced",
        studyWindow: "120",
        learningStyle: "mixed",
        weakSignal: "retention",
        studyTime: "morning",
        updatedAt: new Date().toISOString(),
      })
    );
  }, profileKey);
}

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
    throw new Error(`${label} contains old protected branding.`);
  }
}

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: storageKey, selectedDay: day }
  );
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await seedProfile(page);

  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const day = 5;

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}/upsc/environment?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("subject-simple-student-flow").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-command-action-route").waitFor({ timeout: 15000 });
  const commandHref = await page.getByTestId("subject-command-action-route").getAttribute("href");
  if (commandHref !== `/upsc/environment/talk?day=${day}`) {
    throw new Error(`Environment command should start with Talk, got ${commandHref}`);
  }
  await assertNoOverflow(page, "environment-command-v2", checks);

  await page.getByTestId("subject-command-action-route").click();
  await page.waitForURL(`**/upsc/environment/talk?day=${day}`, { timeout: 15000 });
  await page.getByTestId("subject-talk-simple-step").waitFor({ timeout: 15000 });
  await page.getByPlaceholder("Write the explanation in your own words", { exact: false }).fill(
    "Protected areas are categories of conservation, but I cannot yet explain the legal rules, governance, map location, species threat, habitat logic and UPSC exception clearly."
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-primary-route").getByText("Open class", { exact: false }).waitFor({ timeout: 15000 });
  const firstTalkHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (firstTalkHref !== `/upsc/environment/watch?day=${day}`) {
    throw new Error(`Weak first recall should repair through Watch, got ${firstTalkHref}`);
  }
  const firstTalkProgress = await getProgress(page, day);
  if (!firstTalkProgress?.talkNextRoute?.includes("/watch") || firstTalkProgress?.revisitQueued) {
    throw new Error(`Weak pre-repair recall should not queue revisit yet: ${JSON.stringify(firstTalkProgress)}`);
  }
  await assertNoOverflow(page, "environment-talk-first-recall", checks);

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL(`**/upsc/environment/watch?day=${day}`, { timeout: 15000 });
  await page.getByTestId("subject-watch-simple-repair").waitFor({ timeout: 15000 });
  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(`**/upsc/environment/talk?day=${day}`, { timeout: 15000 });
  const watchProgress = await getProgress(page, day);
  if (!watchProgress?.watched || watchProgress?.watchSceneCompletedIds?.length < 5) {
    throw new Error(`Watch repair did not persist: ${JSON.stringify(watchProgress)}`);
  }
  await assertNoOverflow(page, "environment-watch-repair", checks);

  await page.getByTestId("subject-talk-simple-step").waitFor({ timeout: 15000 });
  await page.getByPlaceholder("Write the explanation in your own words", { exact: false }).fill(
    [
      "Protected Areas in Biodiversity must connect national parks, wildlife sanctuaries, biosphere reserves and conservation reserves with protected-area category, governance, permitted activities, legal hook and institution.",
      "The Biodiversity Map proof needs hotspot, endemism, protected sanctuary, biosphere corridor, species, habitat, IUCN category, location, threat and conservation response with India map examples.",
      "Western Ghats hotspot, Kaziranga floodplain, Sundarbans mangroves and Great Indian Bustard grassland show region, habitat, species, category, corridor, legal rule and landscape-level conservation.",
      "A strong UPSC answer explains why protected area questions mix ecology, institutions and maps; it compares category-rule-location errors, builds one protected-area comparison table, and avoids treating all protected areas as identical legal categories.",
    ].join(" ")
  );
  await page.getByRole("button", { name: /Assess explanation/i }).click();

  const challenge = page.getByTestId("subject-talk-peer-challenge");
  if (await challenge.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByTestId("subject-talk-challenge-response").fill(
      "Peer challenge answer: compare protected areas by notification, rights, institution, species, habitat, buffer and map location. The exam trap is mixing sanctuary permissions with national park restrictions."
    );
    await page.getByTestId("subject-talk-reassess-challenge").click();
  }

  const secondTalkHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  const secondTalkLabel = (await page.getByTestId("talk-primary-route").innerText()).trim();
  if (secondTalkHref !== `/upsc/environment/mcq-readiness?day=${day}`) {
    const progress = await getProgress(page, day);
    throw new Error(`Post-watch 95% Talk should route directly to MCQ, got ${secondTalkHref} (${secondTalkLabel}): ${JSON.stringify(progress)}`);
  }
  const secondTalkProgress = await getProgress(page, day);
  if (
    typeof secondTalkProgress?.talkScore !== "number" ||
    secondTalkProgress.talkScore < 95 ||
    !secondTalkProgress?.talkNextRoute?.includes("/mcq-readiness")
  ) {
    throw new Error(`Post-watch Talk did not persist direct MCQ route: ${JSON.stringify(secondTalkProgress)}`);
  }
  await assertNoOverflow(page, "environment-talk-post-watch", checks);

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL(`**/upsc/environment/mcq-readiness?day=${day}`, { timeout: 15000 });
  await page.getByTestId("mcq-simple-step").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-readiness-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-practice-launcher").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-fresh-practice", checks);

  await page.goto(`${baseUrl}/upsc/environment/track?day=${day}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("subject-track-simple-dashboard").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-track-learning-gap").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-track-next-revision").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-track-trend").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-track-v2", checks);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    firstTalkProgress,
    watchProgress,
    secondTalkProgress,
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
