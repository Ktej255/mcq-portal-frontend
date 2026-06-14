const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const courseActionRoute = `${baseUrl}/api/upsc/prelims-2027/course-action`;
const manifestRoute = `${baseUrl}/api/upsc/prelims-2026/showcase-manifest`;
const publicRoute = `${baseUrl}/upsc-prelims-2026-showcase#main-website-course-action-preview`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2000)}` : message);
  }
}

function verifyCourseAction(payload, headers) {
  const phaseCounts = payload.summary?.phaseCounts || {};
  const serialized = JSON.stringify(payload);

  assert(headers["cache-control"]?.includes("no-store"), "Course-action API should not be cached", headers);
  assert(payload.version === "upsc-prelims-2027-course-action-v1", "Unexpected course-action version", payload.version);
  assert(payload.sourceAuditRoute === "/upsc-prelims-2026-showcase", "Wrong source audit route", payload);
  assert(payload.reviewCommandRoute === "/upsc/prelims-review-command", "Wrong review command route", payload);
  assert(payload.strategyRoute === "/upsc/prelims-2027-strategy", "Wrong strategy route", payload);
  assert(payload.publicAnchor === "/upsc-prelims-2026-showcase#software-path", "Wrong public anchor", payload);
  assert(payload.api?.reviewCommand === "/api/upsc/prelims-2026/review-command", "Missing review command API path", payload.api);
  assert(payload.api?.courseAction === "/api/upsc/prelims-2027/course-action", "Missing self API path", payload.api);
  assert(payload.api?.manifest === "/api/upsc/prelims-2026/showcase-manifest", "Missing manifest API path", payload.api);
  assert(payload.api?.questionLedger === "/api/upsc/prelims-2026/question-ledger", "Missing question ledger API path", payload.api);
  assert(payload.api?.proofFeed === "/api/upsc/prelims-2026/public-proof-feed", "Missing proof feed API path", payload.api);

  assert(payload.summary?.priorityCount === 8, "Wrong priority count", payload.summary);
  assert(payload.summary?.criticalPriorityCount === 2, "Wrong critical priority count", payload.summary);
  assert(payload.summary?.highPriorityCount === 1, "Wrong high priority count", payload.summary);
  assert(payload.summary?.mediumPriorityCount === 3, "Wrong medium priority count", payload.summary);
  assert(payload.summary?.lowPriorityCount === 1, "Wrong low priority count", payload.summary);
  assert(payload.summary?.minimalPriorityCount === 1, "Wrong minimal priority count", payload.summary);
  assert(payload.summary?.taskCount === 34, "Wrong task count", payload.summary);
  assert(payload.summary?.sprintCount === 6, "Wrong sprint count", payload.summary);
  assert(payload.summary?.practiceBlueprintCount === 16, "Wrong blueprint count", payload.summary);
  assert(payload.summary?.formatRuleCount === 6, "Wrong format rule count", payload.summary);
  assert(payload.summary?.reallocationDecisionCount === 8, "Wrong reallocation count", payload.summary);
  assert(payload.summary?.evidenceLedgerCount === 8, "Wrong evidence ledger count", payload.summary);
  assert(payload.summary?.launchStepCount === 5, "Wrong launch step count", payload.summary);

  assert(phaseCounts.Source === 7, "Wrong Source phase count", phaseCounts);
  assert(phaseCounts.Capsule === 6, "Wrong Capsule phase count", phaseCounts);
  assert(phaseCounts.MCQ === 7, "Wrong MCQ phase count", phaseCounts);
  assert(phaseCounts.Proof === 5, "Wrong Proof phase count", phaseCounts);
  assert(phaseCounts.Release === 5, "Wrong Release phase count", phaseCounts);
  assert(phaseCounts.Planner === 4, "Wrong Planner phase count", phaseCounts);

  assert(Array.isArray(payload.priorities) && payload.priorities.length === 8, "Priority rows missing", payload.priorities);
  assert(Array.isArray(payload.sprints) && payload.sprints.length === 6, "Sprint rows missing", payload.sprints);
  assert(Array.isArray(payload.executionTasks) && payload.executionTasks.length === 34, "Task rows missing", payload.executionTasks);
  assert(
    Array.isArray(payload.practiceBlueprints) && payload.practiceBlueprints.length === 16,
    "Practice blueprints missing",
    payload.practiceBlueprints
  );
  assert(Array.isArray(payload.formatRules) && payload.formatRules.length === 6, "Format rules missing", payload.formatRules);
  assert(
    Array.isArray(payload.reallocationPlan) && payload.reallocationPlan.length === 8,
    "Reallocation rows missing",
    payload.reallocationPlan
  );
  assert(Array.isArray(payload.evidenceLedger) && payload.evidenceLedger.length === 8, "Evidence rows missing", payload.evidenceLedger);
  assert(Array.isArray(payload.launchSteps) && payload.launchSteps.length === 5, "Launch steps missing", payload.launchSteps);

  const ir = payload.priorities.find((priority) => priority.id === "ir-multilateral");
  const economy = payload.priorities.find((priority) => priority.id === "economy-maintenance");
  assert(ir?.priority === "Critical", "IR priority should be critical", ir);
  assert(ir?.taskCount >= 4 && ir?.blueprintCount >= 2, "IR task/blueprint counts are weak", ir);
  assert(ir?.proofStatus === "Needs source pack", "IR proof status drifted", ir);
  assert(/Build from scratch/i.test(ir?.action || ""), "IR action missing build decision", ir);
  assert(economy?.proofStatus === "Claim ready", "Economy proof status drifted", economy);
  assert(/proof/i.test(payload.proofPolicy || ""), "Proof policy should mention proof", payload.proofPolicy);
  assert(!/webinar/i.test(serialized), "Course-action payload contains webinar wording");

  return {
    version: payload.version,
    summary: payload.summary,
    firstPriority: {
      id: payload.priorities[0].id,
      priority: payload.priorities[0].priority,
      taskCount: payload.priorities[0].taskCount,
      blueprintCount: payload.priorities[0].blueprintCount,
      proofStatus: payload.priorities[0].proofStatus,
    },
  };
}

async function verifyPublicPreview(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(publicRoute, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-course-action-api-preview").waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="showcase-course-action-api-preview"]')?.getAttribute("data-api-status") ===
      "ready",
    null,
    { timeout: 20000 }
  );

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="showcase-course-action-api-preview"]');
    const cards = Array.from(document.querySelectorAll('[data-testid="showcase-course-action-priority"]'));
    const text = document.body.innerText;
    const sectionText = section?.textContent || "";
    const firstCard = cards[0];

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      priorityCount: Number(section?.getAttribute("data-priority-count")),
      criticalPriorityCount: Number(section?.getAttribute("data-critical-priority-count")),
      taskCount: Number(section?.getAttribute("data-task-count")),
      sprintCount: Number(section?.getAttribute("data-sprint-count")),
      blueprintCount: Number(section?.getAttribute("data-practice-blueprint-count")),
      formatRuleCount: Number(section?.getAttribute("data-format-rule-count")),
      reallocationCount: Number(section?.getAttribute("data-reallocation-count")),
      evidenceLedgerCount: Number(section?.getAttribute("data-evidence-ledger-count")),
      launchStepCount: Number(section?.getAttribute("data-launch-step-count")),
      phaseSource: Number(section?.getAttribute("data-phase-source")),
      phaseCapsule: Number(section?.getAttribute("data-phase-capsule")),
      phaseMcq: Number(section?.getAttribute("data-phase-mcq")),
      phaseProof: Number(section?.getAttribute("data-phase-proof")),
      phaseRelease: Number(section?.getAttribute("data-phase-release")),
      phasePlanner: Number(section?.getAttribute("data-phase-planner")),
      renderedCards: cards.length,
      firstPriorityId: firstCard?.getAttribute("data-priority-id"),
      firstPriorityBand: firstCard?.getAttribute("data-priority-band"),
      firstTaskCount: Number(firstCard?.getAttribute("data-task-count")),
      firstBlueprintCount: Number(firstCard?.getAttribute("data-blueprint-count")),
      hasEndpointText: sectionText.includes("/api/upsc/prelims-2027/course-action"),
      hasReviewCommandEndpointText: sectionText.includes("/api/upsc/prelims-2026/review-command"),
      hasReadyMessage: sectionText.includes("Course-action endpoint is live for 2027 portal integration."),
      hasIrCopy: sectionText.includes("IR / Multilateral Bodies") && sectionText.includes("Build from scratch"),
      hasPhaseText: sectionText.includes("Source: 7") && sectionText.includes("Planner: 4"),
      hasProofPolicy: /proof/i.test(sectionText),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  assert(result.hasSection, "Course-action preview did not render", result);
  assert(result.apiStatus === "ready", "Course-action preview did not load", result);
  assert(result.version === "upsc-prelims-2027-course-action-v1", "Course-action preview version drifted", result);
  assert(result.priorityCount === 8 && result.criticalPriorityCount === 2, "Course-action preview priority counts drifted", result);
  assert(
    result.taskCount === 34 &&
      result.sprintCount === 6 &&
      result.blueprintCount === 16 &&
      result.formatRuleCount === 6 &&
      result.reallocationCount === 8 &&
      result.evidenceLedgerCount === 8 &&
      result.launchStepCount === 5,
    "Course-action preview summary counts drifted",
    result
  );
  assert(
    result.phaseSource === 7 &&
      result.phaseCapsule === 6 &&
      result.phaseMcq === 7 &&
      result.phaseProof === 5 &&
      result.phaseRelease === 5 &&
      result.phasePlanner === 4,
    "Course-action preview phase counts drifted",
    result
  );
  assert(
    result.renderedCards === 4 &&
      result.firstPriorityId === "ir-multilateral" &&
      result.firstPriorityBand === "Critical" &&
      result.firstTaskCount >= 4 &&
      result.firstBlueprintCount >= 2,
    "Course-action preview priority cards incomplete",
    result
  );
  assert(
    result.hasEndpointText &&
      result.hasReviewCommandEndpointText &&
      result.hasReadyMessage &&
      result.hasIrCopy &&
      result.hasPhaseText,
    "Course-action preview copy incomplete",
    result
  );
  assert(result.hasProofPolicy, "Course-action preview lost proof policy", result);
  assert(!result.mentionsWebinar, "Page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Page has horizontal overflow", result);
  assert(result.textLength > 15000, "Showcase page appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("showcase-course-action-api-preview").scrollIntoViewIfNeeded();
  const screenshotPath = path.join(artifactDir, "upsc-course-action-api-preview.png");
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return { ...result, screenshotPath };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const [courseActionResponse, manifestResponse] = await Promise.all([
      page.request.get(courseActionRoute),
      page.request.get(manifestRoute),
    ]);

    const courseActionPayload = await courseActionResponse.json();
    const manifestPayload = await manifestResponse.json();

    assert(courseActionResponse.status() === 200, `Course-action API returned ${courseActionResponse.status()}`, courseActionPayload);
    assert(manifestResponse.status() === 200, `Manifest API returned ${manifestResponse.status()}`, manifestPayload);
    assert(
      manifestPayload.api?.reviewCommand === "/api/upsc/prelims-2026/review-command" &&
        manifestPayload.api?.courseAction === "/api/upsc/prelims-2027/course-action",
      "Manifest does not point to course-action API",
      manifestPayload.api
    );

    const courseAction = verifyCourseAction(courseActionPayload, courseActionResponse.headers());
    const publicPreview = await verifyPublicPreview(browser);
    await context.close();

    console.log(
      JSON.stringify(
        {
          ok: true,
          courseActionRoute,
          manifestRoute,
          publicRoute,
          courseAction,
          manifestApi: manifestPayload.api,
          publicPreview,
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
