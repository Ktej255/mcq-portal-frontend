const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc/prelims-2027-strategy#prelims-2026-main-website-manifest-contract`;
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
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_strategy_manifest_contract");
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
  await page.getByTestId("prelims-2026-main-website-manifest-contract").waitFor({
    state: "visible",
    timeout: 20000,
  });

  const section = page.getByTestId("prelims-2026-main-website-manifest-contract");
  await section.getByRole("button", { name: "Copy manifest endpoint" }).click();
  await section.getByRole("button", { name: "Endpoint copied" }).waitFor({ state: "visible", timeout: 5000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="prelims-2026-main-website-manifest-contract"]');
    const text = document.body.innerText;
    const sectionText = section?.textContent || "";
    const links = Array.from(section?.querySelectorAll("a") || []).map((link) => link.getAttribute("href"));

    return {
      hasSection: Boolean(section),
      version: section?.getAttribute("data-version"),
      reviewCommandEndpoint: section?.getAttribute("data-review-command-endpoint"),
      releaseDecisionEndpoint: section?.getAttribute("data-release-decision-endpoint"),
      mainSiteHandoffEndpoint: section?.getAttribute("data-main-site-handoff-endpoint"),
      manifestEndpoint: section?.getAttribute("data-manifest-endpoint"),
      matchAccountabilityEndpoint: section?.getAttribute("data-match-accountability-endpoint"),
      questionLedgerEndpoint: section?.getAttribute("data-question-ledger-endpoint"),
      proofFeedEndpoint: section?.getAttribute("data-proof-feed-endpoint"),
      courseActionEndpoint: section?.getAttribute("data-course-action-endpoint"),
      sourceArchiveSummaryEndpoint: section?.getAttribute("data-source-archive-summary-endpoint"),
      buildReadinessEndpoint: section?.getAttribute("data-build-readiness-endpoint"),
      publicRoute: section?.getAttribute("data-public-route"),
      effectiveCoverage: Number(section?.getAttribute("data-effective-coverage")),
      correctedDirect: Number(section?.getAttribute("data-corrected-direct")),
      correctedPartial: Number(section?.getAttribute("data-corrected-partial")),
      correctedMisses: Number(section?.getAttribute("data-corrected-misses")),
      correctedDropped: Number(section?.getAttribute("data-corrected-dropped")),
      sourceDirect: Number(section?.getAttribute("data-source-direct")),
      sourceConceptual: Number(section?.getAttribute("data-source-conceptual")),
      questionCount: Number(section?.getAttribute("data-question-count")),
      statementCoverageRows: Number(section?.getAttribute("data-statement-coverage-rows")),
      strategyTaskCount: Number(section?.getAttribute("data-strategy-task-count")),
      phaseSource: Number(section?.getAttribute("data-phase-source")),
      phaseCapsule: Number(section?.getAttribute("data-phase-capsule")),
      phaseMcq: Number(section?.getAttribute("data-phase-mcq")),
      phaseProof: Number(section?.getAttribute("data-phase-proof")),
      phaseRelease: Number(section?.getAttribute("data-phase-release")),
      phasePlanner: Number(section?.getAttribute("data-phase-planner")),
      hasTitle: sectionText.includes("One API contract controls the public page handoff"),
      hasProofPolicy: sectionText.includes("Keep question-level claims proof-locked"),
      hasReviewCommandEndpointText: sectionText.includes("/api/upsc/prelims-2026/review-command"),
      hasReleaseDecisionEndpointText: sectionText.includes("/api/upsc/prelims-2026/release-decision"),
      hasMainSiteHandoffEndpointText: sectionText.includes("/api/upsc/prelims-2026/main-site-handoff"),
      hasManifestEndpointText: sectionText.includes("/api/upsc/prelims-2026/showcase-manifest"),
      hasMatchAccountabilityEndpointText: sectionText.includes("/api/upsc/prelims-2026/match-accountability"),
      hasQuestionLedgerEndpointText: sectionText.includes("/api/upsc/prelims-2026/question-ledger"),
      hasProofFeedEndpointText: sectionText.includes("/api/upsc/prelims-2026/public-proof-feed"),
      hasCourseActionEndpointText: sectionText.includes("/api/upsc/prelims-2027/course-action"),
      hasSourceArchiveSummaryEndpointText: sectionText.includes("/api/upsc/prelims-2026/source-archive-summary"),
      hasBuildReadinessEndpointText: sectionText.includes("/api/upsc/prelims-2026/build-readiness"),
      hasCorrectedAuditText: sectionText.includes("44 direct / 30 partial / 23 misses / 3 dropped"),
      hasSourceLeadText: sectionText.includes("Direct text leads / conceptual leads"),
      hasPhaseText:
        sectionText.includes("Source: 7") &&
        sectionText.includes("Capsule: 6") &&
        sectionText.includes("MCQ: 7") &&
        sectionText.includes("Proof: 5") &&
        sectionText.includes("Release: 5") &&
        sectionText.includes("Planner: 4"),
      links,
      hasPublicShowcaseLink: links.includes("/upsc-prelims-2026-showcase"),
      hasPublicContractLink: links.includes("/upsc-prelims-2026-showcase#main-website-manifest-contract"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasSection) throw new Error("Main website manifest contract did not render.");
  if (result.version !== "upsc-prelims-2026-showcase-manifest-v1") {
    throw new Error(`Unexpected manifest version: ${JSON.stringify(result)}`);
  }
  if (
    result.reviewCommandEndpoint !== "/api/upsc/prelims-2026/review-command" ||
    result.releaseDecisionEndpoint !== "/api/upsc/prelims-2026/release-decision" ||
    result.mainSiteHandoffEndpoint !== "/api/upsc/prelims-2026/main-site-handoff" ||
    result.manifestEndpoint !== "/api/upsc/prelims-2026/showcase-manifest" ||
    result.matchAccountabilityEndpoint !== "/api/upsc/prelims-2026/match-accountability" ||
    result.questionLedgerEndpoint !== "/api/upsc/prelims-2026/question-ledger" ||
    result.proofFeedEndpoint !== "/api/upsc/prelims-2026/public-proof-feed" ||
    result.courseActionEndpoint !== "/api/upsc/prelims-2027/course-action" ||
    result.sourceArchiveSummaryEndpoint !== "/api/upsc/prelims-2026/source-archive-summary" ||
    result.buildReadinessEndpoint !== "/api/upsc/prelims-2026/build-readiness" ||
    result.publicRoute !== "/upsc-prelims-2026-showcase"
  ) {
    throw new Error(`Manifest endpoints are wrong: ${JSON.stringify(result)}`);
  }
  if (
    result.effectiveCoverage !== 76 ||
    result.correctedDirect !== 44 ||
    result.correctedPartial !== 30 ||
    result.correctedMisses !== 23 ||
    result.correctedDropped !== 3
  ) {
    throw new Error(`Corrected audit counts are wrong: ${JSON.stringify(result)}`);
  }
  if (
    result.sourceDirect !== 37 ||
    result.sourceConceptual !== 63 ||
    result.questionCount !== 100 ||
    result.statementCoverageRows !== 275 ||
    result.strategyTaskCount !== 34
  ) {
    throw new Error(`Ledger counts are wrong: ${JSON.stringify(result)}`);
  }
  if (
    result.phaseSource !== 7 ||
    result.phaseCapsule !== 6 ||
    result.phaseMcq !== 7 ||
    result.phaseProof !== 5 ||
    result.phaseRelease !== 5 ||
    result.phasePlanner !== 4
  ) {
    throw new Error(`Phase counts are wrong: ${JSON.stringify(result)}`);
  }
  if (
    !result.hasTitle ||
    !result.hasProofPolicy ||
    !result.hasReviewCommandEndpointText ||
    !result.hasReleaseDecisionEndpointText ||
    !result.hasMainSiteHandoffEndpointText ||
    !result.hasManifestEndpointText ||
    !result.hasMatchAccountabilityEndpointText ||
    !result.hasQuestionLedgerEndpointText ||
    !result.hasProofFeedEndpointText ||
    !result.hasCourseActionEndpointText ||
    !result.hasSourceArchiveSummaryEndpointText ||
    !result.hasBuildReadinessEndpointText ||
    !result.hasCorrectedAuditText ||
    !result.hasSourceLeadText ||
    !result.hasPhaseText
  ) {
    throw new Error(`Manifest contract copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasPublicShowcaseLink || !result.hasPublicContractLink) {
    throw new Error(`Manifest contract links are incomplete: ${JSON.stringify(result.links)}`);
  }
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
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-strategy-manifest-contract.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-strategy-manifest-contract-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-strategy-manifest-contract.png"),
            path.join(artifactDir, "upsc-strategy-manifest-contract-mobile.png"),
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
