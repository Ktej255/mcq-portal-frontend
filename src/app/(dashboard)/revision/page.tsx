"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  History,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { revisionService, type HistoryItem, type RevisionItem } from "@/services/api/revisionService";

type LoadState = "loading" | "ready" | "error";

function getErrorMessage(error: unknown) {
  const candidate = error as {
    message?: unknown;
    response?: { data?: { detail?: unknown } };
  };

  if (typeof candidate.response?.data?.detail === "string") return candidate.response.data.detail;
  if (typeof candidate.message === "string") return candidate.message;
  return "We could not load your persisted revision data.";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StateMessage({
  state,
  error,
  emptyMessage,
  onRetry,
}: {
  state: LoadState;
  error: string | null;
  emptyMessage: string;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 py-8 text-sm font-bold text-[#5d675f]" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" /> Loading from the server...
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-md border border-[#e8b061] bg-[#fff8ed] p-4" role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#9b6517]" />
          <div>
            <p className="text-sm font-black text-[#6f4a12]">Unable to load revision data</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#795f35]">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex h-9 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white hover:bg-[#10291d]"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <p className="py-8 text-sm font-semibold text-[#5d675f]">{emptyMessage}</p>;
}

function masteryPercent(mastery?: number) {
  if (typeof mastery !== "number" || !Number.isFinite(mastery)) return null;
  return Math.round(Math.max(0, Math.min(1, mastery)) * 100);
}

export default function RevisionPage() {
  const [queue, setQueue] = useState<RevisionItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [queueState, setQueueState] = useState<LoadState>("loading");
  const [historyState, setHistoryState] = useState<LoadState>("loading");
  const [queueError, setQueueError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setQueueState("loading");
    setQueueError(null);
    try {
      setQueue(await revisionService.getQueue());
      setQueueState("ready");
    } catch (error) {
      setQueueState("error");
      setQueueError(getErrorMessage(error));
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryState("loading");
    setHistoryError(null);
    try {
      setHistory(await revisionService.getHistory());
      setHistoryState("ready");
    } catch (error) {
      setHistoryState("error");
      setHistoryError(getErrorMessage(error));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadQueue(), loadHistory()]);
    setIsRefreshing(false);
  }, [loadHistory, loadQueue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshAll]);

  const completeItem = async (item: RevisionItem) => {
    setCompletingId(item.id);
    setCompletionError(null);
    try {
      await revisionService.completeRevision(item.id, 0.2);
      // Do not remove locally: the server queue remains authoritative after completion.
      await refreshAll();
    } catch (error) {
      setCompletionError(getErrorMessage(error));
    } finally {
      setCompletingId(null);
    }
  };

  const isLoaded = queueState === "ready" && historyState === "ready";

  return (
    <main className="text-[#13251d]">
      <section
        data-testid="student-revision-command"
        data-loaded={String(isLoaded)}
        data-queue-state={queueState}
        data-history-state={historyState}
        data-queue-count={queue.length}
        data-history-count={history.length}
        className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Revision authority</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Your persisted revision queue</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">
              This view is backed by your authenticated server queue. Completing an item updates the backend and reloads
              both queue and history, so this page never invents or hides revision state locally.
            </p>
            <p className="mt-3 rounded-md border border-[#e4dccf] bg-[#f7f4ee] px-3 py-2 text-xs font-semibold leading-5 text-[#5d675f]">
              This queue is filled by full-length exam attempts only. GS topic revisits
              (Day 3/7/21) are listed in{" "}
              <Link href="/upsc/geography/lms/planner" className="text-[#1d9e75] hover:underline">
                Today&apos;s plan
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={isRefreshing}
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a] hover:bg-[#f2eadc] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh queue"}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-black text-[#4f5e55]">
          <span className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] px-3 py-2">{queue.length} pending</span>
          <span className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] px-3 py-2">{history.length} reviewed records</span>
          <Link href="/exam/revision" className="inline-flex items-center px-1 py-2 text-[#1d9e75] hover:underline">
            Open rapid drill <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {completionError && (
        <div className="mt-5 rounded-md border border-[#e8b061] bg-[#fff8ed] p-4 text-sm font-bold text-[#6f4a12]" role="alert">
          Could not complete that revision item: {completionError}
        </div>
      )}

      <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm" data-testid="revision-queue" data-state={queueState}>
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-[#085041]" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Queue</p>
            <h2 className="text-2xl font-black tracking-tight">Pending revision items</h2>
          </div>
        </div>
        <StateMessage
          state={queueState}
          error={queueError}
          emptyMessage="Your server revision queue is clear. New mistakes or flagged questions will appear here."
          onRetry={() => void loadQueue()}
        />
        {queueState === "ready" && queue.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {queue.map((item) => {
              const mastery = masteryPercent(item.mastery);
              return (
                <article key={item.id} className="rounded-lg border border-[#e4dccf] bg-[#f7f4ee] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{item.category ?? item.reason}</p>
                      <h3 className="mt-1 text-lg font-black">{item.topic}</h3>
                    </div>
                    <span className="rounded-md bg-[#fffdf8] px-2.5 py-1 text-xs font-black text-[#6f4a12]">Priority {item.priority}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#4f5e55]">{item.reason}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-[#5d675f]">
                    {item.question_id != null && <span>Question {item.question_id}</span>}
                    {item.review_count != null && <span>• {item.review_count} prior review{item.review_count === 1 ? "" : "s"}</span>}
                    {mastery != null && <span>• {mastery}% mastery</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => void completeItem(item)}
                    disabled={completingId !== null}
                    className="mt-4 inline-flex h-10 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white hover:bg-[#10291d] disabled:cursor-wait disabled:opacity-60"
                  >
                    {completingId === item.id ? <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                    {completingId === item.id ? "Saving..." : "Complete revision"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm" data-testid="revision-history" data-state={historyState}>
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-[#085041]" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">History</p>
            <h2 className="text-2xl font-black tracking-tight">Completed revision records</h2>
          </div>
        </div>
        <StateMessage
          state={historyState}
          error={historyError}
          emptyMessage="No completed revision records yet. Complete an item and it will be recorded here by the server."
          onRetry={() => void loadHistory()}
        />
        {historyState === "ready" && history.length > 0 && (
          <div className="mt-5 divide-y divide-[#e4dccf] rounded-md border border-[#e4dccf] bg-[#f7f4ee]">
            {history.map((item) => (
              <div key={`${item.id}-${item.last_reviewed_at}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-black">{item.topic}</p>
                  <p className="mt-1 text-xs font-semibold text-[#5d675f]">{item.category} · {formatDate(item.last_reviewed_at)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-[#1a3a2a]">
                  <Clock3 className="h-4 w-4" /> {Math.round(Math.max(0, Math.min(1, item.mastery_at_time)) * 100)}% mastery
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
