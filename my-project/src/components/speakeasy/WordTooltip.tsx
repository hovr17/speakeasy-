'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookPlus, Loader2, Volume2, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TranslationResult {
  word: string;
  translation: string;
  transcription: string;
  definition: string;
  examples: string[];
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface WordTooltipProps {
  selectedWord: string;
  context: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAddToDictionary: (translation: TranslationResult, categoryId?: string | null) => void;
  isDarkMode?: boolean;
}

export function WordTooltip({
  selectedWord,
  context,
  position,
  onClose,
  onAddToDictionary,
  isDarkMode = false,
}: WordTooltipProps) {
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTranslation = async () => {
      setIsLoading(true);
      setError(null);
      setIsAdded(false);
      setShowCategorySelect(false);

      try {
        const [transRes, catRes] = await Promise.all([
          fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: selectedWord, context }),
          }),
          fetch('/api/dictionary/categories'),
        ]);

        const transData = await transRes.json();
        const catData = await catRes.json();

        if (transData.success && transData.translation) {
          setTranslation(transData.translation);
        } else {
          setError(transData.error || 'Translation not found');
        }
        
        if (catData.success) {
          setCategories(catData.categories);
        }
      } catch (err) {
        setError('Failed to get translation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslation();
  }, [selectedWord, context]);

  // Position tooltip to stay within viewport
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20;
      }
      if (x < 20) x = 20;

      // Adjust vertical position
      if (y + rect.height > viewportHeight - 20) {
        y = position.y - rect.height - 10;
      }
      if (y < 20) y = 20;

      tooltipRef.current.style.left = `${x}px`;
      tooltipRef.current.style.top = `${y}px`;
    }
  }, [position, translation, isLoading, showCategorySelect]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAddToDictionary = () => {
    if (translation) {
      onAddToDictionary(translation, selectedCategoryId);
      setIsAdded(true);
      setShowCategorySelect(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!translation) return;
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: translation.word, voice: 'xiaochen', speed: 0.8 }),
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className={cn(
          'fixed z-50 w-80 rounded-xl shadow-2xl border overflow-hidden',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-4 py-3 border-b',
          isDarkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-gray-100'
        )}>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-lg font-bold',
              isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
            )}>
              {selectedWord}
            </span>
            {translation?.transcription && (
              <span className={cn(
                'text-sm',
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              )}>
                {translation.transcription}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayAudio}
              className={cn(
                'h-8 w-8 rounded-full',
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={cn(
                'h-8 w-8 rounded-full',
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-64 overflow-y-auto">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={cn(
                  'h-6 w-6 animate-spin',
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-500'
                )} />
              </div>
            ) : error ? (
              <div className={cn(
                'text-center py-4',
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              )}>
                {error}
              </div>
            ) : translation ? (
              <div className="space-y-3">
                {/* Translation */}
                <div>
                  <span className={cn(
                    'text-xs font-medium uppercase tracking-wider',
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    Translation
                  </span>
                  <p className={cn(
                    'text-base font-medium mt-1',
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  )}>
                    {translation.translation}
                  </p>
                </div>

                {/* Definition */}
                {translation.definition && (
                  <div>
                    <span className={cn(
                      'text-xs font-medium uppercase tracking-wider',
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      Definition
                    </span>
                    <p className={cn(
                      'text-sm mt-1',
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    )}>
                      {translation.definition}
                    </p>
                  </div>
                )}

                {/* Examples */}
                {translation.examples && translation.examples.length > 0 && (
                  <div>
                    <span className={cn(
                      'text-xs font-medium uppercase tracking-wider',
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      Examples
                    </span>
                    <div className="mt-1 space-y-1">
                      {translation.examples.slice(0, 2).map((example, idx) => (
                        <p key={idx} className="text-sm italic text-gray-500">
                          &quot;{example}&quot;
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Category Selection */}
        {!isLoading && translation && !isAdded && categories.length > 0 && (
          <div className={cn(
            'px-4 py-2 border-t',
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          )}>
            <button
              onClick={() => setShowCategorySelect(!showCategorySelect)}
              className={cn(
                'flex items-center gap-2 text-xs w-full text-left',
                isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
              )}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>
                {selectedCategoryId 
                  ? `Category: ${categories.find(c => c.id === selectedCategoryId)?.name}`
                  : 'Select category (optional)'}
              </span>
            </button>
            
            {showCategorySelect && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 flex flex-wrap gap-1"
              >
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id);
                    }}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full transition-all',
                      selectedCategoryId === cat.id
                        ? 'text-white ring-2 ring-offset-1'
                        : isDarkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                    style={selectedCategoryId === cat.id ? { backgroundColor: cat.color } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Footer */}
        {!isLoading && translation && (
          <div className={cn(
            'px-4 py-3 border-t',
            isDarkMode ? 'bg-gray-700/30 border-gray-700' : 'bg-gray-50 border-gray-100'
          )}>
            <Button
              onClick={handleAddToDictionary}
              disabled={isAdded}
              className={cn(
                'w-full gap-2 rounded-full',
                isAdded
                  ? 'bg-emerald-500 hover:bg-emerald-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
              )}
            >
              {isAdded ? (
                <>
                  <span className="text-sm">Added to Dictionary</span>
                </>
              ) : (
                <>
                  <BookPlus className="h-4 w-4" />
                  <span className="text-sm">
                    Add to Dictionary
                    {selectedCategoryId && ` (${categories.find(c => c.id === selectedCategoryId)?.name})`}
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
