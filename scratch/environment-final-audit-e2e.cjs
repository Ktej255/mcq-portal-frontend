const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const progressKey = "sarit-upsc-environment-progress-v1";
const mcqKey = "sarit-upsc-mcq-command-v1";
const localDraftKey = "sarit-admin-bulk-question-drafts-v1";
const evidencePath = path.join(__dirname, "environment-final-audit-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "environment-final-audit-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

function makeQuestion(index) {
  return {
    test_id: 9800 + index,
    topic_id: 9800 + index,
    text_en: `Environment final audit question ${index}: choose the strongest protected-area governance and biodiversity explanation.`,
    options_en: {
      A: "Protected-area outcomes depend on legal category, habitat, species pressure, corridors, local rights, and institutions",
      B: "Every protected area has identical restrictions and identical biodiversity value",
      C: "Biodiversity hotspots are only places with many animals and no threat criterion",
      D: "Corridors and buffer zones have no connection with fragmented habitats",
    },
    correct_option: "A",
    explanation_en:
      "The answer links protected-area category, habitat logic, species movement, institutional response, map proof, and the UPSC trap of treating all conservation spaces as identical.",
    difficulty: "MEDIUM",
    source: "UPSC_MCQ_COMMAND",
    status: "DRAFT",
    quality_notes: {
      batch_code: "ENV-D05",
      subject: "Environment",
      day: "5",
      week: "1",
      chapter: "Biodiversity",
      topic: "Protected Areas",
      test_title: "Environment Day 5: Protected Areas",
      map_or_case_tag: "Kaziranga floodplain and Great Indian Bustard grassland",
      pyq_linked: "No",
    },
  };
}

async function assertNoOverflow(page, label, checks) {
  const metrics = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      url: window.location.href,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      containsOldBranding: /AntiGravity|ANTIGRAVITY|antigravity/i.test(bodyText),
    };
  });

  checks.push({ label, metrics });

  if (metrics.hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  if (metrics.containsOldBranding) {
    throw new Error(`${label} still shows old branding.`);
  }
}

async function getProgress(page, day) {
  return page.evaluate(
    ({ key, selectedDay }) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw)[String(selectedDay)] : null;
    },
    { key: progressKey, selectedDay: day }
  );
}

async function seedFreshMcqs(page) {
  await page.evaluate(
    ({ localProgressKey, localMcqKey, localDraftStorageKey, questions }) => {
      const now = new Date().toISOString();
      window.localStorage.setItem(
        localMcqKey,
        JSON.stringify({
          "ENV-D05": {
            planned: questions.length,
            drafted: questions.length,
            difficulty: "MEDIUM",
            status: "READY",
            updatedAt: now,
          },
        })
      );
      window.localStorage.setItem(
        localDraftStorageKey,
        JSON.stringify([
          {
            id: "environment-final-audit",
            createdAt: now,
            importMode: "UPSC_MCQ_COMMAND",
            questions,
          },
        ])
      );
      const progress = JSON.parse(window.localStorage.getItem(localProgressKey) || "{}");
      progress["5"] = {
        ...(progress["5"] ?? {}),
        mcqPlannedCount: questions.length,
        mcqFreshQuestionCount: questions.length,
      };
      window.localStorage.setItem(localProgressKey, JSON.stringify(progress));
    },
    {
      localProgressKey: progressKey,
      localMcqKey: mcqKey,
      localDraftStorageKey: localDraftKey,
      questions: [makeQuestion(1), makeQuestion(2), makeQuestion(3)],
    }
  );
}

