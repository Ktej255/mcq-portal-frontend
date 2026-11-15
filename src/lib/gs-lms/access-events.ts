/**
 * Cross-cutting signal for GS LMS beta-entitlement denials.
 *
 * The LMS layout gate checks entitlement once per subject and caches the
 * result for the tab, so a learner whose cohort grant is revoked mid-session
 * can still be inside an already-rendered LMS page. Every GS LMS request is
 * enforced server-side, so the first refused request is the moment the client
 * learns access changed. The API client turns that refusal into a window
 * event and the layout shell swaps the page for the deliberate "Beta access
 * not active" panel instead of leaving a generic error behind.
 *
 * This module intentionally imports nothing so the API client and UI can both
 * use it without a cycle.
 */

export const GS_LMS_ACCESS_DENIED_EVENT = "gs-lms:access-denied";

/** Phrase the GS LMS entitlement dependency uses for denied access. */
const ACCESS_DENIED_MARKER = "GS LMS beta access is not active";

export type GsLmsAccessDeniedDetail = { message: string };

function detailFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("detail" in body)) return null;
  const detail = (body as { detail?: unknown }).detail;
  return typeof detail === "string" && detail.trim() ? detail.trim() : null;
}

/**
 * Returns the server message when an axios-style error is the GS LMS
 * entitlement denial, or null for any other failure (including role-based
 * 403s on admin endpoints, which must not masquerade as a beta gate).
 */
export function gsLmsAccessDenialMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const response = (error as {
    response?: { status?: number; data?: unknown };
  }).response;
  if (response?.status !== 403) return null;
  const message = detailFromBody(response.data);
  if (!message || !message.includes(ACCESS_DENIED_MARKER)) return null;
  return message;
}

export function notifyGsLmsAccessDenied(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GsLmsAccessDeniedDetail>(GS_LMS_ACCESS_DENIED_EVENT, {
      detail: { message },
    }),
  );
}
