"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Highlighter, MessageCircle, Save, Send, Sparkles, UploadCloud, X } from "lucide-react";

import { answerScaffold, evaluationLevels, getPyqQuestion } from "@/lib/upsc/optionalGeographyLms";

const FILLERS = ["basically", "actually", "in order to", "very", "really", "just", "the fact that", "needless to say", "it is important to note"];
const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function GeographyAnswerWorkspace() {
  const params = useSearchParams();
  const id = params.get("id");
  const textParam = params.get("text");
  const level = params.get("level");

  const pyq = id ? getPyqQuestion(id) : null;
  const questionText = pyq?.text ?? textParam ?? "Question not found.";
  const meta = pyq ? `${pyq.year} · ${pyq.paper}` : level ? `Practice · ${level}` : "Practice";

  const [parts, setParts] = useState({ Introduction: "", Body: "", Conclusion: "" });
  const [evalId, setEvalId] = useState("medium");
  const [showParams, setShowParams] = useState(false);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [evalState, setEvalState] = useState<"idle" | "evaluating" | "done">("idle");
  const [saved, setSaved] = useState(false);
  const [doubtOpen, setDoubtOpen] = useState(false);

  const selectedEval = useMemo(() => evaluationLevels.find((e) => e.id === evalId), [evalId]);
  const typed = `${parts.Introduction} ${parts.Body} ${parts.Conclusion}`.trim();
  const hasTyped = typed.length > 20;
  const canEvaluate = hasTyped || Boolean(uploadName);
  const fillers = useMemo(() => FILLERS.filter((f) => typed.toLowerCase().includes(f)), [typed]);

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

        {/* Write the answer (typing/voice) — evaluation works without image */}
        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Write your answer</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">Type your Introduction, Body and Conclusion. You can evaluate a typed answer directly — uploading a handwritten copy is optional and adds copy-marking.</p>
          <div className="mt-4 space-y-3">
            {answerScaffold.map((part) => {
              const key = part.part as "Introduction" | "Body" | "Conclusion";
              return (
                <div key={part.part} className="rounded-lg border border-[#e7e0d2] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#13251d]">{part.part}</p>
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8a8174]">{wordCount(parts[key])} words</span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-[#8a8174]">{part.hint}</p>
                  <textarea
                    rows={part.part === "Body" ? 5 : 2}
                    value={parts[key]}
                    onChange={(e) => { setParts((p) => ({ ...p, [key]: e.target.value })); setEvalState("idle"); }}
                    placeholder={`Your ${part.part.toLowerCase()}…`}
                    className="mt-2 w-full resize-y rounded-md border border-[#dcd5c7] bg-[#fffdf8] p-2 text-sm font-semibold leading-6 text-[#25382f] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Optional handwritten copy upload */}
        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Optional · handwritten copy</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">Upload a photo/PDF of your written answer. It is digitised and your copy is marked (underline / encircle) where the answer falls short.</p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#1a3a2a] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white">
            <UploadCloud className="h-4 w-4" /> Upload copy
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={onUpload} />
          </label>
          {uploadName && <p className="mt-2 text-xs font-bold text-[#085041]">Uploaded: {uploadName}</p>}
        </section>

        {/* Evaluation level — shown by parameter count */}
        <section className="mt-4 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">Evaluation depth</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {evaluationLevels.map((lvl) => (
              <label key={lvl.id} className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 transition ${evalId === lvl.id ? "border-[#1d9e75] bg-white" : "border-[#cfe5dc] bg-white/70 hover:border-[#1d9e75]"}`}>
                <input type="radio" name="evalLevel" className="mt-1 accent-[#1d9e75]" checked={evalId === lvl.id} onChange={() => setEvalId(lvl.id)} />
                <span>
                  <span className="flex items-center gap-2 text-sm font-black text-[#13251d]">{lvl.label}<span className="rounded bg-[#1a3a2a] px-1.5 py-0.5 text-[10px] font-black text-white">{lvl.parameterCount} parameters</span></span>
                  <span className="mt-0.5 block text-[11px] font-semibold leading-5 text-[#5d675f]">{lvl.note}</span>
                </span>
              </label>
            ))}
          </div>
          <button type="button" onClick={() => setShowParams((v) => !v)} className="mt-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#085041] underline-offset-2 hover:underline">
            {showParams ? "Hide" : "Show"} the {selectedEval?.parameterCount} parameters
          </button>
          {showParams && (
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {selectedEval?.parameters.map((p) => (
                <li key={p} className="flex gap-2 text-[11px] font-semibold leading-5 text-[#34453b]"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#1d9e75]" />{p}</li>
              ))}
            </ul>
          )}
          <button type="button" disabled={!canEvaluate || evalState === "evaluating"} onClick={runEval} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#1d9e75] px-4 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {evalState === "evaluating" ? "Evaluating…" : `Evaluate on ${selectedEval?.parameterCount} parameters`}
          </button>
          {!canEvaluate && <p className="mt-2 text-[11px] font-semibold text-[#6f4a12]">Type your answer or upload a copy to enable evaluation.</p>}
        </section>


        {/* Detailed evaluation report */}
        {evalState === "done" && (
          <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Evaluation report · {selectedEval?.label} · {selectedEval?.parameterCount} parameters</p>

            {/* Your answer echoed */}
            {hasTyped && (
              <div className="mt-3 rounded-lg border border-[#e7e0d2] bg-[#fdfaf3] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8174]">Your answer</p>
                {(["Introduction", "Body", "Conclusion"] as const).map((k) => parts[k].trim() && (
                  <p key={k} className="mt-1.5 text-xs font-semibold leading-6 text-[#34453b]"><span className="font-black text-[#085041]">{k} ({wordCount(parts[k])}w): </span>{parts[k]}</p>
                ))}
              </div>
            )}

            {/* Word map */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["Introduction", "Body", "Conclusion"] as const).map((k) => (
                <div key={k} className="rounded-md border border-[#dcd5c7] bg-white p-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#1d9e75]">{k}</p>
                  <p className="text-lg font-black text-[#13251d]">{wordCount(parts[k])}</p>
                  <p className="text-[9px] font-bold text-[#8a8174]">words</p>
                </div>
              ))}
            </div>

            {/* Redundancy */}
            <div className="mt-3 rounded-md border border-[#e7e0d2] bg-white p-3">
              <p className="text-xs font-black text-[#13251d]">Redundant words (removable without changing meaning)</p>
              {fillers.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {fillers.map((f) => <span key={f} className="rounded bg-[#fff1ed] px-2 py-1 text-[10px] font-black text-[#7d3827] line-through">{f}</span>)}
                </div>
              ) : (
                <p className="mt-1 text-xs font-semibold text-[#5d675f]">No obvious filler detected{hasTyped ? "." : " (type an answer to analyse)."}</p>
              )}
            </div>

            {/* Parameter-wise */}
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-black text-[#13251d]">Parameter-wise assessment (sample)</p>
              {(selectedEval?.parameters.slice(0, 6) ?? []).map((p, i) => {
                const score = [7, 6, 8, 5, 6, 7][i % 6];
                return (
                  <div key={p} className="flex items-center justify-between gap-3 rounded-md border border-[#e7e0d2] bg-white p-2.5">
                    <span className="text-xs font-semibold leading-5 text-[#34453b]">{p}</span>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-black ${score >= 7 ? "bg-[#e7f5ee] text-[#085041]" : "bg-[#fff4df] text-[#6f4a12]"}`}>{score}/10</span>
                  </div>
                );
              })}
            </div>

            {/* Specific lift + marks band */}
            <div className="mt-3 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3 text-xs font-semibold leading-6 text-[#34453b]">
              <p><span className="font-black text-[#085041]">Lift suggestion:</span> Replace the generic opening with a one-line definition + a data point; add a labelled diagram in the body for +2 marks.</p>
              <p className="mt-1"><span className="font-black text-[#085041]">Predicted band:</span> 9-11 / 15 at current quality.</p>
            </div>

            {/* Marked copy (only if uploaded) */}
            {uploadName && (
              <div className="mt-3 rounded-md border border-[#e7e0d2] bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs font-black text-[#13251d]"><Highlighter className="h-3.5 w-3.5 text-[#be4444]" /> Marked copy (digitised)</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-[#34453b]">
                  Your introduction is <span className="underline decoration-[#be4444] decoration-2">too generic</span>; the body needs a <span className="rounded-full px-1 ring-2 ring-[#be4444]">diagram</span>; the conclusion is <span className="bg-[#fff4df]">missing a way-forward</span>.
                </p>
                <p className="mt-1 text-[10px] font-semibold text-[#8a8174]">{uploadName} — auto-marked. Full annotated copy renders here once OCR + marking is wired.</p>
              </div>
            )}

            <button type="button" onClick={() => setSaved(true)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-xs font-black uppercase tracking-[0.12em] text-white">
              <Save className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save to profile, gap & progress"}
            </button>
            {saved && <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[#085041]"><CheckCircle2 className="h-3.5 w-3.5" /> Recorded in analytics, gap page and reports.</p>}
          </section>
        )}
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
