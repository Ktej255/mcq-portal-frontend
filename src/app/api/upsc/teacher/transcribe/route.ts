import { NextRequest, NextResponse } from "next/server";

import { hasLearnerApiAccess } from "@/lib/auth/learner-api-access";

export const dynamic = "force-dynamic";

const sttBaseUrl = process.env.NVIDIA_STT_API_BASE_URL?.trim() || process.env.NVIDIA_API_BASE_URL?.trim() || "";
const sttApiKey =
  process.env.NVIDIA_STT_API_KEY?.trim() ||
  process.env.STT_API_KEY?.trim() ||
  "";
const sttModel = process.env.NVIDIA_STT_MODEL?.trim() || process.env.STT_MODEL?.trim() || "";
const maxAudioBytes = Number(process.env.UPSC_STT_MAX_AUDIO_BYTES ?? 8_000_000);

function getTranscriptionStatus() {
  const configured = Boolean(sttBaseUrl && sttApiKey && sttModel);
  return {
    configured,
    maxAudioBytes: Number.isFinite(maxAudioBytes) ? maxAudioBytes : 8_000_000,
    missing: {
      baseUrl: !sttBaseUrl,
      apiKey: !sttApiKey,
      model: !sttModel,
    },
    message: configured
      ? "Server transcription is configured. Record a short answer to verify the provider response."
      : "Server transcription backend is optional for this build. Browser live speech, typed answers, and audio-note fallback are the current production path; Whisper/whisper.cpp can be added later on a separate backend.",
  };
}

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function readTranscript(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const body = value as {
    text?: unknown;
    transcript?: unknown;
    transcription?: unknown;
    results?: Array<{ transcript?: unknown; text?: unknown }>;
  };

  const direct =
    (typeof body.text === "string" && body.text) ||
    (typeof body.transcript === "string" && body.transcript) ||
    (typeof body.transcription === "string" && body.transcription) ||
    "";
  if (direct.trim()) return direct.trim();

  return (
    body.results
      ?.map((result) =>
        typeof result.transcript === "string"
          ? result.transcript
          : typeof result.text === "string"
            ? result.text
            : ""
      )
      .join(" ")
      .trim() ?? ""
  );
}

export async function GET(request: NextRequest) {
  if (!(await hasLearnerApiAccess(request))) {
    return noStoreJson({ message: "Learner access required" }, { status: 403 });
  }

  return noStoreJson(getTranscriptionStatus());
}

export async function POST(request: NextRequest) {
  if (!(await hasLearnerApiAccess(request))) {
    return noStoreJson({ message: "Learner access required" }, { status: 403 });
  }

  const status = getTranscriptionStatus();
  if (!status.configured) {
    return noStoreJson(
      {
        message:
          "Optional server transcription is not configured. Use browser live speech or the audio-note fallback now; add a Whisper/whisper.cpp or provider STT backend later to auto-transcribe recorded notes.",
        transcriptionAvailable: false,
      },
      { status: 503 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const audio = formData?.get("audio");
  if (!(audio instanceof File)) {
    return noStoreJson({ message: "Audio file required" }, { status: 400 });
  }

  if (audio.size <= 0 || audio.size > maxAudioBytes) {
    return noStoreJson(
      { message: `Audio file must be between 1 byte and ${maxAudioBytes} bytes` },
      { status: 413 }
    );
  }

  const providerForm = new FormData();
  providerForm.append("model", sttModel);
  providerForm.append("file", audio, audio.name || "answer.webm");

  try {
    const response = await fetch(`${sttBaseUrl.replace(/\/+$/, "")}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sttApiKey}`,
      },
      body: providerForm,
      signal: AbortSignal.timeout(25_000),
    });

    const providerBody = await response.json().catch(() => null);
    const transcript = readTranscript(providerBody);
    if (!response.ok || !transcript) {
      return noStoreJson(
        {
          message: `Speech transcription provider failed with ${response.status}.`,
          transcriptionAvailable: true,
        },
        { status: 502 }
      );
    }

    return noStoreJson({
      transcript,
      mode: "server-stt",
    });
  } catch {
    return noStoreJson(
      {
        message: "Speech transcription provider did not respond in time.",
        transcriptionAvailable: true,
      },
      { status: 504 }
    );
  }
}
