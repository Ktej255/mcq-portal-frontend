"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  FileText,
  Gauge,
  HeartPulse,
  Layers3,
  LineChart,
  PlayCircle,
  RefreshCcw,
  Save,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  AUTO_SESSION_HANDOFF_STORAGE_KEY,
  buildDailyPlannerDecision,
  type AutoSessionHandoffRecord,
  type DailyPlannerProgress,
} from "@/lib/upsc/dailyPlannerEngine";
import { getUpscMcqBatchStatus, isUpscMcqCommandCleared } from "@/lib/upsc/mcqCommandStatus";
import { geographyLabs, geographySessions } from "@/lib/upsc/plan";
import {
  allPracticeQuestionBank,
  buildQuestionBankQuestionsFromPyqImports,
  buildRecommendedQuestionBankMix,
  readLocalQuestionBankAttempts,
  selectQuestionBankSet,
} from "@/lib/upsc/questionBankEngine";
import { readLocalPyqImportRecords, type PyqImportRecord } from "@/lib/upsc/pyqImportLedger";
import { readStudentProfile } from "@/lib/upsc/studentProfile";
import { getSubjectBatchCode, subjectPlans, type SubjectLab, type SubjectSession } from "@/lib/upsc/subjectPlans";
import { buildUpscActionQueue } from "@/lib/upsc/upscActionQueue";
import type { SubjectDayProgress, SubjectMeTimeMood } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

type DailySubject = {
  slug: string;
  title: string;
  window: string;
  sessions: SubjectSession[];
  labs: Array<Pick<SubjectLab, "slug" | "title">>;
};

type ContentState = {
  videoStatus?: "Planned" | "Drafted" | "Ready";
  notesStatus?: "Planned" | "Drafted" | "Ready";
  transcriptStatus?: "Planned" | "Drafted" | "Ready";
};

type McqState = {
  planned?: number;
  drafted?: number;
  status?: "DRAFT" | "READY";
};

type DailyState = {
  subjectSlug: string;
  day: number;
  note?: string;
  updatedAt?: string;
};

const dailySubjects: DailySubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
    sessions: geographySessions,
    labs: geographyLabs.map((lab) => ({ slug: lab.slug, title: lab.title })),
  },
  ...[
    subjectPlans.environment,
    subjectPlans["disaster-management"],
    subjectPlans.economy,
    subjectPlans["science-tech"],
    subjectPlans["polity-governance"],
    subjectPlans["internal-security-society"],
    subjectPlans.history,
  ].map((plan) => ({
    slug: plan.slug,
    title: plan.title,
    window: plan.window,
    sessions: plan.sessions,
    labs: plan.labs.map((lab) => ({ slug: lab.slug, title: lab.title })),
  })),
];

