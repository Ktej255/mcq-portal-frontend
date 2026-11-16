import { expect, test } from "@playwright/test";

import { ADMIN_TOKEN, signInAs } from "./helpers";

const TEST_TITLE = "E2E uploaded Polity paper";

const GOOD_FILE = [
  "text_en,A,B,C,D,correct,explanation_en,difficulty,topic",
  "Which house can a Money Bill be introduced in first?,Lok Sabha,Rajya Sabha,Either house,A joint sitting,A,Article 109,EASY,Parliament",
  "Who presides over a joint sitting of Parliament?,The President,The Speaker,The Chairman,The Prime Minister,B,Article 108,MEDIUM,Parliament",
].join("\n");

const BAD_FILE = [
  "text_en,A,B,C,D,correct,topic",
  "Which article provides for the Finance Commission?,Article 280,Article 281,Article 282,Article 283,E,Parliament",
].join("\n");

function csv(name: string, text: string) {
  return { name, mimeType: "text/csv", buffer: Buffer.from(text) };
}

test("an operator creates a test, uploads its questions, and a student can open it", async ({ browser }) => {
  const operatorContext = await browser.newContext();
  const page = await operatorContext.newPage();
  await page.addInitScript((token) => {
    window.localStorage.setItem("MOCK_TOKEN", token);
    window.localStorage.setItem("MOCK_USER_EMAIL", "operator@example.com");
    window.localStorage.setItem("MOCK_USER_UID", "operator");
  }, ADMIN_TOKEN);
  await page.goto("/admin/tests");

  const builder = page.getByTestId("admin-test-builder");
  await builder.getByLabel(/^Subject/).selectOption("__new__");
  await builder.getByLabel("New subject name").fill("E2E Polity");
  await builder.getByLabel("Test title").fill(TEST_TITLE);
  await builder.getByLabel("Duration in minutes").fill("5");
  await builder.getByRole("button", { name: "Create test" }).click();
  await expect(builder.getByText(`"${TEST_TITLE}" is created.`, { exact: false })).toBeVisible();

  const fileInput = builder.getByLabel("Questions file (CSV)");
  const report = page.getByTestId("admin-import-report");
  const save = builder.getByRole("button", { name: /^Save/ });

  // A file with a mistake is reported by row and cannot be saved.
  await fileInput.setInputFiles(csv("bad.csv", BAD_FILE));
  await builder.getByRole("button", { name: "Check file" }).click();
  await expect(report.getByText("Needs fixing")).toBeVisible();
  await expect(report.getByText("Correct option must be A, B, C or D.")).toBeVisible();
  await expect(save).toBeDisabled();

  // A good file is checked first, then saved.
  await fileInput.setInputFiles(csv("good.csv", GOOD_FILE));
  await builder.getByRole("button", { name: "Check file" }).click();
  await expect(save).toHaveText("Save 2 questions");
  await save.click();
  await expect(builder.getByText("2 questions saved. Students can take", { exact: false })).toBeVisible();

  // The same file again adds nothing.
  await fileInput.setInputFiles(csv("good.csv", GOOD_FILE));
  await builder.getByRole("button", { name: "Check file" }).click();
  await expect(report.getByText("Already there")).toHaveCount(2);
  await expect(save).toBeDisabled();
  await operatorContext.close();

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await signInAs(studentPage, "e2e-student");
  await studentPage.goto("/tests");
  await expect(studentPage.getByRole("heading", { name: TEST_TITLE })).toBeVisible();
  await studentContext.close();
});
