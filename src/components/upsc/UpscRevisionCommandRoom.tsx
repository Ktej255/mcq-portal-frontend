"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Compass,
  Gauge,
  PlayCircle,
  RefreshCcw,
  Target,
  TimerReset,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { geographySessions } from "@/lib/upsc/plan";
import { readLocalQuestionBankAttempts, type QuestionBankAttempt } from "@/lib/upsc/questionBankEngine";
import { subjectPlans, type SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

type RevisionSubject = {
  slug: string;
  title: string;
  window: string;
  href: string;
  trackHref: string;
  sessions: SubjectSession[];
};

type SubjectSummary = RevisionSubject & {
  watchedCount: number;
  reflectedCount: number;
  commandCount: number;
  aiGapCount: number;
  shakyCount: number;
  revisitCount: number;
  questionBankTrapCount: number;
  questionBankTrapDays: number;
  completionPercent: number;
  watchPercent: number;
  progress: Record<string, SubjectDayProgress>;
  questionBankAttempts: QuestionBankAttempt[];
  nextSession: SubjectSession;
  nextHref: string;
  nextLabel: string;
};

const revisionSubjects: RevisionSubject[] = [
  {
    slug: "geography",
    title: "Geography",
    window: "June",
    href: "/upsc/geography",
    trackHref: "/upsc/geography/track",
    sessions: geographySessions,
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
    href: `/upsc/${plan.slug}`,
    trackHref: `/upsc/${plan.slug}/track`,
    sessions: plan.sessions,
  })),
];

function storageKey(subjectSlug: string) {
  return `sarit-upsc-${subjectSlug}-progress-v1`;
}

function readProgress(subjectSlug: string) {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey(subjectSlug));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, SubjectDayProgress>) : {};
  } catch {
    return {};
  }
}

function getSessionProgress(progress: Record<string, SubjectDayProgress>, session: SubjectSession) {
  return progress[String(session.day)];
}

function getQuestionBankAttemptsForSession(attempts: QuestionBankAttempt[], session: SubjectSession) {
  return attempts.filter((attempt) => attempt.linkedDay === session.day);
}

function getQuestionBankTrapAttempts(attempts: QuestionBankAttempt[]) {
  return attempts.filter((attempt) => !attempt.isCorrect);
}

function hasQuestionBankTrap(attempts: QuestionBankAttempt[], session: SubjectSession) {
  return getQuestionBankTrapAttempts(getQuestionBankAttemptsForSession(attempts, session)).length > 0;
}

function questionBankTrapDetail(attempts: QuestionBankAttempt[]) {
  const wrongAttempts = getQuestionBankTrapAttempts(attempts);
  const topics = Array.from(new Set(wrongAttempts.map((attempt) => attempt.topic).filter(Boolean))).slice(0, 2);
  const topicText = topics.length ? ` in ${topics.join(", ")}` : "";
  return `Question Bank ledger has ${wrongAttempts.length} incorrect answer${
    wrongAttempts.length === 1 ? "" : "s"
  }${topicText}. Repair before retesting.`;
}

function hasTeacherDoubtSignal(progress?: SubjectDayProgress) {
  return Boolean(
    progress?.teacherDoubtCategory?.trim() ||
      progress?.teacherDoubtReason?.trim() ||
      progress?.teacherDoubtRepairAction?.trim() ||
      progress?.teacherDoubtMasteryCheck?.trim()
  );
}

function hasActiveTeacherDoubt(progress?: SubjectDayProgress) {
  if (!hasTeacherDoubtSignal(progress)) return false;
  return !(
    progress?.confidence === "Command" ||
    progress?.talkBand === "Command" ||
    progress?.mcqOutcome === "Command" ||
    (progress?.mcqCompleted && (progress?.mcqScorePercent ?? 0) >= 75)
  );
}

function teacherDoubtCategory(progress?: SubjectDayProgress) {
  return progress?.teacherDoubtCategory?.trim() || "Concept";
}

