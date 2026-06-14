const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/current-affairs`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const completedTasks = [
  "ir-source-matrix",
  "st-current-source-tags",
  "env-framework-pack",
  "geo-map-proof-lock",
  "eco-regulator-proof-lock",
];

async function seedLocalState(context) {
  await context.addInitScript((seededTasks) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_current_affairs_strategy_overlay");
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
  await page.getByTestId("upsc-2027-current-bridge-overlay").waitFor({ state: "visible", timeout: 20000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="upsc-2027-current-bridge-overlay"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="upsc-2027-current-bridge-row"]'));
    const tasks = Array.from(document.querySelectorAll('[data-testid="upsc-2027-current-bridge-task"]'));
    const text = document.body.innerText;

    return {
      url: window.location.pathname,
      hasSection: Boolean(section),
      bridgeCount: Number(section?.getAttribute("data-bridge-count")),
      taskCount: Number(section?.getAttribute("data-task-count")),
      proofTaskCount: Number(section?.getAttribute("data-proof-task-count")),
      completedBridgeTasks: Number(section?.getAttribute("data-completed-bridge-tasks")),
      criticalCount: Number(section?.getAttribute("data-critical-count")),
      renderedRows: rows.length,
      renderedTasks: tasks.length,
      priorityIds: rows.map((row) => row.getAttribute("data-priority-id")),
      doneTaskIds: tasks
        .filter((task) => task.getAttribute("data-done") === "true")
        .map((task) => task.getAttribute("data-task-id")),
      phaseSet: Array.from(new Set(tasks.map((task) => task.getAttribute("data-phase")))),
      hasBuildQueueLink: Boolean(
        section?.querySelector('a[href="/upsc/prelims-2027-strategy#prelims-2027-build-queue"]')
      ),
      hasCourseCorrectionLink: Boolean(
        section?.querySelector('a[href="/upsc/prelims-2027-strategy#prelims-2027-course-correction-packet"]')
      ),
      hasAdminSidebarCurrentAffairs: Boolean(document.querySelector('a[href="/upsc/current-affairs"]')),
      activeHref:
        Array.from(document.querySelectorAll("a")).find((link) => link.className.includes("bg-[#1a3a2a]"))?.getAttribute("href") ||
        "",
      hasSyllabusTaggedCopy: text.includes("syllabus-tagged") && text.includes("not a date-wise news dump"),
      hasOfficialSourceCopy: text.includes("Official body pages") && text.includes("PIB, ISRO, DRDO"),
      hasEnvironmentCopy: text.includes("LT-LEDS") && text.includes("Blue Transformation"),
      hasGeographyCopy: text.includes("international map radar") && text.includes("atlas/source proof"),
      hasEconomyCopy: text.includes("TReDS") && text.includes("IRDAI"),
      hasProofLockCopy: /proof.locked|Proof-lock|proof-lock/i.test(text) && /source/i.test(text),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (result.url !== "/upsc/current-affairs") throw new Error(`Unexpected route after navigation: ${result.url}`);
  if (!result.hasSection) throw new Error("2027 current bridge overlay did not render.");
  if (result.bridgeCount !== 5 || result.renderedRows !== 5) {
    throw new Error(`Expected five current-bridge priority rows: ${JSON.stringify(result)}`);
  }
  if (result.taskCount < 17 || result.renderedTasks < 17 || result.proofTaskCount < 7) {
    throw new Error(`Current bridge task ledger is too thin: ${JSON.stringify(result)}`);
  }
  for (const id of [
    "ir-multilateral",
    "science-new-domains",
    "environment-current",
    "geography-international",
    "economy-maintenance",
  ]) {
    if (!result.priorityIds.includes(id)) throw new Error(`Missing priority ${id}: ${JSON.stringify(result)}`);
  }
  for (const taskId of completedTasks) {
    if (!result.doneTaskIds.includes(taskId)) throw new Error(`Completed task did not sync: ${taskId}`);
  }
  if (result.completedBridgeTasks !== completedTasks.length) {
    throw new Error(`Completed task count mismatch: ${JSON.stringify(result)}`);
  }
  if (!result.phaseSet.includes("Source") || !result.phaseSet.includes("Proof") || !result.phaseSet.includes("Capsule")) {
    throw new Error(`Expected Source, Proof and Capsule phases: ${JSON.stringify(result)}`);
  }
  if (!result.hasBuildQueueLink || !result.hasCourseCorrectionLink) {
    throw new Error(`Strategy handoff links missing: ${JSON.stringify(result)}`);
  }
  if (!result.hasAdminSidebarCurrentAffairs || result.activeHref !== "/upsc/current-affairs") {
    throw new Error(`Current Affairs route is not active in admin sidebar: ${JSON.stringify(result)}`);
  }
  if (
    !result.hasSyllabusTaggedCopy ||
    !result.hasOfficialSourceCopy ||
    !result.hasEnvironmentCopy ||
    !result.hasGeographyCopy ||
    !result.hasEconomyCopy ||
    !result.hasProofLockCopy
  ) {
    throw new Error(`Current bridge copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 7000) throw new Error("Current Affairs page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("upsc-2027-current-bridge-overlay").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-current-affairs-strategy-overlay.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-current-affairs-strategy-overlay-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-current-affairs-strategy-overlay.png"),
            path.join(artifactDir, "upsc-current-affairs-strategy-overlay-mobile.png"),
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
