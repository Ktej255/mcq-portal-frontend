import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/reports(.*)",
  "/revision(.*)",
  "/history(.*)",
  "/tests(.*)",
  "/exam(.*)",
  "/upsc(.*)",
  "/api/upsc/teacher(.*)",
]);

const isPublicUpscRoute = createRouteMatcher([
  "/upsc",
  "/upsc/pricing(.*)",
  "/upsc/prelims-2026-showcase(.*)",
]);

const clerkAuthMiddleware = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request) && !isPublicUpscRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NEXT_PUBLIC_AUTH_PROVIDER !== "clerk") {
    return NextResponse.next();
  }

  return clerkAuthMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
