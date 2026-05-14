"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HeartPulse, 
  RefreshCcw, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  TrendingUp,
  CloudLightning
} from 'lucide-react';

export default function FounderDashboard() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Institutional Health</h1>
          <p className="text-muted-foreground mt-1 text-lg font-medium">Founder-level educational signals and system integrity.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            OPERATIONAL STABILITY: 100%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-zinc-900 bg-zinc-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <HeartPulse className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">Global Recovery Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black tracking-tighter">78.4%</div>
            <p className="text-xs mt-2 font-medium opacity-70">Students successfully recovering from weak topics within 3 revision cycles.</p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Content Freshness Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black tracking-tighter text-zinc-900">94.2%</div>
            <p className="text-xs mt-2 font-medium text-emerald-600">+2.1% from last audit</p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Student Burnout Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black tracking-tighter text-rose-600">4.2%</div>
            <p className="text-xs mt-2 font-medium text-muted-foreground">Distribution of students in 'Detachment Recommended' state.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Educational Momentum
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Daily Consistency (Active Users)', value: '89%', change: '+5%', color: 'bg-emerald-500' },
              { label: 'Revision Queue Clearance Rate', value: '62%', change: '-3%', color: 'bg-amber-500' },
              { label: 'Explanation Quality Score (Avg)', value: '0.88', change: '+0.04', color: 'bg-blue-500' },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase">{item.label}</span>
                  <span className="text-sm font-black">{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.value }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <CloudLightning className="w-5 h-5 text-blue-500" />
            Institutional Bottlenecks
          </h2>
          <div className="grid gap-4">
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex gap-4">
              <div className="p-3 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="font-black text-rose-900">Current Affairs Stale-ness</p>
                <p className="text-xs text-rose-800/70 mt-1 leading-relaxed">12 questions in 'Polity' have not been reviewed since the recent legislative updates. Immediate re-verification recommended.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-black text-amber-900">Revision Avoidance Cluster</p>
                <p className="text-xs text-amber-800/70 mt-1 leading-relaxed">24% of students are consistently skipping 'Economics' revision tasks. System intervention triggered for morning drills.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
