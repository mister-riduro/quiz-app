import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { EditorProps } from "@/plugins/core/types";
import { TrueFalseContent } from "./types";
import { DuoCard } from "@/components/ui/DuoCard";
import { DuoMathTextarea } from "@/components/common/DuoMathTextarea";
import { cn } from "@/utils/cn";

export const TrueFalseEditor: React.FC<EditorProps<TrueFalseContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const correctAnswer = value.correctAnswer ?? true;
  const explanation = value.explanation ?? "";

  const handleSelectAnswer = (answer: boolean) => {
    if (disabled) return;
    onChange({
      ...value,
      correctAnswer: answer,
    });
  };

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Answer Selection Radio Cards: BENAR (Green) vs SALAH (Red) */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500">
          Kunci Jawaban
        </label>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          role="radiogroup"
        >
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
              "flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-left",
              correctAnswer === true
                ? "bg-duo-green text-white border-duo-green-border"
                : "bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200",
              disabled && "opacity-70 cursor-not-allowed",
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors",
                  correctAnswer === true
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-600",
                )}
              >
                <Check className="w-6 h-6" strokeWidth={3.5} />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-wide block">
                  BENAR
                </span>
              </div>
            </div>

            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                correctAnswer === true
                  ? "border-white bg-white text-duo-green"
                  : "border-slate-300 bg-white",
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
              "flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-left",
              correctAnswer === false
                ? "bg-duo-red text-white border-duo-red-border"
                : "bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200",
              disabled && "opacity-70 cursor-not-allowed",
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors",
                  correctAnswer === false
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 text-rose-600",
                )}
              >
                <X className="w-6 h-6" strokeWidth={3.5} />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-wide block">
                  SALAH
                </span>
              </div>
            </div>

            <div
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                correctAnswer === false
                  ? "border-white bg-white text-duo-red"
                  : "border-slate-300 bg-white",
              )}
            >
              {correctAnswer === false && (
                <div className="w-2.5 h-2.5 rounded-full bg-duo-red" />
              )}
            </div>
          </motion.button>
        </div>
      </div>

      {/* 2. Optional Explanation Input with Rich Math Support */}
      <DuoMathTextarea
        label="Penjelasan (Opsional)"
        value={explanation}
        onChange={(val) => onChange({ ...value, explanation: val })}
        placeholder="Contoh: Pada ketinggian tinggi seperti di pegunungan, titik didih air menjadi lebih rendah dari 100°C akibat tekanan udara yang lebih kecil."
        rows={2}
        helperText="Teks ini akan muncul sebagai umpan balik setelah siswa menjawab soal."
      />
    </DuoCard>
  );
};
