import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Database,
  ExternalLink,
  FileSearch,
  Layers3,
  LockKeyhole,
  Rows3,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type GeographyDay1SourceStatus = "ready-to-adapt" | "supporting" | "founder-required";

const geographyDay1SourceStatusLabels: Record<GeographyDay1SourceStatus, string> = {
  "ready-to-adapt": "Ready to adapt",
  supporting: "Supporting",
  "founder-required": "Founder review required",
};

const geographyDay1Recommendation = {
  proposedDay1: "LMS Topic 1 (Syllabus introduction)",
  proposedDay2: "LMS Topic 2 (Plate Tectonics)",
  decision: "Transition complete: Geography day-based study has been unified into the LMS learning funnel.",
};

const geographyDay1Sources: Array<{ title: string; status: GeographyDay1SourceStatus; source: string; use: string }> = [
  {
    title: "Syllabus Structure Map",
    status: "ready-to-adapt",
    source: "Syllabus PDF / UPSC notification",
    use: "Topic boundaries in the learning funnel",
  },
];

const geographyDay1MediaAttachment = {
  releaseAssetPairReady: true,
  operatorNote: "Transition to LMS complete: Media assets are now mapped directly to the LMS learning funnel nodes.",
  approvedRecordingAttached: true,
  approvedTranscriptAttached: true,
};

import {
  countInventoryStatuses,
  countLaunchVisionStatuses,
  featureInventoryGroups,
  inventoryStatusLabels,
  launchVisionRequirements,
  launchVisionStatusLabels,
  launchVisionSummary,
  morningBatchCorpusSummary,
  releaseGates,
  type InventoryStatus,
  type LaunchVisionStatus,
} from "@/lib/upsc/featureInventory";
import { subjectMaturityRows, subjectMaturitySummary } from "@/lib/upsc/generated/subjectMaturity";

const statusStyles: Record<InventoryStatus, string> = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  partial: "border-amber-200 bg-amber-50 text-amber-800",
  external: "border-blue-200 bg-blue-50 text-blue-800",
  isolated: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

const statusIcons = {
  verified: CheckCircle2,
  partial: CircleAlert,
  external: ExternalLink,
  isolated: LockKeyhole,
};

const launchVisionStatusStyles: Record<LaunchVisionStatus, string> = {
  "ready-local": "border-emerald-200 bg-emerald-50 text-emerald-800",
  partial: "border-amber-200 bg-amber-50 text-amber-800",
  "live-action": "border-blue-200 bg-blue-50 text-blue-800",
  "content-gap": "border-rose-200 bg-rose-50 text-rose-800",
};

const launchVisionStatusIcons = {
  "ready-local": CheckCircle2,
  partial: CircleAlert,
  "live-action": ExternalLink,
  "content-gap": BookOpenCheck,
};

const sourceStatusStyles: Record<GeographyDay1SourceStatus, string> = {
  "ready-to-adapt": "border-emerald-200 bg-emerald-50 text-emerald-800",
  supporting: "border-blue-200 bg-blue-50 text-blue-800",
  "founder-required": "border-amber-200 bg-amber-50 text-amber-800",
};

