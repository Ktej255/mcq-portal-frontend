import type { NextRequest } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";

import { activeAuthProvider } from "@/env";
import { allowsServerMockToken } from "@/lib/auth/server-mock-auth";
import { supabase } from "@/lib/supabase/client";

function readBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
}

/** The signed-in learner's id, or null when the request is not signed in. */
export async function getLearnerId(request: NextRequest): Promise<string | null> {
  const token = readBearerToken(request);

  if (token && allowsServerMockToken(request) && token.startsWith("MOCK_TOKEN")) {
    return `mock:${token}`;
  }

  if (activeAuthProvider === "clerk") {
    try {
      const { userId } = await clerkAuth();
      return userId ?? null;
    } catch {
      return null;
    }
  }

  if (!token) return null;

  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    return !error && data.user?.id ? data.user.id : null;
  } catch {
    return null;
  }
}

export async function hasLearnerApiAccess(request: NextRequest) {
  return (await getLearnerId(request)) !== null;
}
