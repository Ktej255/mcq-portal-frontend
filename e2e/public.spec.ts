import { expect, test } from "@playwright/test";

import { ADMIN_TOKEN, BACKEND_URL } from "./helpers";

test("pricing page shows the four plans and their prices", async ({ page }) => {
  await page.goto("/pricing");
  for (const [plan, price] of [
    ["Foundation", "₹399"],
    ["Plus", "₹699"],
    ["Pro", "₹999"],
    ["Ultimate", "₹1,299"],
  ]) {
    await expect(page.getByText(plan, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(price).first()).toBeVisible();
  }
});

test("free diagnostic shows a plan and saves the lead", async ({ page, request }) => {
  const email = `lead-${Date.now()}@example.com`;
  await page.goto("/start");

  const choose = async (option: string | RegExp) => {
    await page.getByRole("button", { name: option }).first().click();
  };
  const next = () => page.getByRole("button", { name: "Continue" }).click();

  await choose("2027");
  await next();
  await choose(/^Fresh start/);
  await next();
  await choose("Geography");
  await next();
  await choose("4–5 hours");
  await next();
  await choose("Not decided yet");
  await page.getByRole("button", { name: "See my plan" }).click();

  await page.getByPlaceholder("Your name").fill("Asha Test");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByRole("button", { name: "Reveal my plan" }).click();

  await expect(page.getByRole("heading", { name: /Asha, here's your plan for the 2027 attempt/ })).toBeVisible();

  // The lead must be in the database, not only emailed.
  await expect
    .poll(async () => {
      const res = await request.get(`${BACKEND_URL}/api/v1/leads?page_size=200`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      const body = await res.json();
      return body.items?.find((lead: { email: string }) => lead.email === email) ?? null;
    })
    .toMatchObject({ name: "Asha Test", source: "diagnostic" });
});
