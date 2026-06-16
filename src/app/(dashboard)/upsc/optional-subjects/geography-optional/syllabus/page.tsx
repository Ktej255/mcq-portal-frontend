import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, FileText, TrendingUp } from "lucide-react";

import { readyTopics } from "@/lib/upsc/optional/geographyOptionalTopics";
import type { Frequency } from "@/lib/upsc/optional/geographyOptionalTypes";

const FREQ_STYLE: Record<Frequency, string> = {
  "Very High": "bg-[#c0392b] text-white",
  High: "bg-[#b9770e] text-white",
  Medium: "bg-[#2a5db0] text-white",
  Low: "bg-[#6b7280] text-white",
};

export default function GeographyOptionalSyllabus() {
  return (
    <main className="go-notes min-h-screen bg-[#f3ecdb]">
      <div className="mx-auto max-w-5xl px-4 py-7 md:px-8">
        <Link
          href="/upsc/optional-subjects/geography-optional"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f]"
        >
          <ArrowLeft className="h-4 w-4" /> Geography Optional home
        </Link>

        <section className="go-paper mt-4 rounded-lg px-5 py-8 md:px-10">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2e7d4f]">Syllabus map</p>
          <h1 className="go-hand go-tilt-l mt-1 text-5xl text-[#1f2a44] md:text-6xl">
            What the syllabus really demands
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] font-semibold leading-7 text-[#44506b]">
            Three honest layers for every topic: the <span className="go-marker">official line</span>, what the{" "}
            <span className="go-marker">question trend</span> reveals, and the{" "}
            <span className="go-marker">hidden topics</span> UPSC expects but never prints.
          </p>
        </section>

        {readyTopics.map((topic) => (
          <article key={topic.slug} className="mt-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="go-hand text-3xl text-[#1f2a44]">{topic.title}</h2>
              <Link
                href={`/upsc/optional-subjects/geography-optional/read/${topic.slug}`}
                className="inline-flex items-center gap-1 rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black text-white"
              >
                Read notes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Layer 1 — Official */}
            <div className="go-card rounded-md border-l-4 border-[#2e7d4f] p-4">
              <p className="go-hand flex items-center gap-2 text-xl text-[#1f2a44]">
                <FileText className="h-4 w-4 text-[#2e7d4f]" /> Official says
              </p>
              <ul className="mt-2 space-y-1.5">
                {topic.syllabus.official.map((line) => (
                  <li key={line} className="flex gap-2 text-[15px] leading-6 text-[#33405f]">
                    <span className="text-[#2e7d4f]">▪</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Layer 2 — Trend */}
            <div className="go-card mt-3 rounded-md border-l-4 border-[#2a5db0] p-4">
              <p className="go-hand flex items-center gap-2 text-xl text-[#1f2a44]">
                <TrendingUp className="h-4 w-4 text-[#2a5db0]" /> Trend says
              </p>
              <div className="mt-2 space-y-2.5">
                {topic.syllabus.trendSays.map((t) => (
                  <div key={t.theme} className="rounded border border-[#dfe6f3] bg-[#f6f9ff] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[15px] font-black text-[#1f2a44]">{t.theme}</p>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${FREQ_STYLE[t.frequency]}`}>
                        {t.frequency}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#44506b]">{t.insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Layer 3 — Hidden */}
            <div className="go-card mt-3 rounded-md border-l-4 border-[#b9770e] p-4">
              <p className="go-hand flex items-center gap-2 text-xl text-[#1f2a44]">
                <Eye className="h-4 w-4 text-[#b9770e]" /> Hidden topics (asked but never printed)
              </p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {topic.syllabus.hiddenTopics.map((h) => (
                  <div key={h.topic} className="rounded border border-[#ecdcc0] bg-[#fdf6e8] p-3">
                    <p className="text-[15px] font-black text-[#7a4e08]">{h.topic}</p>
                    <p className="mt-1 text-sm leading-6 text-[#5d5640]">{h.why}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}

        <section className="go-card mt-6 rounded-md p-4 text-center">
          <p className="go-hand text-xl text-[#2e7d4f]">
            More topics&apos; syllabus maps unlock as each Read module is built — Climatology is next.
          </p>
        </section>
      </div>
    </main>
  );
}
