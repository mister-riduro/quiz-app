import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Delete,
  Keyboard,
  X,
} from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import {
  CrosswordContent,
  CrosswordAnswer,
  CrosswordWord,
  CrosswordDirection,
} from "./types";
import {
  buildCrosswordGridMap,
  coordKey,
  getNextCellInWord,
  getPrevCellInWord,
  getWordCells,
  isWordFilled,
  getStudentWord,
  defaultCrosswordContent,
} from "./crosswordUtils";
import { Badge } from "@/components/ui/Badge";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

const QWERTY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export const CrosswordPlayer: React.FC<
  PlayerProps<CrosswordContent, CrosswordAnswer>
> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect,
}) => {
  const { playTap, playCorrect, playVictory } = useSoundEffect();

  const words = useMemo<CrosswordWord[]>(
    () =>
      content?.words && content.words.length > 0
        ? content.words
        : defaultCrosswordContent.words,
    [content?.words],
  );

  const gridSize = useMemo(
    () => content?.gridSize || defaultCrosswordContent.gridSize,
    [content?.gridSize],
  );

  // Precompute grid map
  const { cellMap } = useMemo(
    () => buildCrosswordGridMap(gridSize, words),
    [gridSize, words],
  );

  // Student's entered answers: key `${row}-${col}` => uppercase letter
  const [answers, setAnswers] = useState<CrosswordAnswer>(() => {
    if (submittedAnswer && typeof submittedAnswer === "object") {
      return submittedAnswer;
    }
    return {};
  });

  // Sync submitted answer when provided/updated (e.g. Teacher Unlock)
  useEffect(() => {
    if (submittedAnswer && typeof submittedAnswer === "object") {
      setAnswers(submittedAnswer);
    }
  }, [submittedAnswer]);

  // Currently active word and cell focus
  const [activeWordId, setActiveWordId] = useState<number>(() => {
    return words[0]?.id ?? 1;
  });

  const [activeDirection, setActiveDirection] = useState<CrosswordDirection>(
    () => {
      return words[0]?.direction ?? "ACROSS";
    },
  );

  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>(
    () => {
      const firstWord = words[0];
      return firstWord ? { ...firstWord.startPos } : { row: 0, col: 0 };
    },
  );

  // Floating keyboard state (only shown when explicitly clicked by user)
  const [showFloatingKeyboard, setShowFloatingKeyboard] = useState(false);

  // Track victory state
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [isAnswerValid, setIsAnswerValid] = useState(false);

  const effectiveIsCorrect =
    isCorrect !== null && isCorrect !== undefined ? isCorrect : isAnswerValid;
  const showFeedback =
    hasCheckedAnswer || (isCorrect !== null && isCorrect !== undefined);

  // Check whether all target words and cells are completely and correctly filled
  const checkIsAllCorrect = useCallback(
    (currentAnswers: CrosswordAnswer): boolean => {
      if (!words || words.length === 0 || cellMap.size === 0) return false;

      // 1. Verify every word matches its target word
      for (const word of words) {
        const studentWord = getStudentWord(word, currentAnswers);
        const targetWord = (word.word || "").trim().toUpperCase();
        if (!studentWord || studentWord !== targetWord) {
          return false;
        }
      }

      // 2. Verify all active cells in grid have matching characters
      for (const [key, cell] of cellMap.entries()) {
        const studentChar = (currentAnswers[key] || "").trim().toUpperCase();
        if (!studentChar || studentChar !== cell.char.toUpperCase()) {
          return false;
        }
      }

      return true;
    },
    [words, cellMap],
  );

  // Count how many words are correctly solved
  const correctWordsCount = useMemo(() => {
    let count = 0;
    words.forEach((w) => {
      const studentWord = getStudentWord(w, answers);
      const targetWord = (w.word || "").trim().toUpperCase();
      if (studentWord === targetWord && targetWord.length > 0) {
        count++;
      }
    });
    return count;
  }, [words, answers]);

  const hasAutoSubmittedRef = useRef(false);

  // Reset auto-submitted flag when content changes
  useEffect(() => {
    hasAutoSubmittedRef.current = false;
  }, [content]);

  // Automatically trigger celebration and prompt when all words are correct!
  useEffect(() => {
    if (hasAutoSubmittedRef.current || isEvaluating || effectiveIsCorrect)
      return;

    if (words.length > 0 && checkIsAllCorrect(answers)) {
      hasAutoSubmittedRef.current = true;
      setHasCheckedAnswer(true);
      setIsAnswerValid(true);
      playVictory();

      // Smooth delay (400ms) to allow the final letter to render and sound to chime
      const timer = setTimeout(() => {
        onAnswerSubmit(answers);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [
    answers,
    words,
    checkIsAllCorrect,
    isEvaluating,
    effectiveIsCorrect,
    onAnswerSubmit,
    playVictory,
  ]);

  // Resolve active word
  const activeWord = useMemo(
    () => words.find((w) => w.id === activeWordId) || words[0],
    [words, activeWordId],
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
            activeDirection === "ACROSS" ? "DOWN" : "ACROSS";
          const nextWordId =
            nextDir === "ACROSS" ? cell.acrossWordId : cell.downWordId;
          setActiveDirection(nextDir);
          setActiveWordId(nextWordId);
          return;
        }
      }

      setActiveCell({ row, col });

      // Determine which word to activate
      if (activeDirection === "ACROSS" && cell.acrossWordId) {
        setActiveWordId(cell.acrossWordId);
      } else if (activeDirection === "DOWN" && cell.downWordId) {
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
    [cellMap, activeCell, activeDirection, words, playTap],
  );

  // Handle direct selection of a word from Across / Down list
  const handleSelectWord = useCallback(
    (word: CrosswordWord) => {
      playTap();
      setActiveWordId(word.id);
      setActiveDirection(word.direction);
      const cells = getWordCells(word);
      const firstEmpty = cells.find((c) => !answers[coordKey(c.row, c.col)]);
      setActiveCell(
        firstEmpty
          ? { row: firstEmpty.row, col: firstEmpty.col }
          : { ...word.startPos },
      );
    },
    [answers, playTap],
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
        const firstUnfilled = cells.find(
          (c) => !answers[coordKey(c.row, c.col)],
        );
        if (firstUnfilled) {
          setActiveCell({ row: firstUnfilled.row, col: firstUnfilled.col });
        } else {
          setActiveCell({ ...nextWord.startPos });
        }
      }
    },
    [words, activeWordId, answers, playTap],
  );

  // Handle typing a single letter (Auto-Advance)
  const handleTypeLetter = useCallback(
    (letter: string) => {
      const sanitized = letter.toUpperCase().replace(/[^A-Z]/g, "");
      if (!sanitized || !activeWord) return;

      const { row, col } = activeCell;
      const key = coordKey(row, col);

      // Reset check state on new input so student can correct mistakes smoothly
      if (hasCheckedAnswer && !effectiveIsCorrect) {
        setHasCheckedAnswer(false);
      }

      // 1. Update answer state
      const nextAnswers = { ...answers, [key]: sanitized };
      setAnswers(nextAnswers);

      // Check if this letter completes the active word correctly
      const activeCells = getWordCells(activeWord);
      const isWordNowComplete = activeCells.every(
        (c) => (nextAnswers[coordKey(c.row, c.col)] || "").trim().length > 0,
      );
      if (isWordNowComplete) {
        const studentWord = activeCells
          .map((c) =>
            (nextAnswers[coordKey(c.row, c.col)] || "").trim().toUpperCase(),
          )
          .join("");
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
        const nextUnfilledWord = otherWords.find(
          (w) => !isWordFilled(w, nextAnswers),
        );
        if (nextUnfilledWord) {
          const nextCells = getWordCells(nextUnfilledWord);
          const firstEmpty = nextCells.find(
            (c) => !nextAnswers[coordKey(c.row, c.col)],
          );
          if (firstEmpty) {
            setActiveWordId(nextUnfilledWord.id);
            setActiveDirection(nextUnfilledWord.direction);
            setActiveCell({ row: firstEmpty.row, col: firstEmpty.col });
          }
        }
      }
    },
    [activeWord, activeCell, answers, words, playTap, playCorrect],
  );

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (!activeWord) return;
    playTap();

    // Reset check state on backspace
    if (hasCheckedAnswer && !effectiveIsCorrect) {
      setHasCheckedAnswer(false);
    }

    const { row, col } = activeCell;
    const currentKey = coordKey(row, col);
    const currentValue = answers[currentKey];

    if (currentValue && currentValue.trim() !== "") {
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
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Ignore modifier combinations (Ctrl, Alt, Meta)
      if (e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      // Explicitly reject Tab and Alt
      if (e.key === "Tab" || e.key === "Alt") {
        e.preventDefault();
        return;
      }

      // Only letters (a-z, A-Z) are accepted into the block
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleTypeLetter(e.key.toUpperCase());
        return;
      }

      // Backspace is accepted exclusively to delete / erase
      if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // Delete key clears current cell
      if (e.key === "Delete") {
        e.preventDefault();
        const { row, col } = activeCell;
        const currentKey = coordKey(row, col);
        if (answers[currentKey]) {
          const nextAnswers = { ...answers };
          delete nextAnswers[currentKey];
          setAnswers(nextAnswers);
        }
        return;
      }

      // Prevent Space or Enter from triggering random focused button click or page scroll
      if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
        e.preventDefault();
        return;
      }

      // Arrow keys navigation
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextCol = activeCell.col + 1;
        if (
          nextCol < gridSize.cols &&
          cellMap.has(coordKey(activeCell.row, nextCol))
        ) {
          handleSelectCell(activeCell.row, nextCol);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevCol = activeCell.col - 1;
        if (prevCol >= 0 && cellMap.has(coordKey(activeCell.row, prevCol))) {
          handleSelectCell(activeCell.row, prevCol);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextRow = activeCell.row + 1;
        if (
          nextRow < gridSize.rows &&
          cellMap.has(coordKey(nextRow, activeCell.col))
        ) {
          handleSelectCell(nextRow, activeCell.col);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevRow = activeCell.row - 1;
        if (prevRow >= 0 && cellMap.has(coordKey(prevRow, activeCell.col))) {
          handleSelectCell(prevRow, activeCell.col);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleTypeLetter,
    handleBackspace,
    handleSelectCell,
    activeCell,
    answers,
    gridSize,
    cellMap,
  ]);

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
    () => words.filter((w) => w.direction === "ACROSS"),
    [words],
  );
  const downWords = useMemo(
    () => words.filter((w) => w.direction === "DOWN"),
    [words],
  );

  const acrossCompletedCount = useMemo(() => {
    return acrossWords.filter((w) => {
      const studentWord = getStudentWord(w, answers);
      const targetWord = (w.word || "").trim().toUpperCase();
      return studentWord === targetWord && targetWord.length > 0;
    }).length;
  }, [acrossWords, answers]);

  const downCompletedCount = useMemo(() => {
    return downWords.filter((w) => {
      const studentWord = getStudentWord(w, answers);
      const targetWord = (w.word || "").trim().toUpperCase();
      return studentWord === targetWord && targetWord.length > 0;
    }).length;
  }, [downWords, answers]);

  return (
    <div className="flex flex-col items-center w-full mx-auto select-none text-duo-dark">
      {/* MAIN 2-COLUMN CROSSWORD CONTAINER (Matching User Screenshot) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* LEFT COLUMN: Active Clue Bar + Grid + Action Controls */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center gap-3 w-full">
          {/* 1. ACTIVE CLUE BANNER (Original Duo Styling) */}
          <div className="w-full bg-white border-2 border-duo-gray border-b-4 border-b-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleNavigateClue(-1)}
              title="Petunjuk sebelumnya"
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-duo-dark transition-colors shrink-0 active:scale-95 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0 text-center px-2">
              <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                <Badge
                  variant="blue"
                  className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  {activeDirection === "ACROSS" ? (
                    <ArrowRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {activeWord?.number}{" "}
                    {activeDirection === "ACROSS" ? "Mendatar" : "Menurun"}
                  </span>
                </Badge>
                <span className="text-xs font-bold text-slate-400">
                  ({activeWord?.word?.length || 0} Huruf)
                </span>
              </div>

              <p className="text-base sm:text-lg font-black text-duo-dark line-clamp-2">
                {activeWord?.clue ||
                  "Pilih kotak pada grid untuk melihat petunjuk kata."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleNavigateClue(1)}
              title="Petunjuk selanjutnya"
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-duo-dark transition-colors shrink-0 active:scale-95 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 2. CROSSWORD INTERACTIVE GRID MATRIX (Original Duo Styling) */}
          <div className="w-full flex justify-center overflow-x-auto p-1">
            <div
              className="p-3 bg-slate-100/90 rounded-3xl border-2 border-slate-200 shadow-inner inline-block"
              style={{
                maxWidth: "100%",
                overflowX: "auto",
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
                    const userLetter = answers[key] || "";

                    // Inactive / Black square in crossword (Original Duo tile)
                    if (!isOccupied) {
                      return (
                        <div
                          key={key}
                          className="aspect-square rounded-xl bg-slate-800/85 border border-slate-800 flex items-center justify-center opacity-90 shadow-2xs"
                        />
                      );
                    }

                    // Active Letter Cell (Original Duo Styling)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectCell(r, c)}
                        className={cn(
                          "relative aspect-square rounded-xl flex items-center justify-center font-black select-none transition-all duration-150 cursor-pointer",
                          // Standard active cell appearance
                          "bg-white text-duo-dark border-2 border-slate-300 shadow-xs",
                          // Active word row/col highlight (Light blue - Original Duo styling)
                          isInActiveWord &&
                            !isCurrentActiveCell &&
                            "bg-blue-50/90 border-blue-300",
                          // Active focused cell (Strong blue outline & ring - Original Duo styling)
                          isCurrentActiveCell &&
                            "bg-duo-blue-light border-duo-blue ring-3 ring-duo-blue/40 text-duo-dark z-20 scale-105 shadow-md",
                          // Feedback state after checking answer
                          hasCheckedAnswer &&
                            (userLetter.toUpperCase() ===
                            cell.char.toUpperCase()
                              ? "border-duo-green bg-duo-green-light/40 text-duo-green-border"
                              : "border-duo-red bg-duo-red-light/40 text-duo-red"),
                        )}
                      >
                        {/* Clue index number at top-left corner */}
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
                  }),
                )}
              </div>
            </div>
          </div>

          {/* 3. EVALUATION FEEDBACK BANNER (Original Duo Styling) */}
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 w-full max-w-xl my-2 shadow-xs",
                effectiveIsCorrect
                  ? "bg-duo-green-light/60 border-duo-green text-duo-dark"
                  : "bg-duo-red-light/60 border-duo-red text-duo-dark",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0",
                    effectiveIsCorrect ? "bg-duo-green" : "bg-duo-red",
                  )}
                >
                  {effectiveIsCorrect ? (
                    <Sparkles className="w-5 h-5" />
                  ) : (
                    <HelpCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider">
                    {effectiveIsCorrect
                      ? "Luar Biasa! Semua Benar!"
                      : "Periksa Kembali Kotakmu!"}
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    {effectiveIsCorrect
                      ? "Selamat! Kamu berhasil memecahkan teka-teki silang dengan sempurna."
                      : `${correctWordsCount} dari ${words.length} kata sudah tepat. Periksa kembali kotak huruf yang masih keliru!`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isEvaluating}
                onClick={handleResetAnswers}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-duo-dark hover:bg-slate-50 transition-colors shrink-0 ml-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi</span>
              </button>
            </motion.div>
          )}

          {/* 4. ACTION CONTROLS ROW */}
          <div className="flex items-center justify-center gap-3 w-full max-w-sm my-2">
            <button
              type="button"
              disabled={isEvaluating || effectiveIsCorrect}
              onClick={handleResetAnswers}
              title="Kosongkan seluruh jawaban teka-teki silang"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 hover:bg-slate-50 text-slate-700 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset Jawaban</span>
            </button>

            {/* Floating Keyboard Toggle Option */}
            <button
              type="button"
              onClick={() => {
                playTap();
                setShowFloatingKeyboard((prev) => !prev);
              }}
              title={
                showFloatingKeyboard
                  ? "Sembunyikan Keyboard Virtual"
                  : "Tampilkan Keyboard Virtual"
              }
              className={cn(
                "flex-1 px-4 py-2.5 rounded-2xl border-2 border-b-4 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:translate-y-0.5 active:border-b-2",
                showFloatingKeyboard
                  ? "bg-duo-blue text-white border-duo-blue shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              )}
            >
              <Keyboard className="w-4 h-4" />
              <span>Keyboard Virtual</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Across & Down Clue Panels (Original Duo Styling) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4 w-full">
          {/* Card 1: Across Clues */}
          <div className="bg-white border-2 border-duo-gray border-b-4 border-b-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-600">
                <ArrowRight className="w-4 h-4 text-duo-blue" />
                <span>Mendatar (Across)</span>
              </div>
              <Badge variant="gray" className="font-black text-[10px]">
                {acrossCompletedCount}/{acrossWords.length} Selesai
              </Badge>
            </div>

            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[250px] lg:max-h-[290px] pr-1 scrollbar-thin">
              {acrossWords.map((word) => {
                const isActive =
                  activeWordId === word.id && activeDirection === "ACROSS";
                const studentWord = getStudentWord(word, answers);
                const targetWord = (word.word || "").trim().toUpperCase();
                const isWordCorrect =
                  studentWord === targetWord && targetWord.length > 0;
                const isFilled = isWordFilled(word, answers);

                return (
                  <button
                    key={`across-${word.id}`}
                    type="button"
                    onClick={() => handleSelectWord(word)}
                    className={cn(
                      "p-2.5 sm:p-3 rounded-xl text-left transition-all flex items-start gap-2.5 sm:gap-3 border-2 cursor-pointer",
                      isActive
                        ? "bg-duo-blue-light/60 border-duo-blue text-duo-dark shadow-xs"
                        : isWordCorrect
                          ? "bg-emerald-50/50 border-emerald-200 text-duo-dark"
                          : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-700",
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-[10px] font-black text-xs flex items-center justify-center shrink-0 mt-0.5",
                        isWordCorrect
                          ? "bg-duo-green text-white border-0 shadow-xs"
                          : "bg-white border border-slate-200 text-duo-dark",
                      )}
                    >
                      {word.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-[15px] font-bold leading-snug line-clamp-2">
                        {word.clue}
                      </p>
                    </div>
                    {isWordCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-duo-green shrink-0 mt-0.5" />
                    ) : isFilled && hasCheckedAnswer ? (
                      <span className="text-[10px] font-black text-duo-red shrink-0 mt-0.5 uppercase">
                        Keliru
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Down Clues */}
          <div className="bg-white border-2 border-duo-gray border-b-4 border-b-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-600">
                <ArrowDown className="w-4 h-4 text-duo-blue" />
                <span>Menurun (Down)</span>
              </div>
              <Badge variant="gray" className="font-black text-[10px]">
                {downCompletedCount}/{downWords.length} Selesai
              </Badge>
            </div>

            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[250px] lg:max-h-[290px] pr-1 scrollbar-thin">
              {downWords.map((word) => {
                const isActive =
                  activeWordId === word.id && activeDirection === "DOWN";
                const studentWord = getStudentWord(word, answers);
                const targetWord = (word.word || "").trim().toUpperCase();
                const isWordCorrect =
                  studentWord === targetWord && targetWord.length > 0;
                const isFilled = isWordFilled(word, answers);

                return (
                  <button
                    key={`down-${word.id}`}
                    type="button"
                    onClick={() => handleSelectWord(word)}
                    className={cn(
                      "p-2.5 sm:p-3 rounded-xl text-left transition-all flex items-start gap-2.5 sm:gap-3 border-2 cursor-pointer",
                      isActive
                        ? "bg-duo-blue-light/60 border-duo-blue text-duo-dark shadow-xs"
                        : isWordCorrect
                          ? "bg-emerald-50/50 border-emerald-200 text-duo-dark"
                          : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-700",
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-[10px] font-black text-xs flex items-center justify-center shrink-0 mt-0.5",
                        isWordCorrect
                          ? "bg-duo-green text-white border-0 shadow-xs"
                          : "bg-white border border-slate-200 text-duo-dark",
                      )}
                    >
                      {word.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-[15px] font-bold leading-snug line-clamp-2">
                        {word.clue}
                      </p>
                    </div>
                    {isWordCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-duo-green shrink-0 mt-0.5" />
                    ) : isFilled && hasCheckedAnswer ? (
                      <span className="text-[10px] font-black text-duo-red shrink-0 mt-0.5 uppercase">
                        Keliru
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. FLOATING VIRTUAL KEYBOARD (Shown on block touch or toggled) */}
      <AnimatePresence>
        {showFloatingKeyboard && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg bg-white/95 backdrop-blur-md border-2 border-slate-300 rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col items-center gap-2 select-none"
          >
            {/* Header / Dismiss Toolbar */}
            <div className="w-full flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-black">
                <Keyboard className="w-4 h-4 text-duo-blue" />
                <span>Keyboard Virtual</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  Hanya Huruf A-Z
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowFloatingKeyboard(false)}
                title="Tutup Keyboard"
                className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QWERTY Letter Rows (Only Letters & Backspace with Duo tactile styling) */}
            <div className="flex flex-col items-center gap-1.5 w-full pt-1">
              {QWERTY_ROWS.map((row, rowIdx) => (
                <div
                  key={`float-kbd-row-${rowIdx}`}
                  className="flex justify-center gap-1 sm:gap-1.5 w-full"
                >
                  {row.map((letter) => (
                    <button
                      key={`float-k-${letter}`}
                      type="button"
                      onClick={() => handleTypeLetter(letter)}
                      className="min-w-[28px] sm:min-w-[36px] min-h-[38px] sm:min-h-[42px] flex-1 max-w-[42px] rounded-xl font-black text-xs sm:text-sm select-none transition-all flex items-center justify-center bg-white text-duo-dark border-2 border-slate-200 border-b-4 hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 shadow-2xs cursor-pointer"
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
                      className="min-w-[40px] sm:min-w-[50px] min-h-[38px] sm:min-h-[42px] flex-1 max-w-[52px] rounded-xl font-black text-xs sm:text-sm select-none transition-all flex items-center justify-center bg-slate-100 text-duo-dark border-2 border-slate-300 border-b-4 hover:bg-slate-200 active:translate-y-0.5 active:border-b-2 shadow-2xs cursor-pointer"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
