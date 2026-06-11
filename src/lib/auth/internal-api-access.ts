import type { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { activeAuthProvider } from "@/env";
import { isExplicitLocalMockMasterToken, isMasterEmail } from "@/lib/auth/master-access";
import { supabase } from "@/lib/supabase/client";

function readBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
}

function isLocalRequest(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export async function hasInternalApiAccess(request: NextRequest) {
  const token = readBearerToken(request);
  if (token && isLocalRequest(request) && isExplicitLocalMockMasterToken(token)) {
    return true;
  }

  if (activeAuthProvider === "clerk") {
    try {
      const user = await currentUser();
      const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
      return isMasterEmail(email);
    } catch {
      return false;
    }
  }

  if (!token) return false;

  if (!supabase) return false;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    return !error && isMasterEmail(data.user?.email);
  } catch {
    return false;
  }
}
