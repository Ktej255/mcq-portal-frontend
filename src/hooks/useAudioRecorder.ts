"use client";

import { useState, useRef, useCallback } from 'react';

/**
 * Hook wrapping the browser MediaRecorder API for speech recall recording.
 * Enforces min 5s / max 180s duration bounds. Returns a Blob on stop.
 *
 * Requirements: 5.2, 5.7
 */

interface UseAudioRecorderOptions {
  maxDuration?: number;   // default 180s
  minDuration?: number;   // default 5s
  mimeType?: string;      // default 'audio/webm;codecs=opus'
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
  isSupported: boolean;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const {
    maxDuration = 180,
    minDuration = 5,
    mimeType = 'audio/webm;codecs=opus',
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const isSupported = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    setIsRecording(false);
    setDuration(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser');
      return;
    }

    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });

        if (resolveRef.current) {
          resolveRef.current(blob);
          resolveRef.current = null;
        }

        cleanup();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect data every second
      setIsRecording(true);
      setDuration(0);

      // Duration counter
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Auto-stop at max duration
      maxTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, maxDuration * 1000);

    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please allow microphone access to record your recall.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone to record your recall.');
        } else {
          setError(`Recording failed: ${err.message}`);
        }
      } else {
        setError('Failed to start recording');
      }
    }
  }, [isSupported, mimeType, maxDuration, cleanup]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      return null;
    }

    if (duration < minDuration) {
      setError(`Recording must be at least ${minDuration} seconds. Current: ${duration}s`);
      return null;
    }

    return new Promise<Blob | null>((resolve) => {
      resolveRef.current = resolve;
      mediaRecorderRef.current!.stop();
    });
  }, [duration, minDuration]);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    error,
    isSupported,
  };
}
