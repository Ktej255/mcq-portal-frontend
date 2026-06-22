"use client";

import { GapDashboard } from "@/components/gs-lms/GapDashboard";

export default function GapsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">
        Gaps &amp; Weak Areas
      </h1>
      <GapDashboard />
    </div>
  );
}
