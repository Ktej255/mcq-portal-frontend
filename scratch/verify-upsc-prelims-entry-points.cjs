const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
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

async function seedAdminState(context) {
  await context.addInitScript(({ profile }) => {
    window.localStorage.setItem("MOCK_TOKEN", "MOCK_TOKEN_MASTER_prelims_entry_points");
    window.localStorage.setItem("sarit-upsc-student-profile-v1", JSON.stringify(profile));
    window.localStorage.setItem("upsc-student-profile-v1", JSON.stringify(profile));
  }, { profile });
}

function attachErrorCollectors(page) {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  return consoleErrors;
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    return {
      url: window.location.pathname,
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });
}

async function verifyPublicLanding(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = attachErrorCollectors(page);

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByTestId("upsc-public-showcase-entry").waitFor({ state: "visible", timeout: 15000 });

  const result = await page.evaluate(() => {
    const entry = document.querySelector('[data-testid="upsc-public-showcase-entry"]');
    const link = entry?.querySelector('a[href="/upsc-prelims-2026-showcase"]');
    const bodyText = document.body.innerText;
    return {
      hasEntry: Boolean(entry),
      hasPublicLink: Boolean(link),
      hasSoftwarePath: /2027 software path/i.test(bodyText),
      hasArchiveStep: /source archive/i.test(bodyText),
      hasProofFeedStep: /proof feed/i.test(bodyText),
      hasAuditCopy: /Complete MCQs with matched covered portions/i.test(bodyText),
    };
  });
  const pageState = await inspectPage(page);

  if (!result.hasEntry) throw new Error("Public landing proof entry is missing.");
  if (!result.hasPublicLink) throw new Error("Public landing does not link to the standalone showcase.");
  if (!result.hasSoftwarePath || !result.hasArchiveStep || !result.hasProofFeedStep) {
    throw new Error(`Software path copy is incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.hasAuditCopy) throw new Error("Public audit proof copy is missing.");
  if (pageState.mentionsWebinar) throw new Error("Public landing still contains webinar wording.");
  if (pageState.hasErrorOverlay) throw new Error("Public landing has a framework error overlay.");
  if (pageState.horizontalOverflow) throw new Error("Public landing has horizontal overflow.");
  if (consoleErrors.length) throw new Error(`Public landing console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("upsc-public-showcase-entry").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return { ...result, ...pageState };
}

async function verifyPublicShowcaseLink(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const consoleErrors = attachErrorCollectors(page);

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByTestId("upsc-public-showcase-entry").locator('a[href="/upsc-prelims-2026-showcase"]').click();
  await page.waitForURL("**/upsc-prelims-2026-showcase", { timeout: 15000 });
  await page.locator("#strategy-2027").waitFor({ state: "visible", timeout: 15000 });

  const result = await inspectPage(page);
  const evidenceState = await page.evaluate(() => ({
    hasQuestionLedger: Boolean(document.querySelector("#question-ledger")),
    questionCardCount: document.querySelectorAll("#question-ledger details").length,
    highlightedPortionCount: document.querySelectorAll("#question-ledger mark").length,
    hasCompleteMcqCopy: /Complete MCQ with matched portions/i.test(document.querySelector("#question-ledger")?.textContent || ""),
  }));

  if (result.url !== "/upsc-prelims-2026-showcase") throw new Error(`Unexpected showcase URL: ${result.url}`);
  if (
    !evidenceState.hasQuestionLedger ||
    evidenceState.questionCardCount < 90 ||
    evidenceState.highlightedPortionCount < 1 ||
    !evidenceState.hasCompleteMcqCopy
  ) {
    throw new Error(`Standalone showcase did not render structural question evidence: ${JSON.stringify(evidenceState)}`);
  }
  if (result.mentionsWebinar) throw new Error("Standalone showcase still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Standalone showcase has a framework error overlay.");
  if (result.horizontalOverflow) throw new Error("Standalone showcase has horizontal overflow.");
  if (consoleErrors.length) throw new Error(`Standalone showcase console errors: ${consoleErrors.join(" | ")}`);

  await page.locator("#strategy-2027").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, "upsc-public-showcase-entry-link.png"), fullPage: false });
  await context.close();

  return { ...result, ...evidenceState };
}

