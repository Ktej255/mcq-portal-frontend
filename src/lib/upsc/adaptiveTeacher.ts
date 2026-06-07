import {
  assessGeographyExplanation,
  type GeographyAssessment,
  type GeographyAssessmentRubricItem,
} from "@/lib/upsc/geographyLearning";
import { GEOGRAPHY_RECALL_TARGET } from "@/lib/upsc/guidedStudy";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import type { StudentLevel } from "@/lib/upsc/studentProfile";
import {
  assessSubjectExplanation,
  SUBJECT_RECALL_TARGET,
  type SubjectAssessment,
} from "@/lib/upsc/subjectLearning";
import { subjectPlans, type SubjectSession } from "@/lib/upsc/subjectPlans";

export type AdaptiveTeacherMode = "gemini" | "local-fallback";

export const ADAPTIVE_TEACHER_PROMPT_VERSION = "upsc-teacher-2026-06-03.2";
export const ADAPTIVE_TEACHER_RUBRIC_VERSION = "upsc-recall-rubric-2026-06-03.1";
export const ADAPTIVE_TEACHER_MAX_REQUEST_BYTES = 12_000;
export const ADAPTIVE_TEACHER_MAX_PROVIDER_RESPONSE_BYTES = 24_000;
export const ADAPTIVE_TEACHER_MAX_COACH_SUMMARY_LENGTH = 600;
export const ADAPTIVE_TEACHER_MAX_COACH_PROMPT_LENGTH = 500;
export const ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPT_LENGTH = 80;
export const ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPTS = 5;

export type AdaptiveTeacherRequest = {
  subjectSlug?: string;
  day: number;
  answer: string;
  challengeAnswer?: string;
  learnerLevel: StudentLevel;
};

export type AdaptiveTeacherCoach = {
  summary: string;
  nextPrompt: string;
  focusConcepts: string[];
  providerScore?: number;
};

export type AdaptiveTeacherResponse = {
  mode: AdaptiveTeacherMode;
  providerConfigured: boolean;
  fallbackReason?: "provider-not-configured" | "provider-unavailable" | "invalid-provider-response";
  trace: {
    promptVersion: string;
    rubricVersion: string;
    recallTarget: number;
  };
  assessment: GeographyAssessment;
  coach: AdaptiveTeacherCoach;
};

type AdaptiveTeacherSubject = {
  slug: string;
  title: string;
  recallTarget: number;
  sessions: Array<GeographySession | SubjectSession>;
  assessmentKind: "geography" | "subject";
};

export function getAdaptiveTeacherLevelInstruction(learnerLevel: StudentLevel) {
  if (learnerLevel === "beginner") {
    return {
      role: "beginner lesson teacher",
      diagnosisFrame: "Check whether the learner understood the taught 10-15 minute lesson.",
      repairFrame: "Use a simple concept -> mechanism -> example -> trap repair before MCQ.",
      nextQuestionFrame: "Ask for one clearer repeat explanation in plain language.",
    };
  }

  if (learnerLevel === "advanced") {
    return {
      role: "advanced attempt-gap examiner",
      diagnosisFrame: "Assume the learner has studied before and diagnose why repeated prelims attempts still fail.",
      repairFrame: "Prioritize PYQ pattern, exception handling, map/proof precision, and UPSC statement traps.",
      nextQuestionFrame: "Ask one attempt-gap question that forces a trap, exception, or map-proof correction.",
    };
  }

  return {
    role: "intermediate self-study mentor",
    diagnosisFrame: "Assume coaching is complete and identify which UPSC-ready concepts are still missing in self-study recall.",
    repairFrame: "Prioritize syllabus linkage, mechanism, applied proof, and one concise self-study correction.",
    nextQuestionFrame: "Ask one diagnosis-first question that exposes the missing UPSC concept without repeating the full class.",
  };
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && Boolean(value.trim()) && value.trim().length <= maxLength;
}

function isBoundedStringArray(value: unknown, maxItems: number, maxLength: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => isBoundedString(item, maxLength))
  );
}

