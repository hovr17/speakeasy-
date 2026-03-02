'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  accent: string;
  gender: 'male' | 'female' | 'neutral';
  preview?: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'jam',
    name: 'James',
    description: 'British gentleman',
    accent: '🇬🇧 British',
    gender: 'male',
  },
  {
    id: 'tongtong',
    name: 'Tong',
    description: 'Warm & friendly',
    accent: '🌐 Neutral',
    gender: 'neutral',
  },
  {
    id: 'chuichui',
    name: 'Chui',
    description: 'Cheerful & lively',
    accent: '🌐 Neutral',
    gender: 'neutral',
  },
  {
    id: 'xiaochen',
    name: 'Chen',
    description: 'Professional & clear',
    accent: '🌐 Neutral',
    gender: 'neutral',
  },
  {
    id: 'kazi',
    name: 'Kazi',
    description: 'Clear standard',
    accent: '🇺🇸 American',
    gender: 'neutral',
  },
  {
    id: 'douji',
    name: 'Douji',
    description: 'Natural & smooth',
    accent: '🌐 Neutral',
    gender: 'neutral',
  },
  {
    id: 'luodo',
    name: 'Luo',
    description: 'Expressive & engaging',
    accent: '🌐 Neutral',
    gender: 'neutral',
  },
];

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  isDarkMode?: boolean;
}

export function VoiceSelector({ selectedVoice, onVoiceChange, isDarkMode }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentVoice = VOICE_OPTIONS.find(v => v.id === selectedVoice) || VOICE_OPTIONS[0];

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'gap-2 h-9 rounded-full px-3 transition-all',
          isDarkMode 
            ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:border-gray-600' 
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
        )}
      >
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs',
          currentVoice.gender === 'male' 
            ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
            : currentVoice.gender === 'female'
            ? 'bg-gradient-to-br from-pink-400 to-pink-600'
            : 'bg-gradient-to-br from-purple-400 to-purple-600'
        )}>
          {currentVoice.gender === 'male' ? (
            <User className="w-3 h-3 text-white" />
          ) : (
            <Users className="w-3 h-3 text-white" />
          )}
        </div>
        <span className="text-sm font-medium">{currentVoice.name}</span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute top-full left-0 mt-2 w-64 rounded-xl shadow-xl border z-50 overflow-hidden',
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              )}
            >
              <div className={cn(
                'px-3 py-2 border-b text-xs font-medium',
                isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'
              )}>
                Choose AI Voice
              </div>
              
              <div className="max-h-72 overflow-y-auto">
                {VOICE_OPTIONS.map((voice) => (
                  <motion.button
                    key={voice.id}
                    whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    onClick={() => {
                      onVoiceChange(voice.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors',
                      selectedVoice === voice.id && (
                        isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'
                      )
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                      voice.gender === 'male' 
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                        : voice.gender === 'female'
                        ? 'bg-gradient-to-br from-pink-400 to-pink-600'
                        : 'bg-gradient-to-br from-purple-400 to-purple-600'
                    )}>
                      {voice.gender === 'male' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Users className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium text-sm',
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        )}>
                          {voice.name}
                        </span>
                        <span className="text-xs">{voice.accent}</span>
                      </div>
                      <p className={cn(
                        'text-xs truncate',
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      )}>
                        {voice.description}
                      </p>
                    </div>
                    
                    {/* Check */}
                    {selectedVoice === voice.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
