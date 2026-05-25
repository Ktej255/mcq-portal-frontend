"use client";

import { SubjectCommandRoom } from "@/components/upsc/SubjectCommandRoom";
import { polityGovernancePlan } from "@/lib/upsc/subjectPlans";

export default function PolityGovernancePage() {
  return <SubjectCommandRoom plan={polityGovernancePlan} />;
}
