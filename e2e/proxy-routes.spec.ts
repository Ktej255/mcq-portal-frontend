import { expect, test } from "@playwright/test";
import { createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import {
  ADMIN_ROUTE_PATTERNS,
  PROTECTED_ROUTE_PATTERNS,
  PUBLIC_UPSC_ROUTE_PATTERNS,
} from "../src/lib/auth/protected-routes";

// The sign-in rules of src/proxy.ts, checked with Clerk's own route matcher.
// (The e2e app signs in with the local mock provider, so the real Clerk
// redirect cannot be driven in a browser here; this guards the rules instead.)
const isProtected = createRouteMatcher(PROTECTED_ROUTE_PATTERNS);
const isPublicUpsc = createRouteMatcher(PUBLIC_UPSC_ROUTE_PATTERNS);
const isAdmin = createRouteMatcher(ADMIN_ROUTE_PATTERNS);

// Same decision as proxy.ts: a request needs sign-in when protected and not public.
const needsSignIn = (path: string) => {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  return isProtected(req) && !isPublicUpsc(req);
};

test.describe("proxy sign-in rules", () => {
  test("NEET and JEE routes require sign-in, like /upsc", () => {
    for (const path of [
      "/neet",
      "/neet/study",
      "/neet/books",
      "/neet/neet-physics/lms",
      "/neet/neet-physics/lms/topic/12",
      "/neet/neet-physics/lms/checkpoint/3",
      "/jee",
      "/jee/study",
      "/jee/jee-maths/lms/syllabus",
    ]) {
      expect(needsSignIn(path), path).toBe(true);
    }
    // Same as the /upsc subtree.
    expect(needsSignIn("/upsc/geography/lms")).toBe(true);
    expect(needsSignIn("/upsc/study")).toBe(true);
  });

  test("the public UPSC pages stay public and NEET/JEE have no public pages", () => {
    expect(needsSignIn("/upsc")).toBe(false);
    expect(needsSignIn("/upsc/pricing")).toBe(false);
    expect(needsSignIn("/upsc/prelims-2026-showcase")).toBe(false);
    expect(needsSignIn("/neet/pricing")).toBe(true);
    expect(needsSignIn("/jee/prelims-2026-showcase")).toBe(true);
  });

  test("/admin is still protected and the admin rule does not widen", () => {
    expect(needsSignIn("/admin/dashboard")).toBe(true);
    const admin = (p: string) => isAdmin(new NextRequest(new URL(p, "http://localhost:3000")));
    expect(admin("/admin/content")).toBe(true);
    expect(admin("/neet")).toBe(false);
    expect(admin("/jee/study")).toBe(false);
  });

  test("other public pages are unaffected", () => {
    for (const path of ["/", "/login", "/about", "/pricing", "/notanexam"]) {
      expect(needsSignIn(path), path).toBe(false);
    }
  });
});
