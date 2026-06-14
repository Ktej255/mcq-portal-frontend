const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/revision-command`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const completedTasks = [
  "st-student-release",
  "geo-current-updater",
  "ancient-revision-route",
  "medieval-revision-only",
];

async function seedLocalState(context) {
  await context.addInitScript((seededTasks) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_revision_strategy_overlay");
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
  await page.getByTestId("upsc-2027-revision-strategy-overlay").waitFor({ state: "visible", timeout: 20000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="upsc-2027-revision-strategy-overlay"]');
    const formatRules = Array.from(document.querySelectorAll('[data-testid="upsc-2027-revision-format-rule"]'));
    const priorityRows = Array.from(document.querySelectorAll('[data-testid="upsc-2027-revision-priority-row"]'));
    const blueprintLinks = Array.from(document.querySelectorAll('[data-testid="upsc-2027-revision-blueprint-link"]'));
    const taskLinks = Array.from(document.querySelectorAll('[data-testid="upsc-2027-revision-task-link"]'));
    const text = document.body.innerText;

    return {
      url: window.location.pathname,
      hasSection: Boolean(section),
      formatRuleCount: Number(section?.getAttribute("data-format-rule-count")),
      priorityRowCount: Number(section?.getAttribute("data-priority-row-count")),
      revisionTaskCount: Number(section?.getAttribute("data-revision-task-count")),
      completedRevisionTaskCount: Number(section?.getAttribute("data-completed-revision-task-count")),
      blueprintCount: Number(section?.getAttribute("data-blueprint-count")),
      maintenanceBlueprintCount: Number(section?.getAttribute("data-maintenance-blueprint-count")),
      sprintCount: Number(section?.getAttribute("data-sprint-count")),
      proofRule: section?.getAttribute("data-proof-rule"),
      renderedFormatRules: formatRules.length,
      renderedPriorityRows: priorityRows.length,
      renderedBlueprintLinks: blueprintLinks.length,
      renderedTaskLinks: taskLinks.length,
      formatIds: formatRules.map((rule) => rule.getAttribute("data-format-id")),
      targetPercents: formatRules.map((rule) => Number(rule.getAttribute("data-target-percent"))),
      priorityIds: priorityRows.map((row) => row.getAttribute("data-priority-id")),
      doneTaskIds: taskLinks
        .filter((task) => task.getAttribute("data-done") === "true")
        .map((task) => task.getAttribute("data-task-id")),
      phaseSet: Array.from(new Set(taskLinks.map((task) => task.getAttribute("data-phase")))),
      hasBlueprintsLink: Boolean(section?.querySelector('a[href="/upsc/prelims-2027-strategy#practice-blueprints"]')),
      hasMcqCommandLink: Boolean(section?.querySelector('a[href="/upsc/mcq-command"]')),
      hasFormatCopy: text.includes("multi-statement") && text.includes("how-many-correct") && text.includes("scenario caselets"),
      hasRevisionOnlyCopy: text.includes("revision-only") && text.includes("Medieval essentials maintenance"),
      hasMaintenanceCopy: text.includes("TReDS and MSME finance maintenance") && text.includes("Bond taxonomy"),
      hasLegalCurrentCopy: text.includes("BNSS procedure caselet") && text.includes("RPwD rights assertion-reason"),
      hasMapAncientCopy: text.includes("Places-in-news match radar") && text.includes("TN Board Ancient source counter"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (result.url !== "/upsc/revision-command") throw new Error(`Unexpected route after navigation: ${result.url}`);
  if (!result.hasSection) throw new Error("2027 revision strategy overlay did not render.");
  if (result.formatRuleCount !== 6 || result.renderedFormatRules !== 6) {
    throw new Error(`Expected six format rules: ${JSON.stringify(result)}`);
  }
  if (result.priorityRowCount !== 8 || result.renderedPriorityRows !== 8) {
    throw new Error(`Expected eight revision priority rows: ${JSON.stringify(result)}`);
  }
  if (result.revisionTaskCount !== 9 || result.renderedTaskLinks !== 9) {
    throw new Error(`Expected nine release/planner tasks: ${JSON.stringify(result)}`);
  }
  if (result.blueprintCount !== 16 || result.renderedBlueprintLinks !== 16) {
    throw new Error(`Expected sixteen practice blueprint links: ${JSON.stringify(result)}`);
  }
  if (result.maintenanceBlueprintCount !== 4 || result.sprintCount !== 3) {
    throw new Error(`Maintenance or sprint counts are wrong: ${JSON.stringify(result)}`);
  }
  if (result.completedRevisionTaskCount !== completedTasks.length) {
    throw new Error(`Completed task count mismatch: ${JSON.stringify(result)}`);
  }
  for (const id of [
    "multi-statement",
    "how-many-correct",
    "match-pair",
    "not-exception",
    "assertion-reason",
    "scenario-caselet",
  ]) {
    if (!result.formatIds.includes(id)) throw new Error(`Missing format ${id}: ${JSON.stringify(result)}`);
  }
  for (const percent of [50, 15, 10, 5]) {
    if (!result.targetPercents.includes(percent)) throw new Error(`Missing target percent ${percent}: ${JSON.stringify(result)}`);
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
  if (!result.phaseSet.includes("Release") || !result.phaseSet.includes("Planner")) {
    throw new Error(`Expected Release and Planner phases: ${JSON.stringify(result)}`);
  }
  if (result.proofRule !== "format-rebuild-maintenance-revision-only") {
    throw new Error(`Proof rule missing: ${JSON.stringify(result)}`);
  }
  if (!result.hasBlueprintsLink || !result.hasMcqCommandLink) {
    throw new Error(`Revision handoff links missing: ${JSON.stringify(result)}`);
  }
  if (
    !result.hasFormatCopy ||
    !result.hasRevisionOnlyCopy ||
    !result.hasMaintenanceCopy ||
    !result.hasLegalCurrentCopy ||
    !result.hasMapAncientCopy
  ) {
    throw new Error(`Revision strategy copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 7500) throw new Error(`Revision Command page appears under-rendered: ${JSON.stringify(result)}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("upsc-2027-revision-strategy-overlay").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-revision-strategy-overlay.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-revision-strategy-overlay-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-revision-strategy-overlay.png"),
            path.join(artifactDir, "upsc-revision-strategy-overlay-mobile.png"),
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
