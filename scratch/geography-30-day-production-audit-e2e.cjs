const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-30-day-production-audit-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-30-day-production-audit-final.png");
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const labSlugByTitle = {
  "Earth Layers Lab": "earth-layers",
  "Monsoon Simulator": "monsoon",
  "India Interactive Map": "india-map",
  "Universe Foundation Visual": "universe",
  "Disaster Link": "disaster-link",
  "Environment Bridge": "environment-bridge",
  "MCQ Engine": "mcq-engine",
};

function parseGeographySessions() {
  const planPath = path.join(__dirname, "..", "src", "lib", "upsc", "plan.ts");
  const source = fs.readFileSync(planPath, "utf8");
  const sessionsBlock = source.split("export const geographySessions: GeographySession[] = [")[1]?.split("];")[0];
  if (!sessionsBlock) throw new Error("Could not find geographySessions in plan.ts");

  const sessions = [];
  const sessionRegex =
    /{\s*day:\s*(\d+),[\s\S]*?title:\s*"([^"]+)",[\s\S]*?chapter:\s*"([^"]+)",[\s\S]*?anchor:\s*"([^"]+)",[\s\S]*?lab:\s*"([^"]+)"/g;
  let match;
  while ((match = sessionRegex.exec(sessionsBlock))) {
    sessions.push({
      day: Number(match[1]),
      title: match[2],
      chapter: match[3],
      anchor: match[4],
      lab: match[5],
      labSlug: labSlugByTitle[match[5]],
    });
  }

  if (sessions.length !== 30) {
    throw new Error(`Expected 30 Geography sessions, found ${sessions.length}`);
  }
  const missingLabSlug = sessions.find((session) => !session.labSlug);
  if (missingLabSlug) {
    throw new Error(`Missing lab slug for ${missingLabSlug.day}: ${missingLabSlug.lab}`);
  }
  return sessions.sort((a, b) => a.day - b.day);
}

async function seedRouteState(page, room, day) {
  await page.evaluate(
    ({ profileKey, progressKey, room, day }) => {
      const now = new Date().toISOString();
      window.MOCK_TOKEN = "MOCK_TOKEN_geography_30_day_production_audit";
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_30_day_production_audit");
      window.localStorage.setItem(
        profileKey,
        JSON.stringify({
          level: "beginner",
          preparationStage: "not-started",
          studyWindow: "60",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "no-attempt",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: now,
        })
      );

      const current = JSON.parse(window.localStorage.getItem(progressKey) || "{}");
      const dayKey = String(day);
      const watchedProgress = {
        day,
        watched: true,
        watchState: "Watched",
        watchSceneCompletedIds: [
          `${day}-briefing`,
          `${day}-mechanism`,
          `${day}-map`,
          `${day}-trap`,
          `${day}-recap`,
        ],
        watchHandoffReady: true,
        updatedAt: now,
      };
      const talkProgress = {
        ...watchedProgress,
        talkScore: 96,
        talkBand: "Command",
        talkUnlockStage: "mcq",
        talkVerdict: "MCQ route unlocked: the 95% recall target is cleared.",
        reflection: "Concept, mechanism, map proof, example, and UPSC trap are clear.",
      };

      if (room === "command") {
        current[dayKey] = {
          day,
          watchState: "Queued",
          updatedAt: now,
        };
      } else if (room === "watch") {
        delete current[dayKey];
      } else if (room === "talk") {
        current[dayKey] = watchedProgress;
      } else if (room === "revisit") {
        current[dayKey] = {
          ...watchedProgress,
          talkScore: 38,
          talkBand: "Revisit",
          revisitQueued: true,
          recoveryWeakSkill: "Map proof",
          recoveryDiagnosisSummary: "Repair one map-linked weak point before MCQ.",
        };
      } else {
        current[dayKey] = talkProgress;
      }

      window.localStorage.setItem(progressKey, JSON.stringify(current));
    },
    { profileKey, progressKey, room, day }
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
  if (metrics.containsOldBranding) throw new Error(`${label} still shows old branding.`);
}

async function expectVisible(page, label, locator) {
  await locator.first().waitFor({ timeout: 15000 });
  return { label };
}

async function expectHiddenDetails(page, label, testId, checks) {
  const state = await page.getByTestId(testId).evaluate((element) => ({
    open: element.open,
    text: element.textContent?.slice(0, 160) || "",
  }));
  checks.push({ label, state });
  if (state.open) throw new Error(`${label} should start folded: ${JSON.stringify(state)}`);
}

async function expectPageText(page, label, text) {
  try {
    await page.waitForFunction(
      (expectedText) => document.body.innerText.includes(expectedText),
      text,
      { timeout: 15000 }
    );
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      url: window.location.href,
      token: window.localStorage.getItem("MOCK_TOKEN"),
      body: document.body.innerText.slice(0, 1000),
    }));
    throw new Error(`${label} missing text "${text}": ${JSON.stringify(diagnostic, null, 2)}\n${error.message}`);
  }
  return { label };
}

