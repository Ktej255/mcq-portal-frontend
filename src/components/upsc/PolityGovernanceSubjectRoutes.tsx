"use client";

import { SubjectLabRoom } from "@/components/upsc/SubjectLabRoom";
import { SubjectMcqReadinessRoom } from "@/components/upsc/SubjectMcqReadinessRoom";
import { SubjectRetroRoom } from "@/components/upsc/SubjectRetroRoom";
import { SubjectRevisitRoom } from "@/components/upsc/SubjectRevisitRoom";
import { SubjectTalkRoom } from "@/components/upsc/SubjectTalkRoom";
import { SubjectTrackRoom } from "@/components/upsc/SubjectTrackRoom";
import { SubjectWatchRoom } from "@/components/upsc/SubjectWatchRoom";
import { polityGovernancePlan } from "@/lib/upsc/subjectPlans";

export function PolityGovernanceWatchRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectWatchRoom plan={polityGovernancePlan} initialDay={initialDay} />;
}

export function PolityGovernanceTalkRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTalkRoom plan={polityGovernancePlan} initialDay={initialDay} />;
}

export function PolityGovernanceTrackRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTrackRoom plan={polityGovernancePlan} initialDay={initialDay} />;
}

export function PolityGovernanceLabRoute({ initialDay, initialMode }: { initialDay?: number; initialMode?: string }) {
  return <SubjectLabRoom plan={polityGovernancePlan} initialDay={initialDay} initialMode={initialMode} />;
}

export function PolityGovernanceRevisitRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRevisitRoom plan={polityGovernancePlan} initialDay={initialDay} />;
}

export function PolityGovernanceMcqReadinessRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectMcqReadinessRoom plan={polityGovernancePlan} initialDay={initialDay} />;
}

export function PolityGovernanceRetroRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRetroRoom plan={polityGovernancePlan} initialDay={initialDay} />;
}
