"use client";

import React, { useEffect, useState } from 'react';
import { 
  Brain, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useApiConfig } from '@/lib/hooks/useApi';
import { useRouter } from 'next/navigation';

interface RevisionItem {
  id: number;
  topic: string;
  reason: string;
  priority: number;
  question_id?: string;
  review_count: number;
  mastery: number;
}

export default function RevisionPage() {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { api } = useApiConfig();
  const router = useRouter();

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await api.get('/revision/');
        setItems(response.data);
      } catch (error) {
        console.error("Failed to fetch revision queue:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, [api]);

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'WEAK_TOPIC': return 'Weak Topic';
      case 'INCORRECT_ANSWER': return 'Incorrect Answer';
      case 'MARKED_FOR_REVIEW': return 'Flagged';
      case 'SPACED_REPETITION': return 'Review Cycle';
      default: return reason;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 p-4 md:p-8 pb-32">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-lg">
            <RotateCcw className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Revision Engine</h1>
            <p className="text-muted-foreground font-bold tracking-tight">Institutional Spaced Repetition for Mastery</p>
          </div>
        </div>
      </div>

      {/* RAPID RECOVERY ACTION */}
      {items.length > 0 && (
        <div className="p-10 md:p-14 rounded-[3.5rem] bg-indigo-600 text-white shadow-3xl shadow-indigo-500/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
            <Zap className="w-64 h-64 fill-white" />
          </div>
          <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white border-none px-3 font-black text-[10px] uppercase tracking-widest">Single-Click Recovery</Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Ready for Recovery?</h2>
              <p className="text-lg opacity-80 font-bold leading-relaxed">
                We've selected 5 high-priority questions from your recent mistakes in **Environment Core** and **Polity**.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button 
                size="lg" 
                onClick={() => router.push('/exam/revision')}
                className="h-20 rounded-[2rem] bg-white text-indigo-600 hover:bg-zinc-100 font-black text-xl uppercase tracking-widest shadow-2xl group-hover:scale-[1.02] transition-all"
              >
                START RAPID DRILL
              </Button>
              <p className="text-center text-xs font-bold opacity-60 uppercase tracking-widest italic">Estimated Time: 4 Minutes</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* STATS OVERVIEW */}
        <Card className="lg:col-span-1 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black">Memory Status</CardTitle>
            <CardDescription>Real-time retention monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-black uppercase tracking-widest text-muted-foreground">
                <span>Pending Reviews</span>
                <span className="text-zinc-900 dark:text-white">{items.length}</span>
              </div>
              <Progress value={Math.min(100, (items.length / 20) * 100)} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-3xl text-center">
                <p className="text-2xl font-black">{items.filter(i => i.priority > 0.8).length}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Critical</p>
              </div>
              <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-3xl text-center">
                <p className="text-2xl font-black">{(items.reduce((acc, i) => acc + i.mastery, 0) / (items.length || 1) * 100).toFixed(0)}%</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Avg Mastery</p>
              </div>
            </div>

            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Ready to Review</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500">Your focus is optimal now.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QUEUE LIST */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black tracking-tight">Pending Tasks</h2>
            <Badge variant="outline" className="px-3 py-1 rounded-full font-black text-[10px]">{items.length} items</Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center space-y-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-zinc-300" />
              </div>
              <p className="text-muted-foreground font-bold italic">Your memory graph is stable. No pending revisions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="group flex items-center justify-between p-6 md:p-8 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.priority > 0.8 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-zinc-50 dark:bg-zinc-900'}`}>
                      {item.priority > 0.8 ? <AlertCircle className="w-7 h-7 text-red-500" /> : <Brain className="w-7 h-7 text-zinc-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-xl tracking-tight">{item.topic}</p>
                        <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest h-5 px-2">
                          {getReasonLabel(item.reason)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Review #{item.review_count + 1}</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {(item.mastery * 100).toFixed(0)}% Mastery</span>
                      </div>
                    </div>
                  </div>
                  <Button className="rounded-2xl h-12 px-6 font-black text-sm gap-2">
                    Start <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
