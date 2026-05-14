'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Database, Server, AlertTriangle, User } from 'lucide-react';
import { DependencyGraph, GraphNode } from '@/services/api/observabilityService';

interface GovernanceGraphProps {
  graph: DependencyGraph;
}

export const GovernanceGraph: React.FC<GovernanceGraphProps> = ({ graph }) => {
  // Simple grid-based layout for initial version
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'SERVICE': return <Server className="w-4 h-4" />;
      case 'DATABASE': return <Database className="w-4 h-4" />;
      case 'API': return <Zap className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'border-rose-500/50 bg-rose-500/10 text-rose-400';
      case 'HIGH': return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'MEDIUM': return 'border-amber-500/50 bg-amber-500/10 text-amber-400';
      default: return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
    }
  };

  return (
    <div className="relative w-full h-[60vh] bg-black/20 rounded-2xl border border-white/5 overflow-hidden p-8">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Institutional Cognition Layer</h3>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> CRITICAL</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> HIGH</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> MEDIUM</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-8 justify-center items-center h-full">
        {graph.nodes.map((node, i) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`relative group p-4 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer ${getRiskColor(node.risk || 'LOW')}`}
            style={{ width: '180px' }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-1.5 rounded-lg bg-black/20">
                {getNodeIcon(node.type)}
              </div>
              {node.ownership && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 text-[8px] font-bold uppercase">
                  <User className="w-2 h-2" />
                  {node.ownership}
                </div>
              )}
            </div>
            
            <h4 className="font-bold text-sm mb-1">{node.label}</h4>
            <div className="text-[9px] opacity-60 font-mono uppercase tracking-tighter">
              {node.type} • {node.id}
            </div>

            {/* Simulated connections - in a real graph these would be lines */}
            <div className="absolute -z-10 w-full h-full border border-white/5 rounded-xl top-1 left-1 group-hover:top-2 group-hover:left-2 transition-all"></div>
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] text-slate-600 font-mono italic">
        * System State: STABLE | Frozen: YES
      </div>
    </div>
  );
};
