// Content-aware evaluation engine for Geography optional answers.
// This is a deterministic heuristic that ACTUALLY analyses the written answer
// against the question (relevance, structure, coverage, diagrams, examples,
// scholars, recency, redundancy, word limit). It is designed so a real LLM
// (Gemini) evaluation can replace `scoreAnswer` later behind the same shape.

const STOP = new Set([
  "the","a","an","of","in","to","and","or","is","are","was","were","with","for","on","by","as","at","its","be",
  "that","this","which","from","into","it","their","there","also","such","has","have","had","will","would","can",
  "discuss","examine","critically","analyse","analyze","explain","bring","out","comment","elaborate","describe",
  "relevance","context","present","day","role","concept","view","views","reference","account","light","following",
]);

const DIRECTIVES = ["critically examine", "critically analyse", "critically analyze", "discuss", "examine", "analyse", "analyze", "explain", "comment", "elaborate", "evaluate", "bring out", "describe"];

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z-]+/g) ?? []);
}
function contentWords(text: string): string[] {
  return tokens(text).filter((w) => w.length > 3 && !STOP.has(w));
}
function has(text: string, re: RegExp): boolean {
  return re.test(text);
}

export type ParamResult = { label: string; score: number; max: 10; feedback: string };
export type EvaluationResult = {
  status: "invalid" | "offtopic" | "weak" | "ontrack" | "strong";
  verdict: string;
  overall: number; // 0-100
  relevance: number; // 0-100
  marksBand: string;
  wordStats: { intro: number; body: number; conclusion: number; total: number; expected: number };
  matchedKeywords: string[];
  missingKeywords: string[];
  redundant: string[];
  params: ParamResult[];
};

const FILLERS = ["basically", "actually", "in order to", "very ", "really ", " just ", "the fact that", "needless to say", "it is important to note"];


