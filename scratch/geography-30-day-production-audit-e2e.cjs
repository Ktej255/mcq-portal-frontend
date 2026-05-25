const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "geography-30-day-production-audit-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "geography-30-day-production-audit-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const labSlugByTitle = {
  "Earth Layers Lab": "earth-layers",
  "Monsoon Simulator": "monsoon",
  "India Interactive Map": "india-map",
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
  if (metrics.hasHorizontalOverflow) throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  if (metrics.containsOldBranding) throw new Error(`${label} still shows old branding.`);
}

async function expectVisible(page, label, locator) {
  await locator.first().waitFor({ timeout: 15000 });
  return { label };
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
      critical: async (page) => {
        await expectVisible(page, "command-next-action", page.getByTestId("command-next-action"));
        await expectVisible(page, "command-readiness-score", page.getByTestId("command-readiness-score"));
      },
    },
    {
      room: "watch",
      path: `/upsc/geography/watch?day=${session.day}`,
      critical: async (page) => {
        await expectVisible(page, "watch-player", page.getByTestId("watch-demo-player"));
        await expectVisible(page, "watch-scene-engine", page.getByTestId("watch-scene-engine"));
      },
    },
    {
      room: "talk",
      path: `/upsc/geography/talk?day=${session.day}`,
      critical: async (page) => {
        await expectVisible(page, "talk-answer", page.getByTestId("talk-answer-draft"));
        await expectVisible(page, "talk-discussion", page.getByTestId("talk-discussion-window"));
      },
    },
    {
      room: "lab",
      path: `/upsc/geography/lab?mode=${session.labSlug}&day=${session.day}`,
      critical: async (page) => {
        await expectVisible(page, "lab-proof-board", page.getByTestId("lab-proof-command-board"));
        await expectVisible(page, "lab-proof-stages", page.getByTestId("geography-lab-proof-stages"));
      },
    },
    {
      room: "mcq",
      path: `/upsc/geography/mcq-readiness?day=${session.day}`,
      critical: async (page) => {
        await expectVisible(page, "mcq-board", page.getByTestId("mcq-readiness-command-board"));
        await expectVisible(page, "mcq-status", page.getByTestId("mcq-preflight-status"));
      },
    },
    {
      room: "track",
      path: `/upsc/geography/track?day=${session.day}`,
      critical: async (page) => {
        await expectVisible(page, "track-focused-day", page.getByTestId("geography-track-focused-day"));
        await expectVisible(page, "track-ledger", page.getByTestId("geography-focused-evidence-ledger"));
      },
    },
    {
      room: "revisit",
      path: `/upsc/geography/revisit?day=${session.day}`,
      critical: async (page) => {
        await expectVisible(page, "revisit-diagnosis", page.getByTestId("revisit-diagnosis-board"));
        await expectVisible(page, "revisit-ledger", page.getByTestId("revisit-recovery-ledger"));
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
  await page.addInitScript(() => {
    window.MOCK_TOKEN = "MOCK_TOKEN_geography_30_day_audit";
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_geography_30_day_audit");
  });

  for (const session of sessions) {
    for (const route of routeDefinitions(session)) {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await expectPageText(page, `${label}-${route.room}-day-${session.day}-title`, session.title);
      await route.critical(page);
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
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