function teacherDoubtHref(subject: RevisionSubject, session: SubjectSession, progress?: SubjectDayProgress) {
  return progress?.talkNextRoute || `${subject.href}/talk?day=${session.day}`;
}

function getNextFocus(
  subject: RevisionSubject,
  progress: Record<string, SubjectDayProgress>,
  questionBankAttempts: QuestionBankAttempt[]
) {
  const teacherDoubt = subject.sessions.find((session) => hasActiveTeacherDoubt(getSessionProgress(progress, session)));
  if (teacherDoubt) {
    const item = getSessionProgress(progress, teacherDoubt);
    return {
      session: teacherDoubt,
      href: teacherDoubtHref(subject, teacherDoubt, item),
      label: `AI ${teacherDoubtCategory(item)} repair`,
    };
  }

  const questionBankTrap = subject.sessions.find((session) => hasQuestionBankTrap(questionBankAttempts, session));
  if (questionBankTrap) {
    return {
      session: questionBankTrap,
      href: `${subject.href}/revisit?day=${questionBankTrap.day}`,
      label: "Question Bank trap",
    };
  }

  const revisit = subject.sessions.find((session) => getSessionProgress(progress, session)?.revisitQueued);
  if (revisit) {
    return {
      session: revisit,
      href: `${subject.href}/revisit?day=${revisit.day}`,
      label: "Revisit queued",
    };
  }

  const shaky = subject.sessions.find((session) => getSessionProgress(progress, session)?.confidence === "Shaky");
  if (shaky) {
    return {
      session: shaky,
      href: `${subject.href}/talk?day=${shaky.day}`,
      label: "Shaky talk repair",
    };
  }

  const unfinished = subject.sessions.find((session) => !getSessionProgress(progress, session)?.reflection?.trim());
  if (unfinished) {
    return {
      session: unfinished,
      href: `${subject.href}/watch?day=${unfinished.day}`,
      label: "Next unfinished class",
    };
  }

  const commandDrill = subject.sessions[subject.sessions.length - 1];
  return {
    session: commandDrill,
    href: `${subject.trackHref}?day=${commandDrill.day}`,
    label: "Command review",
  };
}

function buildSummary(subject: RevisionSubject): SubjectSummary {
  const progress = readProgress(subject.slug);
  const questionBankAttempts = readLocalQuestionBankAttempts(subject.slug);
  const watchedDays = subject.sessions.filter((session) => getSessionProgress(progress, session)?.watched);
  const reflectedDays = subject.sessions.filter((session) =>
    Boolean(getSessionProgress(progress, session)?.reflection?.trim())
  );
  const commandDays = subject.sessions.filter((session) => getSessionProgress(progress, session)?.confidence === "Command");
  const aiGapDays = subject.sessions.filter((session) => hasActiveTeacherDoubt(getSessionProgress(progress, session)));
  const shakyDays = subject.sessions.filter((session) => getSessionProgress(progress, session)?.confidence === "Shaky");
  const revisitDays = subject.sessions.filter((session) => getSessionProgress(progress, session)?.revisitQueued);
  const questionBankTrapAttempts = getQuestionBankTrapAttempts(questionBankAttempts);
  const questionBankTrapDays = subject.sessions.filter((session) => hasQuestionBankTrap(questionBankAttempts, session));
  const nextFocus = getNextFocus(subject, progress, questionBankAttempts);

  return {
    ...subject,
    watchedCount: watchedDays.length,
    reflectedCount: reflectedDays.length,
    commandCount: commandDays.length,
    aiGapCount: aiGapDays.length,
    shakyCount: shakyDays.length,
    revisitCount: revisitDays.length,
    questionBankTrapCount: questionBankTrapAttempts.length,
    questionBankTrapDays: questionBankTrapDays.length,
    completionPercent: Math.round((reflectedDays.length / subject.sessions.length) * 100),
    watchPercent: Math.round((watchedDays.length / subject.sessions.length) * 100),
    progress,
    questionBankAttempts,
    nextSession: nextFocus.session,
    nextHref: nextFocus.href,
    nextLabel: nextFocus.label,
  };
}

