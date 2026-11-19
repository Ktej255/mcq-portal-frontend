"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  Flame,
  History,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { gsLmsService, type SyllabusNodeOut } from "@/services/api/gsLmsService";
import {
  revisionService,
  type HistoryItem,
  type RevisionCalibrationRating,
  type RevisionCommandCenterResponse,
  type RevisionPriorityItem,
  type RevisionTriageEvaluateResponse,
  type RevisionTriageItemInput,
  type TriageBand,
  type TriageConfidence,
} from "@/services/api/revisionService";

type LoadState = "loading" | "ready" | "error";
type QueueTab = "all" | "overconfident" | "mistakes" | "revisits" | "weak";

const PACING_STORAGE_KEY = "sarit-revision-pacing-v1";
const DAILY_MINUTE_OPTIONS = [15, 25, 45, 60] as const;

interface PacingPrefs {
  examDate: string;
  dailyMinutes: number;
}

interface TriageDraftRow {
  id: string;
  topicLabel: string;
  subjectSlug: string | null;
  syllabusNodeId: number | null;
  accuracy: number;
  confidence: TriageConfidence;
}

interface SyllabusLeafOption {
  nodeId: number;
  title: string;
}

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

function formatShortDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

function readSavedPacing(): PacingPrefs {
  if (typeof window === "undefined") {
    return { examDate: "", dailyMinutes: 25 };
  }
  try {
    const raw = window.localStorage.getItem(PACING_STORAGE_KEY);
    if (!raw) return { examDate: "", dailyMinutes: 25 };
    const parsed = JSON.parse(raw) as { examDate?: unknown; dailyMinutes?: unknown };
    const examDate =
      typeof parsed.examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.examDate)
        ? parsed.examDate
        : "";
    const dailyMinutes =
      typeof parsed.dailyMinutes === "number" &&
      DAILY_MINUTE_OPTIONS.includes(parsed.dailyMinutes as (typeof DAILY_MINUTE_OPTIONS)[number])
        ? parsed.dailyMinutes
        : 25;
    return { examDate, dailyMinutes };
  } catch {
    return { examDate: "", dailyMinutes: 25 };
  }
}

function writeSavedPacing(prefs: PacingPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PACING_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota or private-browsing errors cleanly.
  }
}

function flattenLoopReadyLeaves(nodes: SyllabusNodeOut[], out: SyllabusLeafOption[] = []): SyllabusLeafOption[] {
  for (const node of nodes) {
    if (node.node_type === "LEAF_TOPIC" && node.beta_ready !== false) {
      out.push({ nodeId: node.node_id, title: node.title });
    }
    if (node.children?.length) {
      flattenLoopReadyLeaves(node.children, out);
    }
  }
  return out;
}

function masteryPercent(mastery?: number | null) {
  if (typeof mastery !== "number" || !Number.isFinite(mastery)) return null;
  return Math.round(Math.max(0, Math.min(1, mastery)) * 100);
}

function safeInternalHref(href: string | null | undefined, fallback: string) {
  if (typeof href === "string" && href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }
  return fallback;
}

function resolveItemHref(item: RevisionPriorityItem): string {
  const subject = item.subject_slug || "geography";
  if (item.source === "topic_revisit") {
    const fallback =
      item.syllabus_node_id != null
        ? `/upsc/${subject}/lms/topic/${item.syllabus_node_id}`
        : `/upsc/${subject}/lms/planner`;
    return safeInternalHref(item.action_href, fallback);
  }
  if (item.source === "weak_topic") {
    const fallback =
      item.syllabus_node_id != null
        ? `/upsc/${subject}/lms/topic/${item.syllabus_node_id}`
        : `/upsc/${subject}/lms/practice`;
    return safeInternalHref(item.action_href, fallback);
  }
  return safeInternalHref(
    item.action_href,
    item.is_overconfident ? "/exam/revision?mode=high_confidence_mistake" : "/exam/revision?mode=recovery",
  );
}

function formatMemoryFlag(flag: string): { label: string; tone: string } {
  const normalized = flag.trim().toUpperCase().replace(/[\s_-]+/g, "_");
  if (normalized.includes("FALSE_MASTERY")) {
    return {
      label: "False Mastery",
      tone: "border-[#d95f43]/50 bg-[#fff1ed] text-[#9d3824]",
    };
  }
  if (normalized.includes("OVERCONFIDENCE")) {
    return {
      label: "Overconfidence Risk",
      tone: "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
    };
  }
  if (normalized.includes("VOLATIL")) {
    return {
      label: "Volatility",
      tone: "border-[#b98324]/50 bg-[#fff8e8] text-[#7a4b0b]",
    };
  }
  return {
    label: flag.replace(/_/g, " "),
    tone: "border-[#dcd5c7] bg-[#f7f4ee] text-[#4f5e55]",
  };
}

