'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioWaveAnimation } from './AudioWaveAnimation';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export function VoiceButton({
  isRecording,
  isProcessing,
  onStart,
  onStop,
  disabled,
  compact = false,
}: VoiceButtonProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (compact && !isExpanded) {
    // Compact mode - small button
    return (
      <div className="flex items-center justify-center gap-3">
        <motion.div
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          <Button
            size="lg"
            disabled={disabled}
            onMouseDown={onStart}
            onMouseUp={onStop}
            onMouseLeave={onStop}
            onTouchStart={onStart}
            onTouchEnd={onStop}
            className={cn(
              'w-14 h-14 rounded-full shadow-lg transition-all duration-300 relative overflow-hidden',
              isRecording
                ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isRecording && (
              <motion.div
                className="absolute inset-0 bg-red-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            <div className="relative z-10">
              {isProcessing ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : isRecording ? (
                <MicOff className="h-6 w-6 text-white" />
              ) : (
                <Mic className="h-6 w-6 text-white" />
              )}
            </div>
          </Button>
        </motion.div>
        
        <div className="text-left">
          <p className="text-sm font-medium text-gray-700">
            {isProcessing ? 'Processing...' : isRecording ? 'Listening...' : 'Hold to speak'}
          </p>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Expand <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Wave Animation */}
      <div className={cn(
        'h-12 flex items-center justify-center transition-opacity duration-300',
        isRecording ? 'opacity-100' : 'opacity-0'
      )}>
        <AudioWaveAnimation isActive={isRecording} />
      </div>

      {/* Main Button */}
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        <Button
          size="lg"
          disabled={disabled}
          onMouseDown={onStart}
          onMouseUp={onStop}
          onMouseLeave={onStop}
          onTouchStart={onStart}
          onTouchEnd={onStop}
          className={cn(
            'w-20 h-20 rounded-full shadow-lg transition-all duration-300 relative overflow-hidden',
            isRecording
              ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Pulse Effect */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 bg-red-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          <div className="relative z-10">
            {isProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            ) : isRecording ? (
              <MicOff className="h-8 w-8 text-white" />
            ) : (
              <Mic className="h-8 w-8 text-white" />
            )}
          </div>
        </Button>
      </motion.div>

      {/* Label */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          {isProcessing
            ? 'Processing...'
            : isRecording
            ? 'Listening... Release to send'
            : 'Hold to speak'}
        </p>
        <p className="text-xs text-gray-500">
          {isRecording ? 'Speak now in English' : 'Press and hold the button'}
        </p>
      </div>

      {/* Collapse button for compact mode */}
      {compact && (
        <button
          onClick={() => setIsExpanded(false)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mt-1"
        >
          Collapse <ChevronDown className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
