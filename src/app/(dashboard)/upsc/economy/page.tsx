"use client";

import { SubjectCommandRoom } from "@/components/upsc/SubjectCommandRoom";
import { economyPlan } from "@/lib/upsc/subjectPlans";

export default function EconomyPage() {
  return <SubjectCommandRoom plan={economyPlan} />;
}
