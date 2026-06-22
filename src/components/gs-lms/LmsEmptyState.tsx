"use client";

import type { ReactNode } from "react";

interface LmsEmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
}

export function LmsEmptyState({ title, description, icon, action }: LmsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#fffdf8] rounded-xl border border-[--sl-border]">
      {icon && (
        <div className="mb-4 text-[--sl-emerald] text-4xl">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-[--sl-ink] mb-2">{title}</h3>
      <p className="text-sm text-[--sl-body] max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2 text-sm font-medium text-white bg-[--sl-primary] hover:bg-[--sl-primary-hover] rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
