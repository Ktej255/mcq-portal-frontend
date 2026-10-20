// The backend answers 402 with this detail when a plan or the free trial
// doesn't cover a request (see backend app/api/dependencies.py). The API client
// re-broadcasts it as a window event so one UpgradePrompt can show it.
export type UpgradeRequiredDetail = {
  code: "upgrade_required";
  reason: "trial_expired" | "feature" | "mcq_limit";
  message: string;
  feature: string | null;
  required_tier: string | null;
  upgrade_path: string;
};

export const upgradeRequiredEvent = "sarit-upgrade-required";

export function isUpgradeRequired(value: unknown): value is UpgradeRequiredDetail {
  return Boolean(value && typeof value === "object" && (value as { code?: unknown }).code === "upgrade_required");
}
