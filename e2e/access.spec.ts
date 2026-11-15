import { expect, test } from "@playwright/test";

import { ADMIN_TOKEN, signInAs } from "./helpers";

test("the source archive listing is for operators only", async ({ request }) => {
  const anonymous = await request.get("/api/upsc/source-archive");
  expect(anonymous.status()).toBe(403);
  const body = await anonymous.json();
  expect(body.rootPath).toBe("");
  expect(body.recentFiles).toEqual([]);

  const student = await request.get("/api/upsc/source-archive", {
    headers: { Authorization: "Bearer MOCK_TOKEN_local_e2e-student" },
  });
  expect(student.status()).toBe(403);

  const operator = await request.get("/api/upsc/source-archive", {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  expect(operator.status()).not.toBe(403);
});

test("a student cannot open operator screens", async ({ page }) => {
  await signInAs(page, "e2e-student");

  // Content management lives under the student shell; it must still be operator-only.
  await page.goto("/admin/cms");
  await expect(page).toHaveURL(/\/dashboard|\/upsc/);
  await expect(page.getByRole("link", { name: /bulk upload/i })).toHaveCount(0);

  // Student pages link to the operator question bank; a student lands in practice instead.
  await page.goto("/upsc/question-bank");
  await expect(page).toHaveURL(/\/practice/);
});

test("an operator sees the Geography content status and can load it again", async ({ page }) => {
  await page.addInitScript((token) => {
    window.localStorage.setItem("MOCK_TOKEN", token);
    window.localStorage.setItem("MOCK_USER_EMAIL", "operator@example.com");
    window.localStorage.setItem("MOCK_USER_UID", "operator");
  }, ADMIN_TOKEN);
  await page.goto("/admin/dashboard");

  const card = page.getByTestId("admin-geography-content-loader");
  await expect(card.getByText("The reviewed Geography content is in the database.", { exact: false })).toBeVisible();
  await expect(card.getByText("Practice MCQs")).toBeVisible();

  await card.getByRole("button", { name: "Load again" }).click();
  await expect(card.getByRole("status")).toHaveText(/already loaded and has been refreshed/, { timeout: 60_000 });
});
