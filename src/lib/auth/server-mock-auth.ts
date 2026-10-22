import type { NextRequest } from "next/server";

/**
 * Test (MOCK_TOKEN) bearer tokens are accepted by the Next.js API routes only
 * under `next dev` on localhost. A production build never accepts them, even
 * when it is served on localhost (self-hosted, or behind a proxy).
 */
export function allowsServerMockToken(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") return false;
  const hostname = request.nextUrl.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}
