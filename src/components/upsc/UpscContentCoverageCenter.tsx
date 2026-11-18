"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileQuestion,
  Gauge,
  RefreshCcw,
  Search,
  ShieldAlert,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  contentCoverageService,
  type ContentCoverage,
  type TopicCoverage,
} from "@/services/api/contentCoverageService";
import { cn } from "@/lib/utils";

/**
 * Operator view over the exact learner-facing coverage gates.
 *
 * This page exists because the planning boards are local planning aids, not
 * evidence: when the learner sees "coverage gap on our side", an operator must
 * be able to point at the missing asset. Counts come from the LMS database.
 */

const SUBJECT = "geography";

type Filter = "gaps" | "ready" | "all";

const BLOCKER_COPY: Record<string, string> = {
  TOPIC_UNREVIEWED:
    "Topic is not reviewed — learners cannot see it anywhere in the syllabus.",
  CONTENT_MISSING: "No reviewed section is served, so the topic opens empty.",
  SECTION_GAP:
    "Depth gap — the canonical five-section funnel is incomplete. Learners can still read the reviewed sections.",
  UNREVIEWED_SECTIONS:
    "Draft sections are waiting on review, so learners do not see them yet.",
  DEMAND_UNMAPPED:
    "No reviewed PYQ on this topic, so demand and readiness cannot be measured for it.",
  MCQ_LAB_SHORT:
    "MCQ Lab stays locked until 15 reviewed questions exist; it never backfills from another topic.",
};

const PRETTY_LABELS: Record<string, string> = {
  NCERT_LEVEL: "NCERT level",
  CURRENT_AFFAIRS: "Current affairs",
  EXAMINER_TRAPS: "Examiner traps",
  MATCH_THE_FOLLOWING: "Match the following",
};

