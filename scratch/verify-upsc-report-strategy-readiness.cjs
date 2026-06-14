const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/reports`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const completedTasks = [
  "ir-source-matrix",
  "ir-static-current-bridge",
  "st-domain-capsules",
  "st-current-source-tags",
  "env-framework-pack",
  "medieval-revision-only",
];
const generatedHandoffs = [
  { blueprintId: "ir-body-match-pair", priorityId: "ir-multilateral", title: "IR body and India-link match set" },
  { blueprintId: "st-ai-application-multi", priorityId: "science-new-domains", title: "AI, blockchain and quantum application pack" },
  { blueprintId: "eco-treds-multi", priorityId: "economy-maintenance", title: "TReDS and MSME finance maintenance set" },
];

async function seedLocalState(context) {
  await context.addInitScript(({ tasks, handoffs }) => {
    const now = new Date().toISOString();
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_student_report_strategy_readiness");
    window.localStorage.setItem(
      "sarit-upsc-daily-command-v1",
      JSON.stringify({ subjectSlug: "geography", day: 1, updatedAt: now })
    );
    window.localStorage.setItem(
      "sarit-upsc-prelims-2027-strategy-v1",
      JSON.stringify({
        statuses: {},
        completedModules: [],
        completedTasks: tasks,
        queuedBlueprints: [],
      })
    );
    window.localStorage.setItem(
      "sarit-upsc-2027-practice-handoffs-v1",
      JSON.stringify(
        handoffs.map((handoff) => ({
          id: `${handoff.blueprintId}-${now}`,
          blueprintId: handoff.blueprintId,
          priorityId: handoff.priorityId,
          subjectSlug: handoff.priorityId === "science-new-domains" ? "science-tech" : handoff.priorityId === "economy-maintenance" ? "economy" : "internal-security-society",
          day: 1,
          title: handoff.title,
          format: "Multi-statement",
          instruction: "Seeded verifier handoff",
          matchedGap: "Seeded strategy readiness gap",
          expectedOutput: "25 questions",
          difficulty: "PYQ_STYLE",
          plannedQuestions: 25,
          minutes: 40,
          generatedAt: now,
        }))
      )
    );
    window.localStorage.setItem(
      "sarit-upsc-question-bank-attempts-v1",
      JSON.stringify({
        "strategy-ir-body-match-pair-0": {
          questionId: "strategy-ir-body-match-pair-0",
          subjectSlug: "internal-security-society",
          linkedDay: 1,
          topic: "IR body and India-link match set",
          difficulty: "PYQ_STYLE",
          source: "UPSC_2027_STRATEGY",
          selectedOption: "A",
          correctOption: "A",
          isCorrect: true,
          solvedAt: now,
        },
        "strategy-st-ai-application-multi-0": {
          questionId: "strategy-st-ai-application-multi-0",
          subjectSlug: "science-tech",
          linkedDay: 1,
          topic: "AI, blockchain and quantum application pack",
          difficulty: "HARD",
          source: "UPSC_2027_STRATEGY",
          selectedOption: "B",
          correctOption: "A",
          isCorrect: false,
          solvedAt: now,
        },
      })
    );
  }, { tasks: completedTasks, handoffs: generatedHandoffs });
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await seedLocalState(context);
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("upsc-2027-audit-readiness-report").waitFor({ state: "visible", timeout: 20000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="upsc-2027-audit-readiness-report"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="upsc-2027-audit-readiness-row"]'));
    const text = document.body.innerText;

    return {
      url: window.location.pathname,
      hasSection: Boolean(section),
      proofRule: section?.getAttribute("data-proof-rule"),
      priorityCount: Number(section?.getAttribute("data-priority-count")),
      buildTaskCount: Number(section?.getAttribute("data-build-task-count")),
      completedTaskCount: Number(section?.getAttribute("data-completed-task-count")),
      blueprintCount: Number(section?.getAttribute("data-blueprint-count")),
      generatedBlueprints: Number(section?.getAttribute("data-generated-blueprints")),
      attemptedBlueprints: Number(section?.getAttribute("data-attempted-blueprints")),
      strategyAttempts: Number(section?.getAttribute("data-strategy-attempts")),
      strategyCorrect: Number(section?.getAttribute("data-strategy-correct")),
      strategyAccuracy: section?.getAttribute("data-strategy-accuracy"),
      rowCount: rows.length,
      priorityIds: rows.map((row) => row.getAttribute("data-priority-id")),
      rowStatuses: rows.map((row) => row.getAttribute("data-status")),
      rowGenerated: Object.fromEntries(rows.map((row) => [row.getAttribute("data-priority-id"), Number(row.getAttribute("data-generated-count"))])),
      rowAttempted: Object.fromEntries(rows.map((row) => [row.getAttribute("data-priority-id"), Number(row.getAttribute("data-attempted-count"))])),
      hasQuestionBankLink: Boolean(section?.querySelector('a[href="/upsc/question-bank"]')),
      hasIrQuestionBankLink: Boolean(section?.querySelector('a[href="/upsc/question-bank?subject=internal-security-society"]')),
      hasScienceQuestionBankLink: Boolean(section?.querySelector('a[href="/upsc/question-bank?subject=science-tech"]')),
      hasEconomyQuestionBankLink: Boolean(section?.querySelector('a[href="/upsc/question-bank?subject=economy"]')),
      hasBuildPracticeSolvedCopy: text.includes("build, practice, and solved evidence line up"),
      hasGeneratedCopy: text.includes("Practice generated"),
      hasSolvedCopy: text.includes("Solved evidence"),
      hasNoAttemptsCopy: text.includes("50%"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (result.url !== "/reports") throw new Error(`Unexpected route after navigation: ${result.url}`);
  if (!result.hasSection) throw new Error("2027 audit readiness report did not render.");
  if (result.proofRule !== "strategy-build-generated-practice-solved-attempt-readiness") {
    throw new Error(`Wrong proof rule: ${JSON.stringify(result)}`);
  }
  if (result.priorityCount !== 8 || result.rowCount !== 8) {
    throw new Error(`Expected eight priority rows: ${JSON.stringify(result)}`);
  }
  if (result.buildTaskCount < 30 || result.blueprintCount !== 16) {
    throw new Error(`Strategy task/blueprint counts look wrong: ${JSON.stringify(result)}`);
  }
  if (result.completedTaskCount !== completedTasks.length) {
    throw new Error(`Completed task count did not sync: ${JSON.stringify(result)}`);
  }
  if (result.generatedBlueprints !== 3 || result.attemptedBlueprints !== 2) {
    throw new Error(`Generated/attempted blueprint counts are wrong: ${JSON.stringify(result)}`);
  }
  if (result.strategyAttempts !== 2 || result.strategyCorrect !== 1 || result.strategyAccuracy !== "50") {
    throw new Error(`Strategy attempt metrics are wrong: ${JSON.stringify(result)}`);
  }
  for (const id of [
    "ir-multilateral",
    "science-new-domains",
    "polity-legal-ethics",
    "environment-current",
    "geography-international",
    "ancient-tn-board",
    "economy-maintenance",
    "medieval-reduction",
  ]) {
    if (!result.priorityIds.includes(id)) throw new Error(`Missing priority ${id}: ${JSON.stringify(result)}`);
  }
  if (!result.rowStatuses.includes("Solved evidence") || !result.rowStatuses.includes("Practice generated")) {
    throw new Error(`Expected solved and generated statuses: ${JSON.stringify(result)}`);
  }
  if (result.rowGenerated["economy-maintenance"] !== 1 || result.rowAttempted["economy-maintenance"] !== 0) {
    throw new Error(`Economy generated-only status is wrong: ${JSON.stringify(result)}`);
  }
  if (result.rowAttempted["ir-multilateral"] !== 1 || result.rowAttempted["science-new-domains"] !== 1) {
    throw new Error(`Solved priority rows are wrong: ${JSON.stringify(result)}`);
  }
  if (!result.hasQuestionBankLink || !result.hasIrQuestionBankLink || !result.hasScienceQuestionBankLink || !result.hasEconomyQuestionBankLink) {
    throw new Error(`Question Bank handoff links missing: ${JSON.stringify(result)}`);
  }
  if (!result.hasBuildPracticeSolvedCopy || !result.hasGeneratedCopy || !result.hasSolvedCopy || !result.hasNoAttemptsCopy) {
    throw new Error(`Audit readiness copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 8000) throw new Error(`Reports page appears under-rendered: ${JSON.stringify(result)}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("upsc-2027-audit-readiness-report").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-report-strategy-readiness.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-report-strategy-readiness-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-report-strategy-readiness.png"),
            path.join(artifactDir, "upsc-report-strategy-readiness-mobile.png"),
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
