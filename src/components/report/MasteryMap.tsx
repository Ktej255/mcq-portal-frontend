"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Zap, ShieldCheck, RefreshCcw, AlertOctagon, 
  Flame, HelpCircle 
} from 'lucide-react';

interface MasteryMapProps {
  topicAnalysis: Record<string, any>;
  behavioralSignals?: any[];
}

export const MasteryMap: React.FC<MasteryMapProps> = ({ topicAnalysis, behavioralSignals = [] }) => {
  const getTopicState = (topic: string, data: any) => {
    const accuracy = (data.correct / (data.correct + data.incorrect)) * 100 || 0;
    
    // Logic for states
    if (accuracy >= 80) return { label: 'Strong', icon: <Flame className="w-3 h-3" />, color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
    if (accuracy >= 60) return { label: 'Stable', icon: <ShieldCheck className="w-3 h-3" />, color: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' };
    if (accuracy >= 40) return { label: 'Recovering', icon: <RefreshCcw className="w-3 h-3" />, color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' };
    
    // Check if "Fragile" (High confidence but failed - logic simplified here)
    const isFragile = data.incorrect > data.correct && data.total > 3;
    if (isFragile) return { label: 'Fragile', icon: <HelpCircle className="w-3 h-3" />, color: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' };
    
    return { label: 'Weak', icon: <AlertOctagon className="w-3 h-3" />, color: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(topicAnalysis).map(([topic, data]) => {
        const state = getTopicState(topic, data);
        const accuracy = (data.correct / (data.correct + data.incorrect)) * 100 || 0;

        return (
          <div key={topic} className={`p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-[1.02] ${state.bg}`}>
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-sm font-bold truncate max-w-[150px]">{topic}</h4>
              <Badge className={`${state.color} text-white border-none text-[9px] font-black uppercase px-1.5 py-0`}>
                {state.label}
              </Badge>
            </div>
            
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  {state.icon}
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${state.text}`}>
                    {accuracy.toFixed(0)}% Accuracy
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground font-medium">
                  {data.correct} Correct · {data.incorrect} Incorrect
                </p>
              </div>
              <div className="h-8 w-8 rounded-full border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                <span className="text-[10px] font-black">{data.total}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
