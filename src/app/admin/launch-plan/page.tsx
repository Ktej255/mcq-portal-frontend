import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  Flag,
  Gauge,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GeographyDay1ReleasePackPanel } from "@/components/admin/GeographyDay1ReleasePackPanel";
import { GeographyTestingObservationPanel } from "@/components/admin/GeographyTestingObservationPanel";
import { LiveContinuityRehearsalPanel } from "@/components/admin/LiveContinuityRehearsalPanel";
import {
  deliveryWorkLog,
  immediateLaunchActions,
  launchFocusAreas,
  launchReadinessMetrics,
  launchVerdictCards,
  liveReleaseBoundary,
  may24Plan,
  may25Plan,
  may31Plan,
  nextSixDayFocus,
  type DeliveryFocusItem,
  type DeliveryStatus,
} from "@/lib/upsc/launchDeliveryPlan";

const statusStyles: Record<DeliveryStatus, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  "in-progress": "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100",
  pending: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
  risk: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
};

const statusIcon = {
  done: CheckCircle2,
  "in-progress": Clock3,
  pending: ClipboardList,
  risk: CircleAlert,
};

function statusLabel(status: DeliveryStatus) {
  if (status === "done") return "Done";
  if (status === "in-progress") return "In progress";
  if (status === "risk") return "Risk";
  return "Pending";
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const Icon = statusIcon[status];
  return (
    <Badge variant="outline" className={`h-7 rounded-md px-2 font-bold ${statusStyles[status]}`}>
      <Icon className="h-3.5 w-3.5" />
      {statusLabel(status)}
    </Badge>
  );
}

function ProgressLine({ item }: { item: DeliveryFocusItem }) {
  return (
    <div className="border-b border-zinc-100 py-4 last:border-b-0 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50">{item.title}</h3>
          <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{item.owner}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.outcome}</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-md bg-emerald-600"
            style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }}
          />
        </div>
        <span className="w-12 text-right text-xs font-black tabular-nums text-zinc-700 dark:text-zinc-200">
          {item.percent}%
        </span>
      </div>
    </div>
  );
}

