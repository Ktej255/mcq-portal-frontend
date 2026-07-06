import { subjectPlans } from "./subjectPlans";
import { geographySessions } from "./plan";

export interface AdaptiveTeacherDoubtDiagnosis {
  category: string;
  reason: string;
  repairAction: string;
  masteryCheck: string;
}

export interface AdaptiveTeacherCoach {
  summary: string;
  nextPrompt: string;
  focusConcepts: string[];
  doubtDiagnosis: AdaptiveTeacherDoubtDiagnosis;
  providerScore?: number;
}

export interface AdaptiveTeacherAssessment {
  score: number;
  band: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  nextAction: string;
  repairHints: string[];
  rubric?: Array<{
    label: string;
    score: number;
    max: number;
    status: string;
    evidence: string;
  }>;
}

export interface AdaptiveTeacherResponse {
  mode: "local-fallback" | "nvidia-teacher" | "gemini";
  providerConfigured: boolean;
  trace: {
    promptVersion: string;
    rubricVersion: string;
    recallTarget: number;
  };
  assessment: AdaptiveTeacherAssessment;
  coach: AdaptiveTeacherCoach;
}

export interface AdaptiveTeacherRequest {
  subjectSlug: string;
  day: number;
  answer: string;
  challengeAnswer?: string;
  learnerLevel: "beginner" | "intermediate" | "advanced";
  moduleId?: string;
  sectionId?: string;
  cumulativeSectionIds?: string[];
  expectedRecallPoints?: string[];
}

export const ADAPTIVE_TEACHER_MAX_COACH_PROMPT_LENGTH = 1000;
export const ADAPTIVE_TEACHER_MAX_COACH_SUMMARY_LENGTH = 1000;
export const ADAPTIVE_TEACHER_MAX_DOUBT_FIELD_LENGTH = 2000;
export const ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPT_LENGTH = 200;
export const ADAPTIVE_TEACHER_MAX_FOCUS_CONCEPTS = 5;
export const ADAPTIVE_TEACHER_MAX_PROVIDER_RESPONSE_BYTES = 65536;
export const ADAPTIVE_TEACHER_MAX_REQUEST_BYTES = 32768;
export const ADAPTIVE_TEACHER_PROMPT_VERSION = "2.0";
export const ADAPTIVE_TEACHER_RUBRIC_VERSION = "2.0";

export function getAdaptiveTeacherLevelInstruction(level: string) {
  return {
    role: "Mentor",
    diagnosisFrame: "Analyze core gaps.",
    repairFrame: "Recommend targeted practice."
  };
}

export function parseAdaptiveTeacherCoach(raw: any): AdaptiveTeacherCoach | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    summary: String(raw.summary || ""),
    nextPrompt: String(raw.nextPrompt || ""),
    focusConcepts: Array.isArray(raw.focusConcepts) ? raw.focusConcepts.map(String) : [],
    doubtDiagnosis: {
      category: String(raw.doubtDiagnosis?.category || "Mastery"),
      reason: String(raw.doubtDiagnosis?.reason || ""),
      repairAction: String(raw.doubtDiagnosis?.repairAction || ""),
      masteryCheck: String(raw.doubtDiagnosis?.masteryCheck || "")
    },
    providerScore: typeof raw.providerScore === "number" ? raw.providerScore : undefined
  };
}

export function parseAdaptiveTeacherRequest(raw: any): AdaptiveTeacherRequest | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    subjectSlug: String(raw.subjectSlug || ""),
    day: Number(raw.day || 1),
    answer: String(raw.answer || ""),
    challengeAnswer: raw.challengeAnswer ? String(raw.challengeAnswer) : undefined,
    learnerLevel: (raw.learnerLevel || "beginner") as any
  };
}

export function resolveAdaptiveTeacherSubject(slug: string) {
  if (slug === "geography") {
    return {
      title: "Geography",
      sessions: geographySessions,
      recallTarget: 95
    };
  }
  const plan = (subjectPlans as any)[slug];
  if (!plan) return null;
  return {
    title: plan.title,
    sessions: plan.sessions,
    recallTarget: 95
  };
}

export function buildLocalAdaptiveTeacherResponse(request: AdaptiveTeacherRequest, options?: any) {
  return {
    mode: "local-fallback",
    providerConfigured: Boolean(options?.providerConfigured),
    trace: {
      promptVersion: ADAPTIVE_TEACHER_PROMPT_VERSION,
      rubricVersion: ADAPTIVE_TEACHER_RUBRIC_VERSION,
      recallTarget: 95
    },
    assessment: {
      score: 80,
      band: "Practice",
      matchedKeywords: [],
      missingKeywords: [],
      summary: "Local assessment fallback due to provider limitation or network issue.",
      nextAction: "Review the topic overview and try another active recall explanation.",
      repairHints: []
    },
    coach: {
      summary: "I've reviewed your answer. Let's practice a bit more to lock down the core details.",
      nextPrompt: "Explain the issue again, focusing on cause-effect and UPSC traps.",
      focusConcepts: [],
      doubtDiagnosis: {
        category: "Mastery",
        reason: "Initial assessment fallback.",
        repairAction: "Try explaining the concept once more.",
        masteryCheck: "Can you explain it without referencing your notes?"
      }
    }
  };
}

export function parseAdaptiveTeacherResponse(raw: any): AdaptiveTeacherResponse | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as AdaptiveTeacherResponse;
}
