import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { activeAuthProvider } from "./env";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (activeAuthProvider !== "clerk") {
    return NextResponse.next();
  }

  // Dynamically import Clerk server-side helper to prevent Edge runtime compilation errors when Clerk is not active
  const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");

  const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/reports(.*)",
    "/revision(.*)",
    "/history(.*)",
    "/tests(.*)",
    "/exam(.*)",
    "/upsc(.*)",
    "/admin(.*)",
    "/api/upsc/teacher(.*)",
  ]);

  const isPublicUpscRoute = createRouteMatcher([
    "/upsc",
    "/upsc/pricing(.*)",
    "/upsc/prelims-2026-showcase(.*)",
  ]);

  const clerkAuthMiddleware = clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req) && !isPublicUpscRoute(req)) {
      await auth.protect();
    }
  });

  return clerkAuthMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
