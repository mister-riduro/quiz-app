import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  HelpCircle,
  RotateCcw,
  Plus,
  X,
  Eye,
  Info,
} from "lucide-react";
import { EditorProps } from "@/plugins/core/types";
import { WordsearchContent } from "./types";
import { DuoCard } from "@/components/ui/DuoCard";
import { Badge } from "@/components/ui/Badge";
import { TactileButton } from "@/components/ui/TactileButton";
import { generateWordsearchGrid, PASTEL_PALETTES } from "./wordsearchGenerator";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

export const WordsearchEditor: React.FC<EditorProps<WordsearchContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { playTap, playPop } = useSoundEffect();

  const words = useMemo(
    () => value?.words || ["KUCING", "ANJING", "BURUNG", "KELINCI"],
    [value?.words],
  );
  const allowDiagonal = value?.allowDiagonal ?? false;
  const hint = value?.hint || "";
  const [newWordInput, setNewWordInput] = useState("");

  // Re-generate grid whenever words or diagonal toggle changes, or when explicitly refreshed
  const handleRegenerateGrid = useCallback(
    (targetWords: string[], diagonal: boolean) => {
      const generated = generateWordsearchGrid(targetWords, 10, diagonal);
      onChange({
        ...value,
        words: targetWords,
        allowDiagonal: diagonal,
        grid: generated.grid,
        placements: generated.placements,
      });
    },
    [value, onChange],
  );

  // Initialize grid if not yet generated
  useEffect(() => {
    if (!value?.grid || value.grid.length !== 10) {
      handleRegenerateGrid(words, allowDiagonal);
    }
  }, [value?.grid, words, allowDiagonal, handleRegenerateGrid]);

  // Add new word
  const handleAddWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitized = newWordInput
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    if (!sanitized) return;

    if (sanitized.length < 2) {
      alert("Kata minimal harus memiliki 2 huruf.");
      return;
    }
    if (sanitized.length > 10) {
      alert("Kata tidak boleh lebih dari 10 huruf untuk grid 10x10.");
      return;
    }
    if (words.includes(sanitized)) {
      alert("Kata tersebut sudah ada dalam daftar.");
      return;
    }

    playPop();
    const updated = [...words, sanitized];
    setNewWordInput("");
    handleRegenerateGrid(updated, allowDiagonal);
  };

  // Remove word
  const handleRemoveWord = (wordToRemove: string) => {
    playTap();
    const updated = words.filter((w) => w !== wordToRemove);
    handleRegenerateGrid(updated, allowDiagonal);
  };

  // Toggle diagonal
  const handleToggleDiagonal = () => {
    playTap();
    const nextDiagonal = !allowDiagonal;
    handleRegenerateGrid(words, nextDiagonal);
  };

  // Explicit re-scramble / refresh
  const handleRefreshGrid = () => {
    playPop();
    handleRegenerateGrid(words, allowDiagonal);
  };

  // Update hint
  const handleHintChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      hint: e.target.value,
    });
  };

  // Map of cells occupied by words in the editor preview
  const cellHighlightMap = useMemo(() => {
    const map = new Map<string, { word: string; color: string }>();
    const placements = value?.placements || [];

    placements.forEach((placement, pIdx) => {
      const color = PASTEL_PALETTES[pIdx % PASTEL_PALETTES.length]!;
      const dr = Math.sign(placement.endRow - placement.startRow);
      const dc = Math.sign(placement.endCol - placement.startCol);
      const len = placement.word.length;

      for (let i = 0; i < len; i++) {
        const r = placement.startRow + i * dr;
        const c = placement.startCol + i * dc;
        map.set(`${r},${c}`, { word: placement.word, color: color.bg });
      }
    });

    return map;
  }, [value?.placements]);

  const grid = value?.grid || [];

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Target Words Management */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Search className="w-4 h-4 text-duo-blue" />
            <span>Kunci Jawaban (3–6 Kata)</span>
          </label>
          <Badge variant="blue" className="text-[10px]">
            {words.length} Kata Terdaftar
          </Badge>
        </div>

        {/* Word Tag List */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/80 rounded-2xl border-2 border-slate-200 min-h-[54px]">
          {words.map((word, index) => {
            const palette = PASTEL_PALETTES[index % PASTEL_PALETTES.length]!;
            return (
              <div
                key={word}
                style={{
                  backgroundColor: palette.bg,
                  borderColor: palette.border,
                  color: palette.text,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 font-black text-xs sm:text-sm shadow-xs select-none"
              >
                <span>{word}</span>
                {!disabled && words.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(word)}
                    className="p-0.5 rounded-md hover:bg-black/10 transition-colors"
                    title={`Hapus kata ${word}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Word Input Field */}
          {!disabled && words.length < 8 && (
            <form
              onSubmit={handleAddWord}
              className="inline-flex items-center gap-1.5"
            >
              <input
                type="text"
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value.toUpperCase())}
                placeholder="+ Tambah kata..."
                maxLength={10}
                className="w-36 px-3 py-1 bg-white border-2 border-dashed border-duo-gray rounded-xl font-bold text-xs uppercase text-duo-dark focus:outline-none focus:border-duo-blue"
              />
              <button
                type="submit"
                className="p-1.5 rounded-xl bg-duo-blue text-white hover:bg-duo-blue/90 shadow-xs"
                title="Tambah Kata"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </form>
          )}
        </div>

        <p className="text-xs font-semibold text-[#777777] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-duo-blue shrink-0" />
          <span>Hanya alfabet A-Z (maks. 10 huruf)</span>
        </p>
      </div>

      {/* 2. Grid Direction Options & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allowDiagonal}
            onChange={handleToggleDiagonal}
            disabled={disabled}
            className="w-5 h-5 rounded-lg border-2 border-duo-gray text-duo-blue focus:ring-duo-blue/20 cursor-pointer"
          />
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-duo-dark block">
              Izinkan Penempatan Diagonal (Miring)
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Kata juga dapat tersusun secara diagonal (↘/↗).
            </span>
          </div>
        </label>

        <TactileButton
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleRefreshGrid}
          icon={<RotateCcw className="w-3.5 h-3.5 text-duo-blue" />}
          className="text-xs font-extrabold shrink-0"
        >
          Acak Ulang Grid
        </TactileButton>
      </div>

      {/* 3. Hint / Context Clue Input */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <HelpCircle className="w-4 h-4 text-duo-green" />
          <span>Petunjuk Soal (Opsional)</span>
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          value={hint}
          onChange={handleHintChange}
          placeholder="Contoh: Temukan nama-nama hewan mamalia peliharaan yang bersembunyi di dalam kotak."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-semibold text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all resize-none"
        />
      </div>

      {/* 4. Live Preview Section: 10x10 Matrix */}
      <div className="pt-4 border-t-2 border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-duo-yellow-border" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Preview (10 × 10)
            </h4>
          </div>
        </div>

        {/* Render 10x10 Matrix Grid */}
        <div className="flex justify-center w-full p-4 sm:p-6 bg-duo-bg border-2 border-slate-200 rounded-3xl overflow-x-auto">
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5 max-w-[420px] w-full aspect-square">
            {grid.map((row, rIdx) =>
              row.map((char, cIdx) => {
                const key = `${rIdx},${cIdx}`;
                const highlight = cellHighlightMap.get(key);

                return (
                  <div
                    key={key}
                    style={{
                      backgroundColor: highlight ? highlight.color : "#FFFFFF",
                    }}
                    className={cn(
                      "aspect-square rounded-lg sm:rounded-xl border flex items-center justify-center font-black select-none text-xs sm:text-base transition-colors shadow-2xs",
                      highlight
                        ? "border-slate-300 font-black text-duo-dark scale-[0.98]"
                        : "border-slate-200 text-slate-400 font-bold bg-white",
                    )}
                    title={
                      highlight
                        ? `Bagian dari: ${highlight.word}`
                        : `Huruf acak (${rIdx + 1}, ${cIdx + 1})`
                    }
                  >
                    {char}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Placed Words Direction Legend */}
        {value?.placements && value.placements.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {value.placements.map((p, idx) => {
              const palette = PASTEL_PALETTES[idx % PASTEL_PALETTES.length]!;
              const isDiag = p.startRow !== p.endRow && p.startCol !== p.endCol;
              const isVert = p.startCol === p.endCol;

              return (
                <div
                  key={p.word}
                  style={{ backgroundColor: palette.bg, color: palette.text }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{p.word}</span>
                  <span className="opacity-75 font-semibold text-[10px]">
                    ({isDiag ? "Diagonal" : isVert ? "Vertikal" : "Horizontal"})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DuoCard>
  );
};
