import { CheckCircle2, CircleAlert, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getLaunchEnvironmentBoundary,
  type LaunchEnvironmentCheckStatus,
} from "@/lib/upsc/launchEnvironmentBoundary";

const statusStyle: Record<LaunchEnvironmentCheckStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  fail: "border-rose-200 bg-rose-50 text-rose-800",
};

const statusIcon = {
  pass: CheckCircle2,
  pending: Clock3,
  fail: CircleAlert,
};

function statusLabel(status: LaunchEnvironmentCheckStatus) {
  if (status === "pass") return "Pass";
  if (status === "fail") return "Fail";
  return "Pending";
}

export function LaunchEnvironmentBoundaryPanel() {
  const boundary = getLaunchEnvironmentBoundary();
  const DecisionIcon = boundary.publicSecretExposure ? CircleAlert : boundary.localReady ? CheckCircle2 : LockKeyhole;

  return (
    <section
      data-testid="admin-launch-env-boundary"
      data-proof-rule={boundary.proofRule}
      data-total-checks={boundary.totalChecks}
      data-pass-count={boundary.passCount}
      data-pending-count={boundary.pendingCount}
      data-fail-count={boundary.failCount}
      data-local-ready={String(boundary.localReady)}
      data-public-secret-exposure={String(boundary.publicSecretExposure)}
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950 dark:text-zinc-50">
            <ShieldCheck className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            Launch Environment Boundary
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            This mirrors the no-secret launch preflight inside the operator console. It checks names and presence only:
            no Supabase, AI provider, or OAuth secret value is printed here. Local gates prepare the build; live SQL and
            OAuth receipts remain the final production launch evidence.
          </p>
        </div>
        <Badge
          variant="outline"
          className={`h-7 rounded-md px-2 font-bold ${
            boundary.publicSecretExposure
              ? statusStyle.fail
              : boundary.localReady
                ? statusStyle.pass
                : statusStyle.pending
          }`}
        >
          <DecisionIcon className="h-3.5 w-3.5" />
          {boundary.publicSecretExposure ? "Fix before build" : boundary.localReady ? "Local boundary clean" : "Local gates pending"}
        </Badge>
      </div>

      <div
        data-testid="admin-launch-env-boundary-status"
        data-launch-env-local-ready={String(boundary.localReady)}
        data-launch-env-public-secret-exposure={String(boundary.publicSecretExposure)}
        className={`mb-5 rounded-md border p-4 ${
          boundary.publicSecretExposure
            ? "border-rose-200 bg-rose-50 text-rose-900"
            : boundary.localReady
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <p className="text-xs font-black uppercase tracking-[0.16em]">Current decision</p>
        <p className="mt-2 text-sm font-bold leading-6">{boundary.launchDecision}</p>
        <div className="mt-3 grid gap-2 text-xs font-black uppercase tracking-[0.12em] sm:grid-cols-4">
          <span>Total {boundary.totalChecks}</span>
          <span>Pass {boundary.passCount}</span>
          <span>Pending {boundary.pendingCount}</span>
          <span>Fail {boundary.failCount}</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {boundary.checks.map((item) => {
          const Icon = statusIcon[item.status];

          return (
            <article
              key={item.id}
              data-testid="admin-launch-env-check"
              data-env-check-id={item.id}
              data-env-check-group={item.group}
              data-env-check-status={item.status}
              data-env-check-public-safe={String(item.publicSafe)}
              data-secret-value-printed="false"
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    {item.group.replace("-", " ")}
                  </p>
                  <h3 className="mt-2 text-sm font-black text-zinc-950 dark:text-zinc-50">{item.title}</h3>
                </div>
                <Badge variant="outline" className={`h-7 rounded-md px-2 font-bold ${statusStyle[item.status]}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {statusLabel(item.status)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm leading-6">
                <p className="rounded-md border border-zinc-200 bg-white p-3 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  {item.proof}
                </p>
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                  {item.nextAction}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
