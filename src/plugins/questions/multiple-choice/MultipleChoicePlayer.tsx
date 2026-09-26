import React, { useMemo, useState, useEffect } from "react";
import { Check } from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import {
  MultipleChoiceContent,
  MultipleChoiceAnswer,
  MultipleChoiceOption,
} from "./types";
import {
  TactileButton,
  OptionTile,
  OptionTileState,
  SectionDivider,
} from "@/components/ui";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import { DuoMathRenderer } from "@/components/common/DuoMathRenderer";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

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
            className="max-h-60 sm:max-h-72 w-auto object-contain rounded-[16px] border-2 border-slate-200 bg-white p-1.5 shadow-xs"
          />
        </div>
      )}

      {/* 2. Optional Statement / Question Prompt */}
      {content.statement && !(content as any)._hideStatement && (
        <h2 className="text-xl sm:text-2xl font-bold text-center text-duo-dark leading-snug tracking-tight px-3 mb-6 sm:mb-8">
          <DuoMathRenderer content={content.statement} />
        </h2>
      )}

      {/* Multi-Select Instruction Badge */}
      {isMultiSelect && !isAnswered && (
        <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-duo-green/10 border border-duo-green/20 text-duo-green-border text-xs font-bold uppercase tracking-wider">
          <span>Pilih {targetCorrectIds.length} Jawaban yang Benar</span>
        </div>
      )}

      {/* Signature Airlearn Section Divider */}
      <SectionDivider
        label={
          isMultiSelect
            ? "PILIH SEMUA JAWABAN YANG BENAR"
            : "PILIH JAWABAN YANG TEPAT"
        }
        className="max-w-xl my-4"
      />

      {/* 3. Interactive Choice Cards Grid */}
      <div
        className={cn(
          "grid gap-3.5 sm:gap-4 w-full",
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

          let tileState: OptionTileState = "idle";
          let rightElement: React.ReactNode = undefined;

          if (isAnswered) {
            if (isSelected) {
              tileState =
                isCorrect === true || isThisCorrect ? "correct" : "wrong";
            } else if (isThisCorrect) {
              tileState = "idle";
              rightElement = (
                <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-duo-green-border uppercase tracking-wider bg-emerald-100/90 px-2 py-0.5 rounded-[8px] border border-duo-green/40">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Kunci</span>
                </div>
              );
            } else {
              tileState = "disabled";
            }
          } else if (isMultiSelect) {
            if (isSelected) {
              tileState = "selected";
            }
            rightElement = (
              <div
                className={cn(
                  "w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 transition-all",
                  isSelected
                    ? "bg-duo-green border-0 text-white shadow-2xs"
                    : "border-2 border-slate-300 bg-white group-hover:border-slate-400",
                )}
              >
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                )}
              </div>
            );
          }

          const isFifthSpan = displayOptions.length === 5 && idx === 4;

          return (
            <div
              key={opt.id}
              className={cn("w-full", isFifthSpan && "sm:col-span-2")}
            >
              <OptionTile
                label={
                  <span className="block text-base sm:text-lg font-bold tracking-tight leading-snug break-words">
                    {opt.text ? (
                      <DuoMathRenderer content={opt.text} />
                    ) : (
                      `Pilihan ${letter}`
                    )}
                  </span>
                }
                prefix={letter}
                state={tileState}
                disabled={isEvaluating || isAnswered}
                onClick={() => handleOptionClick(opt.id)}
                rightElement={rightElement}
                className={cn(
                  isAnswered &&
                    !isSelected &&
                    isThisCorrect &&
                    "border-duo-green bg-emerald-50/40",
                )}
              />
            </div>
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
