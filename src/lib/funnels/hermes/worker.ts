import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { FunnelHermesOutput } from "./types";

export function getMockFunnelHermesOutput(inputData: any): FunnelHermesOutput {
  const name = inputData.product_name || "My UPSC Product";
  const goal = inputData.funnel_goal || "Collect leads";
  const offer = inputData.core_offer || "Free resources";
  const price = inputData.price_point || "Free";
  const tone = inputData.tone || "Professional";

  return {
    research_summary: {
      buzzwords: ["upsc matrix", "syllabus shortcut", "active recall", "cutoff precision", "revision loops"],
      top_objections: ["Is this guide up-to-date with 2026 changes?", "How much daily commitment does this require?", "Can I use this alongside standard coachings?"],
      proof_types: ["past year selection charts", "active candidate logs", "expert study planner reviews"],
      market_insight: `Strong demand for structured guidance on ${name}. Students convert best when offered visual worksheets.`
    },
    funnel_structure: {
      recommended_type: "optin",
      step_count: 2,
      steps: [
        {
          step_order: 0,
          step_type: "optin",
          title: "Opt-in Page",
          headline: `Get the Free Blueprint to Master ${name}`,
          subheadline: `The exact conceptual guide used by working professionals to score above the cutoff.`,
          body_copy: `Enter your details to receive the free syllabus matrix, map guidelines, and cheat sheets instantly.`,
          cta_text: `Download the Free Kit Now`,
          form_fields: ["email", "name"]
        },
        {
          step_order: 1,
          step_type: "thankyou",
          title: "Thank You Page",
          headline: `Check Your Email to Get the ${name} Kit`,
          subheadline: `We've sent the download link to your email address.`,
          body_copy: `In the meantime, join our live student community workspace to meet other serious aspirants.`,
          cta_text: `Join the Community`
        }
      ]
    },
    page_copy: {
      headline: `Download the Free Blueprint to Master ${name}`,
      subheadline: `The exact conceptual guide used by working professionals to score above the cutoff.`,
      cta_variants: [`Claim Your Free Copy`, `Get Instant PDF Link`, `Download Blueprint Kit`]
    },
    followup_sequences: {
      email: [
        { subject: `Your Free ${name} Blueprint Inside`, body: `Here is the link to download your free guide. Let me know if you have any questions!`, send_after_hours: 1 },
        { subject: `Mistake #1 when studying ${name}`, body: `Most students waste weeks reading standard text guides. Here is the active recall shortcut instead.`, send_after_hours: 24 },
        { subject: `How to handle UPSC exceptions`, body: `UPSC frequently sets traps based on exception cases. Here is the cheat sheet to avoid them.`, send_after_hours: 72 },
        { subject: `How our students cracked the cutoff`, body: `Check these score matrices showing how students improved their scores in 30 days.`, send_after_hours: 168 },
        { subject: `Final call for live strategy workshop`, body: `Our onboarding webinar starts tomorrow. Save your seat.`, send_after_hours: 336 }
      ],
      whatsapp: [
        { message: `Hi, thank you for downloading our UPSC blueprint! Did you get the PDF copy?`, send_after_hours: 2 },
        { message: `Quick tip: check out section 3 of the worksheet for map exceptions.`, send_after_hours: 48 },
        { message: `Friendly reminder: our live strategy workshop starts tomorrow.`, send_after_hours: 120 }
      ],
      sms: [
        { message: `Your UPSC study blueprint is waiting for you. Access the download link here.`, send_after_hours: 1 },
        { message: `UPSC Exceptions guide: avoid standard statement traps. Details here.`, send_after_hours: 24 },
        { message: `Final 24 hours to register for the live strategy workshop!`, send_after_hours: 96 }
      ]
    },
    template_recommendation: {
      template_name: "UPSC Coaching Opt-in",
      reason: `Matches the target audience of UPSC aspirants seeking structured guidance.`
    }
  };
}

function tryParseJsonObject(value: string): any | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseProviderJsonObject(value: string): any | null {
  const direct = tryParseJsonObject(value);
  if (direct) return direct;

  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const parsedFence = tryParseJsonObject(fenced[1].trim());
    if (parsedFence) return parsedFence;
  }

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return tryParseJsonObject(value.slice(firstBrace, lastBrace + 1));
  }

  return null;
}

