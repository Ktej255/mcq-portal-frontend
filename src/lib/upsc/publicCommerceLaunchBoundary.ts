export const publicCommerceLaunchBoundary = {
  mode: "pilot-plan-intent",
  readyForPayment: false,
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

export function pricingPlanIntentLabel(planTitle: string) {
  return `${publicCommerceLaunchBoundary.pricingCtaPrefix} ${planTitle}`;
}
