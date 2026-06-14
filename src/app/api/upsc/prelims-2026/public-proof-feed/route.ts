import { NextRequest, NextResponse } from "next/server";

import { hasInternalApiAccess } from "@/lib/auth/internal-api-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildEmptyPrelims2026PublicProofFeed,
  parsePrelims2026PublicProofFeed,
  type Prelims2026PublicProofFeed,
} from "@/lib/upsc/prelims2026PublicProofFeed";

export const dynamic = "force-dynamic";

const TABLE = "upsc_prelims_2026_public_proof_feed";
const LATEST_ID = "latest";
const MAX_FEED_REQUEST_BYTES = 1_200_000;

type PublicProofFeedRow = {
  id: string;
  feed: Prelims2026PublicProofFeed;
  claim_count: number;
  published_at: string;
  updated_at: string;
};

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function localOnlyPayload(message = "Supabase persistence is not configured. Public proof feed remains browser-local.") {
  return {
    mode: "local-only",
    table: TABLE,
    feed: buildEmptyPrelims2026PublicProofFeed(),
    claimCount: 0,
    publishedAt: null,
    message,
  };
}

function unavailablePayload(message: string) {
  return {
    mode: "unavailable",
    table: TABLE,
    feed: buildEmptyPrelims2026PublicProofFeed(),
    claimCount: 0,
    publishedAt: null,
    message,
  };
}

function apiPayload(mode: "supabase" | "local-only" | "dry-run", feed: Prelims2026PublicProofFeed, message: string) {
  return {
    mode,
    table: TABLE,
    feed,
    claimCount: feed.releasedClaims.length,
    publishedAt: feed.lastUpdatedAt === "local-draft" ? null : feed.lastUpdatedAt,
    message,
  };
}

async function readBoundedJsonBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FEED_REQUEST_BYTES) {
    return { status: "too-large" as const };
  }

  const rawBody = await request.text().catch(() => null);
  if (rawBody === null) return { status: "invalid" as const };
  if (new TextEncoder().encode(rawBody).byteLength > MAX_FEED_REQUEST_BYTES) {
    return { status: "too-large" as const };
  }

  try {
    return { status: "ready" as const, body: JSON.parse(rawBody) as unknown };
  } catch {
    return { status: "invalid" as const };
  }
}

async function readLatestFeed() {
  const client = getSupabaseAdminClient();
  if (!client) return localOnlyPayload();

  try {
    const { data, error } = await client
      .from(TABLE)
      .select("feed, claim_count, published_at")
      .eq("id", LATEST_ID)
      .maybeSingle();

    if (error) {
      return unavailablePayload(`Supabase public proof feed table is not ready: ${error.message}`);
    }

    const row = data as Partial<PublicProofFeedRow> | null;
    const feed = parsePrelims2026PublicProofFeed(row?.feed);
    if (!feed) {
      return apiPayload("supabase", buildEmptyPrelims2026PublicProofFeed(), "No public proof feed has been published yet.");
    }

    return {
      mode: "supabase",
      table: TABLE,
      feed,
      claimCount: Number(row?.claim_count ?? feed.releasedClaims.length),
      publishedAt: row?.published_at ?? feed.lastUpdatedAt,
      message: "Latest public proof feed is available for the main website.",
    };
  } catch (error) {
    return unavailablePayload(
      error instanceof Error
        ? `Supabase public proof feed read failed: ${error.message}`
        : "Supabase public proof feed read failed."
    );
  }
}

export async function GET() {
  return noStoreJson(await readLatestFeed());
}

export async function POST(request: NextRequest) {
  if (!(await hasInternalApiAccess(request))) {
    return noStoreJson({ message: "Master access required" }, { status: 403 });
  }

  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    return noStoreJson({ message: "JSON public proof feed request required" }, { status: 415 });
  }

  const parsedBody = await readBoundedJsonBody(request);
  if (parsedBody.status === "too-large") {
    return noStoreJson({ message: "Public proof feed request is too large" }, { status: 413 });
  }
  if (parsedBody.status !== "ready") {
    return noStoreJson({ message: "Invalid public proof feed request" }, { status: 400 });
  }

  const body = parsedBody.body as { feed?: unknown };
  const feed = parsePrelims2026PublicProofFeed(body.feed);
  if (!feed) {
    return noStoreJson({ message: "A valid UPSC Prelims 2026 public proof feed is required" }, { status: 400 });
  }

  const dryRun =
    request.nextUrl.searchParams.get("dryRun") === "1" || request.headers.get("x-upsc-proof-feed-dry-run") === "1";
  if (dryRun) {
    return noStoreJson(
      apiPayload(
        "dry-run",
        feed,
        "Dry run accepted. The feed is valid for the API, and no external persistence was attempted."
      )
    );
  }

  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson(
      apiPayload(
        "local-only",
        feed,
        "Supabase persistence is not configured. The feed is valid and ready, but remains browser-local."
      )
    );
  }

  try {
    const publishedAt = new Date().toISOString();
    const { error } = await client.from(TABLE).upsert(
      {
        id: LATEST_ID,
        feed,
        claim_count: feed.releasedClaims.length,
        published_at: publishedAt,
        updated_at: publishedAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      return noStoreJson(unavailablePayload(`Supabase public proof feed table is not ready: ${error.message}`));
    }

    return noStoreJson({
      mode: "supabase",
      table: TABLE,
      feed,
      claimCount: feed.releasedClaims.length,
      publishedAt,
      message: "Public proof feed published for the main website.",
    });
  } catch (error) {
    return noStoreJson(
      unavailablePayload(
        error instanceof Error
          ? `Supabase public proof feed publish failed: ${error.message}`
          : "Supabase public proof feed publish failed."
      )
    );
  }
}
