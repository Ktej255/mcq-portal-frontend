"use client";

import { SubjectLabRoom } from "@/components/upsc/SubjectLabRoom";
import { SubjectMcqReadinessRoom } from "@/components/upsc/SubjectMcqReadinessRoom";
import { SubjectRevisitRoom } from "@/components/upsc/SubjectRevisitRoom";
import { SubjectTalkRoom } from "@/components/upsc/SubjectTalkRoom";
import { SubjectTrackRoom } from "@/components/upsc/SubjectTrackRoom";
import { SubjectWatchRoom } from "@/components/upsc/SubjectWatchRoom";
import { disasterManagementPlan } from "@/lib/upsc/subjectPlans";

export function DisasterManagementWatchRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectWatchRoom plan={disasterManagementPlan} initialDay={initialDay} />;
}

export function DisasterManagementTalkRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTalkRoom plan={disasterManagementPlan} initialDay={initialDay} />;
}

export function DisasterManagementTrackRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectTrackRoom plan={disasterManagementPlan} initialDay={initialDay} />;
}

export function DisasterManagementLabRoute({ initialDay, initialMode }: { initialDay?: number; initialMode?: string }) {
  return <SubjectLabRoom plan={disasterManagementPlan} initialDay={initialDay} initialMode={initialMode} />;
}

export function DisasterManagementRevisitRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectRevisitRoom plan={disasterManagementPlan} initialDay={initialDay} />;
}

export function DisasterManagementMcqReadinessRoute({ initialDay }: { initialDay?: number }) {
  return <SubjectMcqReadinessRoom plan={disasterManagementPlan} initialDay={initialDay} />;
}
