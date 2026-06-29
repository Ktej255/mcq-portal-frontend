"use client";

import { useState, useEffect, useRef } from "react";
import type { DiscussionTurnOut } from "@/services/api/gsLmsService";
import { gsLmsService } from "@/services/api/gsLmsService";
import { DiscussionThread } from "./DiscussionThread";

interface ConceptProgress {
  conceptsMatched: string[];
  conceptsMissed: string[];
  matchPercentage: number;
}

interface DiscussionOverlayProps {
  nodeId: number;
  onComplete: () => void;
}

function ConceptProgressIndicator({ progress }: { progress: ConceptProgress }) {
  const { conceptsMatched, conceptsMissed, matchPercentage } = progress;
  const total = conceptsMatched.length + conceptsMissed.length;
  const covered = conceptsMatched.length;

  const barColor =
    matchPercentage >= 80
      ? "bg-[#1d9e75]"
      : matchPercentage >= 50
        ? "bg-[#ef9f27]"
        : "bg-[#dcd5c7]";

  return (
    <div className="mx-4 mt-3 p-3 rounded-xl border border-[#dcd5c7] bg-[#f7f4ee]">
      {/* Progress bar header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#13251d]/60">
          {covered}/{total} concepts covered
        </span>
        <span className="text-xs font-medium text-[#13251d]/60">
          {Math.round(matchPercentage)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[#dcd5c7] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${matchPercentage}%` }}
        />
      </div>

      {/* Matched concepts list */}
      {conceptsMatched.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {conceptsMatched.map((concept) => (
            <span
              key={concept}
              className="text-xs text-[#13251d]/60 flex items-center gap-1"
            >
              <span className="text-[#1d9e75]">✓</span>
              {concept}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function DiscussionOverlay({ nodeId, onComplete }: DiscussionOverlayProps) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [turns, setTurns] = useState<DiscussionTurnOut[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conceptProgress, setConceptProgress] = useState<ConceptProgress | null>(null);
  const [gatePassed, setGatePassed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsLmsService
      .startDiscussion("geography", nodeId)
      .then((session) => {
        setSessionId(session.session_id);
        setTurns(session.turns);
      })
      .finally(() => setLoading(false));
  }, [nodeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      const response = await gsLmsService.submitDiscussionTurn("geography", sessionId, content);
      setTurns((prev) => [...prev, response.student_turn, response.ai_turn]);

      // Update concept progress if data is available
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

      if (response.gate_passed) {
        setGatePassed(true);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fffdf8]">
      {/* Header */}
      <div className="flex items-center px-5 py-4 border-b border-[#dcd5c7] bg-[#f7f4ee]">
        <div className="flex-1">
          <h2 className="text-base font-semibold text-[#1a3a2a]">Discussion Gate</h2>
          <p className="text-xs text-[#13251d]/60">
            Explain what you know about this topic to unlock content
          </p>
        </div>
      </div>

      {/* Concept progress indicator — only shown when concept data exists */}
      {conceptProgress && <ConceptProgressIndicator progress={conceptProgress} />}

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#1d9e75] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : turns.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6 text-center">
            <p className="text-sm text-[#13251d]/60">
              Start by explaining what you already know about this topic.
            </p>
          </div>
        ) : (
          <DiscussionThread turns={turns} />
        )}
      </div>

      {/* Gate passed — show prominent proceed button instead of the input */}
      {gatePassed ? (
        <div className="flex flex-col items-center gap-3 px-4 py-5 border-t border-[#1d9e75]/30 bg-[#edf8f3]">
          <p className="text-sm font-medium text-[#1a3a2a]">
            🎉 Great work! You&apos;ve unlocked this topic.
          </p>
          <button
            onClick={onComplete}
            className="w-full max-w-sm px-6 py-3 text-sm font-semibold text-white bg-[#1d9e75] hover:bg-[#178a65] active:scale-[0.98] rounded-xl transition-all shadow-md"
          >
            Proceed to Content →
          </button>
        </div>
      ) : (
        /* Input area */
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-4 py-3 border-t border-[#dcd5c7] bg-[#f7f4ee]"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your explanation…"
            disabled={sending || loading}
            className="flex-1 px-4 py-2.5 text-sm bg-white border border-[#dcd5c7] rounded-lg outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || loading}
            className="px-4 py-2.5 text-sm font-medium text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
