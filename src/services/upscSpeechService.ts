import { activeAuthProvider } from "@/env";
import { readLearnerApiAccessToken } from "@/services/upscTeacherService";

export type UpscSpeechTranscriptionResult = {
  transcript: string;
  mode: "server-stt";
};

export type UpscSpeechTranscriptionStatus = {
  configured: boolean;
  message: string;
  maxAudioBytes?: number;
  missing?: {
    baseUrl?: boolean;
    apiKey?: boolean;
    model?: boolean;
  };
};

export async function requestUpscSpeechTranscriptionStatus(): Promise<UpscSpeechTranscriptionStatus> {
  const token = await readLearnerApiAccessToken();
  if (!token && activeAuthProvider !== "clerk") throw new Error("Learner session required");

  const response = await fetch("/api/upsc/teacher/transcribe", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || typeof body?.configured !== "boolean") {
    throw new Error(typeof body?.message === "string" ? body.message : "Speech transcription status failed");
  }

  return {
    configured: body.configured,
    message: typeof body.message === "string" ? body.message : "",
    maxAudioBytes: typeof body.maxAudioBytes === "number" ? body.maxAudioBytes : undefined,
    missing: typeof body.missing === "object" && body.missing ? body.missing : undefined,
  };
}

export async function requestUpscSpeechTranscription(audio: Blob): Promise<UpscSpeechTranscriptionResult> {
  const token = await readLearnerApiAccessToken();
  if (!token && activeAuthProvider !== "clerk") throw new Error("Learner session required");

  const formData = new FormData();
  const extension = audio.type.includes("mp4") ? "m4a" : "webm";
  formData.append("audio", audio, `answer.${extension}`);

  const response = await fetch("/api/upsc/teacher/transcribe", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || typeof body?.transcript !== "string") {
    throw new Error(typeof body?.message === "string" ? body.message : "Speech transcription failed");
  }

  return {
    transcript: body.transcript.trim(),
    mode: "server-stt",
  };
}
