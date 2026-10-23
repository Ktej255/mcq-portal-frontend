import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

test("handwriting trend is off by default; opting in and out works", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc/wellbeing");
  await expect(page.getByRole("heading", { name: "Handwriting trend", exact: true })).toBeVisible();

  const consent = page.getByTestId("wellbeing-consent");
  await expect(consent).not.toBeChecked();
  await expect(page.getByTestId("wellbeing-status")).toHaveCount(0);
  await expect(page.getByTestId("wellbeing-disclaimer")).toContainText("not a medical or psychological test");

  await consent.check();
  await expect(page.getByTestId("wellbeing-notice")).toContainText("is on");
  await expect(page.getByTestId("wellbeing-status")).toHaveAttribute("data-status", "not_enough_data");
  await expect(page.getByTestId("wellbeing-message")).toContainText("still learning");

  // The choice is remembered.
  await page.reload();
  await expect(page.getByTestId("wellbeing-consent")).toBeChecked();

  await page.getByTestId("wellbeing-consent").uncheck();
  await expect(page.getByTestId("wellbeing-notice")).toContainText("deleted");
  await expect(page.getByTestId("wellbeing-status")).toHaveCount(0);
});
