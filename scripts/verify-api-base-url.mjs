import {
  buildApiRewriteDestination,
  normalizeApiBaseUrl,
} from "../src/services/api/base-url.mjs";

const fixtures = [
  {
    name: "local versioned URL",
    input: "http://localhost:8000/api/v1",
    options: { isBrowser: false },
    client: "http://localhost:8000/api/v1/",
    rewrite: "http://localhost:8000/api/v1/:path*",
  },
  {
    name: "deployed root URL",
    input: "https://api.example.com",
    options: { isBrowser: false },
    client: "https://api.example.com/api/v1/",
    rewrite: "https://api.example.com/api/v1/:path*",
  },
  {
    name: "deployed versioned URL",
    input: "https://api.example.com/api/v1/",
    options: { isBrowser: false },
    client: "https://api.example.com/api/v1/",
    rewrite: "https://api.example.com/api/v1/:path*",
  },
  {
    name: "ALB browser proxy",
    input: "http://mcq-portal-alb.example.internal/api/v1",
    options: { isBrowser: true },
    client: "/api/v1/",
    rewrite: "http://mcq-portal-alb.example.internal/api/v1/:path*",
  },
  {
    name: "relative versioned URL",
    input: "/api/v1",
    options: { isBrowser: true },
    client: "/api/v1/",
    rewriteError: true,
  },
];

for (const fixture of fixtures) {
  const client = normalizeApiBaseUrl(fixture.input, fixture.options);
  let rewrite = "";
  let rewriteFailed = false;
  try {
    rewrite = buildApiRewriteDestination(fixture.input);
  } catch {
    rewriteFailed = true;
  }

  if (fixture.rewriteError) {
    if (!rewriteFailed) {
      throw new Error(`${fixture.name} should reject a relative server rewrite base`);
    }
    continue;
  }

  if (client !== fixture.client || rewrite !== fixture.rewrite) {
    throw new Error(
      `${fixture.name} failed: client=${client} rewrite=${rewrite}`,
    );
  }
  if ((client.match(/\/api\/v1/g) ?? []).length !== 1) {
    throw new Error(`${fixture.name} produced a duplicated client API prefix`);
  }
  if ((rewrite.match(/\/api\/v1/g) ?? []).length !== 1) {
    throw new Error(`${fixture.name} produced a duplicated rewrite API prefix`);
  }
}

console.log(`API base URL fixtures passed: ${fixtures.length}`);
