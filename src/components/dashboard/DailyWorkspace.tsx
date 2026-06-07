"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  RefreshCcw,
  Save,
  Target,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buildDailyPlannerDecision, type DailyPlannerProgress } from "@/lib/upsc/dailyPlannerEngine";
import {
  buildGeographyDailyPath,
  getCurrentGeographyTopic,
  getGuidedStudyEntryRoute,
  getGuidedStudySteps,
  getGuidedStudyStrategy,
} from "@/lib/upsc/guidedStudy";
import { geographySessions, upscCalendar } from "@/lib/upsc/plan";
import {
  buildStudentPlan,
  defaultStudentProfile,
  studentLevelForPreparationStage,
  profilePlanLine,
  readStudentProfile,
  readSyncedStudentProfile,
  saveStudentProfile,
  type LearningStyle,
  type LearningPattern,
  type MindState,
  type PreparationStage,
  type StudentProfile,
  type StudyTime,
  type StudyWindow,
  type WeakSignal,
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

const subjectRoadmap = upscCalendar.filter(({ href }) =>
  [
    "/upsc/geography",
    "/upsc/environment",
    "/upsc/disaster-management",
    "/upsc/economy",
    "/upsc/science-tech",
    "/upsc/polity-governance",
    "/upsc/internal-security-society",
    "/upsc/history",
  ].includes(href)
);

const optionClass = (active: boolean) =>
  active
    ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
    : "border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]";

const preparationOptions: Array<{
  value: PreparationStage;
  level: "Beginner" | "Intermediate" | "Advanced";
  label: string;
  detail: string;
}> = [
  {
    value: "not-started",
    level: "Beginner",
    label: "I am starting my UPSC preparation now",
    detail: "No preparation yet. The portal starts with one 10-15 minute topic, then Talk to 95%, then MCQ.",
  },
  {
    value: "coaching-complete",
    level: "Intermediate",
    label: "I completed coaching and want a self-study path",
    detail: "Coaching is done. You explain first; the AI opens only the missing UPSC repair.",
  },
  {
    value: "multiple-attempts",
    level: "Advanced",
    label: "I attempted UPSC Prelims two or more times and need a recovery path",
    detail: "Two or more attempts. You speak first; the AI diagnoses attempt-level traps and moves to command.",
  },
];

const classificationProof: Record<
  PreparationStage,
  { title: string; route: string; detail: string }
> = {
  "not-started": {
    title: "Identified as Beginner",
    route: "Lesson -> Talk 95% -> MCQ -> next topic",
    detail: "You have not started preparation, so the portal teaches one short topic before asking you to explain.",
  },
  "coaching-complete": {
    title: "Identified as Intermediate",
    route: "Diagnosis -> repair only if needed -> MCQ",
    detail: "You completed coaching, so the portal checks what you already know before opening any lesson.",
  },
  "multiple-attempts": {
    title: "Identified as Advanced",
    route: "Attempt-gap diagnosis -> precision repair -> MCQ",
    detail: "You have two or more attempts, so the portal hunts for traps, exceptions, and weak recall patterns first.",
  },
};

const meTimeResetPlans: Record<GeographyMeTimeMood, string> = {
  calm: "Start directly with one clean recall line, then open the main task.",
  focused: "Use the main action now and keep every side link closed for the first 15 minutes.",
  tired: "Do one 60-second breathing reset, reduce note-taking, and complete only the first task.",
  overloaded: "Ignore the drawer today; finish only the main action and stop after the feedback.",
  "low-confidence": "Begin with one easy explanation, accept repair feedback, then retry once.",
  "exam-stress": "Ground for 60 seconds, say the static base slowly, then start without checking extra pages.",
};

const meTimeMoodOptions: Array<{ value: GeographyMeTimeMood; label: string }> = [
  { value: "calm", label: "calm" },
  { value: "focused", label: "focused" },
  { value: "tired", label: "tired" },
  { value: "overloaded", label: "overloaded" },
  { value: "low-confidence", label: "low confidence" },
  { value: "exam-stress", label: "exam stress" },
];

type DailyMissionState = {
  subjectSlug: string;
  day: number;
  note?: string;
  updatedAt?: string;
};

const dailyMissionStorageKey = "sarit-upsc-daily-command-v1";

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

function getClassificationProof(profile: Pick<StudentProfile, "preparationStage">) {
  return classificationProof[profile.preparationStage];
}

export const DailyWorkspace = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [draft, setDraft] = useState<StudentProfile>(defaultStudentProfile);
  const [dailyMissionState, setDailyMissionState] = useState<DailyMissionState>({ subjectSlug: "geography", day: 0 });
  const [progressBySubject, setProgressBySubject] = useState<Record<string, StudentReportProgressMap>>({});
  const { progress, saveDayProgress } = useGeographyProgress();
  const today = getCurrentGeographyTopic(progress);
  const dailyPath = useMemo(() => (profile ? buildGeographyDailyPath(profile, progress) : []), [profile, progress]);
  const pathSteps = getGuidedStudySteps(profile?.level ?? "beginner");
  const personalPlan = useMemo(() => (profile ? buildStudentPlan(profile) : null), [profile]);
  const activeClassificationProof = profile ? getClassificationProof(profile) : null;
  const dashboardPathSteps = [
    ...pathSteps,
    {
      id: "next",
      label: "Next",
      detail: "The system opens the next topic after MCQ.",
    },
  ];
  const activeMissionSubject =
    studentReportSubjects.find((subject) => subject.slug === dailyMissionState.subjectSlug) ?? studentReportSubjects[0];
  const activeMissionDay = Math.min(
    Math.max(dailyMissionState.day || (activeMissionSubject.slug === "geography" ? today.day : 1), 1),
    activeMissionSubject.sessions.length
  );
  const activeMissionSession =
    activeMissionSubject.sessions.find((session) => session.day === activeMissionDay) ?? activeMissionSubject.sessions[0];
  const activeMissionProgressMap = (
    activeMissionSubject.slug === "geography" ? progress : progressBySubject[activeMissionSubject.slug] ?? {}
  ) as Record<string, DailyPlannerProgress | undefined>;
  const activeMissionProgress = activeMissionProgressMap[String(activeMissionDay)];
  const meTimeDone = Boolean(activeMissionProgress?.meTimeCompletedAt);
  const activeMissionDecision = useMemo(
    () =>
      buildDailyPlannerDecision({
        subjectSlug: activeMissionSubject.slug,
        sessions: activeMissionSubject.sessions,
        selectedDay: activeMissionDay,
        progress: activeMissionProgressMap,
        profile,
      }),
    [activeMissionDay, activeMissionProgressMap, activeMissionSubject.sessions, activeMissionSubject.slug, profile]
  );
  const activeMissionReadiness = activeMissionDecision.sessionReadiness;
  const activeMissionHref = activeMissionReadiness.href.startsWith("#")
    ? `/upsc/daily-command${activeMissionReadiness.href}`
    : activeMissionReadiness.href;
  const activeMissionTrackHref = `/upsc/${activeMissionSubject.slug}/track?day=${activeMissionDay}`;

  useEffect(() => {
    let cancelled = false;
    const restoreProfile = window.setTimeout(() => {
      const saved = readStudentProfile();
      setDailyMissionState(readJson<DailyMissionState>(dailyMissionStorageKey, { subjectSlug: "geography", day: 0 }));
      setProgressBySubject(
        Object.fromEntries(
          studentReportSubjects.map((subject) => [subject.slug, readLocalStudentReportProgress(subject.slug)])
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

  const signalCards = useMemo(
    () => [
      {
        label: "Learning Gap",
        title: activeMissionDecision.learningGap.title,
        detail: activeMissionDecision.learningGap.detail,
        href: activeMissionDecision.teacherDoubt?.href ?? activeMissionHref,
        icon: Target,
      },
      {
        label: "Next Revision",
        title: activeMissionDecision.revision.title,
        detail: activeMissionDecision.revision.detail,
        href: activeMissionDecision.revision.href,
        icon: RefreshCcw,
      },
      {
        label: "Current Path",
        title: activeMissionDecision.growth.title,
        detail: `${activeMissionDecision.growth.metricLabel}. ${activeMissionDecision.growth.detail}`,
        href: activeMissionTrackHref,
        icon: BarChart3,
      },
    ],
    [
      activeMissionDecision.growth.detail,
      activeMissionDecision.growth.metricLabel,
      activeMissionDecision.growth.title,
      activeMissionDecision.learningGap.detail,
      activeMissionDecision.learningGap.title,
      activeMissionDecision.revision.detail,
      activeMissionDecision.revision.href,
      activeMissionDecision.revision.title,
      activeMissionDecision.teacherDoubt?.href,
      activeMissionHref,
      activeMissionTrackHref,
    ]
  );

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
      window.localStorage.setItem(`sarit-upsc-${activeMissionSubject.slug}-progress-v1`, JSON.stringify(nextSubjectProgress));
      return {
        ...current,
        [activeMissionSubject.slug]: nextSubjectProgress,
      };
    });
  };

  const saveProfile = (nextDraft: StudentProfile = draft) => {
    const nextProfile = { ...nextDraft, updatedAt: new Date().toISOString() };
    const normalizedProfile = saveStudentProfile(nextProfile);
    setProfile(normalizedProfile);
    setDraft(normalizedProfile);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Opening UPSC workspace...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 md:px-8">
        {profile ? (
          <section
            data-testid="upsc-simple-dashboard"
            data-student-level={profile.level}
            data-preparation-stage={profile.preparationStage}
            data-next-action-room={activeMissionReadiness.statusLabel}
            data-next-action-href={activeMissionHref}
            data-visible-mode="four-signal-one-action"
            data-essential-signal-count="4"
            data-essential-signals="todays-task|learning-gap|next-revision|current-path"
            className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                  Student dashboard
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">
                  Today&apos;s study
                </h1>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#657066]">{profilePlanLine(profile)}</p>
                {activeClassificationProof ? (
                  <p
                    data-testid="upsc-classification-proof"
                    className="mt-2 max-w-2xl text-xs font-black uppercase tracking-[0.11em] text-[#085041]"
                  >
                    {activeClassificationProof.title}: {activeClassificationProof.route}
                  </p>
                ) : null}
              </div>
              <Badge data-testid="upsc-profile-level-badge" className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">
                {profile.level}
              </Badge>
            </div>

            <div data-testid="upsc-four-signal-grid" className="space-y-3">
              <article
                data-testid="upsc-signal-todays-task"
                data-signal-priority="primary"
                data-active-subject={activeMissionSubject.slug}
                data-active-day={activeMissionDay}
                data-readiness-status={activeMissionReadiness.statusLabel}
                data-readiness-score={activeMissionReadiness.scorePercent}
                className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-4 shadow-sm md:p-5"
              >
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                        <BrainCircuit className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">
                        Today&apos;s task
                      </span>
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-[#13251d]">
                      {activeMissionSubject.title} Day {activeMissionDay}: {activeMissionReadiness.title}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[#49675e]">
                      {activeMissionReadiness.detail}
                    </p>
                    <p data-testid="upsc-generated-daily-path-summary" className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#1d9e75]">
                      {activeMissionSubject.title} Day {activeMissionDay} of {activeMissionSubject.sessions.length} / {activeMissionSession.title}
                    </p>
                    <div
                      data-testid="upsc-task-readiness-proof"
                      data-active-subject={activeMissionSubject.slug}
                      data-active-day={activeMissionDay}
                      data-readiness-status={activeMissionReadiness.statusLabel}
                      data-readiness-score={activeMissionReadiness.scorePercent}
                      className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-md border border-[#cfe5dc] bg-white/75 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      {activeMissionReadiness.statusLabel} / {activeMissionReadiness.scorePercent}% ready
                    </div>
                    <div
                      data-testid="upsc-me-time-check"
                      data-me-time-status={meTimeDone ? "ready" : "pending"}
                      data-me-time-mood={activeMissionProgress?.meTimeMood ?? ""}
                      data-me-time-reset-plan={activeMissionProgress?.meTimeResetPlan ?? ""}
                      className="mt-3 rounded-lg border border-[#cfe5dc] bg-white/70 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#085041]">
                            60-sec start check
                          </p>
                          <p className="mt-1 text-xs font-bold leading-5 text-[#49675e]">
                            Breathe once, choose your current state, then start the main action.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {meTimeMoodOptions.map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => saveMeTimeCheck(value)}
                              className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black capitalize transition ${
                                activeMissionProgress?.meTimeMood === value
                                  ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                                  : "border-[#dcd5c7] bg-white text-[#31443a] hover:border-[#1d9e75]"
                              }`}
                            >
                              {activeMissionProgress?.meTimeMood === value ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p
                        data-testid="upsc-me-time-reset-plan"
                        className="mt-3 rounded-md border border-[#dcd5c7] bg-white px-3 py-2 text-xs font-bold leading-5 text-[#49675e]"
                      >
                        {activeMissionProgress?.meTimeResetPlan ?? "Pick one state so the portal saves a simple start-readiness plan."}
                      </p>
                    </div>
                    <details
                      data-testid="upsc-main-path-strip"
                      className="mt-4 rounded-lg border border-[#cfe5dc] bg-white/70 p-3 text-xs font-black text-[#31443a]"
                    >
                      <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.16em] text-[#085041]">
                        How today will flow
                      </summary>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {dashboardPathSteps.map((step, index) => (
                          <div key={step.id} className="rounded-md bg-white px-3 py-2">
                            <span className="text-[#1d9e75]">{index + 1}.</span> {step.label}
                            <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#746f66]">
                              {step.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                    <p
                      data-testid="upsc-one-action-rule"
                      className="mt-3 text-xs font-bold leading-5 text-[#49675e]"
                    >
                      Use the main button only. The portal decides the next step after each result.
                    </p>
                    <div
                      data-testid="upsc-after-this-step"
                      data-next-session-decision={activeMissionDecision.nextSessionProof.decision}
                      data-source-day={activeMissionDecision.nextSessionProof.sourceDay}
                      data-target-day={activeMissionDecision.nextSessionProof.targetDay}
                      data-next-route={activeMissionDecision.tomorrowAdjustment.href}
                      data-evidence-summary={activeMissionDecision.nextSessionProof.evidenceSummary}
                      data-adjustment-rule={activeMissionDecision.nextSessionProof.adjustmentRule}
                      className="mt-3 rounded-md border border-[#cfe5dc] bg-white/75 px-3 py-2 text-xs font-bold leading-5 text-[#49675e]"
                    >
                      <span className="font-black uppercase tracking-[0.12em] text-[#085041]">After this: </span>
                      {activeMissionDecision.tomorrowAdjustment.title}
                    </div>
                  </div>
                  <Link
                    href={activeMissionHref}
                    data-testid="upsc-start-today"
                    data-student-level={profile.level}
                    data-next-action-room={activeMissionReadiness.statusLabel}
                    data-session-readiness={meTimeDone ? "ready" : "check-pending"}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d] md:w-auto"
                  >
                    {activeMissionReadiness.actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>

              <div className="grid gap-3 md:grid-cols-3">
                {signalCards.map((card) => (
                  <Link
                    key={card.label}
                    href={card.href}
                    data-testid={`upsc-signal-${card.label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "")}`}
                    className="rounded-lg border border-[#dcd5c7] bg-white p-4 shadow-sm transition hover:border-[#1d9e75]/60 hover:bg-[#fdfaf3]"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                        <card.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                        {card.label}
                      </span>
                    </div>
                    <h2 className="text-base font-black tracking-tight text-[#13251d]">{card.title}</h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#657066]">{card.detail}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {!profile ? (
          <ProfileForm
            draft={draft}
            setDraft={setDraft}
            saveProfile={saveProfile}
            variant="initial"
          />
        ) : null}

        {profile ? (
          <details
            data-testid="upsc-planning-drawer"
            className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
          >
            <summary className="cursor-pointer list-none text-sm font-black text-[#13251d]">
              Optional planning drawer
              <span className="ml-2 text-xs font-semibold text-[#756f64]">
                Profile edit, day flow, and 12-month path stay here to keep the main screen light.
              </span>
            </summary>

            <ProfileForm
              draft={draft}
              setDraft={setDraft}
              saveProfile={saveProfile}
              profile={profile}
              variant="drawer"
            />

            <section data-testid="upsc-today-task" className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
              {personalPlan ? (
                <div
                  data-testid="upsc-personal-plan-rules"
                  className="mb-4 grid gap-2 rounded-lg border border-[#cfe5dc] bg-white p-3 md:grid-cols-2"
                >
                  {[
                    ["Daily loop", personalPlan.dailyLoop],
                    ["First action", personalPlan.firstAction],
                    ["Repair rule", personalPlan.repairRule],
                    ["Revision rule", personalPlan.revisionRule],
                    ["Attempt rule", personalPlan.attemptRule],
                    ["Pattern rule", personalPlan.patternRule],
                    ["Mind rule", personalPlan.psychologyRule],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-[#31443a]">{value}</p>
                    </div>
                  ))}
                  <div className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3 md:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      Personal path
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#31443a]">
                      {personalPlan.levelStrategy}. {personalPlan.timeRule}
                    </p>
                  </div>
                </div>
              ) : null}
              <div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Current study flow</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#13251d]">{today.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">{today.anchor}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-5">
                {pathSteps.map((step, index) => (
                  <article
                    key={step.label}
                    data-testid={`upsc-day-step-${step.id}`}
                    className="rounded-lg border border-[#dcd5c7] bg-white p-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e7f5ee] text-xs font-black text-[#085041]">
                      {index + 1}
                    </span>
                    <span className="mt-3 block text-sm font-black text-[#13251d]">{step.label}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[#657066]">{step.detail}</span>
                  </article>
                ))}
              </div>

              <div data-testid="upsc-generated-daily-path" className="mt-4 rounded-lg border border-[#cfe5dc] bg-white p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">Generated daily path</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {dailyPath.map((topic, index) => (
                    <article
                      key={topic.day}
                      data-testid="upsc-generated-daily-topic"
                      data-topic-state={index === 0 ? "current" : "queued"}
                      className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#1d9e75]">
                        <span>Topic {index + 1} / Day {topic.day}</span>
                        <span className="rounded bg-white px-2 py-1 text-[#085041]">
                          {index === 0 ? "Current" : "Queued"}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm font-black text-[#13251d]">{topic.title}</span>
                      <span className="mt-1 block text-xs font-bold text-[#657066]">{topic.durationMinutes} min</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section data-testid="upsc-year-plan" className="mt-5 rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                    12-month subject path
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">One subject at a time</h2>
                </div>
                <Link
                  href="/upsc/geography"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                >
                  Open Geography
                </Link>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {subjectRoadmap.map((item, index) => {
                  const cardBody = (
                    <>
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e7f5ee] text-xs font-black text-[#085041]">
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                          {item.window}
                        </span>
                        <span className="mt-1 block text-sm font-black text-[#13251d]">{item.title}</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-[#756f64]">
                          {item.href === "/upsc/geography" ? "Current learner pilot" : "Planned after Geography pilot"}
                        </span>
                      </span>
                    </>
                  );

                  return item.href === "/upsc/geography" ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-testid="upsc-roadmap-active-subject"
                      className="grid grid-cols-[34px_1fr] gap-3 rounded-md border border-[#b9d9cd] bg-white p-3 transition hover:border-[#1d9e75]"
                    >
                      {cardBody}
                    </Link>
                  ) : (
                    <article
                      key={item.href}
                      data-testid="upsc-roadmap-future-subject"
                      data-subject-href={item.href}
                      className="grid grid-cols-[34px_1fr] gap-3 rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3"
                    >
                      {cardBody}
                    </article>
                  );
                })}
              </div>
            </section>
          </details>
        ) : null}
      </div>
    </main>
  );
};

function ProfileForm({
  draft,
  setDraft,
  saveProfile,
  profile,
  variant,
}: {
  draft: StudentProfile;
  setDraft: Dispatch<SetStateAction<StudentProfile>>;
  saveProfile: (nextDraft?: StudentProfile) => void;
  profile?: StudentProfile | null;
  variant: "initial" | "drawer";
}) {
  const router = useRouter();
  const isDrawer = variant === "drawer";
  const [classificationConfirmed, setClassificationConfirmed] = useState(Boolean(profile));
  const classification = getGuidedStudyStrategy(draft.level);
  const draftClassificationProof = getClassificationProof(draft);
  const shouldAutoGeneratePath = !profile && !isDrawer;

  const choosePreparationStage = (value: PreparationStage) => {
    const nextDraft: StudentProfile = {
      ...draft,
      level: studentLevelForPreparationStage(value),
      preparationStage: value,
      attemptHistory: value === "multiple-attempts" ? "two-plus-attempts" : "no-attempt",
    };
    setDraft(nextDraft);
    setClassificationConfirmed(true);
    if (shouldAutoGeneratePath) {
      saveProfile(nextDraft);
      window.setTimeout(() => {
        router.push(getGuidedStudyEntryRoute(nextDraft.level, 1));
      }, 0);
    }
  };

  return (
    <details
      open={!isDrawer}
      id="upsc-intake"
      data-testid="upsc-profile-intake"
      className={
        isDrawer
          ? "mt-5 rounded-lg border border-[#dcd5c7] bg-white p-4"
          : "rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
      }
    >
      <summary className="cursor-pointer list-none text-sm font-black text-[#13251d]">
        <span className="block text-[11px] uppercase tracking-[0.18em] text-[#1d9e75]">
          {isDrawer ? "Profile" : "Start here"}
        </span>
        <span className="mt-1 block text-xl tracking-tight">
          {isDrawer ? "Edit study profile" : "UPSC self-study profile"}
        </span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-[#5d675f]">
          {profile ? profilePlanLine(profile) : "One preparation-history answer opens your guided study path."}
        </span>
      </summary>

      <div className="mt-5 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-[#f7f4ee]">
            {profile ? "Saved" : "Beginner / Intermediate / Advanced"}
          </Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[#13251d] md:text-4xl">
            Let the system identify your level
          </h1>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[#5d675f]">
            Choose one preparation-history statement. The portal classifies you and opens the correct next action
            immediately.
          </p>
          {profile ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                ["Level", profile.level],
                ["Preparation", profile.preparationStage.replaceAll("-", " ")],
                ["Daily sitting", `${profile.studyWindow} min`],
                ["Attempt", profile.attemptHistory.replaceAll("-", " ")],
                ["Style", profile.learningStyle.replace("-", " ")],
                ["Weak signal", profile.weakSignal.replace("-", " ")],
                ["Pattern", profile.learningPattern.replace("-", " ")],
                ["Mind", profile.mindState.replace("-", " ")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-sm font-black capitalize text-[#13251d]">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <div data-testid="upsc-intake-step-core" className="grid gap-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">Where are you today?</p>
                <div className="grid gap-2">
                  {preparationOptions.map(({ value, level, label, detail }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={classificationConfirmed && draft.preparationStage === value}
                      data-testid={`upsc-intake-${value}`}
                      onClick={() => choosePreparationStage(value)}
                      className={`min-h-20 rounded-md border px-3 py-3 text-left transition ${optionClass(
                        classificationConfirmed && draft.preparationStage === value
                      )}`}
                    >
                      <span className="block text-[10px] font-black uppercase tracking-[0.14em] opacity-80">
                        {level}
                      </span>
                      <span className="mt-1 block text-sm font-black leading-5">{label}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 opacity-80">{detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              {classificationConfirmed ? (
                <div data-testid="upsc-classification-preview" className="rounded-md border border-[#b9d9cd] bg-[#e7f5ee] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                    Identified path
                  </p>
                <p className="mt-1 text-base font-black capitalize text-[#13251d]">{draft.level}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#49675e]">
                  {classification.firstAction}. {classification.detail}
                </p>
                <p
                  data-testid="upsc-classification-route-proof"
                  className="mt-2 rounded-md border border-[#b9d9cd] bg-white/75 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#085041]"
                >
                  {draftClassificationProof.title}: {draftClassificationProof.route}
                </p>
              </div>
              ) : null}

              {shouldAutoGeneratePath ? (
                <div
                  data-testid="upsc-auto-classification-flow"
                  className="rounded-md border border-[#dcd5c7] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#1a3a2a]"
                >
                  One answer generates your path
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="upsc-save-profile"
                  onClick={() => saveProfile()}
                  disabled={!classificationConfirmed}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d] disabled:cursor-not-allowed disabled:bg-[#dcd5c7] disabled:text-[#756f64] sm:w-auto"
                >
                  <Save className="h-4 w-4" /> Update guided path
                </button>
              )}
            </div>

          <details data-testid="upsc-intake-optional-preferences" className="rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
            <summary className="cursor-pointer text-sm font-black text-[#1a3a2a]">
              Optional study preferences
            </summary>
            <div data-testid="upsc-intake-step-pattern" className="mt-4 grid gap-4">
              <SelectBlock
                label="Daily sitting"
                icon={Clock3}
                value={draft.studyWindow}
                options={[
                  ["60", "60 min"],
                  ["90", "90 min"],
                  ["120", "120 min"],
                  ["180", "180 min"],
                ]}
                onChange={(value) => setDraft((current) => ({ ...current, studyWindow: value as StudyWindow }))}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <SelectBlock
                  label="Learning style"
                  icon={BrainCircuit}
                  value={draft.learningStyle}
                  options={[
                    ["watch-first", "Watch"],
                    ["talk-first", "Talk"],
                    ["practice-first", "Practice"],
                    ["mixed", "Mixed"],
                  ]}
                  onChange={(value) => setDraft((current) => ({ ...current, learningStyle: value as LearningStyle }))}
                />
                <SelectBlock
                  label="Weakest signal"
                  icon={Target}
                  value={draft.weakSignal}
                  options={[
                    ["retention", "Retention"],
                    ["concept-clarity", "Concept"],
                    ["mcq-traps", "MCQ traps"],
                    ["answer-writing", "Mains"],
                  ]}
                  onChange={(value) => setDraft((current) => ({ ...current, weakSignal: value as WeakSignal }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectBlock
                  label="Best time"
                  icon={UserRound}
                  value={draft.studyTime}
                  options={[
                    ["morning", "Morning"],
                    ["afternoon", "Afternoon"],
                    ["evening", "Evening"],
                    ["late-night", "Night"],
                  ]}
                  onChange={(value) => setDraft((current) => ({ ...current, studyTime: value as StudyTime }))}
                />
                <SelectBlock
                  label="Study pattern"
                  icon={Clock3}
                  value={draft.learningPattern}
                  options={[
                    ["deep-work", "Deep work"],
                    ["split-sessions", "Split sessions"],
                    ["revision-first", "Revision first"],
                    ["irregular", "Irregular"],
                  ]}
                  onChange={(value) => setDraft((current) => ({ ...current, learningPattern: value as LearningPattern }))}
                />
              </div>

              <SelectBlock
                label="Mind state"
                icon={BrainCircuit}
                value={draft.mindState}
                options={[
                  ["calm", "Calm"],
                  ["overloaded", "Overloaded"],
                  ["low-confidence", "Low confidence"],
                  ["exam-stress", "Exam stress"],
                ]}
                onChange={(value) => setDraft((current) => ({ ...current, mindState: value as MindState }))}
              />

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  data-testid="upsc-save-profile-preferences"
                  onClick={() => saveProfile()}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d] sm:w-auto"
                >
                  <Save className="h-4 w-4" /> {profile ? "Update preferences" : "Save preferences and continue"}
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </details>
  );
}

function SelectBlock({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: typeof Clock3;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#1d9e75]">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`min-h-10 rounded-md border px-3 text-left text-sm font-black transition ${optionClass(value === optionValue)}`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
