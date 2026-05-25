"use client";

import { SubjectCommandRoom } from "@/components/upsc/SubjectCommandRoom";
import { disasterManagementPlan } from "@/lib/upsc/subjectPlans";

export default function DisasterManagementPage() {
  return <SubjectCommandRoom plan={disasterManagementPlan} />;
}
