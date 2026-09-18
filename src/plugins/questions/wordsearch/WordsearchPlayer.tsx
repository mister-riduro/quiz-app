import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Check,
  Sparkles,
  RotateCcw,
  Search,
  CheckCircle2,
} from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import { WordsearchContent, WordsearchAnswer } from "./types";
import { TactileButton } from "@/components/ui/TactileButton";
import {
  generateWordsearchGrid,
  PASTEL_PALETTES,
  PastelPalette,
} from "./wordsearchGenerator";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

interface GridCellCoord {
  row: number;
  col: number;
}

interface LockedCapsule {
  word: string;
  cells: GridCellCoord[];
  palette: PastelPalette;
}

interface WordsearchCellProps {
  char: string;
  row: number;
  col: number;
  isSelected: boolean;
  lockedPalette?: PastelPalette;
  onCellPointerDown: (
    e: React.PointerEvent<HTMLDivElement>,
    row: number,
    col: number,
  ) => void;
}

const WordsearchCell = React.memo<WordsearchCellProps>(
  ({ char, row, col, isSelected, lockedPalette, onCellPointerDown }) => {
    return (
      <div
        onPointerDown={(e) => onCellPointerDown(e, row, col)}
        style={{
          backgroundColor: isSelected
            ? "#1CB0F6"
            : lockedPalette
              ? lockedPalette.bg
              : "#FFFFFF",
          color: isSelected
            ? "#FFFFFF"
            : lockedPalette
              ? lockedPalette.text
              : "#3C3C3C",
          borderColor: isSelected
            ? "#1899D6"
            : lockedPalette
              ? lockedPalette.border
              : "#E5E5E5",
        }}
        className={cn(
          "aspect-square rounded-xl sm:rounded-2xl border-2 flex items-center justify-center",
          "font-black text-sm sm:text-lg transition-transform duration-75 select-none cursor-pointer",
          isSelected && "scale-105 z-10 shadow-md ring-2 ring-duo-blue/40",
          lockedPalette && !isSelected && "shadow-2xs font-extrabold",
          !lockedPalette &&
            !isSelected &&
            "hover:bg-slate-50 active:scale-95 shadow-2xs",
        )}
      >
        <span className="drop-shadow-xs">{char}</span>
      </div>
    );
  },
);
WordsearchCell.displayName = "WordsearchCell";

export const WordsearchPlayer: React.FC<
  PlayerProps<WordsearchContent, WordsearchAnswer>
> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect,
}) => {
  const { playTap, playPop, playCorrect, playWrong, playVictory } =
    useSoundEffect();

  const targetWords = useMemo(
    () =>
      (content.words || ["KUCING", "ANJING", "BURUNG"]).map((w) =>
        w.trim().toUpperCase(),
      ),
    [content.words],
  );
  const hint = content.hint;

  // Grid matrix (10x10)
  const grid = useMemo(() => {
    if (content.grid && content.grid.length === 10) {
      return content.grid;
    }
    // Fallback generate if grid missing in content
    const fallback = generateWordsearchGrid(
      targetWords,
      10,
      content.allowDiagonal ?? false,
    );
    return fallback.grid;
  }, [content.grid, targetWords, content.allowDiagonal]);

  // State: Found words list
  const [foundWords, setFoundWords] = useState<string[]>([]);
  // State: Locked highlighter capsules
  const [lockedCapsules, setLockedCapsules] = useState<LockedCapsule[]>([]);

  // State: Active drag selection
  const [isDragging, setIsDragging] = useState(false);
  const [activeSelection, setActiveSelection] = useState<GridCellCoord[]>([]);

  const gridRef = useRef<HTMLDivElement>(null);

  // Restore submitted answer if present
  useEffect(() => {
    if (
      submittedAnswer &&
      Array.isArray(submittedAnswer) &&
      submittedAnswer.length > 0
    ) {
      setFoundWords(submittedAnswer);

      if (content.placements && content.placements.length > 0) {
        const capsules: LockedCapsule[] = [];
        content.placements.forEach((p, idx) => {
          if (submittedAnswer.includes(p.word)) {
            const dr = p.endRow - p.startRow;
            const dc = p.endCol - p.startCol;
            const steps = Math.max(Math.abs(dr), Math.abs(dc));
            const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
            const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
            const cells: GridCellCoord[] = [];
            for (let i = 0; i <= steps; i++) {
              cells.push({
                row: p.startRow + i * stepR,
                col: p.startCol + i * stepC,
              });
            }
            const palette = PASTEL_PALETTES[idx % PASTEL_PALETTES.length]!;
            capsules.push({ word: p.word, cells, palette });
          }
        });
        if (capsules.length > 0) {
          setLockedCapsules(capsules);
        }
      }
    } else {
      setFoundWords([]);
      setLockedCapsules([]);
    }
  }, [submittedAnswer, content.placements]);

  // Play audio on evaluation
  useEffect(() => {
    if (isCorrect === true) {
      playCorrect();
    } else if (isCorrect === false) {
      playWrong();
    }
  }, [isCorrect, playCorrect, playWrong]);

  const isAnswered = submittedAnswer !== undefined && isCorrect === true;
  const isInteractionDisabled = isEvaluating || isCorrect === true;

  const hasAutoSubmittedRef = useRef(false);

  // Reset auto-submitted flag when content changes
  useEffect(() => {
    hasAutoSubmittedRef.current = false;
  }, [content]);

  // Automatically trigger victory celebration and submit prompt when all target words are found!
  useEffect(() => {
    if (hasAutoSubmittedRef.current || isEvaluating || isCorrect === true)
      return;

    if (targetWords.length > 0 && foundWords.length >= targetWords.length) {
      hasAutoSubmittedRef.current = true;
      playVictory();

      // Smooth 400ms delay so the final capsule highlight finishes before bottom sheet prompt appears
      const timer = setTimeout(() => {
        onAnswerSubmit(foundWords);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [
    foundWords,
    targetWords,
    isEvaluating,
    isCorrect,
    onAnswerSubmit,
    playVictory,
  ]);

  /**
   * Helper: Convert client (X, Y) to Grid (row, col) in O(1) time
   */
  const getCellFromCoordinates = useCallback(
    (clientX: number, clientY: number): GridCellCoord | null => {
      const container = gridRef.current;
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }

      const col = Math.floor(((clientX - rect.left) / rect.width) * 10);
      const row = Math.floor(((clientY - rect.top) / rect.height) * 10);

      if (row >= 0 && row < 10 && col >= 0 && col < 10) {
        return { row, col };
      }
      return null;
    },
    [],
  );

  /**
   * Helper: Calculate valid straight line cells from start to current
   */
  const getLineCells = useCallback(
    (start: GridCellCoord, current: GridCellCoord): GridCellCoord[] => {
      const dr = current.row - start.row;
      const dc = current.col - start.col;

      // Check if valid horizontal, vertical, or diagonal line
      const isHorizontal = dr === 0;
      const isVertical = dc === 0;
      const isDiagonal = Math.abs(dr) === Math.abs(dc);

      if (!isHorizontal && !isVertical && !isDiagonal) {
        // Not a straight line, return just start
        return [start];
      }

      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
      const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

      const cells: GridCellCoord[] = [];
      for (let i = 0; i <= steps; i++) {
        cells.push({
          row: start.row + i * stepR,
          col: start.col + i * stepC,
        });
      }
      return cells;
    },
    [],
  );

  /**
   * 1. Start Swipe / Drag on Cell
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, row: number, col: number) => {
      if (isInteractionDisabled) return;
      e.preventDefault();

      setIsDragging(true);
      const startCoord = { row, col };
      setActiveSelection([startCoord]);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const cell = getCellFromCoordinates(
          moveEvent.clientX,
          moveEvent.clientY,
        );
        if (!cell) return;

        const path = getLineCells(startCoord, cell);
        setActiveSelection(path);
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);

        setIsDragging(false);

        // Verify selected word
        setActiveSelection((currentPath) => {
          if (currentPath.length >= 2) {
            const forwardWord = currentPath
              .map((c) => grid[c.row]?.[c.col] || "")
              .join("");
            const backwardWord = forwardWord.split("").reverse().join("");

            // Check if matches any unfound target word
            const matchedTarget = targetWords.find(
              (w) =>
                (w === forwardWord || w === backwardWord) &&
                !foundWords.includes(w),
            );

            if (matchedTarget) {
              playPop();
              const paletteIdx = foundWords.length % PASTEL_PALETTES.length;
              const palette = PASTEL_PALETTES[paletteIdx]!;

              setFoundWords((prev) => {
                if (prev.includes(matchedTarget)) return prev;
                return [...prev, matchedTarget];
              });

              setLockedCapsules((prev) => [
                ...prev,
                { word: matchedTarget, cells: currentPath, palette },
              ]);
            }
          }
          return [];
        });
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [
      isInteractionDisabled,
      getCellFromCoordinates,
      getLineCells,
      grid,
      targetWords,
      foundWords,
      playPop,
      playVictory,
    ],
  );

  /**
   * Color lookup map for locked cells
   */
  const lockedCellMap = useMemo(() => {
    const map = new Map<string, PastelPalette>();
    lockedCapsules.forEach((capsule) => {
      capsule.cells.forEach((cell) => {
        map.set(`${cell.row},${cell.col}`, capsule.palette);
      });
    });
    return map;
  }, [lockedCapsules]);

  // Active selection coordinates set for fast lookup
  const activeSelectionKeySet = useMemo(() => {
    const set = new Set<string>();
    activeSelection.forEach((c) => set.add(`${c.row},${c.col}`));
    return set;
  }, [activeSelection]);

  // Selected string currently being swiped
  const activeSelectedWord = useMemo(() => {
    if (activeSelection.length <= 1) return "";
    return activeSelection.map((c) => grid[c.row]?.[c.col] || "").join("");
  }, [activeSelection, grid]);

  /**
   * Reset found words
   */
  const handleReset = () => {
    if (isInteractionDisabled || foundWords.length === 0) return;
    playPop();
    setFoundWords([]);
    setLockedCapsules([]);
  };

  /**
   * Submit Answer
   */
  const isAllFound =
    targetWords.length > 0 && foundWords.length >= targetWords.length;

  const handleSubmit = useCallback(() => {
    if (isEvaluating || isCorrect === true) return;
    playTap();
    onAnswerSubmit(foundWords);
  }, [isEvaluating, isCorrect, foundWords, playTap, onAnswerSubmit]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-4 px-2 select-none">
      {/* Hint / Context Clue */}
      {hint && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-duo-blue-light/50 border border-duo-blue/30 rounded-2xl mb-6 text-duo-blue-border font-bold text-sm sm:text-base text-center max-w-lg">
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span>{hint}</span>
        </div>
      )}

      {/* Title & Instructions */}
      <div className="flex flex-col items-center gap-1.5 mb-5 text-center">
        <h3 className="text-xl sm:text-2xl font-black text-duo-dark">
          Temukan Semua Kata Tersembunyi
        </h3>
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Search className="w-4 h-4 text-duo-blue" />
          <span>Tarik garis (swipe) dari huruf awal ke huruf akhir kata</span>
        </p>
      </div>

      {/* Active Swipe Preview Pill */}
      <div className="h-8 flex items-center justify-center mb-2">
        <AnimatePresence>
          {activeSelectedWord && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="px-3.5 py-1 rounded-full bg-duo-blue text-white font-black text-xs sm:text-sm tracking-widest shadow-md flex items-center gap-1"
            >
              <span>{activeSelectedWord}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Container: Grid + Sidebar Checklist */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT/CENTER: 10x10 Matrix Grid */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            ref={gridRef}
            className={cn(
              "relative grid grid-cols-10 gap-1 sm:gap-1.5 p-3 sm:p-5 rounded-3xl border-2 border-slate-200 border-b-4",
              "bg-slate-100 shadow-sm max-w-[450px] w-full aspect-square touch-none select-none",
              isDragging ? "cursor-crosshair" : "cursor-pointer",
            )}
          >
            {grid.map((row, rIdx) =>
              row.map((char, cIdx) => {
                const cellKey = `${rIdx},${cIdx}`;
                const lockedPalette = lockedCellMap.get(cellKey);
                const isSelected = activeSelectionKeySet.has(cellKey);

                return (
                  <WordsearchCell
                    key={cellKey}
                    char={char}
                    row={rIdx}
                    col={cIdx}
                    isSelected={isSelected}
                    lockedPalette={lockedPalette}
                    onCellPointerDown={handlePointerDown}
                  />
                );
              }),
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar Word Checklist */}
        <div className="lg:col-span-4 flex flex-col gap-3.5 bg-white p-5 rounded-3xl border-2 border-slate-200 border-b-4 shadow-sm w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Daftar Kata Target
            </span>
            <span className="text-xs font-extrabold text-duo-blue bg-duo-blue-light/50 px-2.5 py-0.5 rounded-lg border border-duo-blue/20">
              {foundWords.length} / {targetWords.length} Ditemukan
            </span>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-2">
            {targetWords.map((word) => {
              const isFound = foundWords.includes(word);
              const capsule = lockedCapsules.find((c) => c.word === word);
              const palette = capsule?.palette;

              return (
                <motion.div
                  key={word}
                  layout
                  style={{
                    backgroundColor:
                      isFound && palette ? palette.bg : "#F8FAFC",
                    borderColor:
                      isFound && palette ? palette.border : "#E2E8F0",
                  }}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 transition-all shadow-2xs",
                    isFound ? "border-solid" : "border-dashed",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs transition-colors",
                        isFound
                          ? "bg-duo-green text-white shadow-2xs"
                          : "bg-slate-200 text-slate-400",
                      )}
                    >
                      {isFound ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="font-bold text-[10px]">•</span>
                      )}
                    </div>
                    <span
                      style={{
                        color: isFound && palette ? palette.text : "#3C3C3C",
                      }}
                      className={cn(
                        "text-sm font-black tracking-wide",
                        isFound && "line-through opacity-80",
                      )}
                    >
                      {word}
                    </span>
                  </div>

                  {isFound && (
                    <span className="text-[10px] font-black uppercase text-duo-green tracking-wider ml-1">
                      Ketemu!
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Reset button */}
          {!isAnswered && foundWords.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 flex items-center justify-center gap-1.5 text-xs font-black text-slate-400 hover:text-duo-red transition-colors py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mulai Ulang Pencarian</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Button: Periksa Jawaban */}
      <div className="w-full mt-8 sm:mt-10">
        <TactileButton
          type="button"
          variant="green"
          size="lg"
          fullWidth
          disabled={isEvaluating || isCorrect === true}
          onClick={handleSubmit}
          className="py-4 text-lg font-black tracking-wider shadow-md"
        >
          {isCorrect === true || isAllFound
            ? "Semua Kata Berhasil Ditemukan!"
            : `Periksa Jawaban (${foundWords.length}/${targetWords.length} Kata)`}
        </TactileButton>
      </div>

      {/* Post-submission Educational Feedback Banner */}
      {isCorrect !== undefined && isCorrect !== null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-6 p-4 sm:p-5 rounded-2xl border-2 flex items-center gap-3.5 w-full text-left",
            isCorrect
              ? "bg-duo-green-light/60 border-duo-green text-duo-dark"
              : "bg-duo-red-light/60 border-duo-red text-duo-dark",
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
              isCorrect ? "bg-duo-green text-white" : "bg-duo-red text-white",
            )}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">
              {isCorrect
                ? "Semua Kata Berhasil Ditemukan!"
                : "Pencarian Belum Lengkap"}
            </h4>
            <p className="text-sm font-bold mt-0.5">
              {isCorrect
                ? `Luar biasa! Kamu berhasil menemukan seluruh ${targetWords.length} kata yang bersembunyi dalam kotak.`
                : `Kamu menemukan ${foundWords.length} dari ${targetWords.length} kata. Masih ada kata yang belum terlacak!`}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
