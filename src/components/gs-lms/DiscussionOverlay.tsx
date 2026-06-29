"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DiscussionTurnOut, DiscussionSessionOut } from "@/services/api/gsLmsService";
import { gsLmsService } from "@/services/api/gsLmsService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConceptProgress {
  conceptsMatched: string[];
  conceptsMissed: string[];
  matchPercentage: number;
}

interface DiscussionOverlayProps {
  nodeId: number;
  topicTitle: string;
  onComplete: () => void;
}

// ---------------------------------------------------------------------------
// Web Speech API — file-scoped types (DS prefix avoids global namespace clash)
// ---------------------------------------------------------------------------
interface DSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: DSpeechRecognitionResultList;
}

interface DSpeechRecognitionResultList {
  readonly length: number;
  [index: number]: DSpeechRecognitionResult;
}

interface DSpeechRecognitionResult {
  readonly length: number;
  [index: number]: DSpeechRecognitionAlternative;
}

interface DSpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface DSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: DSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onstart: (() => void) | null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({ progress }: { progress: ConceptProgress }) {
  const { conceptsMatched, conceptsMissed, matchPercentage } = progress;
  const total = conceptsMatched.length + conceptsMissed.length;
  const covered = conceptsMatched.length;

  const barColor =
    matchPercentage >= 80
      ? "bg-emerald-500"
      : matchPercentage >= 50
        ? "bg-amber-400"
        : "bg-slate-300";

