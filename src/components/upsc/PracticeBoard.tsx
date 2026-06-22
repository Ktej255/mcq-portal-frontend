"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Dumbbell,
  Layers,
  Loader2,
  PenLine,
  Target,
  X,
} from "lucide-react";

import {
  NotYetAuthored,
  NotYetAuthoredBadge,
} from "@/components/upsc/read/NotYetAuthored";
import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type PaperLabel,
  type PracticeBoardOut,
  type PracticePaperOut,
  type PracticeSectionOut,
  type PracticeStatus,
  type PracticeTopicStatusOut,
  type SectionLabel,
} from "@/services/api/optionalService";

/**
 * PracticeBoard — the student-facing practice surface for an optional subject
 * (spec task 8, Phase 1D, R7.1 / R7.2 / R7.3).
 *
 * Organizes the subject's **practice topics under the syllabus tree** — papers
 * → sections → topics (R7.1) — fetched from the backend
 * (`/api/v1/optional/{slug}/practice/status`) via `optionalService`. For each
 * topic it shows a clear per-student practice status (R7.3): how many attempts
 * have been made, when the topic was last practiced, and a derived state
 * (Not started / In progress / Practiced). Each authored topic exposes a clear
 * "Practice" call-to-action (R7.2).
 *
 * Honesty gates:
 * - A topic is only practiceable when its backend `authored` flag is true
 *   (reviewed+authored content exists — design Property 8). Everything else
 *   shows the shared {@link NotYetAuthoredBadge} instead of a practice CTA, so
 *   the board never fabricates practiceability.
 * - The status is derived purely from the student's own attempts (ownership —
 *   design Property 10). A student with no attempts sees the honest zero-state
 *   (Not started, no count, no last-practiced date) — nothing is invented.
 *
 * The practice action itself (typed/spoken/handwritten answer writing +
 * AI-assisted evaluation) is the `AnswerWorkspace` built in **Task 9**. This
 * board exposes a clean seam for it: when an `onPractice(topicNodeId,
 * topicTitle)` host callback is provided, the "Practice" CTA hands the chosen
 * topic to the host; otherwise it opens an honest interim panel that says the
 * answer workspace arrives in a later step — it never grades or fabricates a
 * practice session.
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

const STATUS_META: Record<
  PracticeStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  NOT_STARTED: {
    label: "Not started",
    icon: <Circle className="h-3 w-3" />,
    className: "border-[#dcd5c7] bg-[#faf6ee] text-[#8a7a52]",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: <Clock className="h-3 w-3" />,
    className: "border-[#d7b85a]/50 bg-[#faf3df] text-[#8a6d1f]",
  },
  PRACTICED: {
    label: "Practiced",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041]",
  },
};

export interface PracticeBoardProps {
  /** Subject slug, e.g. "geography". */
  slug: string;
  /** Optional callback to close/return from the board. */
  onClose?: () => void;
  /**
   * Seam for the answer-writing workspace (spec task 9). When provided, picking
   * "Practice" on a topic hands the chosen topic to the host instead of opening
   * the built-in interim panel. Task 9 wires the real `AnswerWorkspace` here.
   * Until then the interim panel is shown and **no practice is fabricated**.
   */
  onPractice?: (topicNodeId: number, topicTitle: string) => void;
}

