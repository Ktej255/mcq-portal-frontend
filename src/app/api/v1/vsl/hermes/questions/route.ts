import { NextRequest, NextResponse } from "next/server";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/vsl/hermes/questions";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  return noStoreJson({ questions: QUESTIONNAIRE_QUESTIONS });
}
