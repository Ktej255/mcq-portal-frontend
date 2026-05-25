const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";

const blockedText = [
  "Network Error",
  "Critical Error",
  "Command Sync Failed",
  "Verification Failed",
  "Forensic Debug Mode",
  "History fetch failed",
];

async function verifyRoute(page, path, expectedText) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  const text = await page.locator("body").innerText();
  for (const blocked of blockedText) {
    if (text.includes(blocked)) {
      throw new Error(`${path} exposed blocked failure text: ${blocked}`);
    }
  }
  const expectedItems = Array.isArray(expectedText) ? expectedText : expectedText ? [expectedText] : [];
  for (const expected of expectedItems) {
    if (!text.includes(expected)) {
      throw new Error(`${path} did not contain expected text: ${expected}`);
    }
  }
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 2) {
    throw new Error(`${path} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
  return { path, ok: true };
}

async function verifyWatchToTalkFlow(page) {
  await page.goto(`${baseUrl}/upsc/geography/watch?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  await page.getByTestId("watch-complete-and-discuss").click();
  await page.waitForURL(/\/upsc\/geography\/talk\?day=1/, { timeout: 45000 });
  await page.waitForTimeout(1500);
  const text = await page.locator("body").innerText();
  for (const expected of ["AI teacher", "STUDENT ANSWER"]) {
    if (!text.includes(expected)) {
      throw new Error(`/upsc/geography/watch -> talk flow did not contain expected text: ${expected}`);
    }
  }
  return { path: "/upsc/geography/watch-to-talk", ok: true };
}

async function verifyTalkLabMcqRevisitFlow(page) {
  await page.goto(`${baseUrl}/upsc/geography/talk?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  const answer = "Earth as a System connects latitude, longitude, rotation, revolution, time zones and climate because location controls sunlight, day length and seasons. On a map, latitude explains climate zones while longitude helps time calculation. UPSC trap: latitude and longitude are not the same and do not both measure time.";
  const answerBox = page.getByTestId("talk-answer-draft");
  await answerBox.fill(answer);
  await page.getByTestId("talk-assess-answer").click();
  await page.waitForTimeout(1000);
  let text = await page.locator("body").innerText();
  for (const expected of ["SCORE", "Visual"]) {
    if (!text.includes(expected)) {
      throw new Error(`/upsc/geography/talk did not contain expected text after assessment: ${expected}`);
    }
  }

  await page.goto(`${baseUrl}/upsc/geography/lab?mode=earth-layers&day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  text = await page.locator("body").innerText();
  for (const expected of ["VISUAL BOARD", "PROOF CHECKLIST"]) {
    if (!text.includes(expected)) {
      throw new Error(`/upsc/geography/lab did not contain expected text: ${expected}`);
    }
  }
  await page.getByTestId("lab-complete-and-mcq").click();
  await page.waitForURL(/\/upsc\/geography\/mcq-readiness\?day=1/, { timeout: 45000 });
  await page.waitForTimeout(1500);
  text = await page.locator("body").innerText();
  for (const expected of ["FRESH SET", "Waiting for fresh MCQs"]) {
    if (!text.includes(expected)) {
      throw new Error(`/upsc/geography/mcq-readiness did not contain expected text: ${expected}`);
    }
  }

  await page.goto(`${baseUrl}/upsc/geography/revisit?day=1`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  text = await page.locator("body").innerText();
  for (const expected of ["RECOVERY CHECKLIST", "SHORT REPAIR NOTE"]) {
    if (!text.includes(expected)) {
      throw new Error(`/upsc/geography/revisit did not contain expected text: ${expected}`);
    }
  }
  return { path: "/upsc/geography/talk-lab-mcq-revisit", ok: true };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const checks = [];
  checks.push(await verifyRoute(page, "/dashboard", "Earth as a System"));
  checks.push(await verifyRoute(page, "/upsc", "Earth as a System"));
  checks.push(await verifyRoute(page, "/upsc/geography", ["TODAY'S FUNNEL", "Day 30", "Geography Command Day"]));
  checks.push(await verifyRoute(page, "/upsc/geography/watch?day=1", ["CLASS PLAYER", "Watch the lesson"]));
  checks.push(await verifyWatchToTalkFlow(page));
  checks.push(await verifyTalkLabMcqRevisitFlow(page));
  checks.push(await verifyRoute(page, "/tests", "Start with today's MCQ only"));
  checks.push(await verifyRoute(page, "/revision", "Your next revision is after practice"));
  checks.push(await verifyRoute(page, "/history", "Your path is just starting"));
  checks.push(await verifyRoute(page, "/reports", "No real gap yet"));
  await browser.close();
  console.log(JSON.stringify({ baseUrl, checks, passed: true }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
