import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  ClipboardList,
  Database,
  FileSearch,
  FileInput,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  countInventoryStatuses,
  morningBatchCorpusSummary,
  releaseGates,
} from "@/lib/upsc/featureInventory";
import { geographyDay1Recommendation } from "@/lib/upsc/geographyDay1ContentIntake";
import {
  immediateLaunchActions,
  launchReadinessMetrics,
  type DeliveryStatus,
} from "@/lib/upsc/launchDeliveryPlan";

const actionStatusStyles: Record<DeliveryStatus, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "in-progress": "border-blue-200 bg-blue-50 text-blue-800",
  pending: "border-zinc-200 bg-zinc-100 text-zinc-700",
  risk: "border-amber-200 bg-amber-50 text-amber-800",
};

const actionStatusLabels: Record<DeliveryStatus, string> = {
  done: "Done",
  "in-progress": "In progress",
  pending: "Pending",
  risk: "Risk",
};

const operatorLinks = [
  {
    href: "/admin/launch-plan",
    title: "Launch Plan",
    detail: "Daily work log, next actions, controlled tester gate, and stop-sharing rules.",
    icon: ClipboardList,
  },
  {
    href: "/admin/feature-inventory",
    title: "Feature Inventory",
    detail: "Verified, partial, external-apply, and isolated features with the Day 1 source packet.",
    icon: ListChecks,
  },
  {
    href: "/admin/prelims-audit-v2",
    title: "Prelims V2 Audit",
    detail: "Master-only Morning Batch corpus room with public claims locked until proof review.",
    icon: FileSearch,
  },
  {
    href: "/admin/pyq-import",
    title: "Exact PYQ Import",
    detail: "Stage verified official PYQ text with subject, syllabus, topic tags, and source URL before public claims.",
    icon: FileInput,
  },
  {
    href: "/admin/questions/bulk",
    title: "Fresh MCQ Upload",
    detail: "Attach fresh audited MCQs to the exact subject, day, and batch after quality review.",
    icon: Database,
  },
];

export default function AdminDashboard() {
  const inventoryCounts = countInventoryStatuses();
  const completeGateCount = releaseGates.filter((gate) => gate.complete).length;
  const openGateCount = releaseGates.length - completeGateCount;

  return (
    <div className="space-y-6" data-testid="admin-operator-dashboard">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Local Snapshot
          </div>
          <h1 className="text-3xl font-black text-zinc-950">UPSC Operator Console</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            Honest operating view for the Geography pilot. No sample student counts, simulated analytics, or
            backend-dependent claims are shown here.
          </p>
        </div>
        <Link
          href="/admin/launch-plan"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          Open Launch Plan <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Readiness summary">
        {launchReadinessMetrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-zinc-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-black text-zinc-950">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-dashboard-release-gates">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                Release Gate
              </h2>
              <p className="mt-1 text-sm text-zinc-500">The live boundary before a real-student invite.</p>
            </div>
            <Badge variant="outline" className="h-7 rounded-md border-rose-200 bg-rose-50 px-2 font-bold text-rose-800">
              {completeGateCount}/{releaseGates.length} closed
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
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-zinc-950">
              <ListChecks className="h-5 w-5 text-emerald-700" />
              Feature Ledger
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">Current audited feature counts.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Verified</p>
                <p className="mt-2 text-2xl font-black text-emerald-950">{inventoryCounts.verified}</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">Partial</p>
                <p className="mt-2 text-2xl font-black text-amber-950">{inventoryCounts.partial}</p>
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">External apply</p>
                <p className="mt-2 text-2xl font-black text-blue-950">{inventoryCounts.external}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-100 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-600">Isolated</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{inventoryCounts.isolated}</p>
              </div>
            </div>
            <Link
              href="/admin/feature-inventory"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
            >
              Inspect Ledger <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-rose-950">
              <CircleAlert className="h-5 w-5 text-rose-700" />
              Share Status
            </h2>
            <p className="mt-2 text-xl font-black text-rose-950">Do not invite students yet</p>
            <p className="mt-2 text-sm leading-6 text-rose-800">
              {openGateCount} release gates remain open. Geography stays first until live identity continuity and the
              real Day 1 pack pass together.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-dashboard-action-queue">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950">
            <ClipboardList className="h-5 w-5 text-emerald-700" />
            Immediate Action Queue
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Close these in order before subject expansion.</p>
        </div>
        <div className="mt-4 divide-y divide-zinc-100">
          {immediateLaunchActions.map((item) => (
            <div key={item.title} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-zinc-950">{item.title}</p>
                  <p className="mt-1 text-xs font-bold text-zinc-500">{item.owner}</p>
                </div>
                <Badge variant="outline" className={`h-7 rounded-md px-2 font-bold ${actionStatusStyles[item.status]}`}>
                  {actionStatusLabels[item.status]}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{item.outcome}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-md bg-zinc-100">
                  <div className="h-full rounded-md bg-emerald-600" style={{ width: `${item.percent}%` }} />
                </div>
                <span className="w-12 text-right text-xs font-black tabular-nums text-zinc-700">{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm" data-testid="admin-dashboard-day1-decision">
          <h2 className="flex items-center gap-2 text-lg font-black text-emerald-950">
            <BookOpenCheck className="h-5 w-5 text-emerald-700" />
            Geography Day 1 Decision
          </h2>
          <p className="mt-3 text-sm font-black leading-6 text-emerald-950">
            Day 1: {geographyDay1Recommendation.proposedDay1}
          </p>
          <p className="mt-1 text-sm font-black leading-6 text-emerald-950">
            Day 2: {geographyDay1Recommendation.proposedDay2}
          </p>
          <p className="mt-3 text-sm leading-6 text-emerald-800">{geographyDay1Recommendation.decision}</p>
          <Link
            href="/admin/feature-inventory"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100"
          >
            Inspect Day 1 Sources <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" data-testid="admin-dashboard-corpus-summary">
          <h2 className="flex items-center gap-2 text-lg font-black text-zinc-950">
            <Database className="h-5 w-5 text-emerald-700" />
            Morning Batch V2 Corpus
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Internal discovery index. Public coverage remains locked until manual proof review.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {morningBatchCorpusSummary.slice(0, 4).map((item) => (
              <div key={item.label} className="border-l-2 border-emerald-600 pl-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Operator rooms">
        {operatorLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <Icon className="h-5 w-5 text-emerald-700" />
              <h2 className="mt-4 text-base font-black text-zinc-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.detail}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
