"use client";

import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Activity, Target, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface LongitudinalGrowthProps {
  profile: any;
}

export const LongitudinalGrowth: React.FC<LongitudinalGrowthProps> = ({ profile }) => {
  if (!profile || !profile.trajectory_points || profile.trajectory_points.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
        <p className="text-muted-foreground italic">Insufficient data for longitudinal analysis. Complete more attempts to see your growth.</p>
      </div>
    );
  }

  const data = profile.trajectory_points.map((p: any, idx: number) => ({
    name: `Attempt ${idx + 1}`,
    accuracy: p.accuracy,
    score: p.score,
    time: p.average_time_per_question,
  }));

  const velocity = profile.learning_velocity || {};
  const stability = profile.behavioral_stability || {};

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Learning Velocity</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black">{velocity.accuracy_slope > 0 ? '+' : ''}{velocity.accuracy_slope?.toFixed(2)}</p>
            <span className="text-[10px] font-bold text-muted-foreground">pts / attempt</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {velocity.accuracy_slope > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-500" />
            )}
            <span className={`text-[10px] font-black uppercase ${velocity.accuracy_slope > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {velocity.accuracy_slope > 0 ? 'Accelerating' : 'Stagnating'}
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Behavioral Consistency</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black">{(stability.consistency_score * 100)?.toFixed(0)}%</p>
            <span className="text-[10px] font-bold text-muted-foreground">Stability Index</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000" 
              style={{ width: `${stability.consistency_score * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recovery Velocity</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black">{velocity.recovery_velocity > 0 ? '+' : ''}{velocity.recovery_velocity?.toFixed(1)}%</p>
            <span className="text-[10px] font-bold text-muted-foreground">Recent Gain</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">Comparison of last 3 attempts vs earlier history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Accuracy Trajectory
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorAcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Score Momentum
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* NEW: TRAJECTORY ANALYSIS TEXT */}
      <div className="mt-10 p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-3">
             <h5 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
               <TrendingUp className="w-4 h-4" /> Trajectory Insight
             </h5>
             <p className="text-sm font-bold text-muted-foreground leading-relaxed">
               Your accuracy has shown a **{velocity.accuracy_slope > 0 ? 'positive' : 'downward'} trend** of {Math.abs(velocity.accuracy_slope || 0).toFixed(1)}% per attempt. 
               This suggests that your current revision cycle is {velocity.accuracy_slope > 0 ? 'highly effective' : 'requiring a pivot'}.
             </p>
          </div>
          <div className="flex-1 space-y-3">
             <h5 className="font-black text-sm uppercase tracking-widest text-blue-500 flex items-center gap-2">
               <Activity className="w-4 h-4" /> Stability Note
             </h5>
             <p className="text-sm font-bold text-muted-foreground leading-relaxed">
               With a stability index of {(stability.consistency_score * 100).toFixed(0)}%, your behavioral patterns (pacing/confidence) are **{stability.consistency_score > 0.7 ? 'highly predictable' : 'fluctuating'}**. Predictable patterns lead to more reliable AI coaching.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
