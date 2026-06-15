"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Gauge,
  Layers3,
  LibraryBig,
  Route,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  coreSubjectBlueprints,
  officialUpscSourceLinks,
  optionalSubjects,
  productEngineFeatures,
  productPricingPlans,
  threeDayLaunchItems,
  yearlyPlannerBlocks,
  getDynamicYearlyPlannerBlocks,
} from "@/lib/upsc/yearlyPlanner";
import { getOptionalSourcePack, syllabusPyqRegistrySummary } from "@/lib/upsc/syllabusPyqRegistry";
import {
  prelims2027Priorities,
  strategyReallocationPlan,
  strategySprintCalendar,
} from "@/lib/upsc/prelims2027Strategy";
import { useDashboardData } from "@/hooks/useDashboardData";

function statusTone(status: string) {
  if (status === "ready") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "building") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#f8f2e8] text-[#34453b]";
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

const priorityRank: Record<(typeof prelims2027Priorities)[number]["priority"], number> = {
  Critical: 1,
  High: 2,
  Medium: 3,
  Low: 4,
  Minimal: 5,
};

const strategyOverlayRows = prelims2027Priorities
  .map((priority) => ({
    ...priority,
    reallocation: strategyReallocationPlan.find((item) => item.priorityId === priority.id),
  }))
  .sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority]);

/**********************************************************************************
 * Priority Color Tone Helper
 **********************************************************************************/
function priorityTone(priority: (typeof prelims2027Priorities)[number]["priority"]) {
  if (priority === "Critical") return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
  if (priority === "High") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  if (priority === "Medium") return "border-[#1f5d8f] bg-[#eef5ff] text-[#1f5d8f]";
  if (priority === "Low") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  return "border-[#dcd5c7] bg-[#f7f4ee] text-[#5d675f]";
}

/**********************************************************************************
 * Primary UpscYearlyPlanner Component
 **********************************************************************************/
