"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/services/api/client";

type Overview = {
  students: number;
  tests: number;
  questions_published: number;
  questions_draft: number;
  attempts_submitted: number;
  attempts_in_progress: number;
  attempts_last_7_days: number;
  leads: number;
  leads_last_7_days: number;
};

/** Live numbers for the operator dashboard, read from the database on each visit. */
export function OperatorOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("admin/overview")
      .then((response) => {
        if (!cancelled) setOverview(response.data?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900"
      >
        The live numbers could not be read. Check that you are signed in as an admin and that the backend is reachable.
      </p>
    );
  }

  const cards = overview
    ? [
        { label: "Students", value: overview.students, detail: "Accounts with the student role." },
        {
          label: "Tests",
          value: overview.tests,
          detail: `${overview.questions_published} published questions, ${overview.questions_draft} not yet published.`,
        },
        {
          label: "Attempts submitted",
          value: overview.attempts_submitted,
          detail: `${overview.attempts_in_progress} in progress. ${overview.attempts_last_7_days} started in the last 7 days.`,
        },
        { label: "Leads", value: overview.leads, detail: `${overview.leads_last_7_days} in the last 7 days.` },
      ]
    : [];

  return (
    <section
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      aria-label="Live numbers"
      aria-busy={!overview}
      data-testid="admin-overview"
    >
      {overview
        ? cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-zinc-500">{card.label}</p>
              <p className="mt-3 text-3xl font-black tabular-nums text-zinc-950">{card.value}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{card.detail}</p>
            </div>
          ))
        : [0, 1, 2, 3].map((slot) => (
            <div key={slot} className="h-36 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100" />
          ))}
    </section>
  );
}
