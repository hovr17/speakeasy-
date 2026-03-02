'use client';

import { motion } from 'framer-motion';

interface AudioWaveAnimationProps {
  isActive: boolean;
}

export function AudioWaveAnimation({ isActive }: AudioWaveAnimationProps) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full"
          animate={
            isActive
              ? {
                  height: [16, 32 + Math.random() * 16, 16],
                }
              : { height: 16 }
          }
          transition={{
            duration: 0.4 + Math.random() * 0.2,
            repeat: isActive ? Infinity : 0,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}
