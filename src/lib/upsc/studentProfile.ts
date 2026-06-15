import { loadRemoteStudentProfile, saveRemoteStudentProfile } from "@/lib/upsc/learnerPersistence";
import type { PlanTier, BillingCycle } from "./yearlyPlanner";

export type StudentLevel = "beginner" | "intermediate" | "advanced";
export type PreparationStage = "not-started" | "coaching-complete" | "multiple-attempts";
export type LearningStyle = "watch-first" | "talk-first" | "practice-first" | "mixed";
export type WeakSignal = "retention" | "concept-clarity" | "mcq-traps" | "answer-writing";
export type StudyWindow = "60" | "90" | "120" | "180";
export type StudyTime = "morning" | "afternoon" | "evening" | "late-night";
export type AttemptHistory = "no-attempt" | "one-attempt" | "two-plus-attempts";
export type LearningPattern = "deep-work" | "split-sessions" | "revision-first" | "irregular";
export type MindState = "calm" | "overloaded" | "low-confidence" | "exam-stress";

export type StudentProfile = {
  level: StudentLevel;
  preparationStage: PreparationStage;
  studyWindow: StudyWindow;
  learningStyle: LearningStyle;
  weakSignal: WeakSignal;
  studyTime: StudyTime;
  attemptHistory: AttemptHistory;
  learningPattern: LearningPattern;
  mindState: MindState;
  updatedAt: string;
  welcomeVideoCompleted?: boolean;
  inductionSyllabusCompleted?: boolean;
  inductionBooklistCompleted?: boolean;
  inductionQuizCompleted?: boolean;
  inductionCompleted?: boolean;
  retroReflections?: string;
  subscriptionPlanId?: PlanTier;
  billingCycle?: BillingCycle;
  firstAttemptYear?: string;
  preparationStartMonth?: string;
  customPlanCompleted?: boolean;
  points?: number;
  coins?: number;
  unlockedBadges?: string[];
};

export type StudentPlanSummary = {
  planLine: string;
  levelStrategy: string;
  dailyLoop: string;
  firstAction: string;
  repairRule: string;
  revisionRule: string;
  timeRule: string;
  attemptRule: string;
  patternRule: string;
  psychologyRule: string;
};

export const profileStorageKey = "sarit-upsc-student-profile-v1";

export const defaultStudentProfile: StudentProfile = {
  level: "beginner",
  preparationStage: "not-started",
  studyWindow: "120",
  learningStyle: "mixed",
  weakSignal: "retention",
  studyTime: "morning",
  attemptHistory: "no-attempt",
  learningPattern: "deep-work",
  mindState: "calm",
  updatedAt: "",
  welcomeVideoCompleted: false,
  inductionSyllabusCompleted: false,
  inductionBooklistCompleted: false,
  inductionQuizCompleted: false,
  inductionCompleted: false,
  retroReflections: undefined,
  subscriptionPlanId: "foundation",
  billingCycle: "monthly",
  firstAttemptYear: "",
  preparationStartMonth: "",
  customPlanCompleted: false,
  points: 0,
  coins: 0,
  unlockedBadges: [],
};

function isStudentLevel(level: StudentProfile["level"] | undefined): level is StudentLevel {
  return level === "beginner" || level === "intermediate" || level === "advanced";
}

function isPreparationStage(stage: StudentProfile["preparationStage"] | undefined): stage is PreparationStage {
  return stage === "not-started" || stage === "coaching-complete" || stage === "multiple-attempts";
}

function isAttemptHistory(history: StudentProfile["attemptHistory"] | undefined): history is AttemptHistory {
  return history === "no-attempt" || history === "one-attempt" || history === "two-plus-attempts";
}

export function normalizeStudentProfile(profile: Partial<StudentProfile>) {
  const savedLevel = isStudentLevel(profile.level) ? profile.level : defaultStudentProfile.level;
  const preparationStage = isPreparationStage(profile.preparationStage)
    ? profile.preparationStage
    : preparationStageForLevel(savedLevel);
  const level = studentLevelForPreparationStage(preparationStage);
  const savedAttemptHistory = isAttemptHistory(profile.attemptHistory)
    ? profile.attemptHistory
    : defaultStudentProfile.attemptHistory;
  const attemptHistory =
    preparationStage === "multiple-attempts"
      ? "two-plus-attempts"
      : preparationStage === "not-started" || savedAttemptHistory === "two-plus-attempts"
        ? "no-attempt"
        : savedAttemptHistory;

  return {
    ...defaultStudentProfile,
    ...profile,
    level,
    preparationStage,
    attemptHistory,
  } as StudentProfile;
}

export function readStudentProfile() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(profileStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StudentProfile>;
    if (!parsed.level || !parsed.studyWindow || !parsed.learningStyle || !parsed.weakSignal || !parsed.studyTime) {
      return null;
    }
    const normalizedProfile = normalizeStudentProfile(parsed);
    window.localStorage.setItem(profileStorageKey, JSON.stringify(normalizedProfile));
    return normalizedProfile;
  } catch {
    return null;
  }
}

export function saveStudentProfile(profile: StudentProfile) {
  const normalizedProfile = normalizeStudentProfile(profile);
  if (typeof window === "undefined") return normalizedProfile;
  window.localStorage.setItem(profileStorageKey, JSON.stringify(normalizedProfile));
  void saveRemoteStudentProfile(normalizedProfile);
  return normalizedProfile;
}

