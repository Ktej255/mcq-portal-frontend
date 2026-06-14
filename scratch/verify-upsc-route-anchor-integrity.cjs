const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

const apiRoutes = {
  releaseDecision: `${baseUrl}/api/upsc/prelims-2026/release-decision`,
  matchAccountability: `${baseUrl}/api/upsc/prelims-2026/match-accountability`,
  readiness: `${baseUrl}/api/upsc/prelims-2026/build-readiness`,
  manifest: `${baseUrl}/api/upsc/prelims-2026/showcase-manifest`,
  sourceSummary: `${baseUrl}/api/upsc/prelims-2026/source-archive-summary`,
  courseAction: `${baseUrl}/api/upsc/prelims-2027/course-action`,
};

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
    throw new Error(payload ? `${message}: ${JSON.stringify(payload).slice(0, 2500)}` : message);
  }
}

function normalizeTarget(value, source) {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  const [pathname, hashValue = ""] = value.split("#");
  const hash = hashValue.trim();
  return {
    key: `${pathname}${hash ? `#${hash}` : ""}`,
    pathname,
    hash,
    source,
    target: value,
  };
}

function addTarget(map, value, source) {
  const target = normalizeTarget(value, source);
  if (!target) return;
  if (!map.has(target.key)) {
    map.set(target.key, { ...target, sources: [source] });
    return;
  }
  map.get(target.key).sources.push(source);
}

function collectTargets({ releaseDecision, matchAccountability, readiness, manifest, sourceSummary, courseAction }) {
  const targets = new Map();

  addTarget(targets, releaseDecision.publicRoute, "release-decision.publicRoute");
  addTarget(targets, releaseDecision.publicAnchor, "release-decision.publicAnchor");
  addTarget(targets, releaseDecision.reviewCommandRoute, "release-decision.reviewCommandRoute");
  addTarget(targets, releaseDecision.strategyRoute, "release-decision.strategyRoute");
  addTarget(targets, releaseDecision.strategyAnchor, "release-decision.strategyAnchor");
  addTarget(targets, matchAccountability.publicRoute, "match-accountability.publicRoute");
  addTarget(targets, matchAccountability.publicAnchor, "match-accountability.publicAnchor");
  addTarget(targets, matchAccountability.strategyRoute, "match-accountability.strategyRoute");
  addTarget(targets, matchAccountability.strategyAnchor, "match-accountability.strategyAnchor");

  addTarget(targets, readiness.publicRoute, "build-readiness.publicRoute");
  addTarget(targets, readiness.reviewCommandRoute, "build-readiness.reviewCommandRoute");
  addTarget(targets, readiness.strategyRoute, "build-readiness.strategyRoute");
  for (const requirement of readiness.requirements || []) {
    addTarget(targets, requirement.publicAnchor, `build-readiness.requirement.${requirement.id}.publicAnchor`);
    addTarget(targets, requirement.portalOwner, `build-readiness.requirement.${requirement.id}.portalOwner`);
  }

  addTarget(targets, manifest.publicRoute, "manifest.publicRoute");
  addTarget(targets, manifest.dashboardRoute, "manifest.dashboardRoute");
  addTarget(targets, manifest.reviewCommandRoute, "manifest.reviewCommandRoute");
  addTarget(targets, manifest.strategyRoute, "manifest.strategyRoute");
  addTarget(targets, manifest.questionLedger?.publicAnchor, "manifest.questionLedger.publicAnchor");
  for (const row of manifest.website?.integrationMap || []) {
    addTarget(targets, row.publicAnchor, `manifest.integration.${row.title}.publicAnchor`);
    addTarget(targets, row.dashboardRoute, `manifest.integration.${row.title}.dashboardRoute`);
  }
  for (const requirement of manifest.website?.requirements || []) {
    addTarget(targets, requirement.owner, `manifest.requirement.${requirement.id}.owner`);
  }

  addTarget(targets, sourceSummary.publicRoute, "source-summary.publicRoute");
  addTarget(targets, sourceSummary.publicAnchor, "source-summary.publicAnchor");
  addTarget(targets, sourceSummary.internalIntakeRoute, "source-summary.internalIntakeRoute");

  addTarget(targets, courseAction.sourceAuditRoute, "course-action.sourceAuditRoute");
  addTarget(targets, courseAction.reviewCommandRoute, "course-action.reviewCommandRoute");
  addTarget(targets, courseAction.strategyRoute, "course-action.strategyRoute");
  addTarget(targets, courseAction.publicAnchor, "course-action.publicAnchor");

  return Array.from(targets.values()).sort((left, right) => left.key.localeCompare(right.key));
}