function subjectTone(summary: SubjectSummary) {
  if (summary.aiGapCount > 0) return "border-[#ef9f27] bg-[#fff7ed]";
  if (summary.questionBankTrapCount > 0) return "border-[#ef9f27] bg-[#fff7ed]";
  if (summary.revisitCount > 0) return "border-[#ef9f27] bg-[#fff7ed]";
  if (summary.completionPercent >= 80) return "border-[#1d9e75] bg-[#e7f5ee]";
  if (summary.reflectedCount > 0 || summary.watchedCount > 0) return "border-[#dcd5c7] bg-[#fdfaf3]";
  return "border-[#dcd5c7] bg-[#fffdf8]";
}

export function UpscRevisionCommandRoom({
  initialSubjectSlug,
  initialDay,
}: {
  initialSubjectSlug?: string;
  initialDay?: number;
}) {
  const [summaries, setSummaries] = useState<SubjectSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSummaries(revisionSubjects.map(buildSummary));
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const totals = useMemo(() => {
    const totalDays = summaries.reduce((sum, subject) => sum + subject.sessions.length, 0);
    const watched = summaries.reduce((sum, subject) => sum + subject.watchedCount, 0);
    const reflected = summaries.reduce((sum, subject) => sum + subject.reflectedCount, 0);
    const command = summaries.reduce((sum, subject) => sum + subject.commandCount, 0);
    const aiGap = summaries.reduce((sum, subject) => sum + subject.aiGapCount, 0);
    const shaky = summaries.reduce((sum, subject) => sum + subject.shakyCount, 0);
    const revisit = summaries.reduce((sum, subject) => sum + subject.revisitCount, 0);
    const questionBankTrap = summaries.reduce((sum, subject) => sum + subject.questionBankTrapCount, 0);

    return {
      totalDays,
      watched,
      reflected,
      command,
      aiGap,
      shaky,
      revisit,
      questionBankTrap,
      completionPercent: totalDays ? Math.round((reflected / totalDays) * 100) : 0,
      watchPercent: totalDays ? Math.round((watched / totalDays) * 100) : 0,
    };
  }, [summaries]);

  const focusQueue = useMemo(
    () =>
      summaries
        .flatMap((subject) =>
          subject.sessions
            .map((session) => {
              const item = getSessionProgress(subject.progress, session);
              const isAiGap = hasActiveTeacherDoubt(item);
              const questionBankAttempts = getQuestionBankAttemptsForSession(subject.questionBankAttempts, session);
              const questionBankTrapAttempts = getQuestionBankTrapAttempts(questionBankAttempts);
              const isQuestionBankTrap = questionBankTrapAttempts.length > 0;
              if (!isAiGap && !isQuestionBankTrap && !item?.revisitQueued && item?.confidence !== "Shaky") return null;
              return {
                subject,
                session,
                progress: item,
                source: isAiGap
                  ? "ai-teacher"
                  : isQuestionBankTrap
                    ? "question-bank"
                    : item?.revisitQueued
                      ? "revisit"
                      : "shaky",
                status: isAiGap
                  ? "AI teacher gap"
                  : isQuestionBankTrap
                    ? "Question Bank trap"
                    : item?.revisitQueued
                      ? "Revisit queued"
                      : "Shaky confidence",
                detail: isAiGap
                  ? item?.teacherDoubtRepairAction?.trim() || "Repair the AI-identified gap before new testing."
                  : isQuestionBankTrap
                    ? questionBankTrapDetail(questionBankTrapAttempts)
                  : item?.revisitQueued
                    ? "Revisit queued from local progress."
                    : "Shaky confidence from local progress.",
                category: isAiGap ? teacherDoubtCategory(item) : null,
                href: isAiGap
                  ? teacherDoubtHref(subject, session, item)
                  : isQuestionBankTrap
                    ? `${subject.href}/revisit?day=${session.day}`
                  : item?.revisitQueued
                    ? `${subject.href}/revisit?day=${session.day}`
                    : `${subject.href}/talk?day=${session.day}`,
              };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
        )
        .slice(0, 12),
    [summaries]
  );

  const targetSummary = summaries.find((summary) => summary.slug === initialSubjectSlug);
  const targetSession =
    targetSummary?.sessions.find((session) => session.day === initialDay) ?? targetSummary?.nextSession;
  const targetProgress =
    targetSummary && targetSession ? getSessionProgress(targetSummary.progress, targetSession) : undefined;
  const targetQuestionBankAttempts =
    targetSummary && targetSession
      ? getQuestionBankAttemptsForSession(targetSummary.questionBankAttempts, targetSession)
      : [];
  const targetQuestionBankTrapAttempts = getQuestionBankTrapAttempts(targetQuestionBankAttempts);
  const targetHasQuestionBankTrap = targetQuestionBankTrapAttempts.length > 0;
  const targetHref =
    targetSummary && targetSession
      ? hasActiveTeacherDoubt(targetProgress)
        ? teacherDoubtHref(targetSummary, targetSession, targetProgress)
        : targetHasQuestionBankTrap
          ? `${targetSummary.href}/revisit?day=${targetSession.day}`
        : targetProgress?.revisitQueued
        ? `${targetSummary.href}/revisit?day=${targetSession.day}`
        : targetProgress?.confidence === "Shaky"
          ? `${targetSummary.href}/talk?day=${targetSession.day}`
          : `${targetSummary.trackHref}?day=${targetSession.day}`
      : null;
  const targetStatus = hasActiveTeacherDoubt(targetProgress)
      ? `AI teacher gap: ${teacherDoubtCategory(targetProgress)}`
    : targetHasQuestionBankTrap
      ? "Question Bank trap"
    : targetProgress?.revisitQueued
      ? "Revisit queued"
      : targetProgress?.confidence === "Shaky"
        ? "Shaky talk repair"
        : "Track focused day";

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#1b2f27]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-6 text-sm font-black">
          Loading UPSC revision command...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1b2f27]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
            <Link href="/upsc" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
              <ArrowLeft className="h-4 w-4" /> UPSC command home
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge className="rounded-md bg-[#1d9e75] px-3 py-1 text-white">Revision Command</Badge>
              <span className="text-sm font-bold text-[#776f64]">All subjects, local browser memory</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1d9e75]">Post-subject command phase</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#13251d] md:text-5xl">
              One dashboard for every subject queue.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#5d675f]">
              This room reads the local progress from Geography, Environment, Disaster Management, Economy, Science and Tech,
              Polity and Governance, Internal Security and Society, and History. It tells you what to revise next.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f2eadc]">
              <div className="h-full rounded-full bg-[#1d9e75]" style={{ width: `${totals.completionPercent}%` }} />
            </div>
            <p className="mt-3 text-sm font-black text-[#085041]">
              {totals.completionPercent}% reflected across {totals.totalDays} planned study days
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {[
              { label: "Total days", value: totals.totalDays, icon: Compass },
              { label: "Watched", value: totals.watched, icon: PlayCircle },
              { label: "Reflections", value: totals.reflected, icon: BrainCircuit },
              { label: "Command", value: totals.command, icon: CheckCircle2 },
              { label: "AI gaps", value: totals.aiGap, icon: CircleAlert },
              { label: "QB traps", value: totals.questionBankTrap, icon: CircleAlert },
              { label: "Revisit", value: totals.revisit, icon: RefreshCcw },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{item.label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-[#13251d]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1d9e75]">Subject map</p>
                <h2 className="text-2xl font-black tracking-tight text-[#13251d]">Revision status by subject</h2>
              </div>
              <BarChart3 className="h-6 w-6 text-[#085041]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {summaries.map((summary) => (
                <div
                  key={summary.slug}
                  data-question-bank-traps={summary.questionBankTrapCount}
                  className={cn("rounded-lg border p-4 shadow-sm", subjectTone(summary))}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">{summary.window}</p>
                      <h3 className="mt-2 text-lg font-black leading-6 text-[#13251d]">{summary.title}</h3>
                    </div>
                    <Badge variant="outline" className="rounded-md border-[#1d9e75]/40 text-[#085041]">
                      {summary.sessions.length} days
                    </Badge>
                  </div>

                  <div className="grid grid-cols-6 gap-2 text-center">
                    {[
                      ["Watch", summary.watchedCount],
                      ["Talk", summary.reflectedCount],
                      ["Cmd", summary.commandCount],
                      ["AI", summary.aiGapCount],
                      ["QB", summary.questionBankTrapCount],
                      ["Fix", summary.revisitCount],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-white/75 px-2 py-3">
                        <p className="text-lg font-black text-[#13251d]">{value}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#6f756d]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href={summary.nextHref}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-bold text-white transition hover:bg-[#10291d]"
                    >
                      {summary.nextLabel} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`${summary.trackHref}?day=${summary.nextSession.day}`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]"
                    >
                      Track subject
                    </Link>
                  </div>

                  <p className="mt-3 text-xs font-semibold leading-5 text-[#657066]">
                    Next: Day {summary.nextSession.day}, {summary.nextSession.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            {targetSummary && targetSession && targetHref ? (
              <div
                data-testid="revision-target-focus"
                data-question-bank-traps={targetQuestionBankTrapAttempts.length}
                className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                  <Target className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Direct target</p>
                <h2 className="mt-2 text-xl font-black leading-7 text-[#085041]">
                  {targetSummary.title} Day {targetSession.day}
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#41645a]">{targetSession.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#41645a]">{targetStatus}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    data-testid="revision-target-route"
                    href={targetHref}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-sm font-black text-white transition hover:bg-[#10291d]"
                  >
                    Open target <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`${targetSummary.trackHref}?day=${targetSession.day}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#bdddd3] bg-white px-3 text-sm font-black text-[#085041] transition hover:bg-[#effaf5]"
                  >
                    Track focused day
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ef9f27] text-[#13251d]">
                  <TimerReset className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Global repair queue</p>
                  <p className="text-xs font-semibold text-[#746f66]">Revisit and shaky days from all subjects</p>
                </div>
              </div>

              {focusQueue.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#dcd5c7] bg-[#fdfaf3] p-5 text-sm font-bold leading-6 text-[#746f66]">
                  No shaky or revisit days saved yet. As Talk rooms are used, weak days will collect here automatically.
                </div>
              ) : (
                <div className="grid gap-3">
                  {focusQueue.map((item) => (
                    <Link
                      key={`${item.subject.slug}-${item.session.day}`}
                      data-revision-source={item.source}
                      href={item.href}
                      className="rounded-md border border-[#ef9f27]/40 bg-[#fff4df] p-4 transition hover:border-[#ef9f27]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a6a16]">
                          {item.subject.title} / Day {item.session.day}
                        </p>
                        {item.status === "AI teacher gap" || item.status === "Question Bank trap" ? (
                          <CircleAlert className="h-4 w-4 text-[#9a6a16]" />
                        ) : item.progress?.revisitQueued ? (
                          <RefreshCcw className="h-4 w-4 text-[#9a6a16]" />
                        ) : (
                          <Gauge className="h-4 w-4 text-[#9a6a16]" />
                        )}
                      </div>
                      <p className="text-sm font-black text-[#332514]">{item.session.title}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#6f4a12]">
                        {item.category ? `${item.status}: ${item.category}. ` : ""}
                        {item.detail}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#cfe5dc] bg-[#e7f5ee] p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#1d9e75] text-white">
                <Target className="h-5 w-5" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Revision rule</p>
              <h2 className="mt-2 text-xl font-black text-[#085041]">Repair before new testing.</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#41645a]">
                The command phase should cycle through AI teacher gaps first, then queued revisits, then shaky explanations,
                then unfinished classes, and finally mixed MCQ drills.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
