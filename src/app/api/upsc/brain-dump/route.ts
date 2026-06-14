import { NextRequest, NextResponse } from "next/server";
import { hasLearnerApiAccess } from "@/lib/auth/learner-api-access";

export const dynamic = "force-dynamic";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TEXT_BYTES = 8_000; // ~2000 chars × 4 bytes max
const MAX_TEXT_LENGTH = 2_000;

const nvidiaBaseUrl =
  (process.env.NVIDIA_API_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
const nvidiaChatApiKey = process.env.NVIDIA_CHAT_API_KEY?.trim() || "";
const nvidiaChatModel = process.env.NVIDIA_CHAT_MODEL?.trim() || "deepseek-ai/deepseek-v4-flash";

// ─── Local stress keyword analysis ───────────────────────────────────────────
// Used as the primary engine when AI is unavailable, and as a scoring anchor
// to prevent AI from wildly misjudging stress level.

const STRESS_KEYWORDS: Record<string, number> = {
  // Critical — weight 10
  "can't take it": 10, "give up": 10, "hopeless": 10, "no point": 10,
  "worthless": 10, "end this": 10, "disappear": 10,
  // High — weight 7
  "exhausted": 7, "breaking down": 7, "overwhelmed": 7, "anxious": 7,
  "panic": 7, "crying": 7, "can't sleep": 7, "numb": 7, "stuck": 7,
  "failing": 7, "mains fail": 7, "prelims fail": 7, "scared": 7, "terrified": 7,
  "alone": 6, "lonely": 6, "nobody cares": 8, "no one understands": 8,
  // Moderate — weight 4
  "stressed": 4, "tired": 4, "pressure": 4, "difficult": 3, "hard": 2,
  "confused": 3, "lost": 4, "behind": 3, "distracted": 3, "unmotivated": 4,
  "bored": 2, "procrastinating": 3, "not studying": 3, "not focused": 3,
  "worried": 4, "nervous": 4, "doubt": 3, "uncertain": 3, "doubt myself": 6,
  // Low signals — weight 1
  "okay": -1, "fine": -1, "good": -1, "happy": -2, "excited": -2, "motivated": -3,
  "confident": -3, "great": -2, "better": -1,
};

function analyzeStressLocally(text: string): { score: number; flags: string[] } {
  const lower = text.toLowerCase();
  let score = 30; // baseline
  const flags: string[] = [];

  for (const [keyword, weight] of Object.entries(STRESS_KEYWORDS)) {
    if (lower.includes(keyword)) {
      score += weight;
      if (weight >= 5) flags.push(keyword);
    }
  }

  // Length heuristic: very short = venting quickly (mild); very long = processing heavily
  if (text.length > 800) score += 6;
  if (text.length > 1200) score += 4;

  // Caps lock signals agitation
  const capsWords = text.split(/\s+/).filter((w) => w.length > 3 && w === w.toUpperCase());
  if (capsWords.length > 3) score += 5;

  // Exclamation marks
  const exclCount = (text.match(/!/g) ?? []).length;
  if (exclCount > 3) score += 4;

  return { score: Math.max(0, Math.min(100, score)), flags };
}

function scoreToLevel(score: number): "low" | "moderate" | "high" | "critical" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "moderate";
  return "low";
}

// ─── Local fallback responses ─────────────────────────────────────────────────

function buildLocalResponse(
  score: number,
  level: "low" | "moderate" | "high" | "critical"
): { message: string; nextAction: string; offerTrial: boolean; trialLabel?: string } {
  switch (level) {
    case "critical":
      return {
        message:
          "Your words carry real weight. What you are feeling right now is valid and recognised. " +
          "This journey is genuinely hard, and acknowledging that takes courage. " +
          "You are not failing — you are human. Please take a full break right now.",
        nextAction:
          "Step away from the screen for at least 20 minutes. Get water, step outside, or call someone you trust. " +
          "Return when your breath is steady. Your preparation will wait.",
        offerTrial: true,
        trialLabel: "Free 1-month Meditation access — auto-unlocked",
      };
    case "high":
      return {
        message:
          "There is noticeable tension in what you shared. That level of pressure is real, and it deserves acknowledgement — not dismissal. " +
          "Many UPSC toppers have written nearly identical words at this exact stage. " +
          "You are not behind where you think you are.",
        nextAction:
          "Try a 5-minute reset: close all tabs, breathe in for 4 counts, hold for 4, out for 6. " +
          "Then open only the one next action — not the full plan.",
        offerTrial: true,
        trialLabel: "Free Meditation trial — 1 month",
      };
    case "moderate":
      return {
        message:
          "Some tension is showing. That is perfectly normal at this stage — most serious aspirants feel exactly this. " +
          "The fact that you are reflecting on it means your metacognition is working well.",
        nextAction:
          "Identify one small, completable task for the next 25 minutes. Do only that. " +
          "A finished small action resets momentum better than planning a large one.",
        offerTrial: false,
      };
    case "low":
    default:
      return {
        message:
          "You seem relatively grounded. This is a good moment. Hold onto this baseline — it will be a useful anchor on tougher days. " +
          "Noting it here helps you recognise when you are not in this state.",
        nextAction:
          "Channel this mental clarity into the one topic or concept you have been avoiding. " +
          "This is your best window for deep work today.",
        offerTrial: false,
      };
  }
}