const dailyStorageKey = "sarit-upsc-daily-command-v1";
const contentStorageKey = "sarit-upsc-content-command-v1";
const mcqStorageKey = "sarit-upsc-mcq-command-v1";
const defaultMcqState: McqState = { planned: 25, drafted: 0, status: "DRAFT" };
const meTimeOptions: Array<{
  mood: SubjectMeTimeMood;
  label: string;
  detail: string;
  resetPlan: string;
}> = [
  {
    mood: "focused",
    label: "Focused",
    detail: "Start normal class",
    resetPlan: "Keep one topic open and move directly into the planned task.",
  },
  {
    mood: "calm",
    label: "Calm",
    detail: "Steady pace",
    resetPlan: "Begin with a short recall line, then continue the normal loop.",
  },
  {
    mood: "tired",
    label: "Tired",
    detail: "Reduce load",
    resetPlan: "Do a two-minute reset and start with the smallest class action.",
  },
  {
    mood: "low-confidence",
    label: "Low confidence",
    detail: "Small win first",
    resetPlan: "Open a known point first, then explain one gap without rushing.",
  },
  {
    mood: "exam-stress",
    label: "Exam stress",
    detail: "Short timed loop",
    resetPlan: "Use one timed micro-task and avoid opening secondary rooms.",
  },
  {
    mood: "overloaded",
    label: "Overloaded",
    detail: "One task only",
    resetPlan: "Hide extra work mentally and finish only the top next action.",
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function progressStorageKey(subjectSlug: string) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function contentKey(subject: DailySubject, session: SubjectSession) {
  return `${subject.slug}:D${String(session.day).padStart(2, "0")}`;
}

function batchCode(subject: DailySubject, session: SubjectSession) {
  return getSubjectBatchCode(subject.slug, session.day);
}

function getProgress(subject: DailySubject, session: SubjectSession) {
  const progress = readJson<Record<string, SubjectDayProgress>>(progressStorageKey(subject.slug), {});
  return progress[String(session.day)];
}

function getContentState(subject: DailySubject, session: SubjectSession) {
  const states = readJson<Record<string, ContentState>>(contentStorageKey, {});
  return states[contentKey(subject, session)] ?? {};
}

function getMcqState(subject: DailySubject, session: SubjectSession) {
  const states = readJson<Record<string, McqState>>(mcqStorageKey, {});
  return states[batchCode(subject, session)] ?? { planned: 25, drafted: 0, status: "DRAFT" };
}

function isContentReady(state: ContentState) {
  return state.videoStatus === "Ready" && state.notesStatus === "Ready" && state.transcriptStatus === "Ready";
}

function getLabSlug(subject: DailySubject, session: SubjectSession) {
  return subject.labs.find((lab) => lab.title === session.lab)?.slug ?? subject.labs[0]?.slug ?? "";
}

function getInitialDailyState(): DailyState {
  return readJson<DailyState>(dailyStorageKey, {
    subjectSlug: "geography",
    day: 1,
    note: "",
  });
}

function gapTone(tone: "good" | "repair" | "neutral") {
  if (tone === "good") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (tone === "repair") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b]";
}

function readinessTone(tone: "good" | "repair" | "neutral") {
  if (tone === "good") return "border-[#b9d9cd] bg-[#e7f5ee] text-[#085041]";
  if (tone === "repair") return "border-[#ef9f27]/60 bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b]";
}

function checklistTone(status: "done" | "pending" | "repair") {
  if (status === "done") return "border-[#b9d9cd] bg-white text-[#085041]";
  if (status === "repair") return "border-[#ef9f27]/50 bg-white text-[#6f4a12]";
  return "border-[#dcd5c7] bg-white text-[#5d675f]";
}

function operatingContractTone(status: "ready" | "pending" | "repair") {
  if (status === "ready") return "border-[#b9d9cd] bg-[#e7f5ee] text-[#085041]";
  if (status === "repair") return "border-[#ef9f27]/60 bg-[#fff4df] text-[#6f4a12]";
  return "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b]";
}

function proofTone(status: "used" | "missing" | "blocked") {
  if (status === "used") return "border-[#b9d9cd] bg-white text-[#085041]";
  if (status === "blocked") return "border-[#ef9f27]/50 bg-white text-[#6f4a12]";
  return "border-[#dcd5c7] bg-white text-[#5d675f]";
}

function labelForDailyDoubt(href: string) {
  if (href.includes("/watch")) return "Open repair class";
  if (href.includes("/revisit")) return "Open revisit";
  if (href.includes("/mcq-readiness")) return "Open MCQs";
  if (href.includes("/lab")) return "Use visual support";
  return "Repeat talk";
}

export function UpscDailyMissionControl() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dailyState, setDailyState] = useState<DailyState>({ subjectSlug: "geography", day: 1, note: "" });
  const [saved, setSaved] = useState(false);
  const [meTimeSaved, setMeTimeSaved] = useState(false);
  const [evidenceRefresh, setEvidenceRefresh] = useState(0);
  const [autoHandoffSavedAt, setAutoHandoffSavedAt] = useState("");
  const [pyqRecords, setPyqRecords] = useState<PyqImportRecord[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDailyState(getInitialDailyState());
      setPyqRecords(readLocalPyqImportRecords());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeSubject = dailySubjects.find((subject) => subject.slug === dailyState.subjectSlug) ?? dailySubjects[0];
  const activeSession =
    activeSubject.sessions.find((session) => session.day === dailyState.day) ?? activeSubject.sessions[0];
  const activeLabSlug = getLabSlug(activeSubject, activeSession);
  const activeProgress = isLoaded ? getProgress(activeSubject, activeSession) : undefined;
  const activeContent = isLoaded ? getContentState(activeSubject, activeSession) : {};
  const activeMcq = isLoaded ? getMcqState(activeSubject, activeSession) : defaultMcqState;
  const contentReady = isContentReady(activeContent);
  const activeMcqBatch = getUpscMcqBatchStatus(activeMcq);
  const basePath = `/upsc/${activeSubject.slug}`;
  const activeBatchCode = batchCode(activeSubject, activeSession);
  const activeMcqCommand = isUpscMcqCommandCleared(activeProgress, activeBatchCode);
  const activeQuestionBankAttempts = isLoaded ? readLocalQuestionBankAttempts(activeSubject.slug) : [];
  const activeDayQuestionBankAttempts = activeQuestionBankAttempts.filter(
    (attempt) => attempt.linkedDay === activeSession.day
  );

  const totals = useMemo(() => {
    if (!isLoaded) {
      return {
        watched: 0,
        reflected: 0,
        revisit: 0,
        contentReady: 0,
        mcqBatchReady: 0,
        mcqCommand: 0,
        total: dailySubjects.reduce((sum, subject) => sum + subject.sessions.length, 0),
      };
    }

    return dailySubjects.reduce(
      (sum, subject) => {
        subject.sessions.forEach((session) => {
          const progress = getProgress(subject, session);
          const content = getContentState(subject, session);
          const activeBatchCode = batchCode(subject, session);
          const mcq = getUpscMcqBatchStatus(getMcqState(subject, session));
          sum.total += 1;
          if (progress?.watched) sum.watched += 1;
          if (progress?.reflection?.trim()) sum.reflected += 1;
          if (progress?.revisitQueued) sum.revisit += 1;
          if (isContentReady(content)) sum.contentReady += 1;
          if (mcq.ready) sum.mcqBatchReady += 1;
          if (isUpscMcqCommandCleared(progress, activeBatchCode)) sum.mcqCommand += 1;
        });
        return sum;
      },
      { watched: 0, reflected: 0, revisit: 0, contentReady: 0, mcqBatchReady: 0, mcqCommand: 0, total: 0 }
    );
  }, [isLoaded, dailyState, evidenceRefresh]);
  const actionQueue = useMemo(() => (isLoaded ? buildUpscActionQueue(8) : []), [isLoaded, dailyState, saved, evidenceRefresh]);
  const studentProfile = useMemo(() => (isLoaded ? readStudentProfile() : null), [isLoaded, dailyState, saved, evidenceRefresh]);
  const activeProgressMap = useMemo<Record<string, DailyPlannerProgress | undefined>>(() => {
    if (!isLoaded) return {};
    return activeSubject.sessions.reduce<Record<string, DailyPlannerProgress | undefined>>((map, session) => {
      map[String(session.day)] = getProgress(activeSubject, session) as DailyPlannerProgress | undefined;
      return map;
    }, {});
  }, [activeSubject, dailyState, isLoaded, saved, evidenceRefresh]);
  const dailyPlanner = useMemo(
    () =>
      buildDailyPlannerDecision({
        subjectSlug: activeSubject.slug,
        sessions: activeSubject.sessions,
        selectedDay: activeSession.day,
        progress: activeProgressMap,
        profile: studentProfile,
        questionBankAttempts: activeQuestionBankAttempts,
      }),
    [activeProgressMap, activeQuestionBankAttempts, activeSession.day, activeSubject.sessions, activeSubject.slug, studentProfile]
  );
  const exactPyqQuestions = useMemo(() => buildQuestionBankQuestionsFromPyqImports(pyqRecords), [pyqRecords]);
  const combinedQuestionBank = useMemo(
    () => [...exactPyqQuestions, ...allPracticeQuestionBank],
    [exactPyqQuestions]
  );
  const activeSubjectExactPyqs = useMemo(
    () => exactPyqQuestions.filter((question) => question.subjectSlug === activeSubject.slug),
    [activeSubject.slug, exactPyqQuestions]
  );
  const activeDayExactPyqs = useMemo(
    () => activeSubjectExactPyqs.filter((question) => question.linkedDay === activeSession.day),
    [activeSession.day, activeSubjectExactPyqs]
  );
  const questionBankSelection = useMemo(
    () =>
      selectQuestionBankSet({
        subjectSlug: activeSubject.slug,
        progress: activeProgressMap,
        profile: studentProfile,
        attempts: activeQuestionBankAttempts,
        questionBank: combinedQuestionBank,
      }),
    [activeProgressMap, activeQuestionBankAttempts, activeSubject.slug, combinedQuestionBank, studentProfile]
  );
  const questionBankRecommendation = questionBankSelection.recommendation;
  const questionBankMix = useMemo(
    () => buildRecommendedQuestionBankMix(questionBankRecommendation),
    [questionBankRecommendation]
  );
  const questionBankMixLabel = Object.entries(questionBankMix)
    .map(([difficulty, amount]) => `${difficulty}:${amount}`)
    .join("|");
  const selectedExactPyqCount = questionBankSelection.questions.filter((question) => question.isExactPyqImport).length;
  const automaticHandoff = dailyPlanner.automaticSessionHandoff;

  useEffect(() => {
    if (!isLoaded) return;

    const generatedAt = new Date().toISOString();
    const record: AutoSessionHandoffRecord = {
      ...automaticHandoff,
      generatedAt,
      selectedDay: activeSession.day,
      selectedSubjectSlug: activeSubject.slug,
    };

    writeJson(AUTO_SESSION_HANDOFF_STORAGE_KEY, record);
    setAutoHandoffSavedAt(generatedAt);
  }, [activeSession.day, activeSubject.slug, automaticHandoff, isLoaded]);

  const activeMeTimeOption = activeProgress?.meTimeMood
    ? meTimeOptions.find((option) => option.mood === activeProgress.meTimeMood)
    : null;
  const recallEvidence =
    dailyPlanner.nextSessionProof.evidence.find((item) => item.label === "Recall") ??
    dailyPlanner.nextSessionProof.evidence[0];
  const practiceEvidence =
    dailyPlanner.nextSessionProof.evidence.find((item) => item.label === "Practice") ??
    dailyPlanner.nextSessionProof.evidence.at(-1);
  const learningFunnelSteps = [
    {
      id: "known-evidence",
      label: "Known",
      title: `Day ${dailyPlanner.nextSessionProof.sourceDay} evidence`,
      detail: `${recallEvidence?.value ?? "Recall pending"}; ${practiceEvidence?.value ?? "Practice pending"}.`,
    },
    {
      id: "gap",
      label: "Gap",
      title: dailyPlanner.learningGap.title,
      detail: dailyPlanner.learningGap.detail,
    },
    {
      id: "today",
      label: "Today",
      title: dailyPlanner.sessionReadiness.title,
      detail: dailyPlanner.sessionReadiness.actionLabel,
    },
    {
      id: "revision",
      label: "Revise",
      title: dailyPlanner.revision.dueLabel,
      detail: dailyPlanner.revision.title,
    },
  ];
  const dailyOperatingContractRows = [
    {
      id: "me-time",
      label: "Start check",
      status: activeProgress?.meTimeCompletedAt ? "ready" : "pending",
      proof: activeProgress?.meTimeMood
        ? `Mind-state saved as ${activeProgress.meTimeMood}.`
        : "Mind-state is collected before the first action opens.",
      href: "#daily-me-time-checkin",
    },
    {
      id: "recall-gap",
      label: "Recall gap",
      status: dailyPlanner.learningGap.tone === "repair" ? "repair" : dailyPlanner.learningGap.tone === "good" ? "ready" : "pending",
      proof: `${dailyPlanner.learningGap.title}: ${dailyPlanner.learningGap.scoreLabel}.`,
      href: dailyPlanner.sessionReadiness.href,
    },
    {
      id: "class-discussion",
      label: "Class and talk",
      status: dailyPlanner.sessionReadiness.tone === "repair" ? "repair" : dailyPlanner.sessionReadiness.scorePercent >= 40 ? "ready" : "pending",
      proof: `${dailyPlanner.sessionReadiness.statusLabel} opens ${dailyPlanner.sessionReadiness.actionLabel}.`,
      href: dailyPlanner.sessionReadiness.href,
    },
    {
      id: "adaptive-mcq",
      label: "Adaptive MCQ",
      status: questionBankRecommendation.unresolvedIncorrectCount ? "repair" : "ready",
      proof: `${questionBankRecommendation.recommendedDifficulty.replace("_", " ")} set, ${questionBankRecommendation.recommendedCount} questions, ${questionBankRecommendation.adaptiveLevel} level; ${activeSubjectExactPyqs.length} exact PYQ import row${activeSubjectExactPyqs.length === 1 ? "" : "s"} ready for this subject.`,
      href: `/upsc/question-bank?subject=${activeSubject.slug}`,
    },
    {
      id: "revision-report",
      label: "Revision and report",
      status: dailyPlanner.revision.urgent ? "repair" : "ready",
      proof: `${dailyPlanner.revision.dueLabel}; weekly and monthly reports use the same evidence.`,
      href: "/reports",
    },
    {
      id: "next-day",
      label: "Next day",
      status: dailyPlanner.nextSessionProof.decision.includes("repair") ? "repair" : "ready",
      proof: `Day ${dailyPlanner.nextSessionProof.sourceDay} evidence chose Day ${dailyPlanner.nextSessionProof.targetDay}.`,
      href: dailyPlanner.tomorrowAdjustment.href,
    },
  ] as const;

  const saveDailyState = (patch: Partial<DailyState>) => {
    const next = {
      ...dailyState,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setDailyState(next);
    writeJson(dailyStorageKey, next);
    setSaved(true);
  };

  const selectSubject = (slug: string) => {
    const subject = dailySubjects.find((item) => item.slug === slug) ?? dailySubjects[0];
    saveDailyState({ subjectSlug: subject.slug, day: subject.sessions[0]?.day ?? 1 });
    setSaved(false);
    setMeTimeSaved(false);
  };

  const selectDay = (day: number) => {
    saveDailyState({ day });
    setSaved(false);
    setMeTimeSaved(false);
  };

  const saveNote = () => saveDailyState({ note: dailyState.note ?? "" });

  const saveMeTime = (option: (typeof meTimeOptions)[number]) => {
    const now = new Date().toISOString();
    const progressMap = readJson<Record<string, SubjectDayProgress>>(progressStorageKey(activeSubject.slug), {});
    const key = String(activeSession.day);
    const nextDay: SubjectDayProgress = {
      ...progressMap[key],
      day: activeSession.day,
      meTimeCompletedAt: now,
      meTimeMood: option.mood,
      meTimeResetPlan: option.resetPlan,
      updatedAt: now,
    };

    writeJson(progressStorageKey(activeSubject.slug), {
      ...progressMap,
      [key]: nextDay,
    });
    setMeTimeSaved(true);
    setEvidenceRefresh((current) => current + 1);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading UPSC daily mission...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section
          data-testid="daily-command-student-focus"
          data-visible-mode="single-action-planner-proof"
          data-active-subject={activeSubject.slug}
          data-active-day={activeSession.day}
          data-next-action-href={dailyPlanner.sessionReadiness.href}
          data-next-action-label={dailyPlanner.sessionReadiness.actionLabel}
          data-readiness-status={dailyPlanner.sessionReadiness.statusLabel}
          data-readiness-score={dailyPlanner.sessionReadiness.scorePercent}
          data-learning-gap={dailyPlanner.learningGap.title}
          data-revision-href={dailyPlanner.revision.href}
          data-after-this-decision={dailyPlanner.nextSessionProof.decision}
          data-after-this-route={dailyPlanner.tomorrowAdjustment.href}
          data-yesterday-decision={dailyPlanner.todayOriginProof.statusLabel}
          data-yesterday-source-day={dailyPlanner.todayOriginProof.sourceDay}
          data-yesterday-target-day={dailyPlanner.todayOriginProof.targetDay}
          data-question-bank-attempts={activeDayQuestionBankAttempts.length}
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">Daily command</Badge>
                <span className="rounded-md bg-white/75 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#085041]">
                  {activeSubject.title} / Day {activeSession.day}
                </span>
                <span className="rounded-md bg-white/75 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#085041]">
                  {dailyPlanner.sessionReadiness.scorePercent}% ready
                </span>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Do this now</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
                {dailyPlanner.sessionReadiness.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#49675e]">
                {dailyPlanner.sessionReadiness.detail}
              </p>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {[
                  ["Gap", dailyPlanner.learningGap.title],
                  ["Revision", dailyPlanner.revision.dueLabel],
                  ["After this", dailyPlanner.tomorrowAdjustment.statusLabel],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-[#cfe5dc] bg-white/75 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">{label}</p>
                    <p className="mt-1 text-xs font-black leading-5 text-[#13251d]">{value}</p>
                  </div>
                ))}
              </div>
              <details
                data-testid="daily-command-focus-proof"
                className="mt-4 rounded-md border border-[#cfe5dc] bg-white/75 p-3"
              >
                <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.12em] text-[#085041]">
                  Why this action?
                </summary>
                <p className="mt-2 text-xs font-bold leading-5 text-[#49675e]">
                  {dailyPlanner.nextSessionProof.evidenceSummary}
                </p>
                <p className="mt-2 text-xs font-bold leading-5 text-[#49675e]">
                  Why today: {dailyPlanner.todayOriginProof.title}. {dailyPlanner.todayOriginProof.evidenceSummary}
                </p>
                <p className="mt-2 text-xs font-bold leading-5 text-[#49675e]">
                  After this: {dailyPlanner.tomorrowAdjustment.title}
                </p>
              </details>
            </div>
            <Link
              href={dailyPlanner.sessionReadiness.href}
              data-testid="daily-command-primary-action"
              data-next-action-href={dailyPlanner.sessionReadiness.href}
              data-next-action-label={dailyPlanner.sessionReadiness.actionLabel}
              data-session-readiness={dailyPlanner.sessionReadiness.statusLabel}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-5 text-sm font-black text-white transition hover:bg-[#10291d] lg:w-auto"
            >
              {dailyPlanner.sessionReadiness.actionLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section
          data-testid="daily-student-learning-funnel"
          data-active-subject={activeSubject.slug}
          data-active-day={activeSession.day}
          data-step-count={learningFunnelSteps.length}
          data-gap-title={dailyPlanner.learningGap.title}
          data-today-task={dailyPlanner.sessionReadiness.title}
          data-revision-label={dailyPlanner.revision.dueLabel}
          data-next-route={dailyPlanner.tomorrowAdjustment.href}
          data-decision={dailyPlanner.nextSessionProof.decision}
          data-readiness-status={dailyPlanner.sessionReadiness.statusLabel}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-5"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Today&apos;s simple path
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">
                {activeSubject.title} Day {activeSession.day}
              </h2>
            </div>
            <Link
              href={dailyPlanner.sessionReadiness.href}
              data-testid="daily-funnel-primary-action"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white transition hover:bg-[#10291d]"
            >
              {dailyPlanner.sessionReadiness.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            {learningFunnelSteps.map((step, index) => (
              <article
                key={step.id}
                data-testid="daily-funnel-step"
                data-step-id={step.id}
                className="min-h-28 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                  {index + 1}. {step.label}
                </p>
                <h3 className="mt-2 text-sm font-black leading-5 text-[#13251d]">{step.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          data-testid="daily-new-day-operating-contract"
          data-contract-rule="me-time-recall-gap-class-discussion-mcq-revision-report-next-day"
          data-row-count={dailyOperatingContractRows.length}
          data-active-subject={activeSubject.slug}
          data-active-day={activeSession.day}
          data-question-bank-difficulty={questionBankRecommendation.recommendedDifficulty}
          data-question-bank-count={questionBankRecommendation.recommendedCount}
          data-question-bank-level={questionBankRecommendation.adaptiveLevel}
          data-question-bank-score={questionBankRecommendation.adaptiveReadinessScore}
          data-question-bank-mix={questionBankMixLabel}
          data-exact-pyq-total-rows={exactPyqQuestions.length}
          data-exact-pyq-active-subject-rows={activeSubjectExactPyqs.length}
          data-exact-pyq-active-day-rows={activeDayExactPyqs.length}
          data-exact-pyq-selected-rows={selectedExactPyqCount}
          data-report-href="/reports"
          data-next-day-route={dailyPlanner.tomorrowAdjustment.href}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm md:p-5"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                New-day operating contract
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">
                The portal chooses the next action from evidence.
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                One chain connects mind-state, recall gap, class/discussion, MCQ difficulty, revision reports, and tomorrow&apos;s adjustment.
              </p>
            </div>
            <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">
              {questionBankRecommendation.recommendedDifficulty.replace("_", " ")}
            </Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {dailyOperatingContractRows.map((row, index) => (
              <Link
                key={row.id}
                href={row.href}
                data-testid="daily-operating-contract-row"
                data-contract-id={row.id}
                data-status={row.status}
                data-href={row.href}
                className={cn("min-h-28 rounded-md border p-3 transition hover:-translate-y-0.5", operatingContractTone(row.status))}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">
                      {index + 1}. {row.label}
                    </p>
                    <h3 className="mt-2 text-sm font-black uppercase tracking-[0.12em]">{row.status}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </div>
                <p className="mt-2 text-xs font-bold leading-5 opacity-85">{row.proof}</p>
              </Link>
            ))}
          </div>
        </section>

        <section
          data-testid="daily-exact-pyq-readiness"
          data-proof-rule="daily-command-uses-mapped-exact-pyq-imports"
          data-active-subject={activeSubject.slug}
          data-active-day={activeSession.day}
          data-total-exact-pyq-rows={exactPyqQuestions.length}
          data-active-subject-exact-pyq-rows={activeSubjectExactPyqs.length}
          data-active-day-exact-pyq-rows={activeDayExactPyqs.length}
          data-selected-exact-pyq-rows={selectedExactPyqCount}
          data-question-bank-href={`/upsc/question-bank?subject=${activeSubject.slug}`}
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4 shadow-sm md:p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#085041]">
                Exact PYQ readiness
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#13251d]">
                Daily MCQs now read the verified import bank.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                Only rows marked exact verified and mapped can enter today&apos;s practice. If the count is zero, the
                student still receives PYQ-style pattern practice without any false exact-PYQ claim.
              </p>
              <Link
                href={`/upsc/question-bank?subject=${activeSubject.slug}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-xs font-black text-white transition hover:bg-[#10291d]"
              >
                Open PYQ practice lane <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["All exact rows", exactPyqQuestions.length],
                [`${activeSubject.title} exact rows`, activeSubjectExactPyqs.length],
                [`Day ${activeSession.day} exact rows`, activeDayExactPyqs.length],
                ["Selected in set", selectedExactPyqCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#b9d9cd] bg-white/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">{label}</p>
                  <p className="mt-1 text-xl font-black text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="daily-today-origin-proof"
          data-source-day={dailyPlanner.todayOriginProof.sourceDay}
          data-target-day={dailyPlanner.todayOriginProof.targetDay}
          data-origin-status={dailyPlanner.todayOriginProof.statusLabel}
          data-origin-route={dailyPlanner.todayOriginProof.href}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Why this is today&apos;s task
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
                {dailyPlanner.todayOriginProof.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {dailyPlanner.todayOriginProof.evidenceSummary}
              </p>
              <Link
                href={dailyPlanner.todayOriginProof.href}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfe5dc] bg-[#e7f5ee] px-3 text-xs font-black uppercase tracking-[0.12em] text-[#085041] transition hover:bg-[#d7efe5]"
              >
                {dailyPlanner.todayOriginProof.statusLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {dailyPlanner.todayOriginProof.evidence.map((item) => (
                <div key={item.label} className={cn("min-h-24 rounded-md border p-3", proofTone(item.status))}>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em]">{item.status}</p>
                  <h3 className="mt-2 text-sm font-black leading-5 text-[#13251d]">{item.label}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href="/upsc" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> UPSC command home
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Daily Mission</Badge>
              <span className="text-sm font-bold text-[#776f64]">Student launch control</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">{activeSubject.window}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              {activeSubject.title}: Day {activeSession.day}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">{activeSession.anchor}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Batch", activeBatchCode],
                ["Chapter", activeSession.chapter],
                ["Duration", activeSession.duration],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-2 break-words text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Watched", value: totals.watched, icon: PlayCircle },
              { label: "Talk notes", value: totals.reflected, icon: BrainCircuit },
              { label: "Revisit", value: totals.revisit, icon: RefreshCcw },
              { label: "Content ready", value: totals.contentReady, icon: BookOpen },
              { label: "Batch ready", value: totals.mcqBatchReady, icon: ClipboardCheck },
              { label: "MCQ command", value: totals.mcqCommand, icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{item.label}</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-[#13251d]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          data-testid="daily-learning-dashboard"
          className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4"
        >
          <article
            data-testid="daily-learning-gap"
            className={cn("rounded-lg border p-5 shadow-sm", gapTone(dailyPlanner.learningGap.tone))}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/70">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                {dailyPlanner.learningGap.scoreLabel}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">Learning gap</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{dailyPlanner.learningGap.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 opacity-80">{dailyPlanner.learningGap.detail}</p>
          </article>

          <Link
            data-testid="daily-revision-signal"
            href={dailyPlanner.revision.href}
            className={cn(
              "rounded-lg border p-5 shadow-sm transition hover:-translate-y-0.5",
              dailyPlanner.revision.urgent
                ? "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]"
                : "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b]"
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/70">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                {dailyPlanner.revision.dueLabel}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">Revise next</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{dailyPlanner.revision.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 opacity-80">{dailyPlanner.revision.detail}</p>
          </Link>

          <Link
            data-testid="daily-today-task"
            href={dailyPlanner.todayTask.href}
            className="rounded-lg border border-[#1a3a2a] bg-[#1a3a2a] p-5 text-white shadow-sm transition hover:-translate-y-0.5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15">
                <Target className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-white/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                {dailyPlanner.todayTask.actionLabel}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">Today&apos;s task</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">{dailyPlanner.todayTask.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/80">{dailyPlanner.todayTask.detail}</p>
          </Link>

          <article
            data-testid="daily-growth-signal"
            className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-[#34453b] shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <LineChart className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-[#f7f4ee] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                {dailyPlanner.growth.meTimeLabel}
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Growth trend</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-[#13251d]">{dailyPlanner.growth.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">{dailyPlanner.growth.detail}</p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-[#085041]">
              {dailyPlanner.growth.metricLabel}
            </p>
          </article>
        </section>

        <section
          data-testid="daily-session-readiness"
          data-readiness-status={dailyPlanner.sessionReadiness.statusLabel}
          data-readiness-score={dailyPlanner.sessionReadiness.scorePercent}
          className={cn("rounded-lg border p-5 shadow-sm md:p-6", readinessTone(dailyPlanner.sessionReadiness.tone))}
        >
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/80">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-white/80 px-2.5 py-1.5 text-xs font-black uppercase tracking-[0.12em]">
                  {dailyPlanner.sessionReadiness.scorePercent}%
                </span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
                Before session readiness
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
                {dailyPlanner.sessionReadiness.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 opacity-85">
                {dailyPlanner.sessionReadiness.detail}
              </p>
              <Link
                href={dailyPlanner.sessionReadiness.href}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
              >
                {dailyPlanner.sessionReadiness.actionLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {dailyPlanner.sessionReadiness.checklist.map((item) => (
                <div key={item.label} className={cn("min-h-28 rounded-md border p-3", checklistTone(item.status))}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em]">{item.status}</p>
                    {item.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                    ) : item.status === "repair" ? (
                      <RefreshCcw className="h-4 w-4 text-[#ef9f27]" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#8a8174]" />
                    )}
                  </div>
                  <h3 className="text-sm font-black leading-5 text-[#13251d]">{item.label}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 opacity-80">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Link
          data-testid="daily-tomorrow-adjustment"
          data-adjustment-status={dailyPlanner.tomorrowAdjustment.statusLabel}
          href={dailyPlanner.tomorrowAdjustment.href}
          className="grid gap-4 rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-4 text-[#085041] shadow-sm transition hover:-translate-y-0.5 md:grid-cols-[auto_1fr_auto] md:items-center md:p-5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-[#085041]">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Tomorrow auto-adjusts from today&apos;s evidence
            </span>
            <span className="mt-1 block break-words text-xl font-black tracking-tight text-[#13251d]">
              {dailyPlanner.tomorrowAdjustment.title}
            </span>
            <span className="mt-1 block break-words text-sm font-semibold leading-6 text-[#49675e]">
              {dailyPlanner.tomorrowAdjustment.detail}
            </span>
          </span>
          <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-xs font-black uppercase tracking-[0.12em] text-white">
            {dailyPlanner.tomorrowAdjustment.statusLabel} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <section
          data-testid="daily-next-session-proof"
          data-source-day={dailyPlanner.nextSessionProof.sourceDay}
          data-target-day={dailyPlanner.nextSessionProof.targetDay}
          data-decision={dailyPlanner.nextSessionProof.decision}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Next-session proof
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
                Day {dailyPlanner.nextSessionProof.sourceDay} evidence chose Day {dailyPlanner.nextSessionProof.targetDay}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {dailyPlanner.nextSessionProof.evidenceSummary}
              </p>
              <p className="mt-3 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 text-xs font-bold leading-5 text-[#31443a]">
                Rule: {dailyPlanner.nextSessionProof.adjustmentRule}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {dailyPlanner.nextSessionProof.evidence.map((item) => (
                <div key={item.label} className={cn("min-h-24 rounded-md border p-3", proofTone(item.status))}>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em]">{item.status}</p>
                  <h3 className="mt-2 text-sm font-black leading-5 text-[#13251d]">{item.label}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="daily-auto-session-handoff"
          data-proof-rule={automaticHandoff.proofRule}
          data-handoff-id={automaticHandoff.id}
          data-subject-slug={automaticHandoff.subjectSlug}
          data-source-day={automaticHandoff.sourceDay}
          data-target-day={automaticHandoff.targetDay}
          data-target-title={automaticHandoff.targetTitle}
          data-status-label={automaticHandoff.statusLabel}
          data-href={automaticHandoff.href}
          data-action-label={automaticHandoff.actionLabel}
          data-can-advance={String(automaticHandoff.canAdvance)}
          data-evidence-used={automaticHandoff.evidenceUsed}
          data-evidence-missing={automaticHandoff.evidenceMissing}
          data-blockers={automaticHandoff.blockers}
          data-readiness-status={automaticHandoff.readinessStatus}
          data-readiness-score={automaticHandoff.readinessScorePercent}
          data-learning-gap={automaticHandoff.learningGapTitle}
          data-revision-due={automaticHandoff.revisionDueLabel}
          data-report-href={automaticHandoff.reportHref}
          data-question-bank-href={automaticHandoff.questionBankHref}
          data-saved-at={autoHandoffSavedAt}
          className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm md:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-white text-[#085041]">
                <Save className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Auto-created next session
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
                {automaticHandoff.canAdvance
                  ? `Day ${automaticHandoff.targetDay} is ready to open`
                  : `Stay on ${automaticHandoff.statusLabel}`}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                {automaticHandoff.studentInstruction}
              </p>
              <p className="mt-3 rounded-md border border-[#b9d9cd] bg-white/75 p-3 text-xs font-bold leading-5 text-[#31443a]">
                Saved handoff: {automaticHandoff.id}
                {autoHandoffSavedAt ? ` at ${new Date(autoHandoffSavedAt).toLocaleTimeString("en-IN")}` : ""}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Target", `Day ${automaticHandoff.targetDay}: ${automaticHandoff.targetTitle}`],
                ["Evidence", `${automaticHandoff.evidenceUsed} used / ${automaticHandoff.evidenceMissing} missing`],
                ["Blockers", automaticHandoff.blockers],
                ["Readiness", `${automaticHandoff.readinessStatus} / ${automaticHandoff.readinessScorePercent}%`],
                ["Gap", automaticHandoff.learningGapTitle],
                ["Revision", automaticHandoff.revisionDueLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#b9d9cd] bg-white/75 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">{label}</p>
                  <p className="mt-1 text-sm font-black leading-5 text-[#13251d]">{value}</p>
                </div>
              ))}
              <Link
                href={automaticHandoff.href}
                data-testid="daily-auto-session-handoff-action"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
              >
                {automaticHandoff.actionLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href={automaticHandoff.reportHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#b9d9cd] bg-white/75 px-3 text-xs font-black uppercase tracking-[0.12em] text-[#085041] transition hover:bg-white"
                >
                  Reports <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={automaticHandoff.questionBankHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#b9d9cd] bg-white/75 px-3 text-xs font-black uppercase tracking-[0.12em] text-[#085041] transition hover:bg-white"
                >
                  MCQ bank <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {dailyPlanner.teacherDoubt ? (
          <section
            data-testid="daily-teacher-doubt-plan"
            className="rounded-lg border border-[#ef9f27]/50 bg-[#fff8e8] p-5 text-[#5d3a05] shadow-sm md:p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a6a16]">
                  AI teacher gap
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
                  Day {dailyPlanner.teacherDoubt.day}: {dailyPlanner.teacherDoubt.category}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6">{dailyPlanner.teacherDoubt.reason}</p>
              </div>
              <Link
                href={dailyPlanner.teacherDoubt.href}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
              >
                {labelForDailyDoubt(dailyPlanner.teacherDoubt.href)} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-[#ef9f27]/35 bg-white/70 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9a6a16]">Repair action</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#34453b]">{dailyPlanner.teacherDoubt.repairAction}</p>
              </div>
              <div className="rounded-md border border-[#ef9f27]/35 bg-white/70 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9a6a16]">Mastery check</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#34453b]">{dailyPlanner.teacherDoubt.masteryCheck}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section
          id="daily-me-time-checkin"
          data-testid="daily-me-time-checkin"
          data-active-mood={activeProgress?.meTimeMood ?? "pending"}
          data-completed={activeProgress?.meTimeCompletedAt ? "true" : "false"}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <HeartPulse className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Me-time before class
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#13251d]">
                Start with the student&apos;s mind-state.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                This check-in is saved to the selected subject/day and becomes part of growth reports.
              </p>
              <div className="mt-4 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Current reset</p>
                <p className="mt-1 text-sm font-bold leading-6 text-[#31443a]">
                  {activeMeTimeOption?.resetPlan ?? "Choose a state once before opening the next class action."}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {meTimeOptions.map((option) => {
                const isActive = activeProgress?.meTimeMood === option.mood;

                return (
                  <button
                    key={option.mood}
                    type="button"
                    data-testid={`daily-me-time-${option.mood}`}
                    aria-pressed={isActive}
                    onClick={() => saveMeTime(option)}
                    className={cn(
                      "min-h-24 rounded-md border p-3 text-left transition hover:-translate-y-0.5",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block text-sm font-black leading-5">{option.label}</span>
                    <span className="mt-2 block text-xs font-semibold leading-5 opacity-80">{option.detail}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {(meTimeSaved || activeProgress?.meTimeCompletedAt) && (
            <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
              <p className="text-sm font-bold leading-6 text-[#085041]">
                Me-time saved for {activeSubject.title} Day {activeSession.day}. Growth and reports will include this check.
              </p>
            </div>
          )}
        </section>

        <section
          data-testid="global-next-action-queue"
          className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Global next action</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">What should be done now?</h2>
            </div>
            <Target className="h-6 w-6 text-[#085041]" />
          </div>

          {actionQueue.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#dcd5c7] bg-[#fdfaf3] p-5 text-sm font-bold leading-6 text-[#746f66]">
              No pending action found in local storage. The queue will populate as subjects, labs, Talk checks, and fresh MCQ batches move.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {actionQueue.map((item, index) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn("min-h-36 rounded-md border p-4 transition hover:-translate-y-0.5", item.tone)}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-75">
                        {index + 1}. {item.subjectWindow}
                      </p>
                      <h3 className="mt-1 break-words text-sm font-black leading-5">{item.subjectTitle}</h3>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">
                    Day {item.day} / {item.room}
                  </p>
                  <p className="mt-2 break-words text-sm font-black leading-5">{item.statusLabel}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 opacity-80">{item.detail}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em]">
                    {item.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Mission selector</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Choose subject and day</h2>
              </div>
              <CalendarDays className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {dailySubjects.map((subject) => {
                const isActive = activeSubject.slug === subject.slug;
                return (
                  <button
                    key={subject.slug}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectSubject(subject.slug)}
                    className={cn(
                      "min-h-20 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block text-xs font-black uppercase tracking-[0.14em]">{subject.window}</span>
                    <span className="mt-2 block text-sm font-black leading-5">{subject.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">{subject.sessions.length} days</span>
                  </button>
                );
              })}
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {activeSubject.sessions.map((session) => {
                const progress = getProgress(activeSubject, session);
                const contentReadyForDay = isContentReady(getContentState(activeSubject, session));
                const mcqCommandForDay = isUpscMcqCommandCleared(progress, batchCode(activeSubject, session));
                const isActive = activeSession.day === session.day;

                return (
                  <button
                    key={session.day}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectDay(session.day)}
                    className={cn(
                      "min-h-24 min-w-0 rounded-md border p-3 text-left transition",
                      isActive
                        ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                        : progress?.revisitQueued
                          ? "border-[#ef9f27]/50 bg-[#fff4df] text-[#6f4a12] hover:border-[#ef9f27]"
                          : contentReadyForDay && mcqCommandForDay
                            ? "border-[#1d9e75]/40 bg-[#e7f5ee] text-[#085041] hover:border-[#1d9e75]"
                            : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                    )}
                  >
                    <span className="block break-words text-xs font-black uppercase tracking-[0.16em]">
                      {batchCode(activeSubject, session)}
                    </span>
                    <span className="mt-2 block break-words text-sm font-bold leading-5">{session.title}</span>
                    <span className="mt-2 block text-xs font-semibold opacity-75">
                      {progress?.revisitQueued
                        ? "Revisit queued"
                        : progress?.watched
                          ? "Watched"
                          : contentReadyForDay
                            ? "Content ready"
                            : "Start here"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid min-w-0 gap-5">
            <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Today loop</p>
                  <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Move through the class sequence</h2>
                </div>
                <Target className="h-6 w-6 text-[#085041]" />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    label: "Watch",
                    detail: activeProgress?.watched ? "Watched" : contentReady ? "Ready to watch" : "Content pending",
                    href: `${basePath}/watch?day=${activeSession.day}`,
                    icon: PlayCircle,
                    active: true,
                  },
                  {
                    label: "Talk",
                    detail: activeProgress?.reflection ? "Reflection saved" : "Explain after watch",
                    href: `${basePath}/talk?day=${activeSession.day}`,
                    icon: BrainCircuit,
                    active: Boolean(activeProgress?.watched),
                  },
                  {
                    label: "Lab",
                    detail: activeSession.lab,
                    href: `${basePath}/lab?mode=${activeLabSlug}&day=${activeSession.day}`,
                    icon: Layers3,
                    active: Boolean(activeLabSlug),
                  },
                  {
                    label: "MCQ",
                    detail: activeMcqCommand
                      ? `Command ${activeProgress?.mcqScorePercent ?? 0}%`
                      : activeProgress?.mcqOutcome === "Revisit"
                        ? "Revisit required"
                        : activeMcqBatch.ready
                          ? "Practice pending"
                          : `${activeMcqBatch.drafted}/${activeMcqBatch.planned} drafted`,
                    href: `${basePath}/mcq-readiness?day=${activeSession.day}`,
                    icon: ClipboardCheck,
                    active: true,
                  },
                  {
                    label: "Track",
                    detail: "Subject progress",
                    href: `${basePath}/track`,
                    icon: LineChart,
                    active: true,
                  },
                  {
                    label: "Revisit",
                    detail: activeProgress?.revisitQueued ? "Repair now" : "Recovery room",
                    href: `${basePath}/revisit?day=${activeSession.day}`,
                    icon: RefreshCcw,
                    active: true,
                  },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "group flex min-h-16 items-center gap-3 rounded-md border px-3 text-left transition hover:-translate-y-0.5",
                      item.active
                        ? "border-[#dcd5c7] bg-[#f7f4ee] text-[#1a3a2a] hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
                        : "pointer-events-none border-[#dcd5c7] bg-[#f7f4ee] text-[#8a8174] opacity-60"
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#085041] group-hover:bg-[#1d9e75] group-hover:text-white">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black leading-5">{item.label}</span>
                      <span className="mt-0.5 block break-words text-xs font-semibold opacity-70">{item.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Daily note</p>
                  <p className="text-xs font-semibold text-[#746f66]">Saved locally for the selected mission</p>
                </div>
              </div>

              <textarea
                value={dailyState.note ?? ""}
                onChange={(event) => {
                  setDailyState((current) => ({ ...current, note: event.target.value }));
                  setSaved(false);
                }}
                placeholder="Write today's target, doubt, or class instruction here."
                className="min-h-28 w-full resize-y rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 text-sm font-semibold leading-6 text-[#25382f] outline-none transition placeholder:text-[#8a8174] focus:border-[#1d9e75] focus:ring-2 focus:ring-[#1d9e75]/20"
              />

              <button
                type="button"
                onClick={saveNote}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
              >
                <Save className="h-4 w-4" /> Save daily mission
              </button>
              {saved && (
                <div className="mt-4 flex items-start gap-3 rounded-md bg-[#e7f5ee] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <p className="text-sm font-bold leading-6 text-[#085041]">Daily mission saved locally.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Global controls</p>
              <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Jump to command centers</h2>
            </div>
            <Gauge className="h-6 w-6 text-[#085041]" />
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ["Prelims Showcase", "/upsc/prelims-2026-showcase"],
              ["Content Command", "/upsc/content-command"],
              ["MCQ Command", "/upsc/mcq-command"],
              ["Revision Command", "/upsc/revision-command"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-[#f7f4ee] px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#e7f5ee]"
              >
                {label} <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