  return (
    <div className="px-5 pt-3 pb-2 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Knowledge Coverage
        </span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            matchPercentage >= 80
              ? "bg-emerald-100 text-emerald-700"
              : matchPercentage >= 50
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          {covered}/{total} concepts · {Math.round(matchPercentage)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${matchPercentage}%` }}
        />
      </div>
      {/* Concept pills */}
      {(conceptsMatched.length > 0 || conceptsMissed.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {conceptsMatched.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5"
            >
              <span>✓</span> {c}
            </span>
          ))}
          {conceptsMissed.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200 rounded-full px-2 py-0.5"
            >
              <span>○</span> {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MicButton({
  listening,
  supported,
  onToggle,
}: {
  listening: boolean;
  supported: boolean;
  onToggle: () => void;
}) {
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      title={listening ? "Stop recording" : "Speak your answer"}
      className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 flex-shrink-0 ${
        listening
          ? "bg-red-500 shadow-lg shadow-red-200 scale-110"
          : "bg-slate-100 hover:bg-slate-200 text-slate-500"
      }`}
    >
      {/* Pulsing ring when active */}
      {listening && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-50" />
      )}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-5 h-5 relative z-10 ${listening ? "text-white" : ""}`}
      >
        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1.5 15.93A8.001 8.001 0 0 1 4 11H2a10 10 0 0 0 9 9.95V23h2v-2.05A10 10 0 0 0 22 11h-2a8 8 0 0 1-6.5 5.93v-1.88z" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Welcome Screen (Phase 0 — no turns yet)
// ---------------------------------------------------------------------------

function WelcomeScreen({
  topicTitle,
  input,
  setInput,
  onSubmit,
  sending,
  listening,
  micSupported,
  onToggleMic,
}: {
  topicTitle: string;
  input: string;
  setInput: (v: string) => void;
  onSubmit: (text: string) => void;
  sending: boolean;
  listening: boolean;
  micSupported: boolean;
  onToggleMic: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSubmit(input.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
          <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.7 5.25 1.855V4.533zM12.75 20.605A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.072z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">Knowledge Check</h1>
      <p className="text-slate-500 text-sm mb-1 font-medium">{topicTitle}</p>
      <p className="text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">
        Before we begin, tell us what you already know about this topic. Speak or type — our AI
        will guide you through a short discussion.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-3">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Start speaking or type your answer here…"
            rows={4}
            disabled={sending}
            className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none shadow-sm placeholder:text-slate-300 text-slate-700 transition-all"
          />
          {listening && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-red-500 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Recording…
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <MicButton listening={listening} supported={micSupported} onToggle={onToggleMic} />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex-1 py-3 px-6 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all active:scale-[0.98] shadow-sm"
          >
            {sending ? "Analysing…" : "Submit & Begin →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Discussion Screen (Phase 1 — turns exist, gate not passed)
// ---------------------------------------------------------------------------

function ActiveDiscussionScreen({
  turns,
  input,
  setInput,
  onSubmit,
  onForceComplete,
  sending,
  listening,
  micSupported,
  onToggleMic,
}: {
  turns: DiscussionTurnOut[];
  input: string;
  setInput: (v: string) => void;
  onSubmit: (text: string) => void;
  onForceComplete: () => void;
  sending: boolean;
  listening: boolean;
  micSupported: boolean;
  onToggleMic: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSubmit(input.trim());
  };

  // Get last AI question and last student answer (if any)
  const lastAiTurn = [...turns].reverse().find((t) => t.role === "ai");
  const lastStudentTurn = [...turns].reverse().find((t) => t.role === "student");

  // Detect if the AI's last message is a gate-pass message
  const lastAiText = (lastAiTurn?.content ?? "").toLowerCase();
  const isGatePassMessage =
    lastAiText.includes("proceed to the content") ||
    lastAiText.includes("let's proceed") ||
    lastAiText.includes("lets proceed") ||
    lastAiText.includes("demonstrated a solid") ||
    lastAiText.includes("you've unlocked") ||
    lastAiText.includes("you have unlocked");

  // Show escape-hatch link after 2+ rounds
  const canEscape = turns.length >= 4; // 2 student + 2 AI turns

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {/* Previous student answer (soft recap) */}
        {lastStudentTurn && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Your last answer
            </p>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
              {lastStudentTurn.content}
            </p>
          </div>
        )}

        {/* Current AI question — prominent */}
        {lastAiTurn && (
          <div
            className={`rounded-3xl px-5 py-5 shadow-md ${
              isGatePassMessage
                ? "bg-emerald-600 shadow-emerald-100"
                : "bg-emerald-600 shadow-emerald-100"
            }`}
          >
            <p className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest mb-2">
              {isGatePassMessage ? "✓ Gate Passed" : "AI Tutor asks"}
            </p>
            <p className="text-white text-base leading-relaxed font-medium">
              {lastAiTurn.content}
            </p>
          </div>
        )}
      </div>

      {/* Bottom area — Proceed button if gate text detected, else input form */}
      {isGatePassMessage ? (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-5 flex flex-col items-center gap-3">
          <p className="text-sm font-semibold text-emerald-800">🎉 You&apos;ve unlocked this topic!</p>
          <button
            onClick={onForceComplete}
            className="w-full max-w-sm py-3.5 px-6 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-2xl transition-all shadow-lg shadow-emerald-200"
          >
            Proceed to Content →
          </button>
        </div>
      ) : (
        <div className="border-t border-slate-100 bg-white px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response or tap the mic…"
                rows={3}
                disabled={sending}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none placeholder:text-slate-300 text-slate-700 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !sending) onSubmit(input.trim());
                  }
                }}
              />
              {listening && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 text-red-500 text-xs font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Listening…
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <MicButton listening={listening} supported={micSupported} onToggle={onToggleMic} />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex-1 py-2.5 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all active:scale-[0.98]"
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analysing…
                  </span>
                ) : (
                  "Submit Answer →"
                )}
              </button>
            </div>
          </form>
          {/* Escape hatch after sufficient discussion */}
          {canEscape && (
            <button
              onClick={onForceComplete}
              className="w-full mt-2 text-xs text-slate-400 hover:text-emerald-600 transition-colors py-1"
            >
              I&apos;ve understood the topic — skip ahead →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion / Report Screen (Phase 2 — gate passed)
// ---------------------------------------------------------------------------

function CompletionScreen({
  progress,
  onProceed,
}: {
  progress: ConceptProgress | null;
  onProceed: () => void;
}) {
  const matched = progress?.conceptsMatched ?? [];
  const missed = progress?.conceptsMissed ?? [];
  const pct = progress ? Math.round(progress.matchPercentage) : 100;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-5 py-8 items-center">
      {/* Trophy / celebration */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mb-4">
        <span className="text-4xl">🎉</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Gate Unlocked!</h2>
      <p className="text-slate-500 text-sm mb-8">
        Great discussion. Here&apos;s your knowledge summary:
      </p>

      {/* Score ring + bar */}
      <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl shadow-sm p-5 mb-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Overall Coverage</span>
          <span
            className={`text-sm font-bold px-3 py-1 rounded-full ${
              pct >= 80
                ? "bg-emerald-100 text-emerald-700"
                : pct >= 50
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-600"
            }`}
          >
            {pct}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Concept breakdown */}
      {matched.length > 0 && (
        <div className="w-full max-w-sm mb-4">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
            ✓ Concepts you covered ({matched.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {matched.map((c) => (
              <span
                key={c}
                className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {missed.length > 0 && (
        <div className="w-full max-w-sm mb-8">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
            ⚡ To reinforce in the content ({missed.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {missed.map((c) => (
              <span
                key={c}
                className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onProceed}
        className="w-full max-w-sm py-4 px-6 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-2xl transition-all shadow-lg shadow-emerald-200"
      >
        Proceed to Content →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Overlay
// ---------------------------------------------------------------------------

export function DiscussionOverlay({ nodeId, topicTitle, onComplete }: DiscussionOverlayProps) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [turns, setTurns] = useState<DiscussionTurnOut[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conceptProgress, setConceptProgress] = useState<ConceptProgress | null>(null);
  // Phase: 0 = welcome (no turns), 1 = active discussion, 2 = gate passed / report
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  // Voice input state
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recognitionRef = useRef<DSpeechRecognition | null>(null);

  // Detect browser speech API support
  useEffect(() => {
    const w = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
    setMicSupported(!!(w?.SpeechRecognition || w?.webkitSpeechRecognition));
  }, []);

  // Load / resume existing session
  useEffect(() => {
    gsLmsService
      .startDiscussion("geography", nodeId)
      .then((session: DiscussionSessionOut) => {
        setSessionId(session.session_id);
        setTurns(session.turns);

        // BUG FIX: If session is already COMPLETED, skip straight to report
        if (session.status === "COMPLETED") {
          setPhase(2);
        } else if (session.turns.length > 0) {
          setPhase(1);
        } else {
          setPhase(0);
        }
      })
      .finally(() => setLoading(false));
  }, [nodeId]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    const w = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
    const Ctor = (w?.SpeechRecognition || w?.webkitSpeechRecognition) as
      | (new () => DSpeechRecognition)
      | undefined;
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: DSpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => {
        const base = prev.replace(/\s*\[…\]\s*$/, "").trimEnd();
        return base ? `${base} ${transcript}` : transcript;
      });
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  // Stop mic on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim() || !sessionId || sending) return;

      // Stop mic if active
      recognitionRef.current?.stop();
      setListening(false);

      setInput("");
      setSending(true);
      setPhase(1); // Move to active discussion phase

      try {
        const response = await gsLmsService.submitDiscussionTurn("geography", sessionId, text);
        setTurns((prev) => [...prev, response.student_turn, response.ai_turn]);

        if (
          response.concepts_matched !== null &&
          response.concepts_missed !== null &&
          response.match_percentage !== null
        ) {
          setConceptProgress({
            conceptsMatched: response.concepts_matched,
            conceptsMissed: response.concepts_missed,
            matchPercentage: response.match_percentage,
          });
        }

        // Multi-signal gate detection:
        // 1. Explicit gate_passed flag
        // 2. Session status set to COMPLETED by backend
        // 3. AI message text contains the proceed phrase (backend sometimes sends
        //    the congratulatory message before flipping the flag)
        const aiText = response.ai_turn.content.toLowerCase();
        const textSignal =
          aiText.includes("proceed to the content") ||
          aiText.includes("let's proceed") ||
          aiText.includes("lets proceed") ||
          aiText.includes("you've unlocked") ||
          aiText.includes("you have unlocked") ||
          aiText.includes("demonstrated a solid");

        if (response.gate_passed || response.status === "COMPLETED" || textSignal) {
          setPhase(2);
        }
      } finally {
        setSending(false);
      }
    },
    [sessionId, sending]
  );

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading your session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-4 h-4"
          >
            <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
            Discussion Gate
          </p>
          <h2 className="text-sm font-semibold text-slate-800 truncate">{topicTitle}</h2>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((s) => (
            <span
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                phase === s
                  ? "bg-emerald-500 w-5"
                  : phase > s
                    ? "bg-emerald-300"
                    : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Progress bar (phases 1 & 2 only) ── */}
      {conceptProgress && phase !== 2 && <ProgressBar progress={conceptProgress} />}

      {/* ── Phase content ── */}
      {phase === 0 && (
        <WelcomeScreen
          topicTitle={topicTitle}
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          sending={sending}
          listening={listening}
          micSupported={micSupported}
          onToggleMic={toggleMic}
        />
      )}

      {phase === 1 && (
        <ActiveDiscussionScreen
          turns={turns}
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          onForceComplete={onComplete}
          sending={sending}
          listening={listening}
          micSupported={micSupported}
          onToggleMic={toggleMic}
        />
      )}

      {phase === 2 && (
        <CompletionScreen progress={conceptProgress} onProceed={onComplete} />
      )}
    </div>
  );
}
