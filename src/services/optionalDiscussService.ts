import { resolveToken } from "@/lib/auth/token-strategy";

// Discussion mentor client service. Returns a live response only when the
// discussion route/provider succeeds; unavailable states must remain explicit.
export async function askOptionalDoubt(input: { subject: string; context: string; message: string }): Promise<{ reply: string; live: boolean }> {
  try {
    const token = await resolveToken();
    const res = await fetch("/api/optional/discuss", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => null) as { ok?: unknown; reply?: unknown } | null;
    if (res.ok && data?.ok === true && typeof data.reply === "string" && data.reply.trim()) {
      return { reply: data.reply.trim(), live: true };
    }
  } catch {
    /* return an explicit unavailable state below */
  }
  return {
    reply: "Live optional-subject discussion is temporarily unavailable. Please try again shortly.",
    live: false,
  };
}