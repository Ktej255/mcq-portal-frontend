import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import { isMasterEmail } from "@/lib/auth/master-access";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NEXT_PUBLIC_AUTH_PROVIDER !== "clerk") {
    return NextResponse.next();
  }

  // Dynamically import Clerk server-side helper to prevent Edge runtime compilation errors when Clerk is not active
  const { clerkClient, clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");

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

  const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

  const clerkAuthMiddleware = clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req) && !isPublicUpscRoute(req)) {
      const { userId } = await auth.protect();

      // Signed in is not enough for /admin: the account must be an admin (the
      // same master-email rule the internal admin APIs use).
      if (isAdminRoute(req)) {
        const user = await (await clerkClient()).users.getUser(userId);
        const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
        if (!isMasterEmail(email)) {
          return NextResponse.redirect(new URL("/upsc", req.url));
        }
      }
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
