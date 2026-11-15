"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers3,
  Lock,
  Route,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  coreSubjectBlueprints,
  optionalSubjects,
  productPricingPlans,
  getDynamicYearlyPlannerBlocks,
} from "@/lib/upsc/yearlyPlanner";
import { OPTIONAL_SUBJECTS } from "@/lib/upsc/optionalSubjectsCatalog";
import { getOptionalSourcePack } from "@/lib/upsc/syllabusPyqRegistry";
import { isOperatorRoute, lockedSubjectNavItems } from "@/lib/navigation/studentNav";
import { publicCommerceLaunchBoundary } from "@/lib/upsc/publicCommerceLaunchBoundary";
import { useDashboardData } from "@/hooks/useDashboardData";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
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
  const liveOptionalCount = OPTIONAL_SUBJECTS.filter((subject) => subject.status === "available").length;
  const lockedRoutes = new Set(lockedSubjectNavItems.map((item) => item.href));

  // Collapsible section states for a minimalist dashboard
  const [isBlueprintsOpen, setIsBlueprintsOpen] = useState(false);
  const [isOptionalsOpen, setIsOptionalsOpen] = useState(false);

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
                {publicCommerceLaunchBoundary.readyForPayment
                  ? "Active Subscription status"
                  : "Selected plan (pilot)"}
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#13251d] capitalize">
                {currentPlanId} Plan
                <span className="ml-2 text-sm font-semibold text-[#085041]/75">
                  ({currentPlanCycle === "monthly" ? "Billed Monthly" : `${currentPlanCycle} cycle`})
                </span>
              </h2>
              <p className="mt-1 text-xs font-semibold text-[#49675e]">
                {publicCommerceLaunchBoundary.readyForPayment
                  ? "Pilot pricing of "
                  : "Plan intent recorded. No payment has been collected. Pilot rate of "}
                {money(activePlanPrice)} reserved.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/upsc/pricing"
                className="rounded-lg border border-[#1a3a2a] bg-white px-4 py-2 text-xs font-black text-[#1a3a2a] hover:bg-[#1a3a2a]/5 transition"
              >
                {publicCommerceLaunchBoundary.readyForPayment ? "Manage / Upgrade Subscription" : "Review pilot plans"}
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
                UPSC yearly map
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
                One sequence, one open beta, one revision loop.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                This is the target subject sequence for the full GS syllabus, in the order the
                product plans to cover it. Only Geography is open in this beta; every other
                window is marked In preparation and unlocks as reviewed content ships. Today&apos;s
                plan turns the sequence into the next action.
              </p>
              <Link href="/upsc/geography/lms/planner" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white">
                Open Today&apos;s plan <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["GS sequence", plannerBlocks.length - 1],
                ["Optional catalogued", OPTIONAL_SUBJECTS.length],
                ["Live optional workspaces", liveOptionalCount],
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
              <h2 className="mt-1 text-2xl font-black tracking-tight">Target subject sequence and revision command</h2>
              <p className="mt-1 text-xs font-semibold text-[#5d675f]">
                Windows are a planning target. Only blocks marked Open in beta contain authored study content today.
              </p>
            </div>
            <CalendarDays className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3">
            {plannerBlocks.map((block, index) => {
              const isOpen = !lockedRoutes.has(block.route) && !isOperatorRoute(block.route);
              const cardContent = (
                <>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      {String(index + 1).padStart(2, "0")} / {block.window}
                    </p>
                    <h3 className="mt-1 text-lg font-black">{block.title}</h3>
                    <p className="text-xs font-bold text-[#746f66]">{block.days}</p>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${
                        isOpen
                          ? "bg-[#e7f5ee] text-[#085041]"
                          : "border border-[#dcd5c7] bg-[#faf6ee] text-[#8a7a52]"
                      }`}
                    >
                      {isOpen ? "Open in beta" : <><Lock className="h-2.5 w-2.5" /> In preparation</>}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#49675e]">{block.focus}</p>
                  <p className="text-sm font-semibold leading-6 text-[#31443a]">{block.output}</p>
                  {isOpen ? (
                    <ArrowRight className="hidden h-5 w-5 text-[#1a3a2a] md:block" />
                  ) : (
                    <Lock className="hidden h-5 w-5 text-[#b8ae98] md:block" />
                  )}
                </>
              );

              return isOpen ? (
                <Link
                  key={`${block.window}-${block.title}`}
                  href={block.route}
                  className="grid gap-3 rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 transition hover:border-[#1d9e75] md:grid-cols-[0.7fr_1fr_1.1fr_auto] md:items-center"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={`${block.window}-${block.title}`}
                  aria-disabled="true"
                  className="grid gap-3 rounded-lg border border-[#e8e2d5] bg-[#f7f4ee] p-4 md:grid-cols-[0.7fr_1fr_1.1fr_auto] md:items-center"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </section>

        {/* Where progress actually lives (server-backed LMS) */}
        <section data-testid="upsc-student-recent-progress" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Progress</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">What you have done and what is due</h2>
            <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-[#5d675f]">
              This page is the yearly sequence. Completed topics, due Day 3/7/21 revisits, and
              the next action are recorded on the server-backed LMS pages, not in this static map.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/upsc/geography/lms/planner"
              className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4 transition hover:border-[#1d9e75]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">Today&apos;s plan</p>
              <h3 className="mt-1 text-base font-black text-[#13251d]">Sequence and due revisits</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#49675e]">
                See the next topic action, Day 3/7/21 revisits, and topics currently due for repair.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#085041]">
                Open plan <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link
              href="/upsc/geography/lms/gaps"
              className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 transition hover:border-[#1d9e75]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Readiness</p>
              <h3 className="mt-1 text-base font-black text-[#13251d]">Demand-weighted gaps</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">
                See what UPSC asks, what you have covered, and the tested topics that need another pass.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#1a3a2a]">
                Open readiness <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
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
              {coreSubjectBlueprints.map((subject) => {
                const blueprintIsOpen = !lockedRoutes.has(subject.route) && !isOperatorRoute(subject.route);
                return (
                <article key={subject.slug} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase text-[#1d9e75]">
                        {subject.plannerWindow} / {subject.totalDays} days
                      </p>
                      <h4 className="mt-0.5 text-base font-black">{subject.title}</h4>
                      <p className="text-[10px] font-black uppercase text-[#746f66]">{subject.primaryPaper}</p>
                    </div>
                    {blueprintIsOpen ? (
                      <Link href={subject.route} className="inline-flex min-h-8 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white hover:bg-[#10291d] transition">
                        Open
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#dcd5c7] bg-[#faf6ee] px-3 text-[10px] font-black uppercase tracking-[0.08em] text-[#8a7a52]"
                      >
                        <Lock className="h-3 w-3" /> In preparation
                      </span>
                    )}
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
                );
              })}
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
              <h3 className="text-lg">Optional subject catalog ({isOptionalsOpen ? "Hide" : "Show"})</h3>
            </div>
            {isOptionalsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {isOptionalsOpen && (
            <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] border-t border-[#e8e2d5] pt-5">
              <div>
                <h4 className="text-base font-black">
                  {OPTIONAL_SUBJECTS.length} subjects catalogued, {liveOptionalCount} with reviewed
                  content
                </h4>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-[#5d675f]">
                  Geography is the only optional with reviewed syllabus notes, PYQs and practice
                  today. The remaining {OPTIONAL_SUBJECTS.length - liveOptionalCount} — Anthropology
                  and Sociology included — are catalogued with an honest coming-soon status and
                  unlock as their material is authored and reviewed.
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
            Only Geography has reviewed optional content today. The other 24 — Anthropology and
            Sociology included — are catalogued with an honest coming-soon status; the live catalog
            at /upsc/optional-subjects is the entry point.
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
