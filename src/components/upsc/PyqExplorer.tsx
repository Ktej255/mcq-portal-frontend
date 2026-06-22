"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileQuestion,
  Layers,
  ListTree,
  Loader2,
  PenLine,
  ScrollText,
  Sparkles,
  X,
} from "lucide-react";

import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type PaperLabel,
  type PyqByTopicOut,
  type PyqListOut,
  type PyqOut,
  type PyqQuery,
  type PyqSort,
  type PyqTopicGroupOut,
  type SectionLabel,
} from "@/services/api/optionalService";

/**
 * PyqExplorer — the student-facing previous-year-question browser for an
 * optional subject (spec task 7.2, R6.1/R6.2/R6.3/R6.5).
 *
 * Fetches the subject's **student-visible** PYQs from the backend
 * (`/api/v1/optional/{slug}/pyqs`) via `optionalService`. The backend gates out
 * unreviewed/draft questions (design Property 8 / R17.3), so this view only
 * ever renders REVIEWED content — when nothing matches it shows an honest
 * empty state rather than fabricating questions.
 *
 * Controls:
 * - View mode toggle: "By year" (the year/paper/section list) and "By topic"
 *   (PYQs grouped under the syllabus tree — spec task 7.3, R6.4).
 * - Year filter (R6.1) — built from the response `facets.years`.
 * - Paper filter (Paper I / Paper II) (R6.2).
 * - Section filter (Section A / B) (R6.3) — only relevant/shown when Paper I is
 *   selected, matching the Paper I → Section A/B structure.
 * - Year-wise sort (newest-first by default) (R6.1).
 *
 * Applying any filter re-queries the backend so the list shows only matching
 * PYQs (R6.5).
 *
 * In "By topic" mode, PYQs are grouped under their syllabus topic node; picking
 * a topic shows that topic's PYQs. Each PYQ exposes a "Solve" affordance.
 * Answer-solving / evaluation (the full AnswerWorkspace) is **Task 9** and is
 * NOT built yet, so "Solve" opens an honest interim panel that says the answer
 * workspace arrives in a later step — it never fabricates an evaluation. The
 * `onSolve` hook is the seam Task 9 replaces with the real AnswerWorkspace.
 *
 * Deferred (not in this task): per-segment official phrasing + trend +
 * hidden-topic surfacing is Task 7.4.
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

/** Explorer view modes: the year/paper/section list vs. the topic-wise tree. */
type ViewMode = "year" | "topic";

export interface PyqExplorerProps {
  /** Subject slug, e.g. "geography". */
  slug: string;
  /** Optional callback to close/return from the explorer. */
  onClose?: () => void;
  /**
   * Seam for the answer-writing workspace (spec task 9). When provided, picking
   * "Solve" on a PYQ hands the chosen PYQ to the host instead of opening the
   * built-in interim panel. Task 9 wires the real `AnswerWorkspace` here. Until
   * then the interim panel is shown and **no evaluation is fabricated**.
   */
  onSolve?: (pyq: PyqOut) => void;
}

