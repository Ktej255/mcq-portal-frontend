import type { Page } from "@playwright/test";

export const BACKEND_URL = `http://localhost:${process.env.E2E_BACKEND_PORT ?? 8099}`;

/**
 * Students seeded by backend/scripts/e2e_seed.py.
 * - e2e-new: in the free trial, no profile yet (first-time setup)
 * - e2e-student: in the free trial, profile done
 * - e2e-expired: trial ended, no plan
 * - e2e-foundation: trial ended, Foundation plan
 */
export type TestStudent = "e2e-new" | "e2e-student" | "e2e-expired" | "e2e-foundation";

/** Sign in as a seeded student through the app's local (mock) sign-in. */
export async function signInAs(page: Page, student: TestStudent) {
  await page.addInitScript((uid) => {
    if (window.localStorage.getItem("MOCK_TOKEN")) return;
    window.localStorage.setItem("MOCK_TOKEN", `MOCK_TOKEN_local_${uid}`);
    window.localStorage.setItem("MOCK_USER_EMAIL", `${uid}@example.com`);
    window.localStorage.setItem("MOCK_USER_UID", uid);
  }, student);
}

/** Bearer token the backend treats as an admin in mock-auth mode. */
export const ADMIN_TOKEN = "MOCK_TOKEN";
