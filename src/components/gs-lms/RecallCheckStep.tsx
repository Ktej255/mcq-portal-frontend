"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, CheckCircle2, XCircle, RefreshCw, Keyboard } from 'lucide-react';
// Web Speech API used instead of useAudioRecorder for live transcription
import { funnelService, RecallCheckOut } from '@/services/api/funnelService';

/**
 * RecallCheckStep — Audio recording + STT + scoring display.
 * Presents the speech recording UI, handles transcription, displays results.
 *
 * Requirements: 5.1, 5.2, 5.5, 5.6, 5.7, 5.9
 */

interface RecallCheckStepProps {
  nodeId: number;
  sectionLabel: string;
  subject?: string;
  onComplete: () => void;
}

type RecallMode = 'prompt' | 'recording' | 'processing' | 'result' | 'text-fallback';

export function RecallCheckStep({
  nodeId,
  sectionLabel,
  subject = "geography",
  onComplete,
}: RecallCheckStepProps) {
  const [mode, setMode] = useState<RecallMode>('prompt');
  const [result, setResult] = useState<RecallCheckOut | null>(null);
  const [textInput, setTextInput] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // textRef holds the current live text shown in the textarea
  const textRef = useRef('');
  // accumulatedTextRef holds the text completed in previous segments/sessions
  const accumulatedTextRef = useRef('');

  // Web Speech API for live transcription
  const startLiveTranscription = useCallback((isRestart = false) => {
    setSubmitError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSubmitError('Speech recognition not supported in this browser. Please type instead.');
      setMode('text-fallback');
      return;
    }

    // Clean up any existing instance first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    if (!isRestart) {
      textRef.current = '';
      accumulatedTextRef.current = '';
      setTextInput('');
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';

    rec.onresult = (e: any) => {
      let sessionText = '';
      for (let i = 0; i < e.results.length; i++) {
        sessionText += e.results[i][0].transcript;
        if (e.results[i].isFinal) sessionText += ' ';
      }
      // Combine accumulated text from previous sessions with current session text
      const fullText = accumulatedTextRef.current + sessionText;
      textRef.current = fullText;
      setTextInput(fullText);
    };

    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error);
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      // Auto-restart to keep listening (SpeechRecognition instances cannot be restarted once stopped)
      if (recognitionRef.current === rec) {
        accumulatedTextRef.current = textRef.current;
        startLiveTranscription(true);
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
      setMode('text-fallback'); // Show the textarea
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSubmitError('Could not start speech recognition. Check microphone permissions.');
      setMode('text-fallback');
      setIsListening(false);
    }
  }, []);

  const stopLiveTranscription = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null; // Prevent auto-restart in onend
      try { rec.stop(); } catch {}
    }
    setIsListening(false);
    setTextInput(textRef.current); // Ensure final text is captured
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null; // Clear handler to prevent restarts
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handleTextSubmit = useCallback(async () => {
    if (!textInput.trim() || textInput.length < 5) {
      setSubmitError('Please enter at least 5 characters of what you recall.');
      return;
    }

    setMode('processing');
    setSubmitError(null);

    try {
      const res = await funnelService.submitRecallText(subject, nodeId, sectionLabel, textInput);
      setResult(res);
      setMode('result');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail) {
        setSubmitError(detail);
      } else {
        setSubmitError('Failed to submit recall. Please try again.');
      }
      setMode('text-fallback');
    }
  }, [textInput, subject, nodeId, sectionLabel]);

  const handleRetry = useCallback(() => {
    if (retryCount >= 3) {
      setSubmitError('Maximum retries reached. Please type your recall instead.');
      setMode('text-fallback');
      return;
    }
    setRetryCount((prev) => prev + 1);
    setResult(null);
    setMode('prompt');
  }, [retryCount]);

  return (
    <div className="rounded-2xl border border-[#b9d9cd] bg-[#fffdf8] p-6 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-sm font-black text-[#1a3a2a]">Recall Check</h3>
        <p className="text-xs text-[#49675e] mt-1">
          Speak or type what you remember from the {sectionLabel.replace('_', ' ')} section
        </p>
      </div>

      {/* Prompt State */}
      {mode === 'prompt' && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={startLiveTranscription}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black shadow-md hover:scale-105 transition-transform"
          >
            <Mic className="h-4 w-4" />
            Start Speaking (Live Transcription)
          </button>
          <button
            onClick={() => setMode('text-fallback')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#49675e] hover:text-[#1d9e75]"
          >
            <Keyboard className="h-3 w-3" />
            Type instead
          </button>
        </div>
      )}

      {/* Processing State */}
      {mode === 'processing' && (
        <div className="flex flex-col items-center gap-2 py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <RefreshCw className="h-6 w-6 text-[#1d9e75]" />
          </motion.div>
          <p className="text-xs text-[#49675e]">Scoring your recall...</p>
        </div>
      )}

      {/* Text Fallback (also used for live speech-to-text) */}
      {mode === 'text-fallback' && (
        <div className="space-y-3">
          {isListening && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-red-700">Listening... speak now</span>
              </div>
              <button onClick={stopLiveTranscription} className="text-xs font-black text-red-600 px-2 py-1 rounded bg-red-100">
                Stop
              </button>
            </div>
          )}
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type what you remember OR click 'Start Speaking' above for voice input..."
            className="w-full h-32 rounded-xl border border-[#b9d9cd] bg-white p-3 text-sm text-[#1f2e26] resize-none focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30"
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#49675e]">{textInput.length} chars</span>
              {!isListening && (
                <button
                  onClick={startLiveTranscription}
                  className="flex items-center gap-1 text-[10px] font-black text-[#1d9e75]"
                >
                  <Mic className="h-3 w-3" /> Speak more
                </button>
              )}
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={textInput.length < 5}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black disabled:opacity-50"
            >
              Submit Recall
            </button>
          </div>
          {submitError && <p className="text-xs text-red-600">{submitError}</p>}
        </div>
      )}

      {/* Result State */}
      {mode === 'result' && result && (
        <div className="space-y-4">
          {/* Score Display */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-[#1d9e75]">{result.recall_score}%</div>
              <div className="text-[10px] text-[#49675e]">Recall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-[#085041]">{result.confidence_score}%</div>
              <div className="text-[10px] text-[#49675e]">Confidence</div>
            </div>
          </div>

          {/* Concept List */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-[#49675e] uppercase">
              {result.matched_count}/{result.total_concepts} concepts recalled
            </p>
            {result.concepts.map((concept, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {concept.matched ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#1d9e75] flex-shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                )}
                <span className={concept.matched ? 'text-[#085041]' : 'text-[#5d675f]'}>
                  {concept.concept}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center pt-2">
            {retryCount < 3 && (
              <button
                onClick={handleRetry}
                className="px-3 py-1.5 rounded-lg border border-[#b9d9cd] text-xs font-semibold text-[#49675e]"
              >
                Retry
              </button>
            )}
            <button
              onClick={onComplete}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black"
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecallCheckStep;