const wc = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function evaluateAnswer(input: {
  question: string;
  parts: { Introduction: string; Body: string; Conclusion: string };
  parameters: string[];
  expectedWords: number;
}): EvaluationResult {
  const { question, parts, parameters, expectedWords } = input;
  const answer = `${parts.Introduction} ${parts.Body} ${parts.Conclusion}`.trim();
  const lower = answer.toLowerCase();
  const intro = wc(parts.Introduction), body = wc(parts.Body), conclusion = wc(parts.Conclusion);
  const total = wc(answer);

  const qKeywords = Array.from(new Set(contentWords(question)));
  const aSet = new Set(tokens(answer));
  const matched = qKeywords.filter((k) => aSet.has(k));
  const missing = qKeywords.filter((k) => !aSet.has(k));
  const relevance = qKeywords.length ? Math.round((matched.length / qKeywords.length) * 100) : 0;

  const sig = {
    structure: (parts.Introduction.trim() ? 1 : 0) + (parts.Body.trim() ? 1 : 0) + (parts.Conclusion.trim() ? 1 : 0),
    diagram: has(lower, /\b(diagram|figure|map|sketch|flow ?chart|schematic|fig\.)\b/),
    example: has(lower, /\b(example|e\.g\.|for instance|case study|such as|like )\b/),
    scholar: has(answer, /\b(model|theory|hypothesis|law|scholar|according to)\b/i) || /[A-Z][a-z]+['’]s\b/.test(answer),
    recency: has(lower, /\b(20\d\d|recent|current|nowadays|climate change|today)\b/),
    directive: DIRECTIVES.find((d) => question.toLowerCase().includes(d)) ?? "discuss",
  };
  const fillers = FILLERS.filter((f) => lower.includes(f)).map((f) => f.trim());

  // ── verdict gates ──
  let status: EvaluationResult["status"] = "ontrack";
  let verdict = "On track — a genuine attempt that addresses the question.";
  if (total < 15) { status = "invalid"; verdict = `Not a valid attempt — only ${total} words. Write a real answer (~${expectedWords} words) to be evaluated.`; }
  else if (relevance < 15) { status = "offtopic"; verdict = "Off-topic — your answer barely uses the question's key terms. Re-read the demand and address it directly."; }
  else if (relevance < 35 || total < expectedWords * 0.4) { status = "weak"; verdict = "Weak attempt — partially relevant but thin on the question's core demand."; }

  const params = scoreParameters(parameters, { sig, relevance, total, expectedWords, intro, body, conclusion, fillers, status });
  const overall = status === "invalid" ? Math.min(15, total * 1)
    : Math.round(params.reduce((s, p) => s + p.score, 0) / (params.length || 1) * 10);
  if (status === "ontrack" && overall >= 70) status = "strong";

  const marksFor = (max: number) => `${Math.max(0, Math.round((overall / 100) * max) - (overall < 50 ? 1 : 0))}-${Math.round((overall / 100) * max) + 1} / ${max}`;

  return {
    status, verdict, overall, relevance,
    marksBand: marksFor(expectedWords >= 250 ? 15 : 10),
    wordStats: { intro, body, conclusion, total, expected: expectedWords },
    matchedKeywords: matched.slice(0, 12),
    missingKeywords: missing.slice(0, 12),
    redundant: fillers,
    params,
  };
}


type ScoreCtx = {
  sig: { structure: number; diagram: boolean; example: boolean; scholar: boolean; recency: boolean; directive: string };
  relevance: number; total: number; expectedWords: number; intro: number; body: number; conclusion: number;
  fillers: string[]; status: EvaluationResult["status"];
};

function clamp(n: number) { return Math.max(0, Math.min(10, Math.round(n))); }

function scoreParameters(parameters: string[], c: ScoreCtx): ParamResult[] {
  const relScore = clamp(c.relevance / 10);
  const wordRatio = c.expectedWords ? c.total / c.expectedWords : 1;
  const wordScore = clamp(wordRatio >= 0.8 && wordRatio <= 1.4 ? 9 : wordRatio < 0.8 ? wordRatio * 9 : 7);
  const structScore = clamp(c.sig.structure * 3 + (c.body > c.intro ? 1 : 0));

  return parameters.map((label): ParamResult => {
    const l = label.toLowerCase();
    if (c.status === "invalid") return { label, score: 1, max: 10, feedback: "Too little content to assess this parameter." };

    if (l.includes("structure")) return { label, score: structScore, max: 10, feedback: c.sig.structure < 3 ? `Missing ${3 - c.sig.structure} of intro/body/conclusion.` : "All three sections present." };
    if (l.includes("word limit") || l.includes("time-pressure")) return { label, score: wordScore, max: 10, feedback: `${c.total} words vs ~${c.expectedWords} expected.` };
    if (l.includes("keyword") || l.includes("coverage") || l.includes("concept") || l.includes("answer-to-demand") || l.includes("directive") || l.includes("precision"))
      return { label, score: relScore, max: 10, feedback: `Question-term coverage ${c.relevance}%. ${c.relevance < 40 ? "Address more of the question's core terms." : "Good alignment to the demand."}` };
    if (l.includes("diagram") || l.includes("map")) return { label, score: c.sig.diagram ? 8 : 2, max: 10, feedback: c.sig.diagram ? "Diagram/map referenced — good." : "No diagram/map keyword found. Add a labelled diagram for marks." };
    if (l.includes("example") || l.includes("case")) return { label, score: c.sig.example ? 8 : 3, max: 10, feedback: c.sig.example ? "Example/case present." : "Add an example or case study." };
    if (l.includes("scholar") || l.includes("citation") || l.includes("model") || l.includes("linkage") || l.includes("inter-link")) return { label, score: c.sig.scholar ? 8 : 3, max: 10, feedback: c.sig.scholar ? "Model/scholar referenced." : "Cite a model, theory or scholar." };
    if (l.includes("current") || l.includes("recency") || l.includes("data") || l.includes("value-addition") || l.includes("way-forward")) return { label, score: c.sig.recency ? 7 : 3, max: 10, feedback: c.sig.recency ? "Contemporary linkage present." : "Link a recent example / data point." };
    if (l.includes("redundant") || l.includes("language") || l.includes("coherence") || l.includes("flow")) return { label, score: clamp(8 - c.fillers.length * 2), max: 10, feedback: c.fillers.length ? `Remove filler: ${c.fillers.join(", ")}.` : "Concise — no obvious filler." };
    if (l.includes("legibility")) return { label, score: 8, max: 10, feedback: "Typed answer is fully legible (handwriting checked on uploaded copies)." };
    if (l.includes("balance") || l.includes("empathy") || l.includes("lift")) return { label, score: clamp((relScore + structScore) / 2), max: 10, feedback: "Balance derived from relevance + structure." };
    if (l.includes("predicted score") || l.includes("marks")) return { label, score: clamp(c.relevance / 10), max: 10, feedback: "Provisional band from overall quality." };
    // default: derive from overall relevance + length
    return { label, score: clamp((relScore + wordScore) / 2), max: 10, feedback: "Assessed from relevance and depth." };
  });
}
