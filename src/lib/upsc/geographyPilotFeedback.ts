export const GEOGRAPHY_PILOT_FEEDBACK_KEY = "sarit-upsc-geography-pilot-feedback-v1";

export type GeographyPilotFeedbackStage =
  | "Access"
  | "Watch"
  | "Talk"
  | "Visual Lab"
  | "MCQ"
  | "Track"
  | "Revisit"
  | "Navigation"
  | "Content";

export type GeographyPilotFeedbackSeverity = "Blocker" | "Confusing" | "Small fix" | "Positive";

export type GeographyPilotFeedbackStatus = "open" | "reviewed";

export type GeographyPilotFeedbackEntry = {
  id: string;
  createdAt: string;
  testerName: string;
  stage: GeographyPilotFeedbackStage;
  severity: GeographyPilotFeedbackSeverity;
  day: number;
  note: string;
  currentRoute: string;
  inviteCode?: string;
  status: GeographyPilotFeedbackStatus;
};

function isFeedbackEntry(value: unknown): value is GeographyPilotFeedbackEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<GeographyPilotFeedbackEntry>;
  return Boolean(
    item.id &&
      item.createdAt &&
      item.testerName &&
      item.stage &&
      item.severity &&
      item.note &&
      (item.inviteCode === undefined || typeof item.inviteCode === "string")
  );
}

export function readGeographyPilotFeedback(): GeographyPilotFeedbackEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(GEOGRAPHY_PILOT_FEEDBACK_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isFeedbackEntry) : [];
  } catch {
    return [];
  }
}

export function writeGeographyPilotFeedback(entries: GeographyPilotFeedbackEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GEOGRAPHY_PILOT_FEEDBACK_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("geography-pilot-feedback-updated"));
}

export function appendGeographyPilotFeedback(
  entry: Omit<GeographyPilotFeedbackEntry, "id" | "createdAt" | "status">
) {
  const nextEntry: GeographyPilotFeedbackEntry = {
    ...entry,
    id: `geo-pilot-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  writeGeographyPilotFeedback([nextEntry, ...readGeographyPilotFeedback()]);
  return nextEntry;
}

export function updateGeographyPilotFeedbackStatus(id: string, status: GeographyPilotFeedbackStatus) {
  const nextEntries = readGeographyPilotFeedback().map((entry) =>
    entry.id === id ? { ...entry, status } : entry
  );
  writeGeographyPilotFeedback(nextEntries);
  return nextEntries;
}
