import { defineConfig, devices } from "@playwright/test";

// End-to-end tests for the main student flows. Playwright starts both servers:
// a throwaway backend (e2e/start-backend.sh) and the Next.js app pointed at it.
// The frontend must be on port 3000: the backend's CORS list allows it.
//
//   npm run test:e2e              production build + `next start` (as in CI)
//   E2E_DEV=1 npm run test:e2e    `next dev` instead, faster locally
//   E2E_PYTHON=...                Python with backend/requirements.txt installed
//   PW_CHROMIUM_PATH=...          use an existing Chromium instead of Playwright's

const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 8099);
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const FRONTEND_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Tests share one seeded database, so run them one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: [
    {
      command: "bash e2e/start-backend.sh",
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      // Progression rules (topic order, step gates, checkpoints) are on for the whole run.
      env: { E2E_BACKEND_PORT: String(BACKEND_PORT), E2E_ENFORCE_PROGRESSION: "true" },
    },
    {
      command: process.env.E2E_DEV ? "npx next dev -p 3000" : "npm run build && npx next start -p 3000",
      url: `${FRONTEND_URL}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 600_000,
      env: { NEXT_PUBLIC_API_BASE_URL: BACKEND_URL },
    },
  ],
});

