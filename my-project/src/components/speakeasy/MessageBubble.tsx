'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Volume2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
  correction?: {
    hasErrors: boolean;
    corrected: string;
    errors: Array<{
      type: string;
      original: string;
      correction: string;
      explanation: string;
    }>;
    feedback: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  onPlayAudio?: (text: string) => void;
  isPlaying?: boolean;
  onWordSelect?: (word: string, context: string, position: { x: number; y: number }) => void;
  isHidden?: boolean;
  isDarkMode?: boolean;
}

export function MessageBubble({ 
  message, 
  onPlayAudio, 
  isPlaying, 
  onWordSelect,
  isHidden = false,
  isDarkMode = false
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!onWordSelect || isUser) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.includes(' ')) return; // Single word only
    
    // Get the full context
    const context = message.content;
    
    // Calculate position for tooltip
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Clear selection
    selection.removeAllRanges();
    
    onWordSelect(selectedText, context, { 
      x: rect.left + rect.width / 2, 
      y: rect.bottom + 5 
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!onWordSelect || isUser) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element || !contentRef.current?.contains(element)) return;
    
    // Get word at touch position
    const textNode = element.childNodes[0];
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    
    const text = textNode.textContent || '';
    const offset = document.createRange().startOffset;
    
    // Find word boundaries
    let start = offset;
    let end = offset;
    while (start > 0 && /\w/.test(text[start - 1])) start--;
    while (end < text.length && /\w/.test(text[end])) end++;
    
    const word = text.slice(start, end).trim();
    if (!word) return;
    
    onWordSelect(word, message.content, { 
      x: touch.clientX, 
      y: touch.clientY + 10 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 max-w-[85%]',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Avatar className={cn(
          'h-10 w-10 flex-shrink-0 border-2 shadow-sm',
          isUser 
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-400 to-teal-500' 
            : 'border-teal-200 bg-gradient-to-br from-teal-400 to-cyan-500'
        )}>
          <AvatarFallback className="bg-transparent text-white">
            {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <div className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        <motion.div
          ref={contentRef}
          whileHover={{ scale: 1.01 }}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleTouchEnd}
          className={cn(
            'rounded-2xl px-4 py-3 shadow-sm max-w-full cursor-text select-text',
            isUser
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
              : isDarkMode 
                ? 'bg-gray-800 border border-gray-700 text-gray-200 shadow-gray-500/5'
                : 'bg-white border border-gray-100 text-gray-800 shadow-gray-500/5'
          )}
        >
          {message.isProcessing ? (
            <div className={cn(
              'flex items-center gap-2',
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            )}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : isHidden && !isUser ? (
            <div className="flex items-center gap-2 text-gray-400 italic text-sm">
              <span>🔊 Audio playing...</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </motion.div>

        {/* AI Response Actions */}
        {!isUser && !message.isProcessing && onPlayAudio && !isHidden && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPlayAudio(message.content)}
              disabled={isPlaying}
              className={cn(
                'h-8 gap-1.5 rounded-full',
                isPlaying 
                  ? 'text-teal-600 bg-teal-50' 
                  : isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              {isPlaying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Playing...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="text-xs">Listen</span>
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Correction Feedback */}
        {isUser && message.correction && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md overflow-hidden"
          >
            <div className={cn(
              'rounded-xl p-3.5 shadow-sm border',
              message.correction.hasErrors 
                ? isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'
                : isDarkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {message.correction.hasErrors ? (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                )}
                <span className={cn(
                  'font-medium text-sm',
                  message.correction.hasErrors 
                    ? isDarkMode ? 'text-amber-400' : 'text-amber-700'
                    : isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                )}>
                  Smart Correction
                </span>
                {message.correction.hasErrors && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    isDarkMode ? 'bg-amber-800 text-amber-300' : 'bg-amber-100 text-amber-700'
                  )}>
                    {message.correction.errors.length} error(s)
                  </span>
                )}
              </div>
              
              {message.correction.hasErrors ? (
                <>
                  <div className="mb-3">
                    <span className={cn(
                      'text-xs block mb-1',
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      Corrected version:
                    </span>
                    <p className={cn(
                      'text-sm font-medium rounded-lg p-2',
                      isDarkMode ? 'text-gray-200 bg-gray-800/50' : 'text-gray-800 bg-white/50'
                    )}>
                      {message.correction.corrected}
                    </p>
                  </div>
                  
                  {message.correction.errors.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {message.correction.errors.map((error, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={cn(
                            'text-xs rounded-lg p-2.5 border',
                            isDarkMode 
                              ? 'bg-gray-800/70 border-gray-700' 
                              : 'bg-white/70 border-amber-100'
                          )}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded line-through">
                                {error.original}
                              </span>
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-medium">
                                {error.correction}
                              </span>
                            </span>
                          </div>
                          <p className={cn(
                            'mt-1.5 leading-relaxed',
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          )}>
                            {error.explanation}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={cn(
                  'rounded-lg p-2',
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
                )}>
                  <p className={cn(
                    'text-sm font-medium',
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                  )}>
                    Great job! Your sentence is correct.
                  </p>
                </div>
              )}
              
              <p className={cn(
                'text-xs leading-relaxed',
                message.correction.hasErrors 
                  ? isDarkMode ? 'text-amber-400' : 'text-amber-700'
                  : isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              )}>
                {message.correction.feedback}
              </p>
            </div>
          </motion.div>
        )}

        <span className={cn(
          'text-xs px-1',
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
