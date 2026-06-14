"use client";

import { SubjectCommandRoom } from "@/components/upsc/SubjectCommandRoom";
import { SubjectLabRoom } from "@/components/upsc/SubjectLabRoom";
import { SubjectMcqReadinessRoom } from "@/components/upsc/SubjectMcqReadinessRoom";
import { SubjectRetroRoom } from "@/components/upsc/SubjectRetroRoom";
import { SubjectRevisitRoom } from "@/components/upsc/SubjectRevisitRoom";
import { SubjectTalkRoom } from "@/components/upsc/SubjectTalkRoom";
import { SubjectTrackRoom } from "@/components/upsc/SubjectTrackRoom";
import { SubjectWatchRoom } from "@/components/upsc/SubjectWatchRoom";
import { environmentPlan } from "@/lib/upsc/subjectPlans";

export function EnvironmentCommandRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectCommandRoom plan={environmentPlan} initialDay={initialDay} />;
}

export function EnvironmentWatchRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectWatchRoom plan={environmentPlan} initialDay={initialDay} />;
}

export function EnvironmentTalkRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTalkRoom plan={environmentPlan} initialDay={initialDay} />;
}

export function EnvironmentTrackRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTrackRoom plan={environmentPlan} initialDay={initialDay} />;
}

export function EnvironmentLabRoute({ initialDay, initialMode }: { initialDay?: number; initialMode?: string }) {
  return <SubjectLabRoom plan={environmentPlan} initialDay={initialDay} initialMode={initialMode} />;
}

export function EnvironmentRevisitRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRevisitRoom plan={environmentPlan} initialDay={initialDay} />;
}

export function EnvironmentMcqReadinessRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectMcqReadinessRoom plan={environmentPlan} initialDay={initialDay} />;
}

export function EnvironmentRetroRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRetroRoom plan={environmentPlan} initialDay={initialDay} />;
}