async function completeWatch(page, checks) {
  await page.goto(`${baseUrl}/upsc/environment/watch?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(
    ({ localProgressKey, localMcqKey, localDraftStorageKey }) => {
      window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_environment_final_audit");
      window.localStorage.removeItem(localProgressKey);
      window.localStorage.removeItem(localMcqKey);
      window.localStorage.removeItem(localDraftStorageKey);
    },
    { localProgressKey: progressKey, localMcqKey: mcqKey, localDraftStorageKey: localDraftKey }
  );
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("environment-watch-teacher-pack").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-watch-scene-engine").getByText("Scene playback", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-final-watch-initial", checks);

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("subject-watch-scene-complete").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["5"];
        return (day?.watchSceneCompletedIds?.length ?? 0) >= expected;
      },
      { key: progressKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  const watchProgress = await getProgress(page, 5);
  if (!watchProgress?.watched || (watchProgress.watchSceneCompletedIds?.length ?? 0) < 5) {
    throw new Error(`Environment Watch did not finish with five scene proofs: ${JSON.stringify(watchProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "environment-final-watch-complete", checks);
  await page.getByRole("button", { name: /Complete and discuss/i }).click();
  await page.waitForURL("**/upsc/environment/talk?day=5", { timeout: 15000 });
  return watchProgress;
}

async function completeTalkCommand(page, checks) {
  await page.getByTestId("environment-talk-teacher-pack").waitFor({ timeout: 15000 });
  await page
    .getByPlaceholder("Write the explanation in your own words. Start with concept, then mechanism, then example.")
    .fill(
      [
        "Protected areas must be explained through legal category, habitat, species pressure, map location, local rights and institutions.",
        "National parks, wildlife sanctuaries, biosphere reserves and conservation reserves do not work through identical restrictions or governance.",
        "A student must compare categories, permitted activities and question framing because protected-area questions mix ecology with institutions and maps.",
        "Kaziranga proves floodplain habitat and corridor logic, while the Great Indian Bustard case proves biodiversity is not forest-only.",
        "The mechanism is location, habitat, protected-area category, species threat, conservation response, monitoring, buffer logic and governance.",
        "Hotspot status needs endemism and threat, IUCN status helps species prioritisation, and sanctuary or biosphere labels are not interchangeable.",
        "UPSC traps by treating hotspot, protected area, reserve, corridor and sanctuary as the same kind of statement.",
      ].join(" ")
    );
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("subject-maic-discussion-turns").waitFor({ timeout: 15000 });
  await page.getByTestId("talk-route-gate").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-final-talk-command", checks);

  const talkProgress = await getProgress(page, 5);
  if ((talkProgress?.talkScore ?? 0) < 70 || talkProgress?.talkUnlockStage === "revisit" || talkProgress?.revisitQueued) {
    throw new Error(`Environment Talk did not reach command path: ${JSON.stringify(talkProgress, null, 2)}`);
  }

  const routeHref = await page.getByTestId("talk-primary-route").getAttribute("href");
  if (!routeHref?.includes("/upsc/environment/lab?")) {
    throw new Error(`Expected Environment Talk to route to lab, got ${routeHref}`);
  }
  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/environment/lab?**", { timeout: 15000 });
  return talkProgress;
}

async function completeLab(page, checks) {
  await page.getByText("India biodiversity map", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("environment-lab-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-route-status").getByText("MCQ locked", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("environment-lab-evidence-deck").waitFor({ timeout: 15000 });
  await page.getByTestId("environment-lab-evidence-card-5-biodiversity-map-3").click();
  await page.getByText("Great Indian Bustard Landscape", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-command-case").getByText("Species", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-final-lab-open", checks);

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId("subject-lab-proof-complete").click();
    await page.waitForFunction(
      ({ key, expected }) => {
        const day = JSON.parse(window.localStorage.getItem(key) || "{}")["5"];
        return (day?.labProofCompletedIds?.length ?? 0) >= expected;
      },
      { key: progressKey, expected: index + 1 },
      { timeout: 15000 }
    );
  }

  await page
    .getByPlaceholder("Write the concept, case, map point, or UPSC trap you can now explain.")
    .fill("Great Indian Bustard grassland proof connects habitat category, power-line threat, species decline, and the UPSC trap of forest-only biodiversity.");
  await page.getByRole("button", { name: /Mark lab complete/i }).click();
  await page.getByText("Lab saved locally", { exact: false }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-route-status").getByText("MCQ open", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-lab-command-route").getByText("MCQ open", { exact: false }).waitFor({ timeout: 15000 });

  const labProgress = await getProgress(page, 5);
  if (!labProgress?.labCompleted || (labProgress.labProofCompletedIds?.length ?? 0) < 5) {
    throw new Error(`Environment Lab did not persist complete proof state: ${JSON.stringify(labProgress, null, 2)}`);
  }
  await assertNoOverflow(page, "environment-final-lab-complete", checks);

  const routeHref = await page.getByTestId("lab-primary-route").getAttribute("href");
  if (routeHref !== "/upsc/environment/mcq-readiness?day=5") {
    throw new Error(
      `Expected Environment Lab to route to MCQ readiness, got ${routeHref}; progress ${JSON.stringify(labProgress, null, 2)}`
    );
  }
  await seedFreshMcqs(page);
  await page.getByTestId("lab-primary-route").click();
  await page.waitForURL("**/upsc/environment/mcq-readiness?day=5", { timeout: 15000 });
  return labProgress;
}

async function completeMcqPractice(page, checks) {
  await page.getByTestId("mcq-readiness-command-board").waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-preflight-status").getByText("Practice ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("mcq-next-decision").getByText("Start local practice", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-final-mcq-ready", checks);
  await page.getByTestId("mcq-start-local-practice").click();
  await page.getByTestId("mcq-local-practice-runner").getByText("Question 1 of 3", { exact: false }).waitFor({ timeout: 15000 });

  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("mcq-practice-option-A").click();
    if (index < 2) {
      await page.getByRole("button", { name: /Next question/i }).click();
    }
  }

  await page.getByTestId("mcq-practice-outcome-gate").getByText("Command retained", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-final-mcq-command", checks);

  const mcqProgress = await getProgress(page, 5);
  if (
    mcqProgress?.mcqReadinessStatus !== "command" ||
    mcqProgress?.mcqOutcome !== "Command" ||
    mcqProgress?.mcqScorePercent !== 100 ||
    mcqProgress?.mcqNextRoute !== "/upsc/environment/track?day=5"
  ) {
    throw new Error(`Environment MCQ practice did not end in command state: ${JSON.stringify(mcqProgress, null, 2)}`);
  }

  await page.getByTestId("mcq-practice-outcome-route").click();
  await page.waitForURL("**/upsc/environment/track?day=5", { timeout: 15000 });
  await page.getByTestId("track-day-5").getByText("Command ready", { exact: false }).waitFor({ timeout: 15000 });
  await page.getByTestId("subject-focused-mcq-outcome").getByText("Command", { exact: true }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-final-track-command", checks);
  return mcqProgress;
}

async function completeRevisitBranch(page, checks) {
  await page.goto(`${baseUrl}/upsc/environment/talk?day=6`, { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate((key) => {
    const current = JSON.parse(window.localStorage.getItem(key) || "{}");
    current["6"] = {
      day: 6,
      watched: true,
      watchState: "Watched",
      watchMinutes: 80,
      watchSceneCompletedIds: ["6-briefing", "6-mechanism", "6-application", "6-trap", "6-handoff"],
      confidence: "Working",
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(current));
  }, progressKey);
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("environment-talk-teacher-pack").waitFor({ timeout: 15000 });
  await page
    .getByPlaceholder("Write the explanation in your own words. Start with concept, then mechanism, then example.")
    .fill("I am confused and cannot explain this topic yet.");
  await page.getByRole("button", { name: /Assess explanation/i }).click();
  await page.getByTestId("talk-route-gate").getByText("Revisit required", { exact: false }).waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-final-talk-revisit-queued", checks);

  const queuedProgress = await getProgress(page, 6);
  if (queuedProgress?.revisitQueued !== true || queuedProgress?.talkUnlockStage !== "revisit") {
    throw new Error(`Environment weak Talk did not queue revisit: ${JSON.stringify(queuedProgress, null, 2)}`);
  }

  await page.getByTestId("talk-primary-route").click();
  await page.waitForURL("**/upsc/environment/revisit?day=6", { timeout: 15000 });
  await page.getByTestId("revisit-repair-gates").waitFor({ timeout: 15000 });
  await page
    .getByPlaceholder("Write the recovery note or corrected explanation here.")
    .fill("Recovered: species conservation must connect threat, habitat, IUCN or CITES category, institution, map example, and a statement trap.");
  await page.getByRole("button", { name: /Mark recovered/i }).click();
  await page.getByTestId("revisit-return-gate").getByText("Return to the AI teacher", { exact: false }).waitFor({ timeout: 15000 });

  const routeHref = await page.getByTestId("revisit-primary-route").getAttribute("href");
  const recoveredProgress = await getProgress(page, 6);
  if (routeHref !== "/upsc/environment/talk?day=6" || recoveredProgress?.revisitQueued !== false) {
    throw new Error(
      `Environment revisit recovery did not route back to Talk: ${JSON.stringify({ routeHref, recoveredProgress }, null, 2)}`
    );
  }
  await assertNoOverflow(page, "environment-final-revisit-recovered", checks);
  return { queuedProgress, recoveredProgress, routeHref };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const watchProgress = await completeWatch(page, checks);
  const talkProgress = await completeTalkCommand(page, checks);
  const labProgress = await completeLab(page, checks);
  const mcqProgress = await completeMcqPractice(page, checks);
  const revisitBranch = await completeRevisitBranch(page, checks);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/upsc/environment/track?day=5`, { waitUntil: "networkidle", timeout: 45000 });
  await page.getByTestId("track-day-5").waitFor({ timeout: 15000 });
  await assertNoOverflow(page, "environment-final-mobile-track", checks);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    checks,
    watchProgress,
    talkProgress,
    labProgress,
    mcqProgress,
    revisitBranch,
    finalUrl: page.url(),
    consoleErrors,
    blockingConsoleErrors,
    pageErrors,
    passed: blockingConsoleErrors.length === 0 && pageErrors.length === 0,
  };

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  await browser.close();

  if (!evidence.passed) {
    throw new Error(JSON.stringify(evidence, null, 2));
  }

  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
