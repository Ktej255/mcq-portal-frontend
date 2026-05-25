const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const evidencePath = path.join(__dirname, "subject-standard-ui-e2e-evidence.json");
const screenshotPath = path.join(__dirname, "subject-standard-ui-final.png");
const allowedConsoleErrorFragments = ["AUTH | Firebase auth is not initialized"];

const subjects = [
  { slug: "environment", title: "Environment", accent: "#1d9e75", dark: "#123c31", light: "#e7f5ee" },
  { slug: "economy", title: "Economy", accent: "#2563eb", dark: "#172554", light: "#eff6ff" },
  { slug: "disaster-management", title: "Disaster Management", accent: "#d97706", dark: "#3a2515", light: "#fff4df" },
  { slug: "polity-governance", title: "Polity and Governance", accent: "#7c3aed", dark: "#312e81", light: "#f5f3ff" },
];

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

async function inspectSubject(page, subject, checks) {
  await page.goto(`${baseUrl}/upsc/${subject.slug}`, { waitUntil: "networkidle", timeout: 45000 });
  const shell = page.getByTestId("subject-standard-shell");
  const loop = page.getByTestId("subject-loop-actions").first();
  await shell.waitFor({ timeout: 15000 });
  await loop.waitFor({ timeout: 15000 });
  await page.getByRole("heading", { name: new RegExp(subject.title, "i") }).first().waitFor({ timeout: 15000 });
  await page.getByTestId("subject-command-action-route").waitFor({ timeout: 15000 });

  const theme = await shell.evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      subject: node.getAttribute("data-subject"),
      accentAttr: node.getAttribute("data-subject-accent"),
      darkAttr: node.getAttribute("data-subject-dark"),
      lightAttr: node.getAttribute("data-subject-light"),
      accentVar: styles.getPropertyValue("--subject-accent").trim(),
      darkVar: styles.getPropertyValue("--subject-dark").trim(),
      lightVar: styles.getPropertyValue("--subject-light").trim(),
    };
  });

  const loopTheme = await loop.evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      subject: node.getAttribute("data-subject"),
      accentAttr: node.getAttribute("data-subject-accent"),
      accentVar: styles.getPropertyValue("--subject-accent").trim(),
      linkCount: node.querySelectorAll("a").length,
    };
  });

  if (
    theme.subject !== subject.slug ||
    theme.accentAttr !== subject.accent ||
    theme.darkAttr !== subject.dark ||
    theme.lightAttr !== subject.light ||
    theme.accentVar !== subject.accent ||
    theme.darkVar !== subject.dark ||
    theme.lightVar !== subject.light
  ) {
    throw new Error(`Subject shell theme mismatch for ${subject.slug}: ${JSON.stringify(theme)}`);
  }

  if (loopTheme.subject !== subject.slug || loopTheme.accentAttr !== subject.accent || loopTheme.accentVar !== subject.accent || loopTheme.linkCount < 6) {
    throw new Error(`Subject loop theme mismatch for ${subject.slug}: ${JSON.stringify(loopTheme)}`);
  }

  const actionHref = await page.getByTestId("subject-command-action-route").getAttribute("href");
  if (!actionHref?.startsWith(`/upsc/${subject.slug}/`)) {
    throw new Error(`Next action route is not scoped to ${subject.slug}: ${actionHref}`);
  }

  await assertNoOverflow(page, `${subject.slug}-desktop`, checks);
  return { theme, loopTheme, actionHref };
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

  for (const subject of subjects) {
    inspected.push({ subject: subject.slug, ...(await inspectSubject(page, subject, checks)) });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await inspectSubject(page, subjects[1], checks);
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
