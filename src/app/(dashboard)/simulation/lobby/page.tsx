"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Timer,
  ZapOff,
  AlertTriangle,
  Target,
  ArrowRight,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { examService, TestMetadata } from '@/services/api/examService';

export default function SimulationLobby() {
  return (
    <ProtectedRoute>
      <SimulationLobbyContent />
    </ProtectedRoute>
  );
}

function SimulationLobbyContent() {
  const router = useRouter();
  const [tests, setTests] = useState<TestMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    examService.getAvailableTests()
      .then((availableTests) => {
        if (active) setTests(availableTests);
      })
      .catch(() => {
        if (active) setError('Simulation sessions are temporarily unavailable. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const startSimulation = async (test: TestMetadata) => {
    setStartingTestId(test.id);
    setError(null);
    try {
      const attempt = await examService.startSimulation(test.id);
      if (!attempt.attemptId) {
        throw new Error('The simulation did not return an attempt ID.');
      }
      router.push(`/exam/${test.id}?attemptId=${encodeURIComponent(attempt.attemptId)}`);
    } catch {
      setError('This simulation could not be started. Please try again.');
    } finally {
      setStartingTestId(null);
    }
  };

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
          { icon: <Timer className="text-indigo-600" />, title: 'Strict Timing', desc: 'No pausing. Sessions follow the selected test duration.' },
          { icon: <ZapOff className="text-indigo-600" />, title: 'No Feedback', desc: 'Explanations remain hidden until final submission.' },
          { icon: <AlertTriangle className="text-indigo-600" />, title: 'Serious Scoring', desc: 'The selected test configuration controls negative marking.' },
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

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="rounded-[3rem] border-none bg-zinc-900 text-white overflow-hidden shadow-2xl">
          <CardContent className="p-12 text-center text-zinc-300">Loading available sessions…</CardContent>
        </Card>
      ) : tests.length === 0 ? (
        <Card className="rounded-[3rem] border-none bg-zinc-900 text-white overflow-hidden shadow-2xl">
          <CardContent className="p-12 text-center text-zinc-300" data-testid="simulation-lobby-empty">
            <p>No timed test is open right now. New tests appear here as soon as they are published.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/upsc/current-affairs" className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-black text-zinc-900 hover:bg-zinc-200">
                Try a current affairs quiz
              </Link>
              <Link href="/reports#tests" className="inline-flex min-h-11 items-center rounded-full border border-zinc-600 px-5 text-sm font-black text-white hover:bg-zinc-800">
                See your past tests
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tests.map((test) => {
            const canStart = test.canStart !== false && Boolean(test.totalQuestions);
            const isStarting = startingTestId === test.id;
            return (
              <Card key={test.id} className="rounded-[3rem] border-none bg-zinc-900 text-white overflow-hidden shadow-2xl">
                <CardContent className="p-12 space-y-8">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Available Session</p>
                      <h2 className="text-3xl font-black tracking-tight">{test.title}</h2>
                      <p className="text-zinc-400 font-medium">{test.totalQuestions ?? 0} Questions • {test.subject}</p>
                      {test.description && <p className="mt-2 text-sm text-zinc-400">{test.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-5xl font-black tracking-tighter">{test.durationMinutes}</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Minutes</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-sm text-zinc-300 font-medium italic">
                      &quot;Temperament is the silent differentiator in the final 10 minutes of the exam.&quot;
                    </p>
                  </div>

                  <Button
                    type="button"
                    disabled={!canStart || isStarting}
                    onClick={() => startSimulation(test)}
                    className="w-full h-18 rounded-lg bg-indigo-500 text-white font-black text-xl shadow-xl shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isStarting ? 'STARTING…' : canStart ? 'START SIMULATION' : 'NO PUBLISHED QUESTIONS'}
                    {canStart && !isStarting ? <ArrowRight className="ml-2" /> : null}
                  </Button>

                  <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
                    By starting, you acknowledge that this attempt cannot be paused or reset.
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
