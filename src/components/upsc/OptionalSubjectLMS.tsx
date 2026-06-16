"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronDown,
  FileText,
  Lock,
  Map as MapIcon,
  MessageCircle,
  PenLine,
  PlayCircle,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

import {
  buildTopicPractice,
  geographyGapAreas,
  geographyPyqYears,
  geographyResources,
  geographyTrendByYear,
  geographyTrendWindows,
  getGeographyPapers,
  practiceLevels,
  trendTypeColors,
} from "@/lib/upsc/optionalGeographyLms";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type LmsTab = "learn" | "pyqs" | "practice" | "maps" | "trends" | "gap" | "reports";

const TABS: Array<{ id: LmsTab; label: string; icon: typeof BookOpen }> = [
  { id: "learn", label: "Learn", icon: PlayCircle },
  { id: "pyqs", label: "PYQs", icon: FileText },
  { id: "practice", label: "Practice", icon: PenLine },
  { id: "maps", label: "Maps & Diagrams", icon: MapIcon },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "gap", label: "Gap", icon: Target },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const ANSWER_BASE = "/upsc/optional-subjects/answer";
const READ_BASE = "/upsc/optional-subjects/read";


export function OptionalSubjectLMS({ title, group }: { title: string; group: string }) {
  const papers = useMemo(() => getGeographyPapers(), []);
  const totalLessons = papers.reduce((sum, p) => sum + p.modules.reduce((s, m) => s + m.lessons.length, 0), 0);

  const [tab, setTab] = useState<LmsTab>("learn");
  const [paperIndex, setPaperIndex] = useState(0);
  const [openModule, setOpenModule] = useState<string | null>(papers[0]?.modules[0]?.id ?? null);
  const [active, setActive] = useState<{ mi: string; li: number } | null>(null);
  const [videoOpen, setVideoOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [pyqPaper, setPyqPaper] = useState<"Paper I" | "Paper II">("Paper I");
  const [openYear, setOpenYear] = useState<number | null>(geographyPyqYears[0]?.year ?? null);
  const [practiceTopic, setPracticeTopic] = useState<string | null>(null);
  const [trendYear, setTrendYear] = useState<number>(geographyTrendByYear[0]?.year ?? 0);
  const trendData = geographyTrendByYear.find((t) => t.year === trendYear)?.distribution ?? [];

  const activePaper = papers[paperIndex];
  const activeModule = activePaper?.modules.find((m) => m.id === active?.mi);
  const activeLesson = active ? activeModule?.lessons[active.li] : undefined;
  const locked = activeLesson ? !activeLesson.free : false;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <header className="sticky top-0 z-30 border-b border-[#dcd5c7] bg-[#fffdf8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/upsc/optional-subjects" aria-label="Back" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#dcd5c7] bg-white text-[#1a3a2a] transition hover:bg-[#f2eadc]">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{group} optional course</p>
                <h1 className="text-lg font-black tracking-tight md:text-xl">{title}</h1>
              </div>
            </div>
            <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">{totalLessons} lessons</span>
          </div>
          <nav className="flex flex-wrap gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${tab === id ? "bg-[#1a3a2a] text-white" : "border border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]"}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-6">


        {tab === "learn" && (
          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            <aside className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-3 shadow-sm lg:max-h-[78vh] lg:overflow-y-auto">
              <div className="mb-2 grid grid-cols-2 gap-1.5">
                {papers.map((p, pi) => (
                  <button key={p.paper} type="button" onClick={() => { setPaperIndex(pi); setOpenModule(p.modules[0]?.id ?? null); }}
                    className={`rounded-md px-2 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${paperIndex === pi ? "bg-[#1a3a2a] text-white" : "border border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]"}`}>
                    {p.paper}
                  </button>
                ))}
              </div>
              <p className="px-2 pb-2 text-[10px] font-bold leading-4 text-[#8a8174]">{activePaper?.subtitle}</p>
              <div className="space-y-1.5">
                {activePaper?.modules.map((mod) => {
                  const isOpen = openModule === mod.id;
                  return (
                    <div key={mod.id} className="rounded-md border border-[#e7e0d2] bg-white">
                      <button type="button" onClick={() => setOpenModule(isOpen ? null : mod.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left">
                        <span className="text-sm font-black leading-5 text-[#13251d]">{mod.title}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[#1d9e75] transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="space-y-1 border-t border-[#eee7dc] p-1.5">
                          {mod.lessons.map((les, li) => {
                            const isActive = active?.mi === mod.id && active?.li === li;
                            return (
                              <div key={les.id} className={`rounded px-2 py-1.5 ${isActive ? "bg-[#1a3a2a]" : "hover:bg-[#f2eadc]"}`}>
                                <div className="flex items-start gap-2">
                                  {les.free ? <PlayCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isActive ? "text-white" : "text-[#1d9e75]"}`} /> : <Lock className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isActive ? "text-white" : "text-[#b0a898]"}`} />}
                                  <span className={`flex-1 text-xs font-bold leading-5 ${isActive ? "text-white" : "text-[#34453b]"}`}>{les.title}</span>
                                </div>
                                <div className="mt-1 flex gap-2 pl-5">
                                  <button type="button" onClick={() => { setActive({ mi: mod.id, li }); setVideoOpen(true); }} className={`text-[10px] font-black uppercase tracking-[0.1em] ${isActive ? "text-[#75ddbc]" : "text-[#1d9e75]"}`}>Watch</button>
                                  <a href={`${READ_BASE}?topic=${encodeURIComponent(les.title)}`} target="_blank" rel="noreferrer" className={`text-[10px] font-black uppercase tracking-[0.1em] ${isActive ? "text-[#75ddbc]" : "text-[#1a3a2a]"}`}>Read</a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            <section className="space-y-4">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
                <button type="button" onClick={() => setVideoOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 p-4">
                  <span className="min-w-0 text-left">
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Now studying · {activePaper?.paper}</span>
                    <span className="mt-1 block truncate text-base font-black tracking-tight">{activeLesson?.title ?? "Select a topic to begin"}</span>
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-[#1d9e75] transition ${videoOpen ? "rotate-180" : ""}`} />
                </button>
                {videoOpen && (
                  <div className="border-t border-[#dcd5c7] p-4">
                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-[#dcd5c7] bg-[#0c1412] text-white">
                      {locked ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Lock className="h-8 w-8 text-[#75ddbc]" />
                          <p className="text-sm font-black">This lesson is locked</p>
                          <Link href="/upsc/pricing" className="mt-1 inline-flex h-9 items-center rounded-md bg-[#1d9e75] px-4 text-xs font-black text-white">Unlock course</Link>
                        </div>
                      ) : activeLesson?.videoUrl ? (
                        <iframe src={activeLesson.videoUrl} title={activeLesson.title} className="h-full w-full" allowFullScreen />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <PlayCircle className="h-10 w-10 text-[#75ddbc]" />
                          <p className="text-sm font-black">Video will appear here</p>
                          <p className="text-xs font-semibold text-white/60">Lecture link to be added for this topic.</p>
                        </div>
                      )}
                    </div>
                    {activeLesson && (
                      <a href={`${READ_BASE}?topic=${encodeURIComponent(activeLesson.title)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.1em] text-[#085041]">
                        <BookOpen className="h-3.5 w-3.5" /> Read full content
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
                <button type="button" onClick={() => setResourcesOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 p-4">
                  <span className="inline-flex items-center gap-2 text-sm font-black"><FileText className="h-4 w-4 text-[#1d9e75]" /> Resources & reading material</span>
                  <ChevronDown className={`h-4 w-4 text-[#1d9e75] transition ${resourcesOpen ? "rotate-180" : ""}`} />
                </button>
                {resourcesOpen && (
                  <div className="space-y-2 border-t border-[#dcd5c7] p-4">
                    {geographyResources.map((res) => (
                      <div key={res.label} className="flex items-center justify-between gap-3 rounded-md border border-[#e7e0d2] bg-white p-3">
                        <span className="text-xs font-bold leading-5 text-[#34453b]">{res.label}</span>
                        <span className="rounded bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">{res.kind}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}


        {tab === "pyqs" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Previous year questions</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Year-wise PYQs — in-page</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">Pick a paper, expand a year, and click any question to open it in a new tab with answer-writing + AI evaluation.</p>
              <div className="mt-3 inline-flex gap-1.5">
                {(["Paper I", "Paper II"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setPyqPaper(p)}
                    className={`rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${pyqPaper === p ? "bg-[#1a3a2a] text-white" : "border border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]"}`}>{p}</button>
                ))}
              </div>
            </div>
            {geographyPyqYears.map((yr) => {
              const group = yr.papers.find((g) => g.paper === pyqPaper);
              const isOpen = openYear === yr.year;
              return (
                <div key={yr.year} className="overflow-hidden rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
                  <button type="button" onClick={() => setOpenYear(isOpen ? null : yr.year)} className="flex w-full items-center justify-between gap-3 p-4">
                    <span className="text-lg font-black tracking-tight">{yr.year} · {pyqPaper}</span>
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">{group?.questions.length ?? 0} Q</span>
                      <ChevronDown className={`h-4 w-4 text-[#1d9e75] transition ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-[#dcd5c7] p-4">
                      {group && group.questions.length > 0 ? group.questions.map((item, qi) => (
                        <a key={item.id} href={`${ANSWER_BASE}?id=${item.id}`} target="_blank" rel="noreferrer"
                          className="flex items-start justify-between gap-3 rounded-md border border-[#e7e0d2] bg-white p-3 transition hover:border-[#1d9e75]">
                          <span className="flex gap-3"><span className="text-xs font-black text-[#1d9e75]">Q{qi + 1}</span><span className="text-sm font-semibold leading-6 text-[#34453b]">{item.text}</span></span>
                          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.1em] text-[#1a3a2a]">Open ↗</span>
                        </a>
                      )) : <p className="text-xs font-semibold text-[#8a8174]">Questions for this paper/year will be added.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "practice" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice · subjective</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Write answers, not MCQs</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">Pick a topic; each opens three levels — Easy, Moderate, and UPSC-like. Attempt one or all; a report is generated and the AI discussion stays with you.</p>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {activePaper?.modules.flatMap((m) => m.lessons).slice(0, 18).map((les) => (
                <button key={les.id} type="button" onClick={() => setPracticeTopic(practiceTopic === les.title ? null : les.title)}
                  className={`rounded-md border p-3 text-left text-sm font-bold leading-5 transition ${practiceTopic === les.title ? "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]" : "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b] hover:border-[#1d9e75]"}`}>
                  {les.title}
                </button>
              ))}
            </div>
            {practiceTopic && (
              <div className="space-y-2 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#085041]">{practiceTopic} — choose a level</p>
                {buildTopicPractice(practiceTopic).map((row, ri) => (
                  <div key={ri} className="flex items-start justify-between gap-3 rounded-md border border-[#cfe5dc] bg-white p-3">
                    <span><span className="rounded bg-[#e7f5ee] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#085041]">{practiceLevels[ri]?.label}</span><span className="mt-1.5 block text-sm font-semibold leading-6 text-[#34453b]">{row.prompt}</span></span>
                    <a href={`${ANSWER_BASE}?text=${encodeURIComponent(row.prompt)}&level=${encodeURIComponent(practiceLevels[ri]?.label ?? "")}`} target="_blank" rel="noreferrer" className="shrink-0 self-center rounded-md bg-[#1a3a2a] px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white">Attempt ↗</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {tab === "maps" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Geography edge</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Maps & Diagrams</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">Map work and diagrams are the highest-scoring edge in Geography optional. This space will hold map practice and topic-wise diagrams (including AI-generated handwritten / 3D diagrams).</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Mapping practice</p>
                <ul className="mt-2 space-y-1.5 text-sm font-semibold leading-6 text-[#34453b]">
                  {["World physical & political marking", "India relief, drainage & climate", "Resource & industrial belts", "Geopolitical hotspots & corridors"].map((t) => (
                    <li key={t} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#1d9e75]" />{t}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] font-semibold text-[#8a8174]">Interactive map drills attach here.</p>
              </div>
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Diagram bank</p>
                <ul className="mt-2 space-y-1.5 text-sm font-semibold leading-6 text-[#34453b]">
                  {["Geomorphic cycle & landforms", "Atmospheric circulation & monsoon", "Ocean currents & salinity", "Settlement & central place models"].map((t) => (
                    <li key={t} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#1d9e75]" />{t}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] font-semibold text-[#8a8174]">AI-generated handwritten / 3D diagrams planned here.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "trends" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Trend analysis</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">How the paper is evolving</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">Click a year to see its question-type mix (direct vs conceptual vs applied).</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {geographyTrendByYear.map((t) => (
                  <button key={t.year} type="button" onClick={() => setTrendYear(t.year)}
                    className={`rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${trendYear === t.year ? "bg-[#1a3a2a] text-white" : "border border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]"}`}>
                    {t.year}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{trendYear} question mix</p>
                <div className="mt-2 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={trendData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3} animationDuration={700}>
                        {trendData.map((d) => <Cell key={d.name} fill={trendTypeColors[d.name] ?? "#1d9e75"} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2">
                {geographyTrendWindows.map((row) => (
                  <div key={row.window} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{row.window}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#34453b]">{row.insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "gap" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Optional gap</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">What UPSC expects vs. your readiness</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">For optional-only learners this is your standalone gap view; it fills as you attempt practice and PYQs.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {geographyGapAreas.map((g) => (
                <div key={g.area} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm">
                  <p className="text-sm font-black tracking-tight text-[#13251d]">{g.area}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">Expectation: {g.expectation}</p>
                  <span className="mt-2 inline-flex rounded bg-[#fff4df] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#6f4a12]">{g.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[["Lessons completed", `0 / ${totalLessons}`], ["Practice answers", "0"], ["PYQs attempted", "0"], ["Last activity", "Not started"]].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                <p className="mt-1 text-2xl font-black">{value}</p>
              </div>
            ))}
            <p className="sm:col-span-2 xl:col-span-4 text-xs font-semibold leading-6 text-[#8a8174]">Every answer you write, evaluation you receive, and PYQ you attempt is captured here and on your Gap & analytics pages.</p>
          </div>
        )}
      </div>

      {doubtOpen ? (
        <div className="fixed bottom-5 right-5 z-40 w-[20rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-[#dcd5c7] bg-[#fffdf8] shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-[#1a3a2a] px-4 py-3 text-white">
            <span className="inline-flex items-center gap-2 text-sm font-black"><Sparkles className="h-4 w-4 text-[#75ddbc]" /> Ask a doubt</span>
            <button type="button" onClick={() => setDoubtOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold leading-5 text-[#5d675f]">Stuck on {activeLesson?.title ?? "a topic"}? Ask and the AI teacher will help.</p>
            <textarea rows={3} placeholder="Type your doubt…" className="mt-2 w-full resize-none rounded-md border border-[#dcd5c7] bg-white p-2 text-sm font-semibold text-[#25382f] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20" />
            <button type="button" className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1d9e75] text-xs font-black uppercase tracking-[0.1em] text-white"><Send className="h-3.5 w-3.5" /> Send to AI teacher</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setDoubtOpen(true)} aria-label="Ask a doubt" className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a2a] text-white shadow-xl transition hover:bg-[#10291d]">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </main>
  );
}
