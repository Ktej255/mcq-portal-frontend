import type { NextRequest } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";

import { activeAuthProvider } from "@/env";
import { supabase } from "@/lib/supabase/client";

function readBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
}

function isLocalRequest(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export async function hasLearnerApiAccess(request: NextRequest) {
  const token = readBearerToken(request);

  if (token && isLocalRequest(request) && token.startsWith("MOCK_TOKEN")) {
    return true;
  }

  if (activeAuthProvider === "clerk") {
    try {
      const { userId } = await clerkAuth();
      return Boolean(userId);
    } catch {
      return false;
    }
  }

  if (!token) return false;

  if (!supabase) return false;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    return !error && Boolean(data.user?.id);
  } catch {
    return false;
  }
}
