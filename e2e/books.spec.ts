import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

// The seed imports the Polity template (book laxmikanth-indian-polity-7e) and adds
// five reviewed retention questions to chapter 1 (the Preamble).
test("choose a book, mark a chapter as reading and test myself", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc/books");
  await expect(page.getByRole("heading", { name: "My books", exact: true })).toBeVisible();

  await page.getByRole("radio", { name: /Reference books/ }).check();
  await expect(page.getByText("Saved")).toBeVisible();
  await page.getByTestId("book-option-laxmikanth-indian-polity-7e").check();

  const book = page.getByTestId("book-laxmikanth-indian-polity-7e");
  await expect(book).toBeVisible();
  const chapter = book.getByTestId("chapter-row").filter({ hasText: "Preamble of the Constitution" });
  await expect(chapter).toBeVisible();
  await expect(book.getByTestId("book-progress-summary")).toContainText("0 of");

  await chapter.getByRole("button", { name: "Reading" }).click();
  await expect(chapter.getByRole("button", { name: "Reading" })).toHaveAttribute("aria-pressed", "true");

  await chapter.getByTestId("chapter-test-me").click();
  const questions = page.getByTestId("retention-question");
  await expect(questions.first()).toBeVisible();
  const count = await questions.count();
  expect(count).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < count; i++) {
    await questions.nth(i).getByRole("radio").first().check();
  }
  await page.getByTestId("retention-submit").click();

  await expect(page.getByTestId("retention-score")).toContainText("%");
  await expect(page.getByTestId("retention-attempt")).toHaveCount(count);
  await expect(page.getByTestId("retention-attempt").first()).toContainText("Correct answer");
  await expect(page.getByTestId("retention-next-review")).toContainText("We'll remind you in");

  // The chapter row now shows the score and the next review date.
  await expect(chapter).toContainText("Last score");
  await expect(chapter).toContainText("Next review");

  // Selections persist after a reload.
  await page.reload();
  await expect(page.getByTestId("book-laxmikanth-indian-polity-7e")).toBeVisible();
});
