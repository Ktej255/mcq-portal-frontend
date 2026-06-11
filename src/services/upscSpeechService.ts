import { readLearnerApiAccessToken } from "@/services/upscTeacherService";

export type UpscSpeechTranscriptionResult = {
  transcript: string;
  mode: "server-stt";
};

export async function requestUpscSpeechTranscription(audio: Blob): Promise<UpscSpeechTranscriptionResult> {
  const token = await readLearnerApiAccessToken();
  if (!token) throw new Error("Learner session required");

  const formData = new FormData();
  const extension = audio.type.includes("mp4") ? "m4a" : "webm";
  formData.append("audio", audio, `answer.${extension}`);

  const response = await fetch("/api/upsc/teacher/transcribe", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
