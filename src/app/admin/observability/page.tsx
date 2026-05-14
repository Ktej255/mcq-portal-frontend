'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { observabilityService } from '@/services/api/observabilityService';
import { Activity, RefreshCw, Filter, Search, Clock, Zap, Database, Server, AlertTriangle, CheckCircle2, Camera, Shield, User, FileText, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TraceNode } from '@/components/admin/observability/TraceNode';
import { GovernanceGraph } from '@/components/admin/observability/GovernanceGraph';
import { MutationTimeline } from '@/components/admin/observability/MutationTimeline';

type TabType = 'traces' | 'jobs' | 'metrics' | 'governance';

export default function ObservabilityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('traces');
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const { data: traceList, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: ['traces'],
    queryFn: () => observabilityService.listTraces(20),
    refetchInterval: 10000,
    enabled: activeTab === 'traces',
  });

  const { data: traceTree, isLoading: treeLoading } = useQuery({
    queryKey: ['trace-tree', selectedTraceId],
    queryFn: () => observabilityService.getTraceTree(selectedTraceId!),
    enabled: !!selectedTraceId && activeTab === 'traces',
  });

  const { data: jobList, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => observabilityService.listJobs(50),
    refetchInterval: 5000,
    enabled: activeTab === 'jobs',
  });

  const { data: metricList, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => observabilityService.listMetrics(100),
    refetchInterval: 10000,
    enabled: activeTab === 'metrics',
  });

  const recordMetrics = useMutation({
    mutationFn: () => observabilityService.recordMetricsSnapshot(),
    onSuccess: () => refetchMetrics(),
  });

  const { data: graphData, isLoading: graphLoading } = useQuery({
    queryKey: ['governance-graph'],
    queryFn: () => observabilityService.getDependencyGraph(),
    enabled: activeTab === 'governance',
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['mutation-timeline'],
    queryFn: () => observabilityService.getMutationTimeline(),
    enabled: activeTab === 'governance',
  });

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">System Observability</h1>
          </div>
          <p className="text-slate-500 text-sm">Real-time execution tracing for the UPSC Educational OS.</p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'metrics' && (
            <button 
              onClick={() => recordMetrics.mutate()}
              disabled={recordMetrics.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-bold text-emerald-400 disabled:opacity-50"
            >
              <Camera className={`w-3 h-3 ${recordMetrics.isPending ? 'animate-pulse' : ''}`} />
              SNAPSHOT METRICS
            </button>
          )}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-4">
            {(['traces', 'jobs', 'metrics', 'governance'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'traces') refetchList();
              if (activeTab === 'jobs') refetchJobs();
              if (activeTab === 'metrics') refetchMetrics();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${(listLoading || jobsLoading || metricsLoading) ? 'animate-spin' : ''}`} />
            REFRESH PULSE
          </button>
        </div>
      </header>

      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'traces' && (
            <motion.div 
              key="traces-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-8"
            >
              {/* Traces UI (Existing logic) */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Live Execution Stream
                  </h2>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">LIVE</span>
                </div>

                <div className="space-y-2 max-h-[70vh] overflow-auto pr-2 custom-scrollbar">
                  {listLoading ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 w-full rounded-xl bg-white/5 animate-pulse" />
                    ))
                  ) : (
                    traceList?.data.traces.map((trace) => (
                      <div
                        key={trace.trace_id}
                        onClick={() => setSelectedTraceId(trace.trace_id)}
                        className={`group p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedTraceId === trace.trace_id 
                            ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-slate-500">#{trace.trace_id.slice(0, 8)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            trace.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 
                            trace.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {trace.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                          {trace.function_name}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 opacity-50 text-[10px]">
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(trace.created_at).toLocaleTimeString()}</span>
                          <span className="font-mono">{trace.module_name}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="xl:col-span-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[70vh] relative overflow-hidden">
                  {!selectedTraceId ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                      <Search className="w-12 h-12 mb-4" />
                      <p className="text-lg font-medium">Select a trace to view deep execution data</p>
                    </div>
                  ) : treeLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : traceTree?.data ? (
                    <div>
                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                        <div>
                          <h2 className="text-xl font-bold text-white mb-1">Execution Timeline</h2>
                          <p className="text-xs text-slate-500 font-mono">TRACE_ID: {selectedTraceId}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-400 font-mono">
                            {traceTree.data.duration_ms?.toFixed(2)} <span className="text-sm">ms</span>
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-slate-500">Total Duration</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <TraceNode node={traceTree.data} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'jobs' && (
            <motion.div 
              key="jobs-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 mb-6">
                    <Database className="w-3 h-3" />
                    Background Job Execution Registry
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                          <th className="pb-4 font-bold">Job Name</th>
                          <th className="pb-4 font-bold">Type</th>
                          <th className="pb-4 font-bold">Status</th>
                          <th className="pb-4 font-bold">Started</th>
                          <th className="pb-4 font-bold">Duration</th>
                          <th className="pb-4 font-bold">Retries</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {jobsLoading ? (
                          <tr><td colSpan={6} className="py-8 text-center text-slate-500">Scanning registry...</td></tr>
                        ) : jobList?.data.jobs.length === 0 ? (
                          <tr><td colSpan={6} className="py-8 text-center text-slate-500">No background jobs found.</td></tr>
                        ) : (
                          jobList?.data.jobs.map((job) => (
                            <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                              <td className="py-4 font-bold text-white">
                                {job.job_name}
                                {job.reference_id && <span className="block text-[10px] text-slate-500 font-mono mt-1">REF: {job.reference_id}</span>}
                              </td>
                              <td className="py-4 text-xs font-mono text-slate-400">{job.job_type}</td>
                              <td className="py-4">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                  job.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                  'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                                }`}>
                                  {job.status}
                                </span>
                              </td>
                              <td className="py-4 text-xs text-slate-400">{new Date(job.started_at).toLocaleString()}</td>
                              <td className="py-4 font-mono text-blue-400">{job.duration_ms ? `${job.duration_ms}ms` : '-'}</td>
                              <td className="py-4">
                                <span className={job.retries > 0 ? 'text-amber-400' : 'text-slate-600'}>{job.retries}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div 
              key="metrics-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {metricsLoading ? (
                <div className="col-span-full py-20 text-center text-slate-500">Aggregating telemetry metrics...</div>
              ) : (
                metricList?.data.metrics.map((metric) => (
                  <div key={metric.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{metric.metric_type}</h3>
                      <Server className="w-4 h-4 text-blue-500/50" />
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-black text-white">{metric.value.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 font-mono">UPSC_UNIT</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-4 font-mono">
                      {new Date(metric.timestamp).toLocaleString()}
                    </div>
                    {metric.metadata_json && (
                      <div className="bg-black/40 rounded-lg p-3 text-[10px] font-mono text-slate-400 overflow-hidden">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(metric.metadata_json, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'governance' && (
            <motion.div 
              key="governance-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Dependency Cognition Graph
                    </h2>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold uppercase tracking-tighter">Frozen</span>
                  </div>
                  {graphLoading ? (
                    <div className="h-[60vh] bg-white/5 rounded-2xl animate-pulse flex items-center justify-center">
                      <Zap className="w-8 h-8 text-blue-500 animate-pulse" />
                    </div>
                  ) : graphData?.data ? (
                    <GovernanceGraph graph={graphData.data} />
                  ) : null}
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 mb-6">
                      <Lock className="w-3 h-3" />
                      Active File Locks
                    </h2>
                    <div className="space-y-3">
                      {[
                        'scoring_engine.py',
                        'report_service.py',
                        'domain.py',
                        'reliability_engine.py'
                      ].map(file => (
                        <div key={file} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                          <span className="text-xs font-mono text-slate-300">{file}</span>
                          <Shield className="w-3 h-3 text-rose-500" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 mb-6">
                      <User className="w-3 h-3" />
                      Active Workstreams
                    </h2>
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-blue-400 uppercase">Chat #1</span>
                          <span className="text-[8px] bg-blue-500/20 px-1.5 py-0.5 rounded uppercase">Product</span>
                        </div>
                        <p className="text-xs font-semibold text-white">Revision Intelligence</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">Chat #2</span>
                          <span className="text-[8px] bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase">Governance</span>
                        </div>
                        <p className="text-xs font-semibold text-white">Institutional Stabilization</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                {timelineLoading ? (
                  <div className="py-20 text-center text-slate-500">Retrieving forensic audit trail...</div>
                ) : timelineData?.data?.mutations ? (
                  <MutationTimeline mutations={timelineData.data.mutations} />
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
