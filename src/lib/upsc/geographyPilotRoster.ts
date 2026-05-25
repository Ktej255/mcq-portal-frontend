export const GEOGRAPHY_PILOT_ROSTER_KEY = "sarit-upsc-geography-pilot-roster-v1";
export const GEOGRAPHY_PILOT_TESTER_CAP = 3;

export type GeographyPilotTesterStatus = "planned" | "invited" | "completed" | "blocked";

export type GeographyPilotTesterEntry = {
  id: string;
  name: string;
  contact: string;
  inviteCode: string;
  status: GeographyPilotTesterStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
};

function isTesterStatus(value: unknown): value is GeographyPilotTesterStatus {
  return value === "planned" || value === "invited" || value === "completed" || value === "blocked";
}

function normalizeInviteCode(value: unknown, index: number) {
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : `GEO-${String(index + 1).padStart(2, "0")}-LOCAL`;
}

function normalizeTesterEntry(value: unknown, index: number): GeographyPilotTesterEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Partial<GeographyPilotTesterEntry>;
  if (
    !item.id ||
    !item.name ||
    typeof item.contact !== "string" ||
    !isTesterStatus(item.status) ||
    typeof item.note !== "string" ||
    !item.createdAt ||
    !item.updatedAt
  ) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    contact: item.contact,
    inviteCode: normalizeInviteCode(item.inviteCode, index),
    status: item.status,
    note: item.note,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function emitRosterUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("geography-pilot-roster-updated"));
}

export function readGeographyPilotRoster(): GeographyPilotTesterEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(GEOGRAPHY_PILOT_ROSTER_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry, index) => normalizeTesterEntry(entry, index))
      .filter((entry): entry is GeographyPilotTesterEntry => Boolean(entry));
  } catch {
    return [];
  }
}

export function writeGeographyPilotRoster(roster: GeographyPilotTesterEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GEOGRAPHY_PILOT_ROSTER_KEY, JSON.stringify(roster.slice(0, GEOGRAPHY_PILOT_TESTER_CAP)));
  emitRosterUpdate();
}

function createInviteCode(position: number) {
  return `GEO-${String(position).padStart(2, "0")}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export function addGeographyPilotTester(input: { name: string; contact?: string; note?: string }) {
  const roster = readGeographyPilotRoster();
  if (roster.length >= GEOGRAPHY_PILOT_TESTER_CAP) return roster;

  const name = input.name.trim();
  if (!name) return roster;

  const now = new Date().toISOString();
  const nextRoster: GeographyPilotTesterEntry[] = [
    ...roster,
    {
      id: `geo-tester-${Date.now()}`,
      name,
      contact: input.contact?.trim() || "Local tester",
      inviteCode: createInviteCode(roster.length + 1),
      status: "planned",
      note: input.note?.trim() || "Invite only after the pre-share gate is green.",
      createdAt: now,
      updatedAt: now,
    },
  ];
  writeGeographyPilotRoster(nextRoster);
  return nextRoster;
}

export function updateGeographyPilotTesterStatus(id: string, status: GeographyPilotTesterStatus) {
  const nextRoster = readGeographyPilotRoster().map((tester) =>
    tester.id === id
      ? {
          ...tester,
          status,
          updatedAt: new Date().toISOString(),
        }
      : tester
  );
  writeGeographyPilotRoster(nextRoster);
  return nextRoster;
}
