"use client";

/**
 * BrainDumpModal.tsx
 * Phase 5 — Brain Dump Notepad & Stress Alerts
 *
 * Step 5.2: Minimalist modal — type or speak freely to vent.
 * Step 5.3: Sends text to /api/upsc/brain-dump for stress analysis.
 *           If stress flags spike → shows supportive AI message + trial offer.
 *
 * Design: Organic Warm Academic Theme (#f7f4ee, #13251d, #dcd5c7)
 * No glassmorphism. No external dependencies.
 * Voice input uses Web Speech API (no deps, degrades gracefully).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Heart,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StressLevel = "low" | "moderate" | "high" | "critical";

interface BrainDumpResponse {
  stressLevel: StressLevel;
  stressScore: number; // 0–100
  message: string;
  nextAction: string;
  offerTrial: boolean;
  trialLabel?: string;
  mode: "local" | "ai";
}

type ModalState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "response"; data: BrainDumpResponse }
  | { phase: "error"; message: string };

// ─── Speech Recognition type shim ────────────────────────────────────────────
// SpeechRecognition is a browser API not fully typed in all TS DOM lib versions.
// We access it via a safe dynamic lookup to avoid strict-mode errors.

type SpeechRecognitionClass = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = { isFinal: boolean; length: number; [index: number]: SpeechRecognitionAlternative };
type SpeechRecognitionResultList = { length: number; [index: number]: SpeechRecognitionResult };
type SpeechRecognitionEvent = { resultIndex: number; results: SpeechRecognitionResultList };

function getSpeechRecognitionClass(): SpeechRecognitionClass | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as SpeechRecognitionClass | null ?? null;
}

type SpeechRecognitionInstance = InstanceType<SpeechRecognitionClass>;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 2000;

const PROMPTS = [
  "What's weighing on you today?",
  "Is there something you can't stop thinking about?",
  "What would you tell a close friend right now?",
  "What do you wish someone knew about how you're feeling?",
  "Describe your mind right now — chaotic, blank, racing?",
];

function randomPrompt(): string {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

// ─── Stress level display helpers ─────────────────────────────────────────────

function stressColor(level: StressLevel): string {
  switch (level) {
    case "low": return "#1d9e75";
    case "moderate": return "#b07d1a";
    case "high": return "#c45f1a";
    case "critical": return "#be4444";
  }
}

function stressBg(level: StressLevel): string {
  switch (level) {
    case "low": return "#e7f5ee";
    case "moderate": return "#fff4df";
    case "high": return "#fff0e5";
    case "critical": return "#fff4f4";
  }
}

function stressBorder(level: StressLevel): string {
  switch (level) {
    case "low": return "#cfe5dc";
    case "moderate": return "#f5d98a";
    case "high": return "#f5c08a";
    case "critical": return "#f5c6c6";
  }
}

function stressLabel(level: StressLevel): string {
  switch (level) {
    case "low": return "You seem grounded";
    case "moderate": return "Some tension detected";
    case "high": return "Noticeable stress signals";
    case "critical": return "High stress — take a moment";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BrainDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BrainDumpModal({ isOpen, onClose }: BrainDumpModalProps) {
  const [text, setText] = useState("");
  const [placeholder] = useState(randomPrompt);
  const [modalState, setModalState] = useState<ModalState>({ phase: "idle" });
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Speech recognition setup ──────────────────────────────────────────────

  useEffect(() => {
    if (getSpeechRecognitionClass()) {
      setHasSpeechSupport(true);
    }
  }, []);

  const toggleListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // Indian English — most relevant for UPSC students

    let finalTranscript = text;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim = result[0].transcript;
        }
      }
      setText((finalTranscript + interim).slice(0, MAX_CHARS));
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setText(finalTranscript.trim().slice(0, MAX_CHARS));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, text]);

  // ── Focus textarea on open ────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && modalState.phase === "idle") {
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, modalState.phase]);

  // ── Escape key close ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // ── Body scroll lock ──────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || modalState.phase === "submitting") return;

    recognitionRef.current?.stop();
    setIsListening(false);
    setModalState({ phase: "submitting" });

    try {
      const res = await fetch("/api/upsc/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Server error" }));
        setModalState({ phase: "error", message: (err as { message?: string }).message ?? "Server error" });
        return;
      }

      const data = (await res.json()) as BrainDumpResponse;
      setModalState({ phase: "response", data });
    } catch {
      setModalState({
        phase: "error",
        message: "Network error — response unavailable. Your words were heard.",
      });
    }
  }, [text, modalState.phase]);

  // ── Close & reset ─────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    onClose();
    // Delay reset so close animation can play
    setTimeout(() => {
      setText("");
      setModalState({ phase: "idle" });
    }, 300);
  }, [onClose]);

  const handleNewDump = useCallback(() => {
    setText("");
    setModalState({ phase: "idle" });
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  if (!isOpen) return null;

  const remaining = MAX_CHARS - text.length;
  const canSubmit = text.trim().length >= 5 && modalState.phase === "idle";

  // ─── Styles ────────────────────────────────────────────────────────────────

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(10, 20, 14, 0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  };

  const modal: React.CSSProperties = {
    background: "#fffdf8",
    border: "1px solid #dcd5c7",
    borderRadius: "1rem",
    boxShadow: "0 8px 32px rgba(10,20,14,0.18)",
    width: "100%",
    maxWidth: "36rem",
    maxHeight: "90dvh",
    overflowY: "auto",
    fontFamily:
      "'Inter', 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
  };

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    minHeight: "2.75rem",
    padding: "0 1.25rem",
    background: "#13251d",
    color: "#fff",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 900,
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "background 0.15s",
  };

  const btnGhost: React.CSSProperties = {
    ...btnPrimary,
    background: "transparent",
    color: "#13251d",
    border: "1px solid #dcd5c7",
  };

  // ─── Response screen ────────────────────────────────────────────────────────

  if (modalState.phase === "response") {
    const { data } = modalState;
    return (
      <div
        ref={overlayRef}
        style={overlay}
        onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Brain dump response"
      >
        <div style={modal}>
          {/* Header */}
          <div
            style={{
              padding: "1.25rem 1.25rem 0",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div>
              <p style={{ fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.2em", color: "#1d9e75", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                Brain Dump · Response
              </p>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#13251d", margin: 0 }}>
                {stressLabel(data.stressLevel)}
              </h2>
            </div>
            <button type="button" onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#8a8174" }}>
              <X style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          </div>

          {/* Stress indicator */}
          <div style={{ padding: "1rem 1.25rem" }}>
            <div
              style={{
                background: stressBg(data.stressLevel),
                border: `1px solid ${stressBorder(data.stressLevel)}`,
                borderRadius: "0.625rem",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Heart style={{ width: "1rem", height: "1rem", color: stressColor(data.stressLevel) }} />
                <p style={{ fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.14em", color: stressColor(data.stressLevel), textTransform: "uppercase" }}>
                  Stress signal · {data.stressScore}/100
                </p>
              </div>

              {/* Score bar */}
              <div style={{ height: "0.375rem", background: "rgba(0,0,0,0.08)", borderRadius: "1rem", overflow: "hidden", marginBottom: "1rem" }}>
                <div style={{ height: "100%", width: `${data.stressScore}%`, background: stressColor(data.stressLevel), borderRadius: "1rem", transition: "width 0.6s ease" }} />
              </div>

              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#13251d", lineHeight: 1.65 }}>
                {data.message}
              </p>
            </div>

            {/* Next action */}
            <div
              style={{
                background: "#f7f4ee",
                border: "1px solid #dcd5c7",
                borderRadius: "0.5rem",
                padding: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.18em", color: "#5d6b60", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                One thing to do
              </p>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#13251d", lineHeight: 1.6 }}>
                {data.nextAction}
              </p>
            </div>

            {/* Trial offer */}
            {data.offerTrial && (
              <div
                style={{
                  background: "#fffdf8",
                  border: "1.5px solid #1d9e75",
                  borderRadius: "0.625rem",
                  padding: "1rem",
                  marginBottom: "1rem",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <Sparkles style={{ width: "1.1rem", height: "1.1rem", color: "#1d9e75", flexShrink: 0, marginTop: "0.1rem" }} />
                <div>
                  <p style={{ fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.14em", color: "#1d9e75", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                    {data.trialLabel ?? "Free 1-month trial"}
                  </p>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#13251d", lineHeight: 1.6 }}>
                    High stress detected. As a care measure, you have been offered a free 1-month access to the Meditation &amp; Mindfulness portal. No action needed — it unlocks automatically.
                  </p>
                </div>
              </div>
            )}

            {data.mode === "local" && (
              <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#a09880", marginBottom: "0.75rem" }}>
                * AI service unavailable — response generated from local patterns. Your words are private and not stored.
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="button" onClick={handleNewDump} style={{ ...btnPrimary, flex: 1 }}>
                <BrainCircuit style={{ width: "1rem", height: "1rem" }} /> Dump again
              </button>
              <button type="button" onClick={handleClose} style={btnGhost}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main input screen ──────────────────────────────────────────────────────

  return (
    <div
      ref={overlayRef}
      style={overlay}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Brain Dump — safe space to vent"
    >
      <div style={modal}>
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.25rem 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                color: "#1d9e75",
                textTransform: "uppercase",
                marginBottom: "0.25rem",
              }}
            >
              Phase 5 · Brain Dump
            </p>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#13251d", margin: 0 }}>
              This space is yours.
            </h2>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#5d675f", marginTop: "0.35rem", lineHeight: 1.6 }}>
              No judgement. No evaluation. Type or speak freely — whatever is on your mind.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "#8a8174", flexShrink: 0 }}
            aria-label="Close brain dump"
          >
            <X style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>
        </div>

        <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
          {/* Privacy notice */}
          <div
            style={{
              background: "#f7f4ee",
              border: "1px solid #dcd5c7",
              borderRadius: "0.5rem",
              padding: "0.625rem 0.875rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CheckCircle2 style={{ width: "0.85rem", height: "0.85rem", color: "#1d9e75", flexShrink: 0 }} />
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#5d675f", margin: 0 }}>
              Private &amp; voluntary. Your words are never shared with third parties.
            </p>
          </div>

          {/* Textarea */}
          <div style={{ position: "relative" }}>
            <textarea
              ref={textareaRef}
              id="brain-dump-textarea"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={placeholder}
              disabled={modalState.phase === "submitting"}
              rows={7}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "0.875rem 1rem",
                border: "1.5px solid #dcd5c7",
                borderRadius: "0.625rem",
                background: "#fdfaf3",
                color: "#13251d",
                fontSize: "0.9rem",
                fontWeight: 600,
                lineHeight: 1.7,
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#13251d"; }}
              onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#dcd5c7"; }}
              aria-label="Write your thoughts here"
            />
          </div>

          {/* Char count + voice */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: remaining < 200 ? "#c45f1a" : "#a09880",
              }}
            >
              {remaining} characters remaining
            </p>
            {hasSpeechSupport && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={modalState.phase === "submitting"}
                title={isListening ? "Stop voice input" : "Speak your thoughts"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.75rem",
                  background: isListening ? "#fff0e5" : "#f7f4ee",
                  border: `1px solid ${isListening ? "#f5c08a" : "#dcd5c7"}`,
                  borderRadius: "2rem",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  color: isListening ? "#c45f1a" : "#5d675f",
                  transition: "all 0.15s",
                }}
                aria-pressed={isListening}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? (
                  <>
                    <MicOff style={{ width: "0.85rem", height: "0.85rem" }} />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic style={{ width: "0.85rem", height: "0.85rem" }} />
                    Speak
                  </>
                )}
              </button>
            )}
          </div>

          {/* Error */}
          {modalState.phase === "error" && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                padding: "0.75rem",
                background: "#fff4f4",
                border: "1px solid #f5c6c6",
                borderRadius: "0.5rem",
                marginBottom: "0.875rem",
              }}
            >
              <AlertCircle style={{ width: "1rem", height: "1rem", color: "#be4444", flexShrink: 0, marginTop: "0.1rem" }} />
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#7a2020", margin: 0 }}>
                {modalState.message}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            id="brain-dump-submit"
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              ...btnPrimary,
              width: "100%",
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {modalState.phase === "submitting" ? (
              <>
                <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                Reading your words…
              </>
            ) : (
              <>
                <Send style={{ width: "1rem", height: "1rem" }} />
                Send &amp; receive support
              </>
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 600, color: "#a09880", marginTop: "0.75rem" }}>
            You can also close this anytime — no obligation to submit.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