export function resolveAdaptiveTeacherSubject(subjectSlug?: string): AdaptiveTeacherSubject | null {
  if (!subjectSlug || subjectSlug === "geography") {
    return {
      slug: "geography",
      title: "Geography",
      recallTarget: GEOGRAPHY_RECALL_TARGET,
      sessions: geographySessions,
      assessmentKind: "geography",
    };
  }

  const plan = subjectPlans[subjectSlug];
  if (!plan) return null;

  return {
    slug: plan.slug,
    title: plan.title,
    recallTarget: SUBJECT_RECALL_TARGET,
    sessions: plan.sessions,
    assessmentKind: "subject",
  };
}

function readTeacherSubjectSlug(value: unknown) {
  if (value === undefined || value === null || value === "") return "geography";
  return typeof value === "string" ? value.trim() : "";
}

export function parseAdaptiveTeacherRequest(value: unknown): AdaptiveTeacherRequest | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AdaptiveTeacherRequest>;
  const subjectSlug = readTeacherSubjectSlug(candidate.subjectSlug);
  const subject = resolveAdaptiveTeacherSubject(subjectSlug);
  const answer = typeof candidate.answer === "string" ? candidate.answer.trim() : "";
  const challengeAnswer = typeof candidate.challengeAnswer === "string" ? candidate.challengeAnswer.trim() : undefined;
  if (
    !subject ||
    !Number.isInteger(candidate.day) ||
    !candidate.day ||
    candidate.day < 1 ||
    candidate.day > subject.sessions.length ||
    answer.length < 20 ||
    answer.length > 6000 ||
    (challengeAnswer && challengeAnswer.length > 3000) ||
    !["beginner", "intermediate", "advanced"].includes(candidate.learnerLevel ?? "")
  ) {
    return null;
  }

  return {
    subjectSlug: subject.slug,
    day: candidate.day,
    answer,
    challengeAnswer,
    learnerLevel: candidate.learnerLevel as StudentLevel,
  };
}

function rubricStatus(score: number, max: number): GeographyAssessmentRubricItem["status"] {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.72) return "Ready";
  if (ratio >= 0.42) return "Forming";
  return "Weak";
}

function buildRubricItem(
  label: GeographyAssessmentRubricItem["label"],
  score: number,
  max: number,
  evidence: string
): GeographyAssessmentRubricItem {
  return {
    label,
    score,
    max,
    status: rubricStatus(score, max),
    evidence,
  };
}

