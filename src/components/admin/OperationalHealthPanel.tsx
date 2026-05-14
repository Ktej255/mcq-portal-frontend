import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Database } from 'lucide-react';

interface HealthMetric {
    label: string;
    value: string | number;
    status: 'stable' | 'warning' | 'critical';
}

/**
 * Focus Area 5: Global Operational Health Panel
 * Visualizes system reliability and failure visibility.
 */
export const OperationalHealthPanel: React.FC = () => {
    // In a real app, these would come from a global observability API
    const metrics: HealthMetric[] = [
        { label: "Report Generation Success", value: "99.4%", status: 'stable' },
        { label: "Telemetry Corruption Rate", value: "0.2%", status: 'stable' },
        { label: "AI Gateway Latency", value: "840ms", status: 'warning' },
        { label: "Degraded Mode Frequency", value: "1.5%", status: 'stable' },
        { label: "Ingestion Integrity", value: "Verified", status: 'stable' },
    ];

    return (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="text-emerald-500" />
                    Operational Health
                </h2>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">
                    LIVE
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{m.label}</p>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-2xl font-bold text-white">{m.value}</span>
                            {m.status === 'stable' ? (
                                <CheckCircle className="text-emerald-500 w-5 h-5" />
                            ) : m.status === 'warning' ? (
                                <AlertTriangle className="text-amber-500 w-5 h-5" />
                            ) : (
                                <AlertTriangle className="text-red-500 w-5 h-5" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center gap-4 text-sm text-slate-500">
                <Database className="w-4 h-4" />
                <span>Forensic Storage Active</span>
                <span className="ml-auto text-xs opacity-50">Last Heartbeat: 2s ago</span>
            </div>
        </div>
    );
};
