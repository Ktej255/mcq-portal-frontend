"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Info,
  Layers,
  PenLine,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { gsLmsService } from "@/services/api/gsLmsService";
import { apiErrorMessage } from "@/services/api/error";
import type {
  MainsOutcomeOut,
  ReadinessBand,
  ReadinessConfidenceLevel,
  ReadinessOut,
  ReadinessStatus,
  ReadinessTrendPointOut,
} from "@/services/api/gsLmsService";
import { useApiConfig } from "@/lib/hooks/useApi";
import { LmsEmptyState } from "./LmsEmptyState";
import { LmsLoadingSkeleton } from "./LmsLoadingSkeleton";
import { useSubjectLms } from "./SubjectLmsContext";

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  ReadinessStatus,
  { label: string; chip: string; hint: string }
> = {
  UNTOUCHED: {
    label: "Not started",
    chip: "border-[#dcd5c7] bg-[#f3f1ea] text-[#536259]",
    hint: "No reviewed sections completed yet.",
  },
  IN_PROGRESS: {
    label: "In progress",
    chip: "border-[#c9dbf7] bg-[#eef4ff] text-[#2f5a9e]",
    hint: "Some sections are complete, but coverage is still below half.",
  },
  UNVERIFIED: {
    label: "Unverified",
    chip: "border-[#efd8a7] bg-[#fff8e8] text-[#6f4a12]",
    hint: "Content is largely covered, but there is no test or recall evidence yet.",
  },
  WEAK: {
    label: "Weak",
    chip: "border-[#f3c6c6] bg-[#fdecec] text-[#a63a3a]",
    hint: "Tested performance is below 55% under shrinkage.",
  },
  DEVELOPING: {
    label: "Developing",
    chip: "border-[#f3d2bb] bg-[#fff1e8] text-[#9a4b16]",
    hint: "Tested performance is 55% to 69%.",
  },
  SECURE: {
    label: "Secure",
    chip: "border-[#b9d9cd] bg-[#e7f5ee] text-[#0f6b4f]",
    hint: "Tested performance is 70% to 84%.",
  },
  STRONG: {
    label: "Strong",
    chip: "border-[#8ecfae] bg-[#dff3e8] text-[#085041]",
    hint: "Tested performance is 85% or more.",
  },
};

const BAND_META: Record<
  ReadinessBand,
  { label: string; chip: string; summary: string }
> = {
  INSUFFICIENT_EVIDENCE: {
    label: "Band withheld",
    chip: "border-[#efd8a7] bg-[#fff8e8] text-[#6f4a12]",
    summary: "Not enough demand has been assessed to assign a performance band.",
  },
  FOUNDATION: {
    label: "Foundation",
    chip: "border-[#dcd5c7] bg-[#f3f1ea] text-[#536259]",
    summary: "The current evidence sits below the competitive range.",
  },
  DEVELOPING: {
    label: "Developing",
    chip: "border-[#f3d2bb] bg-[#fff1e8] text-[#9a4b16]",
    summary: "The current evidence is approaching the competitive range.",
  },
  COMPETITIVE: {
    label: "Competitive",
    chip: "border-[#b9d9cd] bg-[#e7f5ee] text-[#0f6b4f]",
    summary: "The current evidence sits inside the competitive range.",
  },
  STRONG: {
    label: "Strong",
    chip: "border-[#8ecfae] bg-[#dff3e8] text-[#085041]",
    summary: "The current evidence sits well inside the competitive range.",
  },
};

const CONFIDENCE_META: Record<
  ReadinessConfidenceLevel,
  { label: string; chip: string }
> = {
  HIGH: {
    label: "High evidence confidence",
    chip: "border-[#8ecfae] bg-[#e7f5ee] text-[#0f6b4f]",
  },
  MEDIUM: {
    label: "Medium evidence confidence",
    chip: "border-[#efd8a7] bg-[#fff8e8] text-[#6f4a12]",
  },
  LOW: {
    label: "Low evidence confidence",
    chip: "border-[#dcd5c7] bg-[#fffdf8] text-[#536259]",
  },
};

type TopicFilter = "all" | "examined" | "untested" | "high-demand";

