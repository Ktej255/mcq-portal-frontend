"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  PieChart,
  Target,
} from "lucide-react";

import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type GapPanelOut,
  type GapPaperOut,
} from "@/services/api/optionalService";

/**
 * GapPanel — the syllabus gap/progress surface for an optional subject
 * (spec task 11.2, R12.3 / R12.4).
 *
 * Fetches the student's weighted coverage from the backend
 * (`GET /api/v1/optional/{slug}/progress`) via `optionalService` and shows the
 * percentage of the syllabus covered vs remaining, overall and per paper.
 *
 * Coverage is `Σ weight(covered nodes) / Σ weight(all nodes) × 100` over the
 * weighted syllabus tree (design Property 2); covered% + remaining% always sum
 * to 100. The figure is derived purely from the student's own tracked activity
 * (ownership — design Property 10).
 *
 * Honest-measurement rule (founder decision, 2026-10-31): the percentage is a
 * measurement only when the backend has recorded activity for this student.
 * With nothing recorded the arithmetic answer is 0% for everybody, and printing
 * that as "0.0% covered" would read like a verdict on the learner's gaps. So
 * the panel says **"not measured yet"** and names what would be measured,
 * instead of showing a placeholder number. A failed request is likewise
 * reported as a failure with a retry — never as 0%.
 */

const PALETTE = {
  bg: "#f7f4ee",
  card: "#fffdf8",
  border: "#dcd5c7",
  borderSoft: "#e6dcc2",
  accent: "#1d9e75",
  accentDark: "#1a3a2a",
  ink: "#13251d",
  muted: "#5d675f",
  sand: "#8a7a52",
};

type LoadState = "idle" | "loading" | "loaded" | "error";

const PAPER_LABELS: Record<string, string> = {
  PAPER_I: "Paper I",
  PAPER_II: "Paper II",
};

