export const GEOGRAPHY_PILOT_WAVE_DECISION_KEY = "sarit-upsc-geography-pilot-wave-decision-v1";

export type GeographyPilotWaveDecisionStatus = "hold" | "repair" | "second-wave";

export type GeographyPilotWaveDecision = {
  status: GeographyPilotWaveDecisionStatus;
  reviewerName: string;
  note: string;
  updatedAt: string;
};

export const defaultGeographyPilotWaveDecision: GeographyPilotWaveDecision = {
  status: "hold",
  reviewerName: "Founder",
  note: "First tester wave is held until the admin outcome gate is reviewed.",
  updatedAt: "",
};

function isWaveDecisionStatus(value: unknown): value is GeographyPilotWaveDecisionStatus {
  return value === "hold" || value === "repair" || value === "second-wave";
}

function isWaveDecision(value: unknown): value is GeographyPilotWaveDecision {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<GeographyPilotWaveDecision>;
  return Boolean(isWaveDecisionStatus(item.status) && item.reviewerName && item.note);
}

function emitWaveDecisionUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("geography-pilot-wave-decision-updated"));
}

export function readGeographyPilotWaveDecision(): GeographyPilotWaveDecision {
  if (typeof window === "undefined") return defaultGeographyPilotWaveDecision;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(GEOGRAPHY_PILOT_WAVE_DECISION_KEY) || "null");
    return isWaveDecision(parsed) ? parsed : defaultGeographyPilotWaveDecision;
  } catch {
    return defaultGeographyPilotWaveDecision;
  }
}

export function writeGeographyPilotWaveDecision(decision: GeographyPilotWaveDecision) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GEOGRAPHY_PILOT_WAVE_DECISION_KEY, JSON.stringify(decision));
  emitWaveDecisionUpdate();
}

export function updateGeographyPilotWaveDecision(
  patch: Partial<Omit<GeographyPilotWaveDecision, "updatedAt">>,
) {
  const nextDecision: GeographyPilotWaveDecision = {
    ...readGeographyPilotWaveDecision(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeGeographyPilotWaveDecision(nextDecision);
  return nextDecision;
}
