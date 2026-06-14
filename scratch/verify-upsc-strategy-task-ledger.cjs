const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy#prelims-2027-task-ledger`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");
const storageKey = "sarit-upsc-prelims-2027-strategy-v1";
const seededCompletedTasks = [
  "ir-source-matrix",
  "st-domain-capsules",
  "env-framework-pack",
  "medieval-revision-only",
];
const expectedPriorityIds = [
  "ir-multilateral",
  "science-new-domains",
  "polity-legal-ethics",
  "environment-current",
  "geography-international",
  "ancient-tn-board",
  "economy-maintenance",
  "medieval-reduction",
];
const expectedTaskIds = [
  "ir-source-matrix",
  "ir-static-current-bridge",
  "ir-mcq-bank",
  "ir-proof-release",
  "st-domain-capsules",
  "st-current-source-tags",
  "st-applied-mcq-bank",
  "st-student-release",
  "polity-act-text-pack",
  "polity-caselet-bank",
  "polity-simulator-tags",
  "polity-proof-lock",
  "env-framework-pack",
  "env-species-policy-crosswalk",
  "env-current-mcq",
  "env-monthly-bridge",
  "geo-map-radar",
  "geo-atlas-drills",
  "geo-map-mcq-bank",
  "geo-current-updater",
  "geo-map-proof-lock",
  "ancient-tn-source-pack",
  "ancient-deep-fact-ledger",
  "ancient-multi-statement",
  "ancient-revision-route",
  "eco-treds-patch",
  "eco-bond-taxonomy",
  "eco-irdai-pack",
  "eco-regulator-proof-lock",
  "eco-maintenance-test",
  "medieval-effort-cap",
  "medieval-maintenance-sheet",
  "medieval-reallocate-hours",
  "medieval-revision-only",
];