export interface GapPanelProps {
  /** Subject slug, e.g. "geography". */
  slug: string;
  /** Optional callback to close/return from the gap panel. */
  onClose?: () => void;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Is this coverage figure a measurement of this learner, or just the arithmetic
 * default while nothing has been recorded against the syllabus tree?
 *
 * Coverage only becomes evidence when at least one node has recorded activity,
 * so `covered_nodes === 0` (or an empty tree) is reported as "not measured"
 * instead of the 0.0% that the maths would otherwise print.
 */
function isMeasuredCoverage(coverage: { total_nodes: number; covered_nodes: number }): boolean {
  return coverage.total_nodes > 0 && coverage.covered_nodes > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFinitePercent(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function hasConsistentPercentages(covered: number, remaining: number): boolean {
  return Math.abs(covered + remaining - 100) <= 0.0001;
}

function isValidCoverageValues(value: Record<string, unknown>): boolean {
  const coveredPercent = value.covered_percent;
  const remainingPercent = value.remaining_percent;
  const totalNodes = value.total_nodes;
  const coveredNodes = value.covered_nodes;

  return (
    isFinitePercent(coveredPercent) &&
    isFinitePercent(remainingPercent) &&
    hasConsistentPercentages(coveredPercent, remainingPercent) &&
    isNonnegativeInteger(totalNodes) &&
    isNonnegativeInteger(coveredNodes) &&
    coveredNodes <= totalNodes
  );
}

function isGapPaperOut(value: unknown): value is GapPaperOut {
  if (!isRecord(value)) return false;
  return (
    typeof value.paper_id === "number" &&
    Number.isInteger(value.paper_id) &&
    value.paper_id >= 0 &&
    typeof value.label === "string" &&
    typeof value.name === "string" &&
    isNonnegativeInteger(value.display_order) &&
    isValidCoverageValues(value)
  );
}

function isGapPanelOut(value: unknown): value is GapPanelOut {
  if (!isRecord(value) || !Array.isArray(value.papers)) return false;
  if (typeof value.slug !== "string" || typeof value.name !== "string") return false;
  if (!isValidCoverageValues(value)) return false;
  return value.papers.every(isGapPaperOut);
}

export function GapPanel({ slug, onClose }: GapPanelProps) {
  const { isLoaded, isSignedIn } = useApiConfig();

  const [data, setData] = useState<GapPanelOut | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  // Bumped by "Try again" so a failed request re-runs; never filled offline.
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    const requestTimer = window.setTimeout(() => {
      if (cancelled) return;
      setState("loading");
      setError(null);
      optionalService
        .getProgress(slug)
        .then((res) => {
          if (cancelled) return;
          if (!isGapPanelOut(res)) {
            throw new Error("Coverage response was invalid. Please try again.");
          }
          setData(res);
          setState("loaded");
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setData(null);
          setError(messageFromError(err));
          setState("error");
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(requestTimer);
    };
  }, [slug, isLoaded, isSignedIn, reloadNonce]);

  return (
    <main
      data-testid="gap-panel"
      data-slug={slug}
      className="min-h-screen text-[#13251d]"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
        {/* Header */}
        <section
          className="rounded-2xl border p-5 shadow-sm md:p-6"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              data-testid="gap-panel-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to subject
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <PieChart className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Gap &amp; progress · Covered vs remaining
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {data?.name ?? "Syllabus coverage"}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
            Coverage is weighted over the syllabus tree and comes only from
            activity this portal records for you. Where nothing is tracked yet it
            says &ldquo;not measured&rdquo; instead of showing a 0% figure, so you
            never read a placeholder as a verdict on your gaps.
          </p>
        </section>

        {state === "loading" ? <LoadingPanel /> : null}
        {state === "error" && error ? (
          <ErrorPanel message={error} onRetry={() => setReloadNonce((n) => n + 1)} />
        ) : null}

        {state === "loaded" && data ? (
          <>
            <OverallCoverage data={data} />
            {data.papers.length > 0 ? (
              <section data-testid="gap-papers" className="flex flex-col gap-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a7a52]">
                  By paper
                </p>
                {data.papers.map((paper) => (
                  <PaperCoverage key={paper.paper_id} paper={paper} />
                ))}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Overall covered vs remaining
// ---------------------------------------------------------------------------

function OverallCoverage({ data }: { data: GapPanelOut }) {
  const covered = clampPercent(data.covered_percent);
  const measured = isMeasuredCoverage(data);

  if (!measured) {
    return (
      <section
        data-testid="gap-overall"
        data-measured="false"
        data-covered-percent={data.covered_percent}
        data-remaining-percent={data.remaining_percent}
        className="rounded-2xl border p-5 shadow-sm md:p-6"
        style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#8a7a52]" />
            <h2 className="text-lg font-black tracking-tight text-[#13251d]">
              Overall coverage
            </h2>
          </div>
          <p
            data-testid="gap-covered-status"
            className="rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]"
          >
            Not measured yet
          </p>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#31443a]">
          No syllabus activity is recorded for you in this subject yet, so there
          is nothing to measure — this is not a 0% score against your gaps.
        </p>
        <p className="mt-2 text-xs font-semibold leading-6 text-[#5d675f]">
          Coverage is built from the {data.total_nodes} weighted syllabus segment
          {data.total_nodes === 1 ? "" : "s"} once an activity is tracked against
          them: finishing a reviewed read, passing a practice attempt, or clearing
          a recall threshold. Until then this page tells you it cannot answer the
          gap question rather than showing a placeholder number.
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="gap-overall"
      data-measured="true"
      data-covered-percent={data.covered_percent}
      data-remaining-percent={data.remaining_percent}
      className="rounded-2xl border p-5 shadow-sm md:p-6"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[#1d9e75]" />
          <h2 className="text-lg font-black tracking-tight text-[#13251d]">Overall coverage</h2>
        </div>
        <div className="text-right">
          <p
            data-testid="gap-covered-percent"
            className="text-3xl font-black leading-none text-[#085041]"
          >
            {covered.toFixed(1)}%
          </p>
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]">
            covered
          </p>
        </div>
      </div>

      <CoverageBar covered={covered} testid="gap-overall-bar" />

      <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#31443a]">
        <span data-testid="gap-remaining-percent">
          {clampPercent(data.remaining_percent).toFixed(1)}% remaining
        </span>
        <span className="text-[#8a7a52]">
          {data.covered_nodes} / {data.total_nodes} segments
        </span>
      </div>
    </section>
  );
}

function PaperCoverage({ paper }: { paper: GapPaperOut }) {
  const covered = clampPercent(paper.covered_percent);
  const label = PAPER_LABELS[paper.label] ?? paper.name;
  const measured = isMeasuredCoverage(paper);

  if (!measured) {
    return (
      <article
        data-testid="gap-paper"
        data-paper-id={paper.paper_id}
        data-measured="false"
        className="rounded-xl border p-4"
        style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.card }}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-black uppercase tracking-[0.1em] text-[#1a3a2a]">{label}</h3>
          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]">
            Not measured yet
          </span>
        </div>
        <p className="mt-2 text-[11px] font-bold text-[#8a7a52]">
          {paper.covered_nodes} / {paper.total_nodes} segments have tracked
          activity
        </p>
      </article>
    );
  }

  return (
    <article
      data-testid="gap-paper"
      data-paper-id={paper.paper_id}
      data-measured="true"
      className="rounded-xl border p-4"
      style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.card }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-[#1a3a2a]">{label}</h3>
        <span className="text-sm font-black text-[#085041]">{covered.toFixed(1)}%</span>
      </div>
      <CoverageBar covered={covered} testid="gap-paper-bar" />
      <p className="mt-2 text-[11px] font-bold text-[#8a7a52]">
        {paper.covered_nodes} / {paper.total_nodes} segments covered
      </p>
    </article>
  );
}

function CoverageBar({ covered, testid }: { covered: number; testid: string }) {
  return (
    <div
      data-testid={testid}
      role="progressbar"
      aria-valuenow={Math.round(covered)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="mt-3 h-3 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: "#ece4d3" }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${covered}%`, backgroundColor: PALETTE.accent }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading / error
// ---------------------------------------------------------------------------

function LoadingPanel() {
  return (
    <div
      data-testid="gap-panel-loading"
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-10 text-sm font-bold text-[#5d675f]"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#1d9e75]" />
      Loading your coverage…
    </div>
  );
}

/**
 * Load-failure panel. A failed coverage request is a failure, not 0%: it offers
 * a retry and never renders a number.
 */
function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      data-testid="gap-panel-error"
      className="flex flex-col gap-3 rounded-2xl border border-[#e6c2c2] bg-[#fbf0ee] px-4 py-5 text-sm font-semibold text-[#8a4b52]"
    >
      <span className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </span>
      {onRetry ? (
        <button
          type="button"
          data-testid="gap-panel-error-retry"
          onClick={onRetry}
          className="self-start rounded-xl border border-[#8a4b52] bg-[#fbf0ee] px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#8a4b52] hover:bg-[#8a4b52] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#8a4b52]/40"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

function messageFromError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { response?: { status?: number }; message?: string };
    if (anyErr.response?.status === 404) {
      return "Coverage isn't available for this subject yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load your coverage, so no gap figure is shown. Please try again.";
}

export default GapPanel;
