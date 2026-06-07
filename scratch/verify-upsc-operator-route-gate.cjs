const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const profileKey = "upsc-student-profile-v1";
const studentToken = "MOCK_TOKEN_student_route_gate";
const masterToken = "MOCK_TOKEN_MASTER_route_gate";
const profile = {
  studentName: "Route Gate Student",
  learnerLevel: "BEGINNER",
  dailyStudyMinutes: 90,
  targetYear: "2027",
  learningStyle: "BALANCED",
  weakestSubject: "GEOGRAPHY",
  completedAt: new Date().toISOString(),
};

const operatorRoutes = [
  "/upsc/prelims-2026-audit",
  "/upsc/prelims-2026-audit-v2",
  "/upsc/daily-command",
  "/upsc/content-command",
  "/upsc/mcq-command",
  "/upsc/readiness-audit",
  "/upsc/revision-command",
  "/upsc/geography/testing",
  "/simulation/lobby",
  "/exam/demo",
  "/admin/dashboard",
];
const auditApiRoutes = ["/api/admin/prelims-audit-v1", "/api/admin/prelims-audit-v2"];

async function seed(page, token) {
  await page.goto(`${baseUrl}/login`);
  await page.evaluate(
    ({ profileKey, profile, token }) => {
      localStorage.clear();
      localStorage.setItem("MOCK_TOKEN", token);
      localStorage.setItem(profileKey, JSON.stringify(profile));
    },
    { profileKey, profile, token },
  );
}

async function expectPath(page, route, expectedPath) {
  await page.goto(`${baseUrl}${route}`);
  await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 10000 });
  console.log(`PASS ${route} -> ${expectedPath}`);
}

async function expectAccessible(page, route) {
  await page.goto(`${baseUrl}${route}`);
  await page.waitForLoadState("networkidle");
  const path = new URL(page.url()).pathname;
  if (path === "/dashboard" || path === "/login") {
    throw new Error(`Expected ${route} to remain accessible, received ${page.url()}`);
  }
  console.log(`PASS ${route} accessible as ${path}`);
}

async function expectApiStatus(page, route, token, expectedStatus) {
  const response = await page.request.get(`${baseUrl}${route}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status() !== expectedStatus) {
    throw new Error(`Expected ${route} to return ${expectedStatus}, received ${response.status()}`);
  }
  console.log(`PASS ${route} -> ${expectedStatus}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await seed(page, studentToken);
  const forgedMasterJwt = [
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ email: "quicklearn601@gmail.com" })).toString("base64url"),
    "forged",
  ].join(".");
  for (const route of auditApiRoutes) {
    await expectApiStatus(page, route, studentToken, 403);
    await expectApiStatus(page, route, forgedMasterJwt, 403);
  }
  await page.goto(`${baseUrl}/upsc`);
  await page.waitForLoadState("networkidle");
  if (await page.locator('a[href="/upsc/revision-command"]').count()) {
    throw new Error("Learner UPSC workspace still exposes the internal Revision Command route.");
  }
  console.log("PASS learner workspace hides internal Revision Command link");

  for (const route of operatorRoutes) {
    await expectPath(page, route, "/dashboard");
  }
  await expectAccessible(page, "/upsc/geography/talk?day=1");

  await seed(page, masterToken);
  for (const route of auditApiRoutes) {
    await expectApiStatus(page, route, masterToken, 200);
  }
  for (const route of operatorRoutes) {
    await expectAccessible(page, route);
  }

  await browser.close();
  console.log("UPSC operator route gate verification passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
