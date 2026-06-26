/**
 * Commerce Boundary — Single kill switch between pilot-intent and live-commerce.
 *
 * When `readyForPayment` is flipped to `true`, all surfaces consuming this
 * boundary automatically switch from "Record intent" language to "Pay for"
 * language, and the checkout renders the Cashfree SDK instead of the pilot
 * activation button.
 *
 * Keep `readyForPayment: false` until founder sign-off + launch gates pass.
 */

const READY_FOR_PAYMENT = false as const;

// ---------------------------------------------------------------------------
// Pilot mode values (readyForPayment === false)
// ---------------------------------------------------------------------------

const pilotBoundary = {
  mode: "pilot-plan-intent",
  readyForPayment: false as const,
  badge: "Pilot plan intent",
  pricingCtaPrefix: "Record intent for",
  checkoutBadge: "Plan intent only",
  paymentStatusLabel: "Payment status",
  paymentStatusValue: "No payment collected today",
  gateSummary:
    "Payments open only after the Geography Day 1 release pack, live continuity receipts, and founder sign-off are complete.",
  studentExplanation:
    "This screen saves the student's preferred plan and pricing math for the pilot. It is not a live payment checkout yet.",
} as const;

// ---------------------------------------------------------------------------
// Live commerce values (readyForPayment === true)
// ---------------------------------------------------------------------------

const liveBoundary = {
  mode: "live-commerce",
  readyForPayment: true as const,
  badge: "Live payments",
  pricingCtaPrefix: "Pay for",
  checkoutBadge: "Secure checkout",
  paymentStatusLabel: "Payment status",
  paymentStatusValue: "Cashfree secure payment",
  gateSummary:
    "Payments are live. Your subscription activates immediately after successful payment.",
  studentExplanation:
    "Complete your payment to activate your subscription plan immediately.",
} as const;

// ---------------------------------------------------------------------------
// Exported boundary (switch based on READY_FOR_PAYMENT)
// ---------------------------------------------------------------------------

export const publicCommerceLaunchBoundary = READY_FOR_PAYMENT
  ? liveBoundary
  : pilotBoundary;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function pricingPlanIntentLabel(planTitle: string) {
  return `${publicCommerceLaunchBoundary.pricingCtaPrefix} ${planTitle}`;
}

/**
 * Validates that the boundary configuration is internally consistent.
 * Logs a console warning if `mode` doesn't match `readyForPayment`.
 * Call once at app boot or in dev to catch configuration drift.
 */
export function validateBoundary(): void {
  const { mode, readyForPayment } = publicCommerceLaunchBoundary;

  const modeImpliesLive = mode === "live-commerce";
  const mismatch = modeImpliesLive !== readyForPayment;

  if (mismatch) {
    console.warn(
      `[CommerceBoundary] MISMATCH DETECTED — mode="${mode}" but readyForPayment=${String(readyForPayment)}. ` +
        `These must agree: mode="live-commerce" requires readyForPayment=true, and ` +
        `mode="pilot-plan-intent" requires readyForPayment=false.`,
    );
  }
}
