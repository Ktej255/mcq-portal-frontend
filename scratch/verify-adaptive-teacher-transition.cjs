const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "sarit-upsc-student-profile-v1";
const progressKey = "sarit-upsc-geography-progress-v1";

const answer =
  "Geographic thinking and map relationships ask what, where and why. Absolute and relative location, site, situation and scale help read an India map because location creates different effects.";

function fallbackPayload(nextPrompt) {
  return {
    mode: "local-fallback",
    providerConfigured: false,
    fallbackReason: "provider-not-configured",
    trace: {
      promptVersion: "upsc-teacher-2026-06-03.2",
      rubricVersion: "upsc-recall-rubric-2026-06-03.1",
      recallTarget: 95,
    },
    assessment: {
      score: 70,
      band: "Practice",
      matchedKeywords: ["geographic", "thinking", "relationships"],
      missingKeywords: ["geography", "foundation"],
      summary: "Continue with the short repair lesson.",
      nextAction: "Open repair lesson",
      rubric: [
        { label: "Recall", score: 26, max: 30, status: "Ready", evidence: "Matched core terms." },
        { label: "Mechanism", score: 20, max: 20, status: "Ready", evidence: "Cause-effect chain is visible." },
        { label: "Map proof", score: 12, max: 20, status: "Forming", evidence: "Needs one map cue." },
        { label: "UPSC trap", score: 0, max: 15, status: "Weak", evidence: "Needs one trap." },
        { label: "Expression", score: 12, max: 15, status: "Ready", evidence: "Structured enough." },
      ],
      repairHints: ["Repair the weakest concept."],
    },
    coach: {
      summary: "Continue with the short repair lesson.",
      nextPrompt,
      focusConcepts: ["geography", "foundation"],
    },
  };
}

async function seed(page) {
  await page.addInitScript(
    ({ studentProfileKey, geographyProgressKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_adaptive_teacher_transition");
      window.localStorage.setItem(
        studentProfileKey,
        JSON.stringify({
          level: "advanced",
          preparationStage: "multiple-attempts",
          studyWindow: "90",
          learningStyle: "mixed",
          weakSignal: "retention",
          studyTime: "morning",
          attemptHistory: "two-plus-attempts",
          learningPattern: "deep-work",
          mindState: "calm",
          updatedAt: new Date().toISOString(),
        }),
      );
      window.localStorage.removeItem(geographyProgressKey);
    },
    { studentProfileKey: profileKey, geographyProgressKey: progressKey },
  );
}

async function routeContract(page) {
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });
  return page.getByTestId("talk-route-gate").evaluate((element) => ({
    href: element.getAttribute("data-next-action-route"),
    label: element.getAttribute("data-next-action-label"),
    mcqReady: element.getAttribute("data-mcq-ready"),
  }));
}

async function readTeacherPrompt(page) {
  return page.evaluate((key) => {
    const progress = JSON.parse(localStorage.getItem(key) || "{}")["1"];
    return progress?.teacherCoachNextPrompt || "";
  }, progressKey);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seed(page);
  await page.route("**/api/upsc/teacher/discuss", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fallbackPayload("STALE COACH RESPONSE")),
    });
  });

  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("talk-answer-draft").fill(answer);
  await page.getByTestId("talk-assess-answer").click();
  const disabledWhileChecking = await page.getByTestId("talk-assess-answer").isDisabled();
  const staleRoute = await routeContract(page);
  await page.getByTestId("talk-answer-draft").fill(`${answer} Edited after submit.`);
  await page.waitForTimeout(500);
  const staleCoachIgnored = !(await readTeacherPrompt(page)).includes("STALE COACH RESPONSE");

  await page.unroute("**/api/upsc/teacher/discuss");
  await page.route("**/api/upsc/teacher/discuss", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Teacher service is temporarily unavailable. Continue after a short pause." }),
    });
  });
  await page.getByTestId("talk-assess-answer").click();
  const unavailableRoute = await routeContract(page);
  await page.waitForTimeout(500);
  const routeSurvivesUnavailable = await page.getByTestId("talk-primary-route").isVisible();

  await page.unroute("**/api/upsc/teacher/discuss");
  await page.route("**/api/upsc/teacher/discuss", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ mode: "local-fallback", coach: null }),
    });
  });
  await page.getByTestId("talk-assess-answer").click();
  const malformedRoute = await routeContract(page);
  await page.waitForTimeout(500);
  const routeSurvivesMalformed = await page.getByTestId("talk-primary-route").isVisible();

  await page.unroute("**/api/upsc/teacher/discuss");
  await page.route("**/api/upsc/teacher/discuss", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 18_000));
    await route
      .fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(fallbackPayload("LATE COACH RESPONSE")),
      })
      .catch(() => {});
  });
  await page.getByTestId("talk-answer-draft").fill(`${answer} Edited before a stalled teacher request.`);
  await page.getByTestId("talk-assess-answer").click();
  const timeoutRoute = await routeContract(page);
  await page.waitForTimeout(14_500);
  const recoveredAfterClientTimeout = !(await page.getByTestId("talk-assess-answer").isDisabled());
  const routeSurvivesTimeout = await page.getByTestId("talk-primary-route").isVisible();
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  }));

  await browser.close();

  const unexpectedConsoleErrors = consoleErrors.filter((message) => !message.includes("503 (Service Unavailable)"));
  const expectedRoute = (route) =>
    route.href === "/upsc/geography/watch?day=1" &&
    route.label === "Open repair lesson" &&
    route.mcqReady === "false";
  const evidence = {
    baseUrl,
    checks: {
      disabledWhileChecking,
      staleRoute,
      staleCoachIgnored,
      unavailableRoute,
      routeSurvivesUnavailable,
      malformedRoute,
      routeSurvivesMalformed,
      timeoutRoute,
      recoveredAfterClientTimeout,
      routeSurvivesTimeout,
      metrics,
    },
    consoleErrors,
    unexpectedConsoleErrors,
    pageErrors,
    passed:
      disabledWhileChecking &&
      expectedRoute(staleRoute) &&
      staleCoachIgnored &&
      expectedRoute(unavailableRoute) &&
      routeSurvivesUnavailable &&
      expectedRoute(malformedRoute) &&
      routeSurvivesMalformed &&
      expectedRoute(timeoutRoute) &&
      recoveredAfterClientTimeout &&
      routeSurvivesTimeout &&
      !metrics.hasHorizontalOverflow &&
      unexpectedConsoleErrors.length === 0 &&
      pageErrors.length === 0,
  };

  if (!evidence.passed) throw new Error(JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
