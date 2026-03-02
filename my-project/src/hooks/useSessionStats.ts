'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ErrorItem {
  original: string;
  correction: string;
  type: 'grammar' | 'spelling' | 'punctuation' | 'word_choice';
  explanation: string;
}

export interface SessionStatsData {
  totalRecordingMs: number;
  userMessageCount: number;
  assistantMessageCount: number;
  totalErrors: number;
  errorsList: ErrorItem[];
  errorTypes: {
    grammar: number;
    spelling: number;
    punctuation: number;
    word_choice: number;
  };
  totalWordsSpoken: number;
}

const initialState: SessionStatsData = {
  totalRecordingMs: 0,
  userMessageCount: 0,
  assistantMessageCount: 0,
  totalErrors: 0,
  errorsList: [],
  errorTypes: {
    grammar: 0,
    spelling: 0,
    punctuation: 0,
    word_choice: 0,
  },
  totalWordsSpoken: 0,
};

export function useSessionStats() {
  const [stats, setStats] = useState<SessionStatsData>(initialState);
  const statsRef = useRef(stats);
  
  // Update ref when stats change (in effect, not during render)
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const addRecordingDuration = useCallback((ms: number) => {
    setStats(prev => ({
      ...prev,
      totalRecordingMs: prev.totalRecordingMs + ms,
    }));
  }, []);

  const addUserMessage = useCallback((wordCount: number) => {
    setStats(prev => ({
      ...prev,
      userMessageCount: prev.userMessageCount + 1,
      totalWordsSpoken: prev.totalWordsSpoken + wordCount,
    }));
  }, []);

  const addAssistantMessage = useCallback(() => {
    setStats(prev => ({
      ...prev,
      assistantMessageCount: prev.assistantMessageCount + 1,
    }));
  }, []);

  const addErrors = useCallback((errors: ErrorItem[], wordCount: number) => {
    setStats(prev => {
      const newErrorTypes = { ...prev.errorTypes };
      errors.forEach(error => {
        const type = error.type as keyof typeof newErrorTypes;
        if (type in newErrorTypes) {
          newErrorTypes[type]++;
        }
      });

      return {
        ...prev,
        totalErrors: prev.totalErrors + errors.length,
        errorsList: [...prev.errorsList, ...errors],
        errorTypes: newErrorTypes,
      };
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats(initialState);
  }, []);

  const getStatsForSummary = useCallback(() => {
    const s = statsRef.current;
    const speakingMinutes = s.totalRecordingMs / 60000;
    
    console.log('[getStatsForSummary] Current stats:', {
      totalErrors: s.totalErrors,
      errorsList: s.errorsList.length,
      errorTypes: s.errorTypes,
    });
    
    // Calculate score: 100 - (errors × 10) + (minutes × 2, max 20 bonus)
    let score = 100;
    const errorPenalty = s.totalErrors * 10;
    score -= errorPenalty;
    const timeBonus = Math.min(Math.floor(speakingMinutes) * 2, 20);
    score += timeBonus;
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Find dominant error type
    const errorTypeEntries = Object.entries(s.errorTypes) as [keyof typeof s.errorTypes, number][];
    const dominantErrorType = errorTypeEntries.reduce(
      (max, [type, count]) => (count > max[1] ? [type, count] : max),
      ['grammar' as string, 0] as [string, number]
    );

    // Group errors by original text to find most common
    const errorCounts = new Map<string, { error: ErrorItem; count: number }>();
    s.errorsList.forEach(error => {
      const key = `${error.original}|${error.correction}`;
      const existing = errorCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorCounts.set(key, { error, count: 1 });
      }
    });

    // Sort by count and get top errors
    const mostCommonErrors = Array.from(errorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ error, count }) => ({
        original: error.original,
        correction: error.correction,
        type: error.type,
        explanation: error.explanation,
        count,
      }));

    console.log('[getStatsForSummary] Calculated:', {
      score,
      mostCommonErrors: mostCommonErrors.length,
      dominantErrorType,
    });

    return {
      speakingMinutes,
      userMessageCount: s.userMessageCount,
      totalErrors: s.totalErrors,
      errorsPerMinute: speakingMinutes > 0 ? s.totalErrors / speakingMinutes : 0,
      errorTypes: s.errorTypes,
      totalWordsSpoken: s.totalWordsSpoken,
      mostCommonErrors,
      dominantErrorType,
      errorsList: s.errorsList,
      calculatedScore: score,
    };
  }, []);

  return {
    stats,
    addRecordingDuration,
    addUserMessage,
    addAssistantMessage,
    addErrors,
    resetStats,
    getStatsForSummary,
  };
}
