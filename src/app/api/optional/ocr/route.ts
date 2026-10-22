import { NextRequest, NextResponse } from "next/server";

import { guardOptionalAiRequest, OPTIONAL_AI_MAX_IMAGE_BASE64_CHARS } from "@/lib/auth/optional-ai-guard";

export const runtime = "nodejs";

// OCR seam for uploaded handwritten answer copies. Uses Gemini vision when a
// key is configured to digitise the image to text; otherwise returns ok:false
// and the client shows "OCR pending".
export async function POST(req: NextRequest) {
  const denied = await guardOptionalAiRequest(req);
  if (denied) return denied;

  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, reason: "no-key" });

  let body: { imageBase64?: unknown; mimeType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }
  const { imageBase64 = "", mimeType = "image/jpeg" } = body ?? {};
  if (typeof imageBase64 !== "string" || typeof mimeType !== "string" || !mimeType.startsWith("image/")) {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }
  if (!imageBase64) return NextResponse.json({ ok: false, reason: "no-image" });
  if (imageBase64.length > OPTIONAL_AI_MAX_IMAGE_BASE64_CHARS) {
    return NextResponse.json({ ok: false, reason: "too-large" }, { status: 413 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL_ID || "gemini-2.5-flash"}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Transcribe this handwritten UPSC answer copy to plain text. Return only the transcription." },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          }],
        }),
      },
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ ok: Boolean(text), text });
  } catch {
    return NextResponse.json({ ok: false, reason: "ocr-error" });
  }
}
