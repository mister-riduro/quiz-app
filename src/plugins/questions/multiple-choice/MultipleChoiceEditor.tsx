import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Plus,
  Trash2,
  HelpCircle,
  Shuffle,
  AlertCircle,
} from "lucide-react";
import { EditorProps } from "@/plugins/core/types";
import { MultipleChoiceContent, MultipleChoiceOption } from "./types";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { generateUUID } from "@/utils/uuid";
import { cn } from "@/utils/cn";
import { DuoMathRenderer } from "@/components/common/DuoMathRenderer";
import { MathFormulaModal } from "@/components/common/MathFormulaModal";
import { DuoMathTextarea } from "@/components/common/DuoMathTextarea";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

const OPTION_BADGE_COLORS = [
  "bg-duo-blue text-white border-duo-blue-border",
  "bg-duo-green text-white border-duo-green-border",
  "bg-duo-orange text-white border-duo-orange-border",
  "bg-purple-500 text-white border-purple-600",
  "bg-rose-500 text-white border-rose-600",
];

export const MultipleChoiceEditor: React.FC<
  EditorProps<MultipleChoiceContent>
> = ({ value, onChange, disabled = false }) => {
  const [mathModalTarget, setMathModalTarget] = React.useState<string | null>(
    null,
  );
  const options = value.options ?? [];
  const correctOptionIds = useMemo<string[]>(() => {
    if (
      Array.isArray(value.correctOptionIds) &&
      value.correctOptionIds.length > 0
    ) {
      return value.correctOptionIds;
    }
    if (value.correctOptionId) {
      return [value.correctOptionId];
    }
    return options[0]?.id ? [options[0].id] : [];
  }, [value.correctOptionIds, value.correctOptionId, options]);

  const explanation = value.explanation ?? "";
  const hint = value.hint ?? "";
  const randomizeOrder = value.randomizeOrder ?? false;

  const handleAddOption = () => {
    if (disabled || options.length >= MAX_OPTIONS) return;
    const newId = `opt-${generateUUID().slice(0, 8)}`;
    const newOption: MultipleChoiceOption = {
      id: newId,
      text: "",
    };
    const updatedOptions = [...options, newOption];
    const updatedCorrectIds =
      correctOptionIds.length > 0 ? correctOptionIds : [newId];
    onChange({
      ...value,
      options: updatedOptions,
      correctOptionIds: updatedCorrectIds,
      correctOptionId: updatedCorrectIds[0] || newId,
    });
  };

  const handleRemoveOption = (idToRemove: string) => {
    if (disabled || options.length <= MIN_OPTIONS) return;
    const updatedOptions = options.filter((opt) => opt.id !== idToRemove);
    const remainingCorrect = correctOptionIds.filter((id) => id !== idToRemove);
    const fallbackCorrect =
      remainingCorrect.length > 0
        ? remainingCorrect
        : updatedOptions[0]?.id
          ? [updatedOptions[0].id]
          : [];
    onChange({
      ...value,
      options: updatedOptions,
      correctOptionIds: fallbackCorrect,
      correctOptionId: fallbackCorrect[0] || "",
    });
  };

  const handleOptionTextChange = (id: string, text: string) => {
    const updatedOptions = options.map((opt) =>
      opt.id === id ? { ...opt, text } : opt,
    );
    onChange({
      ...value,
      options: updatedOptions,
    });
  };

  const handleToggleCorrectOption = (id: string) => {
    if (disabled) return;
    const isCurrentlyChecked = correctOptionIds.includes(id);
    const updatedIds = isCurrentlyChecked
      ? correctOptionIds.filter((item) => item !== id)
      : [...correctOptionIds, id];

    onChange({
      ...value,
      correctOptionIds: updatedIds,
      correctOptionId: updatedIds[0] || "",
    });
  };

  const handleHintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      hint: e.target.value,
    });
  };

  const handleToggleRandomize = () => {
    if (disabled) return;
    onChange({
      ...value,
      randomizeOrder: !randomizeOrder,
    });
  };

  const handleInsertMath = (latex: string, isBlock: boolean) => {
    if (!mathModalTarget) return;
    const mathStr = isBlock ? `$$${latex}$$` : `$${latex}$`;
    const targetOpt = options.find((o) => o.id === mathModalTarget);
    if (targetOpt) {
      const nextText = targetOpt.text
        ? `${targetOpt.text} ${mathStr}`
        : mathStr;
      handleOptionTextChange(mathModalTarget, nextText);
    }
    setMathModalTarget(null);
  };

  const isMissingCorrect =
    correctOptionIds.length === 0 ||
    !options.some((opt) => correctOptionIds.includes(opt.id));
  const hasEmptyOptions = options.some((opt) => !opt.text.trim());

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Header & Options Configuration */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <span>
              Kunci Jawaban ({options.length}/{MAX_OPTIONS})
            </span>
          </label>
          <span className="text-[11px] font-extrabold text-slate-400">
            Centang kunci jawaban (bisa lebih dari satu)
          </span>
        </div>

        {/* Validation Alert if needed */}
        {isMissingCorrect && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Harap centang setidaknya satu opsi kotak sebagai kunci jawaban
              yang benar.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {options.map((opt, idx) => {
              const letter = OPTION_LETTERS[idx] || String(idx + 1);
              const isCorrect = correctOptionIds.includes(opt.id);
              const badgeColor =
                OPTION_BADGE_COLORS[idx % OPTION_BADGE_COLORS.length];

              return (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "group flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-3.5 rounded-2xl border-2 transition-all",
                    isCorrect
                      ? "bg-duo-green/5 border-duo-green ring-2 ring-duo-green/20"
                      : "bg-white border-duo-gray hover:border-slate-300",
                  )}
                >
                  {/* Left: Option Letter Badge & Square Checkbox */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border-b-2 shadow-2xs",
                        badgeColor,
                      )}
                    >
                      {letter}
                    </div>

                    {/* Square Checkbox Button (Empty square when unselected, filled with checkmark when selected) */}
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isCorrect}
                      disabled={disabled}
                      onClick={() => handleToggleCorrectOption(opt.id)}
                      className={cn(
                        "w-9 h-9 rounded-xl border-2 flex items-center justify-center select-none transition-all cursor-pointer shrink-0",
                        isCorrect
                          ? "bg-duo-green text-white border-duo-green-border active:translate-y-0.5"
                          : "bg-white text-transparent border-slate-300 hover:border-slate-400 hover:bg-slate-50 active:translate-y-0.5",
                        disabled && "cursor-not-allowed opacity-60",
                      )}
                      title={
                        isCorrect
                          ? "Kunci jawaban aktif (klik untuk melepas)"
                          : "Klik untuk jadikan kunci jawaban"
                      }
                    >
                      {isCorrect && (
                        <Check className="w-5 h-5 text-white stroke-[3.5]" />
                      )}
                    </button>
                  </div>

                  {/* Middle: Option Text Field & Math Formula Button */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        disabled={disabled}
                        value={opt.text}
                        onChange={(e) =>
                          handleOptionTextChange(opt.id, e.target.value)
                        }
                        placeholder={`Teks pilihan ${letter}...`}
                        className={cn(
                          "flex-1 px-3.5 py-2 rounded-xl border-2 font-bold text-sm text-duo-dark placeholder:font-medium placeholder:text-slate-400 focus:outline-none transition-all",
                          isCorrect
                            ? "border-duo-green/60 bg-white focus:border-duo-green focus:ring-2 focus:ring-duo-green/20"
                            : "border-duo-gray bg-white focus:border-duo-blue focus:ring-2 focus:ring-duo-blue/15",
                          !opt.text.trim() && "border-amber-300",
                        )}
                      />
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setMathModalTarget(opt.id)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-duo-blue-light text-slate-500 hover:text-duo-blue border border-slate-200 text-xs font-black transition-all cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
                        title={`Sisipkan rumus matematika pada pilihan ${letter}`}
                      >
                        ∑
                      </button>
                    </div>

                    {/* Live Preview if option text contains math */}
                    {(opt.text.includes("$") ||
                      opt.text.includes("\\(") ||
                      opt.text.includes("\\[")) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-200/60 text-xs font-bold text-duo-dark">
                        <span className="text-[10px] uppercase font-black text-duo-blue shrink-0">
                          Hasil:
                        </span>
                        <DuoMathRenderer content={opt.text} inlineOnly />
                      </div>
                    )}
                  </div>

                  {/* Right: Remove Button */}
                  <button
                    type="button"
                    disabled={disabled || options.length <= MIN_OPTIONS}
                    onClick={() => handleRemoveOption(opt.id)}
                    className={cn(
                      "p-2 rounded-xl text-slate-400 hover:text-duo-red hover:bg-red-50 transition-colors shrink-0 flex items-center justify-center self-end sm:self-auto cursor-pointer",
                      options.length <= MIN_OPTIONS &&
                        "opacity-30 cursor-not-allowed hover:text-slate-400 hover:bg-transparent",
                    )}
                    title={
                      options.length <= MIN_OPTIONS
                        ? "Minimal harus memiliki 2 pilihan jawaban"
                        : "Hapus opsi ini"
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add Option Button (Enforcing Max 5 Options) */}
        <div className="flex items-center justify-between pt-1">
          {options.length < MAX_OPTIONS ? (
            <TactileButton
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleAddOption}
              disabled={disabled || options.length >= MAX_OPTIONS}
              className="text-duo-blue hover:text-duo-blue-border border-dashed border-2"
            >
              Tambah Pilihan Jawaban ({options.length}/{MAX_OPTIONS})
            </TactileButton>
          ) : (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Maksimal 5 pilihan jawaban tercapai
            </span>
          )}

          {hasEmptyOptions && (
            <span className="text-xs font-bold text-amber-600">
              Ada opsi yang belum diisi teksnya
            </span>
          )}
        </div>
      </div>

      {/* 2. Options Settings (Randomize Options) */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border-2 border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-duo-blue/10 text-duo-blue flex items-center justify-center">
            <Shuffle className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider text-duo-dark">
              Acak Urutan Pilihan
            </h5>
            <p className="text-[11px] font-semibold text-slate-500">
              Tampilkan posisi opsi (A, B, C, D, E) secara acak saat siswa
              bermain.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={randomizeOrder}
          disabled={disabled}
          onClick={handleToggleRandomize}
          className={cn(
            "relative w-12 h-7 rounded-full transition-colors p-1 cursor-pointer focus:outline-none shrink-0",
            randomizeOrder ? "bg-duo-green" : "bg-slate-300",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-full bg-white shadow-md transform transition-transform",
              randomizeOrder ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>

      {/* 3. Hint (Petunjuk) */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>Petunjuk Soal (Opsional)</span>
        </label>
        <input
          type="text"
          disabled={disabled}
          value={hint}
          onChange={handleHintChange}
          placeholder="Contoh: Perhatikan siklus fotosintesis pada tumbuhan hijau."
          className="w-full px-4 py-2.5 border-2 border-duo-gray rounded-2xl font-bold text-sm text-duo-dark placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all"
        />
        <p className="text-xs font-semibold text-slate-400">
          Petunjuk akan dapat dibuka siswa jika mereka membutuhkan bantuan saat
          bermain.
        </p>
      </div>

      {/* 4. Explanation with Rich Math Support */}
      <DuoMathTextarea
        label="Penjelasan (Opsional)"
        value={explanation}
        onChange={(val) => onChange({ ...value, explanation: val })}
        placeholder="Contoh: Klorofil adalah pigmen pada kloroplas yang berfungsi menangkap cahaya matahari..."
        rows={2}
        helperText="Teks ini akan muncul sebagai umpan balik setelah siswa menjawab soal."
      />

      {/* Math Formula Modal for Options */}
      <MathFormulaModal
        isOpen={Boolean(mathModalTarget)}
        onClose={() => setMathModalTarget(null)}
        onInsert={handleInsertMath}
      />
    </DuoCard>
  );
};
