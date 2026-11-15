import type { NextRequest } from "next/server";

import { env } from "@/env";
import { API_VERSION_PATH, stripApiVersion } from "@/services/api/base-url.mjs";

function readBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
}

function backendBaseUrl() {
  const configured = (process.env.BACKEND_API_URL || env.NEXT_PUBLIC_API_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  // Accept the backend URL with or without a trailing /api/v1, like the
  // API client and the rewrite do.
  if (/^https?:\/\//i.test(configured)) return `${stripApiVersion(configured)}${API_VERSION_PATH}`;

  // Local development uses a relative public API path; the Next server route
  // talks to the local FastAPI process directly. Production must configure an
  // absolute BACKEND_API_URL (or an absolute NEXT_PUBLIC_API_BASE_URL).
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000/api/v1";
  return "";
}

/**
 * Verify operator access against the backend user record.
 *
 * This runs in Next server routes that proxy institutional operations. It does
 * not trust an email address, a local mock flag, or Clerk/Supabase metadata:
 * the backend `/auth/me` role is the single source of truth. Any missing token,
 * unreachable backend, or non-ADMIN role fails closed.
 */
export async function hasInternalApiAccess(request: NextRequest) {
  const token = readBearerToken(request);
  if (!token) return false;

  const baseUrl = backendBaseUrl();
  if (!baseUrl) return false;

  try {
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return false;

    const payload = (await response.json().catch(() => null)) as
      | { data?: { role?: unknown } }
      | null;
    return payload?.data?.role === "ADMIN";
  } catch {
    return false;
  }
}
