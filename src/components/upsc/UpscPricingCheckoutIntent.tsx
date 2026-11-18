"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, BadgeIndianRupee, CheckCircle2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getProductPricingPlan,
  pricingCheckoutPath,
  productPricingPlans,
} from "@/lib/upsc/yearlyPlanner";
import { publicCommerceLaunchBoundary } from "@/lib/upsc/publicCommerceLaunchBoundary";
import { UpscPricingIntentRecorder } from "@/components/upsc/UpscPricingIntentRecorder";
import { CashfreeCheckout } from "@/components/upsc/CashfreeCheckout";
import type { SubscriptionResponse } from "@/services/api/paymentService";
import { useDashboardData } from "@/hooks/useDashboardData";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

// ---------------------------------------------------------------------------
// Payment Success Receipt (Task 6.3)
// ---------------------------------------------------------------------------

function formatSubscriptionDate(value: string | null) {
  if (!value) return "Unavailable";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PaymentSuccessReceipt({
  orderId,
  amount,
  planTitle,
  billingCycle,
  startDate,
  endDate,
}: {
  orderId: string;
  amount: number;
  planTitle: string;
  billingCycle: string;
  startDate: string | null;
  endDate: string | null;
}) {
  return (
    <div
      data-testid="payment-success-receipt"
      className="rounded-xl border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7"
    >
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-[#1d9e75]" />
        <h2 className="text-xl font-black text-[#085041]">Payment Successful</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-[#b9d9cd] bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#49675e]">
            Order Reference
          </p>
          <p className="mt-1 text-sm font-black text-[#13251d]">{orderId}</p>
        </div>
        <div className="rounded-lg border border-[#b9d9cd] bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#49675e]">
            Amount Paid
          </p>
          <p className="mt-1 text-sm font-black text-[#13251d]">{money(amount)}</p>
        </div>
        <div className="rounded-lg border border-[#b9d9cd] bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#49675e]">
            Plan Activated
          </p>
          <p className="mt-1 text-sm font-black text-[#13251d]">
            {planTitle} ({billingCycle})
          </p>
        </div>
        <div className="rounded-lg border border-[#b9d9cd] bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#49675e]">
            Subscription Period
          </p>
          <p className="mt-1 text-sm font-black text-[#13251d]">
            {formatSubscriptionDate(startDate)}
            {" → "}
            {formatSubscriptionDate(endDate)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/upsc/daily-command?tab=today"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1d9e75] px-5 text-sm font-black text-white hover:bg-[#126245] transition shadow-sm"
        >
          Open Study Workspace <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function UpscPricingCheckoutIntent({ planId }: { planId?: string | null }) {
  const { profile, saveProfile, isLoaded } = useDashboardData();
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [confirmedSubscription, setConfirmedSubscription] = useState<SubscriptionResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const selectedPlan = getProductPricingPlan(planId);
  const savings = selectedPlan.listPrice - selectedPlan.launchPrice;
  const selectedPlanUrl = pricingCheckoutPath(selectedPlan.id);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <div className="animate-pulse text-sm font-black text-[#13251d]">
          Loading checkout command...
        </div>
      </div>
    );
  }

  const handleConfirmActivation = () => {
    if (profile) {
      saveProfile({
        ...profile,
        subscriptionPlanId: selectedPlan.tier,
        billingCycle: selectedPlan.cycle,
        updatedAt: new Date().toISOString(),
      });
      setActivationSuccess(true);
    }
  };

  const handlePaymentSuccess = (orderId: string, subscription: SubscriptionResponse) => {
    // CashfreeCheckout calls this only after the webhook-backed subscription
    // endpoint confirms the exact order, tier, and billing cycle.
    setPaymentOrderId(orderId);
    setConfirmedSubscription(subscription);
    setPaymentSuccess(true);
    setPaymentError(null);
    if (profile) {
      saveProfile({
        ...profile,
        subscriptionPlanId: selectedPlan.tier,
        billingCycle: selectedPlan.cycle,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handlePaymentFailure = (error: string) => {
    setPaymentError(error);
  };

  const isCurrentlyActive = profile?.subscriptionPlanId === selectedPlan.tier && profile?.billingCycle === selectedPlan.cycle;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 md:px-8">
        <Link href="/upsc/pricing" className="inline-flex w-fit items-center text-xs font-black uppercase tracking-[0.14em] text-[#1a3a2a]">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to pricing
        </Link>

        <section
          data-testid="upsc-pricing-checkout-intent"
          data-plan-id={selectedPlan.id}
          data-months={selectedPlan.months}
          data-monthly-base={Math.round(selectedPlan.listPrice / selectedPlan.months)}
          data-list-price={selectedPlan.listPrice}
          data-launch-price={selectedPlan.launchPrice}
          data-savings={savings}
          data-discount-percent={selectedPlan.discountPercent}
          data-effective-monthly={selectedPlan.effectiveMonthly}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#b9d9cd] bg-[#e7f5ee] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#085041]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {publicCommerceLaunchBoundary.checkoutBadge}
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">{selectedPlan.title} selection</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                {publicCommerceLaunchBoundary.studentExplanation} {publicCommerceLaunchBoundary.gateSummary}
              </p>
            </div>
            <div className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                <BadgeIndianRupee className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">Plan price reserved</p>
              <p className="mt-1 text-3xl font-black">{money(selectedPlan.launchPrice)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#49675e]">
                {money(selectedPlan.effectiveMonthly)} effective monthly
              </p>
              <p
                data-testid="upsc-pricing-checkout-payment-boundary"
                data-commerce-mode={publicCommerceLaunchBoundary.mode}
                data-ready-for-payment={String(publicCommerceLaunchBoundary.readyForPayment)}
                className="mt-3 rounded-md border border-[#b9d9cd] bg-white/70 p-2 text-xs font-black text-[#085041]"
              >
                {publicCommerceLaunchBoundary.paymentStatusValue}
              </p>
            </div>
          </div>
        </section>

        <section data-testid="upsc-pricing-checkout-math" className="grid gap-3 md:grid-cols-4">
          {[
            ["Duration", `${selectedPlan.months} month${selectedPlan.months === 1 ? "" : "s"}`],
            ["List price", money(selectedPlan.listPrice)],
            ["Discount", `${selectedPlan.discountPercent}%`],
            ["Savings", money(savings)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
              <p className="mt-1 text-xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section
          data-testid="upsc-pricing-checkout-proof"
          data-plan-id={selectedPlan.id}
          data-monthly-base={Math.round(selectedPlan.listPrice / selectedPlan.months)}
          data-duration-months={selectedPlan.months}
          data-list-price={selectedPlan.listPrice}
          data-launch-price={selectedPlan.launchPrice}
          data-savings={savings}
          data-proof-rule="monthly-base-times-duration-minus-launch-price"
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">Checkout proof</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#31443a]">
            {selectedPlan.months === 1
              ? `${selectedPlan.title} at ${money(selectedPlan.launchPrice)} for 1 month, the base monthly price. No payment is collected today.`
              : `${selectedPlan.title} at ${money(selectedPlan.launchPrice)} for ${selectedPlan.months} months. Saves ${money(savings)} compared to paying monthly.`}
          </p>
        </section>

        {/* Payment / Activation Controller */}
        {paymentSuccess && paymentOrderId && confirmedSubscription ? (
          <PaymentSuccessReceipt
            orderId={paymentOrderId}
            amount={selectedPlan.launchPrice}
            planTitle={selectedPlan.title}
            billingCycle={selectedPlan.cycle}
            startDate={confirmedSubscription.start_date}
            endDate={confirmedSubscription.end_date}
          />
        ) : publicCommerceLaunchBoundary.readyForPayment ? (
          /* Live commerce mode — render Cashfree checkout */
          <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <h2 className="text-xl font-black text-[#13251d]">Complete Payment</h2>
            <p className="mt-1 text-sm font-semibold text-[#5d675f]">
              Secure payment via Cashfree. Your plan activates only after the signed webhook confirms the matching subscription.
            </p>
            {paymentError && (
              <p className="mt-2 text-xs font-bold text-red-700" role="status">
                {paymentError}
              </p>
            )}

            <div className="mt-4">
              <CashfreeCheckout
                planTier={selectedPlan.tier}
                billingCycle={selectedPlan.cycle}
                amount={selectedPlan.launchPrice}
                planTitle={selectedPlan.title}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
              />
            </div>
          </section>
        ) : (
          /* Pilot mode — record a plan intent; never claim a subscription */
          <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <h2 className="text-xl font-black text-[#13251d]">Record your plan intent</h2>
            <p className="mt-1 text-sm font-semibold text-[#5d675f]">
              This saves your preferred plan for the pilot. No payment is collected and no
              subscription or usage quota changes until live payments open and a payment is
              confirmed.
            </p>
            
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {isCurrentlyActive ? (
                <div className="rounded-lg bg-[#e7f5ee] border border-[#b9d9cd] px-4 py-2 text-xs font-black text-[#085041]">
                  ✓ Plan intent saved on this device
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmActivation}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1d9e75] px-5 text-sm font-black text-white hover:bg-[#126245] transition shadow-sm"
                >
                  Save Plan Intent <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              )}
            </div>

            {(activationSuccess || isCurrentlyActive) && (
              <div className="mt-4 rounded-lg bg-[#e7f5ee] border border-[#b9d9cd] p-3 text-sm font-bold text-[#085041]">
                Plan intent recorded: {selectedPlan.title} ({selectedPlan.cycle}). No payment has
                been collected and workspace access is unchanged.
              </div>
            )}
          </section>
        )}

        <UpscPricingIntentRecorder
          plan={selectedPlan}
          savings={savings}
          commerceMode={publicCommerceLaunchBoundary.mode}
          readyForPayment={publicCommerceLaunchBoundary.readyForPayment}
        />

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Plan receipt</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">What this plan opens</h2>
            </div>
            <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white uppercase">
              {selectedPlan.tier} Plan
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Daily planner, AI discussion, MCQ builder, revision command, and reports.",
              "Optional-subject catalog with Paper I and Paper II year-wise source rows.",
              "Local progress works immediately; live payment opens only after the launch gates close.",
            ].map((item) => (
              <p key={item} className="flex gap-2 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-sm font-semibold leading-6 text-[#31443a]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#1d9e75]" />
                <span>{item}</span>
              </p>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/upsc/daily-command?tab=today" className="inline-flex min-h-10 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white">
              Open UPSC workspace <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={selectedPlanUrl} className="inline-flex min-h-10 items-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a]">
              Copyable plan URL
            </Link>
          </div>
        </section>

        <section data-testid="upsc-pricing-checkout-other-plans" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Switch selection</p>
          <div className="flex flex-wrap gap-2">
            {productPricingPlans
              .filter((p) => p.cycle === selectedPlan.cycle)
              .map((plan) => (
                <Link
                  key={plan.id}
                  href={pricingCheckoutPath(plan.id)}
                  className={`rounded-md border px-3 py-2 text-xs font-black ${
                    plan.id === selectedPlan.id
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-[#f7f4ee] text-[#31443a]"
                  }`}
                >
                  {plan.title} / {money(plan.launchPrice)}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
