'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Activity, Clock, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';
import { TraceTreeNode } from '@/services/api/observabilityService';
import { clsx } from 'clsx';

interface TraceNodeProps {
  node: TraceTreeNode;
  depth?: number;
}

export const TraceNode: React.FC<TraceNodeProps> = ({ node, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'FAILED': return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
      case 'STARTED': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4" />;
      case 'STARTED': return <Activity className="w-4 h-4 animate-pulse" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div 
        className={clsx(
          "group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-white/5",
          getStatusColor(node.status),
          depth > 0 && "ml-6 mt-2 border-l-2"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-[140px]">
          {node.children.length > 0 ? (
            isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="w-4" />
          )}
          {getStatusIcon(node.status)}
          <span className="font-mono text-xs font-bold uppercase tracking-wider">{node.module_name}</span>
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          <span className="text-sm font-semibold truncate">{node.function_name}</span>
          <span className="text-[10px] opacity-40 font-mono hidden md:block">#{node.trace_id.slice(0, 8)}</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {node.duration_ms !== null && (
            <div className="flex items-center gap-1 opacity-60">
              <Clock className="w-3 h-3" />
              <span>{node.duration_ms.toFixed(1)}ms</span>
            </div>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-[10px]"
          >
            {showDetails ? 'HIDE DATA' : 'VIEW DATA'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-10 mt-2 overflow-hidden"
          >
            <div className="bg-slate-900/50 border border-white/10 rounded-lg p-4 font-mono text-[11px] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-slate-500 mb-2 uppercase tracking-tighter">Input Payload</h4>
                <pre className="bg-black/30 p-2 rounded max-h-40 overflow-auto text-slate-300">
                  {JSON.stringify(node.input_payload, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-slate-500 mb-2 uppercase tracking-tighter">Output Payload</h4>
                <pre className="bg-black/30 p-2 rounded max-h-40 overflow-auto text-slate-300">
                  {JSON.stringify(node.output_payload || node.error_message, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}

        {isOpen && node.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col"
          >
            {node.children.map((child) => (
              <TraceNode key={child.trace_id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
