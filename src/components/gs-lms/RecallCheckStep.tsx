"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, CheckCircle2, XCircle, RefreshCw, Keyboard } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
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

  const { isRecording, duration, startRecording, stopRecording, error: audioError, isSupported } = useAudioRecorder({
    maxDuration: 180,
    minDuration: 5,
  });

  const handleStartRecording = useCallback(async () => {
    setSubmitError(null);
    await startRecording();
    setMode('recording');
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob) return;

    setMode('processing');

    try {
      // Upload audio blob to backend for STT transcription + scoring
      const formData = new FormData();
      formData.append('audio', blob, 'recall.webm');
      formData.append('section_label', sectionLabel);

      const response = await fetch(`/api/v1/gs-lms/${subject}/funnel/${nodeId}/recall/audio`, {
        method: 'POST',
        body: formData,
        headers: {
          // Auth header will be injected by the API interceptor if using apiClient
          // For direct fetch, we rely on cookies or manual token
        },
      });

      if (!response.ok) {
        throw new Error('Audio transcription failed');
      }

      const data = await response.json();
      const res = (data.data || data) as RecallCheckOut;
      setResult(res);

      // Check STT confidence — if low, allow re-record or text fallback
      if (res.stt_confidence !== null && res.stt_confidence < 0.6) {
        setSubmitError('Low transcription confidence. You can re-record or type your recall instead.');
        setMode('text-fallback');
      } else {
        setMode('result');
      }
    } catch {
      // Fallback to text input on audio upload failure
      setSubmitError('Audio processing failed. Please type your recall instead.');
      setMode('text-fallback');
    }
  }, [stopRecording, subject, nodeId, sectionLabel]);

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
    } catch (err) {
      setSubmitError('Failed to submit recall. Please try again.');
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
          {isSupported ? (
            <button
              onClick={handleStartRecording}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black shadow-md hover:scale-105 transition-transform"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </button>
          ) : null}
          <button
            onClick={() => setMode('text-fallback')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#49675e] hover:text-[#1d9e75]"
          >
            <Keyboard className="h-3 w-3" />
            Type instead
          </button>
          {audioError && (
            <p className="text-xs text-red-600 text-center">{audioError}</p>
          )}
        </div>
      )}

      {/* Recording State */}
      {mode === 'recording' && (
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"
          >
            <Mic className="h-6 w-6 text-red-600" />
          </motion.div>
          <p className="text-sm font-black text-[#1a3a2a]">{duration}s</p>
          <p className="text-[10px] text-[#49675e]">Min 5s • Max 180s</p>
          <button
            onClick={handleStopRecording}
            disabled={duration < 5}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-black disabled:opacity-50"
          >
            Stop Recording
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

      {/* Text Fallback */}
      {mode === 'text-fallback' && (
        <div className="space-y-3">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type what you remember from this section..."
            className="w-full h-32 rounded-xl border border-[#b9d9cd] bg-white p-3 text-sm text-[#1f2e26] resize-none focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30"
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#49675e]">{textInput.length} chars</span>
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
