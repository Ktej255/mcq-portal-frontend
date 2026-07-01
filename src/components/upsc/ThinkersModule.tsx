"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Languages,
  Lightbulb,
  Loader2,
  Tag,
  Users,
} from "lucide-react";

import { OptionalDiagram } from "@/components/upsc/read/OptionalDiagrams";
import { NotYetAuthored } from "@/components/upsc/read/NotYetAuthored";
import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type ContentBlock,
  type ContentUnitOut,
  type NodeContentOut,
  type SubtopicBlocks,
  type SyllabusNodeOut,
  type SyllabusTreeOut,
} from "@/services/api/optionalService";

/**
 * ThinkersModule — the Sociology-specific "Thinkers" surface (spec
 * sociology-optional-content task 5.2, R4.2–R4.4 / R4.6 / R4.7).
 *
 * The analog of Geography's {@link MappingModule}: a subject-specific feature
 * mounted config-driven through the existing `SubjectFeatureSlot` when the
 * subject's `config.features` includes `"thinkers"`. It presents exactly the
 * six sociological thinkers — Karl Marx, Emile Durkheim, Max Weber, Talcott
 * Parsons, Robert Merton, George Herbert Mead — as selectable entries (R4.3,
 * none omitted, none added).
 *
 * Crucially, it introduces **no separate content store** (R4.4). On selecting a
 * thinker it reuses the existing Read-layer content endpoint
 * (`GET /api/v1/optional/{slug}/topics/{id}/content`, via `optionalService`)
 * for that thinker's "Sociological thinkers" subtopic node, resolving each
 * thinker's node id from the subject's syllabus tree
 * (`GET /api/v1/optional/{slug}/syllabus-tree`).
 *
 * Honesty gate (design Property 8 / R4.6 / R4.7): the content endpoint returns
 * only reviewed+authored content and marks everything else `authored: false`
 * with `content: null`. A thinker whose subtopic is unauthored/UNREVIEWED — or
 * whose subtopic node cannot be resolved in the tree yet — shows the shared
 * {@link NotYetAuthored} state, never fabricated or placeholder content.
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

/**
 * The canonical six sociological thinkers (R4.3). The list is fixed in the UI —
 * exactly these six, in this order, regardless of how the syllabus subtopics
 * were authored. `match` is the unique surname keyword used to resolve each
 * thinker's syllabus subtopic node id from the tree, tolerating authoring
 * variants (e.g. "Robert K. Merton", "Mead - Self and identity").
 */
interface ThinkerDef {
  /** Stable id used for selection + the `data-thinker` test hook. */
  id: string;
  /** Display name shown in the module (the canonical thinker name). */
  name: string;
  /** A short note shown beneath the name in the entry list. */
  blurb: string;
  /** Lowercase surname keyword for resolving the subtopic node id. */
  match: string;
}

const THINKERS: readonly ThinkerDef[] = [
  { id: "marx", name: "Karl Marx", blurb: "Historical materialism · class struggle · alienation", match: "marx" },
  { id: "durkheim", name: "Emile Durkheim", blurb: "Social fact · division of labour · suicide", match: "durkheim" },
  { id: "weber", name: "Max Weber", blurb: "Social action · ideal types · bureaucracy", match: "weber" },
  { id: "parsons", name: "Talcott Parsons", blurb: "Social system · pattern variables", match: "parsons" },
  { id: "merton", name: "Robert Merton", blurb: "Manifest/latent functions · reference groups", match: "merton" },
  { id: "mead", name: "George Herbert Mead", blurb: "Self and identity · symbolic interaction", match: "mead" },
] as const;

export interface ThinkersModuleProps {
  /** Subject slug, e.g. "sociology". */
  slug: string;
  /** Optional callback to close/return from the Thinkers module. */
  onClose?: () => void;
}

