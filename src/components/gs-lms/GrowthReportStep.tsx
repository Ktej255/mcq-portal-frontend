"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Target, Calendar, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { funnelService, GrowthReportOut } from '@/services/api/funnelService';

/**
 * GrowthReportStep — Comprehensive analytics dashboard displayed at
 * funnel completion. Shows reading times, recall scores, MCQ results,
 * spaced repetition schedule, and weakness identification.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7
 */

interface GrowthReportStepProps {
  nodeId: number;
  subject?: string;
  onComplete?: () => void | Promise<void>;
  /**
   * When false the completion action is hidden. Used on an already-completed
   * topic, where the report is shown for reference only.
   */
  showCompleteAction?: boolean;
}

export function GrowthReportStep({
  nodeId,
  subject = "geography",
  onComplete,
  showCompleteAction = true,
}: GrowthReportStepProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{
    key: string;
    report: GrowthReportOut | null;
    error: string | null;
  }>({ key: "", report: null, error: null });

  // Result, error and loading are keyed to the request that produced them, so a
  // new topic or retry never shows the previous request's state and no state has
  // to be cleared when the effect starts.
  const requestKey = `${subject}:${nodeId}:${retryCount}`;
  const settled = loadedKey === requestKey && outcome.key === requestKey;
  const loading = !settled;
  const report = settled ? outcome.report : null;
  const error = settled ? outcome.error : null;
  const canComplete = Boolean(onComplete) && showCompleteAction;

  useEffect(() => {
    let cancelled = false;

    funnelService.getGrowthReport(subject, nodeId)
      .then((data) => {
        if (!cancelled) setOutcome({ key: requestKey, report: data, error: null });
      })
      .catch(() => {
        if (!cancelled) setOutcome({ key: requestKey, report: null, error: 'We could not prepare your growth report.' });
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId, subject, requestKey]);

  const handleRetry = () => {
    setRetryCount((count) => count + 1);
  };

  // Aggregating the report is a read of progress that is already saved. A
  // failed aggregate must never trap the learner on the final step, so the
  // error state offers an explicit, honest way to finish the topic without it.
  const handleContinueWithoutReport = async () => {
    if (!onComplete || continuing) return;
    setContinuing(true);
    setContinueError(null);
    try {
      await onComplete();
    } catch {
      setContinueError('We could not finish the topic. Please try again.');
    } finally {
      setContinuing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-[#e7f5ee] rounded-2xl" />
        <div className="h-24 bg-[#fffdf8] rounded-xl" />
        <div className="h-24 bg-[#fffdf8] rounded-xl" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p className="text-sm font-bold text-red-800">
          {error || 'Your growth report is not available right now.'}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-red-900/80">
          Everything you completed in this topic is already saved. You can retry
          the report, or finish the topic now and open the report later from the
          completed topic.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-red-800 px-4 py-2 text-xs font-black text-white"
          >
            Retry report
          </button>
          {canComplete && (
            <button
              type="button"
              onClick={() => void handleContinueWithoutReport()}
              disabled={continuing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd5c7] bg-white px-4 py-2 text-xs font-black text-[#1a3a2a] disabled:opacity-60"
            >
              {continuing ? 'Finishing…' : 'Finish topic without the report'}
              {!continuing && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        {continueError && (
          <p className="mt-3 text-xs font-bold text-red-800">{continueError}</p>
        )}
      </div>
    );
  }

  const recallEvidenceCount = report.section_metrics.filter(
    (section) => section.has_recall_evidence === true
  ).length;
  const unevidencedSections = report.section_metrics.filter(
    (section) =>
      section.has_reading_evidence === false || section.has_recall_evidence === false
  ).length;
  const mcqMissing = report.has_mcq_evidence === false;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-[#1d9e75] p-6 text-white"
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5" />
          <h2 className="text-sm font-black">Growth Report</h2>
        </div>
        <p className="text-lg font-black">{report.topic_title}</p>
        <p className="text-[10px] opacity-80 mt-1">
          Completed {new Date(report.generated_at).toLocaleDateString()}
        </p>
      </motion.div>

      {/* Section Metrics */}
      <div className="space-y-2">
        <h3 className="text-xs font-black text-[#49675e] uppercase flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Section Performance
        </h3>
        {unevidencedSections > 0 && (
          <p className="rounded-lg border border-[#efd8a7] bg-[#fff8e8] px-3 py-2 text-[10px] leading-relaxed text-[#6f4a12]">
            {unevidencedSections === 1 ? 'One section has' : `${unevidencedSections} sections have`}{' '}
            no recorded reading or recall. They are marked as not recorded
            instead of being scored as zero, so this report does not treat
            missing evidence as weak preparation.
          </p>
        )}
        {report.section_metrics.map((section, idx) => {
          const recallMissing = section.has_recall_evidence === false;
          const readingMissing = section.has_reading_evidence === false;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-lg border border-[#dcd5c7] bg-white p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-[#1a3a2a]">
                  {section.section_label.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#49675e]">
                    {readingMissing
                      ? 'Reading not recorded'
                      : `${Math.floor(section.reading_time_seconds / 60)}m ${section.reading_time_seconds % 60}s`}
                  </span>
                  <span
                    className={`text-xs font-black ${
                      recallMissing
                        ? 'text-[#49675e]'
                        : section.recall_score >= 60
                          ? 'text-[#1d9e75]'
                          : 'text-amber-600'
                    }`}
                  >
                    {recallMissing ? 'No recall check' : `${section.recall_score}%`}
                  </span>
                  {!recallMissing && (
                    <span className="text-[10px] font-black text-[#49675e]">
                      {section.confidence_score}% confidence
                    </span>
                  )}
                </div>
              </div>
              {section.is_rushed && !readingMissing && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] text-amber-700">Rushed — consider re-reading</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* MCQ Lab Score */}
      <div className="rounded-xl border border-[#b9d9cd] bg-[#fffdf8] p-4">
        <h3 className="text-xs font-black text-[#49675e] uppercase flex items-center gap-1.5 mb-3">
          <Target className="h-3.5 w-3.5" /> MCQ Lab
        </h3>
        {mcqMissing ? (
          <div>
            <div className="text-sm font-black text-[#49675e]">Not taken</div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#49675e]">
              No MCQ Lab result was recorded for this topic. It is marked as not
              taken instead of being scored as zero.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-[#1d9e75]">{report.mcq_total_score}%</div>
              <div className="text-[10px] text-[#49675e]">Score</div>
            </div>
            <div className="flex-1 space-y-1">
              {report.mcq_type_breakdown.map((tb) => (
                <div key={tb.question_type} className="flex items-center justify-between text-[10px]">
                  <span className="text-[#5d675f]">{tb.question_type.replace(/_/g, ' ')}</span>
                  <span className={`font-black ${tb.accuracy >= 50 ? 'text-[#085041]' : 'text-red-600'}`}>
                    {tb.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mains Score (if attempted) */}
      {report.mains_score !== null && (
        <div className="rounded-xl border border-[#0f766e]/20 bg-[#0f766e]/5 p-4">
          <h3 className="text-xs font-black text-[#0f766e] uppercase mb-1">Mains Evaluation</h3>
          <div className="text-xl font-black text-[#0f766e]">
            {report.mains_score}/{report.mains_max_marks} marks
          </div>
        </div>
      )}

      {/* Spaced Repetition Schedule */}
      <div className="rounded-xl border border-[#b9d9cd] bg-white p-4">
        <h3 className="text-xs font-black text-[#49675e] uppercase flex items-center gap-1.5 mb-2">
          <Calendar className="h-3.5 w-3.5" /> Next section recall
        </h3>
        <p className="text-sm font-black text-[#1a3a2a]">
          {new Date(report.next_recall_date).toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'short'
          })}
        </p>
        <p className="text-[10px] text-[#49675e] mt-0.5">
          {recallEvidenceCount > 0
            ? `In ${report.recall_interval_days} days — based on the recall checks you recorded`
            : `In ${report.recall_interval_days} days — scheduled conservatively because no recall check was recorded`}
        </p>
        <p className="text-[10px] text-[#49675e]/80 mt-1">
          First-pass recall for this topic&apos;s sections. Separate from the
          Day 3/7/21 topic revisits listed in Today.
        </p>
      </div>

      {/* Historical Comparison */}
      {report.comparison && report.comparison.report_count > 0 && (
        <div className="rounded-xl border border-[#dcd5c7] bg-white p-4">
          <h3 className="text-xs font-black text-[#49675e] uppercase mb-2">Improvement Trend</h3>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-sm font-black text-[#1d9e75]">
                {report.comparison.avg_recall_trend.length > 1
                  ? `${(report.comparison.avg_recall_trend[report.comparison.avg_recall_trend.length - 1] - report.comparison.avg_recall_trend[0]).toFixed(0)}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-[#49675e]">Recall Δ</div>
            </div>
            <div>
              <div className="text-sm font-black text-[#085041]">
                {report.comparison.mcq_accuracy_trend.length > 1
                  ? `${(report.comparison.mcq_accuracy_trend[report.comparison.mcq_accuracy_trend.length - 1] - report.comparison.mcq_accuracy_trend[0]).toFixed(0)}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-[#49675e]">MCQ Δ</div>
            </div>
            <div>
              <div className="text-sm font-black text-[#1a3a2a]">{report.comparison.report_count}</div>
              <div className="text-[10px] text-[#49675e]">Topics done</div>
            </div>
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {report.weaknesses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-black text-[#49675e] uppercase flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Focus Areas
          </h3>
          {report.weaknesses.map((w, idx) => (
            <div key={idx} className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-black text-amber-900">{w.label}</p>
                <p className="text-[10px] text-amber-700 mt-0.5">{w.recommended_action}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Button */}
      {canComplete && onComplete && (
        <button
          type="button"
          onClick={() => void handleContinueWithoutReport()}
          disabled={continuing}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          {continuing ? 'Marking topic complete…' : 'Topic Complete — View Next'}
        </button>
      )}
      {canComplete && continueError && (
        <p role="alert" className="text-center text-xs font-bold text-red-700">
          {continueError}
        </p>
      )}
    </div>
  );
}

export default GrowthReportStep;
