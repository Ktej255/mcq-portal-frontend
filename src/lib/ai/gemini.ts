// Server-only helper for the web app's own Gemini calls. One key name, one
// model setting and one time limit, shared by every route that talks to Gemini.

const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_TIMEOUT_MS = 25_000;

export function geminiApiKey() {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    ""
  );
}

export function geminiModel() {
  // Google retires model names on a schedule, so the name is a setting.
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

/**
 * Ask Gemini for one piece of text. Returns the text, or null when there is no
 * key, the call fails or takes too long, or the reply is empty. The key travels
 * in a header, never in the URL, so it cannot end up in access logs.
 */
export async function generateGeminiText(
  parts: Array<Record<string, unknown>>,
  generationConfig?: Record<string, unknown>,
): Promise<string | null> {
  const key = geminiApiKey();
  if (!key) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel())}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts }], ...(generationConfig ? { generationConfig } : {}) }),
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
    } | null;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}