// ─── AI enrichment ────────────────────────────────────────────────────────────

interface AiEnrichmentResult {
  message: string;
  nextAction: string;
  aiScore: number;
}

async function enrichWithAi(
  text: string,
  localScore: number
): Promise<AiEnrichmentResult | null> {
  if (!nvidiaChatApiKey) return null;

  const systemPrompt = [
    "You are a compassionate wellbeing counsellor embedded inside a UPSC exam preparation platform.",
    "The student has voluntarily shared thoughts in a private Brain Dump space.",
    "Your job: acknowledge their emotion honestly, then give one precise, actionable next step.",
    "Rules:",
    "  - No toxic positivity. No generic platitudes.",
    "  - Never dismiss their pain. Never tell them what they 'should' feel.",
    "  - Keep message to 2–3 sentences max.",
    "  - Keep nextAction to 1 concrete sentence.",
    "  - Return valid JSON only. No markdown, no code fence.",
    `  - Include aiScore: integer 0–100 estimating emotional distress.`,
    `  - Anchor your score near the local estimate of ${localScore} unless text strongly suggests otherwise.`,
    `JSON shape: { "message": string, "nextAction": string, "aiScore": number }`,
  ].join("\n");

  const userPrompt = `Student wrote: """${text.slice(0, 800)}"""`;

  try {
    const res = await fetch(`${nvidiaBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${nvidiaChatApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: nvidiaChatModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        top_p: 0.95,
        max_tokens: 512,
        stream: false,
      }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) return null;

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = body.choices?.[0]?.message?.content?.trim() ?? "";

    // Parse JSON — try direct, then fence-extracted
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fence?.[1]) {
        try { parsed = JSON.parse(fence[1].trim()); } catch { parsed = null; }
      }
      if (!parsed) {
        const ob = raw.indexOf("{");
        const cb = raw.lastIndexOf("}");
        if (ob >= 0 && cb > ob) {
          try { parsed = JSON.parse(raw.slice(ob, cb + 1)); } catch { parsed = null; }
        }
      }
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      "nextAction" in parsed
    ) {
      const p = parsed as { message: unknown; nextAction: unknown; aiScore?: unknown };
      return {
        message: typeof p.message === "string" ? p.message.slice(0, 600) : "",
        nextAction: typeof p.nextAction === "string" ? p.nextAction.slice(0, 300) : "",
        aiScore:
          typeof p.aiScore === "number" && Number.isFinite(p.aiScore)
            ? Math.max(0, Math.min(100, Math.round(p.aiScore)))
            : localScore,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

function noStore(body: object, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(request: NextRequest) {
  // Auth check
  if (!(await hasLearnerApiAccess(request))) {
    return noStore({ message: "Learner access required." }, { status: 403 });
  }

  // Content-type
  const ct = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (ct !== "application/json") {
    return noStore({ message: "JSON body required." }, { status: 415 });
  }

  // Size guard
  const declaredLen = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLen) && declaredLen > MAX_TEXT_BYTES) {
    return noStore({ message: "Text too long." }, { status: 413 });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_TEXT_BYTES) {
      return noStore({ message: "Text too long." }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return noStore({ message: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("text" in body)) {
    return noStore({ message: "Missing text field." }, { status: 400 });
  }

  const text = typeof (body as { text: unknown }).text === "string"
    ? ((body as { text: string }).text).slice(0, MAX_TEXT_LENGTH).trim()
    : "";

  if (text.length < 3) {
    return noStore({ message: "Text too short." }, { status: 400 });
  }

  // ── Local analysis (always runs) ──────────────────────────────────────────
  const { score: localScore, flags } = analyzeStressLocally(text);
  const localFallback = buildLocalResponse(localScore, scoreToLevel(localScore));

  // ── AI enrichment (opportunistic) ────────────────────────────────────────
  const ai = await enrichWithAi(text, localScore);

  // Blend scores: local anchors, AI adjusts ±15 max
  const blendedScore = ai
    ? Math.round(
        Math.max(0, Math.min(100, localScore * 0.6 + ai.aiScore * 0.4))
      )
    : localScore;

  const level = scoreToLevel(blendedScore);

  const response = {
    stressLevel: level,
    stressScore: blendedScore,
    message: ai?.message || localFallback.message,
    nextAction: ai?.nextAction || localFallback.nextAction,
    offerTrial: blendedScore >= 60 || localFallback.offerTrial,
    trialLabel: blendedScore >= 60 ? "Free 1-month Meditation access" : undefined,
    mode: ai ? "ai" : "local",
    // Debug info (not shown in UI but useful for future logging)
    _meta: {
      localScore,
      aiScore: ai?.aiScore ?? null,
      flags,
    },
  };

  return noStore(response);
}
