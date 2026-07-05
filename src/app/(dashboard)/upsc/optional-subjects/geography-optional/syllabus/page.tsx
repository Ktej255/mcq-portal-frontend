import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Eye, FileText, History, ListChecks, Target, TrendingUp } from "lucide-react";

import { readyTopics } from "@/lib/upsc/optional/geographyOptionalTopics";
import type { Frequency, PyqEntry } from "@/lib/upsc/optional/geographyOptionalTypes";

const FREQ_STYLE: Record<Frequency, string> = {
  "Very High": "bg-[#c0392b] text-white",
  High: "bg-[#b9770e] text-white",
  Medium: "bg-[#2a5db0] text-white",
  Low: "bg-[#6b7280] text-white",
};

function groupPyqByTheme(pyqs: PyqEntry[]) {
  const map = new Map<string, PyqEntry[]>();
  for (const p of pyqs) {
    const list = map.get(p.theme) ?? [];
    list.push(p);
    map.set(p.theme, list);
  }
  return Array.from(map.entries()).map(([theme, items]) => ({ theme, items }));
}

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

            {/* In-depth trend analysis (when available) */}
            {topic.trendAnalysis ? (
              <div className="go-card mt-3 rounded-md border-l-4 border-[#2a5db0] p-4">
                <p className="go-hand flex items-center gap-2 text-xl text-[#1f2a44]">
                  <BarChart3 className="h-4 w-4 text-[#2a5db0]" /> In-depth trend analysis
                </p>

                <p className="mt-2 text-sm leading-6 text-[#33405f]">{topic.trendAnalysis.overview}</p>
                <p className="mt-2 rounded border border-[#dfe6f3] bg-[#f6f9ff] p-3 text-sm leading-6 text-[#33405f]">
                  <span className="font-black text-[#1f2a44]">Marks pattern — </span>
                  {topic.trendAnalysis.marksPattern}
                </p>

                {/* Evolution over time */}
                <p className="go-hand mt-4 flex items-center gap-2 text-lg text-[#1f2a44]">
                  <History className="h-4 w-4 text-[#2a5db0]" /> How the focus has shifted
                </p>
                <div className="mt-1 space-y-1.5">
                  {topic.trendAnalysis.evolution.map((e) => (
                    <div key={e.period} className="rounded border border-[#dfe6f3] bg-[#f6f9ff] p-3">
                      <p className="text-[14px] font-black text-[#1f2a44]">{e.period}</p>
                      <p className="mt-0.5 text-sm leading-6 text-[#44506b]">{e.shift}</p>
                    </div>
                  ))}
                </div>

                {/* Sub-theme frequency table */}
                <p className="go-hand mt-4 text-lg text-[#1f2a44]">Sub-theme frequency</p>
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-[#6b7280]">
                        <th className="border-b border-[#dfe6f3] py-1.5 pr-2">Sub-theme</th>
                        <th className="border-b border-[#dfe6f3] py-1.5 pr-2">Freq.</th>
                        <th className="border-b border-[#dfe6f3] py-1.5 pr-2">Marks</th>
                        <th className="border-b border-[#dfe6f3] py-1.5 pr-2">Years (best-effort)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topic.trendAnalysis.themeTable.map((row) => (
                        <tr key={row.theme} className="align-top">
                          <td className="border-b border-[#eef1f6] py-2 pr-2">
                            <span className="font-black text-[#1f2a44]">{row.theme}</span>
                            <span className="block text-[13px] leading-5 text-[#5d6b86]">{row.note}</span>
                          </td>
                          <td className="border-b border-[#eef1f6] py-2 pr-2">
                            <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${FREQ_STYLE[row.frequency]}`}>
                              {row.frequency}
                            </span>
                          </td>
                          <td className="border-b border-[#eef1f6] py-2 pr-2 font-bold text-[#33405f]">{row.marksBand}</td>
                          <td className="border-b border-[#eef1f6] py-2 pr-2 text-[13px] text-[#5d6b86]">{row.years.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Three info columns */}
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded border border-[#cde0cf] bg-[#eef8f1] p-3">
                    <p className="flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider text-[#2e7d4f]">
                      <ListChecks className="h-3.5 w-3.5" /> Question formats
                    </p>
                    <ul className="mt-1 space-y-1">
                      {topic.trendAnalysis.questionFormats.map((f) => (
                        <li key={f} className="text-[13px] leading-5 text-[#33405f]">– {f}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded border border-[#cde0cf] bg-[#eef8f1] p-3">
                    <p className="flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider text-[#2e7d4f]">
                      <Target className="h-3.5 w-3.5" /> Examiner expects
                    </p>
                    <ul className="mt-1 space-y-1">
                      {topic.trendAnalysis.examinerExpectations.map((f) => (
                        <li key={f} className="text-[13px] leading-5 text-[#33405f]">– {f}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded border border-[#f0c9c1] bg-[#fdeeec] p-3">
                    <p className="flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider text-[#c0392b]">
                      <AlertTriangle className="h-3.5 w-3.5" /> Common pitfalls
                    </p>
                    <ul className="mt-1 space-y-1">
                      {topic.trendAnalysis.commonPitfalls.map((f) => (
                        <li key={f} className="text-[13px] leading-5 text-[#33405f]">– {f}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Predicted focus */}
                <div className="mt-3 rounded border border-[#ecdcc0] bg-[#fdf6e8] p-3">
                  <p className="flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider text-[#7a4e08]">
                    <Target className="h-3.5 w-3.5" /> High-probability focus areas
                  </p>
                  <ul className="mt-1 grid gap-1 md:grid-cols-2">
                    {topic.trendAnalysis.predictedFocus.map((f) => (
                      <li key={f} className="text-[13px] leading-5 text-[#5d5640]">★ {f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {/* PYQ bank (when available) */}
            {topic.pyqBank && topic.pyqBank.length > 0 ? (
              <div className="go-card mt-3 rounded-md border-l-4 border-[#1a3a2a] p-4">
                <p className="go-hand flex items-center gap-2 text-xl text-[#1f2a44]">
                  <FileText className="h-4 w-4 text-[#1a3a2a]" /> Mains PYQ bank ({topic.pyqBank.length} questions)
                </p>
                <p className="mt-1 text-[12px] font-semibold text-[#8a7a52]">
                  Geography Optional, Paper I. Question stems are authentic; year tags are shown only where reliably known.
                </p>
                <div className="mt-2 space-y-3">
                  {groupPyqByTheme(topic.pyqBank).map((group) => (
                    <div key={group.theme}>
                      <p className="text-[13px] font-black uppercase tracking-wider text-[#2e7d4f]">{group.theme}</p>
                      <ul className="mt-1 space-y-1.5">
                        {group.items.map((p) => (
                          <li key={p.q} className="flex gap-2 text-[14px] leading-6 text-[#33405f]">
                            <span className="font-black text-[#c0392b]">Q.</span>
                            <span>
                              {p.q}
                              {p.year ? <span className="ml-1 text-xs font-bold text-[#8a7a52]">[{p.year}{p.marks ? `, ${p.marks}m` : ""}]</span> : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
