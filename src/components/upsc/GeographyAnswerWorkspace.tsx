"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, MessageCircle, Save, Send, Sparkles, UploadCloud, X } from "lucide-react";

import { answerScaffold, evaluationLevels, getPyqQuestion } from "@/lib/upsc/optionalGeographyLms";

export function GeographyAnswerWorkspace() {
  const params = useSearchParams();
  const id = params.get("id");
  const textParam = params.get("text");
  const level = params.get("level");

  const pyq = id ? getPyqQuestion(id) : null;
  const questionText = pyq?.text ?? textParam ?? "Question not found.";
  const meta = pyq ? `${pyq.year} · ${pyq.paper}` : level ? `Practice · ${level}` : "Practice";

  const [evalId, setEvalId] = useState("medium");
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [evalState, setEvalState] = useState<"idle" | "evaluating" | "done">("idle");
  const [saved, setSaved] = useState(false);
  const [doubtOpen, setDoubtOpen] = useState(false);
  const selectedEval = useMemo(() => evaluationLevels.find((e) => e.id === evalId), [evalId]);

  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setUploadName(file.name); setEvalState("idle"); setSaved(false); }
  };
  const runEval = () => { setEvalState("evaluating"); window.setTimeout(() => setEvalState("done"), 1600); };


  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <Link href="/upsc/optional-subjects/geography" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a]">
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>

        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <span className="rounded bg-[#e7f5ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">{meta}</span>
          <h1 className="mt-3 text-xl font-black leading-7 tracking-tight md:text-2xl">{questionText}</h1>
        </section>

        {/* Answer-planning discussion scaffold */}
        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Plan your answer</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">Note what should go where. The AI discussion will refine your structure, facts, scholars, maps and diagrams.</p>
          <div className="mt-4 space-y-3">
            {answerScaffold.map((part) => (
              <div key={part.part} className="rounded-lg border border-[#e7e0d2] bg-white p-3">
                <p className="text-sm font-black text-[#13251d]">{part.part}</p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-[#8a8174]">{part.hint}</p>
                <textarea rows={2} placeholder={`Your ${part.part.toLowerCase()} points…`} className="mt-2 w-full resize-y rounded-md border border-[#dcd5c7] bg-[#fffdf8] p-2 text-sm font-semibold text-[#25382f] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20" />
              </div>
            ))}
          </div>
        </section>

        {/* Upload + evaluation tier */}
        <section className="mt-4 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">Upload handwritten answer for AI evaluation</p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#1a3a2a] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white">
            <UploadCloud className="h-4 w-4" /> Choose image / PDF
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={onUpload} />
          </label>
          {uploadName && <p className="mt-2 text-xs font-bold text-[#085041]">Uploaded: {uploadName}</p>}

          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#085041]">Evaluation level (consumes credits)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {evaluationLevels.map((lvl) => (
              <label key={lvl.id} className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 transition ${evalId === lvl.id ? "border-[#1d9e75] bg-white" : "border-[#cfe5dc] bg-white/70 hover:border-[#1d9e75]"}`}>
                <input type="radio" name="evalLevel" className="mt-1 accent-[#1d9e75]" checked={evalId === lvl.id} onChange={() => setEvalId(lvl.id)} />
                <span>
                  <span className="flex items-center gap-2 text-sm font-black text-[#13251d]">{lvl.label}<span className="rounded bg-[#fff4df] px-1.5 py-0.5 text-[10px] font-black text-[#6f4a12]">{lvl.credits} credits</span></span>
                  <span className="mt-0.5 block text-[11px] font-semibold leading-5 text-[#5d675f]">{lvl.note}</span>
                </span>
              </label>
            ))}
          </div>

          <button type="button" disabled={!uploadName || evalState === "evaluating"} onClick={runEval} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#1d9e75] px-4 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {evalState === "evaluating" ? "Evaluating…" : `Evaluate (${selectedEval?.credits} credits · ${selectedEval?.model} model)`}
          </button>

          {evalState === "done" && (
            <div className="mt-4 rounded-lg border border-[#cfe5dc] bg-white p-4">
              <p className="text-sm font-black text-[#085041]">AI evaluation — {selectedEval?.label} (preview)</p>
              <ul className="mt-2 space-y-1 text-xs font-semibold leading-6 text-[#34453b]">
                <li>Concept depth: 6/10 — add Airy vs Pratt distinction and one scholar.</li>
                <li>Structure: 7/10 — good sub-headings; tighten the conclusion.</li>
                <li>Maps/Diagrams: missing — add a labelled diagram for +2 marks.</li>
                <li>Language & value-addition: 6/10 — link to a recent example.</li>
              </ul>
              <button type="button" onClick={() => setSaved(true)} className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-xs font-black uppercase tracking-[0.12em] text-white">
                <Save className="h-3.5 w-3.5" /> {saved ? "Saved to profile" : "Save to profile, gap & progress"}
              </button>
              {saved && <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[#085041]"><CheckCircle2 className="h-3.5 w-3.5" /> Recorded in your analytics, gap page and reports.</p>}
            </div>
          )}
        </section>
      </div>

      {doubtOpen ? (
        <div className="fixed bottom-5 right-5 z-40 w-[20rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-[#dcd5c7] bg-[#fffdf8] shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-[#1a3a2a] px-4 py-3 text-white">
            <span className="inline-flex items-center gap-2 text-sm font-black"><Sparkles className="h-4 w-4 text-[#75ddbc]" /> Discuss this question</span>
            <button type="button" onClick={() => setDoubtOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold leading-5 text-[#5d675f]">Ask anything about this question or your evaluation report.</p>
            <textarea rows={3} placeholder="Type your question…" className="mt-2 w-full resize-none rounded-md border border-[#dcd5c7] bg-white p-2 text-sm font-semibold text-[#25382f] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20" />
            <button type="button" className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1d9e75] text-xs font-black uppercase tracking-[0.1em] text-white"><Send className="h-3.5 w-3.5" /> Send</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setDoubtOpen(true)} aria-label="Discuss" className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a2a] text-white shadow-xl transition hover:bg-[#10291d]">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </main>
  );
}
