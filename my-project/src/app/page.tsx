// SpeakEasy AI - v2
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Volume2, VolumeX, Moon, Sun, HelpCircle, Flag, Mic, AlertCircle, BookOpen, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useConversation } from '@/hooks/useConversation';
import { useSessionStats, ErrorItem } from '@/hooks/useSessionStats';
import { MessageBubble } from '@/components/speakeasy/MessageBubble';
import { VoiceButton } from '@/components/speakeasy/VoiceButton';
import { WelcomeMessage } from '@/components/speakeasy/WelcomeMessage';
import { TextInput } from '@/components/speakeasy/TextInput';
import { VoiceSelector } from '@/components/speakeasy/VoiceSelector';
import { SessionSummary } from '@/components/speakeasy/SessionSummary';
import { WordTooltip } from '@/components/speakeasy/WordTooltip';
import { DictionaryPanel } from '@/components/speakeasy/DictionaryPanel';
import { cn } from '@/lib/utils';

const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface TranslationResult {
  word: string;
  translation: string;
  transcription: string;
  definition: string;
  examples: string[];
}

export default function Home() {
  const [sessionId, setSessionId] = useState(generateSessionId());
  const { 
    isRecording, 
    audioBlob, 
    error: recordingError,
    recordingDuration,
    isNearLimit,
    remainingTime,
    maxDuration,
    startRecording, 
    stopRecording, 
    resetAudio,
    clearError,
  } = useAudioRecorder();
  const { messages, sendMessage, analyzeText, clearMessages } = useConversation(sessionId);
  const {
    stats: sessionStats,
    addRecordingDuration,
    addUserMessage,
    addAssistantMessage,
    addErrors,
    resetStats,
    getStatsForSummary,
  } = useSessionStats();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('xiaochen');
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hideAllText, setHideAllText] = useState(false);
  
  // Word selection & dictionary states
  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string;
    context: string;
    position: { x: number; y: number };
  } | null>(null);
  const [showDictionary, setShowDictionary] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastRecordingDurationRef = useRef<number>(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Store recording duration when recording stops
  useEffect(() => {
    if (isRecording && recordingDuration > 0) {
      lastRecordingDurationRef.current = recordingDuration;
    }
  }, [isRecording, recordingDuration]);

  useEffect(() => {
    if (audioBlob && !isRecording) {
      // Use the stored duration
      processAudio(audioBlob, lastRecordingDurationRef.current);
    }
  }, [audioBlob, isRecording]);

  useEffect(() => {
    if (recordingError) {
      setErrorMessage(recordingError);
    }
  }, [recordingError]);

  const playAudio = useCallback(async (text: string, messageId?: string) => {
    if (isMuted || !text) return;
    
    // Start TTS fetch immediately (don't wait for setState)
    const ttsPromise = fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: selectedVoice, speed: 1.0 }),
    });
    
    // Update state in parallel
    setIsPlaying(true);
    if (messageId) setCurrentPlayingId(messageId);
    
    try {
      const response = await ttsPromise;
      
      if (!response.ok) throw new Error('TTS request failed');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) audioRef.current.pause();
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
  }, [isMuted, selectedVoice]);

  const processAudio = async (blob: Blob, duration: number) => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    // Record speaking time
    addRecordingDuration(duration);
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        try {
          const asrResponse = await fetch('/api/asr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64 }),
          });
          
          const asrData = await asrResponse.json();
          
          if (asrData.success && asrData.text && asrData.text.trim()) {
            const text = asrData.text;
            const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
            
            // Record user message
            addUserMessage(wordCount);
            
            // Start TTS immediately when response arrives (before UI update)
            const result = await sendMessage(text, (response, assistantId) => {
              if (response) {
                playAudio(response, assistantId);
              }
            });
            
            // Record assistant message
            addAssistantMessage();
            
            // Analyze errors in parallel (non-blocking)
            analyzeText(text, result.userId).then(correctionResult => {
              console.log('[processAudio] Correction result received:', correctionResult);
              if (correctionResult && correctionResult.hasErrors && correctionResult.errors.length > 0) {
                console.log('[processAudio] Adding errors to stats:', correctionResult.errors);
                addErrors(correctionResult.errors as ErrorItem[], wordCount);
              } else {
                console.log('[processAudio] No errors to add');
              }
            }).catch(err => {
              console.error('Error analyzing text:', err);
            });
          } else {
            const errorMsg = asrData.error || 'Could not recognize speech. Please try speaking clearly.';
            setErrorMessage(errorMsg);
          }
        } catch (err) {
          console.error('Error in ASR processing:', err);
          setErrorMessage('Speech recognition failed. Please try again.');
        }
        
        setIsProcessing(false);
        resetAudio();
      };
      
      reader.onerror = () => {
        setErrorMessage('Failed to process audio recording.');
        setIsProcessing(false);
        resetAudio();
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error processing audio:', error);
      setErrorMessage('Failed to process audio. Please try again.');
      setIsProcessing(false);
      resetAudio();
    }
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    clearError();
    
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleClearConversation = async () => {
    if (confirm('Are you sure you want to clear the conversation?')) {
      await clearMessages();
      resetStats();
    }
  };

  const handleTextSend = async (text: string) => {
    setErrorMessage(null);
    setIsProcessing(true);
    
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    addUserMessage(wordCount);
    
    // Start TTS immediately when response arrives (before UI update)
    const result = await sendMessage(text, (response, assistantId) => {
      if (response) {
        playAudio(response, assistantId);
      }
    });
    
    addAssistantMessage();
    setIsProcessing(false);
    
    // Analyze errors in parallel (non-blocking)
    analyzeText(text, result.userId).then(correctionResult => {
      console.log('[handleTextSend] Correction result received:', correctionResult);
      if (correctionResult && correctionResult.hasErrors && correctionResult.errors.length > 0) {
        console.log('[handleTextSend] Adding errors to stats:', correctionResult.errors);
        addErrors(correctionResult.errors as ErrorItem[], wordCount);
      } else {
        console.log('[handleTextSend] No errors to add');
      }
    }).catch(err => {
      console.error('Error analyzing text:', err);
    });
  };

  const handleEndSession = async () => {
    if (messages.length === 0) {
      setErrorMessage('Start a conversation first before ending the session.');
      return;
    }

    if (!confirm('Are you sure you want to end this session and see your results?')) return;

    setIsGeneratingSummary(true);
    
    try {
      const statsForSummary = getStatsForSummary();
      
      const response = await fetch('/api/session-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversation: messages.map(m => ({ role: m.role, content: m.content })),
          stats: statsForSummary,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.summary) {
        setSummaryData(data.summary);
        setShowSummary(true);
      } else {
        setErrorMessage('Failed to generate session summary.');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setErrorMessage('Failed to generate session summary.');
    }
    
    setIsGeneratingSummary(false);
  };

  const handleNewSession = async () => {
    setShowSummary(false);
    setSummaryData(null);
    await clearMessages();
    resetStats();
    setSessionId(generateSessionId());
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
  };

  const handleWordSelect = useCallback((word: string, context: string, position: { x: number; y: number }) => {
    setSelectedWordInfo({ word, context, position });
  }, []);

  const handleAddToDictionary = async (translation: TranslationResult, categoryId?: string | null) => {
    try {
      const response = await fetch('/api/dictionary/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: translation.word,
          translation: translation.translation,
          definition: translation.definition,
          example: translation.examples?.[0] || null,
          categoryId: categoryId || undefined,
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setErrorMessage(null);
      } else if (data.error?.includes('already exists')) {
        setErrorMessage('Word already in dictionary');
      }
    } catch (error) {
      console.error('Failed to add word:', error);
      setErrorMessage('Failed to add word to dictionary');
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      'min-h-screen flex flex-col transition-colors duration-300',
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800' 
        : 'bg-gradient-to-b from-slate-50 via-white to-emerald-50/30'
    )}>
      {/* Header */}
      <header className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300',
        isDarkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-100'
      )}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500"
                animate={{ opacity: [0, 0.5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <svg className="w-5 h-5 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 2.76 2.24 5 5 5s5-2.24 5-5h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z"/>
              </svg>
            </motion.div>
            <div>
              <h1 className={cn('font-bold text-lg tracking-tight', isDarkMode ? 'text-white' : 'text-gray-800')}>
                SpeakEasy AI
              </h1>
              <p className={cn('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                English Conversation Coach
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <VoiceSelector selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice} isDarkMode={isDarkMode} />
            
            {/* Hide/Show All Text Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHideAllText(!hideAllText)}
              className={cn(
                'rounded-full gap-1',
                hideAllText 
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
              title={hideAllText ? 'Show all text' : 'Hide text for listening practice'}
            >
              {hideAllText ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </Button>
            
            {/* Dictionary Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDictionary(true)}
              className={cn('rounded-full', isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}
              title="My Dictionary"
            >
              <BookOpen className="w-5 h-5" />
            </Button>
            
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleEndSession} disabled={isGeneratingSummary}
                className={cn('gap-1.5 h-9 rounded-full px-3',
                  isDarkMode ? 'border-emerald-700 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' 
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                )}>
                <Flag className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">End</span>
              </Button>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon"
                  className={cn('rounded-full', isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}>
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className={cn(isDarkMode ? 'bg-gray-900 border-gray-800' : '')}>
                <DialogHeader>
                  <DialogTitle className={cn(isDarkMode ? 'text-white' : '')}>How to Use</DialogTitle>
                  <DialogDescription className={cn('space-y-2 pt-2', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                    <p><strong>1.</strong> Hold the microphone button to record (max 60 seconds).</p>
                    <p><strong>2.</strong> Release to send. AI will respond with voice.</p>
                    <p><strong>3.</strong> <strong>Select any word</strong> to see translation and add to dictionary.</p>
                    <p><strong>4.</strong> Click <strong>Eye icon</strong> to hide text for listening practice.</p>
                    <p><strong>5.</strong> Check &quot;Smart Correction&quot; for grammar tips.</p>
                    <p><strong>6.</strong> Click <strong>Book icon</strong> to open your dictionary.</p>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}
              className={cn('rounded-full', isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}>
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn('rounded-full', isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={handleClearConversation}
                className={cn('rounded-full', isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}>
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-[55vh] flex items-center justify-center">
                <WelcomeMessage />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message}
                    onPlayAudio={(text) => playAudio(text, message.id)}
                    isPlaying={currentPlayingId === message.id && isPlaying}
                    onWordSelect={handleWordSelect}
                    isHidden={hideAllText && message.role === 'assistant'}
                    isDarkMode={isDarkMode} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-md"
          >
            <div className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border',
              isDarkMode ? 'bg-red-900/90 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'
            )}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
              <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)}
                className={cn('ml-2 h-7 px-2', isDarkMode ? 'text-red-300 hover:text-white' : 'text-red-600 hover:text-red-800')}>
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word Translation Tooltip */}
      <AnimatePresence>
        {selectedWordInfo && (
          <WordTooltip
            selectedWord={selectedWordInfo.word}
            context={selectedWordInfo.context}
            position={selectedWordInfo.position}
            onClose={() => setSelectedWordInfo(null)}
            onAddToDictionary={handleAddToDictionary}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      {/* Dictionary Panel */}
      <DictionaryPanel
        isOpen={showDictionary}
        onClose={() => setShowDictionary(false)}
        isDarkMode={isDarkMode}
      />

      {/* Voice Input Area */}
      <footer className={cn(
        'sticky bottom-0 border-t transition-all duration-300',
        isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-100'
      )}>
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {isFooterExpanded ? (
              <motion.div key="expanded"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden">
                <div className="px-4 py-5 space-y-3">
                  {isRecording && (
                    <div className={cn(
                      'text-center text-sm font-medium',
                      isNearLimit ? 'text-red-500 animate-pulse' : 'text-gray-500'
                    )}>
                      {formatTime(recordingDuration)} / {formatTime(maxDuration)}
                      {isNearLimit && <span className="ml-2">• Limit approaching</span>}
                    </div>
                  )}
                  
                  <VoiceButton isRecording={isRecording} isProcessing={isProcessing}
                    onStart={handleStartRecording} onStop={handleStopRecording}
                    disabled={isProcessing || isGeneratingSummary} />
                  
                  <TextInput onSend={handleTextSend}
                    disabled={isProcessing || isRecording || isGeneratingSummary} isDarkMode={isDarkMode} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="compact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-3">
                <div className="flex items-center justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" disabled={isProcessing || isGeneratingSummary}
                      onMouseDown={handleStartRecording} onMouseUp={handleStopRecording}
                      onMouseLeave={handleStopRecording} onTouchStart={handleStartRecording} onTouchEnd={handleStopRecording}
                      className={cn(
                        'relative rounded-full shadow-lg transition-all duration-300 overflow-hidden',
                        isRecording 
                          ? 'w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600'
                          : 'w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600',
                        (isProcessing || isGeneratingSummary) && 'opacity-50'
                      )}>
                      {isRecording && (
                        <motion.div className="absolute inset-0 bg-red-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }} />
                      )}
                      <div className="relative z-10 flex flex-col items-center">
                        {isProcessing ? (
                          <motion.div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                        ) : (
                          <>
                            <Mic className={cn('text-white', isRecording ? 'w-8 h-8' : 'w-6 h-6')} />
                            {isRecording && (
                              <span className="text-xs text-white mt-1">{formatTime(remainingTime)}</span>
                            )}
                          </>
                        )}
                      </div>
                    </Button>
                  </motion.div>
                  
                  <div className="flex-1 max-w-md">
                    <TextInput onSend={handleTextSend}
                      disabled={isProcessing || isRecording || isGeneratingSummary} isDarkMode={isDarkMode} />
                  </div>
                  
                  <Button variant="ghost" size="icon" onClick={() => setIsFooterExpanded(true)}
                    className={cn('rounded-full', isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6"/>
                    </svg>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {isFooterExpanded && (
            <div className="flex justify-center pb-2">
              <Button variant="ghost" size="sm" onClick={() => setIsFooterExpanded(false)}
                className={cn('gap-1 text-xs', isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 9l-6 6-6-6"/>
                </svg>
                Collapse
              </Button>
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <div className={cn(
          'border-t py-1.5 text-center text-xs transition-colors duration-300',
          isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-slate-50 border-gray-100 text-gray-500'
        )}>
          <span className="flex items-center justify-center gap-2">
            <motion.span className={cn('w-2 h-2 rounded-full')}
              animate={{
                backgroundColor: isRecording ? '#ef4444' : isProcessing || isGeneratingSummary ? '#f59e0b' : '#10b981',
                scale: isRecording || isProcessing || isGeneratingSummary ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: isRecording || isProcessing || isGeneratingSummary ? Infinity : 0 }} />
            {isGeneratingSummary ? 'Generating report...' 
              : isRecording ? `Recording... ${formatTime(remainingTime)} left` 
              : isProcessing ? 'Processing...' 
              : 'Ready'}
          </span>
        </div>
      </footer>

      {/* Session Summary Modal */}
      <AnimatePresence>
        {showSummary && summaryData && (
          <SessionSummary summary={summaryData} onClose={handleCloseSummary}
            onNewSession={handleNewSession} isDarkMode={isDarkMode} />
        )}
      </AnimatePresence>
    </div>
  );
}