export function ThinkersModule({ slug, onClose }: ThinkersModuleProps) {
  const { isLoaded, isSignedIn } = useApiConfig();

  // Resolve each thinker's syllabus subtopic node id from the tree (R4.4) —
  // the module reads its content from the existing Read-layer endpoint, so it
  // needs the node id, not a separate store.
  const [nodeIds, setNodeIds] = useState<Record<string, number>>({});
  const [treeState, setTreeState] = useState<LoadState>("idle");
  const [treeError, setTreeError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [node, setNode] = useState<NodeContentOut | null>(null);
  const [contentState, setContentState] = useState<LoadState>("idle");
  const [contentError, setContentError] = useState<string | null>(null);

  // 1) Load the syllabus tree once and resolve the six thinker subtopic nodes.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setTreeState("loading");
    setTreeError(null);
    optionalService
      .getSyllabusTree(slug)
      .then((tree) => {
        if (cancelled) return;
        setNodeIds(resolveThinkerNodeIds(tree));
        setTreeState("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTreeError(messageFromError(err));
        setTreeState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isLoaded, isSignedIn]);

  const selectedNodeId = selected ? nodeIds[selected] : undefined;

  // 2) On selecting a thinker, fetch that subtopic's content from the EXISTING
  //    Read-layer content endpoint (no separate content store — R4.4).
  useEffect(() => {
    if (selected == null || !isLoaded || !isSignedIn) return;
    // No resolved node id => the subtopic isn't in the tree yet; show the
    // honest "not yet authored" state rather than calling a bogus id (R4.7).
    if (selectedNodeId == null) {
      setNode(null);
      setContentState("loaded");
      return;
    }
    let cancelled = false;
    setContentState("loading");
    setContentError(null);
    optionalService
      .getTopicContent(slug, selectedNodeId)
      .then((data) => {
        if (cancelled) return;
        setNode(data);
        setContentState("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setContentError(messageFromError(err));
        setContentState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, selected, selectedNodeId, isLoaded, isSignedIn]);

  const selectedThinker = useMemo(
    () => THINKERS.find((t) => t.id === selected) ?? null,
    [selected],
  );

  return (
    <main
      data-testid="thinkers-module"
      data-slug={slug}
      className="min-h-screen text-[#13251d]"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-5 md:px-8">
        {/* Header */}
        <section
          className="rounded-2xl border p-5 shadow-sm md:p-6"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              data-testid="thinkers-module-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to subject
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Thinkers · Sociological theorists
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Thinkers</h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
            The six sociological thinkers, one tap away. Open a thinker to read the same reviewed
            deep notes authored for that subtopic — nothing separate, nothing fabricated.
          </p>
        </section>

        {treeState === "error" && treeError ? <ErrorPanel message={treeError} /> : null}

        {/* The six selectable thinker entries — always exactly six (R4.3). */}
        <section
          data-testid="thinkers-list"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
          {THINKERS.map((thinker) => {
            const isActive = thinker.id === selected;
            return (
              <button
                key={thinker.id}
                type="button"
                data-testid="thinkers-entry"
                data-thinker={thinker.name}
                aria-pressed={isActive}
                onClick={() => setSelected(thinker.id)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40 ${
                  isActive ? "border-[#1a3a2a] bg-[#1a3a2a] text-white" : "hover:border-[#1d9e75]"
                }`}
                style={
                  isActive
                    ? undefined
                    : { borderColor: PALETTE.border, backgroundColor: PALETTE.card }
                }
              >
                <Users
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#1d9e75]"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black tracking-tight">
                    {thinker.name}
                  </span>
                  <span
                    className={`block truncate text-[11px] font-semibold ${
                      isActive ? "text-white/80" : "text-[#8a7a52]"
                    }`}
                  >
                    {thinker.blurb}
                  </span>
                </span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-[#1d9e75]"}`}
                />
              </button>
            );
          })}
        </section>

        {/* Selected thinker's content — reuses the Read-layer content endpoint. */}
        {selected == null ? (
          <p
            data-testid="thinkers-prompt"
            className="rounded-2xl border border-dashed border-[#cdbf9f] bg-[#faf6ee] px-4 py-8 text-center text-sm font-semibold text-[#8a7a52]"
          >
            Select a thinker to read their deep notes.
          </p>
        ) : (
          <section data-testid="thinkers-content" data-thinker={selectedThinker?.name}>
            {contentState === "loading" ? <LoadingPanel /> : null}
            {contentState === "error" && contentError ? (
              <ErrorPanel message={contentError} />
            ) : null}
            {contentState === "loaded" ? (
              node && node.authored && node.content ? (
                <ThinkerContent node={node} />
              ) : (
                <NotYetAuthored
                  title={selectedThinker?.name}
                  testid="thinkers-not-authored"
                  message="Reviewed deep notes for this thinker arrive in a later step — draft notes are under review for accuracy."
                />
              )
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Thinker content — renders the reused Read-layer ContentUnit deep notes
// (mirrors ReadView's SubtopicCard so the reading surface is identical).
// ---------------------------------------------------------------------------

function ThinkerContent({ node }: { node: NodeContentOut }) {
  const content = node.content as ContentUnitOut;
  const blocks = subtopicBlocks(content);

  return (
    <Card title={node.title} icon={<BookOpen className="h-4 w-4" />} testid="thinkers-deep-notes">
      {node.official_phrasing ? (
        <p className="mb-3 text-xs font-semibold italic leading-6 text-[#8a7a52]">
          {node.official_phrasing}
        </p>
      ) : null}

      {blocks.length > 0 ? (
        <div className="flex flex-col gap-3">
          {blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      ) : null}

      {content.exam_keywords && content.exam_keywords.length > 0 ? (
        <div className="mt-4" data-testid="thinkers-exam-keywords">
          <SubHeading icon={<Tag className="h-3.5 w-3.5" />}>Examiner keywords</SubHeading>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {content.exam_keywords.map((kw, i) => (
              <span
                key={i}
                data-testid="thinkers-keyword"
                className="inline-flex rounded-full border border-[#1d9e75]/40 bg-[#e7f5ee] px-2.5 py-1 text-[11px] font-black text-[#085041]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {content.answer_language && content.answer_language.length > 0 ? (
        <div className="mt-4" data-testid="thinkers-answer-language">
          <SubHeading icon={<Languages className="h-3.5 w-3.5" />}>
            Answer-language phrasing
          </SubHeading>
          <ul className="mt-2 flex flex-col gap-1.5">
            {content.answer_language.map((line, i) => (
              <li
                key={i}
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
// Block renderers (para / points / callout / diagram) — mirror ReadView
// ---------------------------------------------------------------------------

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "para":
      return (
        <p data-testid="thinkers-block-para" className="text-sm font-semibold leading-7 text-[#31443a]">
          {block.text}
        </p>
      );
    case "points":
      return (
        <div data-testid="thinkers-block-points">
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

function CalloutBlock({ block }: { block: Extract<ContentBlock, { type: "callout" }> }) {
  return (
    <div
      data-testid="thinkers-block-callout"
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
      data-testid="thinkers-module-loading"
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
      data-testid="thinkers-module-error"
      className="flex items-start gap-2 rounded-2xl border border-[#e6c2c2] bg-[#fbf0ee] px-4 py-5 text-sm font-semibold text-[#8a4b52]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tree → thinker node-id resolution + payload helpers
// ---------------------------------------------------------------------------

/**
 * Walk the syllabus tree and resolve each canonical thinker to the subtopic
 * node id whose title carries the thinker's unique surname keyword. This
 * tolerates authoring variants ("Robert K. Merton", "Mead - Self and
 * identity") and the exact Section A/B placement, while keeping the displayed
 * set fixed at exactly the six thinkers (R4.3/R4.4).
 */
function resolveThinkerNodeIds(tree: SyllabusTreeOut): Record<string, number> {
  const all: SyllabusNodeOut[] = [];
  const walk = (nodes: SyllabusNodeOut[]) => {
    for (const n of nodes) {
      all.push(n);
      if (n.children && n.children.length > 0) walk(n.children);
    }
  };
  for (const paper of tree.papers) {
    for (const section of paper.sections) walk(section.nodes);
  }

  const resolved: Record<string, number> = {};
  for (const thinker of THINKERS) {
    const found = all.find((n) => n.title.toLowerCase().includes(thinker.match));
    if (found) resolved[thinker.id] = found.node_id;
  }
  return resolved;
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
      return "Thinkers content isn't available for this subject yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load the Thinkers module. Please try again.";
}

export default ThinkersModule;
