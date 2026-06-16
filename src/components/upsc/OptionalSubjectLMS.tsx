"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Lock,
  MessageCircle,
  PlayCircle,
  Send,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

import {
  getGeographyOptionalModules,
  geographyPracticeItems,
  geographyPyqYears,
  geographyResources,
} from "@/lib/upsc/optionalGeographyLms";

type LmsTab = "learn" | "pyqs" | "practice" | "reports";

const TABS: Array<{ id: LmsTab; label: string; icon: typeof BookOpenCheck }> = [
  { id: "learn", label: "Learn", icon: PlayCircle },
  { id: "pyqs", label: "PYQs", icon: FileText },
  { id: "practice", label: "Practice", icon: ClipboardCheck },
  { id: "reports", label: "Reports", icon: GraduationCap },
];

export function OptionalSubjectLMS({ title, group }: { title: string; group: string }) {
  const modules = useMemo(() => getGeographyOptionalModules(), []);
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  const [tab, setTab] = useState<LmsTab>("learn");
  const [openModule, setOpenModule] = useState<number | null>(0);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [videoOpen, setVideoOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [openYear, setOpenYear] = useState<number | null>(geographyPyqYears[0]?.year ?? null);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [evalState, setEvalState] = useState<"idle" | "evaluating" | "done">("idle");

  const lesson = modules[activeModule]?.lessons[activeLesson];
  const locked = lesson ? !lesson.free : false;


  const selectLesson = (mi: number, li: number) => {
    setActiveModule(mi);
    setActiveLesson(li);
    setVideoOpen(true);
    setTab("learn");
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadName(file.name);
    setEvalState("idle");
  };

  const runEvaluation = () => {
    setEvalState("evaluating");
    window.setTimeout(() => setEvalState("done"), 1500);
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      {/* ─── Header bar with tabs ─── */}
      <header className="sticky top-0 z-30 border-b border-[#dcd5c7] bg-[#fffdf8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/upsc/optional-subjects"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#dcd5c7] bg-white text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                aria-label="Back to optional catalog"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{group} optional course</p>
                <h1 className="text-lg font-black tracking-tight md:text-xl">{title}</h1>
              </div>
            </div>
            <span className="rounded-md bg-[#e7f5ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
              {totalLessons} lessons
            </span>
          </div>
          <nav className="flex flex-wrap gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                  tab === id
                    ? "bg-[#1a3a2a] text-white"
                    : "border border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-6">


        {/* ─── LEARN TAB ─── */}
        {tab === "learn" && (
          <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
            {/* Curriculum sidebar */}
            <aside className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-3 shadow-sm lg:max-h-[78vh] lg:overflow-y-auto">
              <p className="px-2 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Paper I — Curriculum</p>
              <div className="mt-2 space-y-1.5">
                {modules.map((mod, mi) => {
                  const isOpen = openModule === mi;
                  return (
                    <div key={mod.id} className="rounded-md border border-[#e7e0d2] bg-white">
                      <button
                        type="button"
                        onClick={() => setOpenModule(isOpen ? null : mi)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                      >
                        <span className="text-sm font-black leading-5 text-[#13251d]">{mod.title}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[#1d9e75] transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#eee7dc] p-1.5">
                          {mod.lessons.map((les, li) => {
                            const active = activeModule === mi && activeLesson === li;
                            return (
                              <button
                                key={les.id}
                                type="button"
                                onClick={() => selectLesson(mi, li)}
                                className={`flex w-full items-start gap-2 rounded px-2 py-2 text-left text-xs font-bold leading-5 transition ${
                                  active ? "bg-[#1a3a2a] text-white" : "text-[#34453b] hover:bg-[#f2eadc]"
                                }`}
                              >
                                {les.free ? (
                                  <PlayCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${active ? "text-white" : "text-[#1d9e75]"}`} />
                                ) : (
                                  <Lock className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${active ? "text-white" : "text-[#b0a898]"}`} />
                                )}
                                <span className="flex-1">{les.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>


            {/* Lesson main: video + resources */}
            <section className="space-y-4">
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
                <button
                  type="button"
                  onClick={() => setVideoOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 p-4"
                >
                  <span className="min-w-0 text-left">
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">Now studying</span>
                    <span className="mt-1 block truncate text-base font-black tracking-tight text-[#13251d]">
                      {lesson?.title ?? "Select a topic"}
                    </span>
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
                          <p className="max-w-xs text-xs font-semibold text-white/70">
                            The first {`${2}`} lessons are free. Enrol to unlock the full Geography optional course.
                          </p>
                          <Link href="/upsc/pricing" className="mt-1 inline-flex h-9 items-center rounded-md bg-[#1d9e75] px-4 text-xs font-black text-white">
                            Unlock course
                          </Link>
                        </div>
                      ) : lesson?.videoUrl ? (
                        <iframe src={lesson.videoUrl} title={lesson.title} className="h-full w-full" allowFullScreen />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <PlayCircle className="h-10 w-10 text-[#75ddbc]" />
                          <p className="text-sm font-black">Video will appear here</p>
                          <p className="text-xs font-semibold text-white/60">Lecture link to be added for this topic.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Resources */}
              <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
                <button type="button" onClick={() => setResourcesOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 p-4">
                  <span className="inline-flex items-center gap-2 text-sm font-black tracking-tight text-[#13251d]">
                    <FileText className="h-4 w-4 text-[#1d9e75]" /> Resources & reading material
                  </span>
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
                    <p className="text-[11px] font-semibold leading-5 text-[#8a8174]">Documents attach here as they are uploaded.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}


        {/* ─── PYQ TAB ─── */}
        {tab === "pyqs" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Previous year questions</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Geography optional — year-wise PYQs</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                Browse questions year by year inside the portal. Click a year to expand.
              </p>
            </div>
            {geographyPyqYears.map((row) => {
              const isOpen = openYear === row.year;
              return (
                <div key={row.year} className="overflow-hidden rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenYear(isOpen ? null : row.year)}
                    className="flex w-full items-center justify-between gap-3 p-4"
                  >
                    <span className="text-lg font-black tracking-tight text-[#13251d]">{row.year}</span>
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
                        {row.questions.length} Q
                      </span>
                      <ChevronDown className={`h-4 w-4 text-[#1d9e75] transition ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-[#dcd5c7] p-4">
                      {row.questions.map((q, qi) => (
                        <div key={qi} className="flex gap-3 rounded-md border border-[#e7e0d2] bg-white p-3">
                          <span className="text-xs font-black text-[#1d9e75]">Q{qi + 1}</span>
                          <p className="text-sm font-semibold leading-6 text-[#34453b]">{q}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}


        {/* ─── PRACTICE TAB ─── */}
        {tab === "practice" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice & evaluation</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Practice questions</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                Attempt MCQs and write mains answers. Upload your written answer and the AI evaluates it against the model structure.
              </p>
            </div>
            {geographyPracticeItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded bg-[#e7f5ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">
                    {item.mode === "mcq" ? "MCQ" : "Mains"} · {item.marks} marks
                  </span>
                </div>
                <p className="mt-3 text-sm font-black leading-6 text-[#13251d]">{item.prompt}</p>
                {item.statements && (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-semibold leading-6 text-[#34453b]">
                    {item.statements.map((s, si) => <li key={si}>{s}</li>)}
                  </ol>
                )}
                {item.options && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {item.options.map((opt, oi) => (
                      <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-md border border-[#e7e0d2] bg-white p-3 text-xs font-bold text-[#34453b] hover:border-[#1d9e75]">
                        <input type="radio" name={item.id} className="accent-[#1d9e75]" /> {opt}
                      </label>
                    ))}
                  </div>
                )}
                {item.mode === "mains" && (
                  <div className="mt-4 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#1a3a2a] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white">
                      <UploadCloud className="h-4 w-4" /> Upload written answer
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
                    </label>
                    {uploadName && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-[#085041]">Uploaded: {uploadName}</p>
                        <button
                          type="button"
                          onClick={runEvaluation}
                          disabled={evalState === "evaluating"}
                          className="mt-2 inline-flex h-9 items-center gap-2 rounded-md bg-[#1d9e75] px-4 text-xs font-black text-white disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> {evalState === "evaluating" ? "Evaluating…" : "Evaluate with AI"}
                        </button>
                        {evalState === "done" && (
                          <div className="mt-3 rounded-md border border-[#cfe5dc] bg-white p-3 text-xs font-semibold leading-6 text-[#34453b]">
                            <p className="font-black text-[#085041]">AI evaluation (preview)</p>
                            <p className="mt-1">Structure 7/10 · Content coverage 6/10 · Diagram use: add a labelled monsoon map. Strengthen the El Nino linkage and add a conclusion.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── REPORTS TAB ─── */}
        {tab === "reports" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Lessons completed", `0 / ${totalLessons}`],
              ["Practice attempts", "0"],
              ["Mains answers evaluated", "0"],
              ["Last activity", "Not started"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#13251d]">{value}</p>
              </div>
            ))}
            <p className="sm:col-span-2 xl:col-span-4 text-xs font-semibold leading-6 text-[#8a8174]">
              Your progress, test scores, and evaluated answers will populate here as you move through the course.
            </p>
          </div>
        )}
      </div>


      {/* ─── Floating AI doubt assistant ─── */}
      {doubtOpen ? (
        <div className="fixed bottom-5 right-5 z-40 w-[20rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-[#dcd5c7] bg-[#fffdf8] shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-[#1a3a2a] px-4 py-3 text-white">
            <span className="inline-flex items-center gap-2 text-sm font-black">
              <Sparkles className="h-4 w-4 text-[#75ddbc]" /> Ask a doubt
            </span>
            <button type="button" onClick={() => setDoubtOpen(false)} aria-label="Close doubt assistant">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold leading-5 text-[#5d675f]">
              Stuck on {lesson?.title ?? "a topic"}? Type your doubt and the AI teacher will help.
            </p>
            <textarea
              rows={3}
              placeholder="Type your doubt about this topic…"
              className="mt-2 w-full resize-none rounded-md border border-[#dcd5c7] bg-white p-2 text-sm font-semibold text-[#25382f] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
            />
            <button type="button" className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1d9e75] text-xs font-black uppercase tracking-[0.12em] text-white">
              <Send className="h-3.5 w-3.5" /> Send to AI teacher
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDoubtOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a2a] text-white shadow-xl transition hover:bg-[#10291d]"
          aria-label="Ask a doubt"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </main>
  );
}
