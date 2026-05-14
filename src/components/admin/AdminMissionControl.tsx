import React from 'react';
import { OperationalHealthPanel } from './OperationalHealthPanel';
import { Activity, ShieldAlert, Users, TrendingUp } from 'lucide-react';

/**
 * Focus Area 2: Founder Operations Center (Mission Control)
 * Aggregates all institutional operational metrics into a single dashboard.
 */
export const AdminMissionControl: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Mission Control</h1>
                    <p className="text-slate-400 mt-1">Institutional Stability & Operational Awareness</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20">
                        V1.0.4-STABLE
                    </span>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                        SYNCED
                    </span>
                </div>
            </div>

            {/* Health Overview */}
            <OperationalHealthPanel />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real Student Validation Metrics */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <TrendingUp className="text-blue-500" />
                        Rollout Intelligence
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: "Session Completion Rate", value: "88%", delta: "+2%" },
                            { label: "Avg. Pacing (UPSC Std)", value: "54s", delta: "-3s" },
                            { label: "Mobile vs Desktop", value: "62% / 38%", delta: "Stable" },
                            { label: "Report Open Rate", value: "94%", delta: "+1%" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                                <span className="text-slate-400 text-sm">{item.label}</span>
                                <div className="text-right">
                                    <p className="text-white font-bold">{item.value}</p>
                                    <p className="text-emerald-500 text-[10px] font-medium">{item.delta}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Incidents & Degradations */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <ShieldAlert className="text-amber-500" />
                        Degradation Alerts
                    </h3>
                    <div className="space-y-3">
                        {[
                            { id: "DEG-001", type: "AI_GATEWAY", msg: "Latency spike detected (840ms)", time: "2m ago" },
                            { id: "DEG-002", type: "TELEMETRY", msg: "Partial event loss in Attempt #482", time: "14m ago" },
                        ].map((alert, i) => (
                            <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
                                <div className="mt-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-amber-500 text-xs font-bold font-mono">{alert.id}</span>
                                        <span className="text-slate-500 text-[10px]">{alert.time}</span>
                                    </div>
                                    <p className="text-slate-300 text-xs mt-1 font-medium">{alert.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors">
                        View All System Logs
                    </button>
                </div>
            </div>
        </div>
    );
};
