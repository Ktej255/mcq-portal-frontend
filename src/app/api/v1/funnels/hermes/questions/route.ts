import { NextResponse } from "next/server";
import { FUNNEL_QUESTIONNAIRE } from "@/lib/funnels/hermes/questions";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET() {
  return noStoreJson({ questions: FUNNEL_QUESTIONNAIRE });
}
