"use client";

import { SubjectCommandRoom } from "@/components/upsc/SubjectCommandRoom";
import { internalSecuritySocietyPlan } from "@/lib/upsc/subjectPlans";

export default function InternalSecuritySocietyPage() {
  return <SubjectCommandRoom plan={internalSecuritySocietyPlan} />;
}
