'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Trash2, BookOpen, Volume2, Search, Loader2, 
  Plus, Folder, FolderPlus, ChevronRight, Edit2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  color: string;
  wordCount: number;
  createdAt: string;
}

interface DictionaryWord {
  id: string;
  word: string;
  translation: string;
  definition: string | null;
  example: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  createdAt: string;
}

interface DictionaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

const PRESET_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function DictionaryPanel({ isOpen, onClose, isDarkMode = false }: DictionaryPanelProps) {
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [movingWordId, setMovingWordId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [wordsRes, categoriesRes] = await Promise.all([
        fetch('/api/dictionary/words'),
        fetch('/api/dictionary/categories'),
      ]);
      
      const wordsData = await wordsRes.json();
      const categoriesData = await categoriesRes.json();
      
      if (wordsData.success) setWords(wordsData.words);
      if (categoriesData.success) setCategories(categoriesData.categories);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    try {
      const response = await fetch(`/api/dictionary/words?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setWords(prev => prev.filter(w => w.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await fetch('/api/dictionary/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim(), color: newCategoryColor }),
      });
      const data = await response.json();
      if (data.success) {
        setCategories(prev => [data.category, ...prev]);
        setNewCategoryName('');
        setShowNewCategoryInput(false);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Words will be moved to "Uncategorized".')) return;
    
    try {
      const response = await fetch(`/api/dictionary/categories?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setCategories(prev => prev.filter(c => c.id !== id));
        if (selectedCategoryId === id) setSelectedCategoryId(null);
        // Refresh words to update their category
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleRenameCategory = async (id: string) => {
    if (!editingCategoryName.trim()) return;
    
    try {
      const response = await fetch('/api/dictionary/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingCategoryName.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setCategories(prev => prev.map(c => 
          c.id === id ? { ...c, name: data.category.name } : c
        ));
        setEditingCategoryId(null);
      }
    } catch (error) {
      console.error('Failed to rename category:', error);
    }
  };

  const handleMoveWord = async (wordId: string, categoryId: string | null) => {
    try {
      const response = await fetch('/api/dictionary/words', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wordId, categoryId }),
      });
      const data = await response.json();
      if (data.success) {
        setWords(prev => prev.map(w => 
          w.id === wordId ? { ...w, category: data.word.category, categoryId } : w
        ));
        setMovingWordId(null);
      }
    } catch (error) {
      console.error('Failed to move word:', error);
    }
  };

  const handlePlayAudio = async (word: string, id: string) => {
    setPlayingId(id);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word, voice: 'xiaochen', speed: 0.8 }),
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setPlayingId(null);
        };
        audio.play();
      } else {
        setPlayingId(null);
      }
    } catch (err) {
      console.error('Failed to play audio:', err);
      setPlayingId(null);
    }
  };

  const filteredWords = words.filter(w => {
    const matchesSearch = 
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryId === null || w.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const uncategorizedCount = words.filter(w => !w.categoryId).length;
  const totalWords = words.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={cn(
              'w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex',
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            )}
          >
            {/* Sidebar - Categories */}
            <div className={cn(
              'w-64 flex-shrink-0 border-r flex flex-col',
              isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
            )}>
              <div className={cn(
                'px-4 py-4 border-b',
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className={cn('w-4 h-4', isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                    <span className={cn(
                      'text-sm font-medium',
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    )}>
                      Categories
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewCategoryInput(true)}
                    className={cn(
                      'h-7 w-7 rounded-full',
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2">
                  {/* New Category Input */}
                  {showNewCategoryInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        'mb-2 p-2 rounded-lg border',
                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                      )}
                    >
                      <input
                        type="text"
                        placeholder="Category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                        autoFocus
                        className={cn(
                          'w-full px-2 py-1.5 text-sm rounded border outline-none mb-2',
                          isDarkMode 
                            ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                            : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                        )}
                      />
                      <div className="flex items-center gap-1 mb-2">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setNewCategoryColor(color)}
                            className={cn(
                              'w-5 h-5 rounded-full transition-transform',
                              newCategoryColor === color && 'scale-125 ring-2 ring-offset-1'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={handleCreateCategory}
                          className="flex-1 h-7 text-xs"
                        >
                          Create
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowNewCategoryInput(false);
                            setNewCategoryName('');
                          }}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* All Words */}
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors mb-1',
                      selectedCategoryId === null
                        ? isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm font-medium">All Words</span>
                    </div>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    )}>
                      {totalWords}
                    </span>
                  </button>

                  {/* Uncategorized */}
                  {uncategorizedCount > 0 && (
                    <button
                      onClick={() => setSelectedCategoryId('uncategorized')}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors mb-1',
                        selectedCategoryId === 'uncategorized'
                          ? isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                          : isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="text-sm">Uncategorized</span>
                      </div>
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full',
                        isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                      )}>
                        {uncategorizedCount}
                      </span>
                    </button>
                  )}

                  {/* Category List */}
                  {categories.map(category => (
                    <div
                      key={category.id}
                      className={cn(
                        'group mb-1 rounded-lg',
                        selectedCategoryId === category.id && (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')
                      )}
                    >
                      {editingCategoryId === category.id ? (
                        <div className="px-2 py-1.5">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameCategory(category.id);
                              if (e.key === 'Escape') setEditingCategoryId(null);
                            }}
                            autoFocus
                            className={cn(
                              'w-full px-2 py-1 text-sm rounded border outline-none',
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-200 text-gray-800'
                            )}
                          />
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="sm"
                              onClick={() => handleRenameCategory(category.id)}
                              className="flex-1 h-6 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingCategoryId(null)}
                              className="h-6 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedCategoryId(category.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className={cn(
                              'text-sm',
                              isDarkMode ? 'text-gray-200' : 'text-gray-700'
                            )}>
                              {category.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded-full',
                              isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                            )}>
                              {category.wordCount}
                            </span>
                            <div className="hidden group-hover:flex items-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCategoryId(category.id);
                                  setEditingCategoryName(category.name);
                                }}
                                className={cn(
                                  'h-5 w-5 rounded',
                                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                                )}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(category.id);
                                }}
                                className={cn(
                                  'h-5 w-5 rounded',
                                  isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                                )}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content - Words */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className={cn(
                'flex-shrink-0 px-5 py-4 border-b',
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-gray-100'
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className={cn(
                      'w-5 h-5',
                      isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                    )} />
                    <h2 className={cn(
                      'text-lg font-bold',
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    )}>
                      {selectedCategoryId === null 
                        ? 'My Dictionary' 
                        : selectedCategoryId === 'uncategorized'
                          ? 'Uncategorized'
                          : categories.find(c => c.id === selectedCategoryId)?.name || 'Dictionary'}
                    </h2>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    )}>
                      {filteredWords.length} words
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className={cn(
                      'rounded-full',
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  )} />
                  <input
                    type="text"
                    placeholder="Search words..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none transition-colors',
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500' 
                        : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-emerald-400'
                    )}
                  />
                </div>
              </div>

              {/* Words List */}
              <ScrollArea className="flex-1 overflow-hidden">
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className={cn(
                        'h-8 w-8 animate-spin',
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-500'
                      )} />
                    </div>
                  ) : filteredWords.length === 0 ? (
                    <div className={cn(
                      'text-center py-12',
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      <BookOpen className={cn(
                        'w-12 h-12 mx-auto mb-3',
                        isDarkMode ? 'text-gray-600' : 'text-gray-300'
                      )} />
                      <p className="text-sm">
                        {searchQuery ? 'No words found' : 'No words in this category'}
                      </p>
                      <p className={cn(
                        'text-xs mt-1',
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      )}>
                        {searchQuery ? 'Try a different search' : 'Click on words in the chat to add them'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredWords.map((word, idx) => (
                        <motion.div
                          key={word.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            'p-3 rounded-xl border transition-colors',
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                              : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  'font-bold text-base',
                                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                )}>
                                  {word.word}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePlayAudio(word.word, word.id)}
                                  className={cn(
                                    'h-6 w-6 rounded-full',
                                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                                  )}
                                  disabled={playingId === word.id}
                                >
                                  {playingId === word.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Volume2 className="h-3 w-3" />
                                  )}
                                </Button>
                                {word.category && (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: word.category.color }}
                                  >
                                    {word.category.name}
                                  </span>
                                )}
                              </div>
                              <p className={cn(
                                'text-sm font-medium mt-0.5',
                                isDarkMode ? 'text-white' : 'text-gray-800'
                              )}>
                                {word.translation}
                              </p>
                              {word.definition && (
                                <p className={cn(
                                  'text-xs mt-1',
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                  {word.definition}
                                </p>
                              )}
                              {word.example && (
                                <p className="text-xs italic text-gray-500 mt-1">
                                  &quot;{word.example}&quot;
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Move to category dropdown */}
                              {movingWordId === word.id ? (
                                <div className={cn(
                                  'flex items-center gap-1 p-1 rounded-lg border',
                                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                                )}>
                                  <select
                                    onChange={(e) => handleMoveWord(word.id, e.target.value || null)}
                                    className={cn(
                                      'text-xs px-2 py-1 rounded border outline-none',
                                      isDarkMode 
                                        ? 'bg-gray-600 border-gray-500 text-white' 
                                        : 'bg-gray-50 border-gray-200 text-gray-800'
                                    )}
                                    autoFocus
                                  >
                                    <option value="">Uncategorized</option>
                                    {categories.map(cat => (
                                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                  </select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setMovingWordId(null)}
                                    className="h-6 w-6"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setMovingWordId(word.id)}
                                  className={cn(
                                    'h-8 w-8 rounded-full',
                                    isDarkMode 
                                      ? 'text-gray-500 hover:text-emerald-400 hover:bg-gray-700' 
                                      : 'text-gray-400 hover:text-emerald-500 hover:bg-gray-200'
                                  )}
                                  title="Move to category"
                                >
                                  <Folder className="w-4 h-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteWord(word.id)}
                                className={cn(
                                  'h-8 w-8 rounded-full',
                                  isDarkMode 
                                    ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' 
                                    : 'text-gray-400 hover:text-red-500 hover:bg-gray-200'
                                )}
                              >
                                <Trash2 className="w-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
