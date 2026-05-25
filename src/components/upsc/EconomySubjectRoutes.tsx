"use client";

import { SubjectLabRoom } from "@/components/upsc/SubjectLabRoom";
import { SubjectMcqReadinessRoom } from "@/components/upsc/SubjectMcqReadinessRoom";
import { SubjectRevisitRoom } from "@/components/upsc/SubjectRevisitRoom";
import { SubjectTalkRoom } from "@/components/upsc/SubjectTalkRoom";
import { SubjectTrackRoom } from "@/components/upsc/SubjectTrackRoom";
import { SubjectWatchRoom } from "@/components/upsc/SubjectWatchRoom";
import { economyPlan } from "@/lib/upsc/subjectPlans";

export function EconomyWatchRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectWatchRoom plan={economyPlan} initialDay={initialDay} />;
}

export function EconomyTalkRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTalkRoom plan={economyPlan} initialDay={initialDay} />;
}

export function EconomyTrackRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTrackRoom plan={economyPlan} initialDay={initialDay} />;
}

export function EconomyLabRoute({ initialDay, initialMode }: { initialDay?: number; initialMode?: string }) {
  return <SubjectLabRoom plan={economyPlan} initialDay={initialDay} initialMode={initialMode} />;
}

export function EconomyRevisitRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRevisitRoom plan={economyPlan} initialDay={initialDay} />;
}

export function EconomyMcqReadinessRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectMcqReadinessRoom plan={economyPlan} initialDay={initialDay} />;
}
