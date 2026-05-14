"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Timer, 
  ZapOff, 
  AlertTriangle,
  ChevronRight,
  Target
} from 'lucide-react';

export default function SimulationLobby() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 space-y-12">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-zinc-900">Prelims Simulation Mode</h1>
        <p className="text-zinc-500 font-medium max-w-lg mx-auto">
          This is a high-fidelity exam environment designed to build temperament. All educational safety nets are removed.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: <Timer className="text-indigo-600" />, title: "Strict Timing", desc: "No pausing. Session auto-terminates at 120m." },
          { icon: <ZapOff className="text-indigo-600" />, title: "No Feedback", desc: "Explanations hidden until final submission." },
          { icon: <AlertTriangle className="text-indigo-600" />, title: "Serious Scoring", desc: "Negative marking (0.66) strictly enforced." }
        ].map((rule, i) => (
          <div key={i} className="p-6 rounded-3xl bg-white border border-zinc-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              {rule.icon}
            </div>
            <h3 className="font-bold text-zinc-900">{rule.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{rule.desc}</p>
          </div>
        ))}
      </div>

      <Card className="rounded-[3rem] border-none bg-zinc-900 text-white overflow-hidden shadow-2xl">
        <CardContent className="p-12 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Available Session</p>
              <h2 className="text-3xl font-black tracking-tight">All-India Prelims Mock #7</h2>
              <p className="text-zinc-400 font-medium">100 Questions • 200 Marks • General Studies I</p>
            </div>
            <div className="text-right">
              <span className="text-5xl font-black tracking-tighter">120</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Minutes</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-sm text-zinc-300 font-medium italic">
              "Temperament is the silent differentiator in the final 10 minutes of the exam."
            </p>
          </div>

          <Button 
            className="w-full h-18 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            I AM READY. START SIMULATION.
          </Button>
          
          <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
            By starting, you acknowledge that this attempt cannot be paused or reset.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
