import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const ADAPTIVE_TEACHER_REQUEST_LIMIT = 12;

type DurableRateLimitStatus = "enforced" | "not-configured" | "unavailable";

type DurableRateLimitRpcRow = {
  allowed: boolean;
  request_limit: number;
  remaining: number;
  retry_after_seconds: number;
};

export type DurableAdaptiveTeacherRateLimit = {
  status: DurableRateLimitStatus;
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

const globalWithDurableRateLimit = globalThis as typeof globalThis & {
  __upscAdaptiveTeacherAdminClient?: SupabaseClient;
};

function isLocalRequest(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function configuredAdminClient() {
  if (globalWithDurableRateLimit.__upscAdaptiveTeacherAdminClient) {
    return globalWithDurableRateLimit.__upscAdaptiveTeacherAdminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secretKey) return null;

  globalWithDurableRateLimit.__upscAdaptiveTeacherAdminClient = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return globalWithDurableRateLimit.__upscAdaptiveTeacherAdminClient;
}

function hashedRequestIdentity(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwardedFor || request.headers.get("x-real-ip")?.trim() || "unknown";
  const authorization = request.headers.get("authorization") ?? "anonymous";
  return createHash("sha256").update(`${clientIp}:${authorization}`).digest("hex");
}

export function requiresDurableAdaptiveTeacherRateLimit(request: NextRequest) {
  if (isLocalRequest(request)) return false;
  return process.env.ADAPTIVE_TEACHER_REQUIRE_DURABLE_RATE_LIMIT !== "false";
}

export async function consumeDurableAdaptiveTeacherRateLimit(
  request: NextRequest
): Promise<DurableAdaptiveTeacherRateLimit> {
  const client = configuredAdminClient();
  if (!client) {
    return {
      status: "not-configured",
      allowed: false,
      limit: ADAPTIVE_TEACHER_REQUEST_LIMIT,
      remaining: 0,
      retryAfterSeconds: 30,
    };
  }

  try {
    const { data, error } = await client
      .rpc("consume_upsc_adaptive_teacher_rate_limit", {
        p_request_key_hash: hashedRequestIdentity(request),
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        p_request_limit: ADAPTIVE_TEACHER_REQUEST_LIMIT,
      })
      .single();

    if (error || !data) {
      return {
        status: "unavailable",
        allowed: false,
        limit: ADAPTIVE_TEACHER_REQUEST_LIMIT,
        remaining: 0,
        retryAfterSeconds: 30,
      };
    }

    const rateLimit = data as DurableRateLimitRpcRow;
    return {
      status: "enforced",
      allowed: rateLimit.allowed === true,
      limit: Number(rateLimit.request_limit) || ADAPTIVE_TEACHER_REQUEST_LIMIT,
      remaining: Math.max(0, Number(rateLimit.remaining) || 0),
      retryAfterSeconds: Math.max(0, Number(rateLimit.retry_after_seconds) || 0),
    };
  } catch {
    return {
      status: "unavailable",
      allowed: false,
      limit: ADAPTIVE_TEACHER_REQUEST_LIMIT,
      remaining: 0,
      retryAfterSeconds: 30,
    };
  }
}
