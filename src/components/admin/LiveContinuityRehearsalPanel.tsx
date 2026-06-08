"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, LockKeyhole, RotateCcw, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { liveContinuityRehearsal } from "@/lib/upsc/launchDeliveryPlan";
import {
  getLiveContinuityReceiptSummary,
  readLiveContinuityReceipts,
  updateLiveContinuityReceipt,
  type LiveContinuityReceiptId,
} from "@/lib/upsc/liveContinuityReceipts";
import { cn } from "@/lib/utils";

export function LiveContinuityRehearsalPanel() {
  const [receiptState, setReceiptState] = useState(() => readLiveContinuityReceipts());
  const [reviewerName, setReviewerName] = useState(receiptState.reviewerName);
  const [proofDrafts, setProofDrafts] = useState<Record<string, string>>(() => receiptState.proofNotes);

  const reloadReceipts = () => {
    const nextState = readLiveContinuityReceipts();
    setReceiptState(nextState);
    setReviewerName(nextState.reviewerName);
    setProofDrafts(nextState.proofNotes);
  };

  useEffect(() => {
    window.addEventListener("storage", reloadReceipts);
    window.addEventListener("upsc-live-continuity-receipts-updated", reloadReceipts);
    return () => {
      window.removeEventListener("storage", reloadReceipts);
      window.removeEventListener("upsc-live-continuity-receipts-updated", reloadReceipts);
    };
  }, []);

  const summary = useMemo(() => getLiveContinuityReceiptSummary(receiptState), [receiptState]);
  const liveReadyLabel = summary.complete ? "Live continuity ready" : "Live continuity locked";

  const updateProofDraft = (id: LiveContinuityReceiptId, value: string) => {
    setProofDrafts((current) => ({ ...current, [id]: value }));
  };

  const markReceipt = (id: LiveContinuityReceiptId, completed: boolean) => {
    const nextState = updateLiveContinuityReceipt(id, {
      completed,
      proofNote: proofDrafts[id] || receiptState.proofNotes[id] || "",
      reviewerName,
    });
    setReceiptState(nextState);
  };

  return (
    <section
      data-testid="admin-live-continuity-rehearsal"
      className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="flex items-center gap-2 text-xl font-black text-zinc-950 dark:text-zinc-50">
            <ShieldCheck className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            Live Continuity Rehearsal Packet
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Use this as the exact proof sheet after Supabase and Vercel are configured. A local pass is not enough for these items.
          </p>
        </div>
        <Badge variant="outline" className="h-7 rounded-md border-blue-200 bg-blue-50 px-2 font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
          Live browser proof
        </Badge>
      </div>

      <div
        data-testid="admin-live-continuity-status"
        data-live-continuity-ready={summary.complete ? "true" : "false"}
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
              Live stack receipt state
            </p>
            <h3 className="mt-2 flex items-center gap-2 text-lg font-black text-zinc-950 dark:text-zinc-50">
              {summary.complete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <LockKeyhole className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              )}
              {liveReadyLabel}
            </h3>
            <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              {summary.completedCount}/{summary.total} receipts complete. Public launch remains locked until all live receipts are complete.
            </p>
          </div>
          <label className="grid min-w-[240px] gap-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Reviewer
            <input
              aria-label="Live continuity reviewer"
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {liveContinuityRehearsal.map((receipt) => {
          const completed = receiptState.completedIds.includes(receipt.id);
          const proofNote = proofDrafts[receipt.id] ?? receiptState.proofNotes[receipt.id] ?? "";
          const proofReady = proofNote.trim().length >= 12;

          return (
            <article
              key={receipt.id}
              data-live-continuity-receipt={receipt.id}
              data-live-continuity-complete={completed ? "true" : "false"}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
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
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Console action</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{receipt.consoleAction}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">Browser proof</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{receipt.browserProof}</p>
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
                    className="min-h-20 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold normal-case leading-6 tracking-normal text-zinc-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid={`live-continuity-complete-${receipt.id}`}
                    disabled={!completed && !proofReady}
                    onClick={() => markReceipt(receipt.id, true)}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark receipt complete
                  </button>
                  <button
                    type="button"
                    data-testid={`live-continuity-reopen-${receipt.id}`}
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
