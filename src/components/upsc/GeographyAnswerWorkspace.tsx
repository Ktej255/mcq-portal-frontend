"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronDown, Highlighter, Lightbulb, MessageCircle, Save, Send, Sparkles, UploadCloud, X } from "lucide-react";

import { answerScaffold, evaluationLevels } from "@/lib/upsc/optionalGeographyLms";
import { getSubjectPyqQuestion } from "@/lib/upsc/optionalSubjectStandards";
import { buildAnswerFramework, type EvaluationResult } from "@/lib/upsc/optionalEvaluation";
import { evaluateOptionalAnswer } from "@/services/optionalEvaluationService";
import { digitiseAnswerImage, fileToBase64 } from "@/services/optionalOcrService";
import { askOptionalDoubt } from "@/services/optionalDiscussService";
import { practiceRefId, recordOptionalAttempt } from "@/lib/upsc/optionalProgress";

const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function GeographyAnswerWorkspace() {
  const params = useSearchParams();
  const id = params.get("id");
  const textParam = params.get("text");
  const level = params.get("level");
  const subject = params.get("subject") ?? "geography";

  const pyq = id ? getSubjectPyqQuestion(subject, id) : null;
  const questionText = pyq?.text ?? textParam ?? "Question not found.";
  const meta = pyq ? `${pyq.year} - ${pyq.paper}` : level ? `Practice - ${level}` : "Practice";

  const [parts, setParts] = useState({ Introduction: "", Body: "", Conclusion: "" });
  const [evalId, setEvalId] = useState("medium");
  const [showParams, setShowParams] = useState(false);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [evalState, setEvalState] = useState<"idle" | "evaluating" | "done">("idle");
  const [evalSource, setEvalSource] = useState<"typed" | "pdf" | null>(null);
  const [saved, setSaved] = useState(false);
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [doubtInput, setDoubtInput] = useState("");
  const [doubtReply, setDoubtReply] = useState<string | null>(null);
  const [doubtSending, setDoubtSending] = useState(false);
  const [showFramework, setShowFramework] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [report, setReport] = useState<EvaluationResult | null>(null);
  const [discussPrompt, setDiscussPrompt] = useState(false);

  const selectedEval = useMemo(() => evaluationLevels.find((e) => e.id === evalId), [evalId]);
  const expectedWords = (level ?? "").toLowerCase().includes("easy") ? 150 : 250;
  const typed = `${parts.Introduction} ${parts.Body} ${parts.Conclusion}`.trim();
  const hasTyped = typed.length > 20;
  const framework = useMemo(() => buildAnswerFramework(questionText), [questionText]);

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadName(file.name);
    setEvalState("idle");
    setSaved(false);
    try {
      setUploadData(await fileToBase64(file));
    } catch {
      setUploadData(null);
    }
  };
  const runEval = async (source: "typed" | "pdf") => {
    setEvalSource(source);
    setEvalState("evaluating");
    setSaved(false);
    setReport(null);
    if (source === "typed") {
      const result = await evaluateOptionalAnswer({ subject, question: questionText, parts, parameters: selectedEval?.parameters ?? [], expectedWords });
      setReport(result);
    } else {
      const ocr = uploadData ? await digitiseAnswerImage(uploadData.base64, uploadData.mimeType) : { text: null, live: false };
      if (ocr.text) {
        const result = await evaluateOptionalAnswer({ subject, question: questionText, parts: { Introduction: "", Body: ocr.text, Conclusion: "" }, parameters: selectedEval?.parameters ?? [], expectedWords });
        setReport(result);
      }
    }
    setEvalState("done");
    setDiscussPrompt(true);
  };

  const handleSave = () => {
    recordOptionalAttempt(subject, {
      refId: id ?? practiceRefId(textParam ?? questionText),
      kind: id ? "pyq" : "practice",
      title: questionText,
      level: `${selectedEval?.label ?? "Medium"}${level ? ` - ${level}` : ""}`,
      score: report?.overall ?? 0,
      status: report?.status ?? (evalSource === "pdf" ? "uploaded" : "saved"),
      at: Date.now(),
    });
    setSaved(true);
  };

  const sendDoubt = async () => {
    if (!doubtInput.trim()) return;
    setDoubtSending(true);
    const ctx = `Question: ${questionText}. ${report ? `Report verdict: ${report.verdict} (overall ${report.overall}/100).` : ""}`;
    const { reply } = await askOptionalDoubt({ subject, context: ctx, message: doubtInput });
    setDoubtReply(reply);
    setDoubtSending(false);
  };


  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <Link href={`/upsc/optional-subjects/${subject}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a]">
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>

        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <span className="rounded bg-[#e7f5ee] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">{meta}</span>
          <h1 className="mt-3 text-xl font-black leading-7 tracking-tight md:text-2xl">{questionText}</h1>
        </section>

        {/* Model-answer framework - how to structure THIS question */}
        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
          <button type="button" onClick={() => setShowFramework((v) => !v)} className="flex w-full items-center justify-between gap-3 p-4">
            <span className="inline-flex items-center gap-2 text-sm font-black"><Lightbulb className="h-4 w-4 text-[#1d9e75]" /> Model-answer framework</span>
            <ChevronDown className={`h-4 w-4 text-[#1d9e75] transition ${showFramework ? "rotate-180" : ""}`} />
          </button>
          {showFramework && (
            <div className="space-y-2 border-t border-[#dcd5c7] p-4 text-xs font-semibold leading-6 text-[#34453b]">
              <p><span className="font-black uppercase tracking-[0.1em] text-[#085041]">Directive:</span> {framework.directive}</p>
              <p><span className="font-black text-[#085041]">Introduction -</span> {framework.intro}</p>
              <div>
                <p className="font-black text-[#085041]">Body -</p>
                <ul className="mt-1 space-y-1">
                  {framework.body.map((b, i) => (
                    <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#1d9e75]" />{b}</li>
                  ))}
                </ul>
              </div>
              <p><span className="font-black text-[#085041]">Conclusion -</span> {framework.conclusion}</p>
              {framework.keywords.length > 0 && (
                <p className="flex flex-wrap items-center gap-1.5"><span className="font-black text-[#085041]">Must-hit keywords:</span>{framework.keywords.map((k) => <span key={k} className="rounded bg-[#e7f5ee] px-1.5 py-0.5 text-[10px] font-bold text-[#085041]">{k}</span>)}</p>
              )}
            </div>
          )}
        </section>

        {/* Evaluation depth - shared selector (parameters, not credits/model) */}
        <section className="mt-4 rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">Evaluation depth</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">Pick how deep the AI checks your answer. This applies to whichever you evaluate below.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
        </section>

        {/* Write your answer (typed/spoken) + its OWN evaluate button */}
        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Write your answer</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">Type your Introduction, Body and Conclusion, then evaluate this written answer.</p>
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
                    onChange={(e) => { setParts((p) => ({ ...p, [key]: e.target.value })); if (evalSource === "typed") setEvalState("idle"); }}
                    placeholder={`Your ${part.part.toLowerCase()}...`}
                    className="mt-2 w-full resize-y rounded-md border border-[#dcd5c7] bg-[#fffdf8] p-2 text-sm font-semibold leading-6 text-[#25382f] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col items-center">
            <button type="button" disabled={!hasTyped || evalState === "evaluating"} onClick={() => runEval("typed")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-8 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#168864] disabled:cursor-not-allowed disabled:opacity-50">
              <Sparkles className="h-4 w-4" /> {evalState === "evaluating" && evalSource === "typed" ? "Evaluating..." : "Evaluate"}
            </button>
            {!hasTyped && <p className="mt-2 text-[11px] font-semibold text-[#8a8174]">Type your answer above to evaluate.</p>}
          </div>
        </section>


        {/* Upload handwritten copy + its OWN evaluate button */}
        <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Or upload a handwritten copy</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#5d675f]">Upload a photo/PDF of your written answer. It is digitised and your copy is marked (underline / encircle) where it falls short - then evaluate just the copy.</p>
          <div className="mt-3 flex flex-col items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a] transition hover:bg-[#f2eadc]">
              <UploadCloud className="h-4 w-4" /> {uploadName ? "Change file" : "Upload PDF / image"}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={onUpload} />
            </label>
            {uploadName && <p className="text-xs font-bold text-[#085041]">Uploaded: {uploadName}</p>}
            <button type="button" disabled={!uploadName || evalState === "evaluating"} onClick={() => runEval("pdf")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1d9e75] px-8 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#168864] disabled:cursor-not-allowed disabled:opacity-50">
              <Sparkles className="h-4 w-4" /> {evalState === "evaluating" && evalSource === "pdf" ? "Evaluating..." : "Evaluate"}
            </button>
            {!uploadName && <p className="text-[11px] font-semibold text-[#8a8174]">Upload a copy to evaluate it.</p>}
          </div>
        </section>


        {/* Report - reflects whichever source was evaluated */}
        {evalState === "done" && (
          <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Evaluation report - {selectedEval?.label} - {selectedEval?.parameterCount} parameters - {evalSource === "pdf" ? "uploaded copy" : "typed answer"}
            </p>

            {evalSource === "pdf" ? (
              <div className="mt-3 rounded-md border border-[#e7e0d2] bg-white p-3">
                <p className="inline-flex items-center gap-2 text-xs font-black text-[#13251d]"><Highlighter className="h-3.5 w-3.5 text-[#be4444]" /> Uploaded copy - OCR pending</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-[#34453b]">Content-aware scoring of a handwritten copy needs OCR (digitising your writing), which connects to the backend. Until then, use the <span className="font-black">typed answer</span> above for a real, parameter-wise evaluation.</p>
                <p className="mt-1 text-[10px] font-semibold text-[#8a8174]">{uploadName} - queued for OCR + copy-marking.</p>
              </div>
            ) : report ? (
              <>
                {/* Verdict banner - colour reflects real status */}
                <div className={`mt-3 rounded-lg border p-3 ${report.status === "strong" || report.status === "ontrack" ? "border-[#b9d9cd] bg-[#e7f5ee]" : report.status === "weak" ? "border-[#ef9f27]/50 bg-[#fff4df]" : "border-[#f0c5b8] bg-[#fff1ed]"}`}>
                  <p className={`text-sm font-black leading-6 ${report.status === "strong" || report.status === "ontrack" ? "text-[#085041]" : report.status === "weak" ? "text-[#6f4a12]" : "text-[#7d3827]"}`}>{report.verdict}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.1em]">
                    <span className="rounded bg-white px-2 py-1 text-[#13251d]">Overall {report.overall}/100</span>
                    <span className="rounded bg-white px-2 py-1 text-[#13251d]">Question relevance {report.relevance}%</span>
                    <span className="rounded bg-white px-2 py-1 text-[#13251d]">Band {report.marksBand}</span>
                  </div>
                </div>

                {/* Word stats */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[["Intro", report.wordStats.intro], ["Body", report.wordStats.body], ["Concl.", report.wordStats.conclusion], ["Total", report.wordStats.total]].map(([k, v]) => (
                    <div key={String(k)} className="rounded-md border border-[#dcd5c7] bg-white p-2 text-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#1d9e75]">{k}</p>
                      <p className="text-lg font-black text-[#13251d]">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[10px] font-bold text-[#8a8174]">Expected ~{report.wordStats.expected} words.</p>

                {/* Keyword coverage - proves it read your content */}
                <div className="mt-3 rounded-md border border-[#e7e0d2] bg-white p-3">
                  <p className="text-xs font-black text-[#13251d]">Question coverage</p>
                  {report.matchedKeywords.length > 0 && (
                    <div className="mt-1.5"><span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#085041]">Addressed: </span>{report.matchedKeywords.map((k) => <span key={k} className="mr-1 inline-block rounded bg-[#e7f5ee] px-1.5 py-0.5 text-[10px] font-bold text-[#085041]">{k}</span>)}</div>
                  )}
                  {report.missingKeywords.length > 0 && (
                    <div className="mt-1.5"><span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7d3827]">Missing from your answer: </span>{report.missingKeywords.map((k) => <span key={k} className="mr-1 inline-block rounded bg-[#fff1ed] px-1.5 py-0.5 text-[10px] font-bold text-[#7d3827]">{k}</span>)}</div>
                  )}
                  {report.redundant.length > 0 && (
                    <div className="mt-1.5"><span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8a8174]">Redundant (removable): </span>{report.redundant.map((f) => <span key={f} className="mr-1 inline-block rounded bg-[#f7f4ee] px-1.5 py-0.5 text-[10px] font-bold text-[#8a8174] line-through">{f}</span>)}</div>
                  )}
                </div>

                {/* Parameter-wise - REAL per-parameter scores + feedback */}
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-black text-[#13251d]">Parameter-wise assessment ({report.params.length} checked)</p>
                  {report.params.map((p) => (
                    <div key={p.label} className="rounded-md border border-[#e7e0d2] bg-white p-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black leading-5 text-[#34453b]">{p.label}</span>
                        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-black ${p.score >= 7 ? "bg-[#e7f5ee] text-[#085041]" : p.score >= 4 ? "bg-[#fff4df] text-[#6f4a12]" : "bg-[#fff1ed] text-[#7d3827]"}`}>{p.score}/{p.max}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-[#66736b]">{p.feedback}</p>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={handleSave} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-xs font-black uppercase tracking-[0.12em] text-white">
                  <Save className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save to profile, gap & progress"}
                </button>
                {saved && <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[#085041]"><CheckCircle2 className="h-3.5 w-3.5" /> Recorded in analytics, gap page and reports.</p>}
              </>
            ) : null}
          </section>
        )}

        {(hasTyped || evalState === "done") && (
          <section className="mt-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] shadow-sm">
            <button type="button" onClick={() => setShowCompare((v) => !v)} className="flex w-full items-center justify-between gap-3 p-4">
              <span className="inline-flex items-center gap-2 text-sm font-black"><Sparkles className="h-4 w-4 text-[#1d9e75]" /> Compare: your answer vs UPSC demand vs topper</span>
              <ChevronDown className={`h-4 w-4 text-[#1d9e75] transition ${showCompare ? "rotate-180" : ""}`} />
            </button>
            {showCompare && (
              <div className="grid gap-3 border-t border-[#dcd5c7] p-4 md:grid-cols-3">
                <div className="rounded-md border border-[#e7e0d2] bg-[#fdfaf3] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">Your answer</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#34453b]">{wordCount(typed)} words - Intro {wordCount(parts.Introduction)} / Body {wordCount(parts.Body)} / Concl {wordCount(parts.Conclusion)}.</p>
                </div>
                <div className="rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#085041]">UPSC demands</p>
                  <ul className="mt-1 space-y-1">{framework.body.map((b, i) => <li key={i} className="text-xs font-semibold leading-5 text-[#34453b]">- {b}</li>)}</ul>
                </div>
                <div className="rounded-md border border-[#e7e0d2] bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f4a12]">Topper approach</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#34453b]">Definition-led intro, multi-dimensional body with a labelled diagram + scholar, forward-looking conclusion. Verified topper copies will be ingested here for true side-by-side comparison.</p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {discussPrompt && !doubtOpen && (
        <div className="fixed bottom-24 right-5 z-40 w-[18rem] max-w-[calc(100vw-2.5rem)] rounded-xl border border-[#1d9e75] bg-[#fffdf8] p-3 shadow-2xl">
          <p className="text-xs font-black text-[#13251d]">Your report is ready.</p>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-[#5d675f]">Want to discuss what it means and how to improve your score?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => { setDoubtOpen(true); setDiscussPrompt(false); }} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-[#1a3a2a] text-[10px] font-black uppercase tracking-[0.1em] text-white"><Sparkles className="h-3 w-3" /> Discuss report</button>
            <button type="button" onClick={() => setDiscussPrompt(false)} className="inline-flex h-8 items-center justify-center rounded-md border border-[#dcd5c7] px-2 text-[10px] font-black uppercase text-[#5d675f]">Later</button>
          </div>
        </div>
      )}

      {doubtOpen ? (
        <div className="fixed bottom-5 right-5 z-40 w-[20rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl border border-[#dcd5c7] bg-[#fffdf8] shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-[#1a3a2a] px-4 py-3 text-white">
            <span className="inline-flex items-center gap-2 text-sm font-black"><Sparkles className="h-4 w-4 text-[#75ddbc]" /> Discuss this question</span>
            <button type="button" onClick={() => setDoubtOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold leading-5 text-[#5d675f]">Ask anything about this question or your evaluation report.</p>
            {doubtReply && <div className="mt-2 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] p-2 text-xs font-semibold leading-5 text-[#34453b]">{doubtReply}</div>}
            <textarea value={doubtInput} onChange={(e) => setDoubtInput(e.target.value)} rows={3} placeholder="Type your question..." className="mt-2 w-full resize-none rounded-md border border-[#dcd5c7] bg-white p-2 text-sm font-semibold text-[#25382f] outline-none focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20" />
            <button type="button" onClick={sendDoubt} disabled={doubtSending || !doubtInput.trim()} className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#1d9e75] text-xs font-black uppercase tracking-[0.1em] text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" /> {doubtSending ? "Sending..." : "Send"}</button>
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
