"use client";

import { SubjectCommandRoom } from "@/components/upsc/SubjectCommandRoom";
import { scienceTechPlan } from "@/lib/upsc/subjectPlans";

export default function ScienceTechPage() {
  return <SubjectCommandRoom plan={scienceTechPlan} />;
}
