const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.locator("#strategy-2027").waitFor({ state: "visible", timeout: 15000 });

  const result = await page.evaluate(() => {
    const section = document.querySelector("#strategy-2027");
    const releaseRules = Array.from(document.querySelectorAll('[data-testid="showcase-public-release-rule"]'));
    const tracks = Array.from(document.querySelectorAll('[data-testid="showcase-2027-strategy-track"]'));
    const statuses = tracks.map((track) => track.getAttribute("data-public-status"));
    const text = document.body.innerText;

    return {
      hasSection: Boolean(section),
      releaseRuleCount: releaseRules.length,
      trackCount: tracks.length,
      statuses,
      hasProofReady: statuses.includes("Public proof ready"),
      hasNeedsSourcePack: statuses.includes("Needs source pack"),
      hasNeedsPageProof: statuses.includes("Needs page proof"),
      hasInternalPlanning: statuses.includes("Internal planning"),
      hasStrategyCommandLink: Array.from(document.querySelectorAll("a")).some((link) =>
        link.getAttribute("href") === "/upsc/prelims-2027-strategy"
      ),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasSection) throw new Error("2027 strategy handoff section did not render.");
  if (result.releaseRuleCount !== 3) throw new Error(`Expected 3 public release rules, found ${result.releaseRuleCount}.`);
  if (result.trackCount !== 8) throw new Error(`Expected 8 strategy tracks, found ${result.trackCount}.`);
  if (!result.hasProofReady || !result.hasNeedsSourcePack || !result.hasNeedsPageProof || !result.hasInternalPlanning) {
    throw new Error(`Missing expected public statuses: ${JSON.stringify(result.statuses)}`);
  }
  if (!result.hasStrategyCommandLink) throw new Error("Strategy command link is missing.");
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 4000) throw new Error("Page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.locator("#strategy-2027").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-showcase-public-handoff.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-showcase-public-handoff-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-showcase-public-handoff.png"),
            path.join(artifactDir, "upsc-showcase-public-handoff-mobile.png"),
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
