import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, FileText, Sparkles } from 'lucide-react';
import { EditorProps } from '@/plugins/core/types';
import { TrueFalseContent } from './types';
import { DuoCard } from '@/components/ui/DuoCard';
import { cn } from '@/utils/cn';

export const TrueFalseEditor: React.FC<EditorProps<TrueFalseContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const statement = value.statement ?? '';
  const correctAnswer = value.correctAnswer ?? true;
  const explanation = value.explanation ?? '';

  const handleStatementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      statement: e.target.value,
    });
  };

  const handleSelectAnswer = (answer: boolean) => {
    if (disabled) return;
    onChange({
      ...value,
      correctAnswer: answer,
    });
  };

  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      explanation: e.target.value,
    });
  };

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Statement Text Input */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <FileText className="w-4 h-4 text-duo-blue" />
          <span>Teks Pernyataan / Soal</span>
        </label>
        <textarea
          rows={3}
          disabled={disabled}
          value={statement}
          onChange={handleStatementChange}
          placeholder="Contoh: Air mendidih pada suhu 100°C di bawah tekanan 1 atmosfer standar."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-bold text-base text-duo-dark placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all resize-none"
        />
        <p className="text-xs font-semibold text-[#777777]">
          Tuliskan pernyataan lugas yang memiliki fakta objektif (dapat dinilai benar atau salah).
        </p>
      </div>

      {/* 2. Answer Selection Radio Cards: BENAR (Green) vs SALAH (Red) */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
          Kunci Jawaban Yang Benar
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" role="radiogroup">
          {/* Card Option: BENAR */}
          <motion.button
            type="button"
            role="radio"
            aria-checked={correctAnswer === true}
            disabled={disabled}
            onClick={() => handleSelectAnswer(true)}
            whileHover={!disabled ? { scale: 1.01 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            className={cn(
              'flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-left',
              correctAnswer === true
                ? 'bg-duo-green text-white border-duo-green-border border-b-[5px] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200 border-b-[4px]',
              disabled && 'opacity-70 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors',
                  correctAnswer === true
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 text-emerald-600'
                )}
              >
                <Check className="w-6 h-6" strokeWidth={3.5} />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-wide block">
                  BENAR
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    correctAnswer === true ? 'text-emerald-100' : 'text-slate-400'
                  )}
                >
                  Pernyataan sesuai fakta
                </span>
              </div>
            </div>

            <div
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                correctAnswer === true
                  ? 'border-white bg-white text-duo-green'
                  : 'border-slate-300 bg-white'
              )}
            >
              {correctAnswer === true && (
                <div className="w-2.5 h-2.5 rounded-full bg-duo-green" />
              )}
            </div>
          </motion.button>

          {/* Card Option: SALAH */}
          <motion.button
            type="button"
            role="radio"
            aria-checked={correctAnswer === false}
            disabled={disabled}
            onClick={() => handleSelectAnswer(false)}
            whileHover={!disabled ? { scale: 1.01 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            className={cn(
              'flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-left',
              correctAnswer === false
                ? 'bg-duo-red text-white border-duo-red-border border-b-[5px] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200 border-b-[4px]',
              disabled && 'opacity-70 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors',
                  correctAnswer === false
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-100 text-rose-600'
                )}
              >
                <X className="w-6 h-6" strokeWidth={3.5} />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-wide block">
                  SALAH
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    correctAnswer === false ? 'text-rose-100' : 'text-slate-400'
                  )}
                >
                  Pernyataan tidak sesuai fakta
                </span>
              </div>
            </div>

            <div
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                correctAnswer === false
                  ? 'border-white bg-white text-duo-red'
                  : 'border-slate-300 bg-white'
              )}
            >
              {correctAnswer === false && (
                <div className="w-2.5 h-2.5 rounded-full bg-duo-red" />
              )}
            </div>
          </motion.button>
        </div>
      </div>

      {/* 3. Optional Explanation / Fun Fact Input */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <Sparkles className="w-4 h-4 text-duo-yellow-border" />
          <span>Penjelasan / Fakta Menarik (Opsional)</span>
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          value={explanation}
          onChange={handleExplanationChange}
          placeholder="Contoh: Pada ketinggian tinggi seperti di pegunungan, titik didih air menjadi lebih rendah dari 100°C akibat tekanan udara yang lebih kecil."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-semibold text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all resize-none"
        />
        <p className="text-xs font-semibold text-[#777777]">
          Teks ini akan muncul sebagai umpan balik edukatif setelah siswa menjawab kartu soal.
        </p>
      </div>
    </DuoCard>
  );
};

