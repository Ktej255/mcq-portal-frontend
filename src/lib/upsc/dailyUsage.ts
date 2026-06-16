/**
 * Client-side daily MCQ usage counter (per local day).
 *
 * Pairs with `entitlements.ts` to enforce per-tier daily MCQ caps in the UI.
 * Call `recordMcqUsage(n)` wherever MCQs are generated/served, and read
 * `getMcqUsedToday()` to drive caps + the `UpgradeNudge`. (Authoritative
 * enforcement should also happen server-side at the generation endpoint.)
 */

const KEY = "sarit-mcq-usage-v1";

type Usage = { date: string; count: number };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getMcqUsedToday(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const u = JSON.parse(raw) as Usage;
    return u.date === today() ? u.count || 0 : 0;
  } catch {
    return 0;
  }
}

export function recordMcqUsage(n = 1): number {
  try {
    const next = getMcqUsedToday() + n;
    localStorage.setItem(KEY, JSON.stringify({ date: today(), count: next }));
    return next;
  } catch {
    return 0;
  }
}
