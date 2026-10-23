import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

// The seed creates NEET (switched off, with its three subjects) and JEE
// (switched on, subjects present but with no reviewed content yet).

test("/upsc keeps its UPSC branding and navigation", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc");

  const sidebar = page.locator("aside").first();
  await expect(sidebar.getByRole("heading", { name: "UPSC Command" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Current Affairs" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Optional" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Study", exact: true })).toHaveAttribute("href", "/upsc/study");
});

test("/neet shows a coming-soon page while the exam is switched off", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/neet");

  await expect(page.getByTestId("exam-coming-soon")).toContainText("NEET is coming soon");
  const sidebar = page.locator("aside").first();
  await expect(sidebar.getByRole("heading", { name: "NEET Command" })).toBeVisible();
  // UPSC-only features are not offered; Study, My books and Wellbeing stay under /neet.
  await expect(sidebar.getByRole("link", { name: "Current Affairs" })).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "Optional" })).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "Study", exact: true })).toHaveAttribute("href", "/neet/study");
  await expect(sidebar.getByRole("link", { name: "My books" })).toHaveAttribute("href", "/neet/books");
  await expect(sidebar.getByRole("link", { name: "Wellbeing" })).toHaveAttribute("href", "/neet/wellbeing");
});

test("/jee lists its subjects as not open yet and uses JEE branding", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/jee");

  // No subject has reviewed content, so the exam page is still "coming soon".
  await expect(page.getByTestId("exam-coming-soon")).toContainText("JEE is coming soon");
  const sidebar = page.locator("aside").first();
  await expect(sidebar.getByRole("heading", { name: "JEE Command" })).toBeVisible();
  await expect(sidebar.getByText("Mathematics")).toBeVisible();
  await expect(sidebar.getByText("Soon").first()).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Mathematics" })).toHaveCount(0);
});

test("an unknown top-level path is a 404", async ({ page }) => {
  await signInAs(page, "e2e-student");
  const response = await page.goto("/notanexam");
  expect(response?.status()).toBe(404);
  // Deeper paths under an unknown exam show the same 404 page. Next streams that
  // response, so its HTTP status is 200 there; the page content is what we check.
  await page.goto("/notanexam/neet-physics/lms");
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(page.getByTestId("exam-coming-soon")).toHaveCount(0);
});

// The e2e app uses the local mock sign-in, so these check the client-side guard;
// the Clerk proxy rules are checked in proxy-routes.spec.ts. Each path gets its own
// test because visiting /login can start a local preview session.
for (const path of ["/upsc/study", "/neet", "/jee/study"]) {
  test(`signed-out visitors to ${path} are sent to sign in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?redirect=${encodeURIComponent(path)}`));
  });
}

test("the exam picker offers active exams only and links to the chosen exam", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc/books");

  const picker = page.getByTestId("exam-picker");
  await expect(picker.getByRole("radio", { name: "UPSC" })).toBeChecked();
  await expect(picker.getByRole("radio", { name: "JEE" })).toBeVisible();
  await expect(picker.getByRole("radio", { name: "NEET" })).toHaveCount(0); // switched off

  try {
    await picker.getByRole("radio", { name: "JEE" }).check();
    await page.getByTestId("exam-picker-save").click();
    await expect(page.getByTestId("exam-picker-go")).toHaveAttribute("href", "/jee");
    await page.getByTestId("exam-picker-go").click();
    await expect(page).toHaveURL(/\/jee$/);
  } finally {
    // Put the shared test student back on UPSC for the other specs.
    await page.goto("/upsc/books");
    await page.getByTestId("exam-picker").getByRole("radio", { name: "UPSC" }).check();
    await page.getByTestId("exam-picker-save").click();
    await expect(page.getByTestId("exam-picker").getByText("Saved")).toBeVisible();
  }
});
