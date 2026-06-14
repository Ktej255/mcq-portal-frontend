const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy#prelims-2026-question-ledger-api-readiness`;
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_strategy_question_ledger_api");
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
  await page.getByTestId("prelims-2026-question-ledger-api-readiness").waitFor({
    state: "visible",
    timeout: 20000,
  });
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="prelims-2026-question-ledger-api-readiness"]')
        ?.getAttribute("data-api-status") === "ready",
    null,
    { timeout: 20000 }
  );

  const section = page.getByTestId("prelims-2026-question-ledger-api-readiness");
  await section.getByRole("button", { name: "Copy ledger endpoint" }).click();
  await section.getByRole("button", { name: "Endpoint copied" }).waitFor({ state: "visible", timeout: 5000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="prelims-2026-question-ledger-api-readiness"]');
    const cards = Array.from(document.querySelectorAll('[data-testid="prelims-2026-question-ledger-api-card"]'));
    const statements = Array.from(
      document.querySelectorAll('[data-testid="prelims-2026-question-ledger-api-statement"]')
    );
    const options = Array.from(document.querySelectorAll('[data-testid="prelims-2026-question-ledger-api-option"]'));
    const coverageRows = Array.from(
      document.querySelectorAll('[data-testid="prelims-2026-question-ledger-api-coverage"]')
    );
    const firstCard = cards[0];
    const text = document.body.innerText;
    const sectionText = section?.textContent || "";
    const links = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href"));

    return {
      hasSection: Boolean(section),
      apiStatus: section?.getAttribute("data-api-status"),
      version: section?.getAttribute("data-version"),
      questionCount: Number(section?.getAttribute("data-question-count")),
      optionSetCount: Number(section?.getAttribute("data-option-set-count")),
      statementCoverageRows: Number(section?.getAttribute("data-statement-coverage-rows")),
      sourceSignalRows: Number(section?.getAttribute("data-source-signal-rows")),
      conceptSignalRows: Number(section?.getAttribute("data-concept-signal-rows")),
      manualCheckRows: Number(section?.getAttribute("data-manual-check-rows")),
      multiStatementCount: Number(section?.getAttribute("data-multi-statement-count")),
      directTextLeads: Number(section?.getAttribute("data-direct-text-leads")),
      conceptualLeads: Number(section?.getAttribute("data-conceptual-leads")),
      previewCardCount: Number(section?.getAttribute("data-preview-card-count")),
      previewQuestionNumber: Number(section?.getAttribute("data-preview-question-number")),
      previewOptionCount: Number(section?.getAttribute("data-preview-option-count")),
      previewCoverageCount: Number(section?.getAttribute("data-preview-coverage-count")),
      renderedCards: cards.length,
      renderedStatements: statements.length,
      renderedOptions: options.length,
      renderedCoverageRows: coverageRows.length,
      firstQuestionNumber: firstCard?.getAttribute("data-question-number"),
      firstOptionCount: Number(firstCard?.getAttribute("data-option-count")),
      firstCoverageCount: Number(firstCard?.getAttribute("data-coverage-count")),
      firstProofLocked: firstCard?.getAttribute("data-proof-locked"),
      firstAnswer: firstCard?.getAttribute("data-answer"),
      hasEndpointText: sectionText.includes("/api/upsc/prelims-2026/question-ledger"),
      hasReadyMessage: sectionText.includes("Question ledger endpoint is live with complete MCQ evidence cards."),
      hasPolicyText: /proof-locked/i.test(sectionText),
      hasCorrectedAuditText: sectionText.includes("44 direct / 30 partial / 23 misses / 3 dropped"),
      hasSignalText: sectionText.includes("50/155") && sectionText.includes("70 manual-check rows"),
      hasAnswerText: sectionText.includes("Answer:"),
      hasFullMcqText: sectionText.includes("Q1") && sectionText.includes("Proof locked"),
      links,
      hasPublicPreviewLink: links.includes("/upsc-prelims-2026-showcase#main-website-question-ledger-preview"),
      hasFullLedgerLink: links.includes("/upsc-prelims-2026-showcase#question-ledger"),
      markCount: section?.querySelectorAll("mark").length || 0,
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasSection) throw new Error("Question ledger API readiness section did not render.");
  if (result.apiStatus !== "ready") throw new Error(`Ledger API readiness did not reach ready: ${JSON.stringify(result)}`);
  if (result.version !== "upsc-prelims-2026-question-ledger-v1") {
    throw new Error(`Unexpected ledger version: ${JSON.stringify(result)}`);
  }
  if (
    result.questionCount !== 100 ||
    result.optionSetCount !== 100 ||
    result.statementCoverageRows !== 275 ||
    result.multiStatementCount !== 75 ||
    result.directTextLeads !== 37 ||
    result.conceptualLeads !== 63
  ) {
    throw new Error(`Question ledger counts are wrong: ${JSON.stringify(result)}`);
  }
  if (result.sourceSignalRows !== 50 || result.conceptSignalRows !== 155 || result.manualCheckRows !== 70) {
    throw new Error(`Statement signal split drifted: ${JSON.stringify(result)}`);
  }
  if (
    result.previewCardCount !== 2 ||
    result.previewQuestionNumber !== 1 ||
    result.previewOptionCount !== 4 ||
    result.previewCoverageCount !== 3
  ) {
    throw new Error(`Preview data attributes are incomplete: ${JSON.stringify(result)}`);
  }
  if (
    result.renderedCards !== 2 ||
    result.renderedStatements < 3 ||
    result.renderedOptions < 8 ||
    result.renderedCoverageRows < 4 ||
    result.firstQuestionNumber !== "1" ||
    result.firstOptionCount !== 4 ||
    result.firstCoverageCount !== 3 ||
    result.firstProofLocked !== "true" ||
    !result.firstAnswer
  ) {
    throw new Error(`Rendered MCQ preview is incomplete: ${JSON.stringify(result)}`);
  }
  if (
    !result.hasEndpointText ||
    !result.hasReadyMessage ||
    !result.hasPolicyText ||
    !result.hasCorrectedAuditText ||
    !result.hasSignalText ||
    !result.hasAnswerText ||
    !result.hasFullMcqText
  ) {
    throw new Error(`Question ledger readiness copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasPublicPreviewLink || !result.hasFullLedgerLink) {
    throw new Error(`Question ledger readiness links are incomplete: ${JSON.stringify(result.links)}`);
  }
  if (result.markCount < 4) throw new Error(`Expected highlighted matched signals: ${JSON.stringify(result)}`);
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
      "upsc-strategy-question-ledger-api-readiness.png"
    );
    const mobile = await verifyViewport(
      browser,
      { width: 390, height: 900 },
      "upsc-strategy-question-ledger-api-readiness-mobile.png"
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-strategy-question-ledger-api-readiness.png"),
            path.join(artifactDir, "upsc-strategy-question-ledger-api-readiness-mobile.png"),
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
