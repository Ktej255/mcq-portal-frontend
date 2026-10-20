import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

test("a new student sets up their plan and reaches the Geography syllabus", async ({ page }) => {
  await signInAs(page, "e2e-new");
  await page.goto("/upsc/geography/lms");

  // No profile yet, so the setup gate shows.
  const gate = page.getByTestId("upsc-profile-required");
  await expect(gate).toBeVisible();
  await page.getByTestId("upsc-profile-required-action").click();

  // Regression: the setup page used to show the same gate again (a loop).
  await expect(page).toHaveURL(/\/lms\/onboarding$/);
  await expect(gate).toHaveCount(0);

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: /^Intermediate/ }).click();
  await page.getByRole("button", { name: /^120 min/ }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Get Started", exact: true }).click();

  await expect(page).toHaveURL(/\/lms\/syllabus$/);
  await expect(page.getByRole("heading", { name: "Geography Syllabus" })).toBeVisible();
  await expect(page.getByText("Geomorphology")).toBeVisible();

  const header = page.locator("header").first();
  await expect(header.getByText("Free trial · 7 days left")).toBeVisible();
  await expect(header.getByText("All progress saved")).toBeVisible();

  // Setup saved a profile, so other student pages open without the gate.
  await page.goto("/upsc/geography/lms/practice");
  await expect(page.getByRole("button", { name: "Start Practice", exact: true }).first()).toBeVisible();
  await expect(gate).toHaveCount(0);
});
