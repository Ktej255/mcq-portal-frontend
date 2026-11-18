import { NextRequest, NextResponse } from "next/server";

import { generateGeminiText, geminiApiKey } from "@/lib/ai/gemini";
import { clampText, guardOptionalAiRequest } from "@/lib/auth/optional-ai-guard";

export const runtime = "nodejs";

// Real AI evaluation seam. Activates when a Gemini key is set in env
// (GEMINI_API_KEY). Until then it returns
// { ok: false } and the client falls back to the deterministic heuristic.
export async function POST(req: NextRequest) {
  const denied = await guardOptionalAiRequest(req);
  if (denied) return denied;

  if (!geminiApiKey()) return NextResponse.json({ ok: false, reason: "no-key" });

  let body: { question?: string; answer?: string; parameters?: string[]; subject?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }

  const question = clampText(body?.question);
  const answer = clampText(body?.answer);
  const subject = clampText(body?.subject);
  const parameters = (Array.isArray(body?.parameters) ? body.parameters : []).slice(0, 12).map(clampText);
  const prompt =
    `You are a strict UPSC ${subject} optional examiner. Evaluate the student's answer to the question. ` +
    `Score each parameter from 0-10 and give one specific, actionable feedback line per parameter. ` +
    `Parameters: ${parameters.join("; ")}. ` +
    `Return ONLY JSON of the form {"overall":<0-100>,"verdict":"<one line>","params":[{"label":"<param>","score":<0-10>,"feedback":"<line>"}]}. ` +
    `QUESTION: ${question}\nANSWER: ${answer}`;

  const text = await generateGeminiText([{ text: prompt }], {
    temperature: 0.3,
    responseMimeType: "application/json",
  });
  if (!text) return NextResponse.json({ ok: false, reason: "ai-error" });

  try {
    return NextResponse.json({ ok: true, result: JSON.parse(text) });
  } catch {
    return NextResponse.json({ ok: false, reason: "ai-error" });
  }
}
