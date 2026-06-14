const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const route = `${baseUrl}/upsc-prelims-2026-showcase`;
const artifactDir = path.resolve(process.cwd(), "..", "validation-artifacts");

async function verifyViewport(browser, viewport, fileName) {
  const context = await browser.newContext({ viewport });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseUrl).origin });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByTestId("showcase-website-copy-kit").waitFor({ state: "visible", timeout: 15000 });

  const firstCopyButton = page.getByTestId("showcase-copy-block").first().getByRole("button", { name: /^copy$/i });
  await firstCopyButton.click();
  await page.getByTestId("showcase-copy-block").first().getByRole("button", { name: /^copied$/i }).waitFor({
    state: "visible",
    timeout: 5000,
  });

  const result = await page.evaluate(() => {
    const kit = document.querySelector('[data-testid="showcase-website-copy-kit"]');
    const blocks = Array.from(document.querySelectorAll('[data-testid="showcase-copy-block"]'));
    const blockIds = blocks.map((block) => block.getAttribute("data-copy-id"));
    const text = document.body.innerText;

    return {
      hasKit: Boolean(kit),
      blockCount: blocks.length,
      blockIds,
      hasHeroCopy: text.includes("what we built, what appeared, and what changes for 2027"),
      hasCoverageCopy: text.includes("44 direct hits, 30 partial hits, 23 misses"),
      hasStrategyCopy: text.includes("IR / Multilateral Bodies"),
      hasSoftwareCopy: text.includes("evidence ledger, 2027 build queue, format rebuilder"),
      mentionsWebinar: /webinar/i.test(text),
      hasErrorOverlay: Boolean(
        document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      textLength: text.trim().length,
    };
  });

  if (!result.hasKit) throw new Error("Website copy kit did not render.");
  if (result.blockCount !== 4) throw new Error(`Expected 4 copy blocks, found ${result.blockCount}.`);
  if (!result.hasHeroCopy || !result.hasCoverageCopy || !result.hasStrategyCopy || !result.hasSoftwareCopy) {
    throw new Error(`Copy content is incomplete: ${JSON.stringify(result)}`);
  }
  if (result.mentionsWebinar) throw new Error("Page still contains webinar wording.");
  if (result.hasErrorOverlay) throw new Error("Framework error overlay is visible.");
  if (result.horizontalOverflow) throw new Error("Page has horizontal overflow.");
  if (result.textLength < 4500) throw new Error("Page appears under-rendered.");
  if (consoleErrors.length) throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);

  await page.getByTestId("showcase-website-copy-kit").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, fileName), fullPage: false });
  await context.close();

  return result;
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await verifyViewport(browser, { width: 1440, height: 1100 }, "upsc-showcase-copy-kit.png");
    const mobile = await verifyViewport(browser, { width: 390, height: 900 }, "upsc-showcase-copy-kit-mobile.png");

    console.log(
      JSON.stringify(
        {
          ok: true,
          route,
          desktop,
          mobile,
          artifacts: [
            path.join(artifactDir, "upsc-showcase-copy-kit.png"),
            path.join(artifactDir, "upsc-showcase-copy-kit-mobile.png"),
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