async function seedLocalState(context) {
  await context.addInitScript(({ profile }) => {
    window.MOCK_TOKEN = "MOCK_TOKEN_MASTER_route_anchor_integrity";
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_route_anchor_integrity");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
    window.localStorage.setItem("upsc-student-profile-v1", JSON.stringify(profile));
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

async function verifyPath(browser, pathname, targetsForPath) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await seedLocalState(context);

  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle", timeout: 70000 });
  await page.waitForFunction(
    () => {
      const text = document.body.innerText.trim();
      return (
        text.length > 1000 ||
        /404|not found/i.test(text.slice(0, 1000)) ||
        Boolean(document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay"))
      );
    },
    null,
    { timeout: 50000 }
  ).catch(() => {});

  const pathResult = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      pathname: window.location.pathname,
      title: document.title,
      textLength: text.trim().length,
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      notFoundText: /404|not found/i.test(text.slice(0, 1000)),
    };
  });

  assert(pathResult.pathname === pathname, "Route path changed after navigation", { pathname, pathResult });
  assert(!pathResult.notFoundText, "Route appears to be a not-found page", { pathname, pathResult });
  assert(!pathResult.mentionsWebinar, "Route still contains webinar wording", { pathname, pathResult });
  assert(!pathResult.hasErrorOverlay, "Framework error overlay is visible", { pathname, pathResult });
  assert(!pathResult.horizontalOverflow, "Route has horizontal overflow", { pathname, pathResult });
  assert(pathResult.textLength > 1000, "Route appears under-rendered", { pathname, pathResult });
  assert(consoleErrors.length === 0, `Console errors on ${pathname}: ${consoleErrors.join(" | ")}`, pathResult);

  const anchors = [];
  for (const target of targetsForPath.filter((item) => item.hash)) {
    try {
      await page.waitForFunction((hash) => Boolean(document.getElementById(hash)), target.hash, { timeout: 40000 });
    } catch (error) {
      throw new Error(
        `Missing anchor ${target.hash} on ${pathname} for ${target.sources.join(", ")}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    const anchorResult = await page.evaluate((hash) => {
      const element = document.getElementById(hash);
      return {
        hash,
        exists: Boolean(element),
        tagName: element?.tagName || null,
        textLength: element?.textContent?.trim().length || 0,
        testId: element?.getAttribute("data-testid") || null,
      };
    }, target.hash);
    assert(anchorResult.exists, "Anchor element missing", { target, anchorResult });
    anchors.push({ ...anchorResult, target: target.target, sources: target.sources });
  }

  const fileSafePath = pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root";
  const screenshotPath = path.join(artifactDir, `upsc-route-anchor-integrity-${fileSafePath}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await context.close();

  return {
    pathname,
    targets: targetsForPath.map((target) => ({ target: target.target, sources: target.sources })),
    anchors,
    screenshotPath,
  };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const [releaseDecisionResponse, matchAccountabilityResponse, readinessResponse, manifestResponse, sourceSummaryResponse, courseActionResponse] = await Promise.all([
      page.request.get(apiRoutes.releaseDecision),
      page.request.get(apiRoutes.matchAccountability),
      page.request.get(apiRoutes.readiness),
      page.request.get(apiRoutes.manifest),
      page.request.get(apiRoutes.sourceSummary),
      page.request.get(apiRoutes.courseAction),
    ]);
    const releaseDecision = await releaseDecisionResponse.json();
    const matchAccountability = await matchAccountabilityResponse.json();
    const readiness = await readinessResponse.json();
    const manifest = await manifestResponse.json();
    const sourceSummary = await sourceSummaryResponse.json();
    const courseAction = await courseActionResponse.json();
    await context.close();

    assert(releaseDecisionResponse.status() === 200, "Release-decision API failed", releaseDecision);
    assert(matchAccountabilityResponse.status() === 200, "Match-accountability API failed", matchAccountability);
    assert(readinessResponse.status() === 200, "Build-readiness API failed", readiness);
    assert(manifestResponse.status() === 200, "Manifest API failed", manifest);
    assert(sourceSummaryResponse.status() === 200, "Source summary API failed", sourceSummary);
    assert(courseActionResponse.status() === 200, "Course-action API failed", courseAction);

    const targets = collectTargets({ releaseDecision, matchAccountability, readiness, manifest, sourceSummary, courseAction });
    const grouped = targets.reduce((groups, target) => {
      if (!groups.has(target.pathname)) groups.set(target.pathname, []);
      groups.get(target.pathname).push(target);
      return groups;
    }, new Map());

    assert(targets.length >= 24, "Expected at least 24 route/anchor targets", targets);
    assert(grouped.has("/upsc-prelims-2026-showcase"), "Public showcase route was not collected", targets);
    assert(grouped.has("/upsc/prelims-2027-strategy"), "Strategy command route was not collected", targets);
    assert(grouped.has("/upsc/source-library"), "Source library route was not collected", targets);

    const pathResults = [];
    for (const [pathname, targetsForPath] of grouped.entries()) {
      pathResults.push(await verifyPath(browser, pathname, targetsForPath));
    }

    const allAnchors = pathResults.flatMap((result) => result.anchors);
    const anchorTargets = targets.filter((target) => target.hash);

    assert(allAnchors.length === anchorTargets.length, "Not every anchor target was verified", {
      expected: anchorTargets.length,
      actual: allAnchors.length,
    });
    assert(
      allAnchors.some((anchor) => anchor.hash === "prelims-2026-main-website-manifest-contract"),
      "Corrected strategy manifest anchor was not verified",
      allAnchors.map((anchor) => anchor.hash)
    );
    assert(
      allAnchors.some((anchor) => anchor.hash === "release-decision"),
      "Public release-decision anchor was not verified",
      allAnchors.map((anchor) => anchor.hash)
    );
    assert(
      allAnchors.some((anchor) => anchor.hash === "match-accountability"),
      "Public match-accountability anchor was not verified",
      allAnchors.map((anchor) => anchor.hash)
    );
    assert(
      allAnchors.some((anchor) => anchor.hash === "prelims-2026-match-accountability-api-readiness"),
      "Strategy match-accountability anchor was not verified",
      allAnchors.map((anchor) => anchor.hash)
    );
    assert(
      allAnchors.some((anchor) => anchor.hash === "prelims-2027-publish-gate"),
      "Strategy publish-gate anchor was not verified",
      allAnchors.map((anchor) => anchor.hash)
    );
    assert(
      !targets.some((target) => target.hash === "prelims-2027-manifest-contract"),
      "Old missing manifest anchor is still present in route contracts",
      targets
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          apiRoutes,
          targetCount: targets.length,
          pathCount: pathResults.length,
          anchorCount: allAnchors.length,
          paths: pathResults,
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
