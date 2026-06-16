import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Clock,
  Layers,
  Lock,
  ScrollText,
  Sparkles,
} from "lucide-react";

import { allTopicCards, geographyOptionalMeta } from "@/lib/upsc/optional/geographyOptionalTopics";

export default function GeographyOptionalHome() {
  return (
    <main className="go-notes min-h-screen bg-[#f3ecdb]">
      <div className="mx-auto max-w-5xl px-4 py-7 md:px-8">
        <Link
          href="/upsc/optional-subjects"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f]"
        >
          <ArrowLeft className="h-4 w-4" /> Optional catalog
        </Link>

        {/* hero */}
        <section className="go-paper mt-4 rounded-lg px-5 py-8 md:px-10">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2e7d4f]">
            UPSC Optional · {geographyOptionalMeta.papers.join(" + ")}
          </p>
          <h1 className="go-hand go-tilt-l mt-1 text-5xl text-[#1f2a44] md:text-6xl">
            {geographyOptionalMeta.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] font-semibold leading-7 text-[#44506b]">
            Read one concept at a time, written like a topper&apos;s personal notes — so that a single,
            honest read builds real confidence. Every topic is mapped to the official syllabus, the
            25-year question trend, and the hidden topics UPSC never prints but always asks.
          </p>

          {/* Syllabus button FIRST, then Read button */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/upsc/optional-subjects/geography-optional/syllabus"
              className="inline-flex items-center gap-2 rounded-md bg-[#b9770e] px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-white shadow-sm transition hover:bg-[#9c6309]"
            >
              <ScrollText className="h-4 w-4" /> Syllabus map
            </Link>
            <Link
              href="/upsc/optional-subjects/geography-optional/read"
              className="inline-flex items-center gap-2 rounded-md bg-[#1a3a2a] px-5 py-3 text-sm font-black uppercase tracking-[0.1em] text-white shadow-sm transition hover:bg-[#10291d]"
            >
              <BookOpenText className="h-4 w-4" /> Read (notes)
            </Link>
          </div>
          <p className="mt-2 text-xs font-bold text-[#8a7a52]">
            Tip: open the Syllabus map first to see the official line, the trend, and the hidden topics — then Read.
          </p>
        </section>

        {/* what the syllabus map gives you */}
        <section className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { t: "Official says", d: "The exact syllabus line as printed by UPSC — nothing added, nothing dropped.", c: "border-[#2e7d4f] bg-[#eef8f1]" },
            { t: "Trend says", d: "What 25 years of papers actually demand, ranked by how often it is asked.", c: "border-[#2a5db0] bg-[#eaf1fb]" },
            { t: "Hidden topics", d: "Never named in the syllabus, but required to answer — surfaced for you.", c: "border-[#b9770e] bg-[#fdf4e3]" },
          ].map((x) => (
            <div key={x.t} className={`rounded-md border-l-4 p-4 ${x.c}`}>
              <p className="go-hand text-xl text-[#1f2a44]">{x.t}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#44506b]">{x.d}</p>
            </div>
          ))}
        </section>

        {/* topic queue */}
        <section className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#2e7d4f]" />
            <h2 className="go-hand text-3xl text-[#1f2a44]">Paper I · Physical Geography — build order</h2>
          </div>
          <div className="grid gap-3">
            {allTopicCards.map((topic) => {
              const ready = topic.status === "ready";
              const inner = (
                <div
                  className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${
                    ready
                      ? "go-card border-[#cde0cf] hover:border-[#2e7d4f]"
                      : "border-dashed border-[#d8cdb4] bg-[#f7f1e3] opacity-80"
                  }`}
                >
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#b9770e]">
                      {String(topic.order).padStart(2, "0")} · {topic.paper}
                    </p>
                    <h3 className="go-hand mt-0.5 text-2xl text-[#1f2a44]">{topic.title}</h3>
                    <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[#44506b]">{topic.summary}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#8a7a52]">
                      <Clock className="h-3.5 w-3.5" /> ~{topic.readMinutes} min
                    </p>
                  </div>
                  <div className="shrink-0">
                    {ready ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-black text-white">
                        Read <ArrowRight className="h-4 w-4" />
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
                  {inner}
                </Link>
              ) : (
                <div key={topic.slug}>{inner}</div>
              );
            })}
          </div>
        </section>

        <section className="go-card mt-6 rounded-md p-4 text-center">
          <p className="go-hand inline-flex items-center gap-2 text-xl text-[#2e7d4f]">
            <Sparkles className="h-4 w-4" /> Geomorphology is live now. Climatology is next in the build queue.
          </p>
        </section>
      </div>
    </main>
  );
}
