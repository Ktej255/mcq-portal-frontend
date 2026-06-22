"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Languages,
  Lightbulb,
  Loader2,
  Sparkles,
  Tag,
} from "lucide-react";

import { OptionalDiagram } from "@/components/upsc/read/OptionalDiagrams";
import {
  NotYetAuthored,
  NotYetAuthoredBadge,
  NOT_YET_AUTHORED_MESSAGE,
} from "@/components/upsc/read/NotYetAuthored";
import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type ContentBlock,
  type ContentUnitOut,
  type NodeContentOut,
  type SubtopicBlocks,
  type SyllabusNodeOut,
  type TopicOverviewBlocks,
} from "@/services/api/optionalService";

/**
 * ReadView — the backend-served Read layer for an optional subject topic
 * (spec task 6.1, R5.1 / R5.2).
 *
 * Fetches a topic's deep notes from the backend content endpoints (never the
 * legacy frontend TS modules) and renders the typed content blocks
 * (para / points / callout / diagram), examiner keywords, answer-language
 * phrasing and hidden topics.
 *
 * Honesty gate (design Property 8 / R5.4 / R17.3): the backend only returns
 * reviewed+authored content and marks everything else `authored: false`. This
 * view honours that flag — it never fabricates content. A topic with no
 * authored content shows the shared {@link NotYetAuthored} panel, and within an
 * authored topic any subtopic lacking reviewed content is clearly marked
 * (never rendered blank or fake-complete).
 *
 * Diagram blocks render the real ported hand-drawn SVG via `OptionalDiagram`
 * (the LMS-owned registry from `read/OptionalDiagrams`), keyed by `diagram_id`,
 * with a graceful labelled fallback for any unknown id (task 6.2).
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

export interface ReadViewProps {
  /** Subject slug, e.g. "geography". */
  slug: string;
  /** Topic title to open initially (matched against the syllabus tree). */
  topicTitle?: string;
  /** Optional callback to close/return from the Read view. */
  onClose?: () => void;
}

type LoadState = "idle" | "loading" | "loaded" | "error";

