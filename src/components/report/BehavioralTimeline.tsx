"use client";

import React from 'react';
import { 
  Timer, Eye, CheckCircle, AlertTriangle, 
  MousePointer2, Zap, Clock, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BehavioralTimelineProps {
  telemetry: any;
  questions: any[];
}

export const BehavioralTimeline: React.FC<BehavioralTimelineProps> = ({ telemetry }) => {
  if (!telemetry || !telemetry.question_sequence) {
    return (
      <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
        <p className="text-muted-foreground italic">Behavioral telemetry not available for this attempt.</p>
      </div>
    );
  }

  const sequence = telemetry.question_sequence;
  const evolutions = telemetry.answer_evolution || {};
  const interruptions = telemetry.focus_interruptions || [];
  const pacing = telemetry.pacing_shifts || [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary" />
            Behavioral Reconstruction
          </h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Temporal flow of cognitive engagement</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Normal Path', color: 'bg-blue-500' },
            { label: 'Revisions', color: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' },
            { label: 'Focus Loss', color: 'bg-rose-500 animate-pulse' },
          ].map((tag, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <div className={`w-2.5 h-2.5 rounded-full ${tag.color}`}></div>
              {tag.label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative pt-16 pb-12 px-6">
        {/* THE MAIN TIMELINE BAR */}
        <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded-full relative shadow-inner overflow-visible border border-zinc-200 dark:border-zinc-800">
          <TooltipProvider delayDuration={0}>
            
            {/* FOCUS INTERRUPTION OVERLAYS */}
            {interruptions.map((inter: any, idx: number) => {
              return (
                <div 
                  key={`inter-${idx}`}
                  className="absolute -top-10 -translate-x-1/2 flex flex-col items-center group"
                  style={{ left: `${(idx + 1) * (100 / (interruptions.length + 1))}%` }}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="p-1 bg-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/50">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-rose-600 text-white border-none rounded-2xl p-4 shadow-3xl min-w-[200px]">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 border-b border-white/20 pb-1">Anomaly_Detected</h4>
                      <p className="font-bold text-lg">{inter.type === 'TAB_SWITCH' ? 'Tab Escape' : 'Window Blur'}</p>
                      <p className="text-[10px] opacity-80 mt-1">"Focus integrity was interrupted at {new Date(inter.timestamp).toLocaleTimeString()}."</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}

            {/* QUESTION EVENTS */}
            {sequence.map((event: any, idx: number) => {
              const position = (idx / (sequence.length - 1)) * 100;
              const evos = evolutions[event.question_id] || [];
              const isChanged = evos.length > 1;
              const qNum = idx + 1;

              return (
                <div 
                  key={`q-${idx}`} 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                  style={{ left: `${position}%` }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`
                        w-6 h-6 rounded-full border-4 border-white dark:border-zinc-950 cursor-pointer transition-all hover:scale-150 relative z-20 shadow-sm
                        ${isChanged ? 'bg-amber-500 shadow-amber-500/30' : 'bg-blue-500 shadow-blue-500/30'}
                        hover:ring-8 hover:ring-primary/10
                      `}>
                        {isChanged && <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20"></div>}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-5 rounded-[2rem] border-none shadow-3xl bg-white dark:bg-zinc-900 min-w-[220px] border border-zinc-100 dark:border-zinc-800">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                          <Badge variant="outline" className="font-black text-[10px] rounded-full px-3">INDEX_Q{qNum}</Badge>
                          <span className="text-[10px] font-black text-muted-foreground opacity-40">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                              <Eye className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="text-xs font-black">Observation Points</span>
                          </div>
                          {isChanged && (
                            <div className="flex items-center gap-3 text-amber-600">
                              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <MousePointer2 className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-black">Revisions ({evos.length - 1}x)</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground italic leading-relaxed pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          "Telemetry confirms active cognitive engagement during this window."
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </TooltipProvider>
        </div>

        {/* BOTTOM AXIS LABELS */}
        <div className="flex justify-between mt-8 px-2 opacity-30 text-[10px] font-black uppercase tracking-[0.4em]">
          <span>SESSION_START</span>
          <span>COGNITIVE_TRAJECTORY_MAPPING</span>
          <span>SESSION_END</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Observation Points', value: sequence.length, icon: <Activity className="text-blue-500" />, desc: 'Linear sequence of question interactions' },
          { label: 'Cognitive Friction', value: Object.values(evolutions).filter((e: any) => e.length > 1).length, icon: <Zap className="text-amber-500" />, desc: 'Frequency of answer uncertainty and revision' },
          { label: 'Focus Anomalies', value: interruptions.length, icon: <AlertTriangle className="text-rose-500" />, desc: 'Detection of tab switching or window blur' },
        ].map((metric, i) => (
          <div key={i} className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
                {cloneElement(metric.icon as ReactElement, { className: "w-5 h-5" })}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{metric.label}</span>
            </div>
            <p className="text-4xl font-black tracking-tighter mb-2">{metric.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground leading-relaxed italic">{metric.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
