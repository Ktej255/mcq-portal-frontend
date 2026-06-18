import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Real AI evaluation seam. Activates when a Gemini key is set in env
// (GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY). Until then it returns
// { ok: false } and the client falls back to the deterministic heuristic.
export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, reason: "no-key" });

  let body: { question?: string; answer?: string; parameters?: string[]; subject?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }

  const { question = "", answer = "", parameters = [], subject = "" } = body ?? {};
  const prompt =
    `You are a strict UPSC ${subject} optional examiner. Evaluate the student's answer to the question. ` +
    `Score each parameter from 0-10 and give one specific, actionable feedback line per parameter. ` +
    `Parameters: ${parameters.join("; ")}. ` +
    `Return ONLY JSON of the form {"overall":<0-100>,"verdict":"<one line>","params":[{"label":"<param>","score":<0-10>,"feedback":"<line>"}]}. ` +
    `QUESTION: ${question}\nANSWER: ${answer}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
        }),
      },
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = JSON.parse(text);
    return NextResponse.json({ ok: true, result: parsed });
  } catch {
    return NextResponse.json({ ok: false, reason: "ai-error" });
  }
}
