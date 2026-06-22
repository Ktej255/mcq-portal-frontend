"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Layers,
  Loader2,
  ScrollText,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import {
  NotYetAuthored,
} from "@/components/upsc/read/NotYetAuthored";
import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type PaperLabel,
  type SectionLabel,
  type SyllabusAnalysisOut,
  type SyllabusSegmentAnalysisOut,
} from "@/services/api/optionalService";

/**
 * SyllabusView — the per-segment three-layer syllabus contract for an optional
 * subject (spec task 7.4, R4.4 / R4.5).
 *
 * Fetches the subject's per-segment analysis from the backend
 * (`/api/v1/optional/{slug}/syllabus-analysis`) via `optionalService`. For each
 * reviewed syllabus segment it surfaces the three layers a student needs:
 *
 * - "Official says" — the official printed syllabus phrasing.
 * - "Trend says"    — the question trend (theme + insight + frequency). This is
 *   the layer that `ReadView` does not surface; it lands here.
 * - "Hidden topics" — themes asked beyond the printed syllabus, each with its
 *   rationale.
 *
 * Honesty gate (design Property 8 / R4.5 / R17.3): the backend only returns
 * reviewed+authored segments, so this view never fabricates content. When a
 * subject has no reviewed segments yet it shows the shared {@link NotYetAuthored}
 * panel rather than an empty or fake-complete page.
 *
 * Segments are grouped by paper → section (R4.4) so the analysis mirrors the
 * Paper I / Paper II + Section A/B structure students already navigate.
 */

const PALETTE = {
  bg: "#f7f4ee",
  card: "#fffdf8",
  border: "#dcd5c7",
  borderSoft: "#e6dcc2",
  accent: "#1d9e75",
  accentDark: "#1a3a2a",
  ink: "#13251d",
  inkSoft: "#31443a",
  muted: "#5d675f",
  sand: "#8a7a52",
};

type LoadState = "idle" | "loading" | "loaded" | "error";

const PAPER_LABELS: Record<PaperLabel, string> = {
  PAPER_I: "Paper I",
  PAPER_II: "Paper II",
};

const SECTION_LABELS: Record<SectionLabel, string> = {
  SECTION_A: "Section A",
  SECTION_B: "Section B",
};

export interface SyllabusViewProps {
  /** Subject slug, e.g. "geography". */
  slug: string;
  /** Optional callback to close/return from the syllabus view. */
  onClose?: () => void;
}

/** A paper → section grouping of segments for the structured layout (R4.4). */
interface SegmentGroup {
  key: string;
  paperLabel?: PaperLabel | null;
  paperName?: string | null;
  sectionLabel?: SectionLabel | null;
  sectionName?: string | null;
  segments: SyllabusSegmentAnalysisOut[];
}

function paperHeading(seg: SyllabusSegmentAnalysisOut): string {
  if (seg.paper_label && PAPER_LABELS[seg.paper_label]) return PAPER_LABELS[seg.paper_label];
  return seg.paper_name ?? "Paper";
}

function sectionHeading(seg: SyllabusSegmentAnalysisOut): string {
  const label = seg.section_label ? SECTION_LABELS[seg.section_label] : null;
  if (label && seg.section_name) return `${label} — ${seg.section_name}`;
  return label ?? seg.section_name ?? "";
}

/** Group segments into paper → section blocks, preserving server order (R4.4). */
function groupSegments(segments: SyllabusSegmentAnalysisOut[]): SegmentGroup[] {
  const groups: SegmentGroup[] = [];
  const byKey = new Map<string, SegmentGroup>();
  for (const seg of segments) {
    const key = `${seg.paper_label ?? seg.paper_name ?? ""}::${
      seg.section_label ?? seg.section_name ?? ""
    }`;
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        paperLabel: seg.paper_label,
        paperName: seg.paper_name,
        sectionLabel: seg.section_label,
        sectionName: seg.section_name,
        segments: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.segments.push(seg);
  }
  return groups;
}

