"use client";

import { SubjectLabRoom } from "@/components/upsc/SubjectLabRoom";
import { SubjectMcqReadinessRoom } from "@/components/upsc/SubjectMcqReadinessRoom";
import { SubjectRevisitRoom } from "@/components/upsc/SubjectRevisitRoom";
import { SubjectTalkRoom } from "@/components/upsc/SubjectTalkRoom";
import { SubjectTrackRoom } from "@/components/upsc/SubjectTrackRoom";
import { SubjectWatchRoom } from "@/components/upsc/SubjectWatchRoom";
import { scienceTechPlan } from "@/lib/upsc/subjectPlans";

export function ScienceTechWatchRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectWatchRoom plan={scienceTechPlan} initialDay={initialDay} />;
}

export function ScienceTechTalkRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTalkRoom plan={scienceTechPlan} initialDay={initialDay} />;
}

export function ScienceTechTrackRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTrackRoom plan={scienceTechPlan} initialDay={initialDay} />;
}

export function ScienceTechLabRoute({ initialDay, initialMode }: { initialDay?: number; initialMode?: string }) {
  return <SubjectLabRoom plan={scienceTechPlan} initialDay={initialDay} initialMode={initialMode} />;
}

export function ScienceTechRevisitRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRevisitRoom plan={scienceTechPlan} initialDay={initialDay} />;
}

export function ScienceTechMcqReadinessRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectMcqReadinessRoom plan={scienceTechPlan} initialDay={initialDay} />;
}
