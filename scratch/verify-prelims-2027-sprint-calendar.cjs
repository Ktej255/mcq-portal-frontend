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
    "economy-maintenance": "Ready",
  },
  completedModules: ["economy-master", "art-culture-bank", "history-tn-board", "format-rebuilder"],
  completedTasks: [
    "ir-source-matrix",
    "ir-static-current-bridge",
    "st-domain-capsules",
    "st-current-source-tags",
    "polity-act-text-pack",
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
  },
  {
    blueprintId: "ir-summit-how-many",
    priorityId: "ir-multilateral",
    subjectSlug: "internal-security-society",
    day: 1,
    title: "Summit, charter and convention counter",
    format: "How-many-correct",
    instruction: "Count correct IR statements.",
    matchedGap: "Turns absent IR theory into UPSC's how-many-correct pressure format.",
    expectedOutput: "30 how-many-correct questions with source tags and current bridges.",
    difficulty: "PYQ_STYLE",
    plannedQuestions: 30,
    minutes: 50,
  },
  {
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
  },
  {
    blueprintId: "st-semiconductor-exception",
    priorityId: "science-new-domains",
    subjectSlug: "science-tech",
    day: 1,
    title: "Semiconductor and rare-earth exception drill",
    format: "NOT / Exception",
    instruction: "Ask incorrect statements on strategic technology.",
    matchedGap: "Forces students to separate broad current affairs from exact technical scope.",
    expectedOutput: "25 NOT/exception questions connected to official policy language.",
    difficulty: "PYQ_STYLE",
    plannedQuestions: 25,
    minutes: 40,
  },
].map((handoff, index) => ({
  id: `${handoff.blueprintId}-2026-06-10T00:0${index}:00.000Z`,
  generatedAt: `2026-06-10T00:0${index}:00.000Z`,
  ...handoff,
}));

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
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_prelims_2027_sprint_calendar");
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
  await page.getByTestId("prelims-2027-sprint-calendar").waitFor({ state: "visible", timeout: 15000 });

  const result = await page.evaluate(() => {
    const calendar = document.querySelector('[data-testid="prelims-2027-sprint-calendar"]');
    const rows = Array.from(document.querySelectorAll('[data-testid="prelims-2027-sprint-row"]'));
    const statuses = rows.map((row) => row.getAttribute("data-sprint-status"));
    const progressValues = rows.map((row) => Number(row.getAttribute("data-sprint-progress")));
    const text = document.body.innerText;

    return {
      hasCalendar: Boolean(calendar),
      rowCount: rows.length,
      statuses,
      progressValues,
      hasReady: statuses.includes("Ready"),
      hasBuilding: statuses.includes("Building"),
      hasPlanned: statuses.includes("Planned"),
      hasWeeksOneTwo: rows.some((row) => row.getAttribute("data-sprint-id") === "sprint-1-source-foundation"),
      hasSprintTitle: text.includes("Build the two missing pillars first"),
      hasProofGate: text.includes("No public claim beyond 'critical build started' until official source rows exist."),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      mentionsWebinar: /webinar/i.test(text),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasCalendar) throw new Error("Sprint calendar did not render.");
  if (result.rowCount !== 6) throw new Error(`Expected 6 sprint rows, found ${result.rowCount}.`);
  if (!result.hasReady || !result.hasBuilding || !result.hasPlanned) {
    throw new Error(`Missing expected sprint statuses: ${JSON.stringify(result.statuses)}`);
  }
  if (!result.progressValues.some((value) => value === 100)) throw new Error("No sprint reached 100% progress.");
  if (!result.hasWeeksOneTwo || !result.hasSprintTitle || !result.hasProofGate) {
    throw new Error(`Sprint calendar copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 2200) throw new Error("Page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("prelims-2027-sprint-calendar").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-prelims-2027-sprint-calendar.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-prelims-2027-sprint-calendar-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-prelims-2027-sprint-calendar.png"),
            path.join(artifactDir, "upsc-prelims-2027-sprint-calendar-mobile.png"),
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
