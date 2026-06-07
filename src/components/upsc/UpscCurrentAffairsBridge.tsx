"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Newspaper, RefreshCcw, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  currentAffairsBridgeSummary,
  currentAffairsSubjects,
  getCurrentAffairsForSubject,
  getCurrentAffairsSubject,
  type CurrentAffairsBridgeItem,
} from "@/lib/upsc/currentAffairsBridge";
import { useSubjectProgress, type SubjectDayProgress } from "@/lib/upsc/useSubjectProgress";
import { cn } from "@/lib/utils";

function staticCoverageSignals(progress?: SubjectDayProgress) {
  const signals: string[] = [];

  if (progress?.watched) signals.push("Watch evidence");
  if (progress?.reflection?.trim()) signals.push("Talk reflection");
  if (typeof progress?.talkScore === "number") signals.push(`Talk score ${progress.talkScore}%`);
  if (progress?.labCompleted) signals.push("Visual lab");
  if (progress?.mcqAttempted) signals.push("MCQ attempted");
  if (progress?.mcqCompleted) signals.push("MCQ completed");
  if (progress?.confidence === "Command") signals.push("Command confidence");

  return signals;
}

function hasCoveredStaticTopic(progress?: SubjectDayProgress) {
  return staticCoverageSignals(progress).length > 0;
}

function sourceLabel(status: CurrentAffairsBridgeItem["sourceStatus"]) {
  return status === "ready-for-class" ? "Topic bridge ready" : "Daily source pending";
}

