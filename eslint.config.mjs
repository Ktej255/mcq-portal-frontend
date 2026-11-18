import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-build-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Python backend lives in the same repo but is not part of the Next.js app.
    "backend/**",
  ]),
  // scripts/ and scratch/ are Node tooling (contract validators, content
  // extractors, one-off e2e probes), not application code. They stay linted for
  // real defects, but three rules are relaxed because they do not describe this
  // kind of code:
  //  - `require()` is the normal module mechanism for these CommonJS probes;
  //  - validators intentionally park partially parsed values (trees, regions,
  //    marker strings) for manual inspection, so unused locals are expected;
  //  - validators report with `condition ? pass(...) : missing(...)` statements,
  //    which `no-unused-expressions` misreads as dead expressions.
  // Every rule that protects shipped application code still applies to src/.
  {
    files: [
      "scripts/**/*.{js,mjs,cjs}",
      "scratch/**/*.{js,mjs,cjs}",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
]);

export default eslintConfig;
