"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Brain, Target, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  onComplete?: () => void;
}

export function GrowthReportStep({ nodeId, subject = "geography", onComplete }: GrowthReportStepProps) {
  const [report, setReport] = useState<GrowthReportOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    funnelService.getGrowthReport(subject, nodeId)
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to generate growth report');
        setLoading(false);
      });
  }, [nodeId, subject]);

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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-800">{error || 'Report unavailable'}</p>
      </div>
    );
  }

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
        {report.section_metrics.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-lg border border-[#dcd5c7] bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1a3a2a]">
                {section.section_label.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#49675e]">
                  {Math.floor(section.reading_time_seconds / 60)}m {section.reading_time_seconds % 60}s
                </span>
                <span className={`text-xs font-black ${section.recall_score >= 60 ? 'text-[#1d9e75]' : 'text-amber-600'}`}>
                  {section.recall_score}%
                </span>
              </div>
            </div>
            {section.is_rushed && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] text-amber-700">Rushed — consider re-reading</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* MCQ Lab Score */}
      <div className="rounded-xl border border-[#b9d9cd] bg-[#fffdf8] p-4">
        <h3 className="text-xs font-black text-[#49675e] uppercase flex items-center gap-1.5 mb-3">
          <Target className="h-3.5 w-3.5" /> MCQ Lab
        </h3>
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
          <Calendar className="h-3.5 w-3.5" /> Next Recall Session
        </h3>
        <p className="text-sm font-black text-[#1a3a2a]">
          {new Date(report.next_recall_date).toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'short'
          })}
        </p>
        <p className="text-[10px] text-[#49675e] mt-0.5">
          In {report.recall_interval_days} days — based on your recall performance
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
      {onComplete && (
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" /> Topic Complete — View Next
        </button>
      )}
    </div>
  );
}

export default GrowthReportStep;
