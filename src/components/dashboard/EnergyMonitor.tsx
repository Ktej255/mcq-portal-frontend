"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Battery, BatteryLow, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EnergyProps {
  load: number; # 0.0 - 1.0
  fatigue: number; # 0.0 - 1.0
  risk: 'LOW' | 'MODERATE' | 'HIGH';
}

export const EnergyMonitor = ({ load, fatigue, risk }: EnergyProps) => {
  const getRiskColor = () => {
    switch (risk) {
      case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'MODERATE': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-200';
    }
  };

  return (
    <Card className="bg-white/50 backdrop-blur-sm border-zinc-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cognitive State</h3>
          </div>
          <Badge variant="outline" className={getRiskColor()}>
            {risk} RISK
          </Badge>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                <Battery className="w-3.5 h-3.5" /> Cognitive Reserve
              </span>
              <span className="text-xs font-black">{Math.round((1 - fatigue) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${
                  fatigue > 0.7 ? 'bg-rose-500' : fatigue > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(1 - fatigue) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Current Load
              </span>
              <span className="text-xs font-black">{Math.round(load * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-900 transition-all duration-700"
                style={{ width: `${load * 100}%` }}
              />
            </div>
          </div>
        </div>

        {risk === 'HIGH' && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-100 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-rose-900 leading-relaxed">
              <p className="font-bold uppercase tracking-tight">Burnout Warning</p>
              <p className="opacity-80 mt-0.5">Extended high-load session detected. Diminishing returns imminent. Recommendation: 15-minute complete detachment.</p>
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 flex justify-between items-center text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Last sync: Just now</span>
          </div>
          <button className="hover:text-zinc-900 font-bold transition-colors">DATA SPECS</button>
        </div>
      </CardContent>
    </Card>
  );
};
