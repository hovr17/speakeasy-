'use client';

import { useState, useRef, useCallback } from 'react';

const MAX_RECORDING_DURATION = 60000; // 60 seconds max
const WARNING_DURATION = 45000; // Show warning at 45 seconds

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop recording
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });
      
      streamRef.current = stream;
      
      // Try different codecs for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // Check if blob is too small (likely empty recording)
        if (blob.size < 1000) {
          setError('Recording too short. Please speak longer.');
          setAudioBlob(null);
        } else {
          setAudioBlob(blob);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred. Please try again.');
        setIsRecording(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer to track duration
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1000;
          
          // Auto-stop at max duration
          if (newDuration >= MAX_RECORDING_DURATION) {
            // Stop directly here to avoid circular dependency
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setIsRecording(false);
          }
          
          return newDuration;
        });
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      } else {
        setError('Could not access microphone. Please check permissions.');
      }
      
      throw err;
    }
  }, []);

  const resetAudio = useCallback(() => {
    setAudioBlob(null);
    chunksRef.current = [];
    setRecordingDuration(0);
    setError(null);
  }, []);

  const isNearLimit = recordingDuration >= WARNING_DURATION;
  const remainingTime = Math.max(0, MAX_RECORDING_DURATION - recordingDuration);

  return {
    isRecording,
    audioBlob,
    error,
    recordingDuration,
    isNearLimit,
    remainingTime,
    maxDuration: MAX_RECORDING_DURATION,
    startRecording,
    stopRecording,
    resetAudio,
    clearError: () => setError(null),
  };
}
