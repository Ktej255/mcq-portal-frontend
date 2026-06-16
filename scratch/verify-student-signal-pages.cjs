const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";

const routes = [
  ["/reports", "student-gap-primary-action"],
  ["/revision", "student-revision-primary-action"],
  ["/history", "student-progress-primary-action"],
  ["/practice", "student-practice-primary-action"],
];

async function seed(page, progress = null) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileStorageKey, progressStorageKey, seededProgress }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_signals");
      window.localStorage.setItem(
        profileStorageKey,
        JSON.stringify({
          level: "advanced",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "one-attempt",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      if (seededProgress) {
        window.localStorage.setItem(progressStorageKey, JSON.stringify(seededProgress));
      } else {
        window.localStorage.removeItem(progressStorageKey);
      }
    },
    { profileStorageKey: profileKey, progressStorageKey: progressKey, seededProgress: progress }
  );
}

async function assertSignalRoutes(page, expectedHref, label, checks) {
  for (const [route, testId] of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 45000 });
    const href = await page.getByTestId(testId).getAttribute("href");
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    checks.push({ label, route, href, overflow });
    if (href !== expectedHref) {
      throw new Error(`${label} ${route}: expected ${expectedHref}, got ${href}`);
    }
    if (overflow.scrollWidth > overflow.clientWidth + 2 || overflow.bodyScrollWidth > overflow.clientWidth + 2) {
      throw new Error(`${label} ${route}: horizontal overflow ${JSON.stringify(overflow)}`);
    }
  }
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

  await seed(page);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle", timeout: 45000 });
  const studentNavItems = await page.locator("aside nav a").allTextContents();
  checks.push({ label: "student-sidebar", items: studentNavItems });
  if (studentNavItems.join("|") !== "Today|Gaps|Revise|Progress") {
    throw new Error(`student-sidebar: expected four simple decisions, got ${studentNavItems.join("|")}`);
  }
  await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle", timeout: 45000 });
  const settingsText = await page.locator("body").innerText();
  checks.push({
    label: "student-settings",
    learningPreferencesVisible: settingsText.includes("Learning preferences"),
    technicalCopyHidden: !/Firebase|Local bypass|Browser local|Institutional Preferences/i.test(settingsText),
  });
  if (!settingsText.includes("Learning preferences")) {
    throw new Error("student-settings: learning preferences should be visible");
  }
  if (/Firebase|Local bypass|Browser local|Institutional Preferences/i.test(settingsText)) {
    throw new Error("student-settings: technical deployment copy should be hidden");
  }
  await assertSignalRoutes(page, "/upsc/geography/talk?day=1", "fresh", checks);

  await seed(page, {
    1: {
      day: 1,
      watched: true,
      revisitQueued: true,
      talkScore: 54,
      talkBand: "Revisit",
      confidence: "Shaky",
      updatedAt: new Date().toISOString(),
    },
  });
  await assertSignalRoutes(page, "/upsc/geography/revisit?day=1", "recovery", checks);

  await seed(page, {
    1: {
      day: 1,
      watched: true,
      watchState: "Watched",
      talkScore: 96,
      talkBand: "Command",
      confidence: "Command",
      labCompleted: true,
      labMode: "earth-layers",
      labProofCompletedIds: ["concept", "map", "example", "trap", "answer"],
      updatedAt: new Date().toISOString(),
    },
  });
  await page.goto(`${baseUrl}/practice`, { waitUntil: "networkidle", timeout: 45000 });
  const mcqHref = await page.getByTestId("student-practice-primary-action").getAttribute("href");
  checks.push({ label: "mcq-ready", route: "/practice", href: mcqHref });
  if (mcqHref !== "/upsc/geography/mcq-readiness?day=1") {
    throw new Error(`mcq-ready /practice: expected MCQ room, got ${mcqHref}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await assertSignalRoutes(page, "/upsc/geography/mcq-readiness?day=1", "mcq-ready-mobile", checks);

  await browser.close();
  if (consoleErrors.length || pageErrors.length) {
    throw new Error(JSON.stringify({ consoleErrors, pageErrors }, null, 2));
  }
  console.log(JSON.stringify({ baseUrl, checks, passed: true }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