export function UpscYearlyPlanner() {
  const { profile } = useDashboardData();
  const plannerBlocks = getDynamicYearlyPlannerBlocks(profile);
  const optionalGroups = optionalSubjects.reduce<Record<string, number>>((groups, subject) => {
    groups[subject.group] = (groups[subject.group] ?? 0) + 1;
    return groups;
  }, {});

  // Collapsible section states for a minimalist dashboard
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isBlueprintsOpen, setIsBlueprintsOpen] = useState(false);
  const [isEngineOpen, setIsEngineOpen] = useState(false);
  const [isOptionalsOpen, setIsOptionalsOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLaunchOpen, setIsLaunchOpen] = useState(false);

  const currentPlanId = profile?.subscriptionPlanId ?? "foundation";
  const currentPlanCycle = profile?.billingCycle ?? "monthly";
  const activePlanPrice = productPricingPlans.find(
    (p) => p.tier === currentPlanId && p.cycle === currentPlanCycle
  )?.launchPrice ?? 399;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        
        {/* Active subscription summary displaying current plan */}
        <section className="rounded-xl border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#085041]">
                Active Subscription status
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#13251d] capitalize">
                {currentPlanId} Plan
                <span className="ml-2 text-sm font-semibold text-[#085041]/75">
                  ({currentPlanCycle === "monthly" ? "Billed Monthly" : `${currentPlanCycle} cycle`})
                </span>
              </h2>
              <p className="mt-1 text-xs font-semibold text-[#49675e]">
                Pilot pricing of {money(activePlanPrice)} active. Includes: {currentPlanId === "ultimate" ? "Unlimited AI hours" : currentPlanId === "pro" ? "6 hours AI" : currentPlanId === "plus" ? "3 hours AI" : "1 hour daily AI interaction"}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/upsc/pricing"
                className="rounded-lg border border-[#1a3a2a] bg-white px-4 py-2 text-xs font-black text-[#1a3a2a] hover:bg-[#1a3a2a]/5 transition"
              >
                Manage / Upgrade Subscription
              </Link>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section
          data-testid="upsc-yearly-planner-hero"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                UPSC yearly command
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
                One path, one price ladder, one student loop.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                The product plan binds the yearly subject sequence, PYQ preload target, optional-subject catalog,
                pricing, gap analysis, revision, reports, and AI discussion loop into one visible operating map.
              </p>
              <Link href="/upsc/pricing" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white">
                Open pricing command <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["GS subjects", coreSubjectBlueprints.length],
                ["Optional pages", optionalSubjects.length],
                ["Current Plan Price", money(activePlanPrice)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Subject Calendar (Open by default since it is the yearly timeline) */}
        <section data-testid="upsc-yearly-timeline" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Yearly planner</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Subject sequence from June to revision command</h2>
            </div>
            <CalendarDays className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3">
            {plannerBlocks.map((block, index) => (
              <Link
                key={`${block.window}-${block.title}`}
                href={block.route}
                className="grid gap-3 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 transition hover:border-[#1d9e75] md:grid-cols-[0.7fr_1fr_1.1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                    {String(index + 1).padStart(2, "0")} / {block.window}
                  </p>
                  <h3 className="mt-1 text-lg font-black">{block.title}</h3>
                  <p className="text-xs font-bold text-[#746f66]">{block.days}</p>
                </div>
                <p className="text-sm font-semibold leading-6 text-[#49675e]">{block.focus}</p>
                <p className="text-sm font-semibold leading-6 text-[#31443a]">{block.output}</p>
                <ArrowRight className="hidden h-5 w-5 text-[#1a3a2a] md:block" />
              </Link>
            ))}
          </div>
        </section>

        {/* Collapsible Section 1: 2027 Strategy Overlay */}
        <section
          id="upsc-2027-strategy-overlay"
          data-testid="upsc-2027-strategy-overlay"
          data-priority-count={strategyOverlayRows.length}
          data-sprint-count={strategySprintCalendar.length}
          className="rounded-lg border border-[#b9d9cd] bg-[#fffdf8] p-4 shadow-sm"
        >
          <button
            type="button"
            onClick={() => setIsStrategyOpen(!isStrategyOpen)}
            className="flex w-full items-center justify-between text-left font-black text-[#13251d]"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">2027 correction overlay</p>
              <h3 className="text-lg">2027 Strategic Reallocations & Sprints ({isStrategyOpen ? "Hide" : "Show"})</h3>
            </div>
            {isStrategyOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {isStrategyOpen && (
            <div className="mt-5 border-t border-[#e8e2d5] pt-5">
              <p className="text-sm font-semibold leading-6 text-[#5d675f] mb-4">
                This layer marks course corrections: build IR and new-domain S&T first, patch legal-current, 
                keep Economy in maintenance, and cap Medieval expansion. Proof locked under official source anchors.
              </p>
              
              <div className="grid gap-3 md:grid-cols-4 mb-5">
                {[
                  ["Critical rebuilds", strategyOverlayRows.filter((row) => row.priority === "Critical").length],
                  ["High-priority patch", strategyOverlayRows.filter((row) => row.priority === "High").length],
                  ["12-week sprints", strategySprintCalendar.length],
                  ["Release gate", "Proof locked"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                    <p className="mt-0.5 text-xl font-black text-[#13251d]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="grid gap-3">
                  {strategyOverlayRows.map((row) => (
                    <article
                      key={row.id}
                      data-testid="upsc-2027-strategy-priority-row"
                      data-priority-id={row.id}
                      data-priority={row.priority}
                      data-decision={row.reallocation?.decision ?? "Plan"}
                      className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#746f66]">
                            {row.window}
                          </p>
                          <h4 className="mt-0.5 text-base font-black tracking-tight text-[#13251d]">{row.subject}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${priorityTone(row.priority)}`}>
                            {row.priority}
                          </span>
                          <span className="rounded border border-[#dcd5c7] bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#31443a]">
                            {row.reallocation?.decision ?? "Plan"}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-semibold leading-relaxed text-[#5d675f]">{row.action}</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <p className="rounded border border-[#dcd5c7] bg-white p-2.5 text-[11px] font-bold text-[#31443a]">
                          <span className="font-black text-[#13251d]">Shift:</span> {row.reallocation?.allocation ?? row.evidence}
                        </p>
                        <p className="rounded border border-[#dcd5c7] bg-white p-2.5 text-[11px] font-bold text-[#31443a]">
                          <span className="font-black text-[#13251d]">Target:</span> {row.reallocation?.mcqTarget ?? row.action}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="text-base font-black text-[#13251d]">12-week Sprint Phase Order</h4>
                    <Gauge className="h-4 w-4 text-[#1a3a2a]" />
                  </div>
                  <div className="grid gap-2">
                    {strategySprintCalendar.map((sprint) => (
                      <Link
                        key={sprint.id}
                        href={sprint.route}
                        data-testid="upsc-2027-strategy-sprint-row"
                        data-sprint-id={sprint.id}
                        className="rounded-lg border border-[#dcd5c7] bg-white p-3 transition hover:border-[#1d9e75]"
                      >
                        <p className="text-[9px] font-black uppercase text-[#1d9e75]">
                          {sprint.window} / {sprint.phase}
                        </p>
                        <h5 className="mt-0.5 text-xs font-black text-[#13251d]">{sprint.title}</h5>
                        <p className="mt-1 text-[11px] font-semibold text-[#5d675f]">{sprint.focus}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Collapsible Section 2: GS Coverage Subject Blueprints */}
        <section data-testid="upsc-gs-coverage" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsBlueprintsOpen(!isBlueprintsOpen)}
            className="flex w-full items-center justify-between text-left font-black text-[#13251d]"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">GS blueprints</p>
              <h3 className="text-lg">Core GS Subject Blueprints & Coverage ({isBlueprintsOpen ? "Hide" : "Show"})</h3>
            </div>
            {isBlueprintsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {isBlueprintsOpen && (
            <div className="mt-5 grid gap-3 xl:grid-cols-2 border-t border-[#e8e2d5] pt-5">
              {coreSubjectBlueprints.map((subject) => (
                <article key={subject.slug} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase text-[#1d9e75]">
                        {subject.plannerWindow} / {subject.totalDays} days
                      </p>
                      <h4 className="mt-0.5 text-base font-black">{subject.title}</h4>
                      <p className="text-[10px] font-black uppercase text-[#746f66]">{subject.primaryPaper}</p>
                    </div>
                    <Link href={subject.route} className="inline-flex min-h-8 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white hover:bg-[#10291d] transition">
                      Open
                    </Link>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-[#5d675f]">{subject.syllabusDemand}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {subject.coverageLayers.map((layer) => (
                      <span key={layer} className="rounded border border-[#dcd5c7] bg-[#f7f4ee] px-2 py-0.5 text-[9px] font-bold text-[#31443a]">
                        {layer}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Collapsible Section 3: Product Platform Engine Roadmap */}
        <section data-testid="upsc-product-engine" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsEngineOpen(!isEngineOpen)}
            className="flex w-full items-center justify-between text-left font-black text-[#13251d]"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Product engine</p>
              <h3 className="text-lg">Feature Roadmap & Readiness Logs ({isEngineOpen ? "Hide" : "Show"})</h3>
            </div>
            {isEngineOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {isEngineOpen && (
            <div className="mt-5 grid gap-3 md:grid-cols-3 border-t border-[#e8e2d5] pt-5">
              {productEngineFeatures.map((feature) => (
                <article
                  key={feature.title}
                  data-testid="upsc-product-engine-feature"
                  data-feature-title={feature.title}
                  data-feature-status={feature.status}
                  data-owner-surface={feature.ownerSurface}
                  className={`rounded-lg border p-4 ${statusTone(feature.status)}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-wider">{feature.status}</span>
                  </div>
                  <h4 className="text-sm font-black tracking-tight">{feature.title}</h4>
                  <p className="mt-1 text-[10px] font-semibold opacity-75">{feature.ownerSurface}</p>
                  <p className="mt-2 text-xs font-semibold leading-relaxed opacity-90">{feature.studentOutcome}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Collapsible Section 4: Seeded Optional Subject Catalog */}
        <section data-testid="upsc-optional-summary" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsOptionalsOpen(!isOptionalsOpen)}
            className="flex w-full items-center justify-between text-left font-black text-[#13251d]"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Optional subjects</p>
              <h3 className="text-lg">All Optional Subject Seed Catalogs ({isOptionalsOpen ? "Hide" : "Show"})</h3>
            </div>
            {isOptionalsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {isOptionalsOpen && (
            <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] border-t border-[#e8e2d5] pt-5">
              <div>
                <h4 className="text-base font-black">All Optional Seeds Are Configured</h4>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-[#5d675f]">
                  Each subject holds a direct route for Paper I, Paper II, syllabus requirements, trend mapping, 
                  and discussion portals.
                </p>
                <Link href="/upsc/optional-subjects" className="mt-4 inline-flex min-h-9 items-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white hover:bg-[#10291d] transition">
                  Open Optional catalog <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(optionalGroups).map(([group, count]) => (
                  <div key={group} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                    <p className="text-[9px] font-black uppercase text-[#1d9e75]">{group}</p>
                    <p className="mt-0.5 text-xl font-black">{count} subjects</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Collapsible Section 5: Syllabus & PYQ Preload Ledger */}
        <section data-testid="upsc-source-library-link" className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            className="flex w-full items-center justify-between text-left font-black text-[#085041]"
          >
            <span className="flex items-center gap-2">
              <LibraryBig className="h-4 w-4" />
              Syllabus and PYQ Preload Registry Ledger ({isLibraryOpen ? "Hide" : "Show"})
            </span>
            {isLibraryOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {isLibraryOpen && (
            <div className="mt-5 border-t border-[#b9d9cd] pt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between text-[#13251d]">
              <div>
                <h4 className="text-base font-black">Official Source Rows Are Preloaded</h4>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-[#49675e]">
                  {syllabusPyqRegistrySummary.gsPyqRows} GS rows and {syllabusPyqRegistrySummary.optionalPyqRows} optional 
                  Paper I/II rows are seeded against official UPSC anchors.
                </p>
              </div>
              <Link href="/upsc/source-library" className="inline-flex min-h-9 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white hover:bg-[#10291d] transition">
                Open source library <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Collapsible Section 6: Launch Milestones */}
        <section data-testid="upsc-three-day-launch" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIsLaunchOpen(!isLaunchOpen)}
            className="flex w-full items-center justify-between text-left font-black text-[#13251d]"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#1d9e75]" />
              Platform Milestone & Proof Log Checklist ({isLaunchOpen ? "Hide" : "Show"})
            </span>
            {isLaunchOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {isLaunchOpen && (
            <div className="mt-5 grid gap-3 lg:grid-cols-3 border-t border-[#e8e2d5] pt-5">
              {threeDayLaunchItems.map((item) => (
                <article key={item.day} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-[#1d9e75]">{item.day}</span>
                    <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                  </div>
                  <ul className="space-y-1">
                    {item.mustShip.map((task) => (
                      <li key={task} className="flex gap-2 text-xs font-semibold leading-relaxed text-[#49675e]">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1d9e75]" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/**********************************************************************************
 * Exporting Remaining Sub-Components intact
 **********************************************************************************/
export function OptionalSubjectsCatalog() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Optional catalog</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Optional subject command pages</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
            Each subject is seeded as a paper-wise page for syllabus, PYQs, trend, answer-writing themes, and future AI discussion flow.
          </p>
        </section>
        <section data-testid="upsc-optional-catalog" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {optionalSubjects.map((subject) => (
            <Link key={subject.slug} href={subject.route} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm transition hover:border-[#1d9e75]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                  <BookOpenCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{subject.group}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight">{subject.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{subject.preloadTarget}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">Paper I / Paper II</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

export function OptionalSubjectDetail({
  subject,
}: {
  subject: {
    slug: string;
    title: string;
    group: string;
    papers: ["Paper I", "Paper II"];
    preloadTarget: string;
    firstBuildAction: string;
  };
}) {
  const sourcePack = getOptionalSourcePack(subject.slug);
  const yearRows = sourcePack?.yearRows ?? [];
  const paperSummaries = sourcePack?.paperSummary ?? [];
  const syllabusThemes = sourcePack?.syllabusThemes ?? [];
  const assemblyProof = sourcePack?.assemblyProof;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 md:px-8">
        <Link href="/upsc/optional-subjects" className="inline-flex w-fit items-center text-xs font-black uppercase tracking-[0.14em] text-[#1a3a2a]">
          Back to optional catalog
        </Link>
        <section data-testid="upsc-optional-detail" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">{subject.group} optional</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{subject.title}</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">{subject.preloadTarget}</p>
          {sourcePack ? (
            <div
              data-testid="upsc-optional-readiness"
              data-year-count={sourcePack.yearRows.length}
              data-paper-row-count={sourcePack.paperRows.length}
              className="mt-5 grid gap-3 sm:grid-cols-3"
            >
              {[
                ["Readiness", `${sourcePack.readinessScore}%`],
                ["Years", sourcePack.yearRows.length],
                ["Paper rows", sourcePack.paperRows.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {subject.papers.map((paper) => (
              <article key={paper} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                  <Layers3 className="h-4 w-4" />
                </div>
                <h2 className="text-xl font-black">{paper}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                  Build syllabus tree, attach year-wise questions, mark repeated themes, and connect answer-writing prompts.
                </p>
              </article>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#085041]">
              <BrainCircuit className="h-4 w-4" /> First build action
            </div>
            <p className="text-sm font-semibold leading-6 text-[#085041]">{subject.firstBuildAction}</p>
          </div>
        </section>
        {assemblyProof ? (
          <section
            data-testid="upsc-optional-assembly-proof"
            data-year-window={assemblyProof.yearWindow}
            data-total-years={assemblyProof.totalYears}
            data-total-paper-rows={assemblyProof.totalPaperRows}
            data-paper-rows-per-year={assemblyProof.paperRowsPerYear}
            data-source-indexed-years={assemblyProof.sourceIndexedYears}
            data-pending-text-years={assemblyProof.pendingTextYears}
            className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm"
          >
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#085041]" />
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                    Optional PYQ assembly proof
                  </p>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">
                  {assemblyProof.yearWindow} Paper I/II rows are assembled
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                  {assemblyProof.paperStructure}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Years", assemblyProof.totalYears],
                  ["Paper rows", assemblyProof.totalPaperRows],
                  ["Rows per year", assemblyProof.paperRowsPerYear],
                  ["Source-indexed years", assemblyProof.sourceIndexedYears],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-[#b9d9cd] bg-white/75 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">{label}</p>
                    <p className="mt-1 text-xl font-black text-[#13251d]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <p className="rounded-md border border-[#b9d9cd] bg-white/75 p-3 text-xs font-bold leading-5 text-[#085041]">
                Source rule: {assemblyProof.sourceRule}
              </p>
              <p className="rounded-md border border-[#b9d9cd] bg-white/75 p-3 text-xs font-bold leading-5 text-[#085041]">
                Student use: {assemblyProof.studentUse}
              </p>
              <p className="rounded-md border border-[#b9d9cd] bg-white/75 p-3 text-xs font-bold leading-5 text-[#085041]">
                Next import step: {assemblyProof.nextImportStep}
              </p>
            </div>
          </section>
        ) : null}
        {paperSummaries.length ? (
          <section data-testid="upsc-optional-paper-summary" className="grid gap-3 md:grid-cols-2">
            {paperSummaries.map((summary) => (
              <article key={summary.paper} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                <Route className="mb-3 h-5 w-5 text-[#1a3a2a]" />
                <h2 className="text-base font-black">{summary.paper} source status</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                  {summary.indexedRows}/{summary.totalRows} years source-indexed. {summary.pendingRows} years still need text extraction.
                </p>
                <p className="mt-3 rounded-md bg-[#f7f4ee] p-3 text-xs font-bold leading-5 text-[#31443a]">
                  {summary.nextAction}
                </p>
              </article>
            ))}
          </section>
        ) : null}
        {syllabusThemes.length ? (
          <section data-testid="upsc-optional-syllabus-themes" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Syllabus demand</p>
              <h2 className="mt-1 text-xl font-black tracking-tight">Paper-wise theme map</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {syllabusThemes.map((theme) => (
                <article key={theme.id} className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4">
                  <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">{theme.paper}</Badge>
                  <h3 className="mt-3 text-lg font-black tracking-tight">{theme.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{theme.syllabusDemand}</p>
                  <div className="mt-3 grid gap-2">
                    <p className="rounded-md bg-[#e7f5ee] p-3 text-xs font-bold leading-5 text-[#085041]">
                      Trend use: {theme.trendUse}
                    </p>
                    <p className="rounded-md bg-[#fff4df] p-3 text-xs font-bold leading-5 text-[#6f4a12]">
                      Answer use: {theme.answerWritingUse}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {sourcePack ? (
          <section data-testid="upsc-optional-year-wise-pyqs" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                  Year-wise paper rows
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  {sourcePack.paperRows.length} Paper I/II source rows seeded across {sourcePack.yearRows.length} years
                </h2>
              </div>
              <Link href="/upsc/source-library" className="inline-flex min-h-9 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white">
                Source library
              </Link>
            </div>
            <div className="grid gap-2">
              {yearRows.map((row) => (
                <article
                  key={row.year}
                  data-testid="upsc-optional-year-row"
                  data-year={row.year}
                  data-indexed-count={row.indexedCount}
                  className="rounded-md border border-[#dcd5c7] bg-[#fdfaf3] p-3"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-black">{row.year}</span>
                    <span className="rounded-md border border-[#dcd5c7] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#31443a]">
                      {row.indexedCount}/{row.importCount} source-indexed
                    </span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {[row.paperI, row.paperII].map((paperRow) => (
                      <a
                        key={paperRow.paper}
                        href={paperRow.sourceHref}
                        className="rounded-md border border-[#dcd5c7] bg-white p-3"
                      >
                        <p className="text-xs font-semibold leading-5 text-[#31443a]">{paperRow.paper}</p>
                        <span className="mt-2 inline-flex rounded-md border border-[#ef9f27] bg-[#fff4df] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#6f4a12]">
                          {paperRow.status === "text-import-pending" ? "Text import pending" : "Source indexed"}
                        </span>
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