export function PyqExplorer({ slug, onClose, onSolve }: PyqExplorerProps) {
  const { isLoaded, isSignedIn } = useApiConfig();

  const [viewMode, setViewMode] = useState<ViewMode>("year");

  const [year, setYear] = useState<number | null>(null);
  const [paper, setPaper] = useState<PaperLabel | null>(null);
  const [section, setSection] = useState<SectionLabel | null>(null);
  const [sort, setSort] = useState<PyqSort>("year_desc");

  const [data, setData] = useState<PyqListOut | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  // "By topic" view state (R6.4) — fetched lazily the first time the mode opens.
  const [topicData, setTopicData] = useState<PyqByTopicOut | null>(null);
  const [topicState, setTopicState] = useState<LoadState>("idle");
  const [topicError, setTopicError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // Interim "Solve" target — only used when no `onSolve` host seam is provided.
  const [solveTarget, setSolveTarget] = useState<PyqOut | null>(null);

  // Section only applies to Paper I; clear it whenever Paper I is not selected.
  useEffect(() => {
    if (paper !== "PAPER_I" && section !== null) {
      setSection(null);
    }
  }, [paper, section]);

  const query: PyqQuery = useMemo(
    () => ({
      year,
      paper,
      section: paper === "PAPER_I" ? section : null,
      sort,
    }),
    [year, paper, section, sort],
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setState("loading");
    setError(null);
    optionalService
      .getPyqs(slug, query)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setState("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(messageFromError(err));
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, query, isLoaded, isSignedIn]);

  // Reset the "By topic" cache + interim panel whenever the subject changes.
  // Done as a deferred state update guarded by a slug mismatch so we never
  // refetch stale data; the fetch effect below re-runs for the new slug.
  if (topicData !== null && topicData.slug !== slug) {
    setTopicData(null);
    setTopicState("idle");
    setTopicError(null);
    setExpandedNodes(new Set());
    setSolveTarget(null);
  }

  // Lazily fetch the topic-wise grouping the first time "By topic" is opened
  // (R6.4). The by-topic endpoint already gates unreviewed PYQs and returns
  // groups in syllabus order (paper → section → topic).
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (viewMode !== "topic") return;
    if (topicState === "loading") return;
    if (topicState === "loaded" && topicData?.slug === slug) return;
    let cancelled = false;
    setTopicState("loading");
    setTopicError(null);
    optionalService
      .getPyqsByTopic(slug)
      .then((res) => {
        if (cancelled) return;
        setTopicData(res);
        setTopicState("loaded");
        // Open the first group by default so a topic's PYQs are immediately
        // visible; the rest stay collapsed and are picked to expand.
        setExpandedNodes(
          new Set(res.groups.length > 0 ? [res.groups[0].node_id] : []),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTopicError(messageFromError(err));
        setTopicState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, viewMode, isLoaded, isSignedIn, topicState, topicData]);

  const toggleNode = useCallback((nodeId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Solve seam: hand off to the host (`onSolve`, task 9) when wired, otherwise
  // open the honest interim panel. No evaluation is ever fabricated here.
  const handleSolve = useCallback(
    (pyq: PyqOut) => {
      if (onSolve) {
        onSolve(pyq);
        return;
      }
      setSolveTarget(pyq);
    },
    [onSolve],
  );

  const facets = data?.facets;
  const availablePapers = useMemo<PaperLabel[]>(() => {
    const fromFacets = (facets?.papers ?? []).filter(
      (p): p is PaperLabel => p === "PAPER_I" || p === "PAPER_II",
    );
    return fromFacets;
  }, [facets]);
  const availableSections = useMemo<SectionLabel[]>(() => {
    const fromFacets = (facets?.sections ?? []).filter(
      (s): s is SectionLabel => s === "SECTION_A" || s === "SECTION_B",
    );
    return fromFacets;
  }, [facets]);

  const clearFilters = useCallback(() => {
    setYear(null);
    setPaper(null);
    setSection(null);
    setSort("year_desc");
  }, []);

  const hasActiveFilters = year != null || paper != null || section != null;
  const pyqs = data?.pyqs ?? [];

  return (
    <main
      data-testid="pyq-explorer"
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
              data-testid="pyq-explorer-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to subject
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <ScrollText className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              PYQs · Previous-year questions
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {data?.name ?? "Previous-year questions"}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
            Browse the reviewed PYQ corpus year-wise, filtered by paper and section.
          </p>

          {/* View-mode toggle: by year (filtered list) vs. by topic (R6.4). */}
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </section>

        {/* Filter controls — only meaningful in the year-wise list view. */}
        {viewMode === "year" ? (
          <section
            data-testid="pyq-filters"
            className="flex flex-wrap items-end gap-4 rounded-2xl border p-4 shadow-sm md:p-5"
            style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
          >
            {/* Year */}
            <FilterField label="Year" icon={<CalendarDays className="h-4 w-4" />}>
              <select
                data-testid="pyq-filter-year"
                value={year ?? ""}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
                className={selectClass}
              >
                <option value="">All years</option>
                {(facets?.years ?? []).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </FilterField>

            {/* Paper */}
            <FilterField label="Paper" icon={<Layers className="h-4 w-4" />}>
              <select
                data-testid="pyq-filter-paper"
                value={paper ?? ""}
                onChange={(e) => setPaper((e.target.value || null) as PaperLabel | null)}
                className={selectClass}
              >
                <option value="">All papers</option>
                {availablePapers.map((p) => (
                  <option key={p} value={p}>
                    {PAPER_LABELS[p]}
                  </option>
                ))}
              </select>
            </FilterField>

            {/* Section — only relevant when Paper I is selected (R6.3) */}
            {paper === "PAPER_I" ? (
              <FilterField label="Section" icon={<Layers className="h-4 w-4" />}>
                <select
                  data-testid="pyq-filter-section"
                  value={section ?? ""}
                  onChange={(e) => setSection((e.target.value || null) as SectionLabel | null)}
                  className={selectClass}
                >
                  <option value="">All sections</option>
                  {availableSections.map((s) => (
                    <option key={s} value={s}>
                      {SECTION_LABELS[s]}
                    </option>
                  ))}
                </select>
              </FilterField>
            ) : null}

            {/* Sort */}
            <FilterField label="Sort" icon={<ScrollText className="h-4 w-4" />}>
              <select
                data-testid="pyq-filter-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as PyqSort)}
                className={selectClass}
              >
                <option value="year_desc">Newest first</option>
                <option value="year_asc">Oldest first</option>
              </select>
            </FilterField>

            {hasActiveFilters ? (
              <button
                type="button"
                data-testid="pyq-clear-filters"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-[#dcd5c7] bg-[#faf6ee] px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#31443a] hover:border-[#1d9e75]"
              >
                Clear filters
              </button>
            ) : null}
          </section>
        ) : null}

        {/* Year-wise results */}
        {viewMode === "year" ? (
          <>
            {state === "loading" ? <LoadingPanel /> : null}
            {state === "error" && error ? <ErrorPanel message={error} /> : null}
            {state === "loaded" ? (
              pyqs.length > 0 ? (
                <section data-testid="pyq-results" className="flex flex-col gap-3">
                  <p
                    data-testid="pyq-result-count"
                    className="text-xs font-black uppercase tracking-[0.12em] text-[#8a7a52]"
                  >
                    {data?.total ?? pyqs.length} question
                    {(data?.total ?? pyqs.length) === 1 ? "" : "s"}
                  </p>
                  {pyqs.map((pyq) => (
                    <PyqCard key={pyq.id} pyq={pyq} onSolve={handleSolve} />
                  ))}
                </section>
              ) : (
                <EmptyState hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
              )
            ) : null}
          </>
        ) : null}

        {/* Topic-wise results (R6.4) */}
        {viewMode === "topic" ? (
          <>
            {topicState === "loading" ? <LoadingPanel /> : null}
            {topicState === "error" && topicError ? <ErrorPanel message={topicError} /> : null}
            {topicState === "loaded" ? (
              topicData && topicData.groups.length > 0 ? (
                <section data-testid="pyq-topic-results" className="flex flex-col gap-3">
                  <p
                    data-testid="pyq-topic-count"
                    className="text-xs font-black uppercase tracking-[0.12em] text-[#8a7a52]"
                  >
                    {topicData.total} question{topicData.total === 1 ? "" : "s"} across{" "}
                    {topicData.group_count} topic{topicData.group_count === 1 ? "" : "s"}
                  </p>
                  {topicData.groups.map((group) => (
                    <TopicGroupCard
                      key={group.node_id}
                      group={group}
                      expanded={expandedNodes.has(group.node_id)}
                      onToggle={() => toggleNode(group.node_id)}
                      onSolve={handleSolve}
                    />
                  ))}
                </section>
              ) : (
                <TopicEmptyState />
              )
            ) : null}
          </>
        ) : null}
      </div>

      {/* Interim Solve panel — only when no host `onSolve` seam is wired. */}
      {solveTarget ? (
        <SolveInterimModal pyq={solveTarget} onClose={() => setSolveTarget(null)} />
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------
// PYQ card
// ---------------------------------------------------------------------------

function PyqCard({ pyq, onSolve }: { pyq: PyqOut; onSolve: (pyq: PyqOut) => void }) {
  return (
    <article
      data-testid="pyq-card"
      data-year={pyq.year}
      data-paper={pyq.paper_label ?? ""}
      data-section={pyq.section_label ?? ""}
      className="rounded-2xl border p-4 shadow-sm md:p-5"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#1a3a2a] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white">
          <CalendarDays className="h-3 w-3" /> {pyq.year}
        </span>
        {pyq.paper_label ? (
          <Pill>{PAPER_LABELS[pyq.paper_label]}</Pill>
        ) : null}
        {pyq.section_label ? (
          <Pill>{SECTION_LABELS[pyq.section_label]}</Pill>
        ) : null}
        {pyq.marks != null ? <Pill>{pyq.marks} marks</Pill> : null}
        {pyq.beyond_syllabus ? (
          <span
            data-testid="pyq-beyond-syllabus"
            className="inline-flex items-center gap-1 rounded-full border border-[#1d9e75]/40 bg-[#e7f5ee] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#085041]"
          >
            <Sparkles className="h-3 w-3" /> Beyond syllabus
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm font-semibold leading-7 text-[#31443a]">{pyq.question_text}</p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          data-testid="pyq-solve"
          data-pyq-id={pyq.id}
          onClick={() => onSolve(pyq)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
        >
          <PenLine className="h-3.5 w-3.5" /> Solve
        </button>
      </div>
    </article>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#31443a]">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// View-mode toggle (By year / By topic — R6.4)
// ---------------------------------------------------------------------------

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const options: { value: ViewMode; label: string; icon: React.ReactNode; testid: string }[] = [
    {
      value: "year",
      label: "By year",
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      testid: "pyq-view-year",
    },
    {
      value: "topic",
      label: "By topic",
      icon: <ListTree className="h-3.5 w-3.5" />,
      testid: "pyq-view-topic",
    },
  ];
  return (
    <div
      data-testid="pyq-view-toggle"
      role="group"
      aria-label="PYQ view mode"
      className="mt-4 inline-flex rounded-xl border border-[#dcd5c7] bg-[#faf6ee] p-1"
    >
      {options.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            data-testid={opt.testid}
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40 ${
              active
                ? "bg-[#1a3a2a] text-white"
                : "text-[#31443a] hover:text-[#085041]"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Topic-wise group card (R6.4): a syllabus topic node with its PYQs beneath it
// ---------------------------------------------------------------------------

function TopicGroupCard({
  group,
  expanded,
  onToggle,
  onSolve,
}: {
  group: PyqTopicGroupOut;
  expanded: boolean;
  onToggle: () => void;
  onSolve: (pyq: PyqOut) => void;
}) {
  const panelId = `pyq-topic-panel-${group.node_id}`;
  const context = [
    group.paper_label ? PAPER_LABELS[group.paper_label] : group.paper_name,
    group.section_label ? SECTION_LABELS[group.section_label] : group.section_name,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <article
      data-testid="pyq-topic-group"
      data-node-id={group.node_id}
      className="overflow-hidden rounded-2xl border shadow-sm"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <button
        type="button"
        data-testid="pyq-topic-toggle"
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
            {group.title}
          </span>
          {context ? (
            <span className="mt-0.5 block text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]">
              {context}
            </span>
          ) : null}
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#31443a]">
          {group.pyq_count} PYQ{group.pyq_count === 1 ? "" : "s"}
        </span>
      </button>
      {expanded ? (
        <div
          id={panelId}
          data-testid="pyq-topic-pyqs"
          className="flex flex-col gap-3 border-t px-4 py-4 md:px-5"
          style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.bg }}
        >
          {group.pyqs.map((pyq) => (
            <PyqCard key={pyq.id} pyq={pyq} onSolve={onSolve} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function TopicEmptyState() {
  return (
    <section
      data-testid="pyq-topic-empty"
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#cdbf9f] bg-[#faf6ee] px-4 py-10 text-center shadow-sm"
    >
      <ListTree className="h-7 w-7 text-[#8a7a52]" />
      <p className="text-sm font-bold text-[#5d675f]">
        No reviewed PYQs are mapped to syllabus topics for this subject yet.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Interim "Solve" panel — honest placeholder until the AnswerWorkspace (task 9)
// ---------------------------------------------------------------------------

function SolveInterimModal({ pyq, onClose }: { pyq: PyqOut; onClose: () => void }) {
  return (
    <div
      data-testid="pyq-solve-interim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pyq-solve-interim-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#13251d]/40 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-5 shadow-xl md:p-6"
        style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p
              id="pyq-solve-interim-title"
              className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]"
            >
              Answer workspace · Coming soon
            </p>
          </div>
          <button
            type="button"
            data-testid="pyq-solve-interim-close"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-[#dcd5c7] bg-[#faf6ee] p-1.5 text-[#31443a] hover:border-[#1d9e75] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-3 text-lg font-black tracking-tight text-[#13251d]">
          The answer-writing workspace arrives in a later step
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
          Writing and AI-assisted evaluation for this question land in a later
          phase. For now this is a placeholder — nothing is graded and no
          feedback is generated yet.
        </p>

        <div
          className="mt-4 rounded-xl border p-4"
          style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.bg }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8a7a52]">
            {pyq.year}
            {pyq.paper_label ? ` · ${PAPER_LABELS[pyq.paper_label]}` : ""}
            {pyq.section_label ? ` · ${SECTION_LABELS[pyq.section_label]}` : ""}
            {pyq.marks != null ? ` · ${pyq.marks} marks` : ""}
          </p>
          <p className="mt-2 text-sm font-semibold leading-7 text-[#31443a]">
            {pyq.question_text}
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter field + shared panels
// ---------------------------------------------------------------------------

const selectClass =
  "rounded-xl border border-[#dcd5c7] bg-[#faf6ee] px-3 py-2 text-sm font-bold text-[#13251d] focus:border-[#1d9e75] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40";

function FilterField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#31443a]">
        <span className="text-[#1d9e75]">{icon}</span>
        {label}
      </span>
      {children}
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onClear,
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <section
      data-testid="pyq-empty"
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#cdbf9f] bg-[#faf6ee] px-4 py-10 text-center shadow-sm"
    >
      <FileQuestion className="h-7 w-7 text-[#8a7a52]" />
      <p className="text-sm font-bold text-[#5d675f]">
        {hasActiveFilters
          ? "No reviewed PYQs match these filters yet."
          : "No reviewed PYQs are available for this subject yet."}
      </p>
      {hasActiveFilters ? (
        <button
          type="button"
          data-testid="pyq-empty-clear"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] hover:bg-[#1d9e75] hover:text-white"
        >
          Clear filters
        </button>
      ) : null}
    </section>
  );
}

function LoadingPanel() {
  return (
    <div
      data-testid="pyq-loading"
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-10 text-sm font-bold text-[#5d675f]"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#1d9e75]" />
      Loading PYQs…
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      data-testid="pyq-error"
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
      return "This subject isn't available yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load the PYQs. Please try again.";
}

export default PyqExplorer;
