import React from "react";
import { Gamepad2, Heart, Sparkles, Tag } from "lucide-react";
import { EditorProps } from "@/plugins/core/types";
import { HangmanContent } from "./types";
import { DuoCard } from "@/components/ui/DuoCard";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

const BALLOON_COLORS = [
  "#FF4B4B",
  "#1CB0F6",
  "#58CC02",
  "#FFC800",
  "#A855F7",
  "#FF9600",
];

export const HangmanEditor: React.FC<EditorProps<HangmanContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const secretWord = (value.secretWord || "").toUpperCase();
  const category = value.category || value.hint || "";
  const maxLives = Math.min(6, Math.max(3, value.maxLives || 5));

  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow uppercase letters and spaces (spaces auto-revealed in game)
    const sanitized = e.target.value.toUpperCase().replace(/[^A-Z ]/g, "");
    onChange({
      ...value,
      secretWord: sanitized,
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      category: e.target.value,
      hint: e.target.value,
    });
  };

  const handleLivesSelect = (lives: number) => {
    if (disabled) return;
    onChange({
      ...value,
      maxLives: lives,
    });
  };

  // Word statistics
  const letterCount = secretWord.replace(/\s+/g, "").length;
  const wordCount = secretWord.trim().split(/\s+/).filter(Boolean).length;

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Kata Rahasia Tebakan */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Gamepad2 className="w-4 h-4 text-duo-blue" />
            <span>Kunci Jawaban</span>
          </label>
          {letterCount > 0 && (
            <Badge variant="blue" className="text-[10px]">
              {letterCount} Huruf {wordCount > 1 ? `(${wordCount} Kata)` : ""}
            </Badge>
          )}
        </div>
        <input
          type="text"
          disabled={disabled}
          value={secretWord}
          onChange={handleWordChange}
          placeholder="Contoh: ASTRONOT atau TATA SURYA"
          maxLength={24}
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-black text-xl uppercase tracking-widest text-duo-dark placeholder:font-medium placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all"
        />
        <p className="text-xs font-semibold text-[#777777]">
          Karakter spasi otomatis dianggap terisi (terbuka) di papan permainan
          tebak kata.
        </p>
      </div>

      {/* 2. Kategori / Petunjuk Makna */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <Tag className="w-4 h-4 text-duo-orange" />
          <span>Kategori / Petunjuk Soal</span>
        </label>
        <input
          type="text"
          disabled={disabled}
          value={category}
          onChange={handleCategoryChange}
          placeholder="Contoh: Profesi Luar Angkasa, Nama Ibu Kota, Hewan Mamalia"
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-semibold text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all"
        />
        <p className="text-xs font-semibold text-[#777777]">
          Kategori ini akan tampil di bagian atas sebagai panduan konteks bagi
          anak.
        </p>
      </div>

      {/* 3. Pilihan Jumlah Nyawa Maksimal (3 sampai 6) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Heart className="w-4 h-4 text-duo-red fill-duo-red" />
            <span>Jumlah Kesempatan Balon / Nyawa (3 - 6)</span>
          </label>
          <span className="text-xs font-bold text-slate-400">
            {maxLives} Balon Warna-Warni
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[3, 4, 5, 6].map((num) => {
            const isSelected = maxLives === num;
            const difficultyLabel =
              num === 3
                ? "Sulit"
                : num === 4
                  ? "Sedang"
                  : num === 5
                    ? "Standar"
                    : "Mudah";

            return (
              <button
                key={`lives-option-${num}`}
                type="button"
                disabled={disabled}
                onClick={() => handleLivesSelect(num)}
                className={cn(
                  "flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all text-center",
                  isSelected
                    ? "bg-duo-red-light/50 border-duo-red border-b-[4px] border-b-duo-red-border shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 border-b-[3px] text-slate-600",
                  disabled && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-3 h-3 rounded-full bg-duo-red" />
                  <span className="font-black text-lg text-duo-dark">
                    {num}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {difficultyLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Live Preview: Tampilan Balon & Huruf Tersembunyi */}
      <div className="pt-4 border-t-2 border-slate-100 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-duo-yellow-border" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
            Live Preview Papan Tebak Kata Balon
          </h4>
        </div>

        {secretWord.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-duo-gray rounded-2xl bg-slate-50">
            <p className="text-xs font-bold text-slate-400">
              Ketik kata rahasia di atas untuk melihat simulasi balon maskot dan
              garis bawah tebak kata.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-5 bg-duo-bg border-2 border-slate-200 rounded-2xl">
            {/* Balon Preview */}
            <div className="flex items-center gap-2">
              {Array.from({ length: maxLives }).map((_, idx) => (
                <div
                  key={`balloon-preview-${idx}`}
                  className="w-7 h-9 rounded-full shadow-xs border border-black/10 flex items-center justify-center text-[10px] font-black text-white"
                  style={{
                    backgroundColor:
                      BALLOON_COLORS[idx % BALLOON_COLORS.length],
                  }}
                >
                  🎈
                </div>
              ))}
            </div>

            {/* Clue badge */}
            {category && (
              <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-black text-duo-dark">
                Kategori: <span className="text-duo-blue">{category}</span>
              </div>
            )}

            {/* Mystery word underlines */}
            <div className="flex flex-wrap justify-center items-center gap-2.5 py-2">
              {secretWord.split("").map((char, index) => {
                if (char === " ") {
                  return <div key={`preview-char-${index}`} className="w-5" />;
                }
                return (
                  <div
                    key={`preview-char-${index}`}
                    className="w-9 h-11 border-b-4 border-duo-dark/60 bg-white rounded-t-lg flex items-center justify-center font-black text-lg text-slate-300"
                  >
                    _
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DuoCard>
  );
};
