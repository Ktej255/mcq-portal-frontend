import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

test("a student whose trial ended is asked to choose a plan", async ({ page }) => {
  await signInAs(page, "e2e-expired");
  await page.goto("/upsc/geography/lms/syllabus");

  const dialog = page.getByTestId("upgrade-prompt");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Your free trial has ended")).toBeVisible();
  await expect(page.locator("header").first().getByText("Trial ended · Choose a plan")).toBeVisible();

  await dialog.getByRole("link", { name: "See plans" }).click();
  await expect(page).toHaveURL(/\/upsc\/pricing$/);
});

test("a Foundation student can learn GS but Optional needs Plus", async ({ page }) => {
  await signInAs(page, "e2e-foundation");

  // GS is included in Foundation: the syllabus loads with no upgrade prompt.
  await page.goto("/upsc/geography/lms/syllabus");
  await expect(page.getByRole("heading", { name: "Geography Syllabus" })).toBeVisible();
  await expect(page.getByTestId("upgrade-prompt")).toHaveCount(0);

  // Regression: the dashboard's background Optional check used to pop the dialog.
  await page.goto("/upsc");
  await expect(page.getByText("Choose your optional")).toBeVisible();
  await expect(page.getByTestId("upgrade-prompt")).toHaveCount(0);
});
