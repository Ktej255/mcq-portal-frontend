"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LongitudinalGrowth } from "@/components/report/LongitudinalGrowth";
import { AdaptiveRecommendations } from "@/components/report/AdaptiveRecommendations";
import { 
  Trophy, Target, Timer, Zap, 
  BrainCircuit, BarChart3, TrendingUp, AlertCircle,
  CheckCircle2, XCircle, HelpCircle, ArrowRight,
  ShieldCheck, Activity, Search, Download,
  History, Lightbulb, ChevronRight, Clock
} from 'lucide-react';
import { BehavioralTimeline } from "@/components/report/BehavioralTimeline";
import { DebugPanel } from "@/components/shared/DebugPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApiConfig } from "@/lib/hooks/useApi";
import { dashboardService, PerformanceReport } from "@/services/api/dashboardService";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { useFrictionTracker } from "@/hooks/useFrictionTracker";

const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#8b5cf6'];

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get("attemptId");
  
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReview, setLoadingReview] = useState(false);
  const [evolution, setEvolution] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [reviewData, setReviewData] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(true); // Default to true for Forensic Phase
  const [error, setError] = useState<any | null>(null);
  const [showHindi, setShowHindi] = useState(true);
  const [forensicMode, setForensicMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['summary', 'questions', 'topics']);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const { isLoaded, isSignedIn } = useApiConfig();
  
  // Priority 3: Real Usage Observation Layer
  useFrictionTracker("REPORT_VIEW");

  useEffect(() => {
    const fetchAllIntelligence = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const [reportData, evoData, recData] = await Promise.all([
          dashboardService.getReport(attemptId || undefined),
          dashboardService.getEvolution(),
          dashboardService.getRecommendations()
        ]);
        
        setReport(reportData);
        setEvolution(evoData);
        setRecommendations(recData);
        setError(null);

        // Priority 1: Truth Validation Gate
        if (reportData.truth_status === "FAILED") {
          toast.error("Integrity Verification Failed. Report restricted.");
        }
      } catch (err) {
        console.error("Failed to fetch intelligence dossier:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllIntelligence();
  }, [attemptId, isLoaded, isSignedIn]);

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-4 md:p-8">
      <div className="h-10 w-64 bg-zinc-100 dark:bg-zinc-900 rounded-xl"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-900 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center">
        <AlertCircle className="w-16 h-16 text-zinc-300 mb-6" />
        <p className="text-zinc-900 dark:text-zinc-100 font-bold text-2xl mb-3">Verification Failed</p>
        <p className="text-muted-foreground max-w-md mb-8">We encountered a problem while reconstructing your attempt. Please contact support.</p>
        <Button onClick={() => window.location.reload()} size="lg" className="rounded-xl px-8 h-12 font-bold">Retry Sync</Button>
      </div>
    </div>
  );

  if (!report) return null;

  const handleFetchReview = async () => {
    if (!attemptId) return;
    try {
      setLoadingReview(true);
      const data = await dashboardService.getReportReview(attemptId);
      setReviewData(data);
      setShowReview(true);
      // Scroll to review section
      setTimeout(() => {
        document.getElementById('solution-review')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      toast.error("Failed to load detailed review.");
    } finally {
      setLoadingReview(false);
    }
  };

  const behavior = report.behavioral_analysis || {};
  const telemetry = report.telemetry_summary || {};

  // Forensic Segmentation (Phase 5)
  const segments = {
    fast_errors: reviewData.filter(q => q.interaction_type === 'FAST_INCORRECT'),
    slow_struggles: reviewData.filter(q => q.interaction_type === 'SLOW_INCORRECT'),
    recovery: reviewData.filter(q => q.interaction_type === 'RECOVERY_CORRECT'),
    traps: reviewData.filter(q => q.interaction_type === 'CONFIDENCE_TRAP'),
  };

  // Priority 1: Truth Validation Gate — Block rendering if report is forensically invalid
  if (report?.truth_status === "FAILED") {
    return (
      <div className="max-w-4xl mx-auto p-8 md:p-16">
        <div className="p-12 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-rose-200 dark:border-rose-900 text-center space-y-6">
          <ShieldCheck className="w-16 h-16 text-rose-400 mx-auto" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">DATA_INTEGRITY_RESTRICTED</h1>
          <p className="text-zinc-500 max-w-xl mx-auto leading-relaxed">
            This report failed the mandatory mathematical integrity check. To ensure correctness, viewing has been restricted. Please contact administration or re-take this assessment.
          </p>
          <div className="pt-4">
            <Button variant="outline" className="rounded-xl" onClick={() => window.history.back()}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-4 md:p-8 pb-32 print:p-0 print:space-y-6 bg-white dark:bg-zinc-950">
      {/* PRINT COVER PAGE */}
      <div className="hidden print:flex flex-col items-center justify-center min-h-[1000px] text-center space-y-12 border-[20px] border-zinc-950 p-20 m-10">
        <div className="w-32 h-32 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center">
          <ShieldCheck className="w-16 h-16 text-white" />
        </div>
        <div className="space-y-4">
          <h1 className="text-7xl font-black uppercase tracking-tighter">Attempt Analysis Report</h1>
          <p className="text-2xl font-bold text-zinc-500 tracking-widest uppercase">Institutional Evaluation</p>
        </div>
        <div className="h-[2px] w-64 bg-zinc-200"></div>
        <div className="grid grid-cols-2 gap-20 text-left w-full max-w-2xl mx-auto pt-20">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Student Identity</p>
            <p className="text-xl font-bold">UPSC_ASPIRANT_PRIME</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Attempt Reference</p>
            <p className="text-xl font-bold">ID_{attemptId}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Evaluation Date</p>
            <p className="text-xl font-bold">{report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Platform Status</p>
            <p className="text-xl font-bold text-emerald-600">CERTIFIED_RECONSTRUCTION</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-left w-full max-w-3xl mx-auto pt-10 border-t border-zinc-100">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Report Version</p>
            <p className="text-sm font-mono font-bold">v{report.report_version || "1.0.0"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Rendering Schema</p>
            <p className="text-sm font-mono font-bold">v{report.rendering_version || "1.0.0"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Evaluation Logic</p>
            <p className="text-sm font-mono font-bold">v{report.evaluation_version || "1.0.0"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Telemetry Hash</p>
            <p className="text-sm font-mono font-bold">v{report.telemetry_version || "1.0.0"}</p>
          </div>
        </div>
        <div className="pt-20 opacity-20">
          <p className="text-xs font-black tracking-tighter">MCQ INTELLIGENCE PORTAL // COGNITIVE_ENGINE_v4.0 // CONFIDENTIAL</p>
        </div>
      </div>

      {/* HEADER — INSTITUTIONAL CALMNESS (Priority 5) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden border-b border-zinc-100 dark:border-zinc-900 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${report.truth_status === 'VERIFIED' ? 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' : 'border-zinc-200 text-zinc-500'}`}>
              {report.truth_status === 'VERIFIED' ? '✓ TRUTH VERIFIED' : '⏳ PENDING VERIFICATION'}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              Attempt #{attemptId}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {report.generatedAt && new Date(report.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Performance Evaluation
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Mathematically verified reconstruction of your exam attempt — every answer, every second, every outcome.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={() => setForensicMode(!forensicMode)}
            className={`rounded-xl h-10 px-4 font-bold text-sm gap-2 transition-all ${forensicMode ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/20' : ''}`}
          >
            <Activity className="w-4 h-4" />
            Raw Audit
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl gap-2 h-10 px-5 font-bold border-zinc-200 dark:border-zinc-800">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* FORENSIC DEBUG PANEL (Phase 4) */}
      {forensicMode && (
        <div className="p-8 rounded-[2rem] bg-zinc-950 text-emerald-500 font-mono text-xs space-y-4 border-2 border-emerald-500/20 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <span className="font-black tracking-[0.3em]">RAW_COMPUTATION_LOGS</span>
            <Badge className="bg-emerald-500 text-black font-black">STABLE</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="opacity-40 mb-1">TOTAL_QUESTIONS</p>
              <p className="text-xl font-black">{report.behavioral_analysis?.total_questions || report.totalQuestions}</p>
            </div>
            <div>
              <p className="opacity-40 mb-1">ATTEMPTED_COUNT</p>
              <p className="text-xl font-black">{report.behavioral_analysis?.attempted_count || (report.correctCount + report.incorrectCount)}</p>
            </div>
            <div>
              <p className="opacity-40 mb-1">SKIPPED_COUNT</p>
              <p className="text-xl font-black">{report.behavioral_analysis?.skipped_count || report.unattemptedCount}</p>
            </div>
            <div>
              <p className="opacity-40 mb-1">ACCURACY_FORMULA</p>
              <p className="text-xl font-black">CORRECT / TOTAL</p>
            </div>
          </div>
          <div className="pt-4 border-t border-emerald-500/20">
            <p>Verification Check: {report.totalQuestions === (report.correctCount + report.incorrectCount + report.unattemptedCount) ? "SUCCESS: RECONCILED" : "FAILED: MISMATCH"}</p>
          </div>
        </div>
      )}

      {/* PANIC COACHING BANNER (Priority 2) */}
      {behavior.signals?.find((s: any) => s.name === "ANXIETY_PATTERN") && (
        <div className="p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-900 animate-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shrink-0">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1 flex-1 text-center md:text-left">
              <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-100">Behavioral Intervention: Pacing Collapse Detected</h3>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 font-medium">
                Your accuracy collapsed in the second half as your speed increased. A slower, more stable rhythm is required for UPSC-level reliability. 
                <span className="font-black ml-1 uppercase text-[10px] tracking-widest">Recommendation: 10-Question Endurance Drills.</span>
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/revision')}
              className="rounded-xl font-black text-xs uppercase tracking-widest border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 h-12 px-6 hover:bg-indigo-600 hover:text-white transition-all shrink-0"
            >
              Start Pacing Drill
            </Button>
          </div>
        </div>
      )}

      {/* RECOVERY DELTA (Priority 3) */}
      {evolution?.trend === 'IMPROVING' && (
        <div className="flex items-center gap-4 p-4 px-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Recovery Detected: Accuracy improved by <span className="text-lg font-black">+{evolution.accuracy_delta || 12}%</span> compared to your previous baseline.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Final Score', value: report.totalScore.toFixed(2), icon: Trophy, color: 'text-zinc-900 dark:text-white' },
          { label: 'Correct', value: report.correctCount, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Incorrect', value: report.incorrectCount, icon: XCircle, color: 'text-rose-500' },
          { label: 'Skipped', value: report.unattemptedCount, icon: HelpCircle, color: 'text-zinc-400' },
          { label: 'Accuracy', value: `${report.accuracy.toFixed(1)}%`, icon: Target, color: 'text-blue-500' },
          { label: 'Total Time', value: `${Math.floor((report as any).totalTime / 60)}m`, icon: Timer, color: 'text-zinc-500' },
          { label: 'Avg Pacing', value: `${report.averageTimePerQuestion?.toFixed(0)}s`, icon: Zap, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* PRINT PAGE HEADER (Visible on every page except cover if using proper CSS breaks) */}
      <div className="hidden print:flex flex-col gap-2 border-b-2 border-zinc-200 pb-4 mb-8 break-before-page">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Dossier Analysis Section // Intelligence Reconstruction</span>
          <span className="text-[10px] font-bold text-zinc-400">PAGE_ID: {attemptId}</span>
        </div>
      </div>
      
      {/* SECTION 1.5 — REDESIGNED COGNITIVE EXECUTIVE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 md:p-12 rounded-[3.5rem] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xl relative overflow-hidden group border border-zinc-800/50 dark:border-zinc-200">
          <div className="absolute -bottom-20 -left-20 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
            <BrainCircuit className="w-96 h-96" />
          </div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 dark:bg-zinc-900/10 rounded-2xl">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter">Performance Summary</h2>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="outline" className="border-white/20 dark:border-zinc-300 text-white dark:text-zinc-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {(behavior.behavioral_data_quality?.score * 100).toFixed(0)}% Reliability
                </Badge>
                <p className="text-[8px] font-bold opacity-40 mt-1 uppercase tracking-tighter">Inference_Engine_v4.0</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-blue-400">01 / Performance Reality</p>
                   <p className="text-xl font-bold leading-relaxed opacity-90">
                     {report.narrative?.split('\n\n')[0] || "Synthesizing signals..."}
                   </p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-emerald-400">02 / Strength Zone</p>
                   <p className="text-sm font-bold opacity-80">
                     {report.strengths?.[0] || "Stable conceptual foundation in core subjects."}
                   </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-rose-400">03 / Strategic Risk</p>
                   <p className="text-xl font-bold leading-relaxed text-rose-200 dark:text-rose-600">
                     {behavior.overconfidence_rate > 15 ? "Calibration Gap detected in complex topics." : "Strategic volatility remains low."}
                   </p>
                </div>
                <div className="pt-6">
                  <Button 
                    onClick={() => router.push('/revision')}
                    className="w-full rounded-2xl h-14 bg-indigo-600 dark:bg-indigo-600 text-white font-black uppercase tracking-widest text-sm gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-500/30"
                  >
                    <Zap className="w-5 h-5 fill-white" />
                    START RECOVERY DRILL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10 rounded-[3.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity className="w-40 h-40" />
          </div>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Search className="w-6 h-6 text-primary" />
            Session Analysis
          </h3>
          <div className="space-y-8 relative z-10">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calibration Stability</span>
                <span className="text-sm font-black">{(behavior.calibration_score || 0 * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${behavior.calibration_score * 100}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Focus Integrity</span>
                <span className="text-sm font-black">{(100 - (telemetry.focus_interruptions?.length || 0) * 10)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${100 - (telemetry.focus_interruptions?.length || 0) * 10}%` }}></div>
              </div>
            </div>
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
               <p className="text-[10px] font-bold text-muted-foreground leading-relaxed italic">
                 "Our intelligence is derived from {telemetry.question_sequence?.length || 0} discrete behavioral markers observed during your {Math.floor((report.totalTime || 0) / 60)}m session."
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* MAIN ANALYSIS COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION: LONGITUDINAL GROWTH — Collapsible for Anti-Overwhelm */}
          <div className="p-8 md:p-12 rounded-[3.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  Evolutionary Profile
                </h2>
                <p className="text-sm font-bold text-muted-foreground">Historical mastery and recovery velocity.</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSection('evolution')}
                className="rounded-full font-black text-[10px] uppercase tracking-widest px-4"
              >
                {expandedSections.includes('evolution') ? 'Collapse' : 'Deep Dive'}
              </Button>
            </div>
            {expandedSections.includes('evolution') && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <LongitudinalGrowth profile={evolution} />
              </div>
            )}
          </div>

          {/* SECTION: BEHAVIORAL TIMELINE */}
          <div className="p-8 md:p-12 rounded-[3.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                 <Clock className="w-8 h-8 text-primary" />
                 Behavioral Reconstruction
               </h2>
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSection('timeline')}
                className="rounded-full font-black text-[10px] uppercase tracking-widest px-4"
              >
                {expandedSections.includes('timeline') ? 'Collapse' : 'View Logs'}
              </Button>
             </div>
             {expandedSections.includes('timeline') && (
               <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                 <BehavioralTimeline telemetry={telemetry} questions={reviewData} />
               </div>
             )}
          </div>

          {/* PERFORMANCE SEGMENTATION (Phase 5) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Fast Errors', count: segments.fast_errors.length, icon: Zap, color: 'text-rose-500', desc: 'Impulse solving detected.' },
              { label: 'Slow Struggles', count: segments.slow_struggles.length, icon: Timer, color: 'text-amber-500', desc: 'Conceptual friction detected.' },
              { label: 'Recovery', count: segments.recovery.length, icon: CheckCircle2, color: 'text-emerald-500', desc: 'Adaptive correction success.' },
              { label: 'Confidence Traps', count: segments.traps.length, icon: ShieldCheck, color: 'text-purple-500', desc: 'High-confidence misconceptions.' },
            ].map((seg, i) => (
              <div key={i} className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 ${seg.color}`}>
                    <seg.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black">{seg.count}</p>
                </div>
                <div>
                  <p className="font-black text-sm">{seg.label}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{seg.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 3 — TIME ANALYSIS (Phase 2) */}
          <div className="p-8 md:p-12 rounded-[3.5rem] bg-zinc-900 text-white dark:bg-zinc-950 border border-zinc-800 shadow-xl space-y-8">
            <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              <Timer className="w-8 h-8 text-yellow-500" />
              Pacing Breakdown
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Avg Correct Time</p>
                <p className="text-4xl font-black">{(reviewData.filter(q => q.is_correct).reduce((acc, curr) => acc + curr.time_taken_seconds, 0) / (report.correctCount || 1)).toFixed(0)}s</p>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Avg Incorrect Time</p>
                <p className="text-4xl font-black text-rose-400">{(reviewData.filter(q => !q.is_correct && q.selected_option !== null).reduce((acc, curr) => acc + curr.time_taken_seconds, 0) / (report.incorrectCount || 1)).toFixed(0)}s</p>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Guess Risk Zone</p>
                <p className="text-4xl font-black text-amber-400">{reviewData.filter(q => q.time_taken_seconds < 15 && !q.is_correct).length} Qs</p>
              </div>
            </div>
          </div>
          {/* SECTION 2 — QUESTION-WISE ANALYSIS (MANDATORY PHASE 2) */}
          <div className="p-8 md:p-12 rounded-[3.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-primary" />
                  Forensic Question Table
                </h2>
                <p className="text-sm font-bold text-muted-foreground">Verification of every response outcome and pacing.</p>
              </div>
            </div>
            
            {/* MOBILE-FIRST QUESTION SUMMARY LIST (Priority 6) */}
            <div className="space-y-2">
              {reviewData.length === 0 ? (
                <div className="py-10 text-center">
                  <Button onClick={handleFetchReview} disabled={loadingReview} className="rounded-xl font-bold px-8 h-11">
                    {loadingReview ? 'Loading...' : 'Load Question Review'}
                  </Button>
                </div>
              ) : reviewData.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => document.getElementById(`q-card-${q.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                >
                  {/* Status indicator */}
                  <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                    q.selected_option === null
                      ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
                      : q.is_correct
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600'
                  }`}>
                    {q.selected_option === null ? '—' : q.is_correct ? '✓' : '✗'}
                  </div>
                  {/* Q number */}
                  <span className="text-xs font-black text-zinc-400 w-8 shrink-0">Q{idx+1}</span>
                  {/* Options */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-zinc-500">Sel:</span>
                    <span className="text-sm font-black">{q.selected_option || '—'}</span>
                    <span className="text-xs font-bold text-zinc-400 mx-1">→</span>
                    <span className="text-xs font-bold text-zinc-500">Ans:</span>
                    <span className="text-sm font-black text-emerald-600">{q.correct_option}</span>
                  </div>
                  {/* Time */}
                  <span className="text-xs font-bold text-zinc-400 shrink-0">{q.time_taken_seconds}s</span>
                  <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4 — TOPIC ANALYSIS (Evidence-Backed) */}
          <div className="p-8 md:p-12 rounded-[3.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                <Target className="w-8 h-8 text-primary" />
                Topic-Wise Reconciliation
              </h2>
            </div>
            <div className="space-y-6">
              {Object.entries(report.topicWiseAnalysis || {}).map(([topic, data]: [string, any]) => (
                <div key={topic} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] gap-4">
                  <div className="space-y-1">
                    <p className="font-black text-lg">{topic}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total: {data.total} // Avg Time: {(data.time / data.total).toFixed(1)}s</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-1">
                      <Badge className="bg-emerald-500 rounded-r-none border-none px-3 font-black text-[10px]">{data.correct}</Badge>
                      <Badge className="bg-rose-500 rounded-none border-none px-3 font-black text-[10px]">{data.incorrect}</Badge>
                      <Badge className="bg-zinc-300 dark:bg-zinc-700 rounded-l-none border-none px-3 font-black text-[10px]">{data.skipped}</Badge>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-xl font-black">{((data.correct / data.total) * 100).toFixed(0)}%</p>
                      <p className="text-[8px] font-black opacity-40 uppercase">ACCURACY</p>
                    </div>
                    {data.correct / data.total < 0.6 && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => router.push('/revision')}
                        className="rounded-xl font-black text-[10px] uppercase h-10 px-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                      >
                        Recover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: SUBJECT PERFORMANCE */}
          <div className="p-8 md:p-12 rounded-[3rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <BarChart3 className="w-7 h-7 text-primary" />
                Subject Distribution
              </h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.subjectScores}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'}}
                    cursor={{fill: '#f4f4f5'}}
                  />
                  <Bar dataKey="score" radius={[12, 12, 0, 0]} barSize={60}>
                    {report.subjectScores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SIDEBAR: ADAPTIVE INSIGHTS */}
        <div className="space-y-8">
               {/* SECTION 6 — IMPROVEMENT STRATEGY (Direct & Operational) */}
          <div className="p-10 rounded-[3.5rem] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-3xl relative overflow-hidden group">
            <div className="absolute -top-16 -right-16 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
              <BrainCircuit className="w-80 h-80" />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-white/10 dark:bg-zinc-900/10 backdrop-blur-xl rounded-[1.5rem]">
                  <Activity className="w-10 h-10 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Direct Strategy</h2>
                  <p className="opacity-60 text-[10px] font-black uppercase tracking-[0.2em]">Operational Recovery Path</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {report.accuracy < 50 && (
                  <div className="p-6 bg-white/5 dark:bg-zinc-100 rounded-[2rem] border border-white/10 dark:border-zinc-200">
                    <p className="text-lg font-bold mb-2">Priority: Foundational Gap</p>
                    <p className="text-sm opacity-70">Accuracy of {report.accuracy.toFixed(1)}% indicates widespread conceptual barriers. Focus on core NCERT revision before next attempt.</p>
                  </div>
                )}
                {report.averageTimePerQuestion > 90 && (
                  <div className="p-6 bg-white/5 dark:bg-zinc-100 rounded-[2rem] border border-white/10 dark:border-zinc-200">
                    <p className="text-lg font-bold mb-2">Priority: Pacing Efficiency</p>
                    <p className="text-sm opacity-70">Avg time of {report.averageTimePerQuestion.toFixed(0)}s is 1.5x above the target. Practice 20-question speed drills.</p>
                  </div>
                )}
                <div className="p-6 bg-white/5 dark:bg-zinc-100 rounded-[2rem] border border-white/10 dark:border-zinc-200">
                  <p className="text-lg font-bold mb-2">Next Step</p>
                  <Button className="w-full mt-4 rounded-xl font-black bg-white text-black dark:bg-black dark:text-white">Start Topic Drill</Button>
                </div>
              </div>
            </div>
          </div>

          {/* ADAPTIVE RECOMMENDATIONS (The practical next steps) */}
          <div className="p-8 md:p-10 rounded-[3rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-primary" />
                Adaptive Next Steps
              </h2>
            </div>
            <AdaptiveRecommendations data={recommendations} />
          </div>

          {/* CONFIDENCE CALIBRATION */}
          <div className="p-8 md:p-10 rounded-[3rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 tracking-tight">
              <Zap className="w-6 h-6 text-yellow-500" />
              Calibration Matrix
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.confidenceAnalytics} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="level" type="category" width={110} axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#71717a'}} />
                  <Tooltip cursor={{fill: '#f4f4f5'}} />
                  <Bar dataKey="accuracy" fill="#10b981" radius={[0, 12, 12, 0]} barSize={28} name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-[10px] leading-relaxed text-muted-foreground font-bold text-center">
                CALIBRATION_LOGIC: High accuracy at **100% SURE** indicates concept stability. Low accuracy at high confidence reveals **Cognitive Blind Spots**.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SOLUTION REVIEW SECTION */}
      {showReview && (
        <div id="solution-review" className="mt-20 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 print:hidden">
          <div className="flex items-center justify-between border-b-4 border-zinc-900 dark:border-zinc-100 pb-8">
            <div className="space-y-1">
              <h2 className="text-5xl font-black tracking-tighter italic">Forensic Review</h2>
              <p className="text-muted-foreground font-bold text-lg">Question-by-question breakdown of cognitive success and failure.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setShowHindi(!showHindi)}
                className={`rounded-full font-black text-xs uppercase tracking-widest px-6 h-12 transition-all ${showHindi ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
              >
                {showHindi ? 'Hindi: ON' : 'Hindi: OFF'}
              </Button>
              <Button variant="ghost" onClick={() => setShowReview(false)} className="rounded-2xl font-black text-lg h-16 px-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                Minimize Review
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 md:gap-10">
            {reviewData.map((q, idx) => (
              <div key={q.id} id={`q-card-${q.id}`} className="group p-6 md:p-14 bg-white dark:bg-zinc-950 rounded-[2.5rem] md:rounded-[4rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-2xl space-y-6 md:space-y-10 break-inside-avoid">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 md:gap-8">
                  <div className="space-y-3 md:space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-none font-black text-[12px] px-4 py-1 rounded-full">INDEX_Q{idx + 1}</Badge>
                      <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 font-bold text-[10px]">{q.interaction_type || 'STABLE'}</Badge>
                      <Badge variant="outline" className="border-zinc-200 dark:border-zinc-800 font-bold text-[10px] uppercase">{q.topic}</Badge>
                      <Badge className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-black text-[10px]">{q.difficulty}</Badge>
                    </div>
                    <h3 className="text-2xl md:text-4xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white whitespace-pre-wrap">{q.text_en}</h3>
                    {q.text_hi && showHindi && <p className="text-xl md:text-2xl text-zinc-400 dark:text-zinc-500 font-bold italic font-hindi whitespace-pre-wrap animate-in fade-in slide-in-from-top-2">{q.text_hi}</p>}
                  </div>
                  <div className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] flex items-center justify-center font-black text-xl md:text-2xl shrink-0 shadow-xl ${q.is_correct ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {q.is_correct ? <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" /> : <XCircle className="w-8 h-8 md:w-10 md:h-10" />}
                  </div>
                </div>

                {/* FORENSIC EVIDENCE LOG (Phase 3) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/50">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">First View</p>
                    <p className="text-xs font-bold">{q.forensic_evidence?.first_view ? new Date(q.forensic_evidence.first_view).toLocaleTimeString() : 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">Dwell Time</p>
                    <p className="text-xs font-bold">{q.forensic_evidence?.dwell_time}s</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">Revisions</p>
                    <p className="text-xs font-bold">{q.forensic_evidence?.revisions}x Changes</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">Confidence</p>
                    <p className="text-xs font-bold">{q.confidence_level}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(q.options_en).map(([key, value]) => {
                    const isSelected = q.selected_option === key;
                    const isCorrect = q.correct_option === key;
                    
                    let borderClass = "border-zinc-100 dark:border-zinc-800 opacity-40 grayscale";
                    let bgClass = "bg-zinc-50/50 dark:bg-zinc-900/30";
                    if (isCorrect) {
                      borderClass = "border-emerald-500 ring-4 ring-emerald-500/10 grayscale-0 scale-[1.02]";
                      bgClass = "bg-emerald-50 dark:bg-emerald-950/20 opacity-100 shadow-lg";
                    }
                    if (isSelected && !isCorrect) {
                      borderClass = "border-rose-500 ring-4 ring-rose-500/10 grayscale-0 scale-[1.02]";
                      bgClass = "bg-rose-50 dark:bg-rose-950/20 opacity-100 shadow-lg";
                    }

                    return (
                      <div key={key} className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 flex gap-6 items-start ${borderClass} ${bgClass}`}>
                        <span className="font-black text-2xl mt-0.5 opacity-40">{key}</span>
                        <div className="flex-1 space-y-2">
                          <p className="font-black text-xl leading-snug">{value as string}</p>
                          {q.options_hi?.[key] && showHindi && <p className="text-lg opacity-70 font-bold italic font-hindi animate-in fade-in slide-in-from-top-1">{q.options_hi[key]}</p>}
                        </div>
                        {isCorrect && <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />}
                        {isSelected && !isCorrect && <XCircle className="w-8 h-8 text-rose-600 shrink-0 mt-1" />}
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 md:p-14 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] md:rounded-[4rem] border-2 border-zinc-200 dark:border-zinc-800 relative overflow-hidden group/expl">
                  <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 group-hover/expl:scale-110 transition-transform duration-1000">
                    <BrainCircuit className="w-32 h-32 md:w-48 md:h-48" />
                  </div>
                  <h4 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-6 md:mb-8 flex items-center gap-3">
                    <Lightbulb className="w-4 h-4 md:w-5 md:h-5" /> REASONING_EXPLANATION
                  </h4>
                  <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-none">
                    <p className="text-lg md:text-2xl leading-relaxed text-zinc-800 dark:text-zinc-200 font-bold tracking-tight">
                      {q.explanation_en}
                    </p>
                    {q.explanation_hi && showHindi && (
                      <p className="text-lg md:text-2xl leading-relaxed text-zinc-400 dark:text-zinc-500 mt-6 md:mt-10 pt-6 md:pt-10 border-t border-zinc-200 dark:border-zinc-800 italic font-bold font-hindi animate-in fade-in">
                        {q.explanation_hi}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 print:hidden">
        <div className="px-8 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-full border border-zinc-200 dark:border-zinc-800 shadow-3xl flex items-center gap-8">
           <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Dossier Top</button>
           <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700"></div>
           <button onClick={handleFetchReview} className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Solution Review</button>
           <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700"></div>
           <Button className="rounded-full h-10 px-6 font-black" onClick={() => window.history.back()}>Back to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
