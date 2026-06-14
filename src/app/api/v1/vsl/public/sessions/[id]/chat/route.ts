import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await props.params;
  const client = getSupabaseAdminClient();
  if (!client) {
    return noStoreJson({ message: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return noStoreJson({ message: "message string is required" }, { status: 400 });
    }

    // 1. Fetch session and nested funnel/workspace data
    const { data: session, error: sessionError } = await client
      .from("vsl_sessions")
      .select(`
        id,
        ai_conversation_log,
        funnel_id,
        vsl_funnels (
          id,
          video_transcript,
          questionnaire_answers,
          workspace_id,
          workspaces (
            name
          )
        )
      `)
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return noStoreJson({ message: "Session not found" }, { status: 404 });
    }

    const sessionData = session as any;
    const funnel = sessionData.vsl_funnels;
    const workspaceName = funnel?.workspaces?.name || "our campus";
    const transcript = funnel?.video_transcript || "No transcript available.";
    const answers = funnel?.questionnaire_answers || {};

    const productName = answers.product_name || "our program";
    const targetCustomer = answers.target_customer || "UPSC aspirants";
    const mainProblem = answers.main_problem || "conceptual clarity";
    const pricePoint = answers.price_point || "standard pricing";
    const ctaType = answers.cta_type || "Book a free call";

    // 2. Build system prompt
    const systemPrompt = `You are a warm, helpful sales assistant for ${workspaceName}.
The visitor just watched a video about ${productName}.

VIDEO TRANSCRIPT:
${transcript}

PRODUCT CONTEXT:
Product: ${productName}
Ideal customer: ${targetCustomer}
Problem solved: ${mainProblem}
Price: ${pricePoint}
Desired action: ${ctaType}

CONVERSATION RULES:
- Be genuinely curious, not pushy
- Address objections using content from the transcript
- If they show buying intent, surface the CTA naturally
- If no email captured yet, find a natural moment to ask
- Keep responses under 3 sentences unless they ask for detail
- Do not mention you are an AI unless directly asked
- Do not fabricate anything not in the transcript

At the END of every response, append this exact JSON on a new line:
STRUCTURED:{"did_capture_intent":boolean,"primary_objection":"string or null","suggest_cta":boolean}`;

    // 3. Extract prior messages
    const conversationLog = Array.isArray(sessionData.ai_conversation_log)
      ? sessionData.ai_conversation_log
      : [];

    const historyMessages = conversationLog.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    }));

    // 4. API keys & Base url
    const apiKey = process.env.NVIDIA_CHAT_API_KEY?.trim() || process.env.NVIDIA_TEACHER_API_KEY?.trim() || process.env.NVIDIA_API_KEY?.trim() || "";
    const model = process.env.NVIDIA_CHAT_MODEL?.trim() || "deepseek-ai/deepseek-v4-flash";
    const baseUrl = process.env.NVIDIA_API_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1";

    let rawAiResponse = "";

    if (!apiKey) {
      // Mock AI chatbot response logic
      const text = message.toLowerCase();
      if (text.includes("@") || text.includes("email") || text.includes("contact")) {
        rawAiResponse = `Thanks for sharing that email. I've updated your details. We will send over the initial syllabus blueprints and UPSC preparation checklists right away!\n\nSTRUCTURED:{"did_capture_intent":true,"primary_objection":null,"suggest_cta":true}`;
      } else if (text.includes("price") || text.includes("cost") || text.includes("fee") || text.includes("rupee") || text.includes("pay")) {
        rawAiResponse = `The investment for the program is ${pricePoint}. It is designed specifically to cover all critical exceptions and save you study hours. Would you like to check out the details?\n\nSTRUCTURED:{"did_capture_intent":false,"primary_objection":"pricing inquiry","suggest_cta":true}`;
      } else if (text.includes("yes") || text.includes("want") || text.includes("show") || text.includes("buy") || text.includes("interested")) {
        rawAiResponse = `Great! You can proceed directly using the link below. It takes less than 2 minutes to secure your slot.\n\nSTRUCTURED:{"did_capture_intent":true,"primary_objection":null,"suggest_cta":true}`;
      } else {
        rawAiResponse = `That makes complete sense. Many student aspirants preparing for ${targetCustomer} ask about that. What is your primary blocker right now?\n\nSTRUCTURED:{"did_capture_intent":false,"primary_objection":null,"suggest_cta":false}`;
      }
    } else {
      // Run active LLM pipeline
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
            ...historyMessages,
            { role: "user", content: message }
          ],
          temperature: 0.5,
          max_tokens: 1024,
          stream: false
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (response.ok) {
        const resJson = await response.json();
        rawAiResponse = resJson.choices?.[0]?.message?.content?.trim() || "";
      } else {
        throw new Error(`Chat API error: ${response.statusText}`);
      }
    }

    // 5. Split raw response into message and structured JSON
    const parts = rawAiResponse.split("STRUCTURED:");
    const cleanMessage = parts[0].trim();
    let structured = { did_capture_intent: false, primary_objection: null as string | null, suggest_cta: false };

    if (parts[1]) {
      try {
        structured = JSON.parse(parts[1].trim());
      } catch (err) {
        console.warn("CHAT_API | Failed to parse structured JSON block:", parts[1], err);
      }
    }

    // 6. Update session logs
    const updatedLog = [
      ...conversationLog,
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: cleanMessage, timestamp: new Date().toISOString() }
    ];

    const { error: updateError } = await client
      .from("vsl_sessions")
      .update({
        ai_conversation_log: updatedLog,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    if (updateError) {
      return noStoreJson({ message: `Failed to save chat log: ${updateError.message}` }, { status: 500 });
    }

    return noStoreJson({
      message: cleanMessage,
      structured
    });

  } catch (error) {
    return noStoreJson({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
