"use client";

import React, { useEffect, useRef, useState } from "react";

interface Message {
  role: "assistant" | "user";
  content: string;
  suggestCta?: boolean;
}

interface AIChatProps {
  sessionId: string;
  starters: string[];
  onLeadCapture: (leadId: string) => void;
}

export function AIChat({ sessionId, starters, onLeadCapture }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Capture Form State
  const [showCaptureCard, setShowCaptureCard] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [captureLoading, setCaptureLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Show first starter message
    const initialStarter = starters && starters.length > 0
      ? starters[0]
      : "Welcome! Let me know if you have any questions about this strategy.";
    
    setMessages([
      {
        role: "assistant",
        content: initialStarter,
      },
    ]);
  }, [starters]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showCaptureCard]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/vsl/public/sessions/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          suggestCta: data.structured?.suggest_cta,
        },
      ]);

      // If AI suggests CTA and we haven't captured lead yet, prompt for lead details
      if (data.structured?.suggest_cta && !leadCaptured) {
        setShowCaptureCard(true);
      }
    } catch (err) {
      console.error("AI_CHAT | Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an issue processing that. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || captureLoading) return;

    setCaptureLoading(true);
    try {
      const response = await fetch(`/api/v1/vsl/public/sessions/${sessionId}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, name }),
      });

      if (!response.ok) throw new Error("Failed to capture lead details");

      const data = await response.json();
      setLeadCaptured(true);
      setShowCaptureCard(false);
      onLeadCapture(data.lead_id);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Excellent! Your details are confirmed. We will reach out with follow-up updates.",
        },
      ]);
    } catch (err) {
      console.error("AI_CHAT | Lead capture error:", err);
    } finally {
      setCaptureLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-semibold text-slate-200">AI Admissions Assistant</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/15"
                  : "bg-slate-800/80 text-slate-200 border border-slate-750 rounded-bl-none"
              }`}
            >
              <p>{msg.content}</p>
              {msg.suggestCta && !leadCaptured && (
                <button
                  onClick={() => setShowCaptureCard(true)}
                  className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium rounded-lg text-xs transition-all shadow-md shadow-indigo-500/10 active:scale-95 cursor-pointer"
                >
                  Unveil Cutoff Blueprint
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Lead Capture Card */}
        {showCaptureCard && !leadCaptured && (
          <div className="flex justify-start">
            <div className="w-full max-w-[95%] rounded-2xl p-4 bg-slate-950 border border-indigo-500/35 shadow-lg shadow-indigo-950/30">
              <h4 className="text-sm font-semibold text-slate-100 mb-1">Claim Free UPSC Prep Kit</h4>
              <p className="text-xs text-slate-400 mb-3">Please fill out your details to download the kits and blueprints instantly.</p>
              
              <form onSubmit={handleCaptureLead} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="WhatsApp Number (Optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full py-1.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={captureLoading}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {captureLoading ? "Submitting..." : "Get Access Now"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCaptureCard(false)}
                    className="py-1.5 px-3 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl p-3 bg-slate-800/40 border border-slate-800/80 rounded-bl-none flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/20 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about the video..."
          className="flex-1 py-2 px-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current transform rotate-90" viewBox="0 0 24 24">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
