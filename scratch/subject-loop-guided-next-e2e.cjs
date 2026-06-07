const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const evidencePath = path.join(__dirname, "subject-loop-guided-next-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-loop-guided-next-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

async function seed(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ studentProfileKey, subjectProgressKey, subjectMcqKey }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_subject_loop_guided_next");
      localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
          studyWindow: "120",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "no-attempt",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        })
      );
      localStorage.setItem(
        subjectProgressKey,
        JSON.stringify({
          "1": {
            day: 1,
            watched: true,
            watchState: "Watched",
            watchMinutes: 75,
            watchSceneCompletedIds: ["intro", "mechanism", "example", "trap", "handoff"],
            reflection: "Ecosystem basics connect organisms, energy flow, nutrient cycles, and resilience.",
            confidence: "Command",
            revisitQueued: false,
            talkScore: 96,
            talkBand: "Command",
            talkUnlockStage: "mcq",
            labCompleted: true,
            labMode: "ecosystem-board",
            labProofCompletedIds: ["case", "map", "law", "threat", "answer"],
            updatedAt: new Date().toISOString(),
          },
        })
      );
      localStorage.setItem(
        subjectMcqKey,
        JSON.stringify({
          "ENV-D01": {
            planned: 3,
            drafted: 3,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: new Date().toISOString(),
          },
        })
      );
    },
    { studentProfileKey: profileKey, subjectProgressKey: progressKey, subjectMcqKey: mcqKey }
  );
}

async function openDetails(page, testId) {
  const details = page.getByTestId(testId);
  await details.waitFor({ timeout: 15000 });
  const isOpen = await details.evaluate((node) => node.open);
  if (!isOpen) {
    await details.locator(":scope > summary").click();
  }
  await details.evaluate((node) => {
    node.open = true;
    node.setAttribute("open", "");
  });
}

async function getVisibleLoop(page, label) {
  const loops = page.getByTestId("subject-loop-actions");
  const loopCount = await loops.count();
  for (let index = 0; index < loopCount; index += 1) {
    const candidate = loops.nth(index);
    if (await candidate.isVisible()) return candidate;
  }
  throw new Error(`${label} has no visible subject-loop-actions panel after opening details.`);
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
      containsRetiredBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsRetiredBranding) throw new Error(`${label} contains retired branding.`);
}

async function inspectLoop(page, config, checks) {
  await seed(page);
  await page.goto(`${baseUrl}${config.path}`, { waitUntil: "networkidle", timeout: 45000 });
  const shellTestId = config.shellTestId ?? "subject-room-shell";
  await page
    .getByTestId(shellTestId)
    .waitFor({ timeout: 15000 })
    .catch((error) => {
      throw new Error(`${config.label} did not render ${shellTestId} at ${config.path}: ${error.message}`);
    });
  if (config.detailsTestId) await openDetails(page, config.detailsTestId);

  const loop = await getVisibleLoop(page, config.label);
  await loop.waitFor({ state: "visible", timeout: 15000 });
  await loop.getByTestId("subject-loop-current-route").waitFor({ state: "visible", timeout: 15000 });
  const loopText = (await loop.getByTestId("subject-loop-one-action").evaluate((node) => node.textContent ?? "")).trim();
  if (!loopText.includes(config.expectedGuidedLabel)) {
    throw new Error(`${config.label} guided label mismatch: ${JSON.stringify({ loopText, expected: config.expectedGuidedLabel })}`);
  }

  const nextHref = await loop.getByTestId("subject-loop-current-route").getAttribute("href");
  const stayHref = await loop.getByTestId("subject-loop-current-room-route").getAttribute("href");
  const nextText = (await loop.getByTestId("subject-loop-current-route").innerText()).trim();
  const roomSwitcherOpen = await loop.getByTestId("subject-loop-room-switcher").evaluate((element) => element.open);

  if (nextHref !== config.expectedNextHref) {
    throw new Error(`${config.label} next route mismatch: ${JSON.stringify({ nextHref, expected: config.expectedNextHref })}`);
  }
  if (stayHref !== config.expectedStayHref) {
    throw new Error(`${config.label} stay route mismatch: ${JSON.stringify({ stayHref, expected: config.expectedStayHref })}`);
  }
  if (!/Open next/i.test(nextText)) {
    throw new Error(`${config.label} primary button should say Open next: ${nextText}`);
  }
  if (roomSwitcherOpen) {
    throw new Error(`${config.label} room switcher should stay folded by default.`);
  }

  await assertNoOverflow(page, config.label, checks);
  return { label: config.label, nextHref, stayHref, nextText };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const inspected = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const configs = [
    {
      label: "environment-watch-loop",
      path: "/upsc/environment/watch?day=1",
      detailsTestId: "subject-watch-details",
      expectedGuidedLabel: "Guided next: AI discussion",
      expectedNextHref: "/upsc/environment/talk?day=1",
      expectedStayHref: "/upsc/environment/watch?day=1",
    },
    {
      label: "environment-talk-loop",
      path: "/upsc/environment/talk?day=1",
      detailsTestId: "subject-talk-details",
      expectedGuidedLabel: "Guided next: Fresh MCQ",
      expectedNextHref: "/upsc/environment/mcq-readiness?day=1",
      expectedStayHref: "/upsc/environment/talk?day=1",
    },
    {
      label: "environment-mcq-loop",
      path: "/upsc/environment/mcq-readiness?day=1",
      shellTestId: "subject-mcq-shell",
      detailsTestId: "mcq-advanced-tools",
      expectedGuidedLabel: "Guided next: Track progress",
      expectedNextHref: "/upsc/environment/track?day=1",
      expectedStayHref: "/upsc/environment/mcq-readiness?day=1",
    },
    {
      label: "environment-revisit-loop",
      path: "/upsc/environment/revisit?day=1",
      detailsTestId: "revisit-advanced-tools",
      expectedGuidedLabel: "Guided next: AI discussion",
      expectedNextHref: "/upsc/environment/talk?day=1",
      expectedStayHref: "/upsc/environment/revisit?day=1",
    },
    {
      label: "environment-track-loop",
      path: "/upsc/environment/track?day=1",
      detailsTestId: "subject-track-advanced-tools",
      expectedGuidedLabel: "Guided next: Day overview",
      expectedNextHref: "/upsc/environment?day=1",
      expectedStayHref: "/upsc/environment/track?day=1",
    },
  ];

  for (const config of configs) {
    inspected.push(await inspectLoop(page, config, checks));
  }

  await page.setViewportSize({ width: 390, height: 844 });
  inspected.push(await inspectLoop(page, configs[0], checks));
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    inspected,
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
