import { evaluateAnswer, type EvaluationResult } from "@/lib/upsc/optionalEvaluation";

export type EvaluateInput = {
  subject: string;
  question: string;
  parts: { Introduction: string; Body: string; Conclusion: string };
  parameters: string[];
  expectedWords: number;
};

type AiParam = { label?: unknown; score?: unknown; feedback?: unknown };

/**
 * Evaluate an optional answer. Tries the real AI route first; if no key is
 * configured (or any error), falls back to the deterministic heuristic so the
 * student always gets a content-aware report.
 */
export async function evaluateOptionalAnswer(input: EvaluateInput): Promise<EvaluationResult> {
  const local = evaluateAnswer({
    question: input.question,
    parts: input.parts,
    parameters: input.parameters,
    expectedWords: input.expectedWords,
  });

  try {
    const answer = `${input.parts.Introduction}\n${input.parts.Body}\n${input.parts.Conclusion}`.trim();
    const res = await fetch("/api/optional/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: input.subject, question: input.question, answer, parameters: input.parameters }),
    });
    const data = await res.json();
    if (data?.ok && data.result && Array.isArray(data.result.params)) {
      return {
        ...local,
        overall: typeof data.result.overall === "number" ? data.result.overall : local.overall,
        verdict: typeof data.result.verdict === "string" ? data.result.verdict : local.verdict,
        params: (data.result.params as AiParam[]).map((p) => ({
          label: String(p.label ?? ""),
          score: Number(p.score ?? 0),
          max: 10 as const,
          feedback: String(p.feedback ?? ""),
        })),
      };
    }
    return local;
  } catch {
    return local;
  }
}
