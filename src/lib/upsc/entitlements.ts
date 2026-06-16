/**
 * Entitlements + upgrade-trigger engine.
 *
 * Single source of truth for what each tier can do (including a FREE entry tier)
 * and when to surface upgrade prompts. Pure logic — no UI, no side effects —
 * so it can be adopted incrementally by the dashboard, the MCQ generator, the
 * AI usage guard, and the marketing demo without breaking existing flows.
 *
 * Tier prices (from src/lib/upsc/yearlyPlanner.ts):
 *   free ₹0 · foundation ₹399 · plus ₹699 · pro ₹999 · ultimate ₹1299
 */

export type EntitlementTier = "free" | "foundation" | "plus" | "pro" | "ultimate";

export type BillingCycle = "monthly" | "yearly" | "two-year" | "three-year";

export type Entitlements = {
  tier: EntitlementTier;
  label: string;
  /** null = unlimited */
  dailyMcqLimit: number | null;
  dailyAiMinutes: number | null;
  weakTopicRuns: number | null;
  optionalSubjects: boolean;
  mainsUpload: boolean;
  unlimitedTests: boolean;
  allSubjects: boolean;
};

export const TIER_ORDER: EntitlementTier[] = ["free", "foundation", "plus", "pro", "ultimate"];

export const TIER_LABEL: Record<EntitlementTier, string> = {
  free: "Free",
  foundation: "Foundation",
  plus: "Plus",
  pro: "Pro",
  ultimate: "Ultimate",
};

export const ENTITLEMENTS: Record<EntitlementTier, Entitlements> = {
  free: {
    tier: "free",
    label: "Free",
    dailyMcqLimit: 10,
    dailyAiMinutes: 20,
    weakTopicRuns: 1,
    optionalSubjects: false,
    mainsUpload: false,
    unlimitedTests: false,
    allSubjects: false,
  },
  foundation: {
    tier: "foundation",
    label: "Foundation",
    dailyMcqLimit: 50,
    dailyAiMinutes: 60,
    weakTopicRuns: 1,
    optionalSubjects: false,
    mainsUpload: false,
    unlimitedTests: false,
    allSubjects: false,
  },
  plus: {
    tier: "plus",
    label: "Plus",
    dailyMcqLimit: 200,
    dailyAiMinutes: 180,
    weakTopicRuns: 5,
    optionalSubjects: true,
    mainsUpload: false,
    unlimitedTests: false,
    allSubjects: true,
  },
  pro: {
    tier: "pro",
    label: "Pro",
    dailyMcqLimit: null,
    dailyAiMinutes: 360,
    weakTopicRuns: null,
    optionalSubjects: true,
    mainsUpload: true,
    unlimitedTests: true,
    allSubjects: true,
  },
  ultimate: {
    tier: "ultimate",
    label: "Ultimate",
    dailyMcqLimit: null,
    dailyAiMinutes: null,
    weakTopicRuns: null,
    optionalSubjects: true,
    mainsUpload: true,
    unlimitedTests: true,
    allSubjects: true,
  },
};

export function getEntitlements(tier: EntitlementTier): Entitlements {
  return ENTITLEMENTS[tier] ?? ENTITLEMENTS.free;
}

export function nextTier(tier: EntitlementTier): EntitlementTier | null {
  const i = TIER_ORDER.indexOf(tier);
  return i >= 0 && i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : null;
}

/** True when a daily MCQ cap exists and has been reached. */
export function isMcqLimitReached(usedToday: number, tier: EntitlementTier): boolean {
  const limit = getEntitlements(tier).dailyMcqLimit;
  return limit !== null && usedToday >= limit;
}

/* ------------------------------------------------------------------ */
/* Upgrade-trigger engine                                              */
/* ------------------------------------------------------------------ */

export type BlockedFeature = "optional" | "mains" | "tests" | null;

export type UpgradeSignals = {
  tier: EntitlementTier;
  billingCycle?: BillingCycle;
  streakDays?: number;
  daysSinceSignup?: number;
  targetYear?: string; // e.g. "2026", "2027", "2028 or later"
  mcqUsedToday?: number;
  blockedFeature?: BlockedFeature;
  daysToRenewal?: number;
};

export type UpgradeSuggestion = {
  kind: "tier" | "cycle";
  title: string;
  body: string;
  ctaTier?: EntitlementTier;
  ctaCycle?: BillingCycle;
  /** stable id for frequency-capping a dismissal */
  id: string;
} | null;

/**
 * Decide the single most relevant upgrade nudge for the current signals.
 * Tier nudges (capability needs) take priority over cycle nudges (commitment).
 */
export function evaluateUpgradePrompt(s: UpgradeSignals): UpgradeSuggestion {
  const ent = getEntitlements(s.tier);

  // 1) Blocked capability — strongest intent signal.
  if (s.blockedFeature === "optional" && !ent.optionalSubjects) {
    return { kind: "tier", id: "tier-optional", title: "Optional subjects are on Plus", body: "Unlock the full optional subject catalogue with Plus.", ctaTier: "plus" };
  }
  if (s.blockedFeature === "mains" && !ent.mainsUpload) {
    return { kind: "tier", id: "tier-mains", title: "Mains uploads are on Pro", body: "Auto-stitch and evaluate your Mains answers with Pro.", ctaTier: "pro" };
  }
  if (s.blockedFeature === "tests" && !ent.unlimitedTests) {
    return { kind: "tier", id: "tier-tests", title: "Unlimited testing is on Pro", body: "Run unlimited MCQs and full-length tests with Pro.", ctaTier: "pro" };
  }

  // 2) Daily MCQ cap reached.
  if (ent.dailyMcqLimit !== null && (s.mcqUsedToday ?? 0) >= ent.dailyMcqLimit) {
    const nt = nextTier(s.tier);
    if (nt) {
      const ntLimit = getEntitlements(nt).dailyMcqLimit;
      const more = ntLimit === null ? "unlimited" : `${ntLimit}/day`;
      return { kind: "tier", id: "tier-mcq-cap", title: `You've hit today's ${ent.dailyMcqLimit} MCQs`, body: `Upgrade to ${TIER_LABEL[nt]} for ${more} practice.`, ctaTier: nt };
    }
  }

  // 3) Cycle commitment — habit formed, still on monthly.
  if (s.billingCycle === "monthly" && ((s.streakDays ?? 0) >= 7 || (s.daysSinceSignup ?? 0) >= 30)) {
    return { kind: "cycle", id: "cycle-yearly", title: "Lock in 15% with Yearly", body: "You're studying consistently — switch to yearly billing and save 15%.", ctaCycle: "yearly" };
  }

  // 4) Long horizon — multi-year matches the goal.
  if ((s.billingCycle === "monthly" || s.billingCycle === "yearly") && (s.targetYear === "2027" || s.targetYear === "2028 or later")) {
    return { kind: "cycle", id: "cycle-two-year", title: "Prepping beyond 2026?", body: "A 2-year plan saves 25% and matches your timeline.", ctaCycle: "two-year" };
  }

  // 5) Renewal window.
  if ((s.daysToRenewal ?? 99) <= 5) {
    return { kind: "cycle", id: "cycle-renewal", title: "Renew and save more", body: "Switch to a longer cycle at renewal for a bigger discount.", ctaCycle: "yearly" };
  }

  return null;
}
