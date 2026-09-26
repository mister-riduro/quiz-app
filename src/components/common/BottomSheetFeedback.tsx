import React, { useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import { TactileButton } from "@/components/ui/TactileButton";
import { DuoMathRenderer } from "./DuoMathRenderer";

export interface BottomSheetFeedbackProps {
  isOpen: boolean;
  isCorrect: boolean;
  title?: string;
  message?: string;
  solutionExplanation?: string;
  onAction: () => void;
  actionText?: string;
  className?: string;
}

const CORRECT_TITLES = [
  "Luar Biasa!",
  "Hebat Sekali!",
  "Pekerjaan Mengagumkan!",
  "Tepat Sekali!",
  "Fantastis!",
];

const WRONG_TITLES = [
  "Jawaban Belum Tepat",
  "Perhatikan Kembali!",
  "Hampir Saja!",
  "Jangan Menyerah!",
];

export const BottomSheetFeedback: React.FC<BottomSheetFeedbackProps> = ({
  isOpen,
  isCorrect,
  title,
  message,
  solutionExplanation,
  onAction,
  actionText,
  className,
}) => {
  const { playTap } = useSoundEffect();

  // Randomize motivational header if not explicitly provided
  const headerTitle = useMemo(() => {
    if (title) return title;
    const pool = isCorrect ? CORRECT_TITLES : WRONG_TITLES;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }, [title, isCorrect, isOpen]);

  // Confetti trigger on correct answer
  useEffect(() => {
    if (isOpen && isCorrect) {
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.8 },
          colors: ["#58CC02", "#22C55E", "#1CB0F6", "#FFC800", "#FF4B4B"],
        });
      } catch (err) {
        // Safe fallback if canvas is not available
      }
    }
  }, [isOpen, isCorrect]);

  // Keyboard shortcut: Enter or Space to continue
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        playTap();
        onAction();
      }
    },
    [isOpen, onAction, playTap],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleButtonClick = () => {
    playTap();
    onAction();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bottom-sheet-feedback"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 24,
            stiffness: 280,
            mass: 0.8,
          }}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 select-none shadow-2xl",
            // Border & Background condition
            isCorrect
              ? "bg-[#D7FFB8] border-t-[4px] border-[#58A700] text-[#3C5A14]"
              : "bg-[#FFDFE0] border-t-[4px] border-[#EA2B2B] text-[#661B1B]",
            className,
          )}
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
        >
          <div className="max-w-5xl mx-auto px-5 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 sm:gap-6">
            {/* Left Content Area: Icon + Text */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Correct: Joyful Jumping Checkmark Animation */}
              {isCorrect && (
                <motion.div
                  initial={{ scale: 0.4, y: 15 }}
                  animate={{
                    scale: [1, 1.22, 1, 1.1, 1],
                    y: [0, -14, 0, -7, 0],
                    rotate: [0, -6, 6, -3, 0],
                  }}
                  transition={{
                    duration: 0.75,
                    ease: "easeOut",
                    times: [0, 0.25, 0.5, 0.75, 1],
                  }}
                  className="w-13 h-13 sm:w-15 sm:h-15 rounded-[13px] bg-white border-2 border-[#58A700]/30 shadow-xs flex items-center justify-center shrink-0"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-[#58CC02] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3.5]" />
                  </div>
                </motion.div>
              )}

              {/* Wrong: Shake Animation Cross Icon */}
              {!isCorrect && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: 1,
                    x: [0, -9, 9, -7, 7, -4, 4, 0],
                  }}
                  transition={{
                    duration: 0.55,
                    ease: "easeInOut",
                  }}
                  className="w-13 h-13 sm:w-15 sm:h-15 rounded-[13px] bg-white border-2 border-[#EA2B2B]/30 shadow-xs flex items-center justify-center shrink-0"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-[#FF4B4B] flex items-center justify-center text-white shadow-xs">
                    <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3.5]" />
                  </div>
                </motion.div>
              )}

              {/* Text Container */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={cn(
                      "text-xl sm:text-2xl font-black tracking-tight leading-tight",
                      isCorrect ? "text-[#46A302]" : "text-[#EA2B2B]",
                    )}
                  >
                    {headerTitle}
                  </h3>
                  {isCorrect && (
                    <Sparkles className="w-5 h-5 text-[#58A700] shrink-0 animate-pulse" />
                  )}
                </div>

                {/* Primary Message */}
                {message && (
                  <div className="text-sm sm:text-base font-bold text-slate-700 leading-snug">
                    <DuoMathRenderer content={message} />
                  </div>
                )}

                {/* Solution / Correction Explanation */}
                {solutionExplanation && (
                  <div
                    className={cn(
                      "mt-2.5 flex items-start gap-2.5 text-xs sm:text-sm font-extrabold rounded-[13px] p-3 sm:p-3.5 shadow-xs transition-all max-h-48 overflow-y-auto",
                      isCorrect
                        ? "text-[#20540C] bg-white/95 border-2 border-[#58CC02]/40"
                        : "text-[#7F1D1D] bg-white/95 border-2 border-[#EA2B2B]/30",
                    )}
                  >
                    {isCorrect ? (
                      <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-[#58A700] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#EA2B2B] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "font-black block uppercase text-[11px] tracking-wider mb-1",
                          isCorrect ? "text-[#46A302]" : "text-[#EA2B2B]",
                        )}
                      >
                        {isCorrect
                          ? "Kunci Jawaban / Solusi:"
                          : "Koreksi / Jawaban Benar:"}
                      </span>
                      <div className="text-slate-800 font-bold whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                        <DuoMathRenderer content={solutionExplanation} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Button */}
            <div className="shrink-0 w-full sm:w-auto">
              <TactileButton
                variant={isCorrect ? "green" : "red"}
                size="lg"
                icon={
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                }
                iconPosition="right"
                onClick={handleButtonClick}
                className="w-full sm:w-auto min-w-[180px] sm:min-w-[200px]"
              >
                {actionText || (isCorrect ? "Lanjutkan" : "Mengerti")}
              </TactileButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomSheetFeedback;