export default function AdminLaunchPlanPage() {
  const may24Average = Math.round(
    may24Plan.checkpoints.reduce((total, item) => total + item.percent, 0) / may24Plan.checkpoints.length
  );
  const may24Done = may24Plan.checkpoints.filter((item) => item.status === "done").length;
  const may25Average = Math.round(
    may25Plan.checkpoints.reduce((total, item) => total + item.percent, 0) / may25Plan.checkpoints.length
  );

  return (
    <div className="space-y-6" data-testid="admin-launch-plan-page">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
            <Flag className="h-3.5 w-3.5" />
            June 1 Geography Batch Readiness
          </div>
          <h1 className="text-3xl font-black text-zinc-950 dark:text-zinc-50">Launch Plan and Delivery Tracker</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Daily operating view for what was planned, what shipped, what value was created, and what must close before the student testing link is shared.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/upsc/geography"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Geography Pilot <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/upsc/geography/pilot"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100 dark:hover:bg-emerald-950"
          >
            Student Pilot <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/questions/bulk"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            MCQ Upload <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/feature-inventory"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Feature Inventory <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Readiness summary">
        {launchReadinessMetrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-black text-zinc-950 dark:text-zinc-50">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section
        data-testid="admin-24-25-verdict"
        className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              24 May to 31 May operating answer
            </p>
            <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-zinc-50">
              Geography stays first; student pilot is the next gate
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              May 24 local loop work is retained as historical evidence. The current release boundary is the live
              Supabase migration, Google OAuth continuity rehearsal, final Day 1 content pass, and controlled feedback cycle.
            </p>
          </div>
          <div className="grid min-w-[260px] gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-200">
                May 24 checkpoints
              </span>
              <span className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                {may24Done}/{may24Plan.checkpoints.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-md bg-white dark:bg-zinc-950">
              <div className="h-full rounded-md bg-emerald-600" style={{ width: `${may24Average}%` }} />
            </div>
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
              May 24 average: {may24Average}%. May 25 readiness: {may25Average}%.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {launchVerdictCards.map((card) => {
            const Icon = statusIcon[card.status];
            return (
              <div key={card.title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                  <StatusBadge status={card.status} />
                </div>
                <p className="mt-4 text-sm font-black text-zinc-950 dark:text-zinc-50">{card.title}</p>
                <p className="mt-2 text-lg font-black text-zinc-950 dark:text-zinc-50">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{card.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <GeographyTestingObservationPanel />

      <GeographyDay1ReleasePackPanel />

      <section
        data-testid="admin-immediate-action-queue"
        className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950 dark:text-zinc-50">
              <ListChecks className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              Immediate Action Queue
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              This is the next execution order before any subject expansion.
            </p>
          </div>
          <Badge variant="outline" className="h-7 rounded-md border-emerald-200 bg-emerald-50 px-2 font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
            Share only after founder pass
          </Badge>
        </div>
        <div>
          {immediateLaunchActions.map((item) => (
            <ProgressLine key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section
        data-testid="admin-live-release-boundary"
        className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950 dark:text-zinc-50">
              <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              Live Release Boundary
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Operator-only sequence for the remaining console work. Complete these receipts in order before a public student invite.
            </p>
          </div>
          <Badge variant="outline" className="h-7 rounded-md border-amber-200 bg-amber-50 px-2 font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            External proof required
          </Badge>
        </div>

        <div className="divide-y divide-zinc-100 border-y border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
          {liveReleaseBoundary.map((gate) => (
            <div key={gate.step} className="grid gap-3 py-4 lg:grid-cols-[64px_1fr_1fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Step {gate.step}</p>
                <div className="mt-2"><StatusBadge status={gate.status} /></div>
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50">{gate.title}</h3>
                <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">{gate.controlPlane}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{gate.operatorAction}</p>
              </div>
              <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-950">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Proof receipt</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{gate.proofReceipt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LiveContinuityRehearsalPanel />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950 dark:text-zinc-50">
                <CalendarCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                Work Log Till Date
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Plan, code work, value, and evidence by day.</p>
            </div>
            <Badge variant="outline" className="h-7 rounded-md border-emerald-200 bg-emerald-50 px-2 font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
              MCQ to UPSC portal
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-xs font-black text-zinc-500 dark:text-zinc-400">
                  <th className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">Day</th>
                  <th className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">Planned</th>
                  <th className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">Completed</th>
                  <th className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">Value Delivered</th>
                  <th className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {deliveryWorkLog.map((day) => (
                  <tr key={day.date} className="align-top">
                    <td className="border-b border-zinc-100 px-3 py-4 dark:border-zinc-800">
                      <div className="text-sm font-black text-zinc-950 dark:text-zinc-50">{day.date}</div>
                      <div className="mt-2"><StatusBadge status={day.status} /></div>
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                      {day.planned}
                      <ul className="mt-3 space-y-2">
                        {day.codeWork.map((item) => (
                          <li key={item} className="flex gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-4 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="h-2 min-w-24 flex-1 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                          <div className="h-full rounded-md bg-emerald-600" style={{ width: `${day.completed}%` }} />
                        </div>
                        <span className="text-sm font-black tabular-nums">{day.completed}%</span>
                      </div>
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-4 dark:border-zinc-800">
                      <ul className="space-y-2">
                        {day.valueDelivered.map((item) => (
                          <li key={item} className="flex gap-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-4 dark:border-zinc-800">
                      <ul className="space-y-2">
                        {day.evidence.map((item) => (
                          <li key={item} className="flex gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950 dark:text-zinc-50">
            <Gauge className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            Focus Areas
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Current product direction and launch risk.</p>
          <div className="mt-4">
            {launchFocusAreas.map((item) => (
              <ProgressLine key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {[may24Plan, may25Plan, may31Plan].map((plan) => (
          <div key={plan.date} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{plan.date}</p>
                <h2 className="mt-1 text-xl font-black text-zinc-950 dark:text-zinc-50">{plan.title}</h2>
              </div>
              <Badge variant="outline" className="h-7 rounded-md border-blue-200 bg-blue-50 px-2 font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
                {plan.completionTarget}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{plan.objective}</p>
            <div className="mt-5">
              {plan.checkpoints.map((item) => (
                <ProgressLine key={item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950 dark:text-zinc-50">
              <ClipboardList className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              Next Six-Day Operating Plan
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">The shortest path to a June 1-ready first batch.</p>
          </div>
          <Badge variant="outline" className="h-7 rounded-md border-amber-200 bg-amber-50 px-2 font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            Geography before expansion
          </Badge>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {nextSixDayFocus.map((item) => (
            <div key={item.date} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{item.date}</p>
                <Badge variant="secondary" className="h-7 rounded-md px-2 font-bold">{item.focus}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.output}</p>
              <p className="mt-3 rounded-md bg-zinc-50 p-3 text-xs font-semibold leading-5 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                {item.riskControl}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