function StatusBadge({ status }: { status: InventoryStatus }) {
  const Icon = statusIcons[status];
  return (
    <Badge
      variant="outline"
      className={`h-7 whitespace-nowrap rounded-md px-2 font-bold ${statusStyles[status]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {inventoryStatusLabels[status]}
    </Badge>
  );
}

function LaunchVisionBadge({ status }: { status: LaunchVisionStatus }) {
  const Icon = launchVisionStatusIcons[status];
  return (
    <Badge
      variant="outline"
      className={`h-7 whitespace-nowrap rounded-md px-2 font-bold ${launchVisionStatusStyles[status]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {launchVisionStatusLabels[status]}
    </Badge>
  );
}

export default function AdminFeatureInventoryPage() {
  const statusCounts = countInventoryStatuses();
  const launchVisionCounts = countLaunchVisionStatuses();
  const completedGates = releaseGates.filter((gate) => gate.complete).length;

  return (
    <div className="space-y-6" data-testid="admin-feature-inventory-page">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
            <FileSearch className="h-3.5 w-3.5" />
            Verified Local Audit
          </div>
          <h1 className="text-3xl font-black text-zinc-950">UPSC Portal Feature Inventory</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            One operator view for what is verified locally, what is partial, what still needs a live dashboard action,
            and what remains intentionally hidden from students.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/launch-plan"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            Launch Plan <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/prelims-audit-v2"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
          >
            Corpus Audit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Inventory summary">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Verified local</p>
          <p className="mt-3 text-3xl font-black text-emerald-950">{statusCounts.verified}</p>
          <p className="mt-2 text-sm text-emerald-800">Exercised against the local production bundle.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Partial</p>
          <p className="mt-3 text-3xl font-black text-amber-950">{statusCounts.partial}</p>
          <p className="mt-2 text-sm text-amber-800">Structure exists, but depth or release proof remains open.</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">External apply</p>
          <p className="mt-3 text-3xl font-black text-blue-950">{statusCounts.external}</p>
          <p className="mt-2 text-sm text-blue-800">Needs live Supabase or deployed-session verification.</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-100 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-600">Isolated</p>
          <p className="mt-3 text-3xl font-black text-zinc-950">{statusCounts.isolated}</p>
          <p className="mt-2 text-sm text-zinc-700">Retained for master review and hidden from students.</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">Release gates</p>
          <p className="mt-3 text-3xl font-black text-rose-950">
            {completedGates}/{releaseGates.length}
          </p>
          <p className="mt-2 text-sm text-rose-800">Do not widen access until every gate closes.</p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-release-gates">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              Release Gate
            </h2>
            <p className="mt-1 text-sm text-zinc-500">The exact boundary before a real-student invite.</p>
          </div>
          <Badge variant="outline" className="h-7 rounded-md border-rose-200 bg-rose-50 px-2 font-bold text-rose-800">
            Stabilize before sharing
          </Badge>
        </div>
        <div className="mt-4 divide-y divide-zinc-100">
          {releaseGates.map((gate) => {
            const Icon = gate.complete ? CheckCircle2 : CircleDashed;
            return (
              <div key={gate.title} className="flex gap-3 py-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${gate.complete ? "text-emerald-600" : "text-amber-600"}`} />
                <div>
                  <p className="text-sm font-black text-zinc-950">{gate.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{gate.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        data-testid="admin-launch-vision-tracker"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
              <Rows3 className="h-5 w-5 text-emerald-700" />
              Three-Day Launch Vision Tracker
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              This translates the dictated product vision into explicit requirements, current evidence, and the next
              production action. Ready locally does not mean safe to widen until the live gates close.
            </p>
          </div>
          <Badge variant="outline" className="h-7 rounded-md border-zinc-200 bg-zinc-50 px-2 font-bold text-zinc-800">
            {launchVisionSummary.readyLocal}/{launchVisionSummary.total} ready locally
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Ready locally", launchVisionCounts["ready-local"], "Verified in the local product loop"],
            ["Partial", launchVisionCounts.partial, "Built surface exists, but depth or release proof remains"],
            ["Live action", launchVisionCounts["live-action"], "Needs Supabase, Vercel, OAuth, or continuity proof"],
            ["Content gap", launchVisionCounts["content-gap"], "Needs founder-approved lecture, transcript, or MCQs"],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-zinc-950">{value}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["Day 1", launchVisionSummary.dayOneFocus, "Geography pack, daily readiness, planner, price, and launch boundary"],
            ["Day 2", launchVisionSummary.dayTwoFocus, "Sources, optional pages, revision, reports, question bank, and current affairs"],
            ["Day 3", launchVisionSummary.dayThreeFocus, "Live stack, AI teacher provider, OAuth, limiter, and continuity rehearsal"],
          ].map(([phase, count, detail]) => (
            <div key={phase} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">{phase}</p>
              <p className="mt-2 text-2xl font-black text-emerald-950">{count} requirements</p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead>
              <tr className="bg-zinc-50 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                <th className="px-4 py-3">Phase</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Requirement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Current Evidence</th>
                <th className="px-4 py-3">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {launchVisionRequirements.map((item) => (
                <tr key={`${item.area}-${item.requirement}`} className="align-top">
                  <td className="px-4 py-4 text-sm font-black text-zinc-950">{item.phase}</td>
                  <td className="px-4 py-4 text-sm font-black text-zinc-950">{item.area}</td>
                  <td className="px-4 py-4 text-sm leading-6 text-zinc-700">{item.requirement}</td>
                  <td className="px-4 py-4">
                    <LaunchVisionBadge status={item.status} />
                  </td>
                  <td className="px-4 py-4 text-sm leading-6 text-zinc-600">
                    <span className="block">{item.currentState}</span>
                    <span className="mt-2 block text-xs font-bold text-zinc-500">{item.evidence}</span>
                  </td>
                  <td className="px-4 py-4 text-sm leading-6 text-zinc-600">{item.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        data-testid="admin-subject-readiness-matrix"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
              <Layers3 className="h-5 w-5 text-emerald-700" />
              Subject Content Maturity
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Structure is not launch content. This source-derived matrix separates schedules and teaching scaffolds
              from founder-approved live student packs.
            </p>
          </div>
          <Badge variant="outline" className="h-7 rounded-md border-amber-200 bg-amber-50 px-2 font-bold text-amber-800">
            {subjectMaturitySummary.founderApprovedLivePacks} founder-approved live packs
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-l-2 border-emerald-600 pl-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Subjects audited</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{subjectMaturitySummary.subjects}</p>
          </div>
          <div className="border-l-2 border-emerald-600 pl-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Planned study days</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{subjectMaturitySummary.scheduleDays}</p>
          </div>
          <div className="border-l-2 border-emerald-600 pl-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Lab routes</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{subjectMaturitySummary.labRoutes}</p>
          </div>
          <div className="border-l-2 border-amber-500 pl-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Staged class packs</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{subjectMaturitySummary.stagedClassPacks}</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="bg-zinc-50 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Teaching Scaffold</th>
                <th className="px-4 py-3">Staged Packs</th>
                <th className="px-4 py-3">Live Packs</th>
                <th className="px-4 py-3">Launch Truth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {subjectMaturityRows.map((subject) => (
                <tr key={subject.slug} className="align-top">
                  <td className="px-4 py-4 text-sm font-black text-zinc-950">{subject.title}</td>
                  <td className="px-4 py-4 text-sm font-bold text-zinc-700">
                    {subject.scheduleDays} days, {subject.labRoutes} labs
                  </td>
                  <td className="px-4 py-4 text-sm leading-6 text-zinc-600">{subject.teachingDepth}</td>
                  <td className="px-4 py-4 text-sm font-black text-zinc-950">{subject.stagedClassPacks}</td>
                  <td className="px-4 py-4 text-sm font-black text-zinc-950">{subject.founderApprovedLivePacks}</td>
                  <td className="px-4 py-4 text-sm leading-6 text-zinc-600">{subject.launchTruth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4" aria-label="Feature groups">
        {featureInventoryGroups.map((group) => (
          <div key={group.title} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 bg-[#fffdf8] px-5 py-4">
              <h2 className="text-lg font-black text-[#13251d]">{group.title}</h2>
              <p className="mt-1 text-sm leading-6 text-[#5d675f]">{group.summary}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="bg-zinc-50 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                    <th className="px-5 py-3">Feature</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Current Behavior</th>
                    <th className="px-5 py-3">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {group.items.map((item) => (
                    <tr key={item.feature} className="align-top">
                      <td className="px-5 py-4 text-sm font-black text-zinc-950">{item.feature}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-4 text-sm leading-6 text-zinc-600">{item.behavior}</td>
                      <td className="px-5 py-4 text-xs font-bold leading-5 text-zinc-500">{item.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section
        className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        data-testid="admin-geography-day1-intake"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
              <BookOpenCheck className="h-5 w-5 text-emerald-700" />
              Geography Day 1 Real-Content Intake
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Founder-corpus sources that can replace placeholder confidence with a deliberate launch pack.
            </p>
          </div>
          <Badge
            variant="outline"
            className={`h-7 rounded-md px-2 font-bold ${
              geographyDay1MediaAttachment.releaseAssetPairReady
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {geographyDay1MediaAttachment.releaseAssetPairReady
              ? "Approved recording and transcript attached"
              : "Portal-native fallback active"}
          </Badge>
        </div>

        <div
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"
          data-testid="admin-geography-day1-media-contract"
        >
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Approved-media contract</p>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-950">{geographyDay1MediaAttachment.operatorNote}</p>
          <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-amber-900 md:grid-cols-3">
            <p>Recording: {geographyDay1MediaAttachment.approvedRecordingAttached ? "Attached and approved" : "Awaiting approved URL"}</p>
            <p>Transcript: {geographyDay1MediaAttachment.approvedTranscriptAttached ? "Attached" : "Awaiting URL"}</p>
            <p>Activation: browser-safe environment variables</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Recommended split</p>
          <p className="mt-2 text-sm font-black leading-6 text-emerald-950">Day 1: {geographyDay1Recommendation.proposedDay1}</p>
          <p className="mt-1 text-sm font-black leading-6 text-emerald-950">Day 2: {geographyDay1Recommendation.proposedDay2}</p>
          <p className="mt-3 text-sm leading-6 text-emerald-800">{geographyDay1Recommendation.decision}</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-zinc-50 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Production Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {geographyDay1Sources.map((item: { title: string; status: GeographyDay1SourceStatus; source: string; use: string }) => (
                <tr key={item.title} className="align-top">
                  <td className="px-4 py-4 text-sm font-black text-zinc-950">{item.title}</td>
                  <td className="px-4 py-4">
                    <Badge
                      variant="outline"
                      className={`h-7 whitespace-nowrap rounded-md px-2 font-bold ${sourceStatusStyles[item.status]}`}
                    >
                      {geographyDay1SourceStatusLabels[item.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold leading-5 text-zinc-500">{item.source}</td>
                  <td className="px-4 py-4 text-sm leading-6 text-zinc-600">{item.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-corpus-summary">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
              <Database className="h-5 w-5 text-emerald-700" />
              Morning Batch V2 Corpus
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Internal discovery index only. Public coverage remains locked until manual page-level proof is complete.
            </p>
          </div>
          <Link
            href="/admin/prelims-audit-v2"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
          >
            Open V2 Audit <Rows3 className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {morningBatchCorpusSummary.map((item) => (
            <div key={item.label} className="border-l-2 border-emerald-600 pl-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-zinc-950">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