export function PracticeBoard({ slug, onClose, onPractice }: PracticeBoardProps) {
  const { isLoaded, isSignedIn } = useApiConfig();

  const [data, setData] = useState<PracticeBoardOut | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Interim "Practice" target — only used when no `onPractice` host seam.
  const [practiceTarget, setPracticeTarget] = useState<PracticeTopicStatusOut | null>(
    null,
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setState("loading");
    setError(null);
    optionalService
      .getPracticeStatus(slug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setState("loaded");
        // Open the first non-empty section by default so topics are visible.
        const firstSection = res.papers
          .flatMap((p) => p.sections)
          .find((s) => s.topics.length > 0);
        setExpanded(new Set(firstSection ? [firstSection.section_id] : []));
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

  const toggleSection = useCallback((sectionId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  // Practice seam: hand off to the host (`onPractice`, task 9) when wired,
  // otherwise open the honest interim panel. No practice is fabricated here.
  const handlePractice = useCallback(
    (topic: PracticeTopicStatusOut) => {
      if (onPractice) {
        onPractice(topic.node_id, topic.title);
        return;
      }
      setPracticeTarget(topic);
    },
    [onPractice],
  );

  const hasAnyTopics = (data?.total_topics ?? 0) > 0;

  return (
    <main
      data-testid="practice-board"
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
              data-testid="practice-board-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to subject
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <Dumbbell className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Practice · Answer writing by topic
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {data?.name ?? "Practice"}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
            Practice topics are organized under the syllabus tree. Each topic shows your
            practice status — pick an authored topic to start writing answers.
          </p>

          {state === "loaded" && hasAnyTopics ? (
            <ProgressSummary data={data!} />
          ) : null}
        </section>

        {state === "loading" ? <LoadingPanel /> : null}
        {state === "error" && error ? <ErrorPanel message={error} /> : null}

        {state === "loaded" ? (
          data && hasAnyTopics ? (
            <section data-testid="practice-papers" className="flex flex-col gap-5">
              {data.papers.map((paper) => (
                <PaperBlock
                  key={paper.paper_id}
                  paper={paper}
                  expanded={expanded}
                  onToggleSection={toggleSection}
                  onPractice={handlePractice}
                />
              ))}
            </section>
          ) : (
            <NotYetAuthored
              title={data?.name ?? slug}
              testid="practice-board-not-authored"
              message="Practice topics for this subject arrive in a later step."
            />
          )
        ) : null}
      </div>

      {/* Interim Practice panel — only when no host `onPractice` seam is wired. */}
      {practiceTarget ? (
        <PracticeInterimModal
          topic={practiceTarget}
          onClose={() => setPracticeTarget(null)}
        />
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Progress summary (board-level roll-up)
// ---------------------------------------------------------------------------

function ProgressSummary({ data }: { data: PracticeBoardOut }) {
  return (
    <div
      data-testid="practice-progress-summary"
      className="mt-4 flex flex-wrap items-center gap-2"
    >
      <SummaryPill icon={<Layers className="h-3 w-3" />}>
        {data.total_topics} topic{data.total_topics === 1 ? "" : "s"}
      </SummaryPill>
      <SummaryPill icon={<Target className="h-3 w-3" />}>
        {data.authored_topics} ready to practice
      </SummaryPill>
      <SummaryPill icon={<CheckCircle2 className="h-3 w-3" />}>
        {data.practiced_topics} practiced
      </SummaryPill>
    </div>
  );
}

function SummaryPill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#31443a]">
      <span className="text-[#1d9e75]">{icon}</span>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Paper → section → topic structure (R7.1)
// ---------------------------------------------------------------------------

function PaperBlock({
  paper,
  expanded,
  onToggleSection,
  onPractice,
}: {
  paper: PracticePaperOut;
  expanded: Set<number>;
  onToggleSection: (sectionId: number) => void;
  onPractice: (topic: PracticeTopicStatusOut) => void;
}) {
  const paperName =
    (paper.label && PAPER_LABELS[paper.label as PaperLabel]) || paper.name;
  return (
    <div data-testid="practice-paper" data-paper={paper.label} className="flex flex-col gap-3">
      <div
        className="flex items-center gap-2 border-b border-dashed pt-1"
        style={{ borderColor: PALETTE.borderSoft }}
      >
        <Layers className="h-4 w-4 text-[#1a3a2a]" />
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">
          {paperName}
        </p>
      </div>
      {paper.sections.map((section) => (
        <SectionBlock
          key={section.section_id}
          section={section}
          expanded={expanded.has(section.section_id)}
          onToggle={() => onToggleSection(section.section_id)}
          onPractice={onPractice}
        />
      ))}
    </div>
  );
}

function SectionBlock({
  section,
  expanded,
  onToggle,
  onPractice,
}: {
  section: PracticeSectionOut;
  expanded: boolean;
  onToggle: () => void;
  onPractice: (topic: PracticeTopicStatusOut) => void;
}) {
  const panelId = `practice-section-panel-${section.section_id}`;
  const sectionLabel = section.label
    ? SECTION_LABELS[section.label as SectionLabel] ?? section.label
    : null;
  const heading = sectionLabel ? `${sectionLabel} — ${section.name}` : section.name;
  const practicedCount = section.topics.filter((t) => t.status === "PRACTICED").length;
  return (
    <article
      data-testid="practice-section"
      data-section-id={section.section_id}
      className="overflow-hidden rounded-2xl border shadow-sm"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <button
        type="button"
        data-testid="practice-section-toggle"
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
            {heading}
          </span>
          <span className="mt-0.5 block text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]">
            {practicedCount}/{section.topics.length} practiced
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#31443a]">
          {section.topics.length} topic{section.topics.length === 1 ? "" : "s"}
        </span>
      </button>
      {expanded ? (
        <div
          id={panelId}
          data-testid="practice-section-topics"
          className="flex flex-col gap-2.5 border-t px-4 py-4 md:px-5"
          style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.bg }}
        >
          {section.topics.length > 0 ? (
            section.topics.map((topic) => (
              <TopicRow key={topic.node_id} topic={topic} onPractice={onPractice} />
            ))
          ) : (
            <NotYetAuthored
              testid="practice-section-empty"
              message="Topics for this section arrive in a later step."
            />
          )}
        </div>
      ) : null}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Topic row — status (R7.3) + practice call-to-action (R7.2)
// ---------------------------------------------------------------------------

function TopicRow({
  topic,
  onPractice,
}: {
  topic: PracticeTopicStatusOut;
  onPractice: (topic: PracticeTopicStatusOut) => void;
}) {
  return (
    <div
      data-testid="practice-topic"
      data-node-id={topic.node_id}
      data-authored={topic.authored ? "true" : "false"}
      data-status={topic.status}
      className="flex flex-col gap-2 rounded-xl border px-4 py-3 md:flex-row md:items-center md:justify-between"
      style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.card }}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#13251d]">{topic.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge status={topic.status} />
          <span
            data-testid="practice-topic-attempts"
            className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]"
          >
            {topic.attempt_count} attempt{topic.attempt_count === 1 ? "" : "s"}
          </span>
          {topic.last_practiced_at ? (
            <span
              data-testid="practice-topic-last"
              className="text-[11px] font-semibold text-[#8a7a52]"
            >
              Last practiced {formatDate(topic.last_practiced_at)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="shrink-0">
        {topic.authored ? (
          <button
            type="button"
            data-testid="practice-topic-cta"
            data-node-id={topic.node_id}
            onClick={() => onPractice(topic)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
          >
            <PenLine className="h-3.5 w-3.5" />
            {topic.status === "NOT_STARTED" ? "Practice" : "Practice again"}
          </button>
        ) : (
          <NotYetAuthoredBadge testid="practice-topic-not-authored" />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PracticeStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      data-testid="practice-topic-status"
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${meta.className}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Interim "Practice" panel — honest placeholder until AnswerWorkspace (task 9)
// ---------------------------------------------------------------------------

function PracticeInterimModal({
  topic,
  onClose,
}: {
  topic: PracticeTopicStatusOut;
  onClose: () => void;
}) {
  return (
    <div
      data-testid="practice-interim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-interim-title"
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
              id="practice-interim-title"
              className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]"
            >
              Answer workspace · Coming soon
            </p>
          </div>
          <button
            type="button"
            data-testid="practice-interim-close"
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
          Writing and AI-assisted evaluation for this topic land in a later phase. For now
          this is a placeholder — nothing is graded and no practice session is recorded yet.
        </p>

        <div
          className="mt-4 rounded-xl border p-4"
          style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.bg }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8a7a52]">
            Practice topic
          </p>
          <p className="mt-1 text-sm font-black tracking-tight text-[#13251d]">{topic.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={topic.status} />
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]">
              {topic.attempt_count} attempt{topic.attempt_count === 1 ? "" : "s"} so far
            </span>
          </div>
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
// Shared panels + helpers
// ---------------------------------------------------------------------------

function LoadingPanel() {
  return (
    <div
      data-testid="practice-loading"
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-10 text-sm font-bold text-[#5d675f]"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#1d9e75]" />
      Loading practice topics…
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      data-testid="practice-error"
      className="flex items-start gap-2 rounded-2xl border border-[#e6c2c2] bg-[#fbf0ee] px-4 py-5 text-sm font-semibold text-[#8a4b52]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function messageFromError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { response?: { status?: number }; message?: string };
    if (anyErr.response?.status === 404) {
      return "Practice isn't available for this subject yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load the practice board. Please try again.";
}

export default PracticeBoard;
