"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FolderTree,
  LibraryBig,
  Route,
  ShieldCheck,
} from "lucide-react";

import {
  productMonthlyBasePrice,
  pricingCheckoutPath,
  productPricingPlans,
  recommendedProductPlanId,
  yearlyPlannerBlocks,
  billingCycles,
  coreSubjectBlueprints,
  optionalSubjects,
  type BillingCycle,
} from "@/lib/upsc/yearlyPlanner";
import { pricingPlanIntentLabel, publicCommerceLaunchBoundary } from "@/lib/upsc/publicCommerceLaunchBoundary";
import { syllabusPyqRegistrySummary } from "@/lib/upsc/syllabusPyqRegistry";
import { useDashboardData } from "@/hooks/useDashboardData";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function UpscPricingCommand() {
  const { profile, saveProfile, isLoaded } = useDashboardData();
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(
    profile?.billingCycle ?? "three-year"
  );
  
  // Accordion toggle states to keep the page minimalist
  const [isDiscountProofOpen, setIsDiscountProofOpen] = useState(false);
  const [isInclusionsOpen, setIsInclusionsOpen] = useState(false);
  const [isLaunchRulesOpen, setIsLaunchRulesOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee]">
        <div className="animate-pulse text-sm font-black text-[#13251d]">
          Loading pricing command...
        </div>
      </div>
    );
  }

  // Filter plans based on the selected billing cycle
  const activePlans = productPricingPlans.filter((plan) => plan.cycle === selectedCycle);
  const currentPlanId = profile?.subscriptionPlanId ?? "foundation";
  const currentPlanCycle = profile?.billingCycle ?? "monthly";

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        
        {/* Active Plan Status Header */}
        {profile && (
          <section className="rounded-xl border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">
                  Active Student Subscription
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#13251d] capitalize">
                  {currentPlanId} Plan
                  <span className="ml-2 text-sm font-bold text-[#085041]/70">
                    ({currentPlanCycle === "monthly" ? "Billed Monthly" : `${currentPlanCycle} cycle`})
                  </span>
                </h2>
                <p className="mt-1.5 text-xs font-semibold text-[#49675e]">
                  Active Status • Pilot rate of {money(productPricingPlans.find(p => p.tier === currentPlanId && p.cycle === currentPlanCycle)?.launchPrice ?? 399)} reserved.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#1d9e75]/10 border border-[#1d9e75]/30 px-3 py-1 text-xs font-black text-[#085041]">
                  Status: Paid & Active
                </span>
                <Link
                  href="/upsc/daily-command?tab=today"
                  className="rounded-lg bg-[#1a3a2a] px-4 py-2 text-xs font-black text-white hover:bg-[#10291d] transition"
                >
                  Open Study Workspace
                </Link>
              </div>
            </div>
          </section>
        )}

        <section
          data-testid="upsc-pricing-hero"
          data-monthly-base={productMonthlyBasePrice}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                UPSC pricing command
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                Flexible plans. Transparent value.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                Select a tier to match your preparation level. Get deeper discounts with yearly, 
                2-year, or 3-year commitments. Start for ₹399/mo, upgrade anytime.
              </p>
              
              {/* Billing Duration Toggle — ChatGPT-style pill strip */}
              <div className="mt-5 inline-flex rounded-full bg-[#1a3a2a]/5 p-1">
                {billingCycles.map((cycleItem) => (
                  <button
                    key={cycleItem.cycle}
                    type="button"
                    onClick={() => setSelectedCycle(cycleItem.cycle)}
                    className={`relative rounded-full px-5 py-2.5 text-sm font-black transition-all duration-200 ${
                      selectedCycle === cycleItem.cycle
                        ? "bg-[#1a3a2a] text-white shadow-md"
                        : "text-[#495c52] hover:text-[#13251d]"
                    }`}
                  >
                    {cycleItem.label}
                    {cycleItem.discountPercent > 0 && selectedCycle !== cycleItem.cycle && (
                      <span className="ml-1.5 rounded-full bg-[#1d9e75]/15 px-1.5 py-0.5 text-[9px] font-black text-[#085041]">
                        -{cycleItem.discountPercent}%
                      </span>
                    )}
                    {cycleItem.discountPercent > 0 && selectedCycle === cycleItem.cycle && (
                      <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-black text-white">
                        -{cycleItem.discountPercent}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {selectedCycle !== "monthly" && (
                <p className="mt-2 text-xs font-bold text-[#1d9e75]">
                  🎉 You save {billingCycles.find(c => c.cycle === selectedCycle)?.discountPercent}% with {billingCycles.find(c => c.cycle === selectedCycle)?.label} billing
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Base Monthly", "₹399"],
                ["GS subjects", coreSubjectBlueprints.length],
                ["Optional pages", optionalSubjects.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Pricing Cards Grid */}
        <section data-testid="upsc-pricing-plans" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {activePlans.map((plan) => {
            const savings = plan.listPrice - plan.launchPrice;
            const isRecommended = plan.id === `${recommendedProductPlanId}`;
            const isActivePlan = currentPlanId === plan.tier && currentPlanCycle === plan.cycle;

            return (
              <article
                key={plan.id}
                data-testid="upsc-pricing-plan"
                data-plan-id={plan.id}
                data-months={plan.months}
                data-list-price={plan.listPrice}
                data-launch-price={plan.launchPrice}
                data-savings={savings}
                data-discount-percent={plan.discountPercent}
                data-effective-monthly={plan.effectiveMonthly}
                className={`group relative flex flex-col justify-between rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  isActivePlan 
                    ? "border-[#1d9e75] bg-[#e7f5ee] shadow-md" 
                    : isRecommended
                    ? "border-[#1a3a2a] bg-[#fffdf8] shadow-md"
                    : "border-[#e8e2d5] bg-[#fffdf8] hover:border-[#1d9e75]/40"
                }`}
              >
                {/* Badge */}
                {(isActivePlan || isRecommended || plan.discountPercent > 0) && (
                  <div className="absolute -top-3 left-5">
                    {isActivePlan ? (
                      <span className="rounded-full bg-[#085041] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                        Active Plan
                      </span>
                    ) : isRecommended ? (
                      <span className="rounded-full bg-[#1a3a2a] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                        ⭐ Recommended
                      </span>
                    ) : plan.discountPercent > 0 ? (
                      <span className="rounded-full bg-[#1d9e75] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                        Save {plan.discountPercent}%
                      </span>
                    ) : null}
                  </div>
                )}

                <div>
                  {/* Tier name */}
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                    {plan.tier}
                  </p>
                  
                  {/* Price — large and prominent */}
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-[#13251d]">{money(plan.effectiveMonthly)}</span>
                    <span className="text-sm font-semibold text-[#5d675f]">/mo</span>
                  </div>
                  
                  {/* Billing info */}
                  <p className="mt-1.5 text-xs font-bold text-[#746f66]">
                    {plan.months === 1 
                      ? "Billed monthly" 
                      : `${money(plan.launchPrice)} billed once for ${plan.months} months`}
                  </p>
                  {savings > 0 && (
                    <p className="mt-1 text-xs font-black text-[#1d9e75]">
                      You save {money(savings)}
                    </p>
                  )}

                  {/* Promise / tagline */}
                  <p className="mt-4 text-sm font-semibold leading-6 text-[#31443a]">
                    {plan.promise}
                  </p>

                  {/* Usage limits */}
                  <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-[#f7f4ee] px-3 py-2">
                    <Clock className="h-3.5 w-3.5 text-[#1d9e75]" />
                    <p className="text-xs font-bold text-[#31443a]">{plan.limits}</p>
                  </div>

                  {/* Features */}
                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-xs font-medium leading-5 text-[#31443a]">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1d9e75]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={pricingCheckoutPath(plan.id)}
                  data-testid="upsc-pricing-plan-select"
                  className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-sm font-black transition-all duration-200 ${
                    isActivePlan
                      ? "bg-[#1d9e75]/20 text-[#085041] pointer-events-none border border-[#1d9e75]/30"
                      : isRecommended
                      ? "bg-[#1a3a2a] text-white hover:bg-[#10291d] shadow-sm"
                      : "border-2 border-[#1a3a2a] text-[#1a3a2a] hover:bg-[#1a3a2a] hover:text-white"
                  }`}
                >
                  {isActivePlan ? "✓ Current Plan" : pricingPlanIntentLabel(plan.title)}{" "}
                  {!isActivePlan && <ArrowRight className="ml-2 h-4 w-4" />}
                </Link>
              </article>
            );
          })}
        </section>

        {/* Collapsible Section 1: Discount Proof (Minimalist) */}
        <section data-testid="upsc-pricing-discount-proof" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsDiscountProofOpen(!isDiscountProofOpen)}
            className="flex w-full items-center justify-between font-black text-[#13251d]"
          >
            <span className="flex items-center gap-2 text-base">
              <BadgeIndianRupee className="h-4 w-4 text-[#1d9e75]" />
              Discount Matrix Math (Click to reveal details)
            </span>
            {isDiscountProofOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {isDiscountProofOpen && (
            <div className="mt-4 space-y-2 border-t border-[#e8e2d5] pt-4">
              <p className="text-xs font-semibold text-[#5d675f] mb-3">
                Transparent math explaining effective pricing calculations from base values:
              </p>
              {productPricingPlans
                .filter((p) => p.cycle === selectedCycle)
                .map((plan) => {
                  const savings = plan.listPrice - plan.launchPrice;
                  return (
                    <div
                      key={plan.id}
                      data-testid="upsc-pricing-proof-row"
                      data-plan-id={plan.id}
                      data-duration-months={plan.months}
                      data-monthly-base={plan.listPrice / plan.months}
                      data-list-price={plan.listPrice}
                      data-launch-price={plan.launchPrice}
                      data-savings={savings}
                      className="grid gap-2 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-xs font-semibold text-[#31443a] md:grid-cols-[1fr_1fr_1fr] md:items-center"
                    >
                      <span className="font-black text-[#13251d]">{plan.title} ({plan.cycle})</span>
                      <span>
                        Base: {money(plan.listPrice / plan.months)} x {plan.months}m = {money(plan.listPrice)} list
                      </span>
                      <span>
                        Pay {money(plan.launchPrice)} (Saves {money(savings)} / {plan.discountPercent}% off)
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Collapsible Section 2: Platform Inclusions */}
        <section data-testid="upsc-pricing-inclusions" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsInclusionsOpen(!isInclusionsOpen)}
            className="flex w-full items-center justify-between font-black text-[#13251d]"
          >
            <span className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-[#1d9e75]" />
              Core UPSC Engine Inclusions (Click to reveal details)
            </span>
            {isInclusionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {isInclusionsOpen && (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 border-t border-[#e8e2d5] pt-4">
              {[
                {
                  title: "Systematic subject path",
                  detail: "GS subjects follow syllabus demand, PYQ anchors, 10-year trend maps, and NCERT basics.",
                  icon: Route,
                },
                {
                  title: "Daily planner loop",
                  detail: "Structured classes based around recall checks, talk exercises, and practice questions.",
                  icon: CalendarDays,
                },
                {
                  title: "Syllabus and PYQ library",
                  detail: "GS preloads and optional subject papers mapped cleanly against official UPSC references.",
                  icon: LibraryBig,
                },
                {
                  title: "AI discussion path",
                  detail: "Talk rooms, verbal correction prompts, and diagnostic feedback are built directly in.",
                  icon: BrainCircuit,
                },
              ].map((block) => (
                <article key={block.title} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                    <block.icon className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-black tracking-tight">{block.title}</h4>
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[#5d675f]">{block.detail}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Collapsible Section 3: Launch Rules & Roadmap Status */}
        <section data-testid="upsc-pricing-operating-rules" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsLaunchRulesOpen(!isLaunchRulesOpen)}
            className="flex w-full items-center justify-between font-black text-[#13251d]"
          >
            <span className="flex items-center gap-2 text-base">
              <FolderTree className="h-4 w-4 text-[#1d9e75]" />
              Pilot Launch Rules & Roadmap (Click to reveal details)
            </span>
            {isLaunchRulesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {isLaunchRulesOpen && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2 border-t border-[#e8e2d5] pt-4">
              <div className="grid gap-2">
                {[
                  "Monthly remains starting from ₹399 for pilot low-friction validation.",
                  "Yearly option billing contains a built-in 15% discount for a complete UPSC prep cycle.",
                  "Upgrades/downgrades take effect instantly, calculating credit values dynamically.",
                  publicCommerceLaunchBoundary.gateSummary,
                ].map((rule) => (
                  <p key={rule} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-xs font-semibold text-[#31443a]">
                    {rule}
                  </p>
                ))}
              </div>
              
              <div className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-[#085041]">Ready Database Anchors</h4>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      ["Yearly windows", yearlyPlannerBlocks.length],
                      ["GS PYQ rows", syllabusPyqRegistrySummary.gsPyqRows],
                      ["Optional PYQ rows", syllabusPyqRegistrySummary.optionalPyqRows],
                      ["Optional subjects", optionalSubjects.length],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-white/70 p-3">
                        <p className="text-[9px] font-black uppercase text-[#085041]/70">{label}</p>
                        <p className="mt-0.5 text-lg font-black text-[#13251d]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/upsc/yearly-planner" className="inline-flex min-h-9 items-center rounded-md bg-[#1a3a2a] px-3 py-1.5 text-xs font-black text-white hover:bg-[#10291d] transition">
                    Yearly planner
                  </Link>
                  <Link href="/upsc/source-library" className="inline-flex min-h-9 items-center rounded-md border border-[#1a3a2a] px-3 py-1.5 text-xs font-black text-[#1a3a2a] hover:bg-[#1a3a2a]/5 transition">
                    Source library
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
        
      </div>
    </main>
  );
}
