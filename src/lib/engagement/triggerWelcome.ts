/**
 * Engagement trigger — fires after successful login + profile creation.
 * Calls POST /api/v1/engagement/welcome with student data.
 * Best-effort — never blocks the UX. Failures are silently logged.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    const response = await fetch(
      `${API_BASE_URL}/api/v1/engagement/welcome`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          target_year: data.targetYear,
          first_topic_url: data.firstTopicUrl,
          first_topic_title: extractTopicTitle(data.firstTopicUrl),
        }),
      }
    );

    if (!response.ok) {
      console.warn(
        `[engagement] Welcome trigger returned ${response.status}`,
        await response.text().catch(() => "")
      );
      return;
    }

    const result: WelcomeEngagementResponse = await response.json();
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
