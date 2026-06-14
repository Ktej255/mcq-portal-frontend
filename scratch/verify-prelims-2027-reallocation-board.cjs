const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy`;
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

const strategyState = {
  statuses: {
    "ir-multilateral": "Building",
    "science-new-domains": "Building",
    "polity-legal-ethics": "Building",
    "economy-maintenance": "Ready",
    "medieval-reduction": "Ready",
  },
  completedModules: ["economy-master", "art-culture-bank", "history-tn-board", "format-rebuilder"],
  completedTasks: [
    "ir-source-matrix",
    "ir-static-current-bridge",
    "st-domain-capsules",
    "st-current-source-tags",
    "polity-act-text-pack",
    "eco-maintenance-test",
    "medieval-planner-cap",
  ],
  queuedBlueprints: [
    "ir-body-match-pair",
    "ir-summit-how-many",
    "st-ai-application-multi",
    "st-semiconductor-exception",
  ],
};

const handoffs = [
  {
    id: "ir-body-match-pair-2026-06-10T00:00:00.000Z",
    blueprintId: "ir-body-match-pair",
    priorityId: "ir-multilateral",
    subjectSlug: "internal-security-society",
    day: 1,
    title: "IR body and India-link match set",
    format: "Match-pair",
    instruction: "Match IR bodies with India-link facts.",
    matchedGap: "Directly repairs the 2026 multilateral-body misses.",
    expectedOutput: "25 match-pair questions with one close institutional distractor per pair.",
    difficulty: "PYQ_STYLE",
    plannedQuestions: 25,
    minutes: 45,
    generatedAt: "2026-06-10T00:00:00.000Z",
  },
  {
    id: "st-ai-application-multi-2026-06-10T00:01:00.000Z",
    blueprintId: "st-ai-application-multi",
    priorityId: "science-new-domains",
    subjectSlug: "science-tech",
    day: 1,
    title: "AI, blockchain and quantum application pack",
    format: "Multi-statement",
    instruction: "Create applied Science and Tech questions.",
    matchedGap: "Targets the new-domain Science and Tech surprise layer.",
    expectedOutput: "35 multi-statement questions with one technical limitation trap in each.",
    difficulty: "HARD",
    plannedQuestions: 35,
    minutes: 55,
    generatedAt: "2026-06-10T00:01:00.000Z",
  },
];

const mcqBatches = {
  "internal-security-society-day-1": {
    planned: 25,
    drafted: 25,
    difficulty: "PYQ_STYLE",
    status: "READY",
    updatedAt: "2026-06-10T00:10:00.000Z",
    strategyBlueprintId: "ir-body-match-pair",
    strategyTitle: "IR body and India-link match set",
    strategyFormat: "Match-pair",
  },
};

const attempts = {
  "strategy-ir-body-match-pair-1": {
    questionId: "strategy-ir-body-match-pair-1",
    subjectSlug: "internal-security-society",
    linkedDay: 1,
    topic: "IR body and India-link match set",
    difficulty: "PYQ_STYLE",
    source: "UPSC_2027_STRATEGY",
    selectedOption: "A",
    correctOption: "A",
    isCorrect: true,
    solvedAt: "2026-06-10T00:20:00.000Z",
  },
};

async function seedLocalState(context) {
  await context.addInitScript(
    ({ profile, strategyState, handoffs, mcqBatches, attempts }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_prelims_2027_reallocation_board");
      window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
      window.localStorage.setItem("sarit-upsc-prelims-2027-strategy-v1", JSON.stringify(strategyState));
      window.localStorage.setItem("sarit-upsc-2027-practice-handoffs-v1", JSON.stringify(handoffs));
      window.localStorage.setItem("sarit-upsc-mcq-command-v1", JSON.stringify(mcqBatches));
      window.localStorage.setItem("sarit-upsc-question-bank-attempts-v1", JSON.stringify(attempts));
    },
    { profile, strategyState, handoffs, mcqBatches, attempts }
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
  await page.getByTestId("prelims-2027-reallocation-board").waitFor({ state: "visible", timeout: 15000 });

  const result = await page.evaluate(() => {
    const board = document.querySelector('[data-testid="prelims-2027-reallocation-board"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="prelims-2027-reallocation-row"]'));
    const decisions = rows.map((row) => row.getAttribute("data-decision"));
    const stages = rows.map((row) => row.getAttribute("data-stage"));
    const priorityIds = rows.map((row) => row.getAttribute("data-priority-id"));
    const progressValues = rows.map((row) => Number(row.getAttribute("data-progress")));
    const text = document.body.innerText;

    return {
      hasBoard: Boolean(board),
      rowCount: rows.length,
      decisions,
      stages,
      priorityIds,
      progressValues,
      hasBuildFromScratch: decisions.includes("Build from scratch"),
      hasDepthUpgrade: decisions.includes("Depth upgrade"),
      hasPatchAndTag: decisions.includes("Patch and tag"),
      hasMaintain: decisions.includes("Maintain"),
      hasReduce: decisions.includes("Reduce"),
      hasCriticalPriorities: priorityIds.includes("ir-multilateral") && priorityIds.includes("science-new-domains"),
      hasSourceShift: text.includes("Official body pages, charters, summit declarations"),
      hasMcqTarget: text.includes("100+ applied questions across AI, blockchain, quantum"),
      hasReleaseGate: text.includes("No public or student-facing claim until each body has source"),
      hasStudentSignal: text.includes("Student can solve use-case and limitation questions"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasBoard) throw new Error("Reallocation board did not render.");
  if (result.rowCount !== 8) throw new Error(`Expected 8 reallocation rows, found ${result.rowCount}.`);
  if (
    !result.hasBuildFromScratch ||
    !result.hasDepthUpgrade ||
    !result.hasPatchAndTag ||
    !result.hasMaintain ||
    !result.hasReduce
  ) {
    throw new Error(`Missing reallocation decisions: ${JSON.stringify(result.decisions)}`);
  }
  if (!result.hasCriticalPriorities) {
    throw new Error(`Critical reallocation priorities are missing: ${JSON.stringify(result.priorityIds)}`);
  }
  if (!result.progressValues.some((value) => value > 0)) {
    throw new Error(`Reallocation progress did not reflect seeded execution state: ${JSON.stringify(result.progressValues)}`);
  }
  if (!result.hasSourceShift || !result.hasMcqTarget || !result.hasReleaseGate || !result.hasStudentSignal) {
    throw new Error(`Reallocation board content is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 2600) throw new Error("Page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("prelims-2027-reallocation-board").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2027-reallocation-board.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2027-reallocation-board-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2027-reallocation-board.png"),
            path.join(artifactDir, "upsc-prelims-2027-reallocation-board-mobile.png"),
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