export function UpscCurrentAffairsBridge() {
  const searchParams = useSearchParams();
  const requestedSubject = searchParams.get("subject") ?? "geography";
  const [subjectSlug, setSubjectSlug] = useState(() => getCurrentAffairsSubject(requestedSubject).slug);

  useEffect(() => {
    setSubjectSlug(getCurrentAffairsSubject(requestedSubject).slug);
  }, [requestedSubject]);

  const selectedSubject = useMemo(() => getCurrentAffairsSubject(subjectSlug), [subjectSlug]);
  const { getDayProgress, isLoaded } = useSubjectProgress(selectedSubject.slug, selectedSubject.sessions);
  const subjectItems = useMemo(() => getCurrentAffairsForSubject(selectedSubject.slug), [selectedSubject.slug]);
  const unlockedItems = subjectItems.filter((item) => hasCoveredStaticTopic(getDayProgress(item.linkedDay)));
  const lockedItems = subjectItems.filter((item) => !hasCoveredStaticTopic(getDayProgress(item.linkedDay)));
  const coverageEvidence = subjectItems.map((item) => {
    const signals = staticCoverageSignals(getDayProgress(item.linkedDay));

    return {
      ...item,
      signals,
      gateStatus: signals.length ? "unlocked" : "locked",
    };
  });
  const coveredDayList = coverageEvidence
    .filter((item) => item.gateStatus === "unlocked")
    .map((item) => String(item.linkedDay))
    .join(",");
  const nextLocked = lockedItems[0];
  const nextLockedSession = nextLocked
    ? selectedSubject.sessions.find((session) => session.day === nextLocked.linkedDay)
    : null;

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8">
        <section
          data-testid="upsc-current-affairs-hero"
          data-active-subject={selectedSubject.slug}
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
                Covered-topic current affairs
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
                {selectedSubject.title} news appears only after the topic is covered.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#5d675f]">
                The page links current-affairs hooks to class days. A beginner sees only items connected to topics
                they have watched, explained, practiced, or otherwise opened in the learning loop.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Unlocked", isLoaded ? unlockedItems.length : 0],
                ["Locked", isLoaded ? lockedItems.length : subjectItems.length],
                ["Subject hooks", subjectItems.length],
                ["Subjects", currentAffairsBridgeSummary.subjectCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1d9e75]">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="upsc-current-affairs-subjects"
          className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            {currentAffairsSubjects.map((subject) => {
              const isActive = selectedSubject.slug === subject.slug;
              return (
                <button
                  key={subject.slug}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSubjectSlug(subject.slug)}
                  className={cn(
                    "min-h-10 rounded-md border px-3 text-sm font-black transition",
                    isActive
                      ? "border-[#1a3a2a] bg-[#1a3a2a] text-white"
                      : "border-[#dcd5c7] bg-[#f7f4ee] text-[#34453b] hover:border-[#1d9e75]"
                  )}
                >
                  {subject.title}
                </button>
              );
            })}
          </div>
        </section>

        <section
          data-testid="upsc-current-affairs-coverage-proof"
          data-rule="covered-static-topic-only"
          data-active-subject={selectedSubject.slug}
          data-total-hooks={subjectItems.length}
          data-unlocked-count={isLoaded ? unlockedItems.length : 0}
          data-locked-count={isLoaded ? lockedItems.length : subjectItems.length}
          data-covered-days={coveredDayList}
          className="rounded-lg border border-[#c8ded6] bg-[#eef8f2] p-4 shadow-sm md:p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                Evidence gate
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">Only covered static topics can open news.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                The locked queue shows the chapter name only. The actual current-affairs hook opens after Watch, Talk,
                Lab, MCQ, or Command-confidence evidence is saved for that exact day.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {coverageEvidence.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  data-testid="upsc-current-affairs-proof-row"
                  data-linked-day={item.linkedDay}
                  data-gate-status={item.gateStatus}
                  data-signals={item.signals.join("|")}
                  className={cn(
                    "rounded-md border p-3",
                    item.gateStatus === "unlocked"
                      ? "border-[#93cdb6] bg-white"
                      : "border-[#dcd5c7] bg-[#fffdf8]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
                      Day {item.linkedDay}
                    </p>
                    <Badge
                      className={cn(
                        "rounded-md px-2 py-1",
                        item.gateStatus === "unlocked" ? "bg-[#1a3a2a] text-white" : "bg-[#fff4df] text-[#6f4a12]"
                      )}
                    >
                      {item.gateStatus}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-black tracking-tight">{item.linkedTopic}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">
                    {item.signals.length ? item.signals.join(" + ") : "Waiting for static topic evidence"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {nextLocked && nextLockedSession ? (
          <section
            data-testid="upsc-current-affairs-next-unlock"
            className="rounded-lg border border-[#b9d9cd] bg-[#e7f5ee] p-5 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#085041]">
                  Next unlock
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  Finish Day {nextLocked.linkedDay}: {nextLocked.linkedTopic}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#49675e]">
                  After this static topic is touched, the related current-affairs bridge opens automatically.
                </p>
              </div>
              <Link
                href={`/upsc/${selectedSubject.slug}?day=${nextLocked.linkedDay}`}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white"
              >
                Open topic <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </section>
        ) : null}

        <section data-testid="upsc-current-affairs-unlocked" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Visible now</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Unlocked current-affairs hooks</h2>
            </div>
            <Newspaper className="h-6 w-6 text-[#1a3a2a]" />
          </div>

          {unlockedItems.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {unlockedItems.map((item) => (
                <CurrentAffairsCard key={item.id} item={item} unlocked />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-5">
              <p className="text-lg font-black tracking-tight">No current-affairs hook is visible yet.</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                Start {selectedSubject.title} Day 1 and complete the first Watch or Talk evidence. The portal will then reveal
                only the linked issue hooks instead of showing a full news feed.
              </p>
              <Link
                href={`/upsc/${selectedSubject.slug}?day=1`}
                className="mt-4 inline-flex min-h-10 items-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white"
              >
                Open Day 1
              </Link>
            </div>
          )}
        </section>

        <section data-testid="upsc-current-affairs-locked" className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Hidden until covered</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Locked bridge queue</h2>
            </div>
            <LockKeyhole className="h-6 w-6 text-[#1a3a2a]" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lockedItems.map((item) => (
              <Link
                key={item.id}
                href={`/upsc/${selectedSubject.slug}?day=${item.linkedDay}`}
                className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4 transition hover:border-[#1d9e75]"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <LockKeyhole className="h-4 w-4 text-[#6f4a12]" />
                  <Badge className="rounded-md bg-[#fff4df] px-2 py-1 text-[#6f4a12]">Day {item.linkedDay}</Badge>
                </div>
                <h3 className="text-base font-black tracking-tight">{item.linkedTopic}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#5d675f]">
                  Unlocks after static topic evidence is saved.
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function CurrentAffairsCard({ item, unlocked }: { item: CurrentAffairsBridgeItem; unlocked: boolean }) {
  return (
    <article
      data-testid="upsc-current-affairs-card"
      data-subject-slug={item.subjectSlug}
      data-linked-day={item.linkedDay}
      data-unlocked={unlocked ? "true" : "false"}
      className="rounded-lg border border-[#dcd5c7] bg-[#fdfaf3] p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
            Day {item.linkedDay} / {item.linkedTopic}
          </p>
        </div>
        <Badge className="rounded-md bg-[#1a3a2a] px-2 py-1 text-white">{sourceLabel(item.sourceStatus)}</Badge>
      </div>
      <h3 className="text-xl font-black tracking-tight">{item.issueHook}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SignalBlock icon={Route} label="Static bridge" text={item.staticBridge} />
        <SignalBlock icon={Newspaper} label="Prelims use" text={item.prelimsUse} />
        <SignalBlock icon={RefreshCcw} label="Mains use" text={item.mainsUse} />
        <SignalBlock icon={CheckCircle2} label="Revision prompt" text={item.revisionPrompt} />
      </div>
    </article>
  );
}

function SignalBlock({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof Route;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-md border border-[#dcd5c7] bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#1d9e75]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="text-xs font-semibold leading-5 text-[#4f5e55]">{text}</p>
    </div>
  );
}
