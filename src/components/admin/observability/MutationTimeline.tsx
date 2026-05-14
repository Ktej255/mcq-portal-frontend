'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { History, Shield, AlertTriangle, CheckCircle2, User, FileText, Clock } from 'lucide-react';
import { MutationRecord } from '@/services/api/observabilityService';

interface MutationTimelineProps {
  mutations: MutationRecord[];
}

export const MutationTimeline: React.FC<MutationTimelineProps> = ({ mutations }) => {
  const getRiskColor = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'CRITICAL': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
          <History className="w-3 h-3" />
          Institutional Mutation Timeline
        </h2>
        <span className="text-[10px] text-slate-500 font-mono italic">Audit Trail Active</span>
      </div>

      <div className="relative border-l border-white/10 ml-3 pl-8 space-y-8">
        {mutations.map((mutation, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[37px] top-0 w-4 h-4 rounded-full border-4 border-[#050505] shadow-lg ${
              mutation.risk === 'CRITICAL' ? 'bg-rose-500' : 'bg-blue-500'
            }`} />

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">
                    <User className="w-2.5 h-2.5" />
                    {mutation.agent}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRiskColor(mutation.risk)}`}>
                    <Shield className="w-2.5 h-2.5" />
                    {mutation.risk} RISK
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(mutation.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Impacted Files
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mutation.files.map((file, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-black/40 text-[10px] font-mono text-slate-300 border border-white/5">
                      {file}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Forensic Justification</h4>
                <p className="text-sm text-white italic">"{mutation.justification}"</p>
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase">
                  <CheckCircle2 className="w-3 h-3" />
                  {mutation.status}
                </div>
                <div className="text-slate-600 font-mono">
                  BLAST_RADIUS: {mutation.blast_radius}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
