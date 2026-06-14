const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy#prelims-2027-course-action-api-readiness`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const profile = {
  level: "advanced",
  preparationStage: "multiple-attempts",
  studyWindow: "120",
  learningStyle: "practice-first",
  weakSignal: "mcq-traps",
  studyTime: "morning",
  attemptHistory: "two-plus-attempts",
  learningPattern: "revision-first",
  mindState: "calm",
  updatedAt: "2026-06-10T00:00:00.000Z",
};

async function seedLocalState(context) {
  await context.addInitScript(({ profile }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_strategy_course_action_api");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
    window.localStorage.setItem(
      "sarit-upsc-prelims-2027-strategy-v1",
      JSON.stringify({
        statuses: {},
        completedModules: ["economy-master", "art-culture-bank", "history-tn-board"],
        completedTasks: [],
        queuedBlueprints: [],
      })
    );
  }, { profile });
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
  await seedLocalState(context);

  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("prelims-2027-course-action-api-readiness").waitFor({
    state: "visible",
    timeout: 20000,
  });
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="prelims-2027-course-action-api-readiness"]')
        ?.getAttribute("data-api-status") === "ready",
    null,
    { timeout: 20000 }
  );

  const section = page.getByTestId("prelims-2027-course-action-api-readiness");
  await section.getByRole("button", { name: "Copy course endpoint" }).click();
  await section.getByRole("button", { name: "Endpoint copied" }).waitFor({ state: "visible", timeout: 5000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="prelims-2027-course-action-api-readiness"]');
    const cards = Array.from(document.querySelectorAll('[data-testid="prelims-2027-course-action-api-priority"]'));
    const firstCard = cards[0];
    const text = document.body.innerText;
    const sectionText = section?.textContent || "";
    const links = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href"));

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      priorityCount: Number(section?.getAttribute("data-priority-count")),
      criticalPriorityCount: Number(section?.getAttribute("data-critical-priority-count")),
      highPriorityCount: Number(section?.getAttribute("data-high-priority-count")),
      mediumPriorityCount: Number(section?.getAttribute("data-medium-priority-count")),
      lowPriorityCount: Number(section?.getAttribute("data-low-priority-count")),
      minimalPriorityCount: Number(section?.getAttribute("data-minimal-priority-count")),
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
      previewPriorityCount: Number(section?.getAttribute("data-preview-priority-count")),
      firstPriorityId: section?.getAttribute("data-first-priority-id"),
      firstPriorityBand: section?.getAttribute("data-first-priority-band"),
      firstTaskCount: Number(section?.getAttribute("data-first-task-count")),
      firstBlueprintCount: Number(section?.getAttribute("data-first-blueprint-count")),
      renderedCards: cards.length,
      firstCardPriorityId: firstCard?.getAttribute("data-priority-id"),
      firstCardPriorityBand: firstCard?.getAttribute("data-priority-band"),
      firstCardTaskCount: Number(firstCard?.getAttribute("data-task-count")),
      firstCardBlueprintCount: Number(firstCard?.getAttribute("data-blueprint-count")),
      firstCardProofStatus: firstCard?.getAttribute("data-proof-status"),
      hasEndpointText: sectionText.includes("/api/upsc/prelims-2027/course-action"),
      hasReadyMessage: sectionText.includes("2027 course-action endpoint is live with strategy priorities, tasks and proof gates."),
      hasIrCopy: sectionText.includes("IR / Multilateral Bodies") && sectionText.includes("Build from scratch"),
      hasScienceCopy: sectionText.includes("S&T New Domains"),
      hasPhaseText: sectionText.includes("Source: 7") && sectionText.includes("Planner: 4"),
      hasProofPolicy: /source proof/i.test(sectionText) && /page proof/i.test(sectionText),
      hasReleaseGate: sectionText.includes("Release gate:"),
      hasNextProofAction: sectionText.includes("Next proof action:"),
      links,
      hasPublicPreviewLink: links.includes("/upsc-prelims-2026-showcase#main-website-course-action-preview"),
      hasBlueprintLink: links.includes("#practice-blueprints"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasSection) throw new Error("Course-action API readiness section did not render.");
  if (result.apiStatus !== "ready") throw new Error(`Course-action API readiness did not reach ready: ${JSON.stringify(result)}`);
  if (result.version !== "upsc-prelims-2027-course-action-v1") {
    throw new Error(`Unexpected course-action version: ${JSON.stringify(result)}`);
  }
  if (
    result.priorityCount !== 8 ||
    result.criticalPriorityCount !== 2 ||
    result.highPriorityCount !== 1 ||
    result.mediumPriorityCount !== 3 ||
    result.lowPriorityCount !== 1 ||
    result.minimalPriorityCount !== 1
  ) {
    throw new Error(`Course-action priority counts drifted: ${JSON.stringify(result)}`);
  }
  if (
    result.taskCount !== 34 ||
    result.sprintCount !== 6 ||
    result.blueprintCount !== 16 ||
    result.formatRuleCount !== 6 ||
    result.reallocationCount !== 8 ||
    result.evidenceLedgerCount !== 8 ||
    result.launchStepCount !== 5
  ) {
    throw new Error(`Course-action summary counts drifted: ${JSON.stringify(result)}`);
  }
  if (
    result.phaseSource !== 7 ||
    result.phaseCapsule !== 6 ||
    result.phaseMcq !== 7 ||
    result.phaseProof !== 5 ||
    result.phaseRelease !== 5 ||
    result.phasePlanner !== 4
  ) {
    throw new Error(`Course-action phase counts drifted: ${JSON.stringify(result)}`);
  }
  if (
    result.previewPriorityCount !== 4 ||
    result.renderedCards !== 4 ||
    result.firstPriorityId !== "ir-multilateral" ||
    result.firstPriorityBand !== "Critical" ||
    result.firstTaskCount < 4 ||
    result.firstBlueprintCount < 2 ||
    result.firstCardPriorityId !== "ir-multilateral" ||
    result.firstCardPriorityBand !== "Critical" ||
    result.firstCardTaskCount < 4 ||
    result.firstCardBlueprintCount < 2 ||
    result.firstCardProofStatus !== "Needs source pack"
  ) {
    throw new Error(`Course-action priority preview is incomplete: ${JSON.stringify(result)}`);
  }
  if (
    !result.hasEndpointText ||
    !result.hasReadyMessage ||
    !result.hasIrCopy ||
    !result.hasScienceCopy ||
    !result.hasPhaseText ||
    !result.hasProofPolicy ||
    !result.hasReleaseGate ||
    !result.hasNextProofAction
  ) {
    throw new Error(`Course-action readiness copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasPublicPreviewLink || !result.hasBlueprintLink) {
    throw new Error(`Course-action readiness links are incomplete: ${JSON.stringify(result.links)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 12000) throw new Error(`Strategy command appears under-rendered: ${JSON.stringify(result)}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await section.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(
      browser,
      { width: 1440, height: 1100 },
      "upsc-strategy-course-action-api-readiness.png"
    );
    const mobile = await verifyViewport(
      browser,
      { width: 390, height: 900 },
      "upsc-strategy-course-action-api-readiness-mobile.png"
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-strategy-course-action-api-readiness.png"),
            path.join(artifactDir, "upsc-strategy-course-action-api-readiness-mobile.png"),
          ],
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
