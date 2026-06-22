"use client";

import { PlannerUI } from "@/components/gs-lms/PlannerUI";

export default function PlannerPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">
        Daily Planner
      </h1>
      <PlannerUI />
    </div>
  );
}