const FILTERS: Array<{ id: TopicFilter; label: string }> = [
  { id: "all", label: "All topics" },
  { id: "examined", label: "Tested" },
  { id: "untested", label: "Not tested" },
  { id: "high-demand", label: "High demand" },
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: ReadinessStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      title={meta.hint}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.chip}`}
    >
      {meta.label}
    </span>
  );
}

function MetricBar({
  value,
  tone = "green",
  className = "",
}: {
  value: number;
  tone?: "green" | "amber" | "red";
  className?: string;
}) {
  const width = Math.max(0, Math.min(100, value));
  const fill =
    tone === "amber"
      ? "bg-[#ef9f27]"
      : tone === "red"
        ? "bg-[#c64b4b]"
        : "bg-[#1d9e75]";
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-[#e8e2d5] ${className}`}
      role="presentation"
    >
      <div
        className={`h-full rounded-full transition-all ${fill}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  caption,
  barValue,
  tone = "green",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  caption: string;
  barValue: number;
  tone?: "green" | "amber" | "red";
}) {
  return (
    <div className="rounded-xl border border-[#dcd5c7] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#536259]">
          {label}
        </p>
        <span className="text-[#1d9e75]">{icon}</span>
      </div>
      <p className="mt-1 text-2xl font-black text-[#1a3a2a]">{value}</p>
      <div className="mt-2">
        <MetricBar value={barValue} tone={tone} />
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-[#536259]">{caption}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mains outcome card
// ---------------------------------------------------------------------------

function MainsOutcomeCard({ outcome }: { outcome: MainsOutcomeOut }) {
  const band = outcome.band;
  const projection = outcome.projection;
  const available = outcome.available && band !== null && projection !== null;

  const confidenceChip =
    outcome.confidence.level === "moderate"
      ? "border-[#b9d9cd] bg-[#e7f5ee] text-[#0f6b4f]"
      : outcome.confidence.level === "low"
        ? "border-[#efd8a7] bg-[#fff8e8] text-[#6f4a12]"
        : outcome.confidence.level === "very_low"
          ? "border-[#f3d2bb] bg-[#fff1e8] text-[#9a4b16]"
          : "border-[#dcd5c7] bg-[#f3f1ea] text-[#536259]";

  return (
    <section
      aria-label="Mains written-answer outcome estimate"
      className="rounded-2xl border border-[#dcd5c7] bg-white p-5 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
            <PenLine className="h-3.5 w-3.5" />
            Mains written answers
          </p>
          <h2 className="mt-1 text-lg font-black text-[#1a3a2a]">
            Where your scored answers stand
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#536259]">
            Built only from complete evaluator reports on this subject. It is a
            range with its evidence count, not a score prediction.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold ${confidenceChip}`}
        >
          {outcome.confidence.label}
        </span>
      </div>

      {available ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#eee8db] bg-[#f7f4ee] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#536259]">
                Score band on scored answers
              </p>
              <p className="mt-1 text-2xl font-black text-[#1a3a2a]">
                {band.low_pct.toFixed(1)}%–{band.high_pct.toFixed(1)}%
              </p>
              <p className="text-[11px] text-[#536259]">
                expected {band.expected_pct.toFixed(1)}% · observed{" "}
                {band.observed_min_pct.toFixed(0)}–{band.observed_max_pct.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-[#eee8db] bg-[#f7f4ee] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#536259]">
                Projected on {projection.covered_papers.join(", ")}
              </p>
              <p className="mt-1 text-2xl font-black text-[#1a3a2a]">
                {Math.round(projection.low_marks)}–{Math.round(projection.high_marks)}
                <span className="text-sm font-bold text-[#536259]">
                  {" "}
                  / {projection.covered_marks}
                </span>
              </p>
              <p className="text-[11px] text-[#536259]">
                expected {Math.round(projection.expected_marks)} marks
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {projection.per_paper.map((paper) => (
              <div
                key={paper.paper}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-[#eee8db] px-3 py-2 text-xs"
              >
                <span className="font-bold text-[#1a3a2a]">
                  {paper.paper}
                  <span className="ml-1 font-normal text-[#536259]">
                    · {paper.answers} scored answer
                    {paper.answers === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="text-[#254438]">
                  {Math.round(paper.low_marks)}–
                  {Math.round(paper.high_marks)} / {paper.out_of} marks
                  <span className="ml-1 text-[#536259]">
                    (expected {Math.round(paper.expected_marks)})
                  </span>
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 rounded-lg border border-[#efd8a7] bg-[#fff8e8] px-3 py-2 text-[11px] leading-relaxed text-[#6f4a12]">
            <strong>Next step:</strong> {outcome.next_step}
          </p>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-[#efd8a7] bg-[#fff8e8] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-[#6f4a12]">
              Insufficient evidence — no band shown
            </p>
            <p className="text-[11px] font-bold text-[#6f4a12]">
              {outcome.answers_evaluated} of {outcome.minimum_questions} scored
              answers
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0e2c8]">
            <div
              className="h-full rounded-full bg-[#c98a2e]"
              style={{
                width: `${Math.min(
                  100,
                  (100 * outcome.answers_evaluated) / outcome.minimum_questions,
                )}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#6f4a12]">
            {outcome.reason ??
              "A band appears only after enough distinct answers are scored."}
          </p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-[#6f4a12]">
            {outcome.next_step}
          </p>
        </div>
      )}

      <details className="mt-3 text-[11px] text-[#536259]">
        <summary className="cursor-pointer font-semibold text-[#1a3a2a]">
          What this estimate does and does not use
        </summary>
        <ul className="mt-1.5 list-disc space-y-1 pl-4">
          {outcome.caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </details>

      <p className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#8a978f]">
        <Info className="h-3 w-3" />
        Estimate only · machine-scored · no selection, rank, or cut-off guarantee
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function ReadinessDashboard() {
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [readiness, setReadiness] = useState<ReadinessOut | null>(null);
  const [trend, setTrend] = useState<ReadinessTrendPointOut[]>([]);
  const [mainsOutcome, setMainsOutcome] = useState<MainsOutcomeOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TopicFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      gsLmsService.getReadiness(subject),
      gsLmsService
        .getReadinessTrend(subject, 30)
        .catch(() => [] as ReadinessTrendPointOut[]),
      gsLmsService.getMainsOutcome(subject).catch(() => null),
    ])
      .then(([report, trendRows, mains]) => {
        setReadiness(report);
        setTrend(trendRows);
        setMainsOutcome(mains);
      })
      .catch((err) =>
        setError(apiErrorMessage(err, "Failed to load readiness data")),
      )
      .finally(() => setLoading(false));
  }, [subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => fetchData());
  }, [isLoaded, isSignedIn, fetchData]);

  const filteredTopics = useMemo(() => {
    if (!readiness) return [];
    switch (filter) {
      case "examined":
        return readiness.topics.filter((topic) => topic.has_evidence);
      case "untested":
        return readiness.topics.filter((topic) => !topic.has_evidence);
      case "high-demand":
        return readiness.topics.filter((topic) => topic.demand_score >= 70);
      default:
        return readiness.topics;
    }
  }, [readiness, filter]);

  const demandLeaders = useMemo(() => {
    if (!readiness) return [];
    return [...readiness.topics]
      .sort(
        (a, b) =>
          b.demand_score - a.demand_score ||
          b.demand_share_pct - a.demand_share_pct,
      )
      .slice(0, 5);
  }, [readiness]);

  if (loading) return <LmsLoadingSkeleton variant="list" />;

  if (error) {
    return (
      <div className="rounded-xl border border-[#f3c6c6] bg-[#fdecec] p-5">
        <p className="text-sm font-semibold text-[#a63a3a]">{error}</p>
        <p className="mt-1 text-xs text-[#a63a3a]/80">
          Readiness is computed from your progress, practice, and recall records.
        </p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#1d9e75] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#178362]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!readiness) return null;

  if (readiness.topics.length === 0) {
    return (
      <LmsEmptyState
        title="No reviewed topics yet"
        description="Readiness appears once this subject has reviewed syllabus topics. Nothing here is being graded or guessed."
      />
    );
  }

  const { summary, coverage, depth, evidence, data_quality: quality } =
    readiness;
  const projection = summary.projection;
  const band = BAND_META[summary.band];
  const confidence = CONFIDENCE_META[summary.confidence.level];
  const suppressed = summary.band_suppressed;
  const correct = projection.correct;
  const net = projection.net_marks;

  const filterCounts: Record<TopicFilter, number> = {
    all: readiness.topics.length,
    examined: readiness.topics.filter((topic) => topic.has_evidence).length,
    untested: readiness.topics.filter((topic) => !topic.has_evidence).length,
    "high-demand": readiness.topics.filter((topic) => topic.demand_score >= 70)
      .length,
  };

  const TOPIC_PREVIEW_COUNT = 12;
  const visibleTopics = showAll
    ? filteredTopics
    : filteredTopics.slice(0, TOPIC_PREVIEW_COUNT);

  const chartData = trend.map((point) => ({
    label: formatShortDate(point.date),
    score: point.readiness_score,
  }));

  return (
    <div className="space-y-6">
      {/* Header ------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
            Revision readiness
          </p>
          <h1 className="mt-1 text-2xl font-black text-[#1a3a2a]">
            What UPSC asks vs. what you have covered
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#536259]">
            Every topic is weighted by reviewed Prelims PYQs, with Mains PYQs
            counted at lower weight. Coverage, depth, tested performance, demand
            confidence, and outcome uncertainty stay separate.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchData()}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-[#dcd5c7] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] transition hover:border-[#1d9e75]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Hero + projection ------------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-2xl border border-[#dcd5c7] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-[#536259]">
                Evidence-weighted readiness
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                {suppressed ? (
                  <>
                    <span className="text-5xl font-black tracking-tight text-[#1a3a2a]">
                      —
                    </span>
                    <span className="text-sm font-bold text-[#536259]">
                      not yet measurable
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl font-black tracking-tight text-[#1a3a2a]">
                      {summary.readiness_score.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-[#536259]">
                      / 100
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#536259]">
                A revision signal weighted by exam demand and shrunk toward your
                preparation prior. It is not a UPSC score.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${band.chip}`}
              >
                {band.label}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-bold ${confidence.chip}`}
              >
                {confidence.label}
              </span>
            </div>
          </div>

          <div
            className={`mt-4 flex gap-2 rounded-xl border p-3 text-xs leading-relaxed ${
              suppressed
                ? "border-[#ef9f27]/40 bg-[#fff8e8] text-[#6f4a12]"
                : "border-[#b9d9cd] bg-[#e7f5ee] text-[#0f6b4f]"
            }`}
            role="status"
          >
            {suppressed ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>
              {suppressed ? (
                <>
                  <strong>Band withheld.</strong> Only{" "}
                  {formatPct(evidence.assessed_demand_pct)} of exam-weighted
                  demand has test or recall evidence. We withhold a performance
                  band until at least 25% is assessed. The provisional
                  readiness value is {summary.readiness_score.toFixed(1)}/100.
                </>
              ) : (
                <>
                  <strong>{band.summary}</strong>{" "}
                  {formatPct(evidence.assessed_demand_pct)} of demand is assessed
                  with {summary.confidence.level.toLowerCase()} evidence
                  confidence.
                </>
              )}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#eee8db] pt-4">
            <div>
              <p className="text-lg font-black text-[#1a3a2a]">
                {formatPct(evidence.assessed_demand_pct)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#536259]">
                demand assessed
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-[#1a3a2a]">
                {evidence.assessed_topics}/{coverage.topics_total}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#536259]">
                topics tested
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-[#1a3a2a]">
                {formatPct(quality.demand_mapping_pct)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#536259]">
                PYQ-mapped demand
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-[#1a3a2a] bg-[#1a3a2a] p-5 text-white md:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b9d9cd]">
              Projected outcome
            </p>
            <Target className="h-4 w-4 text-[#8ecfae]" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#e7f5ee]">
            If the {projection.questions}-question Geography block behaved like
            today&apos;s evidence:
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#b9d9cd]">
                Correct
              </p>
              <p className="mt-1 text-xl font-black">
                {Math.round(correct.low)}–{Math.round(correct.high)}
              </p>
              <p className="text-[11px] text-[#b9d9cd]">
                expected {correct.expected.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#b9d9cd]">
                Net marks
              </p>
              <p className="mt-1 text-xl font-black">
                {net.low.toFixed(1)} to {net.high.toFixed(1)}
              </p>
              <p className="text-[11px] text-[#b9d9cd]">
                expected {net.expected.toFixed(1)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-[#b9d9cd]">
            {suppressed
              ? "Evidence is thin, so this range is deliberately wide."
              : "An 80% interval, not a guarantee."}{" "}
            It assumes all {projection.questions} questions are attempted with +2
            for correct and −0.667 for wrong.
          </p>

          <details className="mt-2 text-[11px] text-[#b9d9cd]">
            <summary className="cursor-pointer font-semibold text-[#e7f5ee]">
              Assumptions
            </summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {projection.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </details>

          <p className="mt-auto pt-4 text-[10px] uppercase tracking-wide text-[#8ecfae]">
            Estimate only · no score or rank guarantee
          </p>
        </section>
      </div>

      {mainsOutcome && <MainsOutcomeCard outcome={mainsOutcome} />}

      {/* Coverage, depth, evidence, mapping ------------------------------- */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Compass className="h-4 w-4" />}
          label="Demand assessed"
          value={formatPct(evidence.assessed_demand_pct)}
          caption={`${evidence.assessed_topics} of ${coverage.topics_total} topics have test or recall evidence.`}
          barValue={evidence.assessed_demand_pct}
          tone={evidence.assessed_demand_pct >= 25 ? "green" : "amber"}
        />
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Demand mapping"
          value={formatPct(quality.demand_mapping_pct)}
          caption={`${quality.topics_with_pyq} topics mapped to reviewed Prelims PYQs. Unmapped topics use a prior, not zero demand.`}
          barValue={quality.demand_mapping_pct}
          tone={quality.demand_mapping_pct >= 80 ? "green" : "amber"}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Coverage"
          value={formatPct(coverage.demand_weighted_pct)}
          caption={`${coverage.topics_touched}/${coverage.topics_total} topics started; demand-weighted completion.`}
          barValue={coverage.demand_weighted_pct}
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Depth"
          value={formatPct(depth.demand_weighted_pct)}
          caption={`${depth.deep_topics} topics at 70%+ depth. Advanced and examiner-trap sections carry the most weight.`}
          barValue={depth.demand_weighted_pct}
        />
      </div>

      {/* Demand leaders ---------------------------------------------------- */}
      <section className="rounded-2xl border border-[#dcd5c7] bg-white p-5">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-[#1d9e75]" />
          <h2 className="text-sm font-bold text-[#1a3a2a]">
            What UPSC asks most
          </h2>
        </div>
        <p className="mt-1 text-xs text-[#536259]">
          Ranked by reviewed PYQ weight: Prelims count fully, Mains count at
          lower weight. A missing Prelims mapping lowers confidence; it never
          means the topic is unimportant.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {demandLeaders.map((topic) => (
            <Link
              key={topic.node_id}
              href={`${lmsBase}/topic/${topic.node_id}`}
              className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-3 transition hover:border-[#1d9e75]"
            >
              <p className="line-clamp-2 text-xs font-bold text-[#1a3a2a]">
                {topic.title}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-[#536259]">
                  {topic.pyq_count + topic.mains_pyq_count > 0
                    ? [
                        topic.pyq_count > 0
                          ? `${topic.pyq_count} Prelims`
                          : null,
                        topic.mains_pyq_count > 0
                          ? `${topic.mains_pyq_count} Mains`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "No PYQ mapping"}
                </span>
                <span className="text-sm font-black text-[#1a3a2a]">
                  {Math.round(topic.demand_score)}
                </span>
              </div>
              <div className="mt-1.5">
                <MetricBar value={topic.demand_score} />
              </div>
              <p className="mt-1 text-[10px] text-[#536259]">
                {topic.demand_share_pct.toFixed(1)}% of demand
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Revise next ------------------------------------------------------- */}
      <section className="overflow-hidden rounded-2xl border border-[#dcd5c7] bg-white">
        <div className="flex flex-col gap-1 border-b border-[#eee8db] p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
              Revise next
            </p>
            <h2 className="mt-1 text-lg font-black text-[#1a3a2a]">
              Highest marks at stake first
            </h2>
          </div>
          <p className="text-[11px] text-[#536259]">
            Gap is measured against a 40-mark Geography block.
          </p>
        </div>

        {readiness.next_actions.length === 0 ? (
          <div className="p-5 text-sm text-[#536259]">
            No ranked action yet. Add reviewed content and a diagnostic so the
            system can rank topics honestly.
          </div>
        ) : (
          <ol className="divide-y divide-[#eee8db]">
            {readiness.next_actions.map((action, index) => (
              <li key={action.node_id}>
                <Link
                  href={`${lmsBase}/topic/${action.node_id}`}
                  className="flex flex-col gap-3 p-4 transition hover:bg-[#f7fbf8] md:flex-row md:items-center"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a3a2a] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#1a3a2a]">
                        {action.title}
                      </p>
                      <StatusPill status={action.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-[#13251d]">
                      {action.action}
                    </p>
                    <p className="mt-0.5 text-xs text-[#536259]">
                      {action.reason}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <p className="text-sm font-black text-[#1a3a2a]">
                        {action.marks_at_stake.toFixed(1)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-[#536259]">
                        marks at stake
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#1d9e75]" />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Topic-by-topic gap ------------------------------------------------ */}
      <section className="overflow-hidden rounded-2xl border border-[#dcd5c7] bg-white">
        <div className="border-b border-[#eee8db] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
                The gap
              </p>
              <h2 className="mt-1 text-lg font-black text-[#1a3a2a]">
                Topic by topic
              </h2>
            </div>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter topics"
            >
              {FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setFilter(option.id);
                    setShowAll(false);
                  }}
                  aria-pressed={filter === option.id}
                  className={`inline-flex min-h-9 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold transition sm:min-h-8 sm:px-2.5 sm:py-0.5 sm:text-[11px] ${
                    filter === option.id
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-white text-[#536259] hover:border-[#1d9e75]"
                  }`}
                >
                  {option.label} ({filterCounts[option.id]})
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-[#536259]">
            Unassessed topics stay unlabelled: no test evidence never means weak
            or strong.
          </p>
          <details className="mt-2 text-xs text-[#536259]">
            <summary className="cursor-pointer font-semibold">
              What the statuses mean
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_META) as ReadinessStatus[]).map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <StatusPill status={status} />
                  <span className="text-[10px] text-[#536259]">
                    {STATUS_META[status].hint}
                  </span>
                </span>
              ))}
            </div>
          </details>
        </div>

        <div className="hidden grid-cols-[minmax(0,2.2fr)_110px_110px_130px_120px_90px] gap-3 border-b border-[#eee8db] bg-[#fffdf8] px-5 py-2 text-[10px] font-black uppercase tracking-wide text-[#536259] lg:grid">
          <span>Topic</span>
          <span>Status</span>
          <span>Demand share</span>
          <span>Coverage / depth</span>
          <span>When tested</span>
          <span className="text-right">Gap at stake</span>
        </div>

        <div className="divide-y divide-[#eee8db]">
          {filteredTopics.length === 0 ? (
            <div className="p-6 text-sm text-[#536259]">
              No topics match this filter.{" "}
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="font-bold text-[#1d9e75] hover:underline"
              >
                Show all topics
              </button>
              .
            </div>
          ) : (
            visibleTopics.map((topic) => (
              <Link
                key={topic.node_id}
                href={`${lmsBase}/topic/${topic.node_id}`}
                className="block px-5 py-4 transition hover:bg-[#f7fbf8] lg:grid lg:grid-cols-[minmax(0,2.2fr)_110px_110px_130px_120px_90px] lg:items-center lg:gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#1a3a2a]">
                      {topic.title}
                    </p>
                    <span className="lg:hidden">
                      <StatusPill status={topic.status} />
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#536259]">
                    {topic.mega_topic ? `${topic.mega_topic} · ` : ""}
                    {topic.pyq_count > 0
                      ? `${topic.pyq_count} Prelims PYQ${topic.pyq_count === 1 ? "" : "s"}${
                          topic.last_pyq_year
                            ? ` · latest ${topic.last_pyq_year}`
                            : ""
                        }`
                      : "No reviewed Prelims PYQ mapping"}
                    {topic.mains_pyq_count > 0
                      ? ` · ${topic.mains_pyq_count} Mains PYQ${
                          topic.mains_pyq_count === 1 ? "" : "s"
                        }${
                          topic.last_mains_year
                            ? ` (latest ${topic.last_mains_year})`
                            : ""
                        }`
                      : ""}
                    {topic.mcq_count === 0 ? " · no MCQs" : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#13251d]/80">
                    {topic.next_action}
                  </p>
                </div>

                <div className="hidden lg:block">
                  <StatusPill status={topic.status} />
                </div>

                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-[#1a3a2a]">
                    {topic.demand_share_pct.toFixed(1)}%
                  </p>
                  <div className="mt-1">
                    <MetricBar
                      value={topic.demand_score}
                      className="w-14"
                    />
                  </div>
                </div>

                <div className="hidden lg:block">
                  <div className="flex items-center gap-1.5">
                    <MetricBar
                      value={topic.coverage_pct}
                      className="w-10"
                    />
                    <span className="text-xs font-bold text-[#1a3a2a]">
                      {formatPct(topic.coverage_pct)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-[#536259]">
                    {formatPct(topic.depth_pct)} depth
                  </p>
                </div>

                <div className="hidden lg:block">
                  {topic.has_evidence ? (
                    <>
                      <p className="text-xs font-bold text-[#1a3a2a]">
                        {formatPct(topic.performance_pct)}
                      </p>
                      <p className="text-[10px] text-[#536259]">
                        {topic.practice_attempts > 0
                          ? `${topic.practice_correct}/${topic.practice_attempts} correct`
                          : "recall only"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-semibold text-[#8a6a3b]">
                      Not tested
                    </p>
                  )}
                </div>

                <div className="hidden text-right lg:block">
                  <p className="text-sm font-black text-[#1a3a2a]">
                    {topic.gap_marks.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-[#536259]">of 40 marks</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#eee8db] pt-3 text-[11px] text-[#536259] lg:hidden">
                  <span>
                    <strong className="text-[#1a3a2a]">
                      {topic.demand_share_pct.toFixed(1)}%
                    </strong>{" "}
                    demand
                  </span>
                  <span>
                    <strong className="text-[#1a3a2a]">
                      {formatPct(topic.coverage_pct)}
                    </strong>{" "}
                    coverage
                  </span>
                  <span>
                    <strong className="text-[#1a3a2a]">
                      {formatPct(topic.depth_pct)}
                    </strong>{" "}
                    depth
                  </span>
                  <span>
                    {topic.has_evidence
                      ? `${formatPct(topic.performance_pct)} when tested`
                      : "Not tested"}
                  </span>
                  <span>
                    <strong className="text-[#1a3a2a]">
                      {topic.gap_marks.toFixed(1)}
                    </strong>{" "}
                    marks at stake
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {filteredTopics.length > TOPIC_PREVIEW_COUNT && (
          <div className="border-t border-[#eee8db] p-4 text-center">
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#dcd5c7] bg-white px-5 py-2.5 text-xs font-bold text-[#1a3a2a] transition hover:border-[#1d9e75] sm:w-auto"
            >
              {showAll
                ? `Show top ${TOPIC_PREVIEW_COUNT}`
                : `Show all ${filteredTopics.length} topics`}
            </button>
          </div>
        )}
      </section>

      {/* Trend + method ---------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="rounded-2xl border border-[#dcd5c7] bg-white p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#1d9e75]" />
            <h2 className="text-sm font-bold text-[#1a3a2a]">
              Readiness trend
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#536259]">
            One daily snapshot per learner and subject. No back-filled history.
          </p>

          {chartData.length >= 2 ? (
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid stroke="#eee8db" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#536259" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#536259" }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(1)} / 100`,
                      "Readiness",
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #dcd5c7",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1d9e75"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#1d9e75" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#dcd5c7] bg-[#fffdf8] p-4 text-sm text-[#536259]">
              The trend starts after two daily check-ins. Today&apos;s snapshot
              has been saved.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#1d9e75]" />
            <h2 className="text-sm font-bold text-[#1a3a2a]">
              How to read this
            </h2>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#536259]">
            <li>
              <strong className="text-[#1a3a2a]">Demand</strong> comes from
              reviewed PYQs with a six-year recency half-life. Prelims count
              fully; Mains PYQs count at lower weight. Topics without a Prelims
              mapping use a documented prior and lower demand confidence.
            </li>
            <li>
              <strong className="text-[#1a3a2a]">Performance</strong> shrinks
              small samples toward a preparation prior. Two correct answers do
              not create strong confidence.
            </li>
            <li>
              <strong className="text-[#1a3a2a]">Status</strong> keeps &ldquo;not
              tested&rdquo; separate from &ldquo;weak&rdquo;. Only tested topics
              can be weak or strong.
            </li>
            <li>
              <strong className="text-[#1a3a2a]">Gap</strong> is demand share ×
              (1 − performance) on a 40-mark Geography block. It is not a
              promise of marks lost or gained.
            </li>
            <li>
              <strong className="text-[#1a3a2a]">Projection</strong> is an 80%
              estimate, not a UPSC score, rank, or selection guarantee.
            </li>
          </ul>

          {quality.notes.length > 0 && (
            <div className="mt-4 rounded-xl border border-[#ef9f27]/30 bg-[#fff8e8] p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#6f4a12]">
                Data quality
              </p>
              <ul className="mt-1.5 space-y-1 text-[11px] text-[#6f4a12]">
                {quality.notes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-[10px] text-[#536259]">
            Model {readiness.model_version} · computed{" "}
            {formatTimestamp(readiness.generated_at)}
          </p>
        </section>
      </div>
    </div>
  );
}
