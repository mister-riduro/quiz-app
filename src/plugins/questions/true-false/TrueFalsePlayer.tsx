import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { PlayerProps } from "@/plugins/core/types";
import { TrueFalseContent, TrueFalseAnswer } from "./types";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import { DuoMathRenderer } from "@/components/common/DuoMathRenderer";

export const TrueFalsePlayer: React.FC<
  PlayerProps<TrueFalseContent, TrueFalseAnswer>
> = ({ content, submittedAnswer, onAnswerSubmit, isEvaluating = false }) => {
  const { playTap } = useSoundEffect();

  const handleChoice = (choice: boolean) => {
    if (isEvaluating || submittedAnswer !== undefined) return;
    playTap();
    onAnswerSubmit(choice);
  };

  const isAnswered = submittedAnswer !== undefined;
  const isSelectedTrue = submittedAnswer === true;
  const isSelectedFalse = submittedAnswer === false;

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-2">
      {/* 1. Image Media (if present: center, rounded-2xl, border 2px) */}
      {content.mediaUrl && !(content as any)._hideMedia && (
        <div className="flex justify-center w-full mb-6">
          <img
            src={content.mediaUrl}
            alt="Media Soal"
            className="max-h-64 sm:max-h-72 w-auto object-contain rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-sm"
          />
        </div>
      )}

      {/* 2. Statement Text (Large: text-2xl font-bold text-center) */}
      {!(content as any)._hideStatement &&
        Boolean(content.statement || (content as any).titlePrompt) && (
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-duo-dark leading-snug tracking-tight px-3 mb-8 sm:mb-10">
            <DuoMathRenderer
              content={content.statement || (content as any).titlePrompt}
            />
          </h2>
        )}

      {/* 3. Two Massive 3D Choice Cards (Enlarged for Kids & Classrooms) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full">
        {/* Kiri: Kartu Hijau masif dengan ikon centang tebal ("BENAR") */}
        <motion.button
          type="button"
          disabled={isEvaluating || isAnswered}
          onClick={() => handleChoice(true)}
          whileHover={
            !isAnswered && !isEvaluating ? { scale: 1.04, y: -4 } : undefined
          }
          whileTap={
            !isAnswered && !isEvaluating ? { scale: 0.93, y: 6 } : undefined
          }
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 18,
            mass: 0.8,
          }}
          className={cn(
            "group relative flex flex-col items-center justify-center gap-4 sm:gap-6 py-10 sm:py-14 md:py-16 px-6 rounded-3xl",
            "border-2 border-duo-green-border",
            "bg-duo-green text-white select-none cursor-pointer",
            "transition-colors duration-150",
            // Active ring when selected
            isSelectedTrue &&
              "ring-4 ring-offset-4 ring-duo-green-border scale-[1.02]",
            // Dimmed if another card was chosen
            isAnswered &&
              !isSelectedTrue &&
              "opacity-40 filter grayscale-[0.4] cursor-default",
            // Disabled state
            (isEvaluating || isAnswered) && "cursor-default",
          )}
        >
          {/* Thick Checkmark Icon */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Check
              className="w-12 h-12 sm:w-18 sm:h-18 text-white"
              strokeWidth={4}
            />
          </div>

          <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-wider uppercase text-white drop-shadow-sm">
            BENAR
          </span>
        </motion.button>

        {/* Kanan: Kartu Merah masif dengan ikon silang tebal ("SALAH") */}
        <motion.button
          type="button"
          disabled={isEvaluating || isAnswered}
          onClick={() => handleChoice(false)}
          whileHover={
            !isAnswered && !isEvaluating ? { scale: 1.02 } : undefined
          }
          whileTap={!isAnswered && !isEvaluating ? { scale: 0.97 } : undefined}
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 18,
            mass: 0.8,
          }}
          className={cn(
            "group relative flex flex-col items-center justify-center gap-4 sm:gap-6 py-10 sm:py-14 md:py-16 px-6 rounded-3xl",
            "border-2 border-duo-red-border",
            "bg-duo-red text-white select-none cursor-pointer",
            "transition-colors duration-150",
            // Active ring when selected
            isSelectedFalse &&
              "ring-4 ring-offset-4 ring-duo-red-border scale-[1.02]",
            // Dimmed if another card was chosen
            isAnswered &&
              !isSelectedFalse &&
              "opacity-40 filter grayscale-[0.4] cursor-default",
            // Disabled state
            (isEvaluating || isAnswered) && "cursor-default",
          )}
        >
          {/* Thick Cross Icon */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <X
              className="w-12 h-12 sm:w-18 sm:h-18 text-white"
              strokeWidth={4}
            />
          </div>

          <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-wider uppercase text-white drop-shadow-sm">
            SALAH
          </span>
        </motion.button>
      </div>
    </div>
  );
};
