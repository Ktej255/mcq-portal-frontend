import { expect, test } from "@playwright/test";

import { BACKEND_URL, signInAs } from "./helpers";

// Runs with the backend's progression rules on (playwright.config.ts sets
// E2E_ENFORCE_PROGRESSION=true for the whole run). The seeded students have no
// progress, so only the first Geography topic is open.

type TreeNode = { node_id: number; title: string; locked?: boolean; lock_reason?: string | null; children: TreeNode[] };

function leaves(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((n) => (n.children.length ? leaves(n.children) : [n]));
}

test("later topics are locked in the syllabus and open to a locked screen", async ({ page, request }) => {
  await signInAs(page, "e2e-student");

  // Which topic is locked, and why, according to the API.
  const res = await request.get(`${BACKEND_URL}/api/v1/gs-lms/geography/syllabus`, {
    headers: { Authorization: "Bearer MOCK_TOKEN_local_e2e-student" },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const all = leaves((body.data ?? body).tree as TreeNode[]);
  const locked = all.find((n) => n.locked);
  expect(locked, "a later Geography topic is locked").toBeTruthy();
  expect(locked?.lock_reason).toBeTruthy();
  expect(all[0].locked).toBeFalsy();

  // Syllabus: expand every mega-topic, then the lock and its reason show.
  await page.goto("/upsc/geography/lms/syllabus");
  await expect(page.getByRole("heading", { name: "Geography Syllabus" })).toBeVisible();
  await expect(page.getByText("Geomorphology")).toBeVisible();
  const collapsed = page.getByRole("button", { name: "Expand", exact: true });
  while ((await collapsed.count()) > 0) {
    await collapsed.first().click();
  }
  const lockedRow = page.locator('[role="treeitem"][data-locked]').first();
  await expect(lockedRow).toBeVisible();
  await expect(lockedRow.getByTestId("lock-reason")).toContainText(locked!.lock_reason!);
  await expect(page.getByTestId("progression-summary")).toContainText("topics mastered");
  await expect(page.getByTestId("continue-topic")).toBeVisible();

  // Clicking a locked topic does not navigate.
  await lockedRow.click({ force: true }); // aria-disabled rows are "not enabled" to Playwright
  await expect(page).toHaveURL(/\/lms\/syllabus$/);

  // Opening it directly shows the locked screen with the reason, not an error.
  await page.goto(`/upsc/geography/lms/topic/${locked!.node_id}`);
  await expect(page.getByTestId("topic-locked")).toBeVisible();
  await expect(page.getByTestId("topic-locked-reason")).toContainText(locked!.lock_reason!);
  await expect(page.getByRole("link", { name: /^Go to / })).toBeVisible();
});
