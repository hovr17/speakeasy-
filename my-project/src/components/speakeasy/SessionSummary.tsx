'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Lightbulb, 
  BookOpen, 
  Star, 
  TrendingUp,
  Award,
  X,
  AlertTriangle,
  Clock,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface VocabularyItem {
  word: string;
  definition: string;
  example: string;
}

interface CommonError {
  original: string;
  correction: string;
  type: string;
  explanation: string;
  count: number;
}

interface ImprovementTip {
  errorType: string;
  description: string;
  tips: string[];
  examples: Array<{ wrong: string; correct: string }>;
}

interface SessionStats {
  speakingMinutes: number;
  userMessageCount: number;
  totalErrors: number;
  errorsPerMinute: number;
  errorTypes: {
    grammar: number;
    spelling: number;
    punctuation: number;
    word_choice: number;
  };
  totalWordsSpoken: number;
  mostCommonErrors: CommonError[];
  dominantErrorType: [string, number];
  improvementTips: ImprovementTip[];
  calculatedScore: number;
}

interface ConversationSummary {
  overallFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  grammarTips: string[];
  vocabulary: VocabularyItem[];
  topicWords: VocabularyItem[];
  overallScore: number;
  sessionStats?: SessionStats;
}

interface SessionSummaryProps {
  summary: ConversationSummary;
  onClose: () => void;
  onNewSession: () => void;
  isDarkMode?: boolean;
}