function prettyLabel(value: string) {
  if (PRETTY_LABELS[value]) return PRETTY_LABELS[value];
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stateOf(topic: TopicCoverage) {
  if (!topic.topic_reviewed) {
    return {
      label: "Hidden",
      tone: "border-[#d9c1c1] bg-[#fdf1f1] text-[#8a3b3b]",
    };
  }
  if (topic.learner_ready) {
    return {
      label: "Loop-ready",
      tone: "border-[#b9d9c9] bg-[#eaf6ef] text-[#125c43]",
    };
  }
  return {
    label: "Partial",
    tone: "border-[#e6d3a8] bg-[#fff8e8] text-[#7a5412]",
  };
}

function GateBar({
  value,
  max,
  tone,
}: {
  value: number;
  max: number;
  tone: "green" | "amber" | "red";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eee9dd]">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "green" && "bg-[#1d9e75]",
          tone === "amber" && "bg-[#c7922f]",
          tone === "red" && "bg-[#b45454]",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "green" | "amber" | "red" | "neutral";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4",
        tone === "green" && "border-[#cfe4d8]",
        tone === "amber" && "border-[#ead9b4]",
        tone === "red" && "border-[#e3c8c8]",
        tone === "neutral" && "border-[#dcd5c7]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7a70]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-[#13251d]">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#4f5e55]">{detail}</p>
    </div>
  );
}

export function UpscContentCoverageCenter() {
  const [data, setData] = useState<ContentCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("gaps");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError(null);
      }
    });

    contentCoverageService
      .getContentCoverage(SUBJECT)
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) {
          setError(
            "Coverage could not be loaded. The endpoint is admin-only; check that you are signed in as an operator, then retry.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const topics = useMemo(() => data?.topics ?? [], [data]);
  const gaps = useMemo(() => topics.filter((topic) => !topic.learner_ready), [topics]);
  const visibleTopics = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return topics.filter((topic) => {
      if (filter === "gaps" && topic.learner_ready) return false;
      if (filter === "ready" && !topic.learner_ready) return false;
      if (
        needle &&
        !topic.title.toLowerCase().includes(needle) &&
        !String(topic.node_id).includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [topics, filter, query]);

  const totals = data?.totals;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/upsc/readiness-audit"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4f5e55] hover:text-[#1d9e75]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Readiness audit
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#13251d]">
            Content coverage
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#4f5e55]">
            The database view of what a learner can actually reach. It mirrors the
            four gates the one-stop loop depends on: reviewed content, the five
            canonical sections, reviewed PYQs for demand, and a complete reviewed
            MCQ bank.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#dcd5c7] bg-white px-3 py-2 text-xs font-semibold text-[#254438] transition-colors hover:border-[#1d9e75] disabled:opacity-60"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-[#dcd5c7] bg-[#fbf8f1] px-4 py-3 text-xs leading-relaxed text-[#4f5e55]">
        <span className="font-semibold text-[#254438]">Read-only, and honest about the fix path.</span>{" "}
        Counts come from REVIEWED rows in the GS LMS database. To close a gate,
        extend the topic artifact (sections, <code>pyqs[]</code>,{" "}
        <code>mcq_questions[]</code>) and re-run the GS LMS importer; the importer
        is the only writer that stamps rows REVIEWED. A refresh updates content
        in place and never clears tables, so learner progress and record IDs
        survive; it also rejects malformed MCQs (not four unique options, or a
        correct answer outside them) instead of publishing them as reviewed.
        This page never edits content; it only reports which gate is blocking a
        topic. A topic can be readable and still be partial — for example, a
        legacy four-section topic completes for the learner but leaves a depth
        gap.
      </div>

      {loading && !data && (
        <div role="status" className="rounded-2xl border border-[#dcd5c7] bg-white p-8 text-center text-sm text-[#4f5e55]">
          Reading the learner gates from the LMS…
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#e3c8c8] bg-[#fdf1f1] p-5 text-sm text-[#7c3434]"
        >
          <p className="font-semibold">Coverage unavailable</p>
          <p className="mt-1 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#d7a9a9] bg-white px-3 py-1.5 text-xs font-semibold text-[#7c3434] hover:border-[#b45454]"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {data && totals && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              label="Loop-ready"
              value={`${totals.learner_ready}/${totals.topics}`}
              detail="Topics passing all four gates below."
              tone={totals.learner_ready === totals.topics ? "green" : "neutral"}
            />
            <SummaryCard
              label="Content open"
              value={`${totals.content_open}/${totals.topics}`}
              detail={`${totals.sections_reviewed}/${totals.sections_expected} reviewed sections are being served.`}
              tone={totals.content_open === totals.topics ? "green" : "amber"}
            />
            <SummaryCard
              label="Demand mapped"
              value={`${totals.demand_measured}/${totals.topics}`}
              detail={`${totals.pyqs_reviewed} reviewed PYQs feed the demand model.`}
              tone={totals.demand_measured === totals.topics ? "green" : "amber"}
            />
            <SummaryCard
              label="MCQ Lab open"
              value={`${totals.lab_open}/${totals.topics}`}
              detail={`${totals.mcqs_reviewed} reviewed questions; each lab needs ${data.mcq_lab_min}.`}
              tone={totals.lab_open === totals.topics ? "green" : "amber"}
            />
            <SummaryCard
              label="Five-section depth"
              value={`${totals.full_depth}/${totals.topics}`}
              detail="Topics with every canonical section reviewed."
              tone={totals.full_depth === totals.topics ? "green" : "amber"}
            />
          </div>

          {totals.topics_hidden > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-[#e3c8c8] bg-[#fdf1f1] px-4 py-3 text-sm text-[#7c3434]">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                <span className="font-semibold">
                  {totals.topics_hidden} topic{totals.topics_hidden === 1 ? "" : "s"}{" "}
                  hidden from learners.
                </span>{" "}
                They hold assets but are not REVIEWED, so they never appear in the
                syllabus. Hidden topics are counted in the totals above but cannot
                be opened from this page.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ["gaps", `Needs work (${gaps.length})`],
                  ["ready", `Loop-ready (${topics.length - gaps.length})`],
                  ["all", `All topics (${topics.length})`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    filter === value
                      ? "border-[#1d9e75] bg-[#eaf6ef] text-[#125c43]"
                      : "border-[#dcd5c7] bg-white text-[#4f5e55] hover:border-[#1d9e75]/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="relative">
              <span className="sr-only">Search topics</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a978f]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search topic or node id…"
                className="h-9 w-60 rounded-xl border border-[#dcd5c7] bg-white pl-9 pr-3 text-xs text-[#13251d] outline-none placeholder:text-[#8a978f] focus:border-[#1d9e75]"
              />
            </label>
          </div>

          <p className="text-xs text-[#6b7a70]">
            Showing {visibleTopics.length} of {topics.length} reviewed-syllabus
            slots. Gate counts are computed from REVIEWED rows only.
          </p>

          {visibleTopics.length === 0 ? (
            <div className="rounded-2xl border border-[#cfe4d8] bg-[#f2faf6] p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#1d9e75]" />
              <p className="mt-3 text-sm font-semibold text-[#125c43]">
                {filter === "gaps"
                  ? "Every topic passes all four gates."
                  : "No topics match this filter."}
              </p>
              <p className="mt-1 text-xs text-[#4f5e55]">
                {filter === "gaps"
                  ? "The learner-facing coverage gaps are closed for this subject."
                  : "Clear the search or switch filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTopics.map((topic) => {
                const state = stateOf(topic);
                const mcqShortfall = Math.max(0, topic.mcq_lab_min - topic.mcqs_reviewed);

                return (
                  <article
                    key={topic.node_id}
                    className="rounded-2xl border border-[#dcd5c7] bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn("border", state.tone)}>{state.label}</Badge>
                          <h2 className="text-sm font-semibold text-[#13251d]">
                            {topic.title}
                          </h2>
                          <span className="text-[11px] font-medium text-[#8a978f]">
                            node {topic.node_id}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#6b7a70]">
                          <span>
                            Sections {topic.sections_reviewed}/{topic.sections_expected}
                          </span>
                          <span>PYQs {topic.pyqs_reviewed}</span>
                          <span>
                            MCQs {topic.mcqs_reviewed}/{topic.mcq_lab_min}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {topic.topic_reviewed && (
                          <Link
                            href={`/upsc/${SUBJECT}/lms/topic/${topic.node_id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd5c7] px-2.5 py-1.5 text-[11px] font-semibold text-[#254438] hover:border-[#1d9e75]"
                          >
                            Open topic
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        <span
                          className="rounded-lg bg-[#f2ede2] px-2.5 py-1.5 text-[11px] font-medium text-[#6b5a3a]"
                          title="This view reports the gate; authoring happens in the topic artifact and the GS LMS importer."
                        >
                          Fix in topic artifact → importer
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl bg-[#fbf8f1] p-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#4f5e55]">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="h-3 w-3" /> Content
                          </span>
                          <span>
                            {topic.sections_reviewed}/{topic.sections_expected}
                          </span>
                        </div>
                        <div className="mt-2">
                          <GateBar
                            value={topic.sections_reviewed}
                            max={topic.sections_expected}
                            tone={
                              topic.sections_reviewed === topic.sections_expected
                                ? "green"
                                : "amber"
                            }
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#6b7a70]">
                          {topic.missing_sections.length === 0
                            ? "Canonical funnel complete."
                            : `Missing ${topic.missing_sections.map(prettyLabel).join(", ")}.`}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#fbf8f1] p-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#4f5e55]">
                          <span className="inline-flex items-center gap-1.5">
                            <Target className="h-3 w-3" /> Demand
                          </span>
                          <span>{topic.pyqs_reviewed} PYQ</span>
                        </div>
                        <div className="mt-2">
                          <GateBar
                            value={topic.pyqs_reviewed > 0 ? 1 : 0}
                            max={1}
                            tone={topic.demand_measured ? "green" : "amber"}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#6b7a70]">
                          {topic.demand_measured
                            ? `Prelims ${topic.prelims_pyqs_reviewed} · Mains ${topic.mains_pyqs_reviewed}.`
                            : "No reviewed PYQ — demand unmeasured."}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#fbf8f1] p-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#4f5e55]">
                          <span className="inline-flex items-center gap-1.5">
                            <FileQuestion className="h-3 w-3" /> MCQ Lab
                          </span>
                          <span>
                            {topic.mcqs_reviewed}/{topic.mcq_lab_min}
                          </span>
                        </div>
                        <div className="mt-2">
                          <GateBar
                            value={topic.mcqs_reviewed}
                            max={topic.mcq_lab_min}
                            tone={topic.lab_open ? "green" : "amber"}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#6b7a70]">
                          {topic.lab_open
                            ? "Lab open to learners."
                            : `Needs ${mcqShortfall} more reviewed question${mcqShortfall === 1 ? "" : "s"}.`}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#fbf8f1] p-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#4f5e55]">
                          <span className="inline-flex items-center gap-1.5">
                            <Gauge className="h-3 w-3" /> Review
                          </span>
                          <span>{topic.topic_reviewed ? "Live" : "Hidden"}</span>
                        </div>
                        <div className="mt-2">
                          <GateBar
                            value={topic.topic_reviewed ? 1 : 0}
                            max={1}
                            tone={topic.topic_reviewed ? "green" : "red"}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#6b7a70]">
                          {topic.sections_unreviewed > 0
                            ? `${topic.sections_unreviewed} draft section${topic.sections_unreviewed === 1 ? "" : "s"} not reviewed.`
                            : "No draft sections pending."}
                          {!topic.full_depth && topic.topic_reviewed
                            ? " Depth gap noted."
                            : ""}
                        </p>
                      </div>
                    </div>

                    {topic.blockers.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {topic.blockers.map((blocker) => (
                          <div
                            key={blocker}
                            className="flex items-start gap-2 text-[11px] leading-relaxed text-[#7a5412]"
                          >
                            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#c7922f]" />
                            <span>
                              {BLOCKER_COPY[blocker] ?? blocker}
                              {blocker === "MCQ_LAB_SHORT" && (
                                <span className="ml-1 font-semibold">
                                  ({mcqShortfall} short)
                                </span>
                              )}
                              {blocker === "UNREVIEWED_SECTIONS" && (
                                <span className="ml-1 font-semibold">
                                  ({topic.sections_unreviewed} pending)
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {Object.keys(topic.mcq_types).length > 0 && (
                      <details className="mt-3 text-[11px] text-[#6b7a70]">
                        <summary className="cursor-pointer font-semibold text-[#4f5e55]">
                          Reviewed question mix
                        </summary>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {Object.entries(topic.mcq_types).map(([type, count]) => (
                            <span
                              key={type}
                              className="rounded-full border border-[#dcd5c7] bg-[#fbf8f1] px-2 py-0.5 font-medium"
                            >
                              {prettyLabel(type)} ×{count}
                            </span>
                          ))}
                        </div>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <p className="border-t border-[#e8e2d5] pt-3 text-[11px] leading-relaxed text-[#8a978f]">
            Generated {new Date(data.generated_at).toLocaleString()}. Demand counts
            only REVIEWED PYQs on this topic; MCQ Lab counts only REVIEWED
            questions; content counts only REVIEWED sections. A hidden topic is
            still counted in subject totals so its assets are not mistaken for live
            coverage.
          </p>
        </>
      )}
    </div>
  );
}