function adaptSubjectAssessmentToTeacherRubric(
  session: SubjectSession,
  answer: string,
  assessment: SubjectAssessment
): GeographyAssessment {
  const normalizedAnswer = answer.toLowerCase();
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const recallScore = Math.min(
    30,
    Math.round(
      (assessment.matchedKeywords.length /
        Math.max(assessment.matchedKeywords.length + assessment.missingKeywords.length, 1)) *
        30
    )
  );
  const mechanismScore = Math.min(
    20,
    Math.round(
      (/(cause|effect|impact|mechanism|process|why|because|link|relationship|sequence)/i.test(normalizedAnswer)
        ? 12
        : 0) + Math.min(wordCount / 70, 1) * 8
    )
  );
  const mapScore = Math.min(
    20,
    Math.round(
      (/(india|state|region|map|policy|scheme|institution|report|case|example|law|act|current)/i.test(normalizedAnswer)
        ? 14
        : 0) + (assessment.matchedKeywords.length >= 5 ? 6 : 0)
    )
  );
  const trapScore = Math.min(
    15,
    Math.round(
      (/(upsc|trap|exception|statement|wrong|confuse|not every|overgeneral|pyq|prelims)/i.test(normalizedAnswer)
        ? 11
        : 0) + (assessment.score >= SUBJECT_RECALL_TARGET ? 4 : 0)
    )
  );
  const expressionScore = Math.min(15, Math.round(Math.min(wordCount / 90, 1) * 12 + (answer.trim().length > 0 ? 3 : 0)));
  const rubric: GeographyAssessmentRubricItem[] = [
    buildRubricItem(
      "Recall",
      recallScore,
      30,
      assessment.matchedKeywords.length
        ? `Matched ${assessment.matchedKeywords.slice(0, 4).join(", ")}.`
        : "Core topic vocabulary is missing."
    ),
    buildRubricItem(
      "Mechanism",
      mechanismScore,
      20,
      mechanismScore >= 15 ? "Cause-effect logic is visible." : "Needs clearer cause, process, consequence, and exception."
    ),
    buildRubricItem(
      "Map proof",
      mapScore,
      20,
      mapScore >= 15 ? "Applied proof is visible." : "Needs one India, policy, institution, map, report, or case example."
    ),
    buildRubricItem(
      "UPSC trap",
      trapScore,
      15,
      trapScore >= 11 ? "Statement trap or exception is visible." : "Needs one almost-correct UPSC statement and exception."
    ),
    buildRubricItem(
      "Expression",
      expressionScore,
      15,
      expressionScore >= 11 ? "Answer has enough spoken structure." : "Needs a cleaner spoken order."
    ),
  ];
  const repairHints = rubric
    .filter((item) => item.status !== "Ready")
    .map((item) => {
      if (item.label === "Recall") return `Use these missing terms: ${assessment.missingKeywords.join(", ") || session.title}.`;
      if (item.label === "Mechanism") return "Add a because-chain: cause -> process -> effect -> exception.";
      if (item.label === "Map proof") return "Add one applied proof: India, policy, institution, report, map, or case example.";
      if (item.label === "UPSC trap") return "Add one UPSC trap: an almost-correct statement and the exception.";
      return "Speak in a compact order: concept -> mechanism -> example -> trap.";
    });

  return {
    score: assessment.score,
    band: assessment.band,
    matchedKeywords: assessment.matchedKeywords.slice(0, 25),
    missingKeywords: assessment.missingKeywords.slice(0, 5),
    summary: assessment.summary,
    nextAction: assessment.nextAction,
    rubric,
    repairHints,
  };
}

export function buildLocalAdaptiveTeacherResponse(
  request: AdaptiveTeacherRequest,
  options: Pick<AdaptiveTeacherResponse, "providerConfigured" | "fallbackReason"> = {
    providerConfigured: false,
    fallbackReason: "provider-not-configured",
  }
): AdaptiveTeacherResponse {
  const subject = resolveAdaptiveTeacherSubject(request.subjectSlug) ?? resolveAdaptiveTeacherSubject("geography")!;
  const session = subject.sessions[request.day - 1];
  const combinedAnswer = [request.answer, request.challengeAnswer]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n\nChallenge repair:\n");
  const assessment =
    subject.assessmentKind === "geography"
      ? assessGeographyExplanation(session as GeographySession, combinedAnswer)
      : adaptSubjectAssessmentToTeacherRubric(
          session as SubjectSession,
          combinedAnswer,
          assessSubjectExplanation(session as SubjectSession, combinedAnswer)
        );
  const focusConcepts = assessment.missingKeywords.slice(0, 4);
  const examplePrompt = subject.assessmentKind === "geography" ? "India map example" : "applied example";
  const levelInstruction = getAdaptiveTeacherLevelInstruction(request.learnerLevel);
  const nextPrompt =
    assessment.score >= subject.recallTarget
      ? "Apply the concept in fresh MCQs, then continue to the next topic."
      : focusConcepts.length
        ? `${levelInstruction.nextQuestionFrame} Connect ${focusConcepts.join(", ")} through one cause-effect chain, one ${examplePrompt}, and one UPSC trap.`
        : `${levelInstruction.nextQuestionFrame} Explain the weakest concept once more through one cause-effect chain, one ${examplePrompt}, and one UPSC trap.`;

  return {
    mode: "local-fallback",
    ...options,
    trace: {
      promptVersion: ADAPTIVE_TEACHER_PROMPT_VERSION,
      rubricVersion: ADAPTIVE_TEACHER_RUBRIC_VERSION,
      recallTarget: subject.recallTarget,
    },
    assessment,
    coach: {
      summary: `${levelInstruction.diagnosisFrame} ${assessment.summary}`,
      nextPrompt,
      focusConcepts,
    },
  };
}

