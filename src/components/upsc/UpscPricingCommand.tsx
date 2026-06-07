import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderTree,
  LibraryBig,
  Route,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  coreSubjectBlueprints,
  optionalSubjects,
  pricingCheckoutPath,
  productPricingPlans,
  recommendedProductPlanId,
  yearlyPlannerBlocks,
} from "@/lib/upsc/yearlyPlanner";
import { syllabusPyqRegistrySummary } from "@/lib/upsc/syllabusPyqRegistry";

function money(value: number) {
  return `Rs ${value.toLocaleString("en-IN")}`;
}

const planHighlights: Record<string, string[]> = {
  monthly: ["Start with one active subject", "Access daily planner and source library", "Upgrade when the student is confident"],
  yearly: ["One full UPSC cycle", "Best for June-to-revision path", "Includes GS and optional catalog access"],
  "eighteen-month": ["Best launch recommendation", "Covers prelims, mains, and recovery months", "Lower pressure for late starters"],
  "three-year": ["Foundation learner track", "Lowest effective monthly cost", "Best for college and long-cycle students"],
};

const inclusionBlocks = [
  {
    title: "Systematic subject path",
    detail: "GS subjects follow syllabus, PYQ, 10-year trend, NCERT basics, reference depth, and current-affairs hooks.",
    icon: Route,
  },
  {
    title: "Daily planner loop",
    detail: "Each day is designed around recall, Watch, Talk, MCQ, Track, and Revisit instead of random content consumption.",
    icon: CalendarDays,
  },
  {
    title: "Syllabus and PYQ library",
    detail: "Official UPSC anchors, GS source rows, and optional Paper I/II ledgers are visible inside the product.",
    icon: LibraryBig,
  },
  {
    title: "AI discussion path",
    detail: "Talk-room scoring and doubt loops are part of the product design; full AI depth remains the next production pass.",
    icon: BrainCircuit,
  },
];

export function UpscPricingCommand() {
  const monthly = productPricingPlans.find((plan) => plan.id === "monthly") ?? productPricingPlans[0];
  const recommendedPlanId = recommendedProductPlanId;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        <section
          data-testid="upsc-pricing-hero"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                UPSC pricing command
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                Simple plans built from Rs 399 per month.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                The commercial layer now mirrors the product vision: monthly validation, yearly UPSC cycle,
                18-month recovery depth, and three-year foundation coverage with transparent discount math.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Base monthly", money(monthly.launchPrice)],
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

        <section data-testid="upsc-pricing-plans" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {productPricingPlans.map((plan) => {
            const savings = plan.listPrice - plan.launchPrice;
            const isRecommended = plan.id === recommendedPlanId;

            return (
              <article
                key={plan.id}
                data-testid="upsc-pricing-plan"
                data-plan-id={plan.id}
                data-months={plan.months}
                data-list-price={plan.listPrice}
                data-launch-price={plan.launchPrice}
                data-discount-percent={plan.discountPercent}
                data-effective-monthly={plan.effectiveMonthly}
                className={`rounded-lg border p-4 shadow-sm ${
                  isRecommended ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#dcd5c7] bg-[#fffdf8]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                    <BadgeIndianRupee className="h-4 w-4" />
                  </div>
                  <Badge className={`rounded-md px-2 py-1 ${isRecommended ? "bg-[#085041]" : "bg-[#1a3a2a]"} text-white`}>
                    {isRecommended ? "Recommended" : `${plan.discountPercent}% off`}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    {plan.months} {plan.months === 1 ? "month" : "months"}
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">{plan.title}</h2>
                  <p className="mt-2 text-3xl font-black">{money(plan.launchPrice)}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#746f66]">
                    {money(plan.effectiveMonthly)} effective monthly
                  </p>
                </div>
                <div className="mt-4 rounded-md border border-[#dcd5c7] bg-white/70 p-3">
                  <p className="text-xs font-black text-[#31443a]">
                    List price {money(plan.listPrice)}. Student saves {money(savings)}.
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">{plan.promise}</p>
                </div>
                <ul className="mt-4 space-y-2">
                  {(planHighlights[plan.id] ?? []).map((highlight) => (
                    <li key={highlight} className="flex gap-2 text-xs font-bold leading-5 text-[#31443a]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={pricingCheckoutPath(plan.id)}
                  data-testid="upsc-pricing-plan-select"
                  className={`mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md px-3 text-sm font-black transition ${
                    isRecommended
                      ? "bg-[#085041] text-white hover:bg-[#06392e]"
                      : "bg-[#1a3a2a] text-white hover:bg-[#10291d]"
                  }`}
                >
                  Select {plan.title} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </section>

        <section data-testid="upsc-pricing-inclusions" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Included layer</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Every plan carries the same core UPSC engine</h2>
            </div>
            <ShieldCheck className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {inclusionBlocks.map((block) => (
              <article key={block.title} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                  <block.icon className="h-4 w-4" />
                </div>
                <h3 className="text-base font-black tracking-tight">{block.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{block.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section data-testid="upsc-pricing-operating-rules" className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <div className="mb-4 flex items-center gap-3">
              <FolderTree className="h-5 w-5 text-[#1a3a2a]" />
              <h2 className="text-xl font-black tracking-tight">Launch rules</h2>
            </div>
            <div className="grid gap-3">
              {[
                "Monthly remains Rs 399 for low-friction testing.",
                "Yearly is priced below 12 separate monthly payments for one UPSC cycle.",
                "18-month plan is the recommended recovery window for prelims-to-mains continuity.",
                "Three-year plan is the deepest discount for foundation learners.",
                "Checkout intent is now captured through a local plan handoff; payment gateway can attach later without changing the plan math.",
              ].map((rule) => (
                <p key={rule} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-sm font-semibold leading-6 text-[#31443a]">
                  {rule}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7">
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#085041]" />
              <h2 className="text-xl font-black tracking-tight text-[#085041]">Readiness snapshot</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Yearly windows", yearlyPlannerBlocks.length],
                ["GS PYQ rows", syllabusPyqRegistrySummary.gsPyqRows],
                ["Optional PYQ rows", syllabusPyqRegistrySummary.optionalPyqRows],
                ["Optional pages", optionalSubjects.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#b9d9cd] bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/upsc/yearly-planner" className="inline-flex min-h-10 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white">
                Yearly planner <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/upsc/source-library" className="inline-flex min-h-10 items-center rounded-md border border-[#1a3a2a] px-4 text-sm font-black text-[#1a3a2a]">
                Source library
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