function triageBandBadge(band: TriageBand): { title: string; badgeClass: string; cardClass: string } {
  if (band === "SOLID") {
    return {
      title: "Skip / Maintain",
      badgeClass: "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041]",
      cardClass: "border-[#b9d9cd] bg-[#f3fbf7]",
    };
  }
  if (band === "RUSTY") {
    return {
      title: "5-Min Refresh",
      badgeClass: "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]",
      cardClass: "border-[#ef9f27]/70 bg-[#fffaf0]",
    };
  }
  return {
    title: "Surgical Repair",
    badgeClass: "border-[#d95f43]/60 bg-[#fff1ed] text-[#9d3824]",
    cardClass: "border-[#e6a395] bg-[#fff6f4]",
  };
}

function sourceLabel(item: RevisionPriorityItem): string {
  if (item.source === "topic_revisit") {
    return item.revisit_type ? `GS Revisit · ${item.revisit_type}` : "GS Topic Revisit";
  }
  if (item.source === "weak_topic") return "Weak Topic";
  return item.category ?? "Exam Queue";
}

function isMistakeItem(item: RevisionPriorityItem): boolean {
  if (item.source !== "revision_queue" || item.is_overconfident) return false;
  const cat = (item.category ?? "").toUpperCase();
  const reason = (item.reason ?? "").toUpperCase();
  return cat === "MISTAKE" || reason.includes("INCORRECT") || reason.includes("MISTAKE");
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
      <div className="mt-4 rounded-md border border-[#e8b061] bg-[#fff8ed] p-4" role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#9b6517]" />
          <div>
            <p className="text-sm font-black text-[#6f4a12]">Unable to load revision data</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#795f35]">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white hover:bg-[#10291d]"
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

export default function RevisionPage() {
  const [commandCenter, setCommandCenter] = useState<RevisionCommandCenterResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [commandState, setCommandState] = useState<LoadState>("loading");
  const [historyState, setHistoryState] = useState<LoadState>("loading");
  const [commandError, setCommandError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [examDate, setExamDate] = useState<string>("");
  const [dailyMinutes, setDailyMinutes] = useState<number>(25);
  const [pacingHydrated, setPacingHydrated] = useState(false);

  const [activeTab, setActiveTab] = useState<QueueTab>("all");
  const [completingUid, setCompletingUid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedRepairUid, setExpandedRepairUid] = useState<string | null>(null);
  const [selectedRepairOptions, setSelectedRepairOptions] = useState<Record<string, string>>({});

  const [syllabusOptions, setSyllabusOptions] = useState<SyllabusLeafOption[]>([]);
  const [triageRows, setTriageRows] = useState<TriageDraftRow[]>([
    {
      id: "triage-1",
      topicLabel: "",
      subjectSlug: "geography",
      syllabusNodeId: null,
      accuracy: 50,
      confidence: "medium",
    },
  ]);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<RevisionTriageEvaluateResponse | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      const saved = readSavedPacing();
      setExamDate(saved.examDate);
      setDailyMinutes(saved.dailyMinutes);
      setPacingHydrated(true);

      void gsLmsService
        .getSyllabusTree("geography")
        .then((treeData) => {
          if (!active) return;
          setSyllabusOptions(flattenLoopReadyLeaves(treeData.tree));
        })
        .catch(() => {
          // Optional helper list for triage quick-pick; manual input stays available.
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const loadCommandCenter = useCallback(
    async (targetExamDate: string, targetDailyMinutes: number) => {
      setCommandState("loading");
      setCommandError(null);
      try {
        const data = await revisionService.getCommandCenter({
          exam_date: targetExamDate || undefined,
          daily_minutes: targetDailyMinutes,
        });
        setCommandCenter(data);
        setCommandState("ready");
      } catch (error) {
        setCommandCenter(null);
        setCommandState("error");
        setCommandError(getErrorMessage(error));
      }
    },
    [],
  );

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
    await Promise.all([loadCommandCenter(examDate, dailyMinutes), loadHistory()]);
    setIsRefreshing(false);
  }, [dailyMinutes, examDate, loadCommandCenter, loadHistory]);

  useEffect(() => {
    if (!pacingHydrated) return;
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pacingHydrated, refreshAll]);

  const updatePacing = (nextExamDate: string, nextDailyMinutes: number) => {
    setExamDate(nextExamDate);
    setDailyMinutes(nextDailyMinutes);
    writeSavedPacing({ examDate: nextExamDate, dailyMinutes: nextDailyMinutes });
  };

  const handleCalibrateRevision = async (
    item: RevisionPriorityItem,
    rating: RevisionCalibrationRating,
    masteryDelta: number,
  ) => {
    if (item.item_id == null) return;
    setCompletingUid(item.uid);
    setActionError(null);
    try {
      await revisionService.completeRevision(item.item_id, masteryDelta, rating);
      // Do not remove locally: the server command center remains authoritative after calibration.
      await refreshAll();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setCompletingUid(null);
    }
  };

  const handleCompleteRevisit = async (item: RevisionPriorityItem) => {
    if (item.revisit_id == null) return;
    setCompletingUid(item.uid);
    setActionError(null);
    try {
      await gsLmsService.completeRevisit(item.subject_slug || "geography", item.revisit_id);
      await refreshAll();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setCompletingUid(null);
    }
  };

  const priorityQueue = useMemo(() => commandCenter?.priority_queue ?? [], [commandCenter]);

  const tabCounts = useMemo(() => {
    const summary = commandCenter?.summary;
    return {
      all: summary?.total_due ?? priorityQueue.length,
      overconfident:
        summary?.overconfidence_traps ?? priorityQueue.filter((item) => item.is_overconfident).length,
      mistakes: summary?.mistakes_due ?? priorityQueue.filter(isMistakeItem).length,
      revisits:
        summary?.topic_revisits_due ??
        priorityQueue.filter((item) => item.source === "topic_revisit").length,
      weak:
        summary?.weak_topics_count ??
        priorityQueue.filter((item) => item.source === "weak_topic").length,
    };
  }, [commandCenter, priorityQueue]);

  const filteredQueue = useMemo(() => {
    if (activeTab === "overconfident") {
      return priorityQueue.filter((item) => item.is_overconfident);
    }
    if (activeTab === "mistakes") {
      return priorityQueue.filter(isMistakeItem);
    }
    if (activeTab === "revisits") {
      return priorityQueue.filter((item) => item.source === "topic_revisit");
    }
    if (activeTab === "weak") {
      return priorityQueue.filter((item) => item.source === "weak_topic");
    }
    return priorityQueue;
  }, [activeTab, priorityQueue]);

  const updateTriageRow = (id: string, patch: Partial<TriageDraftRow>) => {
    setTriageRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const addTriageRow = () => {
    setTriageRows((current) => [
      ...current,
      {
        id: `triage-${Date.now()}-${current.length + 1}`,
        topicLabel: "",
        subjectSlug: "geography",
        syllabusNodeId: null,
        accuracy: 50,
        confidence: "medium",
      },
    ]);
  };

  const removeTriageRow = (id: string) => {
    setTriageRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  };

  const loadTopGeographyTopics = () => {
    const topTopics = syllabusOptions.slice(0, 5);
    if (topTopics.length === 0) return;
    setTriageError(null);
    setTriageRows(
      topTopics.map((opt, idx) => ({
        id: `triage-geo-${opt.nodeId}-${idx + 1}`,
        topicLabel: opt.title,
        subjectSlug: "geography",
        syllabusNodeId: opt.nodeId,
        accuracy: 60,
        confidence: "medium",
      })),
    );
  };

  const handleRunTriage = async (event: React.FormEvent) => {
    event.preventDefault();
    setTriageError(null);

    const payloadItems: RevisionTriageItemInput[] = triageRows
      .filter((row) => row.topicLabel.trim().length > 0)
      .map((row) => ({
        topic_label: row.topicLabel.trim(),
        subject_slug: row.subjectSlug,
        syllabus_node_id: row.syllabusNodeId,
        accuracy: Math.max(0, Math.min(100, Number.isFinite(row.accuracy) ? row.accuracy : 0)),
        confidence: row.confidence,
      }));

    if (payloadItems.length === 0) {
      setTriageError("Pick or enter at least one topic before running the 60s triage.");
      return;
    }

    setTriageLoading(true);
    try {
      const response = await revisionService.evaluateTriage(payloadItems);
      setTriageResult(response);
    } catch (error) {
      setTriageError(getErrorMessage(error));
    } finally {
      setTriageLoading(false);
    }
  };

  const isLoaded = commandState === "ready" && historyState === "ready";
  const pacing = commandCenter?.pacing;
  const memoryAlerts = commandCenter?.memory_alerts ?? [];

  return (
    <div className="space-y-5 text-[#13251d]">
      {/* Hero / Command Header */}
      <section
        data-testid="student-revision-command"
        data-loaded={String(isLoaded)}
        data-queue-state={commandState}
        data-history-state={historyState}
        data-queue-count={priorityQueue.length}
        data-history-count={history.length}
        className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Revision command center
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Your revision queue &amp; recall pacing
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#5d675f]">
              Exam mistakes, overconfidence traps, GS Day 3/7/21 topic revisits, and weak topics are
              unified here from your authenticated server state. Every calibration updates your next
              review window on the backend.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={isRefreshing}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-4 text-sm font-black text-[#1a3a2a] hover:bg-[#f2eadc] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh queue"}
          </button>
        </div>

        {/* Summary Strip — honest states only */}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-black text-[#4f5e55]">
          {commandState === "ready" && commandCenter ? (
            <>
              <span className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] px-3 py-2">
                {commandCenter.summary.total_due} pending
              </span>
              <span className="rounded-md border border-[#ef9f27]/70 bg-[#fff4df] px-3 py-2 text-[#6f4a12]">
                {commandCenter.summary.overconfidence_traps} overconfidence trap
                {commandCenter.summary.overconfidence_traps === 1 ? "" : "s"}
              </span>
              <span className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] px-3 py-2">
                ~{commandCenter.summary.estimated_minutes_today} min est. today
              </span>
            </>
          ) : commandState === "error" ? (
            <span className="rounded-md border border-[#e8b061] bg-[#fff8ed] px-3 py-2 text-[#6f4a12]">
              Queue counts unavailable until server reload succeeds
            </span>
          ) : (
            <span className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] px-3 py-2">
              Loading server queue counts...
            </span>
          )}

          {historyState === "ready" && (
            <span className="rounded-md border border-[#e4dccf] bg-[#f7f4ee] px-3 py-2">
              {history.length} reviewed record{history.length === 1 ? "" : "s"}
            </span>
          )}

          <Link
            href="/exam/revision?mode=recovery"
            className="inline-flex min-h-11 items-center rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] px-3.5 text-xs font-black text-[#085041] hover:bg-[#d7efe5]"
          >
            Open rapid drill <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
          <Link
            href="/exam/revision?mode=high_confidence_mistake"
            className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-3.5 text-xs font-black text-white hover:bg-[#10291d]"
          >
            Drill Overconfidence Traps <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Exam-Countdown Pacing Strip */}
        <div className="mt-5 rounded-lg border border-[#e4dccf] bg-[#f7f4ee] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label
                  htmlFor="revision-exam-date"
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#4f5e55]"
                >
                  <Calendar className="h-3.5 w-3.5 text-[#1d9e75]" />
                  Target Exam Date
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="revision-exam-date"
                    type="date"
                    value={examDate}
                    onChange={(event) => updatePacing(event.target.value, dailyMinutes)}
                    className="min-h-11 rounded-md border border-[#cfc6b6] bg-white px-3 text-base sm:text-sm font-bold text-[#13251d] outline-none focus:border-[#1d9e75]"
                  />
                  {examDate && (
                    <button
                      type="button"
                      onClick={() => updatePacing("", dailyMinutes)}
                      className="inline-flex min-h-11 items-center rounded-md border border-[#cfc6b6] bg-white px-3 text-xs font-black text-[#5d675f] hover:bg-[#f2eadc]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4f5e55]">
                  Daily Revision Budget
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {DAILY_MINUTE_OPTIONS.map((mins) => {
                    const active = dailyMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updatePacing(examDate, mins)}
                        className={`inline-flex min-h-11 items-center rounded-md border px-3 text-xs font-black transition ${
                          active
                            ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                            : "border-[#cfc6b6] bg-white text-[#1a3a2a] hover:bg-[#e7f5ee]"
                        }`}
                      >
                        {mins} min
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-[#dcd5c7] bg-[#fffdf8] px-4 py-3 text-xs font-semibold text-[#4f5e55] lg:max-w-md">
              {commandState === "ready" && pacing ? (
                pacing.exam_date && pacing.days_remaining != null ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-black text-[#085041]">
                      {pacing.days_remaining} day{pacing.days_remaining === 1 ? "" : "s"} remaining
                    </span>
                    {pacing.recommended_daily_items != null && (
                      <span>Target: {pacing.recommended_daily_items} items/day</span>
                    )}
                    {pacing.projected_cycles_before_exam != null && (
                      <span>Projected cycles: {pacing.projected_cycles_before_exam}</span>
                    )}
                  </div>
                ) : (
                  <p className="font-bold text-[#4f5e55]">
                    Set an exam date to calculate daily revision pacing
                  </p>
                )
              ) : commandState === "error" ? (
                <p className="font-bold text-[#6f4a12]">
                  Live pacing could not be calculated while the server read failed.
                </p>
              ) : (
                <p className="font-bold text-[#5d675f]">Calculating backend pacing...</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {actionError && (
        <div
          className="rounded-md border border-[#e8b061] bg-[#fff8ed] p-4 text-sm font-bold text-[#6f4a12]"
          role="alert"
        >
          Could not update that revision item: {actionError}
        </div>
      )}

      {/* Memory Alerts Panel — rendered ONLY when memory_alerts.length > 0 */}
      {commandState === "ready" && memoryAlerts.length > 0 && (
        <section
          aria-labelledby="memory-alerts-heading"
          className="rounded-lg border border-[#ef9f27]/70 bg-[#fff8ed] p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-[#9b6517]" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9b6517]">
                Memory risk signals
              </p>
              <h2 id="memory-alerts-heading" className="text-xl font-black tracking-tight text-[#13251d]">
                Topics needing calibration attention
              </h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {memoryAlerts.map((alert) => (
              <article
                key={alert.topic}
                className="rounded-lg border border-[#e8b061] bg-[#fffdf8] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-black text-[#13251d]">{alert.topic}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.flags.map((flag) => {
                      const badge = formatMemoryFlag(flag);
                      return (
                        <span
                          key={flag}
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${badge.tone}`}
                        >
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">
                  {alert.safety_note}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-[#4f5e55]">
                  {alert.latest_score != null && (
                    <span>Latest score: {Math.round(alert.latest_score)}%</span>
                  )}
                  {alert.probability != null && (
                    <span>Risk confidence: {Math.round(alert.probability * 100)}%</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Unified Priority Queue */}
      <section
        className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
        data-testid="revision-queue"
        data-state={commandState}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-[#085041]" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Unified Priority Queue
              </p>
              <h2 className="text-2xl font-black tracking-tight">Pending revision items</h2>
            </div>
          </div>

          <Link
            href="/exam/revision?mode=high_confidence_mistake"
            className="inline-flex min-h-11 items-center rounded-md border border-[#ef9f27] bg-[#fff4df] px-3.5 text-xs font-black text-[#6f4a12] hover:bg-[#fde9c3]"
          >
            <Flame className="mr-1.5 h-3.5 w-3.5" />
            Drill Overconfidence Traps
          </Link>
        </div>

        {/* Queue Filter Tabs (all min-h-11) */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-[#e4dccf] pb-4" role="tablist" aria-label="Revision queue filters">
          {(
            [
              { id: "all", label: "All Due", count: tabCounts.all },
              { id: "overconfident", label: "Overconfidence Traps", count: tabCounts.overconfident },
              { id: "mistakes", label: "Mistakes", count: tabCounts.mistakes },
              { id: "revisits", label: "GS Topic Revisits", count: tabCounts.revisits },
              { id: "weak", label: "Weak Topics", count: tabCounts.weak },
            ] as const
          ).map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3.5 text-xs font-black transition ${
                  selected
                    ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                    : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
                }`}
              >
                <span>{tab.label}</span>
                {commandState === "ready" && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                      selected ? "bg-white/20 text-white" : "bg-white text-[#1a3a2a]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "overconfident" && commandState === "ready" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#ef9f27]/70 bg-[#fff4df] p-3.5">
            <p className="text-xs font-bold text-[#6f4a12]">
              High-confidence mistakes carry the highest negative-marking risk. Run a focused rapid drill now.
            </p>
            <Link
              href="/exam/revision?mode=high_confidence_mistake"
              className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white hover:bg-[#10291d]"
            >
              Drill Overconfidence Traps <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {(commandState !== "ready" || filteredQueue.length === 0) && (
          <StateMessage
            state={commandState}
            error={commandError}
            emptyMessage={
              activeTab === "all"
                ? "Your server revision queue is clear. New exam mistakes, GS Day 3/7/21 revisits, or weak topics will appear here."
                : "No due items match this filter right now."
            }
            onRetry={() => void loadCommandCenter(examDate, dailyMinutes)}
          />
        )}

        {commandState === "ready" && filteredQueue.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filteredQueue.map((item) => {
              const mastery = masteryPercent(item.mastery);
              const isBusy = completingUid === item.uid;
              const targetHref = resolveItemHref(item);
              const dueLabel = formatShortDate(item.due_at);
              const repairCard = item.repair_card;
              const hasRepairCard = Boolean(
                repairCard &&
                  (repairCard.concept_bullets.length > 0 || Boolean(repairCard.question_text)),
              );
              const isRepairExpanded = expandedRepairUid === item.uid;
              const selectedOption = selectedRepairOptions[item.uid];
              const isCorrectOption = Boolean(
                selectedOption &&
                  repairCard?.correct_option &&
                  selectedOption.trim().toUpperCase() ===
                    repairCard.correct_option.trim().toUpperCase(),
              );

              return (
                <article
                  key={item.uid}
                  className="flex flex-col justify-between rounded-lg border border-[#e4dccf] bg-[#f7f4ee] p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-[#e7f5ee] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">
                          {sourceLabel(item)}
                        </span>
                        {item.is_overconfident && (
                          <span className="inline-flex items-center gap-1 rounded bg-[#fff4df] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#6f4a12] border border-[#ef9f27]/70">
                            <AlertTriangle className="h-3 w-3" /> Overconfidence Trap
                          </span>
                        )}
                      </div>
                      <span className="rounded-md bg-[#fffdf8] px-2.5 py-1 text-xs font-black text-[#6f4a12]">
                        Priority {Math.round(item.priority * 10) / 10}
                      </span>
                    </div>

                    <h3 className="mt-2 text-lg font-black text-[#13251d]">{item.topic}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#4f5e55]">{item.reason}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#5d675f]">
                      {item.question_id != null && <span>Question #{item.question_id}</span>}
                      {item.review_count != null && (
                        <span>
                          • {item.review_count} prior review{item.review_count === 1 ? "" : "s"}
                        </span>
                      )}
                      {item.forgetting_count != null && item.forgetting_count > 0 && (
                        <span>• {item.forgetting_count} lapse{item.forgetting_count === 1 ? "" : "s"}</span>
                      )}
                      {mastery != null && <span>• {mastery}% mastery</span>}
                      {dueLabel && <span>• Due {dueLabel}</span>}
                    </div>

                    {hasRepairCard && repairCard && (
                      <div className="mt-4">
                        <button
                          type="button"
                          aria-expanded={isRepairExpanded}
                          onClick={() =>
                            setExpandedRepairUid((curr) => (curr === item.uid ? null : item.uid))
                          }
                          className="inline-flex min-h-11 items-center rounded-md border border-[#1d9e75]/50 bg-[#fffdf8] px-3.5 text-xs font-black text-[#085041] hover:bg-[#e7f5ee]"
                        >
                          1-Screen Surgical Repair
                        </button>

                        {isRepairExpanded && (
                          <div className="mt-3 space-y-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4">
                            {repairCard.concept_bullets.length > 0 && (
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                                  Core Concepts to Recall
                                </p>
                                <ul className="mt-2 space-y-1.5">
                                  {repairCard.concept_bullets.map((bullet, idx) => (
                                    <li
                                      key={`${item.uid}-bullet-${idx}`}
                                      className="flex items-start gap-2 text-xs font-semibold leading-5 text-[#13251d]"
                                    >
                                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1d9e75]" />
                                      <span>{bullet}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {repairCard.question_text && repairCard.options.length > 0 && (
                              <div className="space-y-2.5 border-t border-[#e4dccf] pt-3">
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6f4a12]">
                                  Instant Re-Test
                                </p>
                                <p className="text-sm font-bold leading-6 text-[#13251d]">
                                  {repairCard.question_text}
                                </p>
                                <div className="grid gap-2">
                                  {repairCard.options.map((opt) => {
                                    const isSelected = selectedOption === opt.id;
                                    const matchesCorrect = Boolean(
                                      repairCard.correct_option &&
                                        opt.id.trim().toUpperCase() ===
                                          repairCard.correct_option.trim().toUpperCase(),
                                    );
                                    let optionClass =
                                      "border-[#cfc6b6] bg-white text-[#13251d] hover:bg-[#f7f4ee]";
                                    if (selectedOption) {
                                      if (matchesCorrect) {
                                        optionClass =
                                          "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
                                      } else if (isSelected) {
                                        optionClass =
                                          "border-[#d95f43] bg-[#fff1ed] text-[#9d3824]";
                                      }
                                    }

                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() =>
                                          setSelectedRepairOptions((prev) => ({
                                            ...prev,
                                            [item.uid]: opt.id,
                                          }))
                                        }
                                        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs font-bold transition ${optionClass}`}
                                      >
                                        <span>
                                          <strong className="mr-1.5 font-black uppercase">
                                            {opt.id}.
                                          </strong>
                                          {opt.text}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {selectedOption && (
                                  <div
                                    className={`rounded-md border p-3 text-xs ${
                                      isCorrectOption
                                        ? "border-[#1d9e75]/50 bg-[#e7f5ee] text-[#085041]"
                                        : "border-[#d95f43]/60 bg-[#fff1ed] text-[#9d3824]"
                                    }`}
                                  >
                                    <p className="font-black">
                                      {isCorrectOption
                                        ? "Correct — concept verified"
                                        : `Trap triggered — Correct answer: ${repairCard.correct_option ?? "N/A"}`}
                                    </p>
                                    {repairCard.explanation && (
                                      <p className="mt-1.5 font-semibold leading-5 text-[#13251d]">
                                        {repairCard.explanation}
                                      </p>
                                    )}
                                    <p className="mt-2 font-bold text-[#4f5e55]">
                                      {item.source === "topic_revisit"
                                        ? "Click Mark Revisit Done below to record this topic review."
                                        : isCorrectOption
                                          ? "Click Solid · Extend below to advance your next review window."
                                          : "Click Blank · 1d below to schedule a 24-hour recovery pass."}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Calibration & Revisit Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {item.source === "revision_queue" && item.item_id != null && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleCalibrateRevision(item, "blank", -0.2)}
                          disabled={completingUid !== null}
                          className="inline-flex min-h-11 items-center rounded-md border border-[#d95f43]/60 bg-[#fff1ed] px-3 text-xs font-black text-[#9d3824] hover:bg-[#ffe4dc] disabled:cursor-wait disabled:opacity-60"
                        >
                          {isBusy ? <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                          Blank · 1d
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCalibrateRevision(item, "shaky", 0.05)}
                          disabled={completingUid !== null}
                          className="inline-flex min-h-11 items-center rounded-md border border-[#ef9f27] bg-[#fff4df] px-3 text-xs font-black text-[#6f4a12] hover:bg-[#fde9c3] disabled:cursor-wait disabled:opacity-60"
                        >
                          Shaky · Short
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCalibrateRevision(item, "solid", 0.25)}
                          disabled={completingUid !== null}
                          className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white hover:bg-[#10291d] disabled:cursor-wait disabled:opacity-60"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Solid · Extend
                        </button>
                      </>
                    )}

                    {item.source === "topic_revisit" && (
                      <>
                        <Link
                          href={targetHref}
                          className="inline-flex min-h-11 items-center rounded-md border border-[#1d9e75]/50 bg-[#fffdf8] px-3.5 text-xs font-black text-[#085041] hover:bg-[#e7f5ee]"
                        >
                          Revise Topic <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                        {item.revisit_id != null && (
                          <button
                            type="button"
                            onClick={() => void handleCompleteRevisit(item)}
                            disabled={completingUid !== null}
                            className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-3.5 text-xs font-black text-white hover:bg-[#10291d] disabled:cursor-wait disabled:opacity-60"
                          >
                            {isBusy ? (
                              <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Mark Revisit Done
                          </button>
                        )}
                      </>
                    )}

                    {item.source === "weak_topic" && (
                      <Link
                        href={targetHref}
                        className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-4 text-xs font-black text-white hover:bg-[#10291d]"
                      >
                        Practice Weak Topic <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 60s Diagnostic Triage Card */}
      <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-[#085041]" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Diagnostic Triage
              </p>
              <h2 className="text-2xl font-black tracking-tight">
                Test Before You Read — 60s Topic Triage
              </h2>
            </div>
          </div>
          {syllabusOptions.length > 0 && (
            <button
              type="button"
              onClick={loadTopGeographyTopics}
              className="inline-flex min-h-11 items-center rounded-md border border-[#1d9e75]/40 bg-[#e7f5ee] px-3.5 text-xs font-black text-[#085041] hover:bg-[#d7efe5]"
            >
              Load Top Geography Topics
            </button>
          )}
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
          Rate your recall accuracy and confidence on topics before opening notes. The engine classifies
          each topic into Skip (Green), 5-Min Refresh (Amber), or Surgical Repair (Red).
        </p>

        <form onSubmit={(event) => void handleRunTriage(event)} className="mt-4 space-y-3">
          {triageRows.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-lg border border-[#e4dccf] bg-[#f7f4ee] p-4 lg:grid-cols-[1.4fr_0.9fr_1fr_auto] lg:items-end"
            >
              <div className="space-y-2">
                <label
                  htmlFor={`triage-topic-${row.id}`}
                  className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#4f5e55]"
                >
                  Topic {index + 1}
                </label>
                {syllabusOptions.length > 0 && (
                  <select
                    aria-label={`Pick Geography topic for row ${index + 1}`}
                    value={row.syllabusNodeId != null ? String(row.syllabusNodeId) : ""}
                    onChange={(event) => {
                      const val = event.target.value;
                      if (!val) {
                        updateTriageRow(row.id, { syllabusNodeId: null });
                        return;
                      }
                      const nodeId = Number(val);
                      const picked = syllabusOptions.find((opt) => opt.nodeId === nodeId);
                      if (picked) {
                        updateTriageRow(row.id, {
                          topicLabel: picked.title,
                          syllabusNodeId: picked.nodeId,
                          subjectSlug: "geography",
                        });
                      }
                    }}
                    className="min-h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-base sm:text-sm font-semibold text-[#13251d] outline-none focus:border-[#1d9e75]"
                  >
                    <option value="">Select open Geography topic (optional)</option>
                    {syllabusOptions.map((opt) => (
                      <option key={opt.nodeId} value={opt.nodeId}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  id={`triage-topic-${row.id}`}
                  type="text"
                  value={row.topicLabel}
                  onChange={(event) =>
                    updateTriageRow(row.id, {
                      topicLabel: event.target.value,
                      syllabusNodeId: null,
                    })
                  }
                  placeholder="Or type any UPSC topic (e.g. Indian Monsoon)"
                  className="min-h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-base sm:text-sm font-semibold text-[#13251d] placeholder:text-[#8a8174] outline-none focus:border-[#1d9e75]"
                />
              </div>

              <div>
                <label
                  htmlFor={`triage-acc-${row.id}`}
                  className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#4f5e55]"
                >
                  Self-Rated Accuracy (%)
                </label>
                <input
                  id={`triage-acc-${row.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={row.accuracy}
                  onChange={(event) =>
                    updateTriageRow(row.id, {
                      accuracy: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                    })
                  }
                  className="mt-1.5 min-h-11 w-full rounded-md border border-[#cfc6b6] bg-white px-3 text-base sm:text-sm font-bold text-[#13251d] outline-none focus:border-[#1d9e75]"
                />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4f5e55]">
                  Confidence
                </p>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {(["low", "medium", "high"] as const).map((level) => {
                    const selected = row.confidence === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => updateTriageRow(row.id, { confidence: level })}
                        className={`min-h-11 rounded-md border px-2 text-xs font-black capitalize transition ${
                          selected
                            ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                            : "border-[#cfc6b6] bg-white text-[#34453b] hover:bg-[#e7f5ee]"
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-end">
                {triageRows.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove topic ${index + 1}`}
                    onClick={() => removeTriageRow(row.id)}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-xs font-black text-[#6f4a12] hover:bg-[#fff1ed]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {triageError && (
            <div
              role="alert"
              className="rounded-md border border-[#e8b061] bg-[#fff8ed] p-3 text-sm font-bold text-[#6f4a12]"
            >
              {triageError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addTriageRow}
              className="inline-flex min-h-11 items-center rounded-md border border-[#cfc6b6] bg-white px-4 text-xs font-black text-[#1a3a2a] hover:bg-[#f2eadc]"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add another topic
            </button>
            <button
              type="submit"
              disabled={triageLoading}
              className="inline-flex min-h-11 items-center rounded-md bg-[#1a3a2a] px-5 text-xs font-black text-white hover:bg-[#10291d] disabled:cursor-wait disabled:opacity-60"
            >
              {triageLoading ? (
                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <SlidersHorizontal className="mr-1.5 h-4 w-4" />
              )}
              {triageLoading ? "Evaluating triage..." : "Run 60s Triage"}
            </button>
          </div>
        </form>

        {triageResult && (
          <div className="mt-5 space-y-4 border-t border-[#e4dccf] pt-5">
            <div className="flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-md border border-[#b9d9cd] bg-[#e7f5ee] px-3 py-1.5 text-[#085041]">
                {triageResult.counts.solid} Skip (Green)
              </span>
              <span className="rounded-md border border-[#ef9f27] bg-[#fff4df] px-3 py-1.5 text-[#6f4a12]">
                {triageResult.counts.rusty} 5-Min Refresh (Amber)
              </span>
              <span className="rounded-md border border-[#e6a395] bg-[#fff1ed] px-3 py-1.5 text-[#9d3824]">
                {triageResult.counts.blind_spot} Surgical Repair (Red)
              </span>
              {triageResult.counts.overconfidence_alerts > 0 && (
                <span className="rounded-md border border-[#ef9f27] bg-[#fff4df] px-3 py-1.5 text-[#6f4a12]">
                  {triageResult.counts.overconfidence_alerts} Overconfidence Alert
                  {triageResult.counts.overconfidence_alerts === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {triageResult.results.map((res) => {
                const style = triageBandBadge(res.band);
                const subject = res.subject_slug || "geography";
                const topicHref =
                  res.syllabus_node_id != null
                    ? `/upsc/${subject}/lms/topic/${res.syllabus_node_id}`
                    : res.overconfidence_alert
                      ? "/exam/revision?mode=high_confidence_mistake"
                      : `/upsc/${subject}/lms/syllabus`;

                return (
                  <article
                    key={`${res.topic_label}-${res.band}`}
                    className={`rounded-lg border p-4 ${style.cardClass}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span
                        className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${style.badgeClass}`}
                      >
                        {style.title}
                      </span>
                      {res.overconfidence_alert && (
                        <span className="rounded-md border border-[#ef9f27] bg-[#fff4df] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#6f4a12]">
                          Overconfidence Alert
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-black text-[#13251d]">{res.topic_label}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#4f5e55]">{res.action_label}</p>
                    <p className="mt-2 text-xs font-bold text-[#5d675f]">
                      Recommended next interval: {res.recommended_interval_days} day
                      {res.recommended_interval_days === 1 ? "" : "s"}
                    </p>
                    <Link
                      href={topicHref}
                      className="mt-3 inline-flex min-h-11 items-center rounded-md border border-[#cfc6b6] bg-white px-3.5 text-xs font-black text-[#1a3a2a] hover:bg-[#f2eadc]"
                    >
                      {res.syllabus_node_id != null
                        ? "Open Topic"
                        : res.overconfidence_alert
                          ? "Drill Overconfidence Traps"
                          : "Open Syllabus"}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Revision History */}
      <section
        className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
        data-testid="revision-history"
        data-state={historyState}
      >
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-[#085041]" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">History</p>
            <h2 className="text-2xl font-black tracking-tight">Completed revision records</h2>
          </div>
        </div>
        {(historyState !== "ready" || history.length === 0) && (
          <StateMessage
            state={historyState}
            error={historyError}
            emptyMessage="No completed revision records yet. Complete an item and it will be recorded here by the server."
            onRetry={() => void loadHistory()}
          />
        )}
        {historyState === "ready" && history.length > 0 && (
          <div className="mt-5 divide-y divide-[#e4dccf] rounded-md border border-[#e4dccf] bg-[#f7f4ee]">
            {history.map((item) => (
              <div
                key={`${item.id}-${item.last_reviewed_at}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-black">{item.topic}</p>
                  <p className="mt-1 text-xs font-semibold text-[#5d675f]">
                    {item.category} · {formatDate(item.last_reviewed_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-[#1a3a2a]">
                  <Clock3 className="h-4 w-4" />{" "}
                  {Math.round(Math.max(0, Math.min(1, item.mastery_at_time)) * 100)}% mastery
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
