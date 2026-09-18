import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Reorder, motion } from "framer-motion";
import {
  Shuffle,
  HelpCircle,
  Check,
  Sparkles,
  MoveHorizontal,
} from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import { AnagramContent, AnagramAnswer } from "./types";
import { TactileButton } from "@/components/ui/TactileButton";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

interface AnagramTile {
  id: string;
  letter: string;
}

export const AnagramPlayer: React.FC<
  PlayerProps<AnagramContent, AnagramAnswer>
> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect,
}) => {
  const { playTap, playPop, playCorrect, playWrong } = useSoundEffect();

  const targetWord = useMemo(
    () => (content.targetWord || "MATAHARI").toUpperCase().trim(),
    [content.targetWord],
  );
  const hint = content.hint;

  // Scramble helper that ensures result differs from targetWord if possible
  const scrambleTiles = useCallback(
    (tiles: AnagramTile[]): AnagramTile[] => {
      if (tiles.length <= 1) return tiles;
      const copy = [...tiles];
      let attempts = 0;
      do {
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        attempts++;
      } while (
        copy.map((t) => t.letter).join("") === targetWord &&
        attempts < 10
      );
      return copy;
    },
    [targetWord],
  );

  // State for draggable reorderable tiles
  const [items, setItems] = useState<AnagramTile[]>([]);

  // Initialize or reset tiles
  useEffect(() => {
    const chars = targetWord.split("").filter(Boolean);
    const initialTiles: AnagramTile[] = chars.map((char, index) => ({
      id: `tile-${char}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      letter: char,
    }));

    if (submittedAnswer) {
      // If already answered, align according to submittedAnswer
      const answerChars = submittedAnswer.toUpperCase().split("");
      const pool = [...initialTiles];
      const arranged: AnagramTile[] = [];

      answerChars.forEach((c) => {
        const foundIdx = pool.findIndex((p) => p.letter === c);
        if (foundIdx !== -1) {
          arranged.push(pool[foundIdx]!);
          pool.splice(foundIdx, 1);
        }
      });
      // Append any leftovers
      arranged.push(...pool);
      setItems(arranged);
    } else {
      setItems(scrambleTiles(initialTiles));
    }
  }, [targetWord, submittedAnswer, scrambleTiles]);

  // Audio feedback on evaluation
  useEffect(() => {
    if (isCorrect === true) {
      playCorrect();
    } else if (isCorrect === false) {
      playWrong();
    }
  }, [isCorrect, playCorrect, playWrong]);

  const isAnswered = submittedAnswer !== undefined;
  const isInteractionDisabled = isEvaluating || isAnswered;

  // Shuffle button handler
  const handleShuffle = () => {
    if (isInteractionDisabled) return;
    playPop();
    setItems((prev) => scrambleTiles(prev));
  };

  // Submit assembled word
  const currentWord = items.map((i) => i.letter).join("");

  const handleSubmit = () => {
    if (isInteractionDisabled) return;
    playTap();
    onAnswerSubmit(currentWord);
  };

  // Tile visual state styling
  const getTileStyle = (index: number, letter: string) => {
    if (!isAnswered) {
      return "bg-white text-duo-dark border-duo-gray border-b-duo-gray-border border-r-duo-gray-border hover:bg-slate-50";
    }
    if (isCorrect === true) {
      return "bg-duo-green-light text-duo-green-border border-duo-green border-b-duo-green-border border-r-duo-green-border ring-2 ring-duo-green/30";
    }
    if (isCorrect === false) {
      const isCharMatchingTarget = letter === targetWord[index];
      if (isCharMatchingTarget) {
        return "bg-duo-green-light text-duo-green-border border-duo-green border-b-duo-green-border border-r-duo-green-border ring-2 ring-duo-green/30";
      }
      return "bg-duo-red-light text-duo-red-border border-duo-red border-b-duo-red-border border-r-duo-red-border ring-2 ring-duo-red/30";
    }
    return "bg-duo-blue-light text-duo-blue-border border-duo-blue border-b-duo-blue-border border-r-duo-blue-border";
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-4 px-2 select-none">
      {/* Optional Media Image */}
      {content.mediaUrl && !(content as any)._hideMedia && (
        <div className="flex justify-center w-full mb-5">
          <img
            src={content.mediaUrl}
            alt="Petunjuk Gambar"
            className="max-h-56 sm:max-h-64 w-auto object-contain rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-sm"
          />
        </div>
      )}

      {/* Hint / Context Clue */}
      {hint && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-duo-blue-light/50 border border-duo-blue/30 rounded-2xl mb-6 text-duo-blue-border font-bold text-sm sm:text-base text-center max-w-lg">
          <HelpCircle className="w-5 h-5 shrink-0" />
          <span>{hint}</span>
        </div>
      )}

      {/* Title & Gesture Instruction */}
      <div className="flex flex-col items-center gap-1.5 mb-6 text-center">
        <h3 className="text-xl sm:text-2xl font-black text-duo-dark">
          Tukar & Susun Kembali Balok Huruf
        </h3>
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <MoveHorizontal className="w-4 h-4 text-duo-blue" />
          <span>
            Tahan dan geser ubin secara horizontal untuk mengubah urutan
          </span>
        </p>
      </div>

      {/* Header Bar with Shuffle Button */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Kata Saat Ini:
          </span>
          <span className="font-mono font-black text-base text-duo-blue tracking-widest bg-duo-blue-light/40 px-2.5 py-0.5 rounded-lg border border-duo-blue/20">
            {currentWord}
          </span>
        </div>

        {!isAnswered && items.length > 1 && (
          <TactileButton
            type="button"
            variant="outline"
            size="sm"
            disabled={isInteractionDisabled}
            onClick={handleShuffle}
            icon={<Shuffle className="w-3.5 h-3.5 text-duo-blue" />}
            className="text-xs font-black border-2 border-slate-200"
          >
            Acak Ulang
          </TactileButton>
        )}
      </div>

      {/* Reorderable Horizontal 3D Tile Container */}
      <Reorder.Group
        axis="x"
        values={items}
        onReorder={(newOrder) => {
          if (isInteractionDisabled) return;
          playPop();
          setItems(newOrder);
        }}
        as="div"
        className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-2.5 sm:gap-3.5 p-6 bg-white border-2 border-slate-200 border-b-4 rounded-3xl w-full shadow-sm min-h-[115px] overflow-hidden"
      >
        {items.map((item, index) => (
          <Reorder.Item
            key={item.id}
            value={item}
            as="div"
            dragListener={!isInteractionDisabled}
            whileHover={
              !isInteractionDisabled ? { scale: 1.05, y: -2 } : undefined
            }
            whileDrag={{
              scale: 1.15,
              y: -8,
              boxShadow: "0 16px 30px -4px rgba(0, 0, 0, 0.2)",
              zIndex: 50,
            }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 24,
              mass: 0.8,
            }}
            className={cn(
              "relative flex flex-col items-center justify-center font-black select-none transition-colors duration-150",
              "min-w-[50px] h-[64px] sm:min-w-[64px] sm:h-[78px] px-3 sm:px-4 rounded-2xl border-2 border-b-4 border-r-2 shadow-sm",
              !isInteractionDisabled
                ? "cursor-grab active:cursor-grabbing touch-none"
                : "cursor-default",
              getTileStyle(index, item.letter),
            )}
          >
            <span className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
              {item.letter}
            </span>
            <span className="text-[10px] sm:text-xs font-bold opacity-60 -mt-1">
              {index + 1}
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Action Button: Periksa Jawaban */}
      <div className="w-full mt-8 sm:mt-10">
        <TactileButton
          type="button"
          variant="green"
          size="lg"
          fullWidth
          disabled={isInteractionDisabled}
          onClick={handleSubmit}
          className="py-4 text-lg font-black tracking-wider shadow-md"
        >
          {isAnswered ? "Jawaban Terkirim" : "Periksa Jawaban"}
        </TactileButton>
      </div>

      {/* Post-submission Educational Feedback Banner */}
      {isAnswered && (
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
              <Check className="w-6 h-6" strokeWidth={3} />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">
              {isCorrect
                ? "Anagram Berhasil Dipecahkan!"
                : "Susunan Kata Belum Tepat"}
            </h4>
            <p className="text-sm font-bold mt-0.5">
              {isCorrect
                ? `Luar biasa! Susunan kata "${targetWord}" kamu 100% akurat.`
                : `Kata target yang benar adalah: "${targetWord}".`}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
