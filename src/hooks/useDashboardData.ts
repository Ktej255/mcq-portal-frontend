"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildDailyPlannerDecision,
  type DailyPlannerProgress,
} from "@/lib/upsc/dailyPlannerEngine";
import {
  readLocalQuestionBankAttempts,
} from "@/lib/upsc/questionBankEngine";
import {
  getCurrentGeographyTopic,
} from "@/lib/upsc/guidedStudy";
import {
  defaultStudentProfile,
  readStudentProfile,
  readSyncedStudentProfile,
  saveStudentProfile,
  type StudentProfile,
} from "@/lib/upsc/studentProfile";
import {
  readLocalStudentReportProgress,
  studentReportSubjects,
  type StudentReportProgressMap,
} from "@/lib/upsc/studentReportEngine";
import {
  useGeographyProgress,
  type GeographyMeTimeMood,
} from "@/lib/upsc/useGeographyProgress";

const dailyMissionStorageKey = "sarit-upsc-daily-command-v1";

type DailyMissionState = {
  subjectSlug: string;
  day: number;
  note?: string;
  updatedAt?: string;
};

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

const meTimeResetPlans: Record<GeographyMeTimeMood, string> = {
  calm: "Start directly with one clean recall line, then open the main task.",
  focused: "Use the main action now and keep every side link closed for the first 15 minutes.",
  tired: "Do one 60-second breathing reset, reduce note-taking, and complete only the first task.",
  overloaded: "Ignore the drawer today; finish only the main action and stop after the feedback.",
  "low-confidence": "Begin with one easy explanation, accept repair feedback, then retry once.",
  "exam-stress": "Ground for 60 seconds, say the static base slowly, then start without checking extra pages.",
};

