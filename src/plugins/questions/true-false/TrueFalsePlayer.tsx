import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import { PlayerProps } from '@/plugins/core/types';
import { TrueFalseContent, TrueFalseAnswer } from './types';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { cn } from '@/utils/cn';

export const TrueFalsePlayer: React.FC<PlayerProps<TrueFalseContent, TrueFalseAnswer>> = ({
  content,
  submittedAnswer,
  onAnswerSubmit,
  isEvaluating = false,
}) => {
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
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-2">
      {/* 1. Image Media (if present: center, rounded-2xl, border 2px) */}
      {content.mediaUrl && (
        <div className="flex justify-center w-full mb-6">
          <img
            src={content.mediaUrl}
            alt="Media Soal"
            className="max-h-64 sm:max-h-72 w-auto object-contain rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-sm"
          />
        </div>
      )}

      {/* 2. Statement Text (Large: text-2xl font-bold text-center) */}
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-duo-dark leading-snug tracking-tight px-3 mb-8 sm:mb-10">
        {content.statement || 'Pernyataan belum diatur'}
      </h2>

      {/* 3. Two Massive 3D Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
        {/* Kiri: Kartu Hijau masif dengan ikon centang tebal ("BENAR") */}
        <motion.button
          type="button"
          disabled={isEvaluating || isAnswered}
          onClick={() => handleChoice(true)}
          whileHover={!isAnswered && !isEvaluating ? { scale: 1.04, y: -4 } : undefined}
          whileTap={!isAnswered && !isEvaluating ? { scale: 0.93, y: 6 } : undefined}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 18,
            mass: 0.8,
          }}
          className={cn(
            'group relative flex flex-col items-center justify-center gap-4 py-8 sm:py-12 px-6 rounded-3xl',
            'border-2 border-duo-green-border border-b-[8px] sm:border-b-[10px] border-b-duo-green-border',
            'bg-duo-green text-white select-none cursor-pointer shadow-md',
            'transition-colors duration-150',
            // Active ring when selected
            isSelectedTrue && 'ring-4 ring-offset-4 ring-duo-green-border scale-[1.02]',
            // Dimmed if another card was chosen
            isAnswered && !isSelectedTrue && 'opacity-40 filter grayscale-[0.4] cursor-default',
            // Disabled state
            (isEvaluating || isAnswered) && 'cursor-default'
          )}
        >
          {/* Inner highlight gloss */}
          <div className="absolute top-2 inset-x-4 h-3 bg-white/20 rounded-full pointer-events-none" />

          {/* Thick Checkmark Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Check className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={4} />
          </div>

          <span className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-white drop-shadow-sm">
            BENAR
          </span>
        </motion.button>

        {/* Kanan: Kartu Merah masif dengan ikon silang tebal ("SALAH") */}
        <motion.button
          type="button"
          disabled={isEvaluating || isAnswered}
          onClick={() => handleChoice(false)}
          whileHover={!isAnswered && !isEvaluating ? { scale: 1.04, y: -4 } : undefined}
          whileTap={!isAnswered && !isEvaluating ? { scale: 0.93, y: 6 } : undefined}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 18,
            mass: 0.8,
          }}
          className={cn(
            'group relative flex flex-col items-center justify-center gap-4 py-8 sm:py-12 px-6 rounded-3xl',
            'border-2 border-duo-red-border border-b-[8px] sm:border-b-[10px] border-b-duo-red-border',
            'bg-duo-red text-white select-none cursor-pointer shadow-md',
            'transition-colors duration-150',
            // Active ring when selected
            isSelectedFalse && 'ring-4 ring-offset-4 ring-duo-red-border scale-[1.02]',
            // Dimmed if another card was chosen
            isAnswered && !isSelectedFalse && 'opacity-40 filter grayscale-[0.4] cursor-default',
            // Disabled state
            (isEvaluating || isAnswered) && 'cursor-default'
          )}
        >
          {/* Inner highlight gloss */}
          <div className="absolute top-2 inset-x-4 h-3 bg-white/20 rounded-full pointer-events-none" />

          {/* Thick Cross Icon */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <X className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={4} />
          </div>

          <span className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-white drop-shadow-sm">
            SALAH
          </span>
        </motion.button>
      </div>

      {/* 4. Optional Post-Answer Educational Explanation Banner */}
      {isAnswered && content.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mt-6 sm:mt-8 p-4 sm:p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl w-full flex items-start gap-3.5 text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-duo-yellow-light border border-duo-yellow-border text-duo-yellow-border flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
              Fakta / Penjelasan:
            </h4>
            <p className="text-sm sm:text-base font-bold text-duo-dark leading-relaxed">
              {content.explanation}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

