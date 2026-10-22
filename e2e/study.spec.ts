import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers";

// The seed imports the Polity template as REVIEWED. Its first topic is the only
// one open to a new student (progression is enforced), so the study flow runs there.
const TEMPLATE = path.join(__dirname, "../backend/app/core/gs_lms/data/templates/gs_subject_template.json");

type TemplateConcept = { title: string; key_points: string[]; versions?: unknown[] };
type TemplateNode = { children?: TemplateNode[]; concepts?: TemplateConcept[] };

function conceptWithVersions(): TemplateConcept {
  const template = JSON.parse(readFileSync(TEMPLATE, "utf-8")) as { tree: TemplateNode[] };
  const all: TemplateConcept[] = [];
  const walk = (nodes: TemplateNode[]) =>
    nodes.forEach((n) => {
      all.push(...(n.concepts ?? []));
      walk(n.children ?? []);
    });
  walk(template.tree);
  const found = all.find((c) => (c.versions?.length ?? 0) > 0);
  if (!found) throw new Error("template has no concept with versions");
  return found;
}

test("search, study a concept, explain it badly then well", async ({ page }) => {
  const concept = conceptWithVersions();
  await signInAs(page, "e2e-student");
  await page.goto("/upsc/study");
  await expect(page.getByRole("heading", { name: "What do you want to study?" })).toBeVisible();

  // A broad search lists Preamble hits with their breadcrumb.
  const search = page.getByTestId("study-search-input");
  await search.fill("Preamble");
  await expect(page).toHaveURL(/[?&]q=Preamble/);
  await expect(page.getByTestId("study-hit").first()).toBeVisible();
  await expect(page.getByTestId("study-hit").first()).toContainText("Preamble");

  // Narrow to the concept that has ready-made versions and open it in place.
  await search.fill(concept.title);
  const hit = page.getByTestId("study-hit").filter({ hasText: concept.title }).first();
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(page).toHaveURL(/concept=\d+/);
  await expect(page.getByTestId("study-card")).toContainText(concept.title);
  await expect(page.getByTestId("study-card")).toContainText(/Concept \d+ of \d+/);
  await expect(page.getByTestId("study-content")).toContainText("Sovereign");
  // The other versions are one click away.
  await expect(page.getByTestId("version-switch").first()).toBeVisible();

  // A weak explanation reveals what was missed.
  const input = page.getByTestId("explain-input");
  await input.fill("It is about the country and some words in a book.");
  await expect(page.getByTestId("explain-count")).toContainText("characters");
  await page.getByTestId("explain-submit").click();
  await expect(page.getByTestId("explain-result")).toBeVisible();
  await expect(page.getByTestId("missed-points")).toBeVisible();
  await expect(page.getByTestId("explain-passed")).toHaveCount(0);

  // Try again keeps the text; a good answer built from the key points passes.
  await page.getByTestId("explain-retry").click();
  await expect(input).toHaveValue(/country and some words/);
  await input.fill(concept.key_points.join(". ") + ".");
  await page.getByTestId("explain-submit").click();
  await expect(page.getByTestId("explain-passed")).toBeVisible();
  await expect(page.getByTestId("next-action").or(page.getByTestId("next-done"))).toBeVisible();
});

test("a search we cannot answer is noted as a request", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc/study");
  await page.getByTestId("study-search-input").fill("zxqvbn wlmrtk");
  await expect(page.getByTestId("study-no-results")).toContainText("We've noted your request");
  await expect(page.getByRole("link", { name: /syllabus/i }).first()).toBeVisible();
});

test("the study card opens straight from a shared link", async ({ page }) => {
  await signInAs(page, "e2e-student");
  await page.goto("/upsc/study?q=Preamble");
  await expect(page.getByTestId("study-hit").first()).toBeVisible();
});
