"use client";

import { useEffect, useState } from "react";
import { dashboardService, PerformanceReport } from "@/services/api/dashboardService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiConfig } from "@/lib/hooks/useApi";
import { DebugPanel } from "@/components/shared/DebugPanel";
import { 
  Trophy, Target, Timer, Zap, 
  BrainCircuit, BarChart3, TrendingUp, AlertCircle,
  CheckCircle2, XCircle, HelpCircle, ArrowRight
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const COLORS = ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#8b5cf6'];

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const { isLoaded, isSignedIn } = useApiConfig();

  useEffect(() => {
    const fetchReport = async () => {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        setLoading(true);
        const data = await dashboardService.getReport(attemptId || undefined);
        setReport(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch report:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [attemptId, isLoaded, isSignedIn]);

  if (loading) return (
    <div className="space-y-8 animate-pulse p-4">
      <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-80 bg-zinc-200 dark:bg-zinc-800 rounded-2xl ${i === 3 ? 'lg:col-span-2' : ''}`}></div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="space-y-8 p-4">
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800/50 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 dark:text-red-400 font-bold text-xl mb-2">Analysis Failed</p>
        <p className="text-muted-foreground mb-6">We couldn't process your performance data. This could be due to a missing attempt record.</p>
        <Button onClick={() => window.location.reload()} size="lg">Retry Request</Button>
      </div>
      <DebugPanel error={error} context="Reports API (/dashboard/report)" />
    </div>
  );

  if (!report) return null;

  // AI Insights Engine (Rule-based)
  const generateInsights = () => {
    const insights = [];
    if (report.accuracy > 80) insights.push({
      type: 'positive',
      icon: <Trophy className="w-5 h-5 text-green-500" />,
      text: "Exceptional accuracy! Your conceptual clarity in this subject is outstanding."
    });
    
    const hundredSureIncorrect = report.confidenceAnalytics.find(c => (c.level === '100_SURE' || c.level === 'HUNDRED_PERCENT') && c.accuracy < 90);
    if (hundredSureIncorrect) insights.push({
      type: 'warning',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      text: "High-confidence mistakes detected. This indicates specific 'blind spots' or deep-rooted conceptual misunderstandings."
    });

    if (report.unattemptedCount > (report.correctCount + report.incorrectCount) * 0.3) insights.push({
      type: 'neutral',
      icon: <Timer className="w-5 h-5 text-blue-500" />,
      text: "High skip rate. You might be playing too safe; try attempting moderately difficult questions where you have some intuition."
    });

    if ((report.averageTimePerQuestion || 0) > 120) insights.push({
      type: 'warning',
      icon: <Timer className="w-5 h-5 text-red-500" />,
      text: "Time efficiency is low. You are spending over 2 minutes per question on average. Focus on speed drills."
    });

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 px-3 py-1 text-xs font-bold uppercase tracking-widest bg-primary/5">Cognitive Performance Report</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Attempt Analysis</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.print()} className="hidden sm:flex">Download PDF</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">Review All Answers</Button>
        </div>
      </div>
      
      {/* SECTION 1 — PERFORMANCE OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Final Score</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black">{report.totalScore.toFixed(1)}</p>
            <span className="text-muted-foreground text-sm font-medium">pts</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Accuracy</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black">{report.accuracy.toFixed(1)}</p>
            <span className="text-muted-foreground text-sm font-medium">%</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <Timer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Avg Time</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black">{Math.floor((report.averageTimePerQuestion || 0) / 60)}m {(report.averageTimePerQuestion || 0) % 60}s</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Questions</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-green-600">{report.correctCount}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Correct</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-red-600">{report.incorrectCount}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Wrong</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-500">{report.unattemptedCount}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Skipped</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* SECTION 2 — SUBJECT & TOPIC ANALYSIS */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-primary" />
                Subject Performance
              </h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.subjectScores}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{fill: '#f4f4f5'}}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40}>
                    {report.subjectScores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              Topic-wise Breakdown
            </h2>
            <div className="space-y-6">
              {report.topicWiseAnalysis && Object.entries(report.topicWiseAnalysis).map(([topic, data], idx) => {
                const topicAccuracy = (data.correct / (data.correct + data.incorrect)) * 100 || 0;
                return (
                  <div key={topic} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-sm font-bold">{topic}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-bold">{data.correct} Correct</span>
                          <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">{data.incorrect} Incorrect</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-muted-foreground">{topicAccuracy.toFixed(0)}% Accuracy</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${topicAccuracy > 70 ? 'bg-emerald-500' : topicAccuracy > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${topicAccuracy}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 4 — COGNITIVE CONFIDENCE ANALYSIS */}
        <div className="space-y-8">
          <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-primary" />
              AI Insights
            </h2>
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500" style={{animationDelay: `${idx * 150}ms`}}>
                  <div className="shrink-0 mt-1">{insight.icon}</div>
                  <p className="text-sm leading-relaxed font-medium">{insight.text}</p>
                </div>
              ))}
              {insights.length === 0 && (
                <p className="text-muted-foreground text-sm italic">Gathering more data for deeper insights...</p>
              )}
            </div>
            
            <div className="mt-8 pt-8 border-t border-primary/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Improvement Strategy</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Focus on <strong>Topic-wise speed drills</strong> for Physics.</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Revisit concepts where confidence was high but answer was wrong.</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground italic">Next recommended test: Modern Physics Batch 2</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Confidence Matrix</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.confidenceAnalytics} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="level" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: '#f4f4f5'}} />
                  <Bar dataKey="accuracy" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-4">
              Higher accuracy at higher confidence indicates strong conceptual calibration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
