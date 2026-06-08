export const GEOGRAPHY_DAY1_RELEASE_PACK_RECEIPTS_KEY =
  "sarit-upsc-geography-day1-release-pack-receipts-v1";

export type GeographyDay1ReleasePackReceiptId =
  | "approved-media-pair"
  | "detailed-visual-proof"
  | "fresh-advanced-mcqs"
  | "founder-final-signoff";

export type GeographyDay1ReleasePackReceipt = {
  id: GeographyDay1ReleasePackReceiptId;
  title: string;
  area: string;
  prerequisite: "approved-media-pair" | "fresh-mcq-gate" | "manual-proof";
  proofTarget: string;
  failureRule: string;
};

export type GeographyDay1ReleasePackReceiptState = {
  completedIds: GeographyDay1ReleasePackReceiptId[];
  proofNotes: Record<string, string>;
  reviewerName: string;
  updatedAt: string;
};

export const geographyDay1ReleasePackReceipts: GeographyDay1ReleasePackReceipt[] = [
  {
    id: "approved-media-pair",
    title: "Final lecture and transcript pair is attached",
    area: "Day 1 media",
    prerequisite: "approved-media-pair",
    proofTarget:
      "Approved recording URL, transcript URL, and recording approval flag are all present in the production environment.",
    failureRule:
      "If recording or transcript is missing, public launch stays locked and students use the portal-native fallback.",
  },
  {
    id: "detailed-visual-proof",
    title: "Detailed visual and map proof is approved",
    area: "Visual learning",
    prerequisite: "manual-proof",
    proofTarget:
      "Founder approves the final Day 1 visual sequence for geographic thinking, map relationships, and India relationship drills.",
    failureRule:
      "If the visual proof is still superficial or not reviewed, public launch stays locked even when the lesson text works.",
  },
  {
    id: "fresh-advanced-mcqs",
    title: "Fresh advanced Day 1 MCQ bank is launch-ready",
    area: "Practice bank",
    prerequisite: "fresh-mcq-gate",
    proofTarget:
      "GEO-D01 has at least 25 reviewed READY questions with map/case anchors, explanation quality, syllabus link, and UPSC trap language.",
    failureRule:
      "If the MCQ bank is old, weak, partial, or DRAFT, public launch stays locked and practice remains controlled.",
  },
  {
    id: "founder-final-signoff",
    title: "Founder final Day 1 release-pack sign-off is recorded",
    area: "Founder release",
    prerequisite: "manual-proof",
    proofTarget:
      "Founder confirms media, transcript, visual proof, and MCQ quality together as the final Day 1 release pack.",
    failureRule:
      "If sign-off is missing, do not widen from controlled testing to public student access.",
  },
];

export const defaultGeographyDay1ReleasePackReceiptState: GeographyDay1ReleasePackReceiptState = {
  completedIds: [],
  proofNotes: {},
  reviewerName: "Founder",
  updatedAt: "",
};

const receiptIds = geographyDay1ReleasePackReceipts.map((receipt) => receipt.id);

function isReceiptId(value: unknown): value is GeographyDay1ReleasePackReceiptId {
  return typeof value === "string" && receiptIds.includes(value as GeographyDay1ReleasePackReceiptId);
}

function isProofNotes(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((note) => typeof note === "string");
}

function isReceiptState(value: unknown): value is GeographyDay1ReleasePackReceiptState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<GeographyDay1ReleasePackReceiptState>;
  return Boolean(
    Array.isArray(item.completedIds) &&
      item.completedIds.every(isReceiptId) &&
      isProofNotes(item.proofNotes) &&
      item.reviewerName,
  );
}

function emitDay1ReleasePackReceiptUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("geography-day1-release-pack-receipts-updated"));
}

export function readGeographyDay1ReleasePackReceipts(): GeographyDay1ReleasePackReceiptState {
  if (typeof window === "undefined") return defaultGeographyDay1ReleasePackReceiptState;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(GEOGRAPHY_DAY1_RELEASE_PACK_RECEIPTS_KEY) || "null");
    return isReceiptState(parsed) ? parsed : defaultGeographyDay1ReleasePackReceiptState;
  } catch {
    return defaultGeographyDay1ReleasePackReceiptState;
  }
}

export function writeGeographyDay1ReleasePackReceipts(state: GeographyDay1ReleasePackReceiptState) {
  if (typeof window === "undefined") return;
  const completedIds = Array.from(new Set(state.completedIds)).filter(isReceiptId);
  const proofNotes = Object.fromEntries(receiptIds.map((id) => [id, (state.proofNotes[id] || "").trim()]));
  window.localStorage.setItem(
    GEOGRAPHY_DAY1_RELEASE_PACK_RECEIPTS_KEY,
    JSON.stringify({
      ...state,
      completedIds,
      proofNotes,
      reviewerName: state.reviewerName.trim() || "Founder",
    }),
  );
  emitDay1ReleasePackReceiptUpdate();
}

export function updateGeographyDay1ReleasePackReceipt(
  id: GeographyDay1ReleasePackReceiptId,
  patch: {
    completed?: boolean;
    proofNote?: string;
    reviewerName?: string;
  },
) {
  const current = readGeographyDay1ReleasePackReceipts();
  const completed = new Set(current.completedIds);
  const nextProofNotes = {
    ...current.proofNotes,
    [id]: patch.proofNote === undefined ? current.proofNotes[id] || "" : patch.proofNote.trim(),
  };

  if (patch.completed === true) {
    completed.add(id);
  } else if (patch.completed === false) {
    completed.delete(id);
  }

  const nextState: GeographyDay1ReleasePackReceiptState = {
    completedIds: Array.from(completed).filter(isReceiptId),
    proofNotes: nextProofNotes,
    reviewerName: patch.reviewerName?.trim() || current.reviewerName || "Founder",
    updatedAt: new Date().toISOString(),
  };
  writeGeographyDay1ReleasePackReceipts(nextState);
  return nextState;
}

export function getGeographyDay1ReleasePackReceiptSummary(
  state = readGeographyDay1ReleasePackReceipts(),
) {
  const total = receiptIds.length;
  const completedCount = receiptIds.filter((id) => state.completedIds.includes(id)).length;

  return {
    total,
    completedCount,
    complete: total > 0 && completedCount === total,
    missingCount: Math.max(0, total - completedCount),
  };
}
