import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

test("a subject opens in the sidebar once its content is reviewed", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc");

  // The seed imports one reviewed Polity topic; Economy has no content yet.
  const sidebar = page.locator("aside").first();
  const polity = sidebar.getByRole("link", { name: "Polity & Governance" });
  await expect(polity).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Economy" })).toHaveCount(0);
  await expect(sidebar.getByText("Economy")).toBeVisible();

  await polity.click();
  await expect(page).toHaveURL(/\/upsc\/polity-governance\/lms/);
});