export function SessionSummary({ 
  summary, 
  onClose, 
  onNewSession, 
  isDarkMode 
}: SessionSummaryProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-orange-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-400 to-teal-500';
    if (score >= 60) return 'from-amber-400 to-yellow-500';
    return 'from-orange-400 to-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great Job!';
    if (score >= 70) return 'Good Work!';
    if (score >= 60) return 'Nice Effort!';
    return 'Keep Practicing!';
  };

  const getErrorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      grammar: 'Grammar',
      spelling: 'Spelling',
      punctuation: 'Punctuation',
      word_choice: 'Word Choice',
    };
    return labels[type] || type;
  };

  const stats = summary.sessionStats;
  const displayScore = stats?.calculatedScore ?? summary.overallScore;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={cn(
          'w-full max-w-2xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col',
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        )}
      >
        {/* Header - Fixed */}
        <div className={cn(
          'relative px-6 py-5 text-center flex-shrink-0 overflow-hidden',
          isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-emerald-50 to-teal-50'
        )}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-emerald-400 blur-2xl" />
            <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-teal-400 blur-3xl" />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 rounded-full',
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <X className="w-5 h-5" />
          </Button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={cn(
              'w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 bg-gradient-to-br shadow-lg',
              getScoreGradient(displayScore)
            )}
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className={cn(
              'text-xl font-bold mb-1',
              isDarkMode ? 'text-white' : 'text-gray-800'
            )}>
              Session Complete!
            </h2>
            <div className="flex items-center justify-center gap-3">
              <span className={cn(
                'text-3xl font-bold',
                getScoreColor(displayScore)
              )}>
                {displayScore}
              </span>
              <span className={cn(
                'text-base font-medium',
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              )}>
                / 100
              </span>
            </div>
            <p className={cn(
              'text-base font-medium mt-1',
              getScoreColor(displayScore)
            )}>
              {getScoreLabel(displayScore)}
            </p>
          </motion.div>
        </div>

        {/* Content - Scrollable */}
        <ScrollArea className="flex-1 h-full overflow-hidden">
          <div className="p-5 space-y-5">
            {/* Session Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className={cn(
                  'grid grid-cols-3 gap-3 p-4 rounded-xl',
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                )}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className={cn('w-4 h-4', isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                    <span className={cn('text-lg font-bold', isDarkMode ? 'text-white' : 'text-gray-800')}>
                      {stats.speakingMinutes.toFixed(1)}
                    </span>
                  </div>
                  <span className={cn('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                    Minutes
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MessageSquare className={cn('w-4 h-4', isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                    <span className={cn('text-lg font-bold', isDarkMode ? 'text-white' : 'text-gray-800')}>
                      {stats.userMessageCount}
                    </span>
                  </div>
                  <span className={cn('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                    Messages
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertTriangle className={cn('w-4 h-4', stats.totalErrors > 0 ? 'text-amber-500' : 'text-emerald-500')} />
                    <span className={cn('text-lg font-bold', isDarkMode ? 'text-white' : 'text-gray-800')}>
                      {stats.totalErrors}
                    </span>
                  </div>
                  <span className={cn('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                    Errors
                  </span>
                </div>
              </motion.div>
            )}

            {/* Score Explanation */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className={cn(
                  'p-3 rounded-xl border',
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50 border-blue-100'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className={cn('w-4 h-4', isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                  <span className={cn('text-sm font-medium', isDarkMode ? 'text-blue-400' : 'text-blue-700')}>
                    How Your Score is Calculated
                  </span>
                </div>
                <div className={cn('text-xs leading-relaxed space-y-1', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                  <p><strong>Formula:</strong> Score = 100 - (Errors × 10) + (Minutes × 2)</p>
                  <div className={cn('mt-2 p-2 rounded-lg', isDarkMode ? 'bg-gray-700/50' : 'bg-white/50')}>
                    <p className="font-medium mb-1">Your calculation:</p>
                    <p>100 - ({stats.totalErrors} × 10) + ({Math.floor(stats.speakingMinutes)} × 2) = <strong>{displayScore}</strong></p>
                  </div>
                  <div className={cn('mt-2 p-2 rounded-lg', isDarkMode ? 'bg-gray-700/50' : 'bg-white/50')}>
                    <p className="font-medium mb-1">Examples:</p>
                    <ul className="space-y-0.5">
                      <li>• 0 errors, 5 min → 100 - 0 + 10 = <span className="text-emerald-500">100</span></li>
                      <li>• 2 errors, 3 min → 100 - 20 + 6 = <span className="text-amber-500">86</span></li>
                      <li>• 5 errors, 2 min → 100 - 50 + 4 = <span className="text-orange-500">54</span></li>
                    </ul>
                  </div>
                  <p className="mt-2">
                    <span className="text-emerald-500">🎯</span> Each error = -10 points | 
                    <span className="text-blue-500"> ⏱️</span> Each minute = +2 points (max +20)
                  </p>
                </div>
              </motion.div>
            )}

            {/* Overall Feedback */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                'p-3 rounded-xl',
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              )}
            >
              <p className={cn(
                'text-sm leading-relaxed',
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              )}>
                {summary.overallFeedback}
              </p>
            </motion.div>

            {/* Most Common Errors */}
            {stats && stats.mostCommonErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className={cn(
                    'font-semibold text-sm',
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  )}>
                    Most Common Errors
                  </h3>
                </div>
                <div className="space-y-2">
                  {stats.mostCommonErrors.map((error, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-lg border',
                        isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-100'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs line-through">
                            {error.original}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded text-xs font-medium">
                            {error.correction}
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                        )}>
                          {error.count}x
                        </span>
                      </div>
                      <p className={cn('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                        {error.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Improvement Tips */}
            {stats && stats.improvementTips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <h3 className={cn(
                    'font-semibold text-sm',
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  )}>
                    Tips for Improvement
                  </h3>
                </div>
                <div className="space-y-3">
                  {stats.improvementTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-3 rounded-lg border',
                        isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-100'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-200 text-yellow-700'
                        )}>
                          {getErrorTypeLabel(tip.errorType)}
                        </span>
                        <span className={cn('text-sm font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700')}>
                          {tip.description}
                        </span>
                      </div>
                      <ul className="space-y-1 mb-2">
                        {tip.tips.map((t, i) => (
                          <li key={i} className={cn('text-xs flex items-start gap-1', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                            <span className="text-yellow-500">•</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                      {tip.examples.length > 0 && (
                        <div className="space-y-1">
                          {tip.examples.map((ex, i) => (
                            <div key={i} className="text-xs flex items-center gap-2">
                              <span className="text-red-500 line-through">{ex.wrong}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-emerald-500">{ex.correct}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Strengths */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-emerald-500" />
                <h3 className={cn(
                  'font-semibold text-sm',
                  isDarkMode ? 'text-white' : 'text-gray-800'
                )}>
                  Strengths
                </h3>
              </div>
              <div className="space-y-1.5">
                {summary.strengths.map((strength, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-2 p-2.5 rounded-lg',
                      isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'
                    )}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className={cn(
                      'text-sm',
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {strength}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Areas to Improve */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-500" />
                <h3 className={cn(
                  'font-semibold text-sm',
                  isDarkMode ? 'text-white' : 'text-gray-800'
                )}>
                  Areas to Improve
                </h3>
              </div>
              <div className="space-y-1.5">
                {summary.areasToImprove.map((area, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-2 p-2.5 rounded-lg',
                      isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'
                    )}
                  >
                    <Target className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className={cn(
                      'text-sm',
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {area}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Grammar Tips */}
            {summary.grammarTips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <h3 className={cn(
                    'font-semibold text-sm',
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  )}>
                    Grammar Tips
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {summary.grammarTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-start gap-2 p-2.5 rounded-lg',
                        isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
                      )}
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className={cn(
                        'text-sm',
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {tip}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Vocabulary to Improve */}
            {summary.vocabulary.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <h3 className={cn(
                    'font-semibold text-sm',
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  )}>
                    Vocabulary to Improve
                  </h3>
                </div>
                <div className="grid gap-1.5">
                  {summary.vocabulary.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-2.5 rounded-lg border',
                        isDarkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100'
                      )}
                    >
                      <span className={cn(
                        'font-medium text-sm',
                        isDarkMode ? 'text-purple-300' : 'text-purple-700'
                      )}>
                        {item.word}
                      </span>
                      <p className={cn(
                        'text-xs mt-0.5',
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {item.definition}
                      </p>
                      <p className="text-xs italic text-gray-500 mt-0.5">
                        &quot;{item.example}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Topic Words to Learn */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-teal-500" />
                <h3 className={cn(
                  'font-semibold text-sm',
                  isDarkMode ? 'text-white' : 'text-gray-800'
                )}>
                  Words to Learn ({summary.topicWords.length})
                </h3>
              </div>
              <div className="grid gap-1.5">
                {summary.topicWords.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.02 }}
                    className={cn(
                      'p-2.5 rounded-lg border',
                      isDarkMode ? 'bg-teal-900/20 border-teal-800' : 'bg-teal-50 border-teal-100'
                    )}
                  >
                    <span className={cn(
                      'font-medium text-sm',
                      isDarkMode ? 'text-teal-300' : 'text-teal-700'
                    )}>
                      {item.word}
                    </span>
                    <p className={cn(
                      'text-xs mt-0.5',
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {item.definition}
                    </p>
                    <p className="text-xs italic text-gray-500 mt-0.5">
                      &quot;{item.example}&quot;
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </ScrollArea>

        {/* Footer - Fixed */}
        <div className={cn(
          'p-4 border-t flex gap-3 flex-shrink-0',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'
        )}>
          <Button
            variant="outline"
            onClick={onClose}
            className={cn(
              'flex-1 rounded-full',
              isDarkMode && 'border-gray-700 text-gray-300 hover:bg-gray-700'
            )}
          >
            Close
          </Button>
          <Button
            onClick={onNewSession}
            className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            Start New Session
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