export function parseGeminiCoach(value: unknown): AdaptiveTeacherCoach | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AdaptiveTeacherCoach>;
  const summary = typeof candidate.summary === "string" ? candidate.summary.trim() : "";
  const nextPrompt = typeof candidate.nextPrompt === "string" ? candidate.nextPrompt.trim() : "";
  if (!Array.isArray(candidate.focusConcepts)) return null;
  const focusConcepts = candidate.focusConcepts
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  const providerScore =
    typeof candidate.providerScore === "number"
      ? Math.min(100, Math.max(0, Math.round(candidate.providerScore)))
      : undefined;

  if (
    !summary ||
    summary.length > ADAPTIVE_TEACHER_MAX_COACH_SUMMARY_LENGTH ||
    !nextPrompt ||
    nextPrompt.length > ADAPTIVE_TEACHER_MAX_COACH_PROMPT_LENGTH ||
    focusConcepts.length !== candidate.focusConcepts.length ||
    focusConcepts.length > ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPTS ||
    focusConcepts.some((item) => item.length > ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPT_LENGTH)
  ) {
    return null;
  }

  return {
    summary,
    nextPrompt,
    focusConcepts,
    providerScore,
  };
}

export function parseAdaptiveTeacherResponse(value: unknown): AdaptiveTeacherResponse | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AdaptiveTeacherResponse>;
  const trace = candidate.trace;
  const assessment = candidate.assessment;
  const coach = parseGeminiCoach(candidate.coach);
  const fallbackReasons = ["provider-not-configured", "provider-unavailable", "invalid-provider-response"];
  const rubricLabels = ["Recall", "Mechanism", "Map proof", "UPSC trap", "Expression"];
  const rubricStatuses = ["Weak", "Forming", "Ready"];

  if (
    !["gemini", "local-fallback"].includes(candidate.mode ?? "") ||
    typeof candidate.providerConfigured !== "boolean" ||
    (candidate.fallbackReason !== undefined && !fallbackReasons.includes(candidate.fallbackReason)) ||
    !trace ||
    trace.promptVersion !== ADAPTIVE_TEACHER_PROMPT_VERSION ||
    trace.rubricVersion !== ADAPTIVE_TEACHER_RUBRIC_VERSION ||
    trace.recallTarget !== GEOGRAPHY_RECALL_TARGET ||
    !assessment ||
    !Number.isFinite(assessment.score) ||
    assessment.score < 0 ||
    assessment.score > 100 ||
    !["Revisit", "Practice", "Command"].includes(assessment.band) ||
    !isBoundedStringArray(assessment.matchedKeywords, 25, ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPT_LENGTH) ||
    !isBoundedStringArray(assessment.missingKeywords, 5, ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPT_LENGTH) ||
    !isBoundedString(assessment.summary, ADAPTIVE_TEACHER_MAX_COACH_SUMMARY_LENGTH) ||
    !isBoundedString(assessment.nextAction, 120) ||
    !Array.isArray(assessment.rubric) ||
    assessment.rubric.length !== 5 ||
    !assessment.rubric.every(
      (item) =>
        rubricLabels.includes(item.label) &&
        Number.isFinite(item.score) &&
        Number.isFinite(item.max) &&
        item.score >= 0 &&
        item.max > 0 &&
        item.score <= item.max &&
        rubricStatuses.includes(item.status) &&
        isBoundedString(item.evidence, 240)
    ) ||
    !isBoundedStringArray(assessment.repairHints, 5, 240) ||
    !coach
  ) {
    return null;
  }

  return {
    mode: candidate.mode as AdaptiveTeacherMode,
    providerConfigured: candidate.providerConfigured,
    fallbackReason: candidate.fallbackReason,
    trace,
    assessment,
    coach,
  };
}
