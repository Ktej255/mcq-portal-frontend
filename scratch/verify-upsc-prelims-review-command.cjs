const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-review-command`;
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

function assert(condition, message, payload) {
  if (!condition) {
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 3000)}` : message);
  }
}

async function seedAdminState(context) {
  await context.addInitScript(({ profile }) => {
    window.MOCK_TOKEN = "MOCK_TOKEN_MASTER_prelims_review_command";
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_prelims_review_command");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
    window.localStorage.setItem("upsc-student-profile-v1", JSON.stringify(profile));
  }, { profile });
}

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await seedAdminState(context);
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle", timeout: 70000 });
  await page.getByTestId("prelims-review-command").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForFunction(
    () => {
      const section = document.querySelector('[data-testid="prelims-review-command"]');
      return (
        section?.getAttribute("data-source-candidate-questions") === "98" &&
        section?.getAttribute("data-source-blind-spots") === "2"
      );
    },
    null,
    { timeout: 50000 }
  );

  const result = await page.evaluate(() => {
    const root = document.querySelector('[data-testid="prelims-review-command"]');
    const source = document.querySelector('[data-testid="prelims-review-command-source-readiness"]');
    const actionLanes = Array.from(document.querySelectorAll('[data-testid="prelims-review-command-action-lane"]'));
    const priorityRows = Array.from(document.querySelectorAll('[data-testid="prelims-review-command-priority-row"]'));
    const quickLinks = Array.from(document.querySelectorAll('[data-testid="prelims-review-command-quick-link"]'));
    const activeLink = Array.from(document.querySelectorAll("a")).find((link) =>
      link.className.includes("bg-[#1a3a2a]")
    );
    const hrefs = Array.from(document.querySelectorAll("a")).map((link) => link.getAttribute("href") || "");
    const text = document.body.innerText;

    return {
      url: window.location.pathname,
      hasRoot: Boolean(root),
      headerHasTitle: Array.from(document.querySelectorAll("header *")).some(
        (node) => node.textContent?.trim() === "Prelims Review"
      ),
      sidebarHasReviewCommand: Boolean(document.querySelector('a[href="/upsc/prelims-review-command"]')),
      activeHref: activeLink?.getAttribute("href") || "",
      effectiveCoverage: Number(root?.getAttribute("data-effective-coverage")),
      questionCount: Number(root?.getAttribute("data-question-count")),
      completeQuestions: Number(root?.getAttribute("data-complete-questions")),
      statementRows: Number(root?.getAttribute("data-statement-rows")),
      multiStatementQuestions: Number(root?.getAttribute("data-multi-statement-questions")),
      priorityCount: Number(root?.getAttribute("data-priority-count")),
      criticalPriorityCount: Number(root?.getAttribute("data-critical-priority-count")),
      taskCount: Number(root?.getAttribute("data-task-count")),
      practiceBlueprintCount: Number(root?.getAttribute("data-practice-blueprint-count")),
      buildFromScratchCount: Number(root?.getAttribute("data-build-from-scratch-count")),
      sourceStatus: root?.getAttribute("data-source-status"),
      sourceCandidateQuestions: Number(root?.getAttribute("data-source-candidate-questions")),
      sourceBlindSpots: Number(root?.getAttribute("data-source-blind-spots")),
      sourceSectionCandidateQuestions: Number(source?.getAttribute("data-candidate-questions")),
      sourceSectionBlindSpots: Number(source?.getAttribute("data-blind-spots")),
      actionLaneCount: actionLanes.length,
      actionLaneTitles: actionLanes.map((lane) => lane.getAttribute("data-title")),
      priorityRowCount: priorityRows.length,
      priorityIds: priorityRows.map((row) => row.getAttribute("data-priority-id")),
      priorityBands: priorityRows.map((row) => row.getAttribute("data-priority")),
      quickLinkHrefs: quickLinks.map((link) => link.getAttribute("href")),
      hasPublicShowcaseLink: hrefs.includes("/upsc-prelims-2026-showcase"),
      hasStrategyLink: hrefs.includes("/upsc/prelims-2027-strategy"),
      hasProofQueueLink: hrefs.includes("/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue"),
      hasSourceGapLink: hrefs.includes("/upsc/prelims-2027-strategy#prelims-2026-source-gap-work-orders"),
      hasReallocationLink: hrefs.includes("/upsc/prelims-2027-strategy#prelims-2027-reallocation-board"),
      hasReviewCommandApiLink: hrefs.includes("/api/upsc/prelims-2026/review-command"),
      hasMainSiteApiLink: hrefs.includes("/api/upsc/prelims-2026/release-decision"),
      hasMcqCommandLink: hrefs.includes("/upsc/mcq-command"),
      hasReviewCopy: /2026 review to 2027 action/i.test(text) && text.includes("Prelims Review Command"),
      hasWebsiteCopy: text.includes("main site") && text.includes("publish safely"),
      hasNoInternalPublicLeak: !/D:\\\\|Paid Students|Mians ready/i.test(text),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  assert(result.url === "/upsc/prelims-review-command", "Unexpected route", result);
  assert(result.hasRoot, "Prelims Review Command did not render", result);
  assert(result.headerHasTitle, "Dashboard header title is missing", result);
  assert(result.sidebarHasReviewCommand, "Sidebar Review Command link is missing", result);
  assert(result.activeHref === "/upsc/prelims-review-command", "Active sidebar route is wrong", result);
  assert(result.effectiveCoverage === 76, "Corrected coverage should be 76%", result);
  assert(result.questionCount === 100 && result.completeQuestions === 100, "Question ledger counts are wrong", result);
  assert(result.statementRows === 275 && result.multiStatementQuestions === 75, "Question format counts are wrong", result);
  assert(result.priorityCount === 8 && result.criticalPriorityCount === 2, "Priority counts are wrong", result);
  assert(result.taskCount === 34 && result.practiceBlueprintCount === 16, "Strategy task counts are wrong", result);
  assert(result.buildFromScratchCount === 2, "Build-from-scratch count is wrong", result);
  assert(result.sourceStatus === "ready", "Source readiness did not reach ready state", result);
  assert(
    result.sourceCandidateQuestions === 98 &&
      result.sourceBlindSpots === 2 &&
      result.sourceSectionCandidateQuestions === 98 &&
      result.sourceSectionBlindSpots === 2,
    "Source archive readiness counts are wrong",
    result
  );
  assert(result.actionLaneCount === 6, "Action lane count is wrong", result);
  for (const title of [
    "Website Release",
    "MCQ Proof Lock",
    "Source Archive Triage",
    "2027 Reallocation",
    "Practice Build",
    "Delivery Tracking",
  ]) {
    assert(result.actionLaneTitles.includes(title), `Missing action lane ${title}`, result);
  }
  assert(result.priorityRowCount === 8, "Expected 8 priority rows", result);
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
    assert(result.priorityIds.includes(id), `Missing priority row ${id}`, result);
  }
  assert(result.priorityBands.filter((band) => band === "Critical").length === 2, "Critical priority rows are wrong", result);
  for (const href of [
    "/upsc-prelims-2026-showcase",
    "/upsc/prelims-2027-strategy",
    "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
  ]) {
    assert(result.quickLinkHrefs.includes(href), `Missing quick link ${href}`, result);
  }
  assert(
    result.hasPublicShowcaseLink &&
      result.hasStrategyLink &&
      result.hasProofQueueLink &&
      result.hasSourceGapLink &&
      result.hasReallocationLink &&
      result.hasReviewCommandApiLink &&
      result.hasMainSiteApiLink &&
      result.hasMcqCommandLink,
    "Expected command links are missing",
    result
  );
  assert(result.hasReviewCopy && result.hasWebsiteCopy, "Command copy is incomplete", result);
  assert(result.hasNoInternalPublicLeak, "Route leaks raw archive/internal folder wording", result);
  assert(!result.mentionsWebinar, "Page still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Framework error overlay is visible", result);
  assert(!result.horizontalOverflow, "Page has horizontal overflow", result);
  assert(result.textLength > 4000, "Page appears under-rendered", result);
  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`, result);

  await page.getByTestId("prelims-review-command").screenshot({
    path: path.join(artifactDir, fileName),
  });
  await context.close();

  return result;
}

async function verifyPublicSoftwarePath(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}/upsc-prelims-2026-showcase#software-path`, { waitUntil: "domcontentloaded", timeout: 70000 });
  await page.locator("#software-path").waitFor({ state: "visible", timeout: 30000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector("#software-path");
    const sectionText = section?.textContent || "";
    const hrefs = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href") || "");
    const text = document.body.innerText;

    return {
      url: window.location.pathname,
      hasSoftwarePath: Boolean(section),
      hasReviewCommandLink: hrefs.includes("/upsc/prelims-review-command"),
      hasReviewCommandCopy:
        sectionText.includes("Prelims Review Command") && sectionText.includes("main-site release gate"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: sectionText.trim().length,
    };
  });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !message.includes("hydrated but some attributes of the server rendered HTML")
  );

  assert(result.url === "/upsc-prelims-2026-showcase", "Unexpected public showcase route", result);
  assert(result.hasSoftwarePath, "Public software-path section is missing", result);
  assert(result.hasReviewCommandLink, "Public software-path does not link to Review Command", result);
  assert(result.hasReviewCommandCopy, "Public software-path copy does not include Review Command", result);
  assert(!result.mentionsWebinar, "Public showcase still contains webinar wording", result);
  assert(!result.hasErrorOverlay, "Public showcase has a framework error overlay", result);
  assert(!result.horizontalOverflow, "Public showcase has horizontal overflow", result);
  assert(result.textLength > 1200, "Public software-path section appears under-rendered", result);
  assert(blockingConsoleErrors.length === 0, `Public showcase console errors: ${blockingConsoleErrors.join(" | ")}`, result);

  await page.locator("#software-path").screenshot({
    path: path.join(artifactDir, "upsc-showcase-software-path-review-command.png"),
  });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-review-command.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-review-command-mobile.png");
    const publicSoftwarePath = await verifyPublicSoftwarePath(browser);

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          publicSoftwarePath,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-review-command.png"),
            path.join(artifactDir, "upsc-prelims-review-command-mobile.png"),
            path.join(artifactDir, "upsc-showcase-software-path-review-command.png"),
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
