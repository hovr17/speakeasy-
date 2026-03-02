'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles, Mic, MessageSquare, Lightbulb } from 'lucide-react';

export function WelcomeMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center px-4 max-w-md"
    >
      {/* Animated Avatar */}
      <div className="relative mb-8">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 via-emerald-500 to-green-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
        >
          <Bot className="w-12 h-12 text-white" />
        </motion.div>
        
        {/* Floating elements */}
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shadow-md"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
        </motion.div>
        
        <motion.div
          animate={{
            y: [0, -6, 0],
            x: [0, 4, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
          className="absolute -bottom-1 -left-3 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shadow-md"
        >
          <Mic className="w-3.5 h-3.5 text-emerald-600" />
        </motion.div>
      </div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-gray-800 mb-3"
      >
        Welcome to SpeakEasy AI
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 mb-8 leading-relaxed"
      >
        Your personal English conversation coach. Practice speaking, get instant feedback, 
        and improve your skills with AI-powered conversations.
      </motion.p>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full space-y-3"
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3.5 border border-emerald-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-800">Hold to Speak</p>
            <p className="text-xs text-gray-500">Press the button and talk in English</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-3.5 border border-teal-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-800">Get AI Responses</p>
            <p className="text-xs text-gray-500">Natural voice and text replies</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3.5 border border-amber-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-800">Smart Corrections</p>
            <p className="text-xs text-gray-500">Instant feedback on your grammar</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
