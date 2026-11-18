import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

test("the Geography optional page opens the hand-written notes", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc/optional-subjects/geography");

  await expect(page.getByTestId("subject-shell")).toBeVisible();
  await expect(page.getByTestId("geography-notes-shelf")).toBeVisible();

  // Section A lists Geomorphology. It either has reviewed backend notes (Read)
  // or links to the hand-written notes (Read notes); it is never a dead row.
  const row = page.getByTestId("section-topics-item").filter({ hasText: "Geomorphology" });
  await expect(row).toBeVisible();
  const staticNotes = row.getByTestId("section-topics-static-notes");
  const backendRead = row.getByTestId("section-topics-read");
  await expect(staticNotes.or(backendRead)).toBeVisible();

  if (await staticNotes.count()) {
    await staticNotes.click();
    await expect(page).toHaveURL(/\/upsc\/optional-subjects\/geography-optional\/read\/[a-z-]+$/);
    await expect(page.getByRole("heading", { name: /Geomorphology/ }).first()).toBeVisible();
  }
});