function routeDefinitions(session) {
  return [
    {
      room: "command",
      path: `/upsc/geography?day=${session.day}`,
      critical: async (page, checks) => {
        await expectVisible(page, "command-simple-entry", page.getByTestId("geography-today-simple-entry"));
        await expectVisible(page, "command-next-action", page.getByTestId("command-next-action"));
        await expectHiddenDetails(page, "command-funnel-folded", "geography-command-funnel-details", checks);
        await expectHiddenDetails(page, "command-controls-folded", "geography-command-advanced-controls", checks);
      },
    },
    {
      room: "watch",
      path: `/upsc/geography/watch?day=${session.day}`,
      critical: async (page, checks) => {
        await expectVisible(page, "watch-shell", page.getByTestId("geography-watch-simple-repair"));
        await expectVisible(page, "watch-player", page.getByTestId("watch-topic-player"));
        await expectVisible(page, "watch-primary-action", page.getByTestId("watch-complete-and-discuss"));
        await expectHiddenDetails(page, "watch-checkpoints-folded", "geography-watch-checkpoints", checks);
        await expectHiddenDetails(page, "watch-details-folded", "geography-watch-details", checks);
      },
    },
    {
      room: "talk",
      path: `/upsc/geography/talk?day=${session.day}`,
      critical: async (page, checks) => {
        await expectVisible(page, "talk-simple-panel", page.getByTestId("geography-talk-simple-panel"));
        await expectVisible(page, "talk-answer", page.getByTestId("talk-answer-draft"));
        await expectVisible(page, "talk-recall-meter", page.getByTestId("talk-recall-target-meter"));
        await expectHiddenDetails(page, "talk-details-folded", "geography-talk-details", checks);
      },
    },
    {
      room: "lab",
      path: `/upsc/geography/lab?mode=${session.labSlug}&day=${session.day}`,
      critical: async (page, checks) => {
        await expectVisible(page, "lab-simple-surface", page.getByTestId("geography-lab-simple-surface"));
        await expectVisible(page, "lab-proof-board", page.getByTestId("lab-proof-command-board"));
        await expectVisible(page, "lab-skip-mcq", page.getByTestId("lab-continue-without-visual"));
        await expectHiddenDetails(page, "lab-visual-board-folded", "geography-lab-visual-board", checks);
        await expectHiddenDetails(page, "lab-advanced-tools-folded", "geography-lab-advanced-tools", checks);
      },
    },
    {
      room: "mcq",
      path: `/upsc/geography/mcq-readiness?day=${session.day}`,
      critical: async (page, checks) => {
        await expectVisible(page, "mcq-level-shell", page.getByTestId("geography-mcq-level-shell"));
        await expectVisible(page, "mcq-flow-strip", page.getByTestId("mcq-simple-flow-strip"));
        await expectVisible(page, "mcq-next-action-panel", page.getByTestId("mcq-student-next-action-panel"));
        await expectHiddenDetails(page, "mcq-advanced-tools-folded", "geography-mcq-advanced-tools", checks);
      },
    },
    {
      room: "track",
      path: `/upsc/geography/track?day=${session.day}`,
      critical: async (page, checks) => {
        await expectVisible(page, "track-simple-dashboard", page.getByTestId("geography-track-simple-dashboard"));
        await expectVisible(page, "track-four-signal-surface", page.getByTestId("geography-track-four-signal-surface"));
        await expectVisible(page, "track-focused-route", page.getByTestId("geography-track-focused-route"));
        await expectHiddenDetails(page, "track-path-map-folded", "geography-track-path-map", checks);
        await expectHiddenDetails(page, "track-advanced-tools-folded", "geography-track-advanced-tools", checks);
      },
    },
    {
      room: "revisit",
      path: `/upsc/geography/revisit?day=${session.day}`,
      critical: async (page, checks) => {
        await expectVisible(page, "revisit-simple-panel", page.getByTestId("geography-revisit-simple-panel"));
        await expectVisible(page, "revisit-note-surface", page.getByTestId("geography-revisit-note-surface"));
        await expectVisible(page, "revisit-action-card", page.getByTestId("geography-revisit-action-card"));
        await expectHiddenDetails(page, "revisit-checklist-folded", "geography-revisit-checklist", checks);
      },
    },
  ];
}

async function runViewport(browser, sessions, viewport, label) {
  const page = await browser.newPage({ viewport });
  const checks = [];
  const findings = [];
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const session of sessions) {
    for (const route of routeDefinitions(session)) {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      await seedRouteState(page, route.room, session.day);
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await expectPageText(page, `${label}-${route.room}-day-${session.day}-title`, session.title);
      await route.critical(page, checks);
      await assertNoOverflow(page, `${label}-${route.room}-day-${session.day}`, checks);
      findings.push({
        viewport: label,
        room: route.room,
        day: session.day,
        title: session.title,
        path: route.path,
      });
    }
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();

  return {
    viewport: label,
    checks,
    findings,
    consoleErrors,
    pageErrors,
  };
}

async function run() {
  const sessions = parseGeographySessions();
  const browser = await chromium.launch({ headless: true });
  const desktop = await runViewport(browser, sessions, { width: 1366, height: 900 }, "desktop");
  const mobile = await runViewport(browser, sessions, { width: 390, height: 844 }, "mobile");
  await browser.close();

  const consoleErrors = [...desktop.consoleErrors, ...mobile.consoleErrors];
  const pageErrors = [...desktop.pageErrors, ...mobile.pageErrors];
  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    sessionCount: sessions.length,
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
  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }
  console.log(
    JSON.stringify(
      {
        baseUrl,
        sessionCount: evidence.sessionCount,
        routeCountPerViewport: evidence.routeCountPerViewport,
        totalRouteChecks: evidence.totalRouteChecks,
        consoleErrors: evidence.consoleErrors,
        blockingConsoleErrors: evidence.blockingConsoleErrors,
        pageErrors: evidence.pageErrors,
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
