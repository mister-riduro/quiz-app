import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Grid,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  Info,
  Check,
  X,
} from "lucide-react";
import { EditorProps } from "@/plugins/core/types";
import { CrosswordContent, CrosswordWord, CrosswordDirection } from "./types";
import {
  buildCrosswordGridMap,
  coordKey,
  renumberCrosswordWords,
  getWordCells,
  defaultCrosswordContent,
} from "./crosswordUtils";
import { DuoCard } from "@/components/ui/DuoCard";
import { Badge } from "@/components/ui/Badge";
import { TactileButton } from "@/components/ui/TactileButton";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

export const CrosswordEditor: React.FC<EditorProps<CrosswordContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { playTap, playPop } = useSoundEffect();

  const gridSize = useMemo(
    () => ({
      rows: Math.min(10, Math.max(4, value?.gridSize?.rows || 6)),
      cols: Math.min(10, Math.max(4, value?.gridSize?.cols || 6)),
    }),
    [value?.gridSize],
  );

  const words = useMemo(
    () =>
      value?.words && value.words.length > 0
        ? value.words
        : defaultCrosswordContent.words,
    [value?.words],
  );

  useEffect(() => {
    if (!value?.words || value.words.length === 0) {
      onChange({
        gridSize: value?.gridSize || defaultCrosswordContent.gridSize,
        words: defaultCrosswordContent.words,
        hint: value?.hint || defaultCrosswordContent.hint,
      });
    }
  }, []);

  // Editing state for word form
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [formWord, setFormWord] = useState("");
  const [formClue, setFormClue] = useState("");
  const [formDirection, setFormDirection] =
    useState<CrosswordDirection>("ACROSS");
  const [formRow, setFormRow] = useState(1); // 1-indexed for user display
  const [formCol, setFormCol] = useState(1); // 1-indexed for user display
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  // Computed grid map and collisions
  const { cellMap, collisionCount, outOfBoundsCount } = useMemo(
    () => buildCrosswordGridMap(gridSize, words),
    [gridSize, words],
  );

  // Selected word object
  const activeSelectedWord = useMemo(
    () => words.find((w) => w.id === (editingWordId ?? selectedWordId)),
    [words, editingWordId, selectedWordId],
  );

  // Highlighted cells of currently selected/editing word
  const highlightedCells = useMemo(() => {
    const targetWord = editingWordId
      ? {
          id: editingWordId,
          number: 1,
          word: formWord,
          clue: formClue,
          direction: formDirection,
          startPos: { row: formRow - 1, col: formCol - 1 },
        }
      : activeSelectedWord;

    if (!targetWord || !targetWord.word) return new Set<string>();
    const cells = getWordCells(targetWord);
    return new Set(cells.map((c) => coordKey(c.row, c.col)));
  }, [
    editingWordId,
    formWord,
    formClue,
    formDirection,
    formRow,
    formCol,
    activeSelectedWord,
  ]);

  // Handle grid size change
  const handleGridSizeChange = (newRows: number, newCols: number) => {
    playTap();
    const rowsClamped = Math.min(10, Math.max(4, newRows));
    const colsClamped = Math.min(10, Math.max(4, newCols));
    onChange({
      ...value,
      gridSize: { rows: rowsClamped, cols: colsClamped },
    });
  };

  // Reset form
  const resetForm = useCallback(() => {
    setEditingWordId(null);
    setFormWord("");
    setFormClue("");
    setFormDirection("ACROSS");
    setFormRow(1);
    setFormCol(1);
  }, []);

  // Start editing a word
  const handleStartEditWord = (word: CrosswordWord) => {
    playTap();
    setEditingWordId(word.id);
    setSelectedWordId(word.id);
    setFormWord(word.word);
    setFormClue(word.clue);
    setFormDirection(word.direction);
    setFormRow(word.startPos.row + 1);
    setFormCol(word.startPos.col + 1);
  };

  // Save (add or update) word
  const handleSaveWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitizedWord = formWord
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    if (!sanitizedWord) {
      alert("Mohon masukkan kata minimal 2 huruf.");
      return;
    }
    if (sanitizedWord.length < 2) {
      alert("Kata minimal harus memiliki 2 huruf.");
      return;
    }
    if (!formClue.trim()) {
      alert("Mohon masukkan teks petunjuk (clue) untuk kata ini.");
      return;
    }

    const row0 = formRow - 1;
    const col0 = formCol - 1;

    // Check bounds
    if (
      formDirection === "ACROSS" &&
      col0 + sanitizedWord.length > gridSize.cols
    ) {
      alert(
        `Kata mendatar melebihi batas kolom grid (${gridSize.cols} kolom).`,
      );
      return;
    }
    if (
      formDirection === "DOWN" &&
      row0 + sanitizedWord.length > gridSize.rows
    ) {
      alert(`Kata menurun melebihi batas baris grid (${gridSize.rows} baris).`);
      return;
    }

    playPop();

    let updatedWords: CrosswordWord[];
    if (editingWordId !== null) {
      // Update existing word
      updatedWords = words.map((w) =>
        w.id === editingWordId
          ? {
              ...w,
              word: sanitizedWord,
              clue: formClue.trim(),
              direction: formDirection,
              startPos: { row: row0, col: col0 },
            }
          : w,
      );
    } else {
      // Add new word
      const nextId =
        words.length > 0 ? Math.max(...words.map((w) => w.id)) + 1 : 1;
      const newWord: CrosswordWord = {
        id: nextId,
        number: words.length + 1,
        word: sanitizedWord,
        clue: formClue.trim(),
        direction: formDirection,
        startPos: { row: row0, col: col0 },
      };
      updatedWords = [...words, newWord];
    }

    // Auto-renumber words to maintain professional standard
    const renumbered = renumberCrosswordWords(updatedWords);
    onChange({
      ...value,
      words: renumbered,
    });

    resetForm();
  };

  // Delete word
  const handleDeleteWord = (id: number) => {
    playTap();
    const filtered = words.filter((w) => w.id !== id);
    const renumbered = renumberCrosswordWords(filtered);
    onChange({
      ...value,
      words: renumbered,
    });
    if (editingWordId === id) resetForm();
    if (selectedWordId === id) setSelectedWordId(null);
  };

  // Auto renumber button
  const handleAutoRenumber = () => {
    playPop();
    const renumbered = renumberCrosswordWords(words);
    onChange({
      ...value,
      words: renumbered,
    });
  };

  // Click on visual grid cell to pick startPos or select word
  const handleCellClick = (r: number, c: number) => {
    playTap();
    // Update form startPos
    setFormRow(r + 1);
    setFormCol(c + 1);

    const cell = cellMap.get(coordKey(r, c));
    if (cell && cell.wordIds.length > 0) {
      // If clicking an existing word, select it
      const wordId = cell.acrossWordId || cell.downWordId || cell.wordIds[0];
      setSelectedWordId(wordId);
    }
  };

  const acrossWords = useMemo(
    () => words.filter((w) => w.direction === "ACROSS"),
    [words],
  );
  const downWords = useMemo(
    () => words.filter((w) => w.direction === "DOWN"),
    [words],
  );

  return (
    <div className="flex flex-col gap-6 w-full text-duo-dark">
      {/* 1. GRID DIMENSION CONTROLS */}
      <DuoCard elevated className="p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-duo-blue/10 text-duo-blue flex items-center justify-center font-black">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-duo-dark uppercase tracking-wider">
                Dimensi Mini Grid Crossword
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Pilih ukuran grid teka-teki silang (maksimal 10x10)
              </p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 mr-1">
              Preset:
            </span>
            {[
              { r: 5, c: 5, label: "5x5" },
              { r: 6, c: 6, label: "6x6" },
              { r: 8, c: 8, label: "8x8" },
              { r: 10, c: 10, label: "10x10" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                onClick={() => handleGridSizeChange(preset.r, preset.c)}
                className={cn(
                  "px-2.5 py-1 text-xs font-black rounded-xl border transition-all",
                  gridSize.rows === preset.r && gridSize.cols === preset.c
                    ? "bg-duo-blue text-white border-duo-blue-border shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row & Col Steppers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
              Baris (Rows: 4-10)
            </label>
            <input
              type="number"
              min={4}
              max={10}
              disabled={disabled}
              value={gridSize.rows}
              onChange={(e) =>
                handleGridSizeChange(
                  parseInt(e.target.value) || 6,
                  gridSize.cols,
                )
              }
              className="w-full px-3 py-2 border-2 border-duo-gray rounded-xl font-black text-sm text-duo-dark focus:outline-none focus:border-duo-blue"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
              Kolom (Cols: 4-10)
            </label>
            <input
              type="number"
              min={4}
              max={10}
              disabled={disabled}
              value={gridSize.cols}
              onChange={(e) =>
                handleGridSizeChange(
                  gridSize.rows,
                  parseInt(e.target.value) || 6,
                )
              }
              className="w-full px-3 py-2 border-2 border-duo-gray rounded-xl font-black text-sm text-duo-dark focus:outline-none focus:border-duo-blue"
            />
          </div>

          <div className="col-span-2 flex items-end">
            <button
              type="button"
              disabled={disabled || words.length === 0}
              onClick={handleAutoRenumber}
              className="w-full py-2 px-3 rounded-xl border-2 border-slate-200 hover:border-duo-blue hover:bg-duo-blue-light/30 text-duo-dark font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-duo-yellow-border" />
              <span>Otomatiskan Nomor Clue</span>
            </button>
          </div>
        </div>

        {/* Diagnostics & Collisions warning */}
        {(collisionCount > 0 || outOfBoundsCount > 0) && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              {collisionCount > 0 && (
                <p>
                  Perhatian: Terdapat {collisionCount} tabrakan huruf pada titik
                  persilangan kata. Periksa kotak berbingkai merah pada grid.
                </p>
              )}
              {outOfBoundsCount > 0 && (
                <p>
                  Terdapat {outOfBoundsCount} kata yang melebihi batas ukuran
                  grid ({gridSize.rows}x{gridSize.cols}).
                </p>
              )}
            </div>
          </div>
        )}
      </DuoCard>

      {/* 2. MAIN 2-COLUMN WORKSPACE: VISUAL GRID PREVIEW & WORD FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / TOP: VISUAL GRID EDITOR (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-duo-blue" />
              Visual 2D Grid Canvas ({gridSize.rows} &times; {gridSize.cols})
            </h4>
            <span className="text-[11px] font-bold text-slate-400">
              Total {words.length} Kata
            </span>
          </div>

          <DuoCard
            elevated
            className="p-4 sm:p-5 flex flex-col items-center bg-slate-50/50"
          >
            {/* Visual Crossword Grid */}
            <div
              className="grid gap-1.5 p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-inner max-w-full overflow-auto"
              style={{
                gridTemplateColumns: `repeat(${gridSize.cols}, minmax(32px, 44px))`,
                gridTemplateRows: `repeat(${gridSize.rows}, minmax(32px, 44px))`,
              }}
            >
              {Array.from({ length: gridSize.rows }).map((_, r) =>
                Array.from({ length: gridSize.cols }).map((_, c) => {
                  const key = coordKey(r, c);
                  const cell = cellMap.get(key);
                  const isHighlighted = highlightedCells.has(key);
                  const isStartPos = formRow - 1 === r && formCol - 1 === c;
                  const isOccupied = !!cell;
                  const hasCollision = cell?.hasCollision;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleCellClick(r, c)}
                      title={
                        cell
                          ? `Baris ${r + 1}, Kolom ${c + 1}: ${cell.char} (Kata: #${cell.wordIds.join(", ")})`
                          : `Klik untuk jadikan Posisi Awal (Baris ${r + 1}, Kolom ${c + 1})`
                      }
                      className={cn(
                        "relative aspect-square rounded-xl flex items-center justify-center font-black text-sm sm:text-base select-none transition-all duration-150",
                        // Occupied active word cell
                        isOccupied &&
                          !hasCollision && [
                            "bg-white text-duo-dark border-2 border-duo-gray shadow-xs",
                            isHighlighted &&
                              "bg-duo-blue-light/70 border-duo-blue ring-2 ring-duo-blue/30 text-duo-blue-border scale-105 z-10",
                          ],
                        // Collision error cell
                        hasCollision && [
                          "bg-red-50 text-red-600 border-2 border-red-500 animate-pulse z-10 shadow-xs",
                        ],
                        // Empty cell (inactive background)
                        !isOccupied && [
                          "bg-slate-100/70 border border-dashed border-slate-200 text-slate-300 hover:bg-slate-200/60 hover:border-slate-300",
                          isStartPos &&
                            "bg-duo-blue-light/40 border-2 border-dashed border-duo-blue text-duo-blue",
                        ],
                      )}
                    >
                      {/* Clue number in top-left */}
                      {cell?.number !== undefined && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-black text-slate-400 pointer-events-none">
                          {cell.number}
                        </span>
                      )}

                      {/* Display letter or target letter */}
                      {cell ? (
                        <span className="font-black text-duo-dark text-sm sm:text-base">
                          {cell.char}
                        </span>
                      ) : isStartPos ? (
                        <span className="text-[10px] font-black text-duo-blue opacity-70">
                          {formDirection === "ACROSS" ? "→" : "↓"}
                        </span>
                      ) : null}
                    </button>
                  );
                }),
              )}
            </div>

            {/* Helper instruction below visual grid */}
            <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-slate-500">
              <Info className="w-3.5 h-3.5 text-duo-blue shrink-0" />
              <span>
                Klik kotak mana saja pada grid untuk menetapkan posisi awal
                (Start Pos: Baris {formRow}, Kolom {formCol}).
              </span>
            </div>
          </DuoCard>
        </div>

        {/* RIGHT / BOTTOM: ADD / EDIT WORD FORM (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              {editingWordId ? (
                <>
                  <Edit2 className="w-3.5 h-3.5 text-duo-yellow-border" />
                  Edit Kata #{editingWordId}
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-duo-green" />
                  Tambah Kata Baru
                </>
              )}
            </h4>

            {editingWordId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-slate-500 hover:text-duo-red flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal Edit</span>
              </button>
            )}
          </div>

          <DuoCard elevated className="p-5 flex flex-col gap-4">
            {/* Form Fields */}
            <form onSubmit={handleSaveWord} className="flex flex-col gap-4">
              {/* Word Input */}
              <div>
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                  Kunci Jawaban (Huruf Kapital)
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={formWord}
                  onChange={(e) =>
                    setFormWord(
                      e.target.value.toUpperCase().replace(/[^A-Z]/g, ""),
                    )
                  }
                  placeholder="Contoh: BUMI, BULAN, LAUT"
                  className="w-full px-4 py-2.5 border-2 border-duo-gray rounded-2xl font-black text-base text-duo-dark tracking-wider focus:outline-none focus:border-duo-blue uppercase"
                />
                <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
                  {formWord.length} huruf &bull; Hanya huruf A-Z tanpa spasi
                </span>
              </div>

              {/* Clue / Prompt Input */}
              <div>
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                  Petunjuk / Definisi Soal (Clue)
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  value={formClue}
                  onChange={(e) => setFormClue(e.target.value)}
                  placeholder="Contoh: Planet ketiga dari Matahari tempat tinggal manusia..."
                  className="w-full px-4 py-2.5 border-2 border-duo-gray rounded-2xl font-bold text-sm text-duo-dark focus:outline-none focus:border-duo-blue"
                />
              </div>

              {/* Direction & Start Position Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Direction Segmented Control */}
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                    Arah Kotak
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        playTap();
                        setFormDirection("ACROSS");
                      }}
                      className={cn(
                        "py-2 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all",
                        formDirection === "ACROSS"
                          ? "bg-white text-duo-blue shadow-xs font-black"
                          : "text-slate-500 hover:text-duo-dark",
                      )}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Mendatar</span>
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        playTap();
                        setFormDirection("DOWN");
                      }}
                      className={cn(
                        "py-2 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all",
                        formDirection === "DOWN"
                          ? "bg-white text-duo-blue shadow-xs font-black"
                          : "text-slate-500 hover:text-duo-dark",
                      )}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Menurun</span>
                    </button>
                  </div>
                </div>

                {/* Start Position inputs */}
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                    Posisi Awal (Baris, Kolom)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        Baris (1-{gridSize.rows})
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={gridSize.rows}
                        disabled={disabled}
                        value={formRow}
                        onChange={(e) =>
                          setFormRow(
                            Math.min(
                              gridSize.rows,
                              Math.max(1, parseInt(e.target.value) || 1),
                            ),
                          )
                        }
                        className="w-full px-3 py-1.5 border-2 border-duo-gray rounded-xl font-black text-sm text-center focus:outline-none focus:border-duo-blue"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        Kolom (1-{gridSize.cols})
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={gridSize.cols}
                        disabled={disabled}
                        value={formCol}
                        onChange={(e) =>
                          setFormCol(
                            Math.min(
                              gridSize.cols,
                              Math.max(1, parseInt(e.target.value) || 1),
                            ),
                          )
                        }
                        className="w-full px-3 py-1.5 border-2 border-duo-gray rounded-xl font-black text-sm text-center focus:outline-none focus:border-duo-blue"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Word Button */}
              <div className="pt-2">
                <TactileButton
                  type="submit"
                  variant={editingWordId ? "yellow" : "green"}
                  size="md"
                  disabled={disabled || !formWord.trim() || !formClue.trim()}
                  className="w-full justify-center"
                >
                  {editingWordId ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Simpan Perubahan Kata
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Tambahkan ke Grid Crossword
                    </>
                  )}
                </TactileButton>
              </div>
            </form>
          </DuoCard>
        </div>
      </div>

      {/* 3. ORGANIZED WORD LISTS (ACROSS & DOWN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mendatar (Across) */}
        <DuoCard elevated className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-duo-blue" />
              Mendatar (Across) &bull; {acrossWords.length} Kata
            </h4>
          </div>

          <div className="flex flex-col gap-2">
            {acrossWords.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 py-3 text-center">
                Belum ada kata mendatar. Tambahkan melalui form di atas.
              </p>
            ) : (
              acrossWords.map((word) => (
                <WordListItem
                  key={word.id}
                  word={word}
                  isSelected={
                    selectedWordId === word.id || editingWordId === word.id
                  }
                  disabled={disabled}
                  onSelect={() => {
                    playTap();
                    setSelectedWordId(word.id);
                  }}
                  onEdit={() => handleStartEditWord(word)}
                  onDelete={() => handleDeleteWord(word.id)}
                />
              ))
            )}
          </div>
        </DuoCard>

        {/* Menurun (Down) */}
        <DuoCard elevated className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <ArrowDown className="w-4 h-4 text-duo-blue" />
              Menurun (Down) &bull; {downWords.length} Kata
            </h4>
          </div>

          <div className="flex flex-col gap-2">
            {downWords.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 py-3 text-center">
                Belum ada kata menurun. Tambahkan melalui form di atas.
              </p>
            ) : (
              downWords.map((word) => (
                <WordListItem
                  key={word.id}
                  word={word}
                  isSelected={
                    selectedWordId === word.id || editingWordId === word.id
                  }
                  disabled={disabled}
                  onSelect={() => {
                    playTap();
                    setSelectedWordId(word.id);
                  }}
                  onEdit={() => handleStartEditWord(word)}
                  onDelete={() => handleDeleteWord(word.id)}
                />
              ))
            )}
          </div>
        </DuoCard>
      </div>
    </div>
  );
};

interface WordListItemProps {
  word: CrosswordWord;
  isSelected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const WordListItem: React.FC<WordListItemProps> = ({
  word,
  isSelected,
  disabled,
  onSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer",
        isSelected
          ? "bg-duo-blue-light/50 border-duo-blue text-duo-dark shadow-xs"
          : "bg-white border-slate-200 hover:border-slate-300",
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-duo-dark flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
          {word.number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-sm text-duo-dark tracking-wide">
              {word.word}
            </span>
            <Badge variant="gray" className="text-[10px] py-0 px-1.5">
              {word.word.length} huruf
            </Badge>
            <span className="text-[10px] font-bold text-slate-400">
              [B{word.startPos.row + 1}, K{word.startPos.col + 1}]
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
            {word.clue}
          </p>
        </div>
      </div>

      <div
        className="flex items-center gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={onEdit}
          title="Edit kata ini"
          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          title="Hapus kata ini"
          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 hover:border-red-200 border border-slate-200 text-slate-400 hover:text-duo-red flex items-center justify-center transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
