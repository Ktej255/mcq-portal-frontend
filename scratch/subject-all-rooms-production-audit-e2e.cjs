const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-all-rooms-production-audit-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-all-rooms-production-audit-final.png");
const profileKey = "sarit-upsc-student-profile-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const subjects = [
  { slug: "environment", title: "Environment", labMode: "ecosystem-board" },
  { slug: "economy", title: "Economy", labMode: "macro-flow-board" },
  { slug: "disaster-management", title: "Disaster Management", labMode: "risk-matrix" },
  { slug: "polity-governance", title: "Polity and Governance", labMode: "constitution-map" },
  { slug: "science-tech", title: "Science and Technology", labMode: "science-system-board" },
  { slug: "internal-security-society", title: "Internal Security and Society", labMode: "security-framework" },
  { slug: "history", title: "History", labMode: "modern-timeline" },
];

function progressKey(subjectSlug) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function profile(level = "beginner") {
  return {
    level,
    preparationStage:
      level === "beginner" ? "not-started" : level === "advanced" ? "multiple-attempts" : "coaching-complete",
    studyWindow: "90",
    learningStyle: "mixed",
    weakSignal: "retention",
    studyTime: "morning",
    attemptHistory: level === "advanced" ? "two-plus-attempts" : level === "intermediate" ? "one-attempt" : "no-attempt",
    learningPattern: "deep-work",
    mindState: "calm",
    updatedAt: new Date().toISOString(),
  };
}

async function seed(page, subject, room) {
  const now = new Date().toISOString();
  const watchedProgress = {
    day: 1,
    watched: true,
    watchState: "Watched",
    watchMinutes: 12,
    watchSceneCompletedIds: ["1-briefing", "1-mechanism", "1-example", "1-trap", "1-handoff"],
    watchHandoffReady: true,
    updatedAt: now,
  };
  const talkProgress = {
    ...watchedProgress,
    reflection: "Concept, mechanism, example, UPSC trap, and recall proof are clear.",
    talkScore: 96,
    talkBand: "Command",
    talkUnlockStage: "mcq",
    talkNextRoute: `/upsc/${subject.slug}/mcq-readiness?day=1`,
    talkNextActionLabel: "Open practice",
    talkTeacherStatus: "mcq-ready",
    revisitQueued: false,
    confidence: "Command",
  };
  const revisitProgress = {
    ...watchedProgress,
    reflection: "The answer missed the applied example and UPSC trap.",
    talkScore: 38,
    talkBand: "Revisit",
    talkUnlockStage: "revisit",
    revisitQueued: true,
    recoveryWeakSkill: "UPSC trap",
    recoveryDiagnosisSummary: "Repair one concept-example-trap chain before returning to Talk.",
  };
  const nextProgress =
    room === "command" || room === "watch"
      ? {}
      : room === "talk"
        ? { "1": watchedProgress }
        : room === "revisit"
          ? { "1": revisitProgress }
          : { "1": talkProgress };

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.evaluate(
    ({ profileKey, subjectProgressKey, nextProfile, nextProgress }) => {
      localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_subject_all_rooms_audit");
      localStorage.setItem(profileKey, JSON.stringify(nextProfile));
      localStorage.setItem(subjectProgressKey, JSON.stringify(nextProgress));
    },
    {
      profileKey,
      subjectProgressKey: progressKey(subject.slug),
      nextProfile: profile(room === "command" || room === "watch" ? "beginner" : "intermediate"),
      nextProgress,
    }
  );
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 ||
        document.body.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });
  checks.push({ label, metrics });
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsOldBranding) throw new Error(`${label} contains retired branding.`);
}

async function expectHiddenDetails(page, label, testId, checks) {
  const state = await page.getByTestId(testId).evaluate((element) => ({
    open: Boolean(element.open),
    text: element.textContent?.slice(0, 140) || "",
  }));
  checks.push({ label, state });
  if (state.open) throw new Error(`${label} should start folded: ${JSON.stringify(state)}`);
}

async function expectVisible(page, locator, label) {
  await locator.first().waitFor({ timeout: 15000 });
  return label;
}

