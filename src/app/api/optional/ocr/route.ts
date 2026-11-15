import { NextRequest, NextResponse } from "next/server";

import { generateGeminiText, geminiApiKey } from "@/lib/ai/gemini";
import { guardOptionalAiRequest, OPTIONAL_AI_MAX_IMAGE_BASE64_CHARS } from "@/lib/auth/optional-ai-guard";

export const runtime = "nodejs";

// OCR seam for uploaded handwritten answer copies. Uses Gemini vision when a
// key is configured to digitise the image to text; otherwise returns ok:false
// and the client shows "OCR pending".
export async function POST(req: NextRequest) {
  const denied = await guardOptionalAiRequest(req);
  if (denied) return denied;

  if (!geminiApiKey()) return NextResponse.json({ ok: false, reason: "no-key" });

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }
  const { imageBase64 = "", mimeType = "image/jpeg" } = body ?? {};
  if (!imageBase64) return NextResponse.json({ ok: false, reason: "no-image" });
  if (imageBase64.length > OPTIONAL_AI_MAX_IMAGE_BASE64_CHARS) {
    return NextResponse.json({ ok: false, reason: "too-large" }, { status: 413 });
  }

  const text = await generateGeminiText([
    { text: "Transcribe this handwritten UPSC answer copy to plain text. Return only the transcription." },
    { inlineData: { mimeType, data: imageBase64 } },
  ]);
  if (!text) return NextResponse.json({ ok: false, reason: "ocr-error" });
  return NextResponse.json({ ok: true, text });
}
