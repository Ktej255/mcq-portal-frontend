const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/content-command?subject=internal-security-society&day=1`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const completedTasks = [
  "ir-source-matrix",
  "st-domain-capsules",
  "env-species-policy-crosswalk",
  "eco-irdai-pack",
  "ancient-tn-source-pack",
];

async function seedLocalState(context) {
  await context.addInitScript((seededTasks) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_content_strategy_overlay");
    window.localStorage.setItem(
      "sarit-upsc-prelims-2027-strategy-v1",
      JSON.stringify({
        statuses: {},
        completedModules: [],
        completedTasks: seededTasks,
        queuedBlueprints: [],
      })
    );
  }, completedTasks);
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
  await page.getByTestId("upsc-2027-content-source-build-overlay").waitFor({ state: "visible", timeout: 20000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="upsc-2027-content-source-build-overlay"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="upsc-2027-content-source-build-row"]'));
    const tasks = Array.from(document.querySelectorAll('[data-testid="upsc-2027-content-source-build-task"]'));
    const activeRows = rows.filter((row) => row.getAttribute("data-active-subject") === "true");
    const text = document.body.innerText;

    return {
      url: `${window.location.pathname}${window.location.search}`,
      hasSection: Boolean(section),
      sourceBuildCount: Number(section?.getAttribute("data-source-build-count")),
      taskCount: Number(section?.getAttribute("data-task-count")),
      completedTaskCount: Number(section?.getAttribute("data-completed-task-count")),
      activeSubject: section?.getAttribute("data-active-subject"),
      activeTaskCount: Number(section?.getAttribute("data-active-task-count")),
      activeCompletedTaskCount: Number(section?.getAttribute("data-active-completed-task-count")),
      criticalCount: Number(section?.getAttribute("data-critical-count")),
      proofRule: section?.getAttribute("data-proof-rule"),
      renderedRows: rows.length,
      renderedTasks: tasks.length,
      priorityIds: rows.map((row) => row.getAttribute("data-priority-id")),
      subjectSlugs: rows.map((row) => row.getAttribute("data-subject-slug")),
      activePriorityIds: activeRows.map((row) => row.getAttribute("data-priority-id")),
      doneTaskIds: tasks
        .filter((task) => task.getAttribute("data-done") === "true")
        .map((task) => task.getAttribute("data-task-id")),
      phaseSet: Array.from(new Set(tasks.map((task) => task.getAttribute("data-phase")))),
      hasReallocationLink: Boolean(
        section?.querySelector('a[href="/upsc/prelims-2027-strategy#prelims-2027-reallocation-board"]')
      ),
      hasSourceArchiveLink: Boolean(section?.querySelector('a[href="/upsc/source-library#upsc-morning-batch-archive-intake"]')),
      hasBuildOrderCopy: text.includes("teacher build orders") && text.includes("before the portal expands MCQ volume"),
      hasIrCopy: text.includes("ASEAN, BIMSTEC, UN, G20, SCO, QUAD"),
      hasScienceCopy: text.includes("AI/LLM, blockchain, quantum, semiconductor"),
      hasEnvironmentCopy: text.includes("LT-LEDS") && text.includes("Blue Transformation"),
      hasHistoryCopy: text.includes("TN Board") && text.includes("Sangam, Tamilakam"),
      hasEconomyCopy: text.includes("TReDS") && text.includes("IRDAI"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (result.url !== "/upsc/content-command?subject=internal-security-society&day=1") {
    throw new Error(`Unexpected route after navigation: ${result.url}`);
  }
  if (!result.hasSection) throw new Error("2027 content source build overlay did not render.");
  if (result.sourceBuildCount !== 8 || result.renderedRows !== 8) {
    throw new Error(`Expected eight source build rows: ${JSON.stringify(result)}`);
  }
  if (result.taskCount !== 13 || result.renderedTasks !== 13) {
    throw new Error(`Expected 13 source/capsule tasks: ${JSON.stringify(result)}`);
  }
  if (result.completedTaskCount !== completedTasks.length) {
    throw new Error(`Completed task count mismatch: ${JSON.stringify(result)}`);
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
  for (const taskId of completedTasks) {
    if (!result.doneTaskIds.includes(taskId)) throw new Error(`Completed task did not sync: ${taskId}`);
  }
  if (result.activeSubject !== "internal-security-society" || result.activeTaskCount !== 2) {
    throw new Error(`Active subject focus is wrong: ${JSON.stringify(result)}`);
  }
  if (!result.activePriorityIds.includes("ir-multilateral") || result.activeCompletedTaskCount !== 1) {
    throw new Error(`IR active row did not highlight/sync correctly: ${JSON.stringify(result)}`);
  }
  if (!result.phaseSet.includes("Source") || !result.phaseSet.includes("Capsule")) {
    throw new Error(`Expected Source and Capsule phases: ${JSON.stringify(result)}`);
  }
  if (result.proofRule !== "source-capsule-build-before-mcq-release" || result.criticalCount !== 2) {
    throw new Error(`Proof rule or critical count missing: ${JSON.stringify(result)}`);
  }
  if (!result.hasReallocationLink || !result.hasSourceArchiveLink) {
    throw new Error(`Required handoff links are missing: ${JSON.stringify(result)}`);
  }
  if (
    !result.hasBuildOrderCopy ||
    !result.hasIrCopy ||
    !result.hasScienceCopy ||
    !result.hasEnvironmentCopy ||
    !result.hasHistoryCopy ||
    !result.hasEconomyCopy
  ) {
    throw new Error(`Source build copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 8500) throw new Error("Content Command page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("upsc-2027-content-source-build-overlay").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-content-command-strategy-overlay.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-content-command-strategy-overlay-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-content-command-strategy-overlay.png"),
            path.join(artifactDir, "upsc-content-command-strategy-overlay-mobile.png"),
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
