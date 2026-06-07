import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appRoot = path.join(root, "src", "app");
const outputJson = path.join(root, "scratch", "upsc-route-inventory.json");
const outputMarkdown = path.join(root, "docs", "UPSC_PORTAL_ROUTE_MATRIX_2026-05-31.md");

const operatorRoutes = new Set([
  "/upsc/prelims-2026-audit",
  "/upsc/prelims-2026-audit-v2",
  "/upsc/readiness-audit",
  "/upsc/daily-command",
  "/upsc/mcq-command",
  "/upsc/content-command",
  "/upsc/revision-command",
  "/upsc/geography/testing",
]);

const isolatedRoutes = new Set([
  "/admin/analytics",
  "/admin/observability",
  "/admin/tests",
  "/exam/demo",
  "/simulation/lobby",
]);

const futureSubjectPrefixes = [
  "/upsc/environment",
  "/upsc/disaster-management",
  "/upsc/economy",
  "/upsc/science-tech",
  "/upsc/polity-governance",
  "/upsc/internal-security-society",
  "/upsc/history",
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function pageFileToRoute(filePath) {
  const relative = path.relative(appRoot, filePath);
  const segments = relative
    .split(path.sep)
    .filter((segment) => segment !== "page.tsx")
    .filter((segment) => !segment.startsWith("("))
    .flatMap((segment) => {
      if (/^\[\[\.\.\..+\]\]$/.test(segment)) return [];
      if (/^\[.+\]$/.test(segment)) return [segment === "[testId]" ? "demo" : "sample"];
      return [segment];
    });
  return `/${segments.join("/")}`.replace(/\/+$/, "") || "/";
}

function classify(route) {
  if (route === "/" || route === "/login") {
    return {
      access: "public",
      area: "Public entry",
      expectedPath: route === "/login" ? "/dashboard" : route,
      note: route === "/" ? "Marketing entry" : "Local preview host redirects to the student dashboard",
    };
  }

  if (route === "/admin") {
    return {
      access: "master",
      area: "Admin redirect",
      expectedPath: "/admin/dashboard",
      note: "Redirects to the operator console",
    };
  }

  if (route === "/upsc/prelims-2026-audit-v2") {
    return {
      access: "master",
      area: "UPSC operator alias",
      expectedPath: "/admin/prelims-audit-v2",
      note: "Redirects to the protected V2 corpus audit",
    };
  }

  if (isolatedRoutes.has(route)) {
    return {
      access: "master",
      area: "Isolated legacy",
      expectedPath: route,
      note: "Retained for internal inspection only",
      allowLegacyApiFailure: route === "/exam/demo",
    };
  }

  if (route.startsWith("/admin/")) {
    return {
      access: "master",
      area: "Admin tool",
      expectedPath: route,
      note: "Protected operator surface",
    };
  }

  if (operatorRoutes.has(route)) {
    return {
      access: "master",
      area: "UPSC operator tool",
      expectedPath: route,
      note: "Protected internal UPSC surface",
    };
  }

  if (futureSubjectPrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`))) {
    return {
      access: "master",
      area: "Future subject scaffold",
      expectedPath: route,
      note: "Master-inspection scaffold until the Geography learner pilot closes",
    };
  }

  return {
    access: "learner",
    area: route.startsWith("/upsc/") || route === "/upsc" ? "Learner UPSC" : "Learner workspace",
    expectedPath: route,
    note: "Student-visible after local profile setup",
  };
}

const routes = walk(appRoot)
  .filter((filePath) => filePath.endsWith(`${path.sep}page.tsx`) || filePath.endsWith("/page.tsx"))
  .map(pageFileToRoute)
  .sort((left, right) => left.localeCompare(right))
  .map((route) => ({ route, ...classify(route) }));

const counts = routes.reduce(
  (summary, route) => {
    summary.total += 1;
    summary[route.access] += 1;
    summary.areas[route.area] = (summary.areas[route.area] ?? 0) + 1;
    return summary;
  },
  { total: 0, public: 0, learner: 0, master: 0, areas: {} },
);

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.mkdirSync(path.dirname(outputMarkdown), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify({ generatedAt: new Date().toISOString(), counts, routes }, null, 2)}\n`);

const markdown = `# UPSC Command Route Matrix

Date: 2026-05-31

Generated from the current \`src/app/**/page.tsx\` tree. This matrix treats route existence as inventory only; browser verification is recorded separately.

## Summary

| Item | Count |
| --- | ---: |
| Concrete page routes | ${counts.total} |
| Public routes | ${counts.public} |
| Learner routes | ${counts.learner} |
| Master-only routes | ${counts.master} |

## Area Counts

| Area | Count |
| --- | ---: |
${Object.entries(counts.areas)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([area, count]) => `| ${area} | ${count} |`)
  .join("\n")}

## Route Inventory

| Route | Access | Area | Expected destination | Note |
| --- | --- | --- | --- | --- |
${routes
  .map(({ route, access, area, expectedPath, note }) => `| \`${route}\` | ${access} | ${area} | \`${expectedPath}\` | ${note} |`)
  .join("\n")}
`;

fs.writeFileSync(outputMarkdown, markdown);
console.log(JSON.stringify({ outputJson, outputMarkdown, counts }, null, 2));