export function SyllabusView({ slug, onClose }: SyllabusViewProps) {
  const { isLoaded, isSignedIn } = useApiConfig();

  const [data, setData] = useState<SyllabusAnalysisOut | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setState("loading");
    setError(null);
    optionalService
      .getSyllabusAnalysis(slug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setState("loaded");
        // Open the first segment by default so the three layers are immediately
        // visible; the rest stay collapsed and are picked to expand.
        setExpanded(new Set(res.segments.length > 0 ? [res.segments[0].node_id] : []));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(messageFromError(err));
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isLoaded, isSignedIn]);

  const groups = useMemo(() => groupSegments(data?.segments ?? []), [data]);

  const toggle = (nodeId: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });

  return (
    <main
      data-testid="syllabus-view"
      data-slug={slug}
      className="min-h-screen text-[#13251d]"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 md:px-8">
        {/* Header */}
        <section
          className="rounded-2xl border p-5 shadow-sm md:p-6"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              data-testid="syllabus-view-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to subject
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <Layers className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Syllabus · Official · Trend · Hidden
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {data?.name ?? "Syllabus analysis"}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
            Open a syllabus segment to see what the official syllabus says, what the question
            trend says, and the hidden topics asked beyond the printed syllabus.
          </p>
        </section>

        {state === "loading" ? <LoadingPanel /> : null}
        {state === "error" && error ? <ErrorPanel message={error} /> : null}

        {state === "loaded" ? (
          data && data.segments.length > 0 ? (
            <section data-testid="syllabus-segments" className="flex flex-col gap-5">
              <p
                data-testid="syllabus-segment-count"
                className="text-xs font-black uppercase tracking-[0.12em] text-[#8a7a52]"
              >
                {data.segment_count} segment{data.segment_count === 1 ? "" : "s"}
              </p>
              {groups.map((group) => (
                <div key={group.key} data-testid="syllabus-group" className="flex flex-col gap-3">
                  <GroupHeading group={group} />
                  {group.segments.map((seg) => (
                    <SegmentCard
                      key={seg.node_id}
                      segment={seg}
                      expanded={expanded.has(seg.node_id)}
                      onToggle={() => toggle(seg.node_id)}
                    />
                  ))}
                </div>
              ))}
            </section>
          ) : (
            <NotYetAuthored
              title={data?.name ?? slug}
              testid="syllabus-view-not-authored"
              message="Reviewed syllabus analysis (official phrasing, question trend and hidden topics) arrives in a later step."
            />
          )
        ) : null}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Paper → section group heading (R4.4)
// ---------------------------------------------------------------------------

function GroupHeading({ group }: { group: SegmentGroup }) {
  const paper = group.paperLabel
    ? PAPER_LABELS[group.paperLabel]
    : group.paperName ?? "";
  const section = group.sectionLabel
    ? group.sectionName
      ? `${SECTION_LABELS[group.sectionLabel]} — ${group.sectionName}`
      : SECTION_LABELS[group.sectionLabel]
    : group.sectionName ?? "";
  return (
    <div
      data-testid="syllabus-group-heading"
      className="flex flex-wrap items-center gap-2 border-b border-dashed pt-2"
      style={{ borderColor: PALETTE.borderSoft }}
    >
      <ScrollText className="h-4 w-4 text-[#1a3a2a]" />
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{paper}</p>
      {section ? (
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8a7a52]">
          · {section}
        </span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segment card — the three-layer contract (R4.5)
// ---------------------------------------------------------------------------

function SegmentCard({
  segment,
  expanded,
  onToggle,
}: {
  segment: SyllabusSegmentAnalysisOut;
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `syllabus-segment-panel-${segment.node_id}`;
  return (
    <article
      data-testid="syllabus-segment"
      data-node-id={segment.node_id}
      className="overflow-hidden rounded-2xl border shadow-sm"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <button
        type="button"
        data-testid="syllabus-segment-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1d9e75]/40 md:px-5"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-[#1d9e75] transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black tracking-tight text-[#13251d]">
            {segment.title}
          </span>
        </span>
        <LayerChips segment={segment} />
      </button>

      {expanded ? (
        <div
          id={panelId}
          data-testid="syllabus-segment-layers"
          className="flex flex-col gap-3 border-t px-4 py-4 md:px-5"
          style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.bg }}
        >
          <OfficialLayer segment={segment} />
          <TrendLayer segment={segment} />
          <HiddenLayer segment={segment} />
        </div>
      ) : null}
    </article>
  );
}

/** Compact "which layers are present" chips on the segment header. */
function LayerChips({ segment }: { segment: SyllabusSegmentAnalysisOut }) {
  const chips: string[] = [];
  if (segment.official.length > 0) chips.push("Official");
  if (segment.trend_says.length > 0) chips.push("Trend");
  if (segment.hidden_topics.length > 0) chips.push("Hidden");
  if (chips.length === 0) return null;
  return (
    <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
      {chips.map((c) => (
        <span
          key={c}
          className="inline-flex items-center rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#31443a]"
        >
          {c}
        </span>
      ))}
    </span>
  );
}

function OfficialLayer({ segment }: { segment: SyllabusSegmentAnalysisOut }) {
  return (
    <LayerCard
      testid="syllabus-layer-official"
      title="Official says"
      subtitle="Official printed syllabus phrasing"
      icon={<BookOpen className="h-4 w-4" />}
    >
      {segment.official.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {segment.official.map((line, i) => (
            <li
              key={i}
              data-testid="syllabus-official-line"
              className="text-sm font-semibold leading-6 text-[#31443a]"
            >
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyLayer label="No official phrasing recorded for this segment yet." />
      )}
    </LayerCard>
  );
}

function TrendLayer({ segment }: { segment: SyllabusSegmentAnalysisOut }) {
  return (
    <LayerCard
      testid="syllabus-layer-trend"
      title="Trend says"
      subtitle="What the question trend reveals"
      icon={<TrendingUp className="h-4 w-4" />}
    >
      {segment.trend_says.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {segment.trend_says.map((t, i) => (
            <li
              key={i}
              data-testid="syllabus-trend-point"
              className="rounded-lg border border-[#e6dcc2] bg-[#f3f9f5] px-3.5 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-[#13251d]">{t.theme}</p>
                {t.frequency ? (
                  <span
                    data-testid="syllabus-trend-frequency"
                    className="inline-flex items-center rounded-full border border-[#1d9e75]/40 bg-[#e7f5ee] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#085041]"
                  >
                    {t.frequency}
                  </span>
                ) : null}
              </div>
              {t.insight ? (
                <p className="mt-0.5 text-xs font-semibold leading-5 text-[#31443a]">{t.insight}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyLayer label="No question-trend analysis recorded for this segment yet." />
      )}
    </LayerCard>
  );
}

function HiddenLayer({ segment }: { segment: SyllabusSegmentAnalysisOut }) {
  return (
    <LayerCard
      testid="syllabus-layer-hidden"
      title="Hidden topics"
      subtitle="Asked beyond the printed syllabus"
      icon={<Sparkles className="h-4 w-4" />}
    >
      {segment.hidden_topics.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {segment.hidden_topics.map((ht, i) => (
            <li
              key={i}
              data-testid="syllabus-hidden-topic"
              className="rounded-lg border border-[#e6dcc2] bg-[#faf6ee] px-3.5 py-2.5"
            >
              <p className="text-sm font-black text-[#13251d]">{ht.topic}</p>
              {ht.why ? (
                <p className="mt-0.5 text-xs font-semibold leading-5 text-[#8a7a52]">{ht.why}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyLayer label="No hidden topics recorded for this segment yet." />
      )}
    </LayerCard>
  );
}

// ---------------------------------------------------------------------------
// Shared presentational helpers
// ---------------------------------------------------------------------------

function LayerCard({
  title,
  subtitle,
  icon,
  children,
  testid,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <section
      data-testid={testid}
      className="rounded-xl border p-4"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon ? <span className="text-[#1d9e75]">{icon}</span> : null}
        <div>
          <h3 className="text-base font-black tracking-tight text-[#13251d]">{title}</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyLayer({ label }: { label: string }) {
  return (
    <p
      data-testid="syllabus-layer-empty"
      className="rounded-lg border border-dashed border-[#cdbf9f] bg-[#faf6ee] px-3 py-3 text-xs font-semibold text-[#8a7a52]"
    >
      {label}
    </p>
  );
}

function LoadingPanel() {
  return (
    <div
      data-testid="syllabus-view-loading"
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-10 text-sm font-bold text-[#5d675f]"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#1d9e75]" />
      Loading syllabus analysis…
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      data-testid="syllabus-view-error"
      className="flex items-start gap-2 rounded-2xl border border-[#e6c2c2] bg-[#fbf0ee] px-4 py-5 text-sm font-semibold text-[#8a4b52]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function messageFromError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { response?: { status?: number }; message?: string };
    if (anyErr.response?.status === 404) {
      return "Syllabus analysis isn't available for this subject yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load the syllabus analysis. Please try again.";
}

export default SyllabusView;
