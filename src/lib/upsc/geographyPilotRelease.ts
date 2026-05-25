export const GEOGRAPHY_PILOT_RELEASE_KEY = "sarit-upsc-geography-pilot-release-v1";
export const GEOGRAPHY_FOUNDER_REVIEW_KEY = "sarit-upsc-geography-founder-review-v1";

export type GeographyPilotReleaseStatus = "approved" | "paused";
export type GeographyFounderReviewItemId =
  | "geography-home"
  | "watch-room"
  | "talk-room"
  | "visual-lab"
  | "mcq-intake"
  | "track-revisit"
  | "mobile-fit";

export type GeographyFounderReviewItem = {
  id: GeographyFounderReviewItemId;
  label: string;
  detail: string;
  href: string;
  passCriteria: string[];
};

export type GeographyPilotReleaseDecision = {
  status: GeographyPilotReleaseStatus;
  reviewerName: string;
  note: string;
  maxTesters: number;
  testWindow: string;
  updatedAt: string;
};

export type GeographyFounderReviewState = {
  checkedIds: GeographyFounderReviewItemId[];
  reviewerName: string;
  updatedAt: string;
};

export const geographyFounderReviewItems: GeographyFounderReviewItem[] = [
  {
    id: "geography-home",
    label: "Geography landing",
    detail: "Subject page opens cleanly and routes to Day 1 without confusion.",
    href: "/upsc/geography",
    passCriteria: [
      "Landing opens without old branding or overflow.",
      "Day 1 action is visible without needing admin knowledge.",
      "Student can move toward the Day 1 path from the page.",
    ],
  },
  {
    id: "watch-room",
    label: "Watch room",
    detail: "Day 1 class scene, handoff, and next action are understandable.",
    href: "/upsc/geography/watch?day=1",
    passCriteria: [
      "Day 1 class pack feels credible enough for a first tester.",
      "The Watch to Talk handoff is visible and understandable.",
      "Back/next movement does not trap the student.",
    ],
  },
  {
    id: "talk-room",
    label: "Talk room",
    detail: "AI teacher, peer challenge, score, and route decision feel usable.",
    href: "/upsc/geography/talk?day=1",
    passCriteria: [
      "Teacher prompt, student recall, peer challenge, and score are visible.",
      "Low-score recovery and pass-forward decisions are clear.",
      "The student understands where to go next.",
    ],
  },
  {
    id: "visual-lab",
    label: "Visual Lab",
    detail: "All five proof stages are visible and MCQ stays locked until proof is saved.",
    href: "/upsc/geography/lab?day=1",
    passCriteria: [
      "The lab shows map/concept proof stages, not an empty shell.",
      "MCQ remains locked until required proof is saved.",
      "The Lab to MCQ route is clear after proof completion.",
    ],
  },
  {
    id: "mcq-intake",
    label: "MCQ intake",
    detail: "GEO-D01 needs 25 audited fresh MCQs before practice opens.",
    href: "/upsc/geography/mcq-readiness?day=1",
    passCriteria: [
      "Weak or partial Day 1 MCQ rows cannot unlock practice.",
      "The readiness state explains what is missing.",
      "A fresh audited 25-question bank can become ready locally.",
    ],
  },
  {
    id: "track-revisit",
    label: "Track and Revisit",
    detail: "Command outcome and recovery route are clear after practice.",
    href: "/upsc/geography/track?day=1",
    passCriteria: [
      "Track shows the Day 1 command outcome and closeout.",
      "Revisit is available as a visible recovery route.",
      "The student can return to pilot feedback after the loop.",
    ],
  },
  {
    id: "mobile-fit",
    label: "Mobile fit",
    detail: "Testing cockpit, admin board, and MCQ readiness fit on mobile.",
    href: "/upsc/geography/pilot",
    passCriteria: [
      "Student pilot fits at mobile width with no horizontal overflow.",
      "Primary action remains visible and readable.",
      "Paused/blocker states are understandable on mobile.",
    ],
  },
];

