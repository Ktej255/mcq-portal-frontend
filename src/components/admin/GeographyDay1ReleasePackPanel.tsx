"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, LockKeyhole, PackageCheck, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographyDay1MediaAttachment } from "@/lib/upsc/geographyDay1Media";
import {
  geographyDay1ReleasePackReceipts,
  getGeographyDay1ReleasePackReceiptSummary,
  readGeographyDay1ReleasePackReceipts,
  updateGeographyDay1ReleasePackReceipt,
  type GeographyDay1ReleasePackReceipt,
  type GeographyDay1ReleasePackReceiptId,
} from "@/lib/upsc/geographyDay1ReleasePackReceipts";
import { readGeographyDay1McqLaunchGate } from "@/lib/upsc/geographyLaunchReadiness";
import { cn } from "@/lib/utils";

function getPrerequisiteState(receipt: GeographyDay1ReleasePackReceipt) {
  if (receipt.prerequisite === "approved-media-pair") {
    return {
      met: geographyDay1MediaAttachment.releaseAssetPairReady,
      label: geographyDay1MediaAttachment.releaseAssetPairReady ? "Media pair attached" : "Media pair missing",
      detail: geographyDay1MediaAttachment.operatorNote,
    };
  }

  if (receipt.prerequisite === "fresh-mcq-gate") {
    const mcqGate = readGeographyDay1McqLaunchGate();
    return {
      met: mcqGate.passed,
      label: mcqGate.passed ? "MCQ gate ready" : "MCQ gate locked",
      detail: mcqGate.detail,
    };
  }

  return {
    met: true,
    label: "Manual proof required",
    detail: "Add a specific founder proof note, then mark this receipt complete.",
  };
}

export function GeographyDay1ReleasePackPanel() {
  const [receiptState, setReceiptState] = useState(() => readGeographyDay1ReleasePackReceipts());
  const [reviewerName, setReviewerName] = useState(receiptState.reviewerName);
  const [proofDrafts, setProofDrafts] = useState<Record<string, string>>(() => receiptState.proofNotes);
  const [refreshTick, setRefreshTick] = useState(0);

  const reloadReceipts = () => {
    const nextState = readGeographyDay1ReleasePackReceipts();
    setReceiptState(nextState);
    setReviewerName(nextState.reviewerName);
    setProofDrafts(nextState.proofNotes);
    setRefreshTick(Date.now());
  };

  useEffect(() => {
    window.addEventListener("storage", reloadReceipts);
    window.addEventListener("geography-day1-release-pack-receipts-updated", reloadReceipts);
    window.addEventListener("mcq-command-updated", reloadReceipts);
    return () => {
      window.removeEventListener("storage", reloadReceipts);
      window.removeEventListener("geography-day1-release-pack-receipts-updated", reloadReceipts);
      window.removeEventListener("mcq-command-updated", reloadReceipts);
    };
  }, []);

  const summary = useMemo(() => getGeographyDay1ReleasePackReceiptSummary(receiptState), [receiptState]);
  void refreshTick;

  const updateProofDraft = (id: GeographyDay1ReleasePackReceiptId, value: string) => {
    setProofDrafts((current) => ({ ...current, [id]: value }));
  };

  const markReceipt = (id: GeographyDay1ReleasePackReceiptId, completed: boolean) => {
    const nextState = updateGeographyDay1ReleasePackReceipt(id, {
      completed,
      proofNote: proofDrafts[id] || receiptState.proofNotes[id] || "",
      reviewerName,
    });
    setReceiptState(nextState);
  };

  return (
    <section
      data-testid="admin-geography-day1-release-pack"
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950 dark:text-zinc-50">
            <PackageCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            Geography Day 1 Release Pack
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Final public launch content proof. Controlled testing can use the portal-native fallback, but public release needs this pack complete.
          </p>
        </div>
        <Badge variant="outline" className="h-7 rounded-md border-emerald-200 bg-emerald-50 px-2 font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
          Content proof
        </Badge>
      </div>

      <div
        data-testid="admin-day1-release-pack-status"
        data-day1-release-pack-ready={summary.complete ? "true" : "false"}
        className={cn(
          "mb-5 rounded-md border p-4",
          summary.complete
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
            : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300">
              Day 1 content receipt state
            </p>
            <h3 className="mt-2 flex items-center gap-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              {summary.complete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <LockKeyhole className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              )}
              {summary.complete ? "Day 1 release pack ready" : "Day 1 release pack locked"}
            </h3>
            <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              {summary.completedCount}/{summary.total} receipts complete. Public launch remains locked until all Day 1 content receipts are complete.
            </p>
          </div>
          <label className="grid min-w-[240px] gap-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Reviewer
            <input
              aria-label="Day 1 release pack reviewer"
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {geographyDay1ReleasePackReceipts.map((receipt) => {
          const completed = receiptState.completedIds.includes(receipt.id);
          const proofNote = proofDrafts[receipt.id] ?? receiptState.proofNotes[receipt.id] ?? "";
          const proofReady = proofNote.trim().length >= 12;
          const prerequisite = getPrerequisiteState(receipt);
          const canComplete = completed || (proofReady && prerequisite.met);

          return (
            <article
              key={receipt.id}
              data-day1-release-pack-receipt={receipt.id}
              data-day1-release-pack-complete={completed ? "true" : "false"}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                    {receipt.area}
                  </p>
                  <h3 className="mt-2 text-sm font-black text-zinc-950 dark:text-zinc-50">{receipt.title}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-7 rounded-md px-2 font-bold",
                    completed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
                  )}
                >
                  {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
                  {completed ? "Receipt done" : "Receipt pending"}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3">
                <div
                  className={cn(
                    "rounded-md border p-3",
                    prerequisite.met
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20",
                  )}
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-600 dark:text-zinc-300">
                    {prerequisite.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{prerequisite.detail}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Proof target</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{receipt.proofTarget}</p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
                    Failure rule
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-100">{receipt.failureRule}</p>
                </div>
                <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  Proof note
                  <textarea
                    aria-label={`Proof note for ${receipt.title}`}
                    value={proofNote}
                    onChange={(event) => updateProofDraft(receipt.id, event.target.value)}
                    rows={3}
                    className="min-h-20 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold normal-case leading-6 tracking-normal text-zinc-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid={`day1-release-pack-complete-${receipt.id}`}
                    disabled={!canComplete}
                    onClick={() => markReceipt(receipt.id, true)}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark receipt complete
                  </button>
                  <button
                    type="button"
                    data-testid={`day1-release-pack-reopen-${receipt.id}`}
                    onClick={() => markReceipt(receipt.id, false)}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-black text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reopen
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
