/**
 * Engagement trigger — fires after successful login + profile creation.
 * Calls POST /api/v1/engagement/welcome with student data.
 * Best-effort — never blocks the UX. Failures are silently logged.
 */

import { apiClient } from "@/services/api/client";

interface WelcomeEngagementData {
  name: string;
  email: string;
  phone?: string;
  targetYear: string;
  firstTopicUrl: string;
}

interface WelcomeEngagementResponse {
  status: "queued" | "skipped";
  email_queued: boolean;
  whatsapp_queued: boolean;
}

/**
 * Trigger welcome engagement messages (Email + WhatsApp) for a new student.
 *
 * This is fire-and-forget — it never throws, never blocks navigation,
 * and never shows errors to the user. Engagement is a background concern.
 *
 * @param data - Student profile data collected during onboarding
 */
export async function triggerWelcomeEngagement(
  data: WelcomeEngagementData
): Promise<void> {
  try {
    // apiClient adds the learner's token; the backend only emails the
    // signed-in account's own address.
    const response = await apiClient.post<WelcomeEngagementResponse>("engagement/welcome", {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      target_year: data.targetYear,
      first_topic_url: data.firstTopicUrl,
      first_topic_title: extractTopicTitle(data.firstTopicUrl),
    });

    const result = response.data;
    console.info(`[engagement] Welcome ${result.status}`, {
      email: result.email_queued,
      whatsapp: result.whatsapp_queued,
    });
  } catch (error) {
    // Fire-and-forget — never let engagement failures affect the user flow
    console.warn("[engagement] Welcome trigger failed (non-blocking):", error);
  }
}

/**
 * Extract a human-readable topic title from a URL path.
 * e.g. "/upsc/geography/indian-geography" → "Indian Geography"
 */
function extractTopicTitle(url: string): string {
  const segments = url.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "your first topic";
  return last
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
