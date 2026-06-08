import { liveContinuityRehearsal } from "./launchDeliveryPlan";

export const LIVE_CONTINUITY_RECEIPTS_KEY = "sarit-upsc-live-continuity-receipts-v1";

export type LiveContinuityReceiptId = (typeof liveContinuityRehearsal)[number]["id"];

export type LiveContinuityReceiptState = {
  completedIds: LiveContinuityReceiptId[];
  proofNotes: Record<string, string>;
  reviewerName: string;
  updatedAt: string;
};

export const defaultLiveContinuityReceiptState: LiveContinuityReceiptState = {
  completedIds: [],
  proofNotes: {},
  reviewerName: "Founder",
  updatedAt: "",
};

const liveContinuityReceiptIds = liveContinuityRehearsal.map((receipt) => receipt.id);

function isReceiptId(value: unknown): value is LiveContinuityReceiptId {
  return typeof value === "string" && liveContinuityReceiptIds.includes(value);
}

function isProofNotes(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((note) => typeof note === "string");
}

function isReceiptState(value: unknown): value is LiveContinuityReceiptState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<LiveContinuityReceiptState>;
  return Boolean(
    Array.isArray(item.completedIds) &&
      item.completedIds.every(isReceiptId) &&
      isProofNotes(item.proofNotes) &&
      item.reviewerName,
  );
}

function emitLiveContinuityReceiptUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("upsc-live-continuity-receipts-updated"));
}

export function readLiveContinuityReceipts(): LiveContinuityReceiptState {
  if (typeof window === "undefined") return defaultLiveContinuityReceiptState;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LIVE_CONTINUITY_RECEIPTS_KEY) || "null");
    return isReceiptState(parsed) ? parsed : defaultLiveContinuityReceiptState;
  } catch {
    return defaultLiveContinuityReceiptState;
  }
}

export function writeLiveContinuityReceipts(state: LiveContinuityReceiptState) {
  if (typeof window === "undefined") return;
  const completedIds = Array.from(new Set(state.completedIds)).filter(isReceiptId);
  const proofNotes = Object.fromEntries(
    liveContinuityReceiptIds.map((id) => [id, (state.proofNotes[id] || "").trim()]),
  );
  window.localStorage.setItem(
    LIVE_CONTINUITY_RECEIPTS_KEY,
    JSON.stringify({
      ...state,
      completedIds,
      proofNotes,
      reviewerName: state.reviewerName.trim() || "Founder",
    }),
  );
  emitLiveContinuityReceiptUpdate();
}

export function updateLiveContinuityReceipt(
  id: LiveContinuityReceiptId,
  patch: {
    completed?: boolean;
    proofNote?: string;
    reviewerName?: string;
  },
) {
  const current = readLiveContinuityReceipts();
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

  const nextState: LiveContinuityReceiptState = {
    completedIds: Array.from(completed).filter(isReceiptId),
    proofNotes: nextProofNotes,
    reviewerName: patch.reviewerName?.trim() || current.reviewerName || "Founder",
    updatedAt: new Date().toISOString(),
  };
  writeLiveContinuityReceipts(nextState);
  return nextState;
}

export function getLiveContinuityReceiptSummary(state = readLiveContinuityReceipts()) {
  const total = liveContinuityReceiptIds.length;
  const completedCount = liveContinuityReceiptIds.filter((id) => state.completedIds.includes(id)).length;

  return {
    total,
    completedCount,
    complete: total > 0 && completedCount === total,
    missingCount: Math.max(0, total - completedCount),
  };
}
