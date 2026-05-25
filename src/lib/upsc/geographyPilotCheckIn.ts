export const GEOGRAPHY_PILOT_CHECK_IN_KEY = "sarit-upsc-geography-pilot-check-in-v1";

export type GeographyPilotCheckIn = {
  testerName: string;
  contact: string;
  inviteCode: string;
  checkedInAt: string;
};

function isCheckIn(value: unknown): value is GeographyPilotCheckIn {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<GeographyPilotCheckIn>;
  return Boolean(item.testerName && typeof item.contact === "string" && typeof item.inviteCode === "string" && item.checkedInAt);
}

export function readGeographyPilotCheckIn(): GeographyPilotCheckIn | null {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(GEOGRAPHY_PILOT_CHECK_IN_KEY) || "null");
    return isCheckIn(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeGeographyPilotCheckIn(input: { testerName: string; contact?: string; inviteCode?: string }) {
  if (typeof window === "undefined") return null;

  const testerName = input.testerName.trim();
  if (!testerName) return readGeographyPilotCheckIn();

  const checkIn: GeographyPilotCheckIn = {
    testerName,
    contact: input.contact?.trim() || "Local pilot tester",
    inviteCode: input.inviteCode?.trim().toUpperCase() || "",
    checkedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(GEOGRAPHY_PILOT_CHECK_IN_KEY, JSON.stringify(checkIn));
  window.dispatchEvent(new CustomEvent("geography-pilot-check-in-updated"));
  return checkIn;
}
