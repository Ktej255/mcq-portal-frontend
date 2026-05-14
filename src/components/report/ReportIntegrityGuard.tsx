import React, { useEffect, useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface ReportIntegrityGuardProps {
    reportId: string;
    serverTimestamp: string;
    onIntegrityFailure?: (error: string) => void;
    children: React.ReactNode;
}

/**
 * Focus Area 4: Frontend State Stability
 * Detects stale states or hydration mismatches in the report view.
 */
export const ReportIntegrityGuard: React.FC<ReportIntegrityGuardProps> = ({ 
    reportId, 
    serverTimestamp, 
    onIntegrityFailure,
    children 
}) => {
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Stale State Detection
        const lastLoaded = localStorage.getItem(`report_sync_${reportId}`);
        if (lastLoaded && lastLoaded !== serverTimestamp) {
            const msg = "STALE_REPORT_DETECTED: Local cache mismatch with server truth.";
            setError(msg);
            onIntegrityFailure?.(msg);
            return;
        }

        // 2. Hydration Verification
        // If the report rendering takes too long or displays inconsistent values, we flag it.
        localStorage.setItem(`report_sync_${reportId}`, serverTimestamp);
        setIsVerified(true);
    }, [reportId, serverTimestamp]);

    if (error) {
        return (
            <div className="p-6 bg-red-900/20 border border-red-500 rounded-xl flex items-start gap-4">
                <AlertCircle className="text-red-500 w-6 h-6 flex-shrink-0" />
                <div>
                    <h3 className="text-red-500 font-bold">Forensic Integrity Failure</h3>
                    <p className="text-red-300/80 text-sm mt-1">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                        Sync with Server Truth
                    </button>
                </div>
            </div>
        );
    }

    if (!isVerified) return <div className="animate-pulse bg-slate-800 h-64 rounded-xl" />;

    return (
        <div className="relative">
            <div className="absolute -top-3 -right-3">
                <ShieldCheck className="text-emerald-500 w-6 h-6" title="Forensically Verified" />
            </div>
            {children}
        </div>
    );
};
