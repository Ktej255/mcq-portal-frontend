"use client";

import React from "react";

interface FunnelProgressBarProps {
  totalSteps: number;
  currentStep: number; // 0-indexed
}

export default function FunnelProgressBar({
  totalSteps,
  currentStep
}: FunnelProgressBarProps) {
  if (totalSteps <= 1) return null;

  const percentage = Math.min(
    Math.max(Math.round(((currentStep + 1) / totalSteps) * 100), 0),
    100
  );

  return (
    <div className="w-full max-w-xl mx-auto mb-8 px-4">
      <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mb-2">
        <span>Progress</span>
        <span>
          Step {currentStep + 1} of {totalSteps} ({percentage}%)
        </span>
      </div>
      <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-[1px]">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
