import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Sparkles, Check } from "lucide-react";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

export interface HintBottomSheetProps {
  isOpen: boolean;
  hint?: string;
  onClose: () => void;
  title?: string;
  className?: string;
}

export const HintBottomSheet: React.FC<HintBottomSheetProps> = ({
  isOpen,
  hint,
  onClose,
  title = "Petunjuk Soal",
  className,
}) => {
  const { playPop, playTap } = useSoundEffect();

  // Play audio on opening
  useEffect(() => {
    if (isOpen) {
      playPop();
    }
  }, [isOpen, playPop]);

  // Keyboard accessibility: Escape or Enter to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isOpen && (e.key === "Escape" || e.key === "Enter")) {
        playTap();
        onClose();
      }
    },
    [isOpen, onClose, playTap],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleClose = () => {
    playTap();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Backdrop Overlay */}
          <motion.div
            key="hint-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] cursor-pointer"
            aria-hidden="true"
          />

          {/* Slide-Up Bottom Sheet Drawer */}
          <motion.div
            key="hint-bottom-sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.8,
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 select-none shadow-2xl",
              "bg-[#FFF8E7] border-t-[4px] border-[#FF9600] text-amber-950",
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="max-w-5xl mx-auto px-5 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 sm:gap-6">
              {/* Left Content Area: 3D Lightbulb Icon + Hint Message */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
                {/* 3D Tactile Lightbulb Mascot Icon */}
                <motion.div
                  initial={{ scale: 0.5, y: 12 }}
                  animate={{
                    scale: [1, 1.18, 1, 1.08, 1],
                    y: [0, -8, 0, -4, 0],
                    rotate: [0, -6, 6, -3, 0],
                  }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-white border-2 border-amber-300 shadow-md flex items-center justify-center shrink-0"
                >
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#FF9600] flex items-center justify-center text-white shadow-xs">
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </div>
                </motion.div>

                {/* Text Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg sm:text-xl font-black text-amber-900 tracking-tight leading-tight flex items-center gap-1.5">
                      <span>{title}</span>
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    </h3>
                  </div>

                  {/* Hint Content Card */}
                  <div className="mt-1 bg-white/90 border-2 border-amber-200/80 rounded-2xl px-4 py-2.5 sm:py-3 shadow-xs">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-line">
                      {hint ||
                        "Perhatikan pertanyaan dengan cermat untuk menemukan jawabannya."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Action Button: 3D Tactile "Mengerti" Button */}
              <div className="shrink-0 w-full sm:w-auto flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto min-w-[160px] sm:min-w-[180px] py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider text-white shadow-md flex items-center justify-center gap-2 bg-[#FF9600] border-b-4 border-[#D97F00] hover:bg-[#FFA524] active:translate-y-1 active:border-b-0 cursor-pointer transition-all duration-100"
                >
                  <span>Mengerti</span>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HintBottomSheet;
