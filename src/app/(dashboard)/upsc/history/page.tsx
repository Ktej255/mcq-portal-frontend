"use client";

import { SubjectCommandRoom } from "@/components/upsc/SubjectCommandRoom";
import { historyPlan } from "@/lib/upsc/subjectPlans";

export default function HistoryPage() {
  return <SubjectCommandRoom plan={historyPlan} />;
}
