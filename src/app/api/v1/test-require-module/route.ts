import { NextRequest, NextResponse } from "next/server";
import { requireModule } from "@/lib/auth/requireModule";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const result = await requireModule(request, "vsl");
  if (!result.success) {
    return noStoreJson(
      { message: result.error, code: result.code },
      { status: result.status }
    );
  }

  return noStoreJson({
    message: "Access granted",
    workspace: result.workspace,
    userId: result.userId,
  });
}
