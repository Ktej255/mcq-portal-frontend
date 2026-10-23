/**
 * Route patterns that src/proxy.ts protects with Clerk (sign-in required).
 * Kept in one dependency-free module so e2e/proxy-routes.spec.ts can check
 * them with Clerk's own matcher.
 *
 * `/neet(.*)` and `/jee(.*)` are protected exactly like `/upsc(.*)`: the whole
 * subtree, with no public exceptions. Like `/upsc(.*)`, the trailing `(.*)`
 * also matches look-alike prefixes (`/neetx`), which fails closed.
 */
export const PROTECTED_ROUTE_PATTERNS = [
  "/dashboard(.*)",
  "/reports(.*)",
  "/revision(.*)",
  "/history(.*)",
  "/tests(.*)",
  "/exam(.*)",
  "/upsc(.*)",
  "/neet(.*)",
  "/jee(.*)",
  "/admin(.*)",
  "/api/upsc/teacher(.*)",
];

/** UPSC pages open without sign-in. NEET and JEE have none. */
export const PUBLIC_UPSC_ROUTE_PATTERNS = [
  "/upsc",
  "/upsc/pricing(.*)",
  "/upsc/prelims-2026-showcase(.*)",
];

export const ADMIN_ROUTE_PATTERNS = ["/admin(.*)"];