export async function syncLocalStudentProfile() {
  const localProfile = readStudentProfile();
  return localProfile ? saveRemoteStudentProfile(localProfile) : false;
}

export async function readSyncedStudentProfile() {
  const localProfile = readStudentProfile();
  const remoteProfile = await loadRemoteStudentProfile<StudentProfile>();
  if (!remoteProfile) {
    if (localProfile) void saveRemoteStudentProfile(localProfile);
    return localProfile;
  }

  const hydratedRemoteProfile = normalizeStudentProfile(remoteProfile);
  const localTimestamp = localProfile?.updatedAt ? Date.parse(localProfile.updatedAt) : 0;
  const remoteTimestamp = hydratedRemoteProfile.updatedAt ? Date.parse(hydratedRemoteProfile.updatedAt) : 0;
  const preferredProfile =
    !localProfile || remoteTimestamp >= localTimestamp ? hydratedRemoteProfile : localProfile;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(preferredProfile));
  }
  if (preferredProfile === localProfile && localTimestamp > remoteTimestamp) {
    void saveRemoteStudentProfile(preferredProfile);
  }

  return preferredProfile;
}

const studyTimeCopy: Record<StudyTime, string> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  "late-night": "night",
};

const learningStyleCopy: Record<LearningStyle, string> = {
  "watch-first": "watch-heavy repair",
  "talk-first": "oral recall first",
  "practice-first": "practice-first trap loop",
  mixed: "balanced recall and repair",
};

const weakSignalCopy: Record<WeakSignal, string> = {
  retention: "Day-3 Feynman recall stays mandatory.",
  "concept-clarity": "The class opens only to repair missing concepts.",
  "mcq-traps": "Every practice set ends with one trap note.",
  "answer-writing": "Every topic ends with one mains-ready sentence.",
};

const attemptCopy: Record<AttemptHistory, string> = {
  "no-attempt": "no-attempt self-study bridge",
  "one-attempt": "one-attempt error recovery",
  "two-plus-attempts": "attempt-hardened plan",
};

const preparationStageCopy: Record<PreparationStage, string> = {
  "not-started": "foundation syllabus path",
  "coaching-complete": "coaching-to-self-study bridge",
  "multiple-attempts": "attempt-recovery path",
};

export function studentLevelForPreparationStage(stage: PreparationStage): StudentLevel {
  if (stage === "not-started") return "beginner";
  if (stage === "multiple-attempts") return "advanced";
  return "intermediate";
}

export function preparationStageForLevel(level: StudentLevel): PreparationStage {
  if (level === "beginner") return "not-started";
  if (level === "advanced") return "multiple-attempts";
  return "coaching-complete";
}

const patternCopy: Record<LearningPattern, string> = {
  "deep-work": "single deep-work block",
  "split-sessions": "two compact study sprints",
  "revision-first": "revision-first start",
  irregular: "consistency repair",
};

const mindStateCopy: Record<MindState, string> = {
  calm: "Keep the plan steady and evidence-led.",
  overloaded: "Open only one task at a time and hide secondary rooms.",
  "low-confidence": "Show small wins before increasing difficulty.",
  "exam-stress": "Use short timed loops and immediate feedback.",
};

export function buildStudentPlan(profile: StudentProfile): StudentPlanSummary {
  const minutes = Number(profile.studyWindow);
  const pace =
    minutes >= 180
      ? "extended daily loop"
      : minutes >= 120
        ? "full daily loop"
        : minutes >= 90
          ? "standard daily loop"
          : "compressed daily loop";
  const levelStrategy = preparationStageCopy[profile.preparationStage ?? preparationStageForLevel(profile.level)];
  const styleRule = learningStyleCopy[profile.learningStyle];
  const repairRule = weakSignalCopy[profile.weakSignal];
  const attemptRule = attemptCopy[profile.attemptHistory];
  const patternRule = patternCopy[profile.learningPattern];
  const psychologyRule = mindStateCopy[profile.mindState];
  const dailyLoop =
    profile.level === "beginner"
      ? "Learn one 10-15 minute topic -> discuss until 95% recall -> fresh MCQ -> next topic."
      : profile.learningPattern === "split-sessions"
      ? "Recall -> short repair -> break -> fresh MCQ."
      : profile.learningPattern === "revision-first"
        ? "Day-3 recall -> new topic -> fresh MCQ."
        : minutes >= 120
      ? "Recall -> repair class -> fresh MCQ."
      : "Recall -> compressed repair -> short practice.";
  const revisionRule =
    profile.weakSignal === "retention"
      ? "Revise on day 3 before adding a new weak topic."
      : "Revise on day 3, then retest only the weak signal.";

  return {
    planLine: `${profile.studyWindow} minutes, ${pace}, ${levelStrategy}, ${attemptRule}, ${styleRule}, ${patternRule}.`,
    levelStrategy,
    dailyLoop,
    firstAction:
      profile.level === "beginner"
        ? "Open today's 10-15 minute topic. Discussion starts immediately after the lesson."
        : "Explain what you already know. The system opens only the missing concepts.",
    repairRule,
    revisionRule,
    timeRule: `Best study window: ${studyTimeCopy[profile.studyTime]}.`,
    attemptRule,
    patternRule,
    psychologyRule,
  };
}

export function profilePlanLine(profile: StudentProfile | null) {
  if (!profile) return "Complete your setup once. Then the portal opens the exact next step.";
  return buildStudentPlan(profile).planLine;
}
