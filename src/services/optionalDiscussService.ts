// Discussion mentor client service. Tries the live AI route; falls back to a
// structured, useful message when no AI key is configured yet.
export async function askOptionalDoubt(input: { subject: string; context: string; message: string }): Promise<{ reply: string; live: boolean }> {
  try {
    const res = await fetch("/api/optional/discuss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (data?.ok && data.reply) return { reply: String(data.reply), live: true };
  } catch {
    /* fall through to offline guidance */
  }
  return {
    reply:
      "Structure it as: (1) define the core term and set context, (2) give the mechanism/cause-effect, (3) add an example plus a labelled diagram or map, (4) close with a balanced way-forward. Tie at least one point to a recent development. — Live AI discussion turns on once the Gemini key is configured.",
    live: false,
  };
}
