"use client";

import { useState } from "react";
import type { ContentBlock } from "@/services/api/gsLmsService";
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Brain,
  HelpCircle,
  ChevronDown,
  Target,
  Quote,
  BookOpen,
} from "lucide-react";

/**
 * Rich, interactive content-block renderer for the GS LMS.
 *
 * Goes well beyond plain paragraphs: highlighted keywords, callouts, stat
 * cards, comparison tables, timelines, examiner-trap cards, memory hooks,
 * inline self-check quizzes (active recall), and lightweight inline SVG
 * diagrams. Designed for retention — distinctiveness (von Restorff), chunking,
 * curiosity gaps, analogies, and testing-effect prompts.
 *
 * Blocks are flexible `Record<string, unknown>`; every accessor is defensive
 * so unknown/legacy block shapes degrade gracefully to a paragraph.
 */

const GREEN = "#1d9e75";
const INK = "#13251d";
const AMBER = "#ef9f27";

// ---------------------------------------------------------------------------
// Inline markup: **highlight** → emphasized keyword, *em* → italic emphasis.
// ---------------------------------------------------------------------------
function renderInline(text: string): React.ReactNode {
  if (!text) return null;
  // Split on **...** while keeping delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <mark
          key={i}
          className="rounded bg-[#1d9e75]/12 px-1 py-0.5 font-semibold text-[#1a3a2a]"
        >
          {inner}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Callout tones (hook / insight / tip / why / note)
// ---------------------------------------------------------------------------
const CALLOUT_TONES: Record<
  string,
  { bg: string; border: string; text: string; icon: React.ReactNode; label: string }
> = {
  hook: {
    bg: "#fff7e8",
    border: "#f0d59a",
    text: "#7a5a12",
    icon: <Sparkles className="h-4 w-4" />,
    label: "Hook",
  },
  insight: {
    bg: "#e9f6f0",
    border: "#bfe3d3",
    text: "#1a3a2a",
    icon: <Lightbulb className="h-4 w-4" />,
    label: "Insight",
  },
  tip: {
    bg: "#eef4ff",
    border: "#c4d6f5",
    text: "#274472",
    icon: <Target className="h-4 w-4" />,
    label: "Exam Tip",
  },
  why: {
    bg: "#f3eefb",
    border: "#d8c8f0",
    text: "#5b3a86",
    icon: <Brain className="h-4 w-4" />,
    label: "Why It Matters",
  },
  note: {
    bg: "#faf6ee",
    border: "#e6dcc2",
    text: "#5d675f",
    icon: <BookOpen className="h-4 w-4" />,
    label: "Note",
  },
};

function Callout({ block }: { block: ContentBlock }) {
  const tone = (block.tone as string) || "insight";
  const t = CALLOUT_TONES[tone] ?? CALLOUT_TONES.insight;
  const title = (block.title as string) || t.label;
  const text = block.text as string | undefined;
  const items = block.items as string[] | undefined;
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: t.bg, borderColor: t.border }}
    >
      <div className="flex items-center gap-1.5" style={{ color: t.text }}>
        {t.icon}
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{title}</p>
      </div>
      {text ? (
        <p className="mt-1.5 text-sm leading-7 text-[#31443a]">{renderInline(text)}</p>
      ) : null}
      {items?.length ? (
        <ul className="mt-1.5 flex flex-col gap-1">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm leading-6 text-[#31443a]">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: t.text }}
              />
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat grid — big distinctive numbers (von Restorff effect).
// ---------------------------------------------------------------------------
function StatGrid({ block }: { block: ContentBlock }) {
  const items = (block.items as Array<{ value: string; label: string }>) || [];
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((s, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#dcd5c7] bg-gradient-to-b from-white to-[#f7f4ee] px-3 py-3 text-center"
        >
          <div className="text-lg font-black leading-tight" style={{ color: GREEN }}>
            {s.value}
          </div>
          <div className="mt-1 text-[11px] font-medium leading-tight text-[#5d675f]">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key terms — definition cards.
// ---------------------------------------------------------------------------
function KeyTerms({ block }: { block: ContentBlock }) {
  const terms =
    (block.terms as Array<{ term: string; definition: string }>) ||
    (block.term
      ? [{ term: block.term as string, definition: block.definition as string }]
      : []);
  if (!terms.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {terms.map((t, i) => (
        <div
          key={i}
          className="rounded-lg border-l-4 border-[#1d9e75] bg-[#f7f4ee] px-3 py-2"
        >
          <span className="text-sm font-bold text-[#13251d]">{t.term}</span>
          <span className="text-sm text-[#31443a]"> — {renderInline(t.definition)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison table — two columns (e.g. Steady State vs Big Bang).
// ---------------------------------------------------------------------------
function Compare({ block }: { block: ContentBlock }) {
  const columns = (block.columns as string[]) || ["A", "B"];
  const rows =
    (block.rows as Array<{ label?: string; a: string; b: string }>) || [];
  if (!rows.length) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-[#dcd5c7]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#1d9e75]/10">
            {block.rowHeader !== false ? <th className="w-px" /> : null}
            {columns.map((c, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-[12px] font-bold uppercase tracking-wide text-[#1a3a2a]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 ? "bg-[#f7f4ee]" : "bg-white"}>
              {r.label != null ? (
                <td className="px-3 py-2 text-[12px] font-semibold text-[#5d675f]">
                  {r.label}
                </td>
              ) : null}
              <td className="px-3 py-2 leading-6 text-[#31443a]">{renderInline(r.a)}</td>
              <td className="px-3 py-2 leading-6 text-[#31443a]">{renderInline(r.b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline — chronology (who proposed → who proved, etc.).
// ---------------------------------------------------------------------------
function Timeline({ block }: { block: ContentBlock }) {
  const events =
    (block.events as Array<{ year: string; title: string; detail?: string }>) || [];
  if (!events.length) return null;
  return (
    <ol className="relative ml-3 flex flex-col gap-4 border-l-2 border-[#1d9e75]/30 pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1d9e75] ring-4 ring-[#1d9e75]/15" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black text-[#1d9e75]">{e.year}</span>
            <span className="text-sm font-bold text-[#13251d]">{e.title}</span>
          </div>
          {e.detail ? (
            <p className="mt-0.5 text-[13px] leading-6 text-[#5d675f]">
              {renderInline(e.detail)}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Examiner trap — distinctive red warning card.
// ---------------------------------------------------------------------------
function Trap({ block }: { block: ContentBlock }) {
  const title = (block.title as string) || "Examiner Trap";
  const text = block.text as string | undefined;
  return (
    <div className="rounded-xl border border-[#e6c2c2] bg-[#fbf0ee] p-4">
      <div className="flex items-center gap-1.5 text-[#a23b46]">
        <AlertTriangle className="h-4 w-4" />
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{title}</p>
      </div>
      {text ? (
        <p className="mt-1.5 text-sm leading-7 text-[#6e4b50]">{renderInline(text)}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Memory hook / mnemonic.
// ---------------------------------------------------------------------------
function Memory({ block }: { block: ContentBlock }) {
  const text = block.text as string | undefined;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#d8c8f0] bg-[#f3eefb] p-3.5">
      <Brain className="mt-0.5 h-4 w-4 shrink-0 text-[#5b3a86]" />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5b3a86]">
          Memory Hook
        </p>
        <p className="mt-0.5 text-sm leading-7 text-[#43335e]">{renderInline(text || "")}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analogy.
// ---------------------------------------------------------------------------
function Analogy({ block }: { block: ContentBlock }) {
  const text = block.text as string | undefined;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#e6dcc2] bg-[#faf6ee] p-3.5">
      <Quote className="mt-0.5 h-4 w-4 shrink-0 text-[#b08a2e]" />
      <p className="text-sm italic leading-7 text-[#5a4a28]">{renderInline(text || "")}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline self-check quiz — active recall (testing effect). Interactive reveal.
// ---------------------------------------------------------------------------
function Quiz({ block }: { block: ContentBlock }) {
  const [revealed, setRevealed] = useState(false);
  const question = block.question as string | undefined;
  const answer = block.answer as string | undefined;
  return (
    <div className="rounded-xl border-2 border-dashed border-[#1d9e75]/40 bg-[#f0faf5] p-4">
      <div className="flex items-center gap-1.5 text-[#1a3a2a]">
        <HelpCircle className="h-4 w-4" />
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]">Quick Check</p>
      </div>
      <p className="mt-1.5 text-sm font-semibold leading-7 text-[#13251d]">
        {renderInline(question || "")}
      </p>
      {revealed ? (
        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm leading-7 text-[#31443a]">
          {renderInline(answer || "")}
        </p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="mt-2 rounded-lg bg-[#1d9e75] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#178a65]"
        >
          Reveal answer
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible "dig deeper" — progressive disclosure within a section.
// ---------------------------------------------------------------------------
function Collapsible({ block }: { block: ContentBlock }) {
  const [open, setOpen] = useState(false);
  const title = (block.title as string) || "Dig deeper";
  const text = block.text as string | undefined;
  const items = block.items as string[] | undefined;
  return (
    <div className="rounded-xl border border-[#dcd5c7] bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-[#13251d]">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#1d9e75] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="px-4 pb-4">
          {text ? (
            <p className="text-sm leading-7 text-[#31443a]">{renderInline(text)}</p>
          ) : null}
          {items?.length ? (
            <ul className="flex flex-col gap-1.5">
              {items.map((it, i) => (
                <li key={i} className="flex gap-2 text-sm leading-6 text-[#31443a]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" />
                  <span>{renderInline(it)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Points list.
// ---------------------------------------------------------------------------
function Points({ block }: { block: ContentBlock }) {
  const items = (block.items as string[]) || [];
  const heading = block.heading as string | undefined;
  if (!items.length) return null;
  return (
    <div>
      {heading ? (
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1d9e75]">
          {heading}
        </p>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-6 text-[#31443a]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d9e75]" />
            <span>{renderInline(it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lightweight inline SVG diagrams keyed by id (no asset pipeline needed).
// ---------------------------------------------------------------------------
function Diagram({ block }: { block: ContentBlock }) {
  const id = block.id as string | undefined;
  const caption = block.caption as string | undefined;
  let svg: React.ReactNode = null;

  if (id === "universe-composition") {
    // Stacked bar: Dark Energy 68 / Dark Matter 27 / Visible 5
    svg = (
      <svg viewBox="0 0 320 70" className="w-full" role="img" aria-label="Composition of the Universe">
        <rect x="0" y="20" width={0.68 * 300} height="28" rx="4" fill="#5b3a86" />
        <rect x={0.68 * 300} y="20" width={0.27 * 300} height="28" fill="#1d9e75" />
        <rect x={0.95 * 300} y="20" width={0.05 * 300} height="28" rx="4" fill="#ef9f27" />
        <text x="100" y="38" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">Dark Energy 68%</text>
        <text x="245" y="38" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle">Dark Matter 27%</text>
        <text x="160" y="64" fill="#5d675f" fontSize="9" textAnchor="middle">Visible (baryonic) matter ≈ 5%</text>
      </svg>
    );
  } else if (id === "cosmic-timeline") {
    svg = (
      <svg viewBox="0 0 320 90" className="w-full" role="img" aria-label="Cosmic timeline">
        <line x1="10" y1="45" x2="310" y2="45" stroke="#1d9e75" strokeWidth="2" />
        {[
          { x: 10, t: "0s", l: "Big Bang" },
          { x: 90, t: "3 min", l: "H + He" },
          { x: 180, t: "380k yr", l: "CMBR" },
          { x: 250, t: "200M yr", l: "Stars" },
          { x: 310, t: "Now", l: "13.8 Bn" },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy="45" r="4" fill="#1d9e75" />
            <text x={p.x} y="28" fill="#13251d" fontSize="9" fontWeight="700" textAnchor="middle">{p.t}</text>
            <text x={p.x} y="64" fill="#5d675f" fontSize="8" textAnchor="middle">{p.l}</text>
          </g>
        ))}
      </svg>
    );
  } else {
    // Generic fallback placeholder.
    svg = (
      <div className="flex items-center justify-center rounded-lg bg-[#f7f4ee] py-8 text-xs font-medium text-[#5d675f]">
        {caption || "Diagram"}
      </div>
    );
  }

  return (
    <figure className="rounded-xl border border-[#dcd5c7] bg-white p-4">
      {svg}
      {caption ? (
        <figcaption className="mt-2 text-center text-[11px] font-medium text-[#5d675f]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

// ---------------------------------------------------------------------------
// NCERT Reference — direct-jump link to exact book/chapter/page
// ---------------------------------------------------------------------------
function NcertReference({ block }: { block: ContentBlock }) {
  const book = block.book as string | undefined;
  const classNum = block.class as string | undefined;
  const chapter = block.chapter as string | undefined;
  const pageStart = block.page_start as number | undefined;
  const pageEnd = block.page_end as number | undefined;
  const externalUrl = block.external_url as string | undefined;
  const content = (block.text || block.content) as string | undefined;
  const keyFacts = block.key_facts as string[] | undefined;

  const pageRange = pageStart && pageEnd
    ? `pp. ${pageStart}–${pageEnd}`
    : pageStart
      ? `p. ${pageStart}`
      : '';

  return (
    <div className="my-4 rounded-xl border border-[#e8d5a8] bg-gradient-to-br from-[#fef9ec] to-[#fffbeb] p-4">
      {/* Header with book info */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          {book && (
            <p className="text-xs font-black text-[#8c5d14]">{book}</p>
          )}
          <p className="text-[10px] text-[#8c5d14]/70">
            {[classNum && `Class ${classNum}`, chapter && `Ch. ${chapter}`, pageRange]
              .filter(Boolean)
              .join(' • ')}
          </p>
        </div>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 rounded-lg border border-[#e8d5a8] bg-white px-2.5 py-1 text-[9px] font-black text-[#8c5d14] hover:bg-[#fef9ec] hover:shadow-sm transition-all"
          >
            Open NCERT →
          </a>
        )}
      </div>

      {/* Extracted content */}
      {content && (
        <p className="text-sm leading-relaxed text-[#5d4e37]">{renderInline(content)}</p>
      )}

      {/* Key facts list */}
      {keyFacts && keyFacts.length > 0 && (
        <ul className="mt-2 space-y-1">
          {keyFacts.map((fact, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-[#5d4e37]">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8c5d14]/40 flex-shrink-0" />
              {renderInline(fact)}
            </li>
          ))}
        </ul>
      )}

      {/* Non-clickable reference when no URL */}
      {!externalUrl && book && (
        <p className="mt-2 text-[10px] text-[#8c5d14]/60 italic">
          Reference: {book}{classNum ? `, Class ${classNum}` : ''}{chapter ? `, Chapter ${chapter}` : ''}{pageRange ? `, ${pageRange}` : ''}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Master block dispatcher.
// ---------------------------------------------------------------------------
export function RichBlock({ block }: { block: ContentBlock }) {
  const type = (block.type as string) || "para";
  const text = block.text as string | undefined;

  switch (type) {
    case "heading":
    case "h2":
    case "h3":
      return (
        <h3 className="mt-5 mb-1 flex items-center gap-2 text-base font-bold text-[#13251d]">
          <span className="h-4 w-1 rounded-full" style={{ backgroundColor: GREEN }} />
          {text}
        </h3>
      );
    case "callout":
      return <Callout block={block} />;
    case "statgrid":
    case "stats":
      return <StatGrid block={block} />;
    case "keyterm":
    case "keyterms":
    case "definition":
      return <KeyTerms block={block} />;
    case "compare":
    case "comparison":
      return <Compare block={block} />;
    case "timeline":
      return <Timeline block={block} />;
    case "trap":
      return <Trap block={block} />;
    case "memory":
    case "mnemonic":
      return <Memory block={block} />;
    case "analogy":
      return <Analogy block={block} />;
    case "quiz":
      return <Quiz block={block} />;
    case "collapsible":
      return <Collapsible block={block} />;
    case "points":
      return <Points block={block} />;
    case "diagram":
      return <Diagram block={block} />;
    case "ncert_reference":
    case "ncert_ref":
    case "ncert":
      return <NcertReference block={block} />;
    case "para":
    default:
      return (
        <p className="text-sm leading-7 text-[#31443a]">
          {text != null ? renderInline(text) : JSON.stringify(block)}
        </p>
      );
  }
}

export function RichBlocks({ blocks }: { blocks: ContentBlock[] | null | undefined }) {
  if (!blocks?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => (
        <RichBlock key={i} block={b} />
      ))}
    </div>
  );
}