async function seedLocalState(context) {
  await context.addInitScript(
    ({ storageKey, tasks }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_strategy_task_ledger");
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          statuses: {},
          completedModules: [],
          completedTasks: tasks,
          queuedBlueprints: [],
        })
      );
    },
    { storageKey, tasks: seededCompletedTasks }
  );
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
  await page.getByTestId("prelims-2027-task-ledger").waitFor({ state: "visible", timeout: 20000 });
  await page.locator('[data-testid="prelims-2027-task-priority-group"][data-priority-id="ir-multilateral"]').evaluate((node) => {
    node.setAttribute("open", "");
  });

  const initial = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="prelims-2027-task-ledger"]');
    const groups = Array.from(document.querySelectorAll('[data-testid="prelims-2027-task-priority-group"]'));
    const tasks = Array.from(document.querySelectorAll('[data-testid="prelims-2027-execution-task"]'));
    const links = Array.from(document.querySelectorAll('[data-testid="prelims-2027-execution-task-owner-link"]'));
    const text = document.body.innerText;
    const sectionText = section?.textContent || "";

    return {
      url: window.location.pathname,
      hasSection: Boolean(section),
      proofRule: section?.getAttribute("data-proof-rule"),
      taskCount: Number(section?.getAttribute("data-task-count")),
      completedTaskCount: Number(section?.getAttribute("data-completed-task-count")),
      priorityCount: Number(section?.getAttribute("data-priority-count")),
      sourceCount: Number(section?.getAttribute("data-source-count")),
      capsuleCount: Number(section?.getAttribute("data-capsule-count")),
      mcqCount: Number(section?.getAttribute("data-mcq-count")),
      proofCount: Number(section?.getAttribute("data-proof-count")),
      releaseCount: Number(section?.getAttribute("data-release-count")),
      plannerCount: Number(section?.getAttribute("data-planner-count")),
      renderedGroups: groups.length,
      renderedTasks: tasks.length,
      groupIds: groups.map((group) => group.getAttribute("data-priority-id")),
      groupTaskCounts: Object.fromEntries(groups.map((group) => [group.getAttribute("data-priority-id"), Number(group.getAttribute("data-task-count"))])),
      taskIds: tasks.map((task) => task.getAttribute("data-task-id")),
      completedTaskIds: tasks
        .filter((task) => task.getAttribute("data-completed") === "true")
        .map((task) => task.getAttribute("data-task-id")),
      phaseSet: Array.from(new Set(tasks.map((task) => task.getAttribute("data-phase")))).sort(),
      ownerSet: Array.from(new Set(tasks.map((task) => task.getAttribute("data-owner-surface")))).sort(),
      routeSet: Array.from(new Set(links.map((link) => link.getAttribute("href")))).sort(),
      hasBuildCopy: sectionText.includes("Break every priority into source, capsule, MCQ, proof and release work"),
      hasFinalPdfCopy: text.includes("Priority matrix from the final PDF"),
      hasIrCopy: sectionText.includes("Draft 80 IR UPSC-format MCQs"),
      hasScienceCopy: sectionText.includes("Create six new-domain S&T capsules"),
      hasEconomyCopy: sectionText.includes("Proof-lock residual Economy patches"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (initial.url !== "/upsc/prelims-2027-strategy") {
    throw new Error(`Unexpected route after navigation: ${initial.url}`);
  }
  if (!initial.hasSection) throw new Error("Strategy task ledger did not render.");
  if (initial.proofRule !== "pdf-priority-to-source-capsule-mcq-proof-release-planner") {
    throw new Error(`Wrong proof rule: ${JSON.stringify(initial)}`);
  }
  if (initial.taskCount !== 34 || initial.renderedTasks !== 34) {
    throw new Error(`Expected 34 execution tasks: ${JSON.stringify(initial)}`);
  }
  if (initial.completedTaskCount !== seededCompletedTasks.length) {
    throw new Error(`Seeded task completion did not sync: ${JSON.stringify(initial)}`);
  }
  if (
    initial.priorityCount !== 8 ||
    initial.renderedGroups !== 8 ||
    initial.sourceCount !== 7 ||
    initial.capsuleCount !== 6 ||
    initial.mcqCount !== 7 ||
    initial.proofCount !== 5 ||
    initial.releaseCount !== 5 ||
    initial.plannerCount !== 4
  ) {
    throw new Error(`Task ledger counts are wrong: ${JSON.stringify(initial)}`);
  }
  for (const id of expectedPriorityIds) {
    if (!initial.groupIds.includes(id)) throw new Error(`Missing priority group ${id}: ${JSON.stringify(initial)}`);
  }
  if (initial.groupTaskCounts["geography-international"] !== 5 || initial.groupTaskCounts["economy-maintenance"] !== 5) {
    throw new Error(`Five-task priority groups are wrong: ${JSON.stringify(initial)}`);
  }
  for (const id of expectedTaskIds) {
    if (!initial.taskIds.includes(id)) throw new Error(`Missing execution task ${id}: ${JSON.stringify(initial)}`);
  }
  for (const id of seededCompletedTasks) {
    if (!initial.completedTaskIds.includes(id)) throw new Error(`Seeded completed task missing ${id}: ${JSON.stringify(initial)}`);
  }
  for (const phase of ["Capsule", "MCQ", "Planner", "Proof", "Release", "Source"]) {
    if (!initial.phaseSet.includes(phase)) throw new Error(`Missing phase ${phase}: ${JSON.stringify(initial)}`);
  }
  for (const href of [
    "/upsc/source-library",
    "/upsc/content-command?subject=internal-security-society&day=1",
    "/upsc/mcq-command?subject=internal-security-society&day=1",
    "/upsc/question-bank",
    "/upsc/current-affairs",
    "/upsc/revision-command",
    "/upsc/yearly-planner",
  ]) {
    if (!initial.routeSet.includes(href)) throw new Error(`Missing owner route ${href}: ${JSON.stringify(initial)}`);
  }
  if (!initial.hasBuildCopy || !initial.hasFinalPdfCopy || !initial.hasIrCopy || !initial.hasScienceCopy || !initial.hasEconomyCopy) {
    throw new Error(`Strategy task ledger copy is incomplete: ${JSON.stringify(initial)}`);
  }
  if (initial.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (initial.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (initial.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (initial.textLength < 12000) throw new Error(`Strategy command appears under-rendered: ${JSON.stringify(initial)}`);
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  const toggleRow = page.locator('[data-testid="prelims-2027-execution-task"][data-task-id="ir-mcq-bank"]');
  await toggleRow.locator('[data-testid="prelims-2027-execution-task-checkbox"]').click();
  await page.waitForFunction(() => {
    const section = document.querySelector('[data-testid="prelims-2027-task-ledger"]');
    const row = document.querySelector('[data-testid="prelims-2027-execution-task"][data-task-id="ir-mcq-bank"]');
    return section?.getAttribute("data-completed-task-count") === "5" && row?.getAttribute("data-completed") === "true";
  });

  const afterToggle = await page.evaluate(({ storageKey }) => {
    const section = document.querySelector('[data-testid="prelims-2027-task-ledger"]');
    const row = document.querySelector('[data-testid="prelims-2027-execution-task"][data-task-id="ir-mcq-bank"]');
    const group = document.querySelector('[data-testid="prelims-2027-task-priority-group"][data-priority-id="ir-multilateral"]');
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}");

    return {
      completedTaskCount: Number(section?.getAttribute("data-completed-task-count")),
      rowCompleted: row?.getAttribute("data-completed"),
      groupCompletedCount: Number(group?.getAttribute("data-completed-count")),
      storedHasTask: Array.isArray(parsed.completedTasks) && parsed.completedTasks.includes("ir-mcq-bank"),
    };
  }, { storageKey });

  if (
    afterToggle.completedTaskCount !== 5 ||
    afterToggle.rowCompleted !== "true" ||
    afterToggle.groupCompletedCount !== 2 ||
    !afterToggle.storedHasTask
  ) {
    throw new Error(`Task toggle did not persist: ${JSON.stringify(afterToggle)}`);
  }

  await page.getByTestId("prelims-2027-task-ledger").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return { initial, afterToggle };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-strategy-task-ledger.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-strategy-task-ledger-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-strategy-task-ledger.png"),
            path.join(artifactDir, "upsc-strategy-task-ledger-mobile.png"),
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