export function ReadView({ slug, topicTitle, onClose }: ReadViewProps) {
  const { isLoaded, isSignedIn } = useApiConfig();

  const [topics, setTopics] = useState<SyllabusNodeOut[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [node, setNode] = useState<NodeContentOut | null>(null);
  const [treeState, setTreeState] = useState<LoadState>("idle");
  const [contentState, setContentState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  // 1) Load the syllabus tree and collect the top-level TOPIC nodes.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setTreeState("loading");
    setError(null);
    optionalService
      .getSyllabusTree(slug)
      .then((tree) => {
        if (cancelled) return;
        const topicNodes: SyllabusNodeOut[] = [];
        for (const paper of tree.papers) {
          for (const section of paper.sections) {
            for (const n of section.nodes) topicNodes.push(n);
          }
        }
        setTopics(topicNodes);
        // Pick the requested topic (by title) or the first authored topic.
        const wanted = topicTitle
          ? topicNodes.find(
              (n) => n.title.trim().toLowerCase() === topicTitle.trim().toLowerCase(),
            )
          : undefined;
        const fallback = topicNodes.find((n) => n.authored) ?? topicNodes[0];
        const chosen = wanted ?? fallback ?? null;
        setActiveNodeId(chosen ? chosen.node_id : null);
        setTreeState("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(messageFromError(err));
        setTreeState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, topicTitle, isLoaded, isSignedIn]);

  // 2) Load the active topic's content (with its subtopic children).
  useEffect(() => {
    if (activeNodeId == null || !isLoaded || !isSignedIn) return;
    let cancelled = false;
    setContentState("loading");
    setError(null);
    optionalService
      .getTopicContent(slug, activeNodeId)
      .then((data) => {
        if (cancelled) return;
        setNode(data);
        setContentState("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(messageFromError(err));
        setContentState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, activeNodeId, isLoaded, isSignedIn]);

  const activeTopicMeta = useMemo(
    () => topics.find((t) => t.node_id === activeNodeId) ?? null,
    [topics, activeNodeId],
  );

  const overview = useMemo(() => extractOverview(node?.content ?? null), [node]);

  return (
    <main
      data-testid="read-view"
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
              data-testid="read-view-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to subject
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Read · Deep notes
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {activeTopicMeta?.title ?? topicTitle ?? "Read"}
          </h1>
          {overview?.summary ? (
            <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
              {overview.summary}
            </p>
          ) : null}
        </section>

        {/* Topic switcher (when more than one topic exists) */}
        {topics.length > 1 ? (
          <div data-testid="read-view-topic-switcher" className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <button
                key={t.node_id}
                type="button"
                onClick={() => setActiveNodeId(t.node_id)}
                data-testid="read-view-topic-chip"
                aria-pressed={t.node_id === activeNodeId}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] transition-all ${
                  t.node_id === activeNodeId
                    ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                    : "border-[#dcd5c7] bg-[#fffdf8] text-[#31443a] hover:border-[#1d9e75]"
                }`}
              >
                {t.title}
                {!t.authored ? (
                  <span className="rounded-full bg-[#faf6ee] px-1.5 py-0.5 text-[9px] text-[#8a7a52]">
                    soon
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {/* Loading / error / content */}
        {treeState === "loading" || contentState === "loading" ? (
          <LoadingPanel />
        ) : null}

        {(treeState === "error" || contentState === "error") && error ? (
          <ErrorPanel message={error} />
        ) : null}

        {contentState === "loaded" && node ? (
          node.authored && node.content ? (
            <TopicContent node={node} overview={overview} />
          ) : (
            <NotYetAuthored title={node.title} testid="read-view-not-authored" />
          )
        ) : null}

        {treeState === "loaded" && topics.length === 0 ? (
          <NotYetAuthored title={topicTitle ?? slug} testid="read-view-not-authored" />
        ) : null}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Topic content
// ---------------------------------------------------------------------------

function TopicContent({
  node,
  overview,
}: {
  node: NodeContentOut;
  overview: ReturnType<typeof extractOverview>;
}) {
  // Topic-overview unit carries the three-layer syllabus + hidden topics.
  const officialLines = overview?.syllabus?.official ?? [];
  const hiddenTopics = node.content?.hidden_topics ?? overview?.syllabus?.hiddenTopics ?? [];

  // All declared subtopics, in display order. The honesty gate is already
  // applied server-side: a subtopic with `authored=false` has `content=null`.
  const subtopics = node.children;
  const authoredSubtopics = subtopics.filter((c) => c.authored && c.content);

  return (
    <div className="flex flex-col gap-4" data-testid="read-view-content">
      {officialLines.length > 0 ? (
        <Card title="Official syllabus" icon={<BookOpen className="h-4 w-4" />}>
          <ul className="flex flex-col gap-1.5">
            {officialLines.map((line, i) => (
              <li key={i} className="text-sm font-semibold leading-6 text-[#31443a]">
                {line}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {hiddenTopics.length > 0 ? (
        <Card
          title="Hidden topics (asked beyond the printed syllabus)"
          icon={<Sparkles className="h-4 w-4" />}
          testid="read-view-hidden-topics"
        >
          <ul className="flex flex-col gap-2.5">
            {hiddenTopics.map((ht, i) => (
              <li
                key={i}
                data-testid="read-view-hidden-topic"
                className="rounded-lg border border-[#e6dcc2] bg-[#faf6ee] px-3.5 py-2.5"
              >
                <p className="text-sm font-black text-[#13251d]">{ht.topic}</p>
                {ht.why ? (
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-[#8a7a52]">{ht.why}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Subtopics: authored ones render full deep notes; any subtopic without
          reviewed content is clearly marked, never rendered blank (R5.4). */}
      {subtopics.map((sub) =>
        sub.authored && sub.content ? (
          <SubtopicCard key={sub.node_id} sub={sub} />
        ) : (
          <SubtopicNotAuthored key={sub.node_id} title={sub.title} />
        ),
      )}

      {subtopics.length === 0 && authoredSubtopics.length === 0 ? (
        <p
          data-testid="read-view-no-subtopics"
          className="rounded-xl border border-dashed border-[#cdbf9f] bg-[#faf6ee] px-4 py-6 text-center text-xs font-semibold text-[#8a7a52]"
        >
          {NOT_YET_AUTHORED_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}

function SubtopicCard({ sub }: { sub: NodeContentOut }) {
  const content = sub.content as ContentUnitOut;
  const blocks = subtopicBlocks(content);

  return (
    <Card title={sub.title} icon={<BookOpen className="h-4 w-4" />} testid="read-view-subtopic">
      {blocks.length > 0 ? (
        <div className="flex flex-col gap-3">
          {blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      ) : null}

      {content.exam_keywords && content.exam_keywords.length > 0 ? (
        <div className="mt-4" data-testid="read-view-exam-keywords">
          <SubHeading icon={<Tag className="h-3.5 w-3.5" />}>Examiner keywords</SubHeading>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {content.exam_keywords.map((kw, i) => (
              <span
                key={i}
                data-testid="read-view-keyword"
                className="inline-flex rounded-full border border-[#1d9e75]/40 bg-[#e7f5ee] px-2.5 py-1 text-[11px] font-black text-[#085041]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {content.answer_language && content.answer_language.length > 0 ? (
        <div className="mt-4" data-testid="read-view-answer-language">
          <SubHeading icon={<Languages className="h-3.5 w-3.5" />}>
            Answer-language phrasing
          </SubHeading>
          <ul className="mt-2 flex flex-col gap-1.5">
            {content.answer_language.map((line, i) => (
              <li
                key={i}
                data-testid="read-view-answer-line"
                className="rounded-lg border-l-2 border-[#1d9e75] bg-[#f3f9f5] px-3 py-2 text-sm font-semibold italic leading-6 text-[#1a3a2a]"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Block renderers (para / points / callout / diagram)
// ---------------------------------------------------------------------------
function SubtopicNotAuthored({ title }: { title: string }) {
  return (
    <section
      data-testid="read-view-subtopic-not-authored"
      data-authored="false"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[#cdbf9f] bg-[#faf6ee] px-5 py-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#8a7a52]" />
        <h2 className="text-base font-black tracking-tight text-[#13251d]">{title}</h2>
      </div>
      <NotYetAuthoredBadge testid="read-view-subtopic-badge" />
    </section>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "para":
      return (
        <p data-testid="read-block-para" className="text-sm font-semibold leading-7 text-[#31443a]">
          {block.text}
        </p>
      );
    case "points":
      return (
        <div data-testid="read-block-points">
          {block.heading ? (
            <p className="mb-1 text-xs font-black uppercase tracking-[0.1em] text-[#1d9e75]">
              {block.heading}
            </p>
          ) : null}
          <ul className="flex flex-col gap-1.5 pl-1">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm font-semibold leading-6 text-[#31443a]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "callout":
      return <CalloutBlock block={block} />;
    case "diagram":
      return <OptionalDiagram diagramId={block.id} caption={block.caption} />;
    default:
      return null;
  }
}

function CalloutBlock({
  block,
}: {
  block: Extract<ContentBlock, { type: "callout" }>;
}) {
  return (
    <div
      data-testid="read-block-callout"
      data-tone={block.tone}
      className="rounded-xl border border-[#e6dcc2] bg-[#faf6ee] p-3.5"
    >
      <div className="flex items-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-[#1d9e75]" />
        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#1a3a2a]">{block.title}</p>
      </div>
      <ul className="mt-1.5 flex flex-col gap-1">
        {block.items.map((item, i) => (
          <li key={i} className="text-sm font-semibold leading-6 text-[#31443a]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared presentational helpers
// ---------------------------------------------------------------------------

function Card({
  title,
  icon,
  children,
  testid,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  testid?: string;
}) {
  return (
    <section
      data-testid={testid}
      className="rounded-2xl border p-5 shadow-sm md:p-6"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <div className="mb-3 flex items-center gap-2">
        {icon ? <span className="text-[#1d9e75]">{icon}</span> : null}
        <h2 className="text-lg font-black tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SubHeading({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
      {icon}
      {children}
    </p>
  );
}

function LoadingPanel() {
  return (
    <div
      data-testid="read-view-loading"
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-10 text-sm font-bold text-[#5d675f]"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#1d9e75]" />
      Loading deep notes…
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      data-testid="read-view-error"
      className="flex items-start gap-2 rounded-2xl border border-[#e6c2c2] bg-[#fbf0ee] px-4 py-5 text-sm font-semibold text-[#8a4b52]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payload helpers (mirror the importer's block shapes)
// ---------------------------------------------------------------------------

function extractOverview(content: ContentUnitOut | null): TopicOverviewBlocks | null {
  if (!content || !content.blocks) return null;
  const blocks = content.blocks as Record<string, unknown>;
  if (blocks.kind === "topic-overview") return blocks as unknown as TopicOverviewBlocks;
  return null;
}

function subtopicBlocks(content: ContentUnitOut | null): ContentBlock[] {
  if (!content || !content.blocks) return [];
  const blocks = content.blocks as Record<string, unknown>;
  if (blocks.kind === "subtopic") {
    const inner = (blocks as unknown as SubtopicBlocks).blocks;
    return Array.isArray(inner) ? inner : [];
  }
  return [];
}

function messageFromError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { response?: { status?: number }; message?: string };
    if (anyErr.response?.status === 404) {
      return "This topic isn't available yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load the deep notes. Please try again.";
}

export default ReadView;