export async function runFunnelHermesJob(jobId: string): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error("FUNNEL_HERMES_WORKER | Database client not available");
    return;
  }

  try {
    // 1. Fetch hermes_jobs entry
    const { data: job, error: fetchError } = await client
      .from("hermes_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      throw new Error(`Failed to fetch job row: ${fetchError?.message}`);
    }

    // 2. Update status to processing
    await client
      .from("hermes_jobs")
      .update({ status: "processing" })
      .eq("id", jobId);

    // 3. Setup LLM Call params
    const apiKey = process.env.NVIDIA_CHAT_API_KEY?.trim() || process.env.NVIDIA_TEACHER_API_KEY?.trim() || process.env.NVIDIA_API_KEY?.trim() || "";
    const model = process.env.NVIDIA_CHAT_MODEL?.trim() || "deepseek-ai/deepseek-v4-flash";
    const baseUrl = process.env.NVIDIA_API_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1";

    if (!apiKey) {
      console.warn("FUNNEL_HERMES_WORKER | API key not configured, running mock generator fallback");
      const mockOutput = getMockFunnelHermesOutput(job.input_data);
      await client
        .from("hermes_jobs")
        .update({
          status: "completed",
          output_data: mockOutput,
          completed_at: new Date().toISOString()
        })
        .eq("id", jobId);
      return;
    }

    const systemPrompt = `You are an expert digital marketing strategist and funnel architect with 20 years of experience building high-converting sales funnels.
Generate a complete funnel blueprint. Return ONLY a valid JSON object with this exact structure, no markdown, no preamble:
{
  "research_summary": {
    "buzzwords": ["5 strings relevant to this niche right now"],
    "top_objections": ["3 strings — why people hesitate"],
    "proof_types": ["3 strings — what builds trust in this market"],
    "market_insight": "string — 2-3 sentences on current market"
  },
  "funnel_structure": {
    "recommended_type": "string — one of: optin/sales/webinar/application/challenge/lead_magnet",
    "step_count": number,
    "steps": [
      {
        "step_order": 0,
        "step_type": "string — one of: optin/sales/video/thankyou/upsell/downsell/bridge/webinar_reg/application/countdown",
        "title": "internal name for this step",
        "headline": "main heading shown to visitor",
        "subheadline": "supporting line",
        "body_copy": "main persuasion copy for this step",
        "cta_text": "button text",
        "form_fields": ["field1","field2"]
      }
    ]
  },
  "page_copy": {
    "headline": "overall funnel headline",
    "subheadline": "string",
    "cta_variants": ["3 strings"]
  },
  "followup_sequences": {
    "email": [
      {"subject":"","body":"","send_after_hours":1},
      {"subject":"","body":"","send_after_hours":24},
      {"subject":"","body":"","send_after_hours":72},
      {"subject":"","body":"","send_after_hours":168},
      {"subject":"","body":"","send_after_hours":336}
    ],
    "whatsapp": [
      {"message":"","send_after_hours":2},
      {"message":"","send_after_hours":48},
      {"message":"","send_after_hours":120}
    ],
    "sms": [
      {"message":"","send_after_hours":1},
      {"message":"","send_after_hours":24},
      {"message":"","send_after_hours":96}
    ]
  },
  "template_recommendation": {
    "template_name": "string — name of best matching template",
    "reason": "string — one sentence why this template fits"
  }
}`;

    const prompt = `USER GOAL AND PRODUCT DETAILS:
${JSON.stringify(job.input_data)}`;

    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 4096,
        stream: false,
      }),
      signal: AbortSignal.timeout(45000), // 45 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`LLM provider returned status ${response.status}: ${await response.text()}`);
    }

    const resBody = await response.json();
    const rawText = resBody.choices?.[0]?.message?.content?.trim() || "";
    const parsedOutput = parseProviderJsonObject(rawText);

    if (!parsedOutput || !parsedOutput.funnel_structure || !parsedOutput.page_copy) {
      throw new Error("Failed to parse valid Funnel blueprint JSON from LLM response");
    }

    // 4. Update status to completed with parsed output
    await client
      .from("hermes_jobs")
      .update({
        status: "completed",
        output_data: parsedOutput,
        completed_at: new Date().toISOString()
      })
      .eq("id", jobId);

  } catch (err: any) {
    console.error("FUNNEL_HERMES_WORKER | Error running job:", err);
    await client
      .from("hermes_jobs")
      .update({
        status: "failed",
        error_message: err.message || String(err)
      })
      .eq("id", jobId);
  }
}
