"use client";

import React from 'react';
import { 
  ArrowRight, CheckCircle2, AlertCircle, 
  BookOpen, Zap, Target, Timer, ShieldAlert
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdaptiveRecommendationsProps {
  data: any;
}

export const AdaptiveRecommendations: React.FC<AdaptiveRecommendationsProps> = ({ data }) => {
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
        <p className="text-muted-foreground italic">Gathering data for personalized recommendations. Continue practicing to unlock insights.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'REVISION': return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'PRACTICE_DRILL': return <Target className="w-5 h-5 text-emerald-500" />;
      case 'PACING_DRILL': return <Timer className="w-5 h-5 text-amber-500" />;
      case 'CONFIDENCE_CALIBRATION': return <ShieldAlert className="w-5 h-5 text-purple-500" />;
      default: return <Zap className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5">
        {data.recommendations.map((rec: any, idx: number) => (
          <div 
            key={idx} 
            className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-5 group-hover:scale-110 transition-transform duration-700`}>
              {getIcon(rec.type)}
            </div>
            
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl group-hover:bg-primary/10 transition-colors shadow-sm">
                  {getIcon(rec.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{rec.type.replace('_', ' ')}</span>
                    {rec.priority === 'HIGH' && (
                      <Badge variant="destructive" className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full">Critical</Badge>
                    )}
                  </div>
                  <h4 className="text-xl font-black tracking-tight">{rec.topic}</h4>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{rec.reason}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black">1</div>
                   <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black">2</div>
                   <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black">3</div>
                </div>
                <Button className="rounded-2xl gap-2 font-black text-xs uppercase tracking-widest px-6 h-12 shadow-lg group-hover:scale-105 transition-transform">
                  Start Drill <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.adaptivePlan && (
        <div className="p-10 rounded-[3rem] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Personalized Mastery Strategy</p>
              <h5 className="text-3xl font-black tracking-tighter">{data.adaptivePlan.strategy_name || "Optimal Recovery Plan"}</h5>
            </div>
            <div className="p-6 bg-white/10 dark:bg-zinc-900/10 backdrop-blur-xl rounded-[2rem] border border-white/5">
              <p className="text-sm font-bold leading-relaxed opacity-90">
                Current data trajectory suggests an **Aggressive Retrieval** approach. Focus on answering 10 MCQs in your weakness zones before reading further theory.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
