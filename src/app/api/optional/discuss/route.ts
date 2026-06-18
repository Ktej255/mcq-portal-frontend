import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Discussion mentor seam. Uses Gemini when a key is configured; otherwise the
// client service shows a structured fallback message.
export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, reason: "no-key" });

  let body: { subject?: string; context?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }

  const { subject = "", context = "", message = "" } = body ?? {};
  const prompt =
    `You are a supportive but rigorous UPSC ${subject} optional mentor. ` +
    `Context the student is working on: ${context}. ` +
    `Student's message: ${message}. ` +
    `Reply in under 120 words with specific, actionable guidance (structure, content, diagrams, examples).`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5 } }),
      },
    );
    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ ok: true, reply });
  } catch {
    return NextResponse.json({ ok: false, reason: "ai-error" });
  }
}
