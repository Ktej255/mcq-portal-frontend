"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, CheckCircle2, XCircle, RefreshCw, ArrowRight } from 'lucide-react';
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
  /** Hide "Continue without recall" (the server rejects it when progression is enforced). */
  onComplete: () => void;
}

type RecallMode = 'loading' | 'prompt' | 'recording' | 'processing' | 'result' | 'text-fallback';

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: {
    0: SpeechRecognitionResultLike;
    isFinal: boolean;
  };
};

type SpeechRecognitionResultEventLike = {
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type ApiErrorLike = {
  status?: number;
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      detail?: string;
      message?: string;
    };
  };
};

const MAX_RECALL_RETRIES = 3;
const RETRYABLE_SUBMISSION_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_NETWORK_CODES = new Set(['ECONNABORTED', 'ERR_NETWORK', 'ETIMEDOUT']);

function getApiError(error: unknown): ApiErrorLike {
  return typeof error === 'object' && error !== null ? error as ApiErrorLike : {};
}

function getApiErrorDetail(error: unknown): string | undefined {
  const apiError = getApiError(error);
  return apiError.response?.data?.detail || apiError.response?.data?.message;
}

function isRetryableSubmissionError(error: unknown): boolean {
  const apiError = getApiError(error);
  const status = apiError.response?.status ?? apiError.status;
  if (status != null) return RETRYABLE_SUBMISSION_STATUSES.has(status);
  if (apiError.code && RETRYABLE_NETWORK_CODES.has(apiError.code)) return true;

  const message = apiError.message || (error instanceof Error ? error.message : '');
  return /network|timed out|timeout|failed to fetch/i.test(message);
}

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
  const [submissionRetryCount, setSubmissionRetryCount] = useState(0);
  const [canRetrySubmission, setCanRetrySubmission] = useState(false);
  const [submissionUnavailable, setSubmissionUnavailable] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const submissionInFlightRef = useRef(false);
  const startLiveTranscriptionRef = useRef<((isRestart?: boolean) => void) | null>(null);
  
  // textRef holds the current live text shown in the textarea
  const textRef = useRef('');
  // accumulatedTextRef holds the text completed in previous segments/sessions
  const accumulatedTextRef = useRef('');

  // Restore the latest persisted attempt so refresh does not reset a completed
  // recall back to the prompt. A 404 means this is a first attempt; other
  // failures remain visible as a retryable error without fabricating a result.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setMode('loading');
      setResult(null);
      setTextInput('');
      setRetryCount(0);
      setSubmissionRetryCount(0);
      setCanRetrySubmission(false);
      setSubmissionUnavailable(false);
      setSubmitError(null);
      textRef.current = '';
      accumulatedTextRef.current = '';
    });

    funnelService
      .getRecallAttempt(subject, nodeId, sectionLabel)
      .then((res) => {
        if (!active) return;
        setResult(res);
        setMode('result');
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (getApiError(err).response?.status !== 404) {
          setSubmitError('Could not restore the previous recall. You can retry or start again.');
        }
        setMode('prompt');
      });

    return () => {
      active = false;
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      if (rec) {
        try {
          rec.onend = null;
          rec.abort();
        } catch {}
      }
    };
  }, [nodeId, sectionLabel, subject]);

  const handleContinueWithoutRecall = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try { rec.stop(); } catch {}
    }
    setIsListening(false);
    setTextInput(textRef.current);
    setCanRetrySubmission(false);
    setSubmitError('A recall response is required to continue. Please type what you remember.');
    setMode('text-fallback');
  }, []);

  // Web Speech API for live transcription
  const startLiveTranscription = useCallback((isRestart = false) => {
    setSubmitError(null);
    setCanRetrySubmission(false);
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSubmitError('Speech recognition not supported in this browser. Please type instead.');
      setMode('text-fallback');
      return;
    }

    // Clean up any existing instance first. Clearing the reference prevents its
    // onend handler from starting another session while this one is created.
    if (recognitionRef.current) {
      const previous = recognitionRef.current;
      recognitionRef.current = null;
      try { previous.abort(); } catch {}
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

    rec.onresult = (e: SpeechRecognitionResultEventLike) => {
      let sessionText = '';
      for (let i = 0; i < e.results.length; i++) {
        sessionText += e.results[i][0].transcript;
        if (e.results[i].isFinal) sessionText += ' ';
      }
      // Combine accumulated text from previous sessions with current session text
      const fullText = accumulatedTextRef.current + sessionText;
      textRef.current = fullText;
      setTextInput(() => fullText);
    };

    rec.onerror = (e: SpeechRecognitionErrorEventLike) => {
      const error = e?.error;
      console.error('Speech recognition error:', error);

      // Every error ends this recognition attempt. In particular, terminal
      // permission/device/provider errors must not be eligible for onend restart.
      if (recognitionRef.current !== rec) return;
      recognitionRef.current = null;
      setIsListening(false);
      setTextInput(textRef.current);
      setMode('text-fallback');

      if (error === 'aborted') {
        setSubmitError('Voice input was stopped. Any captured text is preserved; you can continue typing or try again.');
      } else if (error === 'network') {
        setSubmitError('Voice input requires internet connection to Google services. Any captured text is preserved; please type your recall instead or try again.');
      } else if (error === 'not-allowed' || error === 'service-not-allowed') {
        setSubmitError('Microphone permission was denied. Any captured text is preserved; please type your recall instead or enable microphone access and try again.');
      } else if (error === 'audio-capture') {
        setSubmitError('No usable microphone was found. Any captured text is preserved; please type your recall instead or check your microphone.');
      } else if (error === 'no-speech') {
        setSubmitError('No speech was detected. Any captured text is preserved; you can type your recall or try speaking again.');
      } else {
        setSubmitError('Voice input stopped unexpectedly. Any captured text is preserved; please type your recall instead or try again.');
      }
    };

    rec.onend = () => {
      // A natural end can restart the continuous transcription session. Any
      // speech error clears recognitionRef, so terminal/error paths cannot loop.
      if (recognitionRef.current === rec) {
        setTimeout(() => {
          if (recognitionRef.current === rec) {
            accumulatedTextRef.current = textRef.current;
            startLiveTranscriptionRef.current?.(true);
          }
        }, 500);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
      setMode('text-fallback'); // Show the textarea
    } catch (err: unknown) {
      recognitionRef.current = null;
      console.error('Failed to start speech recognition:', err);
      setSubmitError('Could not start speech recognition. Check microphone permissions.');
      setMode('text-fallback');
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    startLiveTranscriptionRef.current = startLiveTranscription;
    return () => {
      startLiveTranscriptionRef.current = null;
    };
  }, [startLiveTranscription]);

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
        const rec = recognitionRef.current;
        recognitionRef.current = null;
        try {
          rec.onend = null; // Clear handler to prevent restarts
          rec.abort();
        } catch {}
      }
    };
  }, []);

  const submitText = useCallback(async (text: string, retryNumber: number) => {
    if (submissionInFlightRef.current) return;
    submissionInFlightRef.current = true;
    setMode('processing');
    setSubmitError(null);
    setCanRetrySubmission(false);

    try {
      const res = await funnelService.submitRecallText(subject, nodeId, sectionLabel, text);
      setResult(res);
      setSubmissionUnavailable(false);
      setMode('result');
    } catch (err: unknown) {
      const detail = getApiErrorDetail(err);
      const retryable = isRetryableSubmissionError(err);
      const reachedRetryCap = retryable && retryNumber >= MAX_RECALL_RETRIES;

      if (reachedRetryCap) {
        setSubmissionUnavailable(true);
        setCanRetrySubmission(false);
        setSubmitError(`Recall submission is still unavailable after ${MAX_RECALL_RETRIES} retries. Your text is preserved; please try again later.`);
      } else if (detail) {
        setSubmitError(detail);
        setCanRetrySubmission(retryable);
      } else {
        setSubmitError(
          retryable
            ? 'Failed to submit recall. You can retry the submission or keep editing your text.'
            : 'Recall could not be submitted. Please review your response and try again.'
        );
        setCanRetrySubmission(retryable);
      }
      setMode('text-fallback');
    } finally {
      submissionInFlightRef.current = false;
    }
  }, [subject, nodeId, sectionLabel]);

  const getCurrentSubmissionText = useCallback(() => {
    const currentText = textRef.current || textInput;
    return currentText.trim();
  }, [textInput]);

  const handleTextSubmit = useCallback(() => {
    if (submissionInFlightRef.current) return;
    const submittedText = getCurrentSubmissionText();
    if (submittedText.length < 5) {
      setSubmitError('Please enter at least 5 characters of what you recall.');
      setCanRetrySubmission(false);
      return;
    }
    if (submissionUnavailable) return;

    const retryNumber = canRetrySubmission ? submissionRetryCount + 1 : 0;
    if (retryNumber > MAX_RECALL_RETRIES) {
      setSubmissionUnavailable(true);
      setCanRetrySubmission(false);
      setSubmitError(`Recall submission is still unavailable after ${MAX_RECALL_RETRIES} retries. Your text is preserved; please try again later.`);
      return;
    }
    if (retryNumber > 0) setSubmissionRetryCount(retryNumber);
    void submitText(submittedText, retryNumber);
  }, [getCurrentSubmissionText, submissionUnavailable, canRetrySubmission, submissionRetryCount, submitText]);

  const handleRetrySubmission = useCallback(() => {
    if (submissionInFlightRef.current || submissionUnavailable || !canRetrySubmission) return;
    const submittedText = getCurrentSubmissionText();
    if (submittedText.length < 5) {
      setCanRetrySubmission(false);
      setSubmitError('Please enter at least 5 characters of what you recall before retrying.');
      return;
    }

    const retryNumber = submissionRetryCount + 1;
    if (retryNumber > MAX_RECALL_RETRIES) {
      setSubmissionUnavailable(true);
      setCanRetrySubmission(false);
      setSubmitError(`Recall submission is still unavailable after ${MAX_RECALL_RETRIES} retries. Your text is preserved; please try again later.`);
      return;
    }
    setSubmissionRetryCount(retryNumber);
    void submitText(submittedText, retryNumber);
  }, [getCurrentSubmissionText, submissionUnavailable, canRetrySubmission, submissionRetryCount, submitText]);

  const handleRetry = useCallback(() => {
    if (retryCount >= MAX_RECALL_RETRIES) {
      setSubmitError(`Maximum recall attempts reached. Your previous response remains saved; type a new response only if submission is available.`);
      setCanRetrySubmission(false);
      setMode('text-fallback');
      return;
    }
    setRetryCount((prev) => prev + 1);
    setSubmissionRetryCount(0);
    setCanRetrySubmission(false);
    setSubmissionUnavailable(false);
    setResult(null);
    setSubmitError(null);
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

      {/* Restore State */}
      {mode === 'loading' && (
        <div className="flex flex-col items-center gap-2 py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-[#1d9e75]" />
          <p className="text-xs text-[#49675e]">Restoring your latest recall...</p>
        </div>
      )}

      {mode === 'prompt' && submitError && (
        <p className="text-xs text-red-600">{submitError}</p>
      )}

      {/* Prompt State */}
      {mode === 'prompt' && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => startLiveTranscription()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black shadow-md hover:scale-105 transition-transform"
          >
            <Mic className="h-4 w-4" />
            Start Speaking (Live Transcription)
          </button>

          {/* Voice typing instructions */}
          <div className="rounded-lg bg-[#e7f5ee] border border-[#b9d9cd] p-3 text-center max-w-sm">
            <p className="text-[10px] font-black text-[#085041] uppercase mb-1">💡 Voice Typing Tip</p>
            <p className="text-[10px] text-[#49675e] leading-relaxed">
              <strong>Laptop:</strong> Click the text box below, then press <kbd className="px-1 py-0.5 bg-white rounded border border-[#b9d9cd] font-mono text-[9px]">Win + H</kbd> to activate Windows dictation<br/>
              <strong>Phone:</strong> Tap the text box and use your keyboard&apos;s 🎤 mic button
            </p>
          </div>

          <button
            onClick={handleContinueWithoutRecall}
            className="flex items-center gap-1.5 rounded-lg border border-[#b9d9cd] bg-white px-3 py-2 text-xs font-black text-[#1a3a2a] hover:border-[#1d9e75] hover:text-[#1d9e75]"
          >
            Type your recall instead
            <ArrowRight className="h-3 w-3" />
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
                {textInput.length > 0 && <span className="text-[10px] text-green-600">({textInput.length} chars received)</span>}
              </div>
              <button onClick={stopLiveTranscription} className="text-xs font-black text-red-600 px-2 py-1 rounded bg-red-100">
                Stop
              </button>
            </div>
          )}

          {/* Voice typing hint — always visible in text mode */}
          {!isListening && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#e7f5ee] border border-[#b9d9cd]">
              <Mic className="h-3.5 w-3.5 text-[#1d9e75]" />
              <p className="text-[10px] text-[#49675e]">
                <strong>Voice type:</strong> Click below, then <kbd className="px-1 py-0.5 bg-white rounded border text-[9px] font-mono">Win+H</kbd> (laptop) or 🎤 button (phone)
              </p>
            </div>
          )}

          <textarea
            value={textInput}
            onChange={(e) => {
              const value = e.target.value;
              textRef.current = value;
              setTextInput(value);
            }}
            placeholder="Click here and speak using Win+H (Windows) or tap the mic on your phone keyboard..."
            className="w-full h-32 rounded-xl border border-[#b9d9cd] bg-white p-3 text-sm text-[#1f2e26] resize-none focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#49675e]">{textInput.length} chars</span>
              {!isListening && (
                <button
                  onClick={() => startLiveTranscription()}
                  className="flex items-center gap-1 text-[10px] font-black text-[#1d9e75]"
                >
                  <Mic className="h-3 w-3" /> Speak more
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleTextSubmit}
                disabled={isListening || textInput.length < 5 || submissionUnavailable}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-xs font-black disabled:opacity-50"
              >
                Submit Recall
              </button>
            </div>
          </div>
          {submitError && (
            <div className="space-y-2">
              <p className="text-xs text-red-600">{submitError}</p>
              {canRetrySubmission && !submissionUnavailable && (
                <button
                  onClick={handleRetrySubmission}
                  className="flex items-center gap-1.5 text-xs font-black text-[#1d9e75] hover:text-[#085041]"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry submission ({submissionRetryCount + 1}/{MAX_RECALL_RETRIES})
                </button>
              )}
            </div>
          )}
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
            {retryCount <= MAX_RECALL_RETRIES && (
              <button
                onClick={handleRetry}
                className="px-3 py-1.5 rounded-lg border border-[#b9d9cd] text-xs font-semibold text-[#49675e]"
              >
                {retryCount === MAX_RECALL_RETRIES ? 'Start typed retry' : 'Retry'}
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
