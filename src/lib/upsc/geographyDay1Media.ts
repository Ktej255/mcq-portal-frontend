import { env } from "@/env";

export type GeographyDay1MediaStatus = "portal-native-fallback" | "approved-recording";

function normalizePublicAssetUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if ((trimmed.startsWith("/") && !trimmed.startsWith("//")) || trimmed.startsWith("https://")) return trimmed;
  return null;
}

const mediaUrl = normalizePublicAssetUrl(env.NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_URL);
const transcriptUrl = normalizePublicAssetUrl(env.NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_TRANSCRIPT_URL);
const recordingApproved = env.NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_APPROVED === "true";
const approvedRecordingAttached = recordingApproved && Boolean(mediaUrl);
const approvedTranscriptAttached = Boolean(transcriptUrl);
const releaseAssetPairReady = approvedRecordingAttached && approvedTranscriptAttached;

export const geographyDay1MediaAttachment = {
  status: releaseAssetPairReady ? "approved-recording" : "portal-native-fallback",
  mediaUrl,
  transcriptUrl,
  mediaLabel:
    env.NEXT_PUBLIC_UPSC_GEOGRAPHY_DAY1_MEDIA_LABEL?.trim() ||
    "Founder-approved Geography Day 1 lecture",
  recordingApproved,
  approvedRecordingAttached,
  approvedTranscriptAttached,
  releaseAssetPairReady,
  operatorNote: releaseAssetPairReady
    ? "Approved Day 1 recording and transcript are attached. Run the controlled learner rehearsal before changing the release gate."
    : approvedRecordingAttached
      ? "Approved Day 1 recording is staged, but the transcript is still missing. Students remain on the verified portal-native fallback."
      : approvedTranscriptAttached
        ? "The Day 1 transcript is staged, but the approved recording is still missing. Students remain on the verified portal-native fallback."
        : "No approved Day 1 recording is attached. Students continue to receive the verified portal-native 12-minute lesson fallback.",
} as const satisfies {
  status: GeographyDay1MediaStatus;
  mediaUrl: string | null;
  transcriptUrl: string | null;
  mediaLabel: string;
  recordingApproved: boolean;
  approvedRecordingAttached: boolean;
  approvedTranscriptAttached: boolean;
  releaseAssetPairReady: boolean;
  operatorNote: string;
};
