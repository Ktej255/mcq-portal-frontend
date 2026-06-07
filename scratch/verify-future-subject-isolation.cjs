const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "future-subject-isolation-evidence.json");
const profileKey = "sarit-upsc-student-profile-v1";
const profile = {
  level: "advanced",
  studyWindow: "120",
  learningStyle: "mixed",
  weakSignal: "retention",
  studyTime: "morning",
  updatedAt: new Date().toISOString(),
};

function installLocalIdentity(page, token) {
  return page.addInitScript(
    ({ profileKey, profile, token }) => {
      window.localStorage.setItem("MOCK_TOKEN", token);
      window.localStorage.setItem(profileKey, JSON.stringify(profile));
    },
    { profileKey, profile, token },
  );
}

async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    url: window.location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    containsOldBranding: /ANTIGRAVITY|ANTI\s*GRAVITY/i.test(document.body.innerText),
  }));
  const hasHorizontalOverflow =
    metrics.scrollWidth > metrics.clientWidth + 2 || metrics.bodyScrollWidth > metrics.clientWidth + 2;

  if (hasHorizontalOverflow || metrics.containsOldBranding) {
    throw new Error(`${label} failed visual boundary: ${JSON.stringify({ ...metrics, hasHorizontalOverflow })}`);
  }

  return { label, ...metrics, hasHorizontalOverflow };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const learnerContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const masterContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const learnerPage = await learnerContext.newPage();
  const masterPage = await masterContext.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  for (const [label, page] of [
    ["learner", learnerPage],
    ["master", masterPage],
  ]) {
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`[${label}] ${message.text()}`);
    });
    page.on("pageerror", (error) => pageErrors.push(`[${label}] ${error.message}`));
  }

  await installLocalIdentity(learnerPage, "MOCK_TOKEN_STUDENT_future_subject_isolation");
  await installLocalIdentity(masterPage, "MOCK_TOKEN_MASTER_future_subject_isolation");

  await learnerPage.goto(`${baseUrl}/upsc`, { waitUntil: "domcontentloaded", timeout: 45000 });
  const planningDrawer = learnerPage.getByTestId("upsc-planning-drawer");
  await planningDrawer.waitFor({ timeout: 15000 });
  await planningDrawer.locator(":scope > summary").click();
  const activeSubjectLinks = planningDrawer.getByTestId("upsc-roadmap-active-subject");
  const futureSubjectCards = planningDrawer.getByTestId("upsc-roadmap-future-subject");
  const activeSubjectCount = await activeSubjectLinks.count();
  const futureSubjectCount = await futureSubjectCards.count();
  const activeHref = await activeSubjectLinks.getAttribute("href");
  const futureLinkCount = await futureSubjectCards.locator("a").count();
  if (activeSubjectCount !== 1 || activeHref !== "/upsc/geography" || futureSubjectCount !== 7 || futureLinkCount !== 0) {
    throw new Error(
      `Learner roadmap boundary mismatch: ${JSON.stringify({
        activeSubjectCount,
        activeHref,
        futureSubjectCount,
        futureLinkCount,
      })}`,
    );
  }
  checks.push({
    label: "learner-roadmap",
    activeSubjectCount,
    activeHref,
    futureSubjectCount,
    futureLinkCount,
  });
  checks.push(await assertNoOverflow(learnerPage, "learner-roadmap-desktop"));

  await learnerPage.goto(`${baseUrl}/upsc/environment`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await learnerPage.waitForURL(`${baseUrl}/dashboard`, { timeout: 15000 });
  checks.push({ label: "learner-environment-redirect", finalUrl: learnerPage.url() });

  await learnerPage.goto(`${baseUrl}/upsc/history/watch?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await learnerPage.waitForURL(`${baseUrl}/dashboard`, { timeout: 15000 });
  checks.push({ label: "learner-history-watch-redirect", finalUrl: learnerPage.url() });

  await learnerPage.setViewportSize({ width: 390, height: 844 });
  await learnerPage.goto(`${baseUrl}/upsc`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await learnerPage.getByTestId("upsc-planning-drawer").locator(":scope > summary").click();
  checks.push(await assertNoOverflow(learnerPage, "learner-roadmap-mobile"));

  await masterPage.goto(`${baseUrl}/upsc/environment`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await masterPage.getByTestId("subject-standard-shell").waitFor({ timeout: 15000 });
  checks.push({ label: "master-environment-inspection", finalUrl: masterPage.url() });

  await masterPage.goto(`${baseUrl}/upsc/history/watch?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await masterPage.getByTestId("subject-watch-simple-repair").waitFor({ timeout: 15000 });
  checks.push({ label: "master-history-watch-inspection", finalUrl: masterPage.url() });
  checks.push(await assertNoOverflow(masterPage, "master-history-watch-desktop"));

  await learnerContext.close();
  await masterContext.close();
  await browser.close();

  const unexpectedConsoleErrors = consoleErrors.filter(
    (error) => !error.includes("AUTH | Firebase auth is not initialized"),
  );
  const evidence = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    checks,
    consoleErrors,
    unexpectedConsoleErrors,
    pageErrors,
    passed: unexpectedConsoleErrors.length === 0 && pageErrors.length === 0,
  };
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