export function useDashboardData() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [draft, setDraft] = useState<StudentProfile>(defaultStudentProfile);
  const [localWelcomeVideoCompleted, setLocalWelcomeVideoCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("sarit-upsc-welcome-video-completed-v1") === "true";
    }
    return false;
  });

  const isWelcomeVideoCompleted = profile ? Boolean(profile.welcomeVideoCompleted) : localWelcomeVideoCompleted;

  const [dailyMissionState, setDailyMissionState] = useState<DailyMissionState>({
    subjectSlug: "geography",
    day: 0,
  });
  const [progressBySubject, setProgressBySubject] = useState<Record<string, StudentReportProgressMap>>({});
  const [questionBankAttemptsBySubject, setQuestionBankAttemptsBySubject] = useState<
    Record<string, ReturnType<typeof readLocalQuestionBankAttempts>>
  >({});

  const { progress, saveDayProgress, stats } = useGeographyProgress();
  const geographyQuestionBankAttempts = questionBankAttemptsBySubject.geography ?? [];
  const today = getCurrentGeographyTopic(progress, geographyQuestionBankAttempts);

  // Active mission subject
  const activeMissionSubject =
    studentReportSubjects.find((subject) => subject.slug === dailyMissionState.subjectSlug) ??
    studentReportSubjects[0];
  const activeMissionDay = Math.min(
    Math.max(
      dailyMissionState.day || (activeMissionSubject.slug === "geography" ? today.day : 1),
      1
    ),
    activeMissionSubject.sessions.length
  );
  const activeMissionSession =
    activeMissionSubject.sessions.find((session) => session.day === activeMissionDay) ??
    activeMissionSubject.sessions[0];

  // Progress for active mission
  const activeMissionProgressMap = (
    activeMissionSubject.slug === "geography"
      ? progress
      : progressBySubject[activeMissionSubject.slug] ?? {}
  ) as Record<string, DailyPlannerProgress | undefined>;
  const activeMissionProgress = activeMissionProgressMap[String(activeMissionDay)];
  const activeMissionQuestionBankAttempts =
    questionBankAttemptsBySubject[activeMissionSubject.slug] ?? [];

  // Build planner decision
  const activeMissionDecision = useMemo(
    () =>
      buildDailyPlannerDecision({
        subjectSlug: activeMissionSubject.slug,
        sessions: activeMissionSubject.sessions,
        selectedDay: activeMissionDay,
        progress: activeMissionProgressMap,
        profile,
        questionBankAttempts: activeMissionQuestionBankAttempts,
      }),
    [
      activeMissionDay,
      activeMissionProgressMap,
      activeMissionQuestionBankAttempts,
      activeMissionSubject.sessions,
      activeMissionSubject.slug,
      profile,
    ]
  );

  const activeMissionReadiness = activeMissionDecision.sessionReadiness;
  const activeMissionHref = activeMissionReadiness.href.startsWith("#")
    ? `/upsc/daily-command${activeMissionReadiness.href}`
    : activeMissionReadiness.href;

  const meTimeDone = Boolean(activeMissionProgress?.meTimeCompletedAt);

  // Streak calculation: count consecutive days with me-time completed, working backward
  const streakCount = useMemo(() => {
    let streak = 0;
    const totalSessions = activeMissionSubject.sessions.length;
    for (let d = activeMissionDay; d >= 1; d--) {
      const dayProgress = activeMissionProgressMap[String(d)];
      if (dayProgress?.meTimeCompletedAt || dayProgress?.watched || dayProgress?.mcqCompleted) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [activeMissionDay, activeMissionProgressMap, activeMissionSubject.sessions.length]);

  // Load data from localStorage + Supabase
  useEffect(() => {
    let cancelled = false;
    const restoreProfile = window.setTimeout(() => {
      const saved = readStudentProfile();
      setDailyMissionState(
        readJson<DailyMissionState>(dailyMissionStorageKey, { subjectSlug: "geography", day: 0 })
      );
      setProgressBySubject(
        Object.fromEntries(
          studentReportSubjects.map((subject) => [
            subject.slug,
            readLocalStudentReportProgress(subject.slug),
          ])
        )
      );
      setQuestionBankAttemptsBySubject(
        Object.fromEntries(
          studentReportSubjects.map((subject) => [
            subject.slug,
            readLocalQuestionBankAttempts(subject.slug),
          ])
        )
      );

      if (saved) {
        setProfile(saved);
        setDraft(saved);
      }
      setIsLoaded(true);

      void readSyncedStudentProfile().then((syncedProfile) => {
        if (!syncedProfile || cancelled) return;
        setProfile(syncedProfile);
        setDraft(syncedProfile);
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(restoreProfile);
    };
  }, []);

  // Save profile
  const saveProfile = (nextDraft: StudentProfile = draft) => {
    const nextProfile = {
      ...nextDraft,
      welcomeVideoCompleted:
        nextDraft.welcomeVideoCompleted ||
        localWelcomeVideoCompleted ||
        (profile ? profile.welcomeVideoCompleted : false),
      updatedAt: new Date().toISOString(),
    };
    const normalizedProfile = saveStudentProfile(nextProfile);
    setProfile(normalizedProfile);
    setDraft(normalizedProfile);
  };

  // Welcome video completion
  const handleCompleteWelcomeVideo = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sarit-upsc-welcome-video-completed-v1", "true");
    }
    setLocalWelcomeVideoCompleted(true);
    if (profile) {
      saveProfile({
        ...profile,
        welcomeVideoCompleted: true,
      });
    }
  };

  // Induction helpers
  const updateInductionStep = (step: "syllabus" | "booklist" | "quiz", isDone: boolean) => {
    if (!profile) return;
    const patch: Partial<StudentProfile> = {};
    if (step === "syllabus") patch.inductionSyllabusCompleted = isDone;
    if (step === "booklist") patch.inductionBooklistCompleted = isDone;
    if (step === "quiz") patch.inductionQuizCompleted = isDone;
    saveProfile({ ...profile, ...patch });
  };

  const completeInduction = (skipped: boolean = false) => {
    if (!profile) return;
    saveProfile({
      ...profile,
      inductionSyllabusCompleted: skipped ? true : profile.inductionSyllabusCompleted,
      inductionBooklistCompleted: skipped ? true : profile.inductionBooklistCompleted,
      inductionQuizCompleted: skipped ? true : profile.inductionQuizCompleted,
      inductionCompleted: true,
    });
  };

  // Me-time mood save
  const saveMeTimeCheck = (mood: GeographyMeTimeMood) => {
    const patch = {
      meTimeCompletedAt: new Date().toISOString(),
      meTimeMood: mood,
      meTimeResetPlan: meTimeResetPlans[mood],
    };

    if (activeMissionSubject.slug === "geography") {
      saveDayProgress(activeMissionDay, patch);
      return;
    }

    setProgressBySubject((current) => {
      const key = String(activeMissionDay);
      const currentSubjectProgress = current[activeMissionSubject.slug] ?? {};
      const nextSubjectProgress = {
        ...currentSubjectProgress,
        [key]: {
          ...currentSubjectProgress[key],
          day: activeMissionDay,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      };
      window.localStorage.setItem(
        `sarit-upsc-${activeMissionSubject.slug}-progress-v1`,
        JSON.stringify(nextSubjectProgress)
      );
      return {
        ...current,
        [activeMissionSubject.slug]: nextSubjectProgress,
      };
    });
  };

  return {
    // Loading state
    isLoaded,

    // Profile
    profile,
    draft,
    setDraft,
    saveProfile,

    // Onboarding gates
    isWelcomeVideoCompleted,
    handleCompleteWelcomeVideo,
    updateInductionStep,
    completeInduction,

    // Active mission
    activeMissionSubject,
    activeMissionDay,
    activeMissionSession,
    activeMissionReadiness,
    activeMissionHref,
    activeMissionDecision,
    activeMissionProgress,

    // Me-time
    meTimeDone,
    saveMeTimeCheck,

    // Stats
    streakCount,
    geographyStats: stats,
  };
}
