import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  FileText,
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
} from "@/lib/upsc/yearlyPlanner";
import { getOptionalSourcePack, syllabusPyqRegistrySummary } from "@/lib/upsc/syllabusPyqRegistry";

function statusTone(status: string) {
  if (status === "ready") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "building") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#f8f2e8] text-[#34453b]";
}

export function UpscYearlyPlanner() {
  const monthly = productPricingPlans[0];
  const optionalGroups = optionalSubjects.reduce<Record<string, number>>((groups, subject) => {
    groups[subject.group] = (groups[subject.group] ?? 0) + 1;
    return groups;
  }, {});

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
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
                The product plan now binds the yearly subject sequence, PYQ preload target, optional-subject catalog,
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
                ["Monthly base", `Rs ${monthly.launchPrice}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="upsc-pricing-ladder" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {productPricingPlans.map((plan) => (
            <article key={plan.id} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                  <BadgeIndianRupee className="h-4 w-4" />
                </div>
                <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">
                  {plan.discountPercent}% off
                </Badge>
              </div>
              <h2 className="mt-4 text-xl font-black tracking-tight">{plan.title}</h2>
              <p className="mt-1 text-3xl font-black">Rs {plan.launchPrice}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#746f66]">
                List Rs {plan.listPrice} / Rs {plan.effectiveMonthly} effective monthly
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">{plan.audience}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-[#31443a]">{plan.promise}</p>
            </article>
          ))}
        </section>

        <section data-testid="upsc-yearly-timeline" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Yearly planner</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Subject sequence from June to revision command</h2>
            </div>
            <CalendarDays className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3">
            {yearlyPlannerBlocks.map((block, index) => (
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

        <section data-testid="upsc-gs-coverage" className="grid gap-3 xl:grid-cols-2">
          {coreSubjectBlueprints.map((subject) => (
            <article key={subject.slug} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                    {subject.plannerWindow} / {subject.totalDays} days
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">{subject.title}</h2>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-[#746f66]">
                    {subject.primaryPaper}
                  </p>
                </div>
                <Link href={subject.route} className="inline-flex min-h-9 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white">
                  Open
                </Link>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">{subject.syllabusDemand}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {subject.coverageLayers.map((layer) => (
                  <span key={layer} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#31443a]">
                    {layer}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="rounded-md bg-[#e7f5ee] p-3 text-xs font-bold leading-5 text-[#085041]">{subject.pyqPreloadTarget}</p>
                <p className="rounded-md bg-[#fff4df] p-3 text-xs font-bold leading-5 text-[#6f4a12]">{subject.currentAffairsRule}</p>
              </div>
            </article>
          ))}
        </section>

        <section data-testid="upsc-product-engine" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Product engine</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Feature readiness against the three-day vision</h2>
            </div>
            <Target className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {productEngineFeatures.map((feature) => (
              <article key={feature.title} className={`rounded-lg border p-4 ${statusTone(feature.status)}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.14em]">{feature.status}</span>
                </div>
                <h3 className="text-base font-black tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] opacity-80">{feature.ownerSurface}</p>
                <p className="mt-2 text-sm font-semibold leading-6">{feature.studentOutcome}</p>
              </article>
            ))}
          </div>
        </section>

        <section data-testid="upsc-optional-summary" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Optional subjects</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">All optional pages are seeded</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">
                Each optional has a route target for Paper I, Paper II, year-wise PYQs, syllabus demand, trend map,
                and the same recall-first discussion loop.
              </p>
              <Link href="/upsc/optional-subjects" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white">
                Open optional catalog <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(optionalGroups).map(([group, count]) => (
                <div key={group} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{group}</p>
                  <p className="mt-1 text-3xl font-black">{count}</p>
                  <p className="mt-1 text-xs font-bold text-[#746f66]">Paper I and Paper II route pages</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="upsc-source-library-link" className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <LibraryBig className="h-5 w-5 text-[#085041]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                  Syllabus and PYQ preload ledger
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Official source rows are now inside the product.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                {syllabusPyqRegistrySummary.gsPyqRows} GS rows and {syllabusPyqRegistrySummary.optionalPyqRows} optional Paper I/II rows
                are seeded against official UPSC anchors. The remaining work is PDF text extraction and topic mapping.
              </p>
            </div>
            <Link href="/upsc/source-library" className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white">
              Open source library <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <section data-testid="upsc-three-day-launch" className="grid gap-3 lg:grid-cols-3">
          {threeDayLaunchItems.map((item) => (
            <article key={item.day} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{item.day}</p>
                  <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
                </div>
              </div>
              <ul className="space-y-2">
                {item.mustShip.map((task) => (
                  <li key={task} className="flex gap-2 text-sm font-semibold leading-6 text-[#49675e]">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#1d9e75]" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-md bg-[#f7f4ee] p-3 text-xs font-black uppercase tracking-[0.1em] text-[#31443a]">
                Proof: {item.proof}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#1a3a2a]" />
            <h2 className="text-lg font-black tracking-tight">Official source anchors</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {officialUpscSourceLinks.map((source) => (
              <a key={source.href} href={source.href} className="rounded-md border border-[#dcd5c7] px-3 py-2 text-xs font-black text-[#1a3a2a]">
                {source.title}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

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
