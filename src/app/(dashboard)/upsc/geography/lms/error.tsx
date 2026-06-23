"use client";

import { useEffect } from "react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LmsErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[LMS Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#1a3a2a]">
          Something went wrong
        </h2>
        <p className="text-sm text-[#13251d]/60">
          An unexpected error occurred. You can try again or go back to the
          syllabus.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1d9e75] rounded-lg hover:bg-[#178a65] transition-colors"
          >
            Try Again
          </button>
          <a
            href="/upsc/geography/lms/syllabus"
            className="px-4 py-2 text-sm font-medium text-[#1d9e75] border border-[#1d9e75] rounded-lg hover:bg-[#1d9e75]/5 transition-colors"
          >
            Back to Syllabus
          </a>
        </div>
      </div>
    </div>
  );
}