function routeDefinitions(subject) {
  return [
    {
      room: "command",
      path: `/upsc/${subject.slug}?day=1`,
      critical: async (page, checks) => {
        await expectVisible(page, page.getByTestId("subject-standard-shell"), "command-shell");
        await expectVisible(page, page.getByTestId("subject-simple-student-flow"), "command-simple-flow");
        await expectVisible(page, page.getByTestId("subject-command-action-route"), "command-action");
        await expectHiddenDetails(page, `${subject.slug}-command-context-folded`, "subject-command-context-details", checks);
        await expectHiddenDetails(page, `${subject.slug}-planner-folded`, "subject-planner-details", checks);
        const href = await page.getByTestId("subject-command-action-route").getAttribute("href");
        if (href !== `/upsc/${subject.slug}/watch?day=1`) {
          throw new Error(`${subject.slug} beginner command should open Watch first, got ${href}`);
        }
      },
    },
    {
      room: "watch",
      path: `/upsc/${subject.slug}/watch?day=1`,
      critical: async (page, checks) => {
        await expectVisible(page, page.getByTestId("subject-watch-simple-repair"), "watch-simple");
        await expectVisible(page, page.getByTestId("subject-watch-topic-player"), "watch-player");
        await expectVisible(page, page.getByTestId("watch-complete-and-discuss"), "watch-action");
        await expectHiddenDetails(page, `${subject.slug}-watch-recall-folded`, "subject-baseline-check", checks);
        await expectHiddenDetails(page, `${subject.slug}-watch-scene-engine-folded`, "subject-watch-scene-engine", checks);
        const contract = await page.getByTestId("subject-watch-topic-player").evaluate((element) => ({
          duration: element.getAttribute("data-duration-minutes"),
          visibleMode: element.getAttribute("data-visible-mode"),
        }));
        const visibleDuration = (await page.getByTestId("subject-watch-visible-duration").innerText()).trim();
        checks.push({ label: `${subject.slug}-watch-focused-topic-contract`, contract, visibleDuration });
        if (contract.duration !== "12" || contract.visibleMode !== "single-action-player" || visibleDuration !== "12 min focused topic") {
          throw new Error(`${subject.slug} Watch leaked old duration contract: ${JSON.stringify({ contract, visibleDuration })}`);
        }
      },
    },
    {
      room: "talk",
      path: `/upsc/${subject.slug}/talk?day=1`,
      critical: async (page, checks) => {
        await expectVisible(page, page.getByTestId("subject-talk-simple-step"), "talk-simple");
        await expectVisible(page, page.getByTestId("talk-answer-draft"), "talk-answer");
        await expectVisible(page, page.getByTestId("subject-talk-simple-loop"), "talk-loop");
        await expectHiddenDetails(page, `${subject.slug}-talk-details-folded`, "subject-talk-details", checks);
      },
    },
    {
      room: "lab",
      path: `/upsc/${subject.slug}/lab?mode=${subject.labMode}&day=1`,
      critical: async (page, checks) => {
        await expectVisible(page, page.getByTestId("subject-lab-simple-step"), "lab-simple");
        await expectVisible(page, page.getByTestId("subject-lab-next-action"), "lab-next-action");
        await expectVisible(page, page.getByTestId("subject-lab-one-action"), "lab-one-action");
        await expectHiddenDetails(page, `${subject.slug}-lab-advanced-folded`, "subject-lab-advanced-tools", checks);
      },
    },
    {
      room: "mcq",
      path: `/upsc/${subject.slug}/mcq-readiness?day=1`,
      critical: async (page, checks) => {
        await expectVisible(page, page.getByTestId("subject-mcq-shell"), "mcq-shell");
        await expectVisible(page, page.getByTestId("mcq-simple-step"), "mcq-simple");
        await expectVisible(page, page.getByTestId("mcq-primary-action"), "mcq-primary-action");
        await expectHiddenDetails(page, `${subject.slug}-mcq-advanced-folded`, "mcq-advanced-tools", checks);
      },
    },
    {
      room: "track",
      path: `/upsc/${subject.slug}/track?day=1`,
      critical: async (page, checks) => {
        await expectVisible(page, page.getByTestId("subject-track-simple-dashboard"), "track-simple");
        await expectVisible(page, page.getByTestId("track-focused-day"), "track-focused-day");
        await expectVisible(page, page.getByTestId("track-focused-route"), "track-focused-route");
        await expectHiddenDetails(page, `${subject.slug}-track-advanced-folded`, "subject-track-advanced-tools", checks);
      },
    },
    {
      room: "revisit",
      path: `/upsc/${subject.slug}/revisit?day=1`,
      critical: async (page, checks) => {
        await expectVisible(page, page.getByTestId("revisit-simple-step"), "revisit-simple");
        await expectVisible(page, page.getByTestId("subject-revisit-repair-note"), "revisit-note");
        await expectVisible(page, page.getByTestId("subject-revisit-mark-recovered"), "revisit-action");
        await expectHiddenDetails(page, `${subject.slug}-revisit-gates-folded`, "revisit-repair-gates", checks);
        await expectHiddenDetails(page, `${subject.slug}-revisit-advanced-folded`, "revisit-advanced-tools", checks);
      },
    },
  ];
}

async function runViewport(browser, viewport, label) {
  const page = await browser.newPage({ viewport });
  const checks = [];
  const findings = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const subject of subjects) {
    for (const route of routeDefinitions(subject)) {
      await seed(page, subject, route.room);
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await route.critical(page, checks);
      await assertNoOverflow(page, `${label}-${subject.slug}-${route.room}`, checks);
      findings.push({ viewport: label, subject: subject.slug, room: route.room, path: route.path });
    }
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();

  return { viewport: label, checks, findings, consoleErrors, pageErrors };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await runViewport(browser, { width: 1366, height: 900 }, "desktop");
  const mobile = await runViewport(browser, { width: 390, height: 844 }, "mobile");
  await browser.close();

  const consoleErrors = [...desktop.consoleErrors, ...mobile.consoleErrors];
  const pageErrors = [...desktop.pageErrors, ...mobile.pageErrors];
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    subjectCount: subjects.length,
    routeCountPerViewport: desktop.findings.length,
    totalRouteChecks: desktop.findings.length + mobile.findings.length,
    desktop,
    mobile,
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(
    JSON.stringify(
      {
        baseUrl,
        subjectCount: evidence.subjectCount,
        routeCountPerViewport: evidence.routeCountPerViewport,
        totalRouteChecks: evidence.totalRouteChecks,
        consoleErrors,
        blockingConsoleErrors,
        pageErrors,
        passed: evidence.passed,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
