import type { NextRequest } from "next/server";

type RateLimitBucket = {
  hits: number[];
};

type RateLimitStore = Map<string, RateLimitBucket>;

const RATE_LIMIT_WINDOW_MS = 60_000;
const ADAPTIVE_TEACHER_REQUEST_LIMIT = 12;
const MAX_TRACKED_BUCKETS = 500;

const globalWithRateLimit = globalThis as typeof globalThis & {
  __upscAdaptiveTeacherRateLimits?: RateLimitStore;
};

function getStore() {
  if (!globalWithRateLimit.__upscAdaptiveTeacherRateLimits) {
    globalWithRateLimit.__upscAdaptiveTeacherRateLimits = new Map();
  }
  return globalWithRateLimit.__upscAdaptiveTeacherRateLimits;
}

function getRequestKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwardedFor || request.headers.get("x-real-ip")?.trim() || "local";
  const authorization = request.headers.get("authorization") ?? "anonymous";
  return `${clientIp}:${authorization.slice(-32)}`;
}

function pruneStore(store: RateLimitStore, now: number) {
  if (store.size <= MAX_TRACKED_BUCKETS) return;

  for (const [key, bucket] of store) {
    const recentHits = bucket.hits.filter((timestamp) => timestamp > now - RATE_LIMIT_WINDOW_MS);
    if (recentHits.length === 0) store.delete(key);
    if (store.size <= MAX_TRACKED_BUCKETS) break;
  }
}

export function consumeAdaptiveTeacherRateLimit(request: NextRequest, now = Date.now()) {
  const store = getStore();
  const key = getRequestKey(request);
  const bucket = store.get(key) ?? { hits: [] };
  const recentHits = bucket.hits.filter((timestamp) => timestamp > now - RATE_LIMIT_WINDOW_MS);

  if (recentHits.length >= ADAPTIVE_TEACHER_REQUEST_LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((recentHits[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return {
      allowed: false,
      limit: ADAPTIVE_TEACHER_REQUEST_LIMIT,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  recentHits.push(now);
  store.set(key, { hits: recentHits });
  pruneStore(store, now);

  return {
    allowed: true,
    limit: ADAPTIVE_TEACHER_REQUEST_LIMIT,
    remaining: ADAPTIVE_TEACHER_REQUEST_LIMIT - recentHits.length,
    retryAfterSeconds: 0,
  };
}
