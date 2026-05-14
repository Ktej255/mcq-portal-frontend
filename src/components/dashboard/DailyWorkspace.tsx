"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RotateCcw, 
  Target, 
  Zap, 
  Clock, 
  ChevronRight, 
  BrainCircuit,
  History,
  AlertCircle,
  Download,
  ArrowRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { revisionService, RevisionItem, HistoryItem, RecoveryPath } from '@/services/api/revisionService';
import { RevisionHistory } from './RevisionHistory';
import { ConceptRecoveryModal } from './ConceptRecoveryModal';
import { dashboardService } from '@/services/api/dashboardService';
import { useRouter } from 'next/navigation';


export const DailyWorkspace = () => {
  const router = useRouter();
  const [queue, setQueue] = useState<RevisionItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recoveryPath, setRecoveryPath] = useState<RecoveryPath | null>(null);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qData, hData] = await Promise.all([
          revisionService.getQueue(),
          revisionService.getHistory(5)
        ]);
        setQueue(qData);
        setHistory(hData);
      } catch (err) {
        console.error("Failed to fetch workspace data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleItemClick = async (item: RevisionItem) => {
    if (item.priority > 0.8) {
      try {
        const path = await revisionService.getRecoveryPath(1); // Mock topic ID
        setRecoveryPath(path);
        setIsRecoveryOpen(true);
      } catch (err) {
        console.error("Failed to fetch recovery path:", err);
      }
    }
  };

  const handleExport = async () => {
    try {
      await dashboardService.exportJourney();
      alert("Journey data compiled. Download starting...");
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-10 px-4">
      <header className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Institutional Dashboard</p>
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900">Your Daily Command.</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PRIMARY ACTIONS: REVISION QUEUE */}
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black tracking-tight">Active Revision Queue</h3>
              <Badge variant="secondary" className="rounded-full px-3 font-bold">
                {queue.length} TASKS
              </Badge>
            </div>

            {queue.length > 0 && (
              <Button 
                onClick={() => router.push('/revision')}
                className="w-full rounded-[2rem] h-20 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl uppercase tracking-widest gap-4 shadow-2xl shadow-indigo-500/40 hover:scale-[1.01] transition-all group"
              >
                <div className="p-3 bg-white/20 rounded-2xl group-hover:rotate-12 transition-transform">
                  <Zap className="w-8 h-8 fill-white" />
                </div>
                START RECOVERY DRILL
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            )}

            <div className="grid gap-3">
              {queue.length === 0 && !loading ? (
                <div className="p-8 rounded-3xl bg-zinc-50 border border-dashed border-zinc-200 text-center">
                  <p className="text-zinc-400 font-medium italic">Queue is clear. You are educationally synchronized.</p>
                </div>
              ) : (
                queue.slice(0, 3).map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleItemClick(item)}
                    className="group p-4 rounded-2xl bg-white border border-zinc-200 hover:border-blue-400 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                        <BrainCircuit className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{item.topic}</p>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={item.priority > 0.8 ? 'text-rose-600 border-rose-100 bg-rose-50' : 'text-zinc-500'}>
                        {item.priority > 0.8 ? 'Critical' : 'Scheduled'}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <Button className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-black text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10">
              <Play className="w-5 h-5 mr-2 fill-current" /> START MORNING DRILL
            </Button>
          </section>

          {/* REVISION HISTORY TIMELINE */}
          <RevisionHistory items={history} />
        </div>

        {/* SIDEBAR: CONTINUITY & STATUS */}
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none bg-zinc-50 shadow-none">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Streak</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-zinc-900">14</span>
                  <span className="text-sm font-bold text-zinc-500 uppercase">Days</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <span>Weekly Goal</span>
                  <span>5/7 Days</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 1, 1, 1, 1, 0, 0].map((day, i) => (
                    <div key={i} className={`flex-1 h-2 rounded-full ${day ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-zinc-200 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">
                    <span className="font-bold text-blue-600">Continuity Alert:</span> You have a current affairs gap in 'International Relations'. Estimated 8m to resolve.
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={handleExport}
                  className="w-full justify-start h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 px-2"
                >
                  <Download className="w-4 h-4 mr-2" /> Export Journey Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <div 
            onClick={() => window.location.href = '/simulation/lobby'}
            className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all"
          >
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Prelims Simulation</h3>
                <p className="text-xs opacity-70 font-medium">Locked environment • Fixed time • Serious scoring</p>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      <ConceptRecoveryModal 
        isOpen={isRecoveryOpen} 
        onClose={() => setIsRecoveryOpen(false)} 
        path={recoveryPath} 
      />
    </div>
  );
};


