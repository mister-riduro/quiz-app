import React, { useState, useMemo } from "react";
import {
  SpellCheck,
  HelpCircle,
  Shuffle,
  Sparkles,
  Layers,
} from "lucide-react";
import { EditorProps } from "@/plugins/core/types";
import { SpellWordContent } from "./types";
import { DuoCard } from "@/components/ui/DuoCard";
import { TileToken } from "@/components/ui/TileToken";
import { Badge } from "@/components/ui/Badge";

export const SpellWordEditor: React.FC<EditorProps<SpellWordContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const targetWord = (value.targetWord || "").toUpperCase();
  const distractors = value.distractors || [];
  const hint = value.hint || "";

  // Local state for distractor input string to allow easy comma/space typing
  const [distractorInput, setDistractorInput] = useState<string>(
    distractors.join(", "),
  );
  const [previewSeed, setPreviewSeed] = useState<number>(1);

  // Sync distractor input if props change externally
  React.useEffect(() => {
    setDistractorInput(distractors.join(", "));
  }, [value.distractors]);

  const handleTargetWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    onChange({
      ...value,
      targetWord: sanitized,
    });
  };

  const handleDistractorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    setDistractorInput(raw);

    // Extract individual letters (A-Z only)
    const letterTokens = raw
      .replace(/[^A-Z]/g, "")
      .split("")
      .filter(Boolean);

    // Deduplicate or keep distinct distractor letters
    onChange({
      ...value,
      distractors: letterTokens,
    });
  };

  const handleHintChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange({
      ...value,
      hint: e.target.value,
    });
  };

  // Randomized letters for live preview
  const previewBank = useMemo(() => {
    const wordLetters = targetWord.split("").filter(Boolean);
    const combined = [...wordLetters, ...distractors];

    // Simple deterministic pseudo-random shuffle based on previewSeed
    const shuffled = [...combined];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (i * previewSeed + 7) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [targetWord, distractors, previewSeed]);

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Target Word Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <SpellCheck className="w-4 h-4 text-duo-blue" />
            <span>Kunci Jawaban</span>
          </label>
          {targetWord.length > 0 && (
            <Badge variant="blue" className="text-[10px]">
              {targetWord.length} Huruf
            </Badge>
          )}
        </div>
        <input
          type="text"
          disabled={disabled}
          value={targetWord}
          onChange={handleTargetWordChange}
          placeholder="Contoh: PLANET"
          maxLength={15}
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-black text-xl uppercase tracking-widest text-duo-dark placeholder:font-medium placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all"
        />
        <p className="text-xs font-semibold text-[#777777]">
          Hanya menerima huruf alfabet (A-Z). Otomatis dikonversi menjadi huruf
          kapital.
        </p>
      </div>

      {/* 2. Optional Distractor Letters Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Layers className="w-4 h-4 text-duo-orange" />
            <span>Huruf Pengecoh / Distractors (Opsional)</span>
          </label>
          {distractors.length > 0 && (
            <Badge variant="orange" className="text-[10px]">
              +{distractors.length} Pengecoh
            </Badge>
          )}
        </div>
        <input
          type="text"
          disabled={disabled}
          value={distractorInput}
          onChange={handleDistractorChange}
          placeholder="Contoh: X, Z, Q (Pisahkan dengan koma atau spasi)"
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-bold text-base uppercase tracking-wider text-duo-dark placeholder:font-normal placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all"
        />
        <p className="text-xs font-semibold text-[#777777]">
          Huruf-huruf tambahan yang akan ikut diacak ke dalam bank balok huruf
          siswa untuk menambah variasi tebakan.
        </p>
      </div>

      {/* 3. Optional Hint / Clue */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <HelpCircle className="w-4 h-4 text-duo-green" />
          <span>Petunjuk Soal (Opsional)</span>
        </label>
        <input
          type="text"
          disabled={disabled}
          value={hint}
          onChange={handleHintChange}
          placeholder="Contoh: Benda langit yang mengorbit bintang seperti Matahari."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-semibold text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all"
        />
      </div>

      {/* 4. Live Preview: Letter Slots & Randomized Letter Bank */}
      <div className="pt-4 border-t-2 border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-duo-yellow-border" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Live Preview Susunan Slot & Bank Huruf
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setPreviewSeed((s) => s + 1)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold text-duo-blue hover:bg-duo-blue-light/50 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Acak Ulang Preview</span>
          </button>
        </div>

        {targetWord.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-duo-gray rounded-2xl bg-slate-50">
            <p className="text-xs font-bold text-slate-400">
              Ketik kata target di atas untuk melihat simulasi visual slot dan
              bank huruf siswa.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 p-5 bg-duo-bg border-2 border-slate-200 rounded-2xl">
            {/* Slot Preview */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Slot Kotak Huruf Kosong ({targetWord.length} Slot)
              </span>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
                {targetWord.split("").map((_, index) => (
                  <div
                    key={`slot-${index}`}
                    className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 border-dashed border-duo-gray-border bg-white flex flex-col items-center justify-center text-slate-300 shadow-xs"
                  >
                    <span className="text-xs font-black text-slate-300">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrambled Letter Bank Preview */}
            <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Bank Huruf Acak Siswa ({previewBank.length} Balok 3D)
              </span>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
                {previewBank.map((char, index) => (
                  <TileToken
                    key={`preview-tile-${index}-${char}`}
                    label={char}
                    size="sm"
                    className="pointer-events-none"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DuoCard>
  );
};
