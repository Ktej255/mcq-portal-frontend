"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BookOpen, ListTree, ScrollText } from "lucide-react";

import type {
  CalloutTone,
  ContentBlock,
  OptionalTopic,
  Subtopic,
} from "@/lib/upsc/optional/geographyOptionalTypes";
import { GeoDiagram } from "./GeoOptionalDiagrams";

const CALLOUT_STYLE: Record<CalloutTone, { box: string; chip: string; label: string }> = {
  key: { box: "border-[#2e7d4f] bg-[#eef8f1]", chip: "bg-[#2e7d4f]", label: "Key idea" },
  trap: { box: "border-[#c0392b] bg-[#fdeeec]", chip: "bg-[#c0392b]", label: "Watch out" },
  keyword: { box: "border-[#b9770e] bg-[#fdf4e3]", chip: "bg-[#b9770e]", label: "Exam keywords" },
  example: { box: "border-[#2a5db0] bg-[#eaf1fb]", chip: "bg-[#2a5db0]", label: "Example" },
  link: { box: "border-[#6b4bb0] bg-[#f1ecfb]", chip: "bg-[#6b4bb0]", label: "Link / cross-paper" },
};

function Block({ block }: { block: ContentBlock }) {
  if (block.type === "para") {
    return <p className="go-leading mb-3 text-[17px] leading-7 text-[#283250]">{block.text}</p>;
  }
  if (block.type === "points") {
    return (
      <div className="mb-3">
        {block.heading ? (
          <p className="go-hand mb-1 text-xl text-[#1f2a44]">{block.heading}</p>
        ) : null}
        <ul className="space-y-1.5">
          {block.items.map((item) => (
            <li key={item} className="flex gap-2 text-[16px] leading-6 text-[#33405f]">
              <span className="mt-1 text-[#c0392b]">✦</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (block.type === "diagram") {
    return <GeoDiagram id={block.id} caption={block.caption} />;
  }
  // callout
  const s = CALLOUT_STYLE[block.tone];
  return (
    <div className={`my-4 rounded-md border-l-4 p-3 ${s.box}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ${s.chip}`}>
          {s.label}
        </span>
        <span className="go-hand text-lg text-[#1f2a44]">{block.title}</span>
      </div>
      <ul className="space-y-1">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2 text-[15px] leading-6 text-[#33405f]">
            <span className="mt-0.5">–</span>
            <span className={block.tone === "keyword" ? "go-marker" : ""}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubtopicSection({ sub, index }: { sub: Subtopic; index: number }) {
  return (
    <section id={sub.id} className="scroll-mt-24 border-t border-dashed border-[#d8cdb4] pt-6">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#b9770e]">
        {String(index + 1).padStart(2, "0")} · {sub.syllabusTag}
      </p>
      <h2 className="go-hand go-tilt-l mt-1 text-3xl text-[#1f2a44] md:text-4xl">{sub.title}</h2>
      <p className="go-underline mt-2 inline-block text-[15px] font-semibold text-[#44506b]">{sub.hook}</p>

      <div className="mt-4">
        {sub.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      {/* answer language */}
      <div className="go-card go-tape mt-5 rounded-md p-4">
        <p className="go-hand text-lg text-[#1f2a44]">How UPSC wants you to phrase it</p>
        <ul className="mt-2 space-y-1.5">
          {sub.answerLanguage.map((line) => (
            <li key={line} className="text-[15px] italic leading-6 text-[#2a5db0]">{line}</li>
          ))}
        </ul>
      </div>

      {/* PYQ */}
      <div className="mt-4 rounded-md border border-[#ece3cf] bg-[#fffdf6] p-4">
        <p className="go-hand text-lg text-[#1f2a44]">Previous-year questions</p>
        <ul className="mt-2 space-y-1.5">
          {sub.pyq.map((p) => (
            <li key={p.q} className="flex gap-2 text-[15px] leading-6 text-[#33405f]">
              <span className="font-black text-[#c0392b]">Q.</span>
              <span>
                {p.q}
                {p.year ? <span className="ml-1 text-xs font-bold text-[#8a7a52]">[{p.year}]</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GeographyOptionalReader({ topic }: { topic: OptionalTopic }) {
  const [open, setOpen] = useState(false);

  return (
    <main className="go-notes min-h-screen bg-[#f3ecdb]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        {/* top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/upsc/optional-subjects/geography-optional/read"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f]"
          >
            <ArrowLeft className="h-4 w-4" /> All topics
          </Link>
          <Link
            href="/upsc/optional-subjects/geography-optional/syllabus"
            className="inline-flex items-center gap-2 rounded-md border border-[#b9770e] bg-[#fdf4e3] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#7a4e08]"
          >
            <ScrollText className="h-4 w-4" /> Syllabus map
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* TOC */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="go-card flex w-full items-center justify-between rounded-md p-3 lg:cursor-default"
            >
              <span className="go-hand flex items-center gap-2 text-xl text-[#1f2a44]">
                <ListTree className="h-4 w-4" /> On this page
              </span>
            </button>
            <nav className={`mt-2 ${open ? "block" : "hidden"} lg:block`}>
              <ol className="space-y-1">
                {topic.subtopics.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={() => setOpen(false)}
                      className="block rounded px-2 py-1.5 text-sm font-semibold text-[#44506b] hover:bg-[#efe6d0]"
                    >
                      <span className="text-[#b9770e]">{String(i + 1).padStart(2, "0")}.</span> {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          {/* notebook page */}
          <article className="go-paper rounded-lg px-5 py-7 md:px-10 md:py-9">
            <header className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2e7d4f]">
                {topic.paper} · {topic.section}
              </p>
              <h1 className="go-hand go-tilt-l mt-1 text-5xl text-[#1f2a44] md:text-6xl">{topic.title}</h1>
              <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-[#44506b]">
                <BookOpen className="h-4 w-4" /> {topic.summary}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#8a7a52]">
                ~{topic.readMinutes} min focused read · {topic.subtopics.length} subtopics
              </p>
            </header>

            <div className="space-y-8">
              {topic.subtopics.map((sub, i) => (
                <SubtopicSection key={sub.id} sub={sub} index={i} />
              ))}
            </div>

            <footer className="mt-10 border-t border-dashed border-[#d8cdb4] pt-5 text-center">
              <p className="go-hand text-2xl text-[#2e7d4f]">You&apos;ve read the whole concept. ✦ Now you can write it.</p>
              <Link
                href="/upsc/optional-subjects/geography-optional/syllabus"
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#1a3a2a] px-4 py-2 text-sm font-black text-white"
              >
                See where this sits in the syllabus
              </Link>
            </footer>
          </article>
        </div>
      </div>
    </main>
  );
}
