"use client";

import React from 'react';
import { 
  CheckCircle2, 
  History, 
  ChevronRight,
  BrainCircuit,
  Calendar
} from 'lucide-react';

interface HistoryItem {
  id: number;
  topic: string;
  last_reviewed_at: string;
  mastery_at_time: number;
  category: string;
}

export const RevisionHistory = ({ items }: { items: HistoryItem[] }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-400" />
          Educational Continuity
        </h2>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Last 7 Days</span>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-200 before:via-zinc-100 before:to-transparent">
        {items.length === 0 ? (
          <div className="pl-12 py-10">
            <p className="text-zinc-400 font-medium italic">No revision history found yet. Begin your first drill.</p>
          </div>
        ) : (
          items.map((item, i) => (
            <div key={i} className="relative flex items-center gap-6 group">
              <div className={`absolute left-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-10 ${
                i === 0 ? 'bg-zinc-900 shadow-lg shadow-zinc-900/20' : 'bg-zinc-100'
              }`}>
                {i === 0 ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Calendar className="w-4 h-4 text-zinc-400" />}
              </div>
              
              <div className="ml-12 flex-1 p-4 rounded-2xl bg-white border border-zinc-100 group-hover:border-zinc-200 transition-all flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-zinc-900">{item.topic}</p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                      item.category === 'MISTAKE' ? 'bg-rose-50 text-rose-600' : 'bg-zinc-50 text-zinc-500'
                    }`}>
                      {item.category}
                    </span>

                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {new Date(item.last_reviewed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-zinc-900">{Math.round(item.mastery_at_time * 100)}%</p>
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">Mastery</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
