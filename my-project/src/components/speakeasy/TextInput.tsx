'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TextInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isDarkMode?: boolean;
}

export function TextInput({ onSend, disabled, isDarkMode }: TextInputProps) {
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.div
            key="button"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="outline"
              onClick={() => setIsExpanded(true)}
              className={cn(
                'w-full gap-2 h-10 rounded-full transition-all border-dashed text-sm',
                isDarkMode 
                  ? 'border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300 hover:border-gray-600' 
                  : 'border-gray-300 bg-gray-50/50 text-gray-500 hover:bg-white hover:text-gray-700 hover:border-gray-400'
              )}
            >
              <Keyboard className="w-4 h-4" />
              <span>Type message</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="flex gap-2 items-center"
          >
            <div className="flex-1 relative">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type in English..."
                disabled={disabled}
                autoFocus
                className={cn(
                  'h-10 pr-12 rounded-full transition-all text-sm',
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500/20' 
                    : 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-emerald-400 focus:ring-emerald-400/20'
                )}
              />
              <Button
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                size="icon"
                className={cn(
                  'absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full transition-all',
                  text.trim() 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' 
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsExpanded(false);
                setText('');
              }}
              className={cn(
                'h-10 w-10 rounded-full flex-shrink-0',
                isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
