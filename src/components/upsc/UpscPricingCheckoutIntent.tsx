import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeIndianRupee, CheckCircle2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getProductPricingPlan,
  pricingCheckoutPath,
  productPricingPlans,
  recommendedProductPlanId,
} from "@/lib/upsc/yearlyPlanner";

function money(value: number) {
  return `Rs ${value.toLocaleString("en-IN")}`;
}

export function UpscPricingCheckoutIntent({ planId }: { planId?: string | null }) {
  const selectedPlan = getProductPricingPlan(planId);
  const savings = selectedPlan.listPrice - selectedPlan.launchPrice;
  const selectedPlanUrl = pricingCheckoutPath(selectedPlan.id);

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
          data-list-price={selectedPlan.listPrice}
          data-launch-price={selectedPlan.launchPrice}
          data-discount-percent={selectedPlan.discountPercent}
          data-effective-monthly={selectedPlan.effectiveMonthly}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#b9d9cd] bg-[#e7f5ee] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#085041]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Local checkout handoff
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">{selectedPlan.title} plan selected</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                This page records the pricing intent and exact plan math inside the portal. A payment gateway can attach
                to this plan id without changing the public pricing ladder.
              </p>
            </div>
            <div className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                <BadgeIndianRupee className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">Payable now</p>
              <p className="mt-1 text-3xl font-black">{money(selectedPlan.launchPrice)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#49675e]">
                {money(selectedPlan.effectiveMonthly)} effective monthly
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

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Plan receipt</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">What this plan opens</h2>
            </div>
            <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">
              {selectedPlan.id === recommendedProductPlanId ? "Recommended" : selectedPlan.title}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Daily planner, AI discussion, MCQ builder, revision command, and reports.",
              "Subject-wise syllabus, GS PYQ source rows, yearly planner, and current-affairs gates.",
              "Optional-subject catalog with Paper I and Paper II year-wise source rows.",
              "Local progress works immediately; live payment and gateway receipts can attach at this handoff.",
            ].map((item) => (
              <p key={item} className="flex gap-2 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-sm font-semibold leading-6 text-[#31443a]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#1d9e75]" />
                <span>{item}</span>
              </p>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/upsc" className="inline-flex min-h-10 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white">
              Open UPSC workspace <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={selectedPlanUrl} className="inline-flex min-h-10 items-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a]">
              Copyable plan URL
            </Link>
          </div>
        </section>

        <section data-testid="upsc-pricing-checkout-other-plans" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Switch plan</p>
          <div className="flex flex-wrap gap-2">
            {productPricingPlans.map((plan) => (
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
