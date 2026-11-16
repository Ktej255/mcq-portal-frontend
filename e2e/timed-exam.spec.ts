import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

const TEST_TITLE = "E2E one-minute paper";

function secondsOnClock(text: string): number {
  const [minutes, seconds] = text.trim().split(":").map(Number);
  return minutes * 60 + seconds;
}

test("a timed test keeps its clock and answers across a reload, then submits itself", async ({ page }) => {
  test.setTimeout(150_000);
  await signInAs(page, "e2e-student");
  await page.goto("/tests");

  await expect(page.getByRole("heading", { name: TEST_TITLE })).toBeVisible();
  await page.getByRole("button", { name: /Start test/ }).click();
  await expect(page).toHaveURL(/\/exam\/\d+\?attemptId=\d+/);
  const examUrl = page.url();

  const timer = page.getByTestId("exam-timer");
  await expect(timer).toHaveText(/^0[01]:\d\d$/);
  const atStart = secondsOnClock(await timer.innerText());
  expect(atStart).toBeGreaterThan(40);
  expect(atStart).toBeLessThanOrEqual(60);

  // Answer the first question with the correct option and wait for the save to land.
  const saved = page.waitForResponse(
    (response) => response.url().includes("/answers/bulk") && response.ok(),
  );
  await page.getByText("Bravo", { exact: true }).click();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
  await saved;
  await page.waitForTimeout(4_000);

  // Moving on records the time spent on the question that was just left.
  const timed = page.waitForRequest((request) => {
    if (!request.url().includes("/answers/bulk")) return false;
    const answers: Array<{ time_taken_seconds?: number }> = request.postDataJSON()?.answers ?? [];
    return answers.some((answer) => (answer.time_taken_seconds ?? 0) >= 3);
  });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await timed;

  // Come back as if on another device: nothing kept in this browser but the sign-in.
  // Leave the exam first, because leaving it writes the time spent to this browser.
  await page.goto("/pricing");
  await page.evaluate(() => {
    window.localStorage.removeItem("mcq-exam-storage");
    window.localStorage.removeItem("mcq-timer-storage");
  });
  await page.goto(examUrl);

  await expect(page.getByText(/saved answer was restored/)).toBeVisible();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
  await expect(timer).toHaveText(/^00:\d\d$/);
  // The clock went on while the page was away; it did not start again.
  expect(secondsOnClock(await timer.innerText())).toBeLessThanOrEqual(atStart - 4);

  // No click on submit: when the minute is over the test submits itself.
  await expect(page).toHaveURL(/\/reports\?attemptId=\d+/, { timeout: 100_000 });
  await expect(page.getByText(/Failed to submit/)).toHaveCount(0);

  // Opening the exam again goes to the report; the attempt cannot be reopened.
  await page.goto(examUrl);
  await expect(page).toHaveURL(/\/reports\?attemptId=\d+/);
});
