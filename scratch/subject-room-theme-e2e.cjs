const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-room-theme-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-room-theme-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const subject = {
  slug: "economy",
  accent: "#2563eb",
  routes: [
    { room: "watch", path: "/upsc/economy/watch?day=1", heading: /Economy Foundation/i },
    { room: "talk", path: "/upsc/economy/talk?day=1", heading: /Economy Foundation/i },
    { room: "lab", path: "/upsc/economy/lab?mode=macro-flow-board&day=1", heading: /Economy Foundation/i },
    { room: "mcq", path: "/upsc/economy/mcq-readiness?day=1", heading: /Economy Foundation/i, shellTestId: "subject-mcq-shell" },
    { room: "track", path: "/upsc/economy/track", heading: /Track Economy command/i },
    { room: "revisit", path: "/upsc/economy/revisit?day=1", heading: /Economy Foundation/i },
  ],
};

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

async function inspectRoute(page, route, checks) {
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle", timeout: 45000 });
  const shell = page.getByTestId(route.shellTestId ?? "subject-room-shell");
  await shell.waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: route.heading }).first().waitFor({ timeout: 15000 });

  const theme = await shell.evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      room: node.getAttribute("data-room"),
      subject: node.getAttribute("data-subject"),
      accentAttr: node.getAttribute("data-subject-accent"),
      accentVar: styles.getPropertyValue("--subject-accent").trim(),
      darkVar: styles.getPropertyValue("--subject-dark").trim(),
    };
  });

  if (theme.room !== route.room || theme.subject !== subject.slug || theme.accentAttr !== subject.accent || theme.accentVar !== subject.accent) {
    throw new Error(`Room theme mismatch for ${route.room}: ${JSON.stringify(theme)}`);
  }

  let visualSurface = null;
  if (route.room === "watch" || route.room === "lab") {
    const visualTestId = route.room === "watch" ? "subject-watch-visual-surface" : "subject-lab-visual-surface";
    const visual = page.getByTestId(visualTestId);
    await visual.waitFor({ timeout: 15000 });
    visualSurface = await visual.evaluate((node) => {
      const styles = window.getComputedStyle(node);
      return {
        testId: node.getAttribute("data-testid"),
        accentVar: styles.getPropertyValue("--subject-accent").trim(),
        lightVar: styles.getPropertyValue("--subject-light").trim(),
        backgroundImage: styles.backgroundImage,
      };
    });

    if (visualSurface.accentVar !== subject.accent || !visualSurface.backgroundImage.includes("gradient")) {
      throw new Error(`Visual surface theme mismatch for ${route.room}: ${JSON.stringify(visualSurface)}`);
    }
  }

  await assertNoOverflow(page, `economy-${route.room}`, checks);
  return { route, theme, visualSurface, url: page.url() };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  const checks = [];
  const inspected = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const route of subject.routes) {
    inspected.push(await inspectRoute(page, route, checks));
  }

  await page.setViewportSize({ width: 390, height: 844 });
  inspected.push(await inspectRoute(page, subject.routes[0], checks));
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockingConsoleErrors = consoleErrors.filter(
    (message) => !allowedConsoleErrorFragments.some((fragment) => message.includes(fragment))
  );
  const evidence = {
    allowedConsoleErrorFragments,
    baseUrl,
    inspected,
    checks,
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