async function verifyAdminRoute(browser, route, expectedTitle, fileName) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await seedAdminState(context);
  const page = await context.newPage();
  const consoleErrors = attachErrorCollectors(page);

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  if (route === "/upsc/prelims-2027-strategy") {
    await page.getByTestId("prelims-2027-publish-gate").waitFor({ state: "visible", timeout: 20000 });
  } else {
    await page.locator("#strategy-2027").waitFor({ state: "visible", timeout: 20000 });
  }

  const result = await page.evaluate(({ route, expectedTitle }) => {
    const text = document.body.innerText;
    const activeLink = Array.from(document.querySelectorAll("a")).find((link) =>
      link.className.includes("bg-[#1a3a2a]")
    );
    return {
      url: window.location.pathname,
      hasHeaderTitle: Array.from(document.querySelectorAll("header *")).some(
        (node) => node.textContent?.trim() === expectedTitle
      ),
      hasStrategySidebarLink: Boolean(document.querySelector('a[href="/upsc/prelims-2027-strategy"]')),
      hasShowcaseSidebarLink: Boolean(document.querySelector('a[href="/upsc/prelims-2026-showcase"]')),
      hasPublicShowcaseLink: Array.from(document.querySelectorAll("a")).some((link) =>
        (link.getAttribute("href") || "").startsWith("/upsc-prelims-2026-showcase")
      ),
      activeHref: activeLink?.getAttribute("href") || "",
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      stayedOnRoute: window.location.pathname === route,
      textLength: text.trim().length,
    };
  }, { route, expectedTitle });

  if (!result.stayedOnRoute) throw new Error(`${route}: redirected to ${result.url}.`);
  if (!result.hasHeaderTitle) throw new Error(`${route}: header title ${expectedTitle} is missing.`);
  if (!result.hasStrategySidebarLink || !result.hasShowcaseSidebarLink) {
    throw new Error(`${route}: sidebar links are incomplete: ${JSON.stringify(result)}`);
  }
  if (!result.activeHref.includes(route)) throw new Error(`${route}: active sidebar link is wrong: ${result.activeHref}`);
  if (route === "/upsc/prelims-2027-strategy" && !result.hasPublicShowcaseLink) {
    throw new Error(`${route}: public showcase handoff link is missing.`);
  }
  if (result.mentionsWebinar) throw new Error(`${route}: page still contains webinar wording.`);
  if (result.hasErrorOverlay) throw new Error(`${route}: framework error overlay is visible.`);
  if (result.horizontalOverflow) throw new Error(`${route}: page has horizontal overflow.`);
  if (result.textLength < 2000) throw new Error(`${route}: page appears under-rendered.`);
  if (consoleErrors.length) throw new Error(`${route}: console errors: ${consoleErrors.join(" | ")}`);

  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    const checks = {
      publicDesktop: await verifyPublicLanding(browser, { width: 1440, height: 1100 }, "upsc-public-entry-desktop.png"),
      publicMobile: await verifyPublicLanding(browser, { width: 390, height: 900 }, "upsc-public-entry-mobile.png"),
      publicShowcaseLink: await verifyPublicShowcaseLink(browser),
      strategyAdminRoute: await verifyAdminRoute(
        browser,
        "/upsc/prelims-2027-strategy",
        "2027 Strategy",
        "upsc-strategy-admin-entry.png"
      ),
      showcaseAdminRoute: await verifyAdminRoute(
        browser,
        "/upsc/prelims-2026-showcase",
        "2026 Showcase",
        "upsc-showcase-admin-entry.png"
      ),
    };

    console.log(
      JSON.stringify(
        {
          ok: true,
          checks,
          artifacts: [
            path.join(artifactDir, "upsc-public-entry-desktop.png"),
            path.join(artifactDir, "upsc-public-entry-mobile.png"),
            path.join(artifactDir, "upsc-public-showcase-entry-link.png"),
            path.join(artifactDir, "upsc-strategy-admin-entry.png"),
            path.join(artifactDir, "upsc-showcase-admin-entry.png"),
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
