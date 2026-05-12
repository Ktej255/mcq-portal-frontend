"use client";

import { useState, useEffect } from 'react';

interface DebugPanelProps {
  error: any;
  context?: string;
}

export function DebugPanel({ error, context }: DebugPanelProps) {
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDebugData((window as any).MCQ_DEBUG || {});
    }
  }, [error]);

  if (!error && !debugData) return null;

  return (
    <div className="mt-8 p-6 bg-zinc-950 text-zinc-100 rounded-xl border border-red-500/50 shadow-2xl font-mono text-xs overflow-auto max-w-full">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
        <h3 className="text-red-400 font-bold uppercase tracking-widest text-sm">Forensic Debug Mode</h3>
        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px]">{context || 'Global'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <section>
            <h4 className="text-zinc-500 mb-1 uppercase text-[10px]">Authentication State</h4>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
              <p><span className="text-zinc-500">State:</span> {debugData?.authState}</p>
              <p><span className="text-zinc-500">Token Present:</span> {String(debugData?.tokenPresent)}</p>
              <p><span className="text-zinc-500">User:</span> {debugData?.user ? `${debugData.user.email} (${debugData.user.uid})` : 'null'}</p>
            </div>
          </section>

          <section>
            <h4 className="text-zinc-500 mb-1 uppercase text-[10px]">Axios Error</h4>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-red-300">
              <p>{error?.message || 'No current exception'}</p>
              {error?.code && <p><span className="text-zinc-500">Code:</span> {error.code}</p>}
            </div>
          </section>

          {debugData?.lastRequest && (
            <section>
              <h4 className="text-zinc-500 mb-1 uppercase text-[10px]">Last Request</h4>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800 overflow-x-auto">
                <p className="text-green-400">{debugData.lastRequest.method} {debugData.lastRequest.url}</p>
                <pre className="text-[10px] mt-1 text-zinc-400">
                  {JSON.stringify(debugData.lastRequest.headers, null, 2)}
                </pre>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section>
            <h4 className="text-zinc-500 mb-1 uppercase text-[10px]">Response Body</h4>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800 overflow-x-auto min-h-[100px]">
              <pre className="text-blue-300">
                {JSON.stringify(debugData?.lastResponse?.data || error?.response?.data || 'No response body', null, 2)}
              </pre>
            </div>
          </section>

          <section>
            <h4 className="text-zinc-500 mb-1 uppercase text-[10px]">Status & Headers</h4>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
              <p><span className="text-zinc-500">Status:</span> {debugData?.lastResponse?.status || error?.response?.status || 'N/A'}</p>
              <p className="text-[10px] text-zinc-500 mt-2">Response Headers:</p>
              <pre className="text-[10px] text-zinc-500">
                {JSON.stringify(debugData?.lastResponse?.headers || {}, null, 2)}
              </pre>
            </div>
          </section>

          <section>
            <h4 className="text-zinc-500 mb-1 uppercase text-[10px]">Stack Trace</h4>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800 overflow-x-auto max-h-[150px]">
              <pre className="text-zinc-600 text-[9px]">
                {error?.stack || debugData?.lastResponse?.stack || 'No stack trace available'}
              </pre>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-zinc-800 flex justify-end">
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-1 rounded text-[10px] transition-colors"
        >
          HARD REFRESH & CAPTURE
        </button>
      </div>
    </div>
  );
}
