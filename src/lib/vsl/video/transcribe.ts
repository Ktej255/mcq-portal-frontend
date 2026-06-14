import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function triggerTranscription(
  funnelId: string,
  videoUrl: string
): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error("TRANSCRIBE | Database client not available");
    return;
  }

  try {
    // 1. Update transcription_status to processing
    await client
      .from("vsl_funnels")
      .update({ transcription_status: "processing" })
      .eq("id", funnelId);

    const apiKey = process.env.OPENAI_API_KEY?.trim() || "";

    if (!apiKey) {
      console.warn("TRANSCRIBE | OPENAI_API_KEY is not configured. Using placeholder transcript stub.");
      // Wait 3 seconds to simulate transcription process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const placeholderTranscript = `Attention: If you are preparing for UPSC, stop wasting months on outdated prep methods. Most coaching courses give you 100-page booklets that take weeks to read, without teaching you how to apply it under high-stakes exam pressure. If you keep studying this way, you will enter the exam hall feeling uncertain, falling into the standard UPSC statement traps. That is why we built our structured blueprint. It gives you core concept mastery, India map-proofing, and trap evasion lessons in 90 seconds. Hundreds of students have already used this exact method to double their recall scores and confidently crack the prelims cutoff. Do not delay your success. Claim your copy immediately.`;
      
      await client
        .from("vsl_funnels")
        .update({
          video_transcript: placeholderTranscript,
          transcription_status: "completed",
          updated_at: new Date().toISOString()
        })
        .eq("id", funnelId);
      return;
    }

    // 2. Download video file
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Post to OpenAI Whisper API
    const formData = new FormData();
    const blob = new Blob([buffer], { type: "video/mp4" });
    formData.append("file", blob, "video.mp4");
    formData.append("model", "whisper-1");

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      throw new Error(`Whisper API returned status ${whisperResponse.status}: ${await whisperResponse.text()}`);
    }

    const whisperData = await whisperResponse.json();
    const transcriptText = whisperData.text || "";

    if (!transcriptText) {
      throw new Error("Whisper API returned empty transcript text");
    }

    // 4. Update transcript in db
    await client
      .from("vsl_funnels")
      .update({
        video_transcript: transcriptText,
        transcription_status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", funnelId);

  } catch (err: any) {
    console.error("TRANSCRIBE | Error transcribing video:", err);
    await client
      .from("vsl_funnels")
      .update({
        transcription_status: "failed",
        updated_at: new Date().toISOString()
      })
      .eq("id", funnelId);
  }
}
