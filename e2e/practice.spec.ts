import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

test("a student answers a full MCQ practice session and sees the results", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc/geography/lms/practice");
  await page.getByRole("button", { name: "Start Practice", exact: true }).first().click();

  await expect(page).toHaveURL(/\/practice\/\d+$/);
  const counter = page.getByText(/^Question \d+ of \d+$/);
  await expect(counter).toHaveText(/^Question 1 of \d+$/);
  const total = Number((await counter.innerText()).match(/of (\d+)/)![1]);
  expect(total).toBeGreaterThan(1);

  // Regression: every session used to end after the first answer.
  for (let n = 1; n <= total; n += 1) {
    await expect(counter).toHaveText(`Question ${n} of ${total}`);
    await page.locator("main button").filter({ hasText: /^\s*A/ }).first().click();
  }

  await expect(page.getByText("Practice Complete")).toBeVisible();
  await expect(page.getByText(`/ ${total} correct`)).toBeVisible();
  await expect(page.getByText(/^Score: \d+%$/)).toBeVisible();
});
