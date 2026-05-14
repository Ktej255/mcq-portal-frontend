"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, Target, BarChart3, ChevronRight } from 'lucide-react';

interface TrajectoryProps {
  mastery: number;
  velocity: number;
  streak: number;
  readiness: number;
}

export const StudentTrajectoryCard = ({ mastery, velocity, streak, readiness }: TrajectoryProps) => {
  return (
    <Card className="bg-white/50 backdrop-blur-sm border-zinc-200 overflow-hidden group hover:border-blue-300 transition-all">
      <CardHeader className="pb-2 border-b bg-zinc-50/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Learning Trajectory
          </CardTitle>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse">
            Ascending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Mastery</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-zinc-900">{Math.round(mastery * 100)}%</span>
              <span className="text-[10px] text-emerald-600 font-bold mb-1">+{velocity}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider"> Consistency</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-zinc-900">{streak}</span>
              <span className="text-[10px] text-zinc-500 font-medium mb-1">DAYS</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-muted-foreground uppercase">Target Readiness</span>
            <span className="text-blue-600">{readiness}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
              style={{ width: `${readiness}%` }}
            />
          </div>
        </div>

        <div className="pt-2 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-100">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <div className="text-[10px]">
              <p className="font-bold text-zinc-900">Sprint Mode</p>
              <p className="text-zinc-500">24h Remaining</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-100">
            <Target className="w-3.5 h-3.5 text-rose-500" />
            <div className="text-[10px]">
              <p className="font-bold text-zinc-900">Next Peak</p>
              <p className="text-zinc-500">In 3 Days</p>
            </div>
          </div>
        </div>

        <button className="w-full mt-2 flex items-center justify-between p-2 rounded-lg bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-800 transition-colors">
          <span>VIEW FULL EVOLUTION REPORT</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </CardContent>
    </Card>
  );
};