export const defaultGeographyPilotRelease: GeographyPilotReleaseDecision = {
  status: "paused",
  reviewerName: "Founder",
  note: "Awaiting operator sign-off after final local proof.",
  maxTesters: 3,
  testWindow: "25-35 minutes",
  updatedAt: "",
};

export const defaultGeographyFounderReview: GeographyFounderReviewState = {
  checkedIds: [],
  reviewerName: "Founder",
  updatedAt: "",
};

function isReleaseDecision(value: unknown): value is GeographyPilotReleaseDecision {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<GeographyPilotReleaseDecision>;
  return Boolean(
    (item.status === "approved" || item.status === "paused") &&
      item.reviewerName &&
      item.note &&
      typeof item.maxTesters === "number" &&
      item.testWindow,
  );
}

function isReviewItemId(value: unknown): value is GeographyFounderReviewItemId {
  return geographyFounderReviewItems.some((item) => item.id === value);
}

function isFounderReviewState(value: unknown): value is GeographyFounderReviewState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Partial<GeographyFounderReviewState>;
  return Boolean(
    Array.isArray(item.checkedIds) &&
      item.checkedIds.every(isReviewItemId) &&
      item.reviewerName,
  );
}

export function readGeographyPilotRelease(): GeographyPilotReleaseDecision {
  if (typeof window === "undefined") return defaultGeographyPilotRelease;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(GEOGRAPHY_PILOT_RELEASE_KEY) || "null");
    return isReleaseDecision(parsed) ? parsed : defaultGeographyPilotRelease;
  } catch {
    return defaultGeographyPilotRelease;
  }
}

export function writeGeographyPilotRelease(decision: GeographyPilotReleaseDecision) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GEOGRAPHY_PILOT_RELEASE_KEY, JSON.stringify(decision));
  window.dispatchEvent(new CustomEvent("geography-pilot-release-updated"));
}

export function updateGeographyPilotRelease(
  patch: Partial<Omit<GeographyPilotReleaseDecision, "updatedAt">>,
) {
  const nextDecision: GeographyPilotReleaseDecision = {
    ...readGeographyPilotRelease(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeGeographyPilotRelease(nextDecision);
  return nextDecision;
}

export function readGeographyFounderReview(): GeographyFounderReviewState {
  if (typeof window === "undefined") return defaultGeographyFounderReview;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(GEOGRAPHY_FOUNDER_REVIEW_KEY) || "null");
    return isFounderReviewState(parsed) ? parsed : defaultGeographyFounderReview;
  } catch {
    return defaultGeographyFounderReview;
  }
}

export function writeGeographyFounderReview(review: GeographyFounderReviewState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GEOGRAPHY_FOUNDER_REVIEW_KEY, JSON.stringify(review));
  window.dispatchEvent(new CustomEvent("geography-founder-review-updated"));
}

export function updateGeographyFounderReview(
  patch: Partial<Omit<GeographyFounderReviewState, "updatedAt">>,
) {
  const current = readGeographyFounderReview();
  const checkedIds = Array.from(new Set(patch.checkedIds ?? current.checkedIds)).filter(isReviewItemId);
  const nextReview: GeographyFounderReviewState = {
    ...current,
    ...patch,
    checkedIds,
    updatedAt: new Date().toISOString(),
  };
  writeGeographyFounderReview(nextReview);
  return nextReview;
}

export function toggleGeographyFounderReviewItem(id: GeographyFounderReviewItemId, reviewerName = "Founder") {
  const current = readGeographyFounderReview();
  const checked = new Set(current.checkedIds);
  if (checked.has(id)) {
    checked.delete(id);
  } else {
    checked.add(id);
  }

  return updateGeographyFounderReview({
    checkedIds: Array.from(checked),
    reviewerName: reviewerName.trim() || current.reviewerName || "Founder",
  });
}

export function isGeographyFounderReviewComplete(review: GeographyFounderReviewState) {
  return geographyFounderReviewItems.every((item) => review.checkedIds.includes(item.id));
}
