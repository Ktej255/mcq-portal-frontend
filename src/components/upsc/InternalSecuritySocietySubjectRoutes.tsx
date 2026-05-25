"use client";

import { SubjectLabRoom } from "@/components/upsc/SubjectLabRoom";
import { SubjectMcqReadinessRoom } from "@/components/upsc/SubjectMcqReadinessRoom";
import { SubjectRevisitRoom } from "@/components/upsc/SubjectRevisitRoom";
import { SubjectTalkRoom } from "@/components/upsc/SubjectTalkRoom";
import { SubjectTrackRoom } from "@/components/upsc/SubjectTrackRoom";
import { SubjectWatchRoom } from "@/components/upsc/SubjectWatchRoom";
import { internalSecuritySocietyPlan } from "@/lib/upsc/subjectPlans";

export function InternalSecuritySocietyWatchRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectWatchRoom plan={internalSecuritySocietyPlan} initialDay={initialDay} />;
}

export function InternalSecuritySocietyTalkRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTalkRoom plan={internalSecuritySocietyPlan} initialDay={initialDay} />;
}

export function InternalSecuritySocietyTrackRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTrackRoom plan={internalSecuritySocietyPlan} initialDay={initialDay} />;
}

export function InternalSecuritySocietyLabRoute({
  initialDay,
  initialMode,
}: {
  initialDay?: number;
  initialMode?: string;
}) {
  return <SubjectLabRoom plan={internalSecuritySocietyPlan} initialDay={initialDay} initialMode={initialMode} />;
}

export function InternalSecuritySocietyRevisitRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRevisitRoom plan={internalSecuritySocietyPlan} initialDay={initialDay} />;
}

export function InternalSecuritySocietyMcqReadinessRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectMcqReadinessRoom plan={internalSecuritySocietyPlan} initialDay={initialDay} />;
}
