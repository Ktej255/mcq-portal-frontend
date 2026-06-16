import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Lock, ScrollText } from "lucide-react";

import { allTopicCards } from "@/lib/upsc/optional/geographyOptionalTopics";

export default function GeographyOptionalReadIndex() {
  return (
    <main className="go-notes min-h-screen bg-[#f3ecdb]">
      <div className="mx-auto max-w-5xl px-4 py-7 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/upsc/optional-subjects/geography-optional"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f]"
          >
            <ArrowLeft className="h-4 w-4" /> Geography Optional home
          </Link>
          <Link
            href="/upsc/optional-subjects/geography-optional/syllabus"
            className="inline-flex items-center gap-2 rounded-md border border-[#b9770e] bg-[#fdf4e3] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#7a4e08]"
          >
            <ScrollText className="h-4 w-4" /> Syllabus map
          </Link>
        </div>

        <section className="go-paper mt-4 rounded-lg px-5 py-8 md:px-10">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2e7d4f]">Read · personal notes</p>
          <h1 className="go-hand go-tilt-l mt-1 text-5xl text-[#1f2a44] md:text-6xl">Pick a topic to read</h1>
          <p className="mt-3 max-w-2xl text-[16px] font-semibold leading-7 text-[#44506b]">
            Each module is a complete, self-sufficient read — concept, hand-drawn diagrams, exam keywords,
            answer phrasing and previous-year questions in one flow.
          </p>
        </section>

        <section className="mt-6 grid gap-3">
          {allTopicCards.map((topic) => {
            const ready = topic.status === "ready";
            const body = (
              <div
                className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${
                  ready ? "go-card border-[#cde0cf] hover:border-[#2e7d4f]" : "border-dashed border-[#d8cdb4] bg-[#f7f1e3] opacity-80"
                }`}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#b9770e]">
                    {String(topic.order).padStart(2, "0")} · {topic.paper}
                  </p>
                  <h2 className="go-hand mt-0.5 text-2xl text-[#1f2a44]">{topic.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[#44506b]">{topic.summary}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#8a7a52]">
                    <Clock className="h-3.5 w-3.5" /> ~{topic.readMinutes} min
                  </p>
                </div>
                <div className="shrink-0">
                  {ready ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black text-white">
                      Open <ArrowRight className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#d8cdb4] bg-white px-3 py-2 text-xs font-black text-[#8a7a52]">
                      <Lock className="h-3.5 w-3.5" /> Soon
                    </span>
                  )}
                </div>
              </div>
            );
            return ready ? (
              <Link key={topic.slug} href={`/upsc/optional-subjects/geography-optional/read/${topic.slug}`}>
                {body}
              </Link>
            ) : (
              <div key={topic.slug}>{body}</div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
