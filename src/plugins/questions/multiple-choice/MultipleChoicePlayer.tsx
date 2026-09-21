import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import {
  MultipleChoiceContent,
  MultipleChoiceAnswer,
  MultipleChoiceOption,
} from "./types";
import { TactileButton } from "@/components/ui/TactileButton";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

// Palette for Option Letter Badges (Tier 1: rounded-xl, high-contrast)
const OPTION_BADGE_THEMES = [
  {
    bg: "bg-duo-blue text-white border-duo-blue-border",
    badgeActive: "bg-white text-duo-blue",
  },
  {
    bg: "bg-duo-green text-white border-duo-green-border",
    badgeActive: "bg-white text-duo-green",
  },
  {
    bg: "bg-duo-orange text-white border-duo-orange-border",
    badgeActive: "bg-white text-duo-orange",
  },
  {
    bg: "bg-purple-500 text-white border-purple-600",
    badgeActive: "bg-white text-purple-600",
  },
  {
    bg: "bg-rose-500 text-white border-rose-600",
    badgeActive: "bg-white text-rose-600",
  },
];

// Seeded/stable array shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const MultipleChoicePlayer: React.FC<
  PlayerProps<MultipleChoiceContent, MultipleChoiceAnswer>
> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
  isCorrect = null,
}) => {
  const { playTap } = useSoundEffect();

  // Target correct IDs
  const targetCorrectIds = useMemo<string[]>(() => {
    if (
      Array.isArray(content.correctOptionIds) &&
      content.correctOptionIds.length > 0
    ) {
      return content.correctOptionIds;
    }
    if (content.correctOptionId) {
      return [content.correctOptionId];
    }
    return [];
  }, [content.correctOptionIds, content.correctOptionId]);

  const isMultiSelect = targetCorrectIds.length > 1;

  // Local selection state (for multi-select before submission)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (Array.isArray(submittedAnswer)) {
      return submittedAnswer;
    }
    if (typeof submittedAnswer === "string" && submittedAnswer) {
      return [submittedAnswer];
    }
    return [];
  });

  // Sync when submittedAnswer is updated externally (e.g. teacher unlock answer)
  useEffect(() => {
    if (submittedAnswer !== undefined) {
      if (Array.isArray(submittedAnswer)) {
        setSelectedIds(submittedAnswer);
      } else if (typeof submittedAnswer === "string") {
        setSelectedIds([submittedAnswer]);
      }
    } else {
      setSelectedIds([]);
    }
  }, [submittedAnswer]);

  // Stable display options (randomize if requested)
  const displayOptions = useMemo<MultipleChoiceOption[]>(() => {
    const rawOptions = (content.options || []).slice(0, 5);
    if (content.randomizeOrder) {
      return shuffleArray(rawOptions);
    }
    return rawOptions;
  }, [content.options, content.randomizeOrder]);

  const isAnswered = submittedAnswer !== undefined;

  const handleOptionClick = (optionId: string) => {
    if (isEvaluating || isAnswered) return;
    playTap();

    if (isMultiSelect) {
      setSelectedIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelectedIds([optionId]);
      onAnswerSubmit(optionId);
    }
  };

  const handleMultiSubmit = () => {
    if (isEvaluating || isAnswered || selectedIds.length === 0) return;
    playTap();
    onAnswerSubmit(selectedIds);
  };

  // Keyboard shortcut listener (1-5 or A-E, and Enter/Space for multi-select)
  useEffect(() => {
    if (isEvaluating || isAnswered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (
        isMultiSelect &&
        (e.key === "Enter" || e.key === " ") &&
        selectedIds.length > 0
      ) {
        e.preventDefault();
        handleMultiSubmit();
        return;
      }

      const key = e.key.toUpperCase();
      let selectedIdx = -1;

      if (key === "1" || key === "A") selectedIdx = 0;
      else if (key === "2" || key === "B") selectedIdx = 1;
      else if (key === "3" || key === "C") selectedIdx = 2;
      else if (key === "4" || key === "D") selectedIdx = 3;
      else if (key === "5" || key === "E") selectedIdx = 4;

      if (selectedIdx >= 0 && selectedIdx < displayOptions.length) {
        e.preventDefault();
        handleOptionClick(displayOptions[selectedIdx].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayOptions, isAnswered, isEvaluating, isMultiSelect, selectedIds]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-2">
      {/* 1. Optional Supporting Media */}
      {content.mediaUrl && !(content as any)._hideMedia && (
        <div className="flex justify-center w-full mb-6">
          <img
            src={content.mediaUrl}
            alt="Media Soal"
            className="max-h-60 sm:max-h-72 w-auto object-contain rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-sm"
          />
        </div>
      )}

      {/* 2. Optional Statement / Question Prompt */}
      {content.statement && !(content as any)._hideStatement && (
        <h2 className="text-xl sm:text-2xl font-bold text-center text-duo-dark leading-snug tracking-tight px-3 mb-6 sm:mb-8">
          {content.statement}
        </h2>
      )}

      {/* Multi-Select Instruction Badge */}
      {isMultiSelect && !isAnswered && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-duo-blue/10 border border-duo-blue/20 text-duo-blue text-xs font-black uppercase tracking-wider">
          <span>Pilih {targetCorrectIds.length} Jawaban yang Benar</span>
        </div>
      )}

      {/* 3. Interactive Choice Cards Grid */}
      <div
        className={cn(
          "grid gap-4 w-full",
          displayOptions.length <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : displayOptions.length === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {displayOptions.map((opt, idx) => {
          const letter = OPTION_LETTERS[idx] || String(idx + 1);
          const isSelected = selectedIds.includes(opt.id);
          const isThisCorrect = targetCorrectIds.includes(opt.id);
          const badgeTheme =
            OPTION_BADGE_THEMES[idx % OPTION_BADGE_THEMES.length];

          // Determine card style based on state
          let cardStyle =
            "bg-white text-duo-dark border-duo-gray border-b-duo-gray-border border-r-duo-gray-border hover:bg-slate-50/90 hover:border-slate-300";
          let badgeStyle = badgeTheme.bg;

          if (isAnswered) {
            if (isSelected) {
              if (isCorrect === true || isThisCorrect) {
                cardStyle =
                  "bg-duo-green text-white border-duo-green-border border-b-duo-green-border border-r-duo-green-border ring-4 ring-duo-green/30 scale-[1.02] shadow-md";
                badgeStyle = badgeTheme.badgeActive;
              } else {
                cardStyle =
                  "bg-duo-red text-white border-duo-red-border border-b-duo-red-border border-r-duo-red-border ring-4 ring-duo-red/30 scale-[1.02] shadow-md";
                badgeStyle = badgeTheme.badgeActive;
              }
            } else if (isThisCorrect) {
              // Highlight the real correct answer softly when student missed it
              cardStyle =
                "bg-emerald-50 text-duo-green-border border-duo-green border-b-duo-green-border border-r-duo-green-border ring-2 ring-duo-green/40";
              badgeStyle = "bg-duo-green text-white border-duo-green-border";
            } else {
              cardStyle =
                "bg-slate-50/70 text-slate-400 border-slate-200 border-b-slate-200 opacity-50 filter grayscale-[0.3]";
              badgeStyle = "bg-slate-200 text-slate-500 border-slate-300";
            }
          } else if (isMultiSelect && isSelected) {
            // Selected in multi-select mode before submission
            cardStyle =
              "bg-duo-blue-light/70 text-duo-dark border-duo-blue border-b-duo-blue-border border-r-duo-blue-border ring-2 ring-duo-blue/30 scale-[1.01]";
            badgeStyle = badgeTheme.bg;
          }

          const isFifthSpan = displayOptions.length === 5 && idx === 4;

          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={isEvaluating || isAnswered}
              onClick={() => handleOptionClick(opt.id)}
              whileHover={
                !isAnswered && !isEvaluating
                  ? { scale: 1.02, y: -3 }
                  : undefined
              }
              whileTap={
                !isAnswered && !isEvaluating ? { scale: 0.97, y: 2 } : undefined
              }
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 20,
                mass: 0.8,
              }}
              className={cn(
                "group relative flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl text-left select-none transition-colors duration-150 cursor-pointer shadow-xs",
                "border-2 border-b-4 border-r-2 border-solid",
                "active:border-b-2 active:translate-y-[2px]",
                cardStyle,
                isFifthSpan && "sm:col-span-2",
                (isEvaluating || isAnswered) && "cursor-default",
              )}
            >
              {/* Option Letter Badge (Tier 1: rounded-xl) */}
              <div
                className={cn(
                  "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl border-b-2 shrink-0 shadow-2xs transition-transform group-hover:scale-105",
                  badgeStyle,
                )}
              >
                {letter}
              </div>

              {/* Option Label Text */}
              <div className="flex-1 min-w-0">
                <span className="block text-base sm:text-lg font-black tracking-tight leading-snug break-words">
                  {opt.text || `Pilihan ${letter}`}
                </span>
              </div>

              {/* Multi-Select Square Checkbox Icon */}
              {isMultiSelect && !isAnswered && (
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? "bg-duo-blue border-duo-blue text-white shadow-2xs"
                      : "border-slate-300 bg-white group-hover:border-slate-400",
                  )}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 text-white stroke-[3.5]" />
                  )}
                </div>
              )}

              {/* Status Icons on Evaluation */}
              {isAnswered && isSelected && (
                <div className="shrink-0 flex items-center justify-center">
                  {isThisCorrect ? (
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white stroke-[3.5]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                      <X className="w-5 h-5 text-white stroke-[3.5]" />
                    </div>
                  )}
                </div>
              )}

              {/* Indicator if student missed this correct answer */}
              {isAnswered && !isSelected && isThisCorrect && (
                <div className="shrink-0 flex items-center gap-1 text-xs font-black text-duo-green uppercase tracking-wider bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Kunci</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Multi-Select Action Button: Periksa Jawaban */}
      {isMultiSelect && (
        <div className="w-full mt-6 max-w-md">
          <TactileButton
            type="button"
            variant="green"
            size="lg"
            fullWidth
            disabled={selectedIds.length === 0 || isEvaluating || isAnswered}
            onClick={handleMultiSubmit}
            className="py-4 text-base sm:text-lg font-black tracking-wider shadow-md"
          >
            {isAnswered
              ? "Jawaban Terkirim"
              : selectedIds.length > 0
                ? `Periksa Jawaban (${selectedIds.length} Dipilih)`
                : "Pilih Jawaban Terlebih Dahulu"}
          </TactileButton>
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-slate-400 text-xs font-bold">
        <span>Tekan tombol</span>
        {displayOptions.map((_, idx) => (
          <kbd
            key={idx}
            className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-600"
          >
            {OPTION_LETTERS[idx]}
          </kbd>
        ))}
        <span>
          {isMultiSelect
            ? "lalu tekan Enter / klik tombol periksa"
            : "atau klik kartu untuk menjawab"}
        </span>
      </div>
    </div>
  );
};
