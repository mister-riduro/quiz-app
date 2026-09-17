import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Delete,
} from 'lucide-react';
import { PlayerProps } from '@/plugins/core/types';
import { CrosswordContent, CrosswordAnswer, CrosswordWord, CrosswordDirection } from './types';
import {
  buildCrosswordGridMap,
  coordKey,
  getNextCellInWord,
  getPrevCellInWord,
  getWordCells,
  isWordFilled,
  defaultCrosswordContent,
} from './crosswordUtils';
import { TactileButton } from '@/components/ui/TactileButton';
import { Badge } from '@/components/ui/Badge';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { cn } from '@/utils/cn';

const QWERTY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const CrosswordPlayer: React.FC<PlayerProps<CrosswordContent, CrosswordAnswer>> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect,
}) => {
  const { playTap, playPop, playCorrect, playWrong, playVictory } = useSoundEffect();

  const words = useMemo<CrosswordWord[]>(
    () => (content?.words && content.words.length > 0 ? content.words : defaultCrosswordContent.words),
    [content?.words]
  );

  const gridSize = useMemo(
    () => content?.gridSize || defaultCrosswordContent.gridSize,
    [content?.gridSize]
  );

  // Precompute grid map
  const { cellMap } = useMemo(
    () => buildCrosswordGridMap(gridSize, words),
    [gridSize, words]
  );

  // Student's entered answers: key `${row}-${col}` => uppercase letter
  const [answers, setAnswers] = useState<CrosswordAnswer>(() => {
    if (submittedAnswer && typeof submittedAnswer === 'object') {
      return submittedAnswer;
    }
    return {};
  });

  // Currently active word and cell focus
  const [activeWordId, setActiveWordId] = useState<number>(() => {
    return words[0]?.id ?? 1;
  });

  const [activeDirection, setActiveDirection] = useState<CrosswordDirection>(() => {
    return words[0]?.direction ?? 'ACROSS';
  });

  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>(() => {
    const firstWord = words[0];
    return firstWord ? { ...firstWord.startPos } : { row: 0, col: 0 };
  });

  // Track victory state
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [isAnswerValid, setIsAnswerValid] = useState(false);

  const effectiveIsCorrect =
    isCorrect !== null && isCorrect !== undefined ? isCorrect : isAnswerValid;
  const showFeedback = hasCheckedAnswer || (isCorrect !== null && isCorrect !== undefined);

  // Resolve active word
  const activeWord = useMemo(
    () => words.find((w) => w.id === activeWordId) || words[0],
    [words, activeWordId]
  );

  // Highlighted cells of currently selected word
  const activeWordCells = useMemo(() => {
    if (!activeWord) return new Set<string>();
    const cells = getWordCells(activeWord);
    return new Set(cells.map((c) => coordKey(c.row, c.col)));
  }, [activeWord]);

  // Keep active word and active direction in sync
  useEffect(() => {
    if (activeWord) {
      setActiveDirection(activeWord.direction);
    }
  }, [activeWord]);

  // Handle cell selection
  const handleSelectCell = useCallback(
    (row: number, col: number) => {
      const cell = cellMap.get(coordKey(row, col));
      if (!cell || cell.wordIds.length === 0) return;

      playTap();

      // Check if clicking currently active cell
      if (activeCell.row === row && activeCell.col === col) {
        // If this cell is an intersection between ACROSS and DOWN, toggle direction!
        if (cell.acrossWordId && cell.downWordId) {
          const nextDir: CrosswordDirection =
            activeDirection === 'ACROSS' ? 'DOWN' : 'ACROSS';
          const nextWordId =
            nextDir === 'ACROSS' ? cell.acrossWordId : cell.downWordId;
          setActiveDirection(nextDir);
          setActiveWordId(nextWordId);
          return;
        }
      }

      setActiveCell({ row, col });

      // Determine which word to activate
      if (activeDirection === 'ACROSS' && cell.acrossWordId) {
        setActiveWordId(cell.acrossWordId);
      } else if (activeDirection === 'DOWN' && cell.downWordId) {
        setActiveWordId(cell.downWordId);
      } else {
        // Switch to whichever word is available
        const wordId = cell.acrossWordId || cell.downWordId || cell.wordIds[0];
        const targetWord = words.find((w) => w.id === wordId);
        if (targetWord) {
          setActiveDirection(targetWord.direction);
          setActiveWordId(targetWord.id);
        }
      }
    },
    [cellMap, activeCell, activeDirection, words, playTap]
  );

  // Cycle to next / prev clue
  const handleNavigateClue = useCallback(
    (delta: number) => {
      playTap();
      const currentIndex = words.findIndex((w) => w.id === activeWordId);
      if (currentIndex === -1) return;
      let nextIndex = (currentIndex + delta + words.length) % words.length;
      const nextWord = words[nextIndex];
      if (nextWord) {
        setActiveWordId(nextWord.id);
        setActiveDirection(nextWord.direction);
        // Focus first unfilled cell of next word, or startPos
        const cells = getWordCells(nextWord);
        const firstUnfilled = cells.find((c) => !answers[coordKey(c.row, c.col)]);
        if (firstUnfilled) {
          setActiveCell({ row: firstUnfilled.row, col: firstUnfilled.col });
        } else {
          setActiveCell({ ...nextWord.startPos });
        }
      }
    },
    [words, activeWordId, answers, playTap]
  );

  // Handle typing a single letter (Auto-Advance)
  const handleTypeLetter = useCallback(
    (letter: string) => {
      const sanitized = letter.toUpperCase().replace(/[^A-Z]/g, '');
      if (!sanitized || !activeWord) return;

      const { row, col } = activeCell;
      const key = coordKey(row, col);

      // 1. Update answer state
      const nextAnswers = { ...answers, [key]: sanitized };
      setAnswers(nextAnswers);

      // Check if this letter completes the active word correctly
      const activeCells = getWordCells(activeWord);
      const isWordNowComplete = activeCells.every(
        (c) => (nextAnswers[coordKey(c.row, c.col)] || '').trim().length > 0
      );
      if (isWordNowComplete) {
        const studentWord = activeCells
          .map((c) => (nextAnswers[coordKey(c.row, c.col)] || '').trim().toUpperCase())
          .join('');
        if (studentWord === activeWord.word.toUpperCase()) {
          playCorrect();
        } else {
          playTap();
        }
      } else {
        playTap();
      }

      // 2. Auto-advance to next cell in current word
      const nextCell = getNextCellInWord(activeWord, row, col);
      if (nextCell) {
        setActiveCell(nextCell);
      } else {
        // Reached end of current word:
        // Try finding next word that has unfilled cells
        const otherWords = words.filter((w) => w.id !== activeWord.id);
        const nextUnfilledWord = otherWords.find((w) => !isWordFilled(w, nextAnswers));
        if (nextUnfilledWord) {
          const nextCells = getWordCells(nextUnfilledWord);
          const firstEmpty = nextCells.find((c) => !nextAnswers[coordKey(c.row, c.col)]);
          if (firstEmpty) {
            setActiveWordId(nextUnfilledWord.id);
            setActiveDirection(nextUnfilledWord.direction);
            setActiveCell({ row: firstEmpty.row, col: firstEmpty.col });
          }
        }
      }
    },
    [activeWord, activeCell, answers, words, playTap, playCorrect]
  );

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (!activeWord) return;
    playTap();

    const { row, col } = activeCell;
    const currentKey = coordKey(row, col);
    const currentValue = answers[currentKey];

    if (currentValue && currentValue.trim() !== '') {
      // Clear current cell and move back
      const nextAnswers = { ...answers };
      delete nextAnswers[currentKey];
      setAnswers(nextAnswers);

      const prevCell = getPrevCellInWord(activeWord, row, col);
      if (prevCell) {
        setActiveCell(prevCell);
      }
    } else {
      // Current cell is already empty: jump back and clear previous cell
      const prevCell = getPrevCellInWord(activeWord, row, col);
      if (prevCell) {
        const prevKey = coordKey(prevCell.row, prevCell.col);
        const nextAnswers = { ...answers };
        delete nextAnswers[prevKey];
        setAnswers(nextAnswers);
        setActiveCell(prevCell);
      }
    }
  }, [activeWord, activeCell, answers, playTap]);

  // Global physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key >= 'a' && e.key <= 'z') {
        e.preventDefault();
        handleTypeLetter(e.key.toUpperCase());
      } else if (e.key >= 'A' && e.key <= 'Z') {
        e.preventDefault();
        handleTypeLetter(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextCol = activeCell.col + 1;
        if (nextCol < gridSize.cols && cellMap.has(coordKey(activeCell.row, nextCol))) {
          handleSelectCell(activeCell.row, nextCol);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevCol = activeCell.col - 1;
        if (prevCol >= 0 && cellMap.has(coordKey(activeCell.row, prevCol))) {
          handleSelectCell(activeCell.row, prevCol);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextRow = activeCell.row + 1;
        if (nextRow < gridSize.rows && cellMap.has(coordKey(nextRow, activeCell.col))) {
          handleSelectCell(nextRow, activeCell.col);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevRow = activeCell.row - 1;
        if (prevRow >= 0 && cellMap.has(coordKey(prevRow, activeCell.col))) {
          handleSelectCell(prevRow, activeCell.col);
        }
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        handleNavigateClue(e.shiftKey ? -1 : 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTypeLetter,
    handleBackspace,
    handleNavigateClue,
    handleSelectCell,
    activeCell,
    gridSize,
    cellMap,
  ]);

  // Answer validation submission
  const handleSubmitCheck = () => {
    if (isEvaluating) return;
    playPop();
    // Validate whether all cells match target characters
    let allCorrect = true;

    cellMap.forEach((cell, key) => {
      const studentChar = (answers[key] || '').trim().toUpperCase();
      if (studentChar !== cell.char.toUpperCase()) {
        allCorrect = false;
      }
    });

    setHasCheckedAnswer(true);
    setIsAnswerValid(allCorrect);

    if (allCorrect) {
      playVictory();
    } else {
      playWrong();
    }

    onAnswerSubmit(answers);
  };

  // Reset grid answers
  const handleResetAnswers = () => {
    playTap();
    setAnswers({});
    setHasCheckedAnswer(false);
    setIsAnswerValid(false);
    if (words[0]) {
      setActiveWordId(words[0].id);
      setActiveDirection(words[0].direction);
      setActiveCell({ ...words[0].startPos });
    }
  };

  const acrossWords = useMemo(
    () => words.filter((w) => w.direction === 'ACROSS'),
    [words]
  );
  const downWords = useMemo(
    () => words.filter((w) => w.direction === 'DOWN'),
    [words]
  );

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 select-none text-duo-dark">
      {/* 1. ACTIVE CLUE BANNER (ABOVE THE GRID - USER REQUIREMENT) */}
      <div className="w-full mb-4">
        <div className="bg-white border-2 border-duo-gray border-b-4 border-b-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleNavigateClue(-1)}
            title="Petunjuk sebelumnya"
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-duo-dark transition-colors shrink-0 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 text-center px-2">
            <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
              <Badge variant="blue" className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                {activeDirection === 'ACROSS' ? (
                  <ArrowRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {activeWord?.number} {activeDirection === 'ACROSS' ? 'Mendatar' : 'Menurun'}
                </span>
              </Badge>
              <span className="text-xs font-bold text-slate-400">
                ({activeWord?.word?.length || 0} Huruf)
              </span>
            </div>

            <p className="text-sm sm:text-base font-black text-duo-dark line-clamp-2">
              {activeWord?.clue || 'Pilih kotak pada grid untuk melihat petunjuk kata.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleNavigateClue(1)}
            title="Petunjuk selanjutnya"
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-duo-dark transition-colors shrink-0 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. CROSSWORD INTERACTIVE GRID MATRIX */}
      <div className="flex flex-col items-center justify-center w-full my-2">
        <div
          className="p-3 bg-slate-100/90 rounded-3xl border-2 border-slate-200 shadow-inner inline-block"
          style={{
            maxWidth: '100%',
            overflowX: 'auto',
          }}
        >
          <div
            className="grid gap-1 sm:gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${gridSize.cols}, minmax(36px, 50px))`,
              gridTemplateRows: `repeat(${gridSize.rows}, minmax(36px, 50px))`,
            }}
          >
            {Array.from({ length: gridSize.rows }).map((_, r) =>
              Array.from({ length: gridSize.cols }).map((_, c) => {
                const key = coordKey(r, c);
                const cell = cellMap.get(key);
                const isOccupied = !!cell;
                const isCurrentActiveCell =
                  activeCell.row === r && activeCell.col === c;
                const isInActiveWord = activeWordCells.has(key);
                const userLetter = answers[key] || '';

                // Inactive / Black square in crossword
                if (!isOccupied) {
                  return (
                    <div
                      key={key}
                      className="aspect-square rounded-xl bg-slate-800/85 border border-slate-800 flex items-center justify-center opacity-90 shadow-2xs"
                    />
                  );
                }

                // Active Letter Cell
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectCell(r, c)}
                    className={cn(
                      'relative aspect-square rounded-xl flex items-center justify-center font-black select-none transition-all duration-150',
                      // Standard active cell appearance
                      'bg-white text-duo-dark border-2 border-slate-300 shadow-xs cursor-pointer',
                      // Active word row/col highlight (Light blue - User requirement)
                      isInActiveWord &&
                        !isCurrentActiveCell &&
                        'bg-blue-50/90 border-blue-300',
                      // Active focused cell (Strong blue outline & ring - User requirement)
                      isCurrentActiveCell &&
                        'bg-duo-blue-light border-duo-blue ring-3 ring-duo-blue/40 text-duo-dark z-20 scale-105 shadow-md',
                      // Feedback state after checking answer
                      hasCheckedAnswer &&
                        (userLetter.toUpperCase() === cell.char.toUpperCase()
                          ? 'border-duo-green bg-duo-green-light/40 text-duo-green-border'
                          : 'border-duo-red bg-duo-red-light/40 text-duo-red')
                    )}
                  >
                    {/* Clue index number at top-left corner (User requirement) */}
                    {cell.number !== undefined && (
                      <span className="absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-black text-slate-400 select-none pointer-events-none">
                        {cell.number}
                      </span>
                    )}

                    {/* Entered Letter */}
                    <span className="text-lg sm:text-xl font-black tracking-wider mt-1">
                      {userLetter}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. EVALUATION FEEDBACK BANNER */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={cn(
            'flex items-center justify-between p-4 rounded-2xl border-2 w-full max-w-xl my-3 shadow-xs',
            effectiveIsCorrect
              ? 'bg-duo-green-light/60 border-duo-green text-duo-dark'
              : 'bg-duo-red-light/60 border-duo-red text-duo-dark'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0',
                effectiveIsCorrect ? 'bg-duo-green' : 'bg-duo-red'
              )}
            >
              {effectiveIsCorrect ? <Sparkles className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider">
                {effectiveIsCorrect ? 'Luar Biasa! Semua Benar!' : 'Periksa Kembali Kotakmu!'}
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {effectiveIsCorrect
                  ? 'Selamat! Kamu berhasil memecahkan teka-teki silang dengan sempurna.'
                  : 'Beberapa kotak huruf masih belum tepat. Coba telusuri kembali petunjuknya!'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isEvaluating}
            onClick={handleResetAnswers}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-duo-dark hover:bg-slate-50 transition-colors shrink-0 ml-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ulangi</span>
          </button>
        </motion.div>
      )}

      {/* 4. ACTION BUTTONS ROW */}
      <div className="flex items-center justify-center gap-3 w-full max-w-xl my-2">
        <TactileButton
          type="button"
          variant="green"
          size="md"
          isLoading={isEvaluating}
          disabled={isEvaluating}
          onClick={handleSubmitCheck}
          className="flex-1 justify-center py-2.5"
        >
          <Check className="w-4 h-4 mr-1.5" />
          <span>Periksa Jawaban TTS</span>
        </TactileButton>

        <button
          type="button"
          disabled={isEvaluating}
          onClick={handleResetAnswers}
          title="Kosongkan jawaban"
          className="px-3.5 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-black text-xs flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* 5. ON-SCREEN TOUCH KEYBOARD (Mobile & Classroom Touchscreen friendly) */}
      <div className="flex flex-col items-center gap-1.5 w-full max-w-xl pt-2 pb-3">
        {QWERTY_ROWS.map((row, rowIdx) => (
          <div key={`kbd-row-${rowIdx}`} className="flex justify-center gap-1 sm:gap-1.5 w-full">
            {row.map((letter) => (
              <button
                key={`k-${letter}`}
                type="button"
                onClick={() => handleTypeLetter(letter)}
                className="min-w-[28px] sm:min-w-[40px] min-h-[40px] sm:min-h-[44px] flex-1 max-w-[44px] rounded-xl font-black text-xs sm:text-sm select-none transition-all flex items-center justify-center bg-white text-duo-dark border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 shadow-xs cursor-pointer"
              >
                {letter}
              </button>
            ))}

            {/* Backspace on the 3rd row */}
            {rowIdx === 2 && (
              <button
                type="button"
                onClick={handleBackspace}
                title="Hapus huruf (Backspace)"
                className="min-w-[42px] sm:min-w-[54px] min-h-[40px] sm:min-h-[44px] flex-1 max-w-[56px] rounded-xl font-black text-xs sm:text-sm select-none transition-all flex items-center justify-center bg-slate-100 text-duo-dark border-2 border-slate-300 border-b-4 border-b-slate-400 hover:bg-slate-200 active:translate-y-0.5 active:border-b-2 shadow-xs cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 6. CLUES OVERVIEW DRAWER (MENDATAR & MENURUN LISTS) */}
      <div className="w-full max-w-3xl mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {/* Across Clues List */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            <ArrowRight className="w-3.5 h-3.5 text-duo-blue" />
            <span>Mendatar (Across)</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            {acrossWords.map((word) => {
              const isFilled = isWordFilled(word, answers);
              const isActive = activeWordId === word.id && activeDirection === 'ACROSS';

              return (
                <button
                  key={`across-${word.id}`}
                  type="button"
                  onClick={() => {
                    playTap();
                    setActiveWordId(word.id);
                    setActiveDirection('ACROSS');
                    const cells = getWordCells(word);
                    const firstEmpty = cells.find((c) => !answers[coordKey(c.row, c.col)]);
                    setActiveCell(firstEmpty ? { row: firstEmpty.row, col: firstEmpty.col } : { ...word.startPos });
                  }}
                  className={cn(
                    'p-2 rounded-xl text-left transition-all flex items-start gap-2 border-2',
                    isActive
                      ? 'bg-duo-blue-light/60 border-duo-blue text-duo-dark'
                      : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-700'
                  )}
                >
                  <span className="w-5 h-5 rounded-md bg-white border border-slate-200 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {word.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-snug line-clamp-2">
                      {word.clue}
                    </p>
                  </div>
                  {isFilled && (
                    <CheckCircle2 className="w-4 h-4 text-duo-green shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Down Clues List */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            <ArrowDown className="w-3.5 h-3.5 text-duo-blue" />
            <span>Menurun (Down)</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            {downWords.map((word) => {
              const isFilled = isWordFilled(word, answers);
              const isActive = activeWordId === word.id && activeDirection === 'DOWN';

              return (
                <button
                  key={`down-${word.id}`}
                  type="button"
                  onClick={() => {
                    playTap();
                    setActiveWordId(word.id);
                    setActiveDirection('DOWN');
                    const cells = getWordCells(word);
                    const firstEmpty = cells.find((c) => !answers[coordKey(c.row, c.col)]);
                    setActiveCell(firstEmpty ? { row: firstEmpty.row, col: firstEmpty.col } : { ...word.startPos });
                  }}
                  className={cn(
                    'p-2 rounded-xl text-left transition-all flex items-start gap-2 border-2',
                    isActive
                      ? 'bg-duo-blue-light/60 border-duo-blue text-duo-dark'
                      : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-700'
                  )}
                >
                  <span className="w-5 h-5 rounded-md bg-white border border-slate-200 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {word.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-snug line-clamp-2">
                      {word.clue}
                    </p>
                  </div>
                  {isFilled && (
                    <CheckCircle2 className="w-4 h-4 text-duo-green shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
