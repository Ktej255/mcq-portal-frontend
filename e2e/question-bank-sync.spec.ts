import { expect, test } from "@playwright/test";

import { ADMIN_TOKEN, BACKEND_URL } from "./helpers";

test("question bank answers saved on the account load on a new device", async ({ page, request }) => {
  const attempt = {
    questionId: "e2e-sync-q1",
    subjectSlug: "geography",
    linkedDay: 1,
    topic: "Sync check",
    difficulty: "EASY",
    source: "NCERT_BASE",
    selectedOption: "A",
    correctOption: "A",
    isCorrect: true,
    solvedAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
  };
  // Another device saved one answer to the account.
  const saved = await request.put(`${BACKEND_URL}/api/v1/student/progress/question-bank`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    data: { progress: { [attempt.questionId]: attempt } },
  });
  expect(saved.ok()).toBeTruthy();

  // This browser starts empty.
  await page.addInitScript((token) => {
    window.localStorage.setItem("MOCK_TOKEN", token);
    window.localStorage.setItem("MOCK_USER_EMAIL", "operator@example.com");
    window.localStorage.setItem("MOCK_USER_UID", "operator");
  }, ADMIN_TOKEN);
  await page.goto("/upsc/question-bank?subject=geography");

  await expect
    .poll(async () =>
      page.evaluate(() => window.localStorage.getItem("sarit-upsc-question-bank-attempts-v1") ?? ""),
    )
    .toContain("e2e-sync-q1");
});
