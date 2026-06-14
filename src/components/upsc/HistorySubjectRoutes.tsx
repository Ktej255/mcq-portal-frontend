"use client";

import { SubjectLabRoom } from "@/components/upsc/SubjectLabRoom";
import { SubjectMcqReadinessRoom } from "@/components/upsc/SubjectMcqReadinessRoom";
import { SubjectRetroRoom } from "@/components/upsc/SubjectRetroRoom";
import { SubjectRevisitRoom } from "@/components/upsc/SubjectRevisitRoom";
import { SubjectTalkRoom } from "@/components/upsc/SubjectTalkRoom";
import { SubjectTrackRoom } from "@/components/upsc/SubjectTrackRoom";
import { SubjectWatchRoom } from "@/components/upsc/SubjectWatchRoom";
import { historyPlan } from "@/lib/upsc/subjectPlans";

export function HistoryWatchRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectWatchRoom plan={historyPlan} initialDay={initialDay} />;
}

export function HistoryTalkRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTalkRoom plan={historyPlan} initialDay={initialDay} />;
}

export function HistoryTrackRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTrackRoom plan={historyPlan} initialDay={initialDay} />;
}

export function HistoryLabRoute({ initialDay, initialMode }: { initialDay?: number; initialMode?: string }) {
  return <SubjectLabRoom plan={historyPlan} initialDay={initialDay} initialMode={initialMode} />;
}

export function HistoryRevisitRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRevisitRoom plan={historyPlan} initialDay={initialDay} />;
}

export function HistoryMcqReadinessRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectMcqReadinessRoom plan={historyPlan} initialDay={initialDay} />;
}

export function HistoryRetroRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRetroRoom plan={historyPlan} initialDay={initialDay} />;
}
