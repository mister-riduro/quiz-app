import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Delete, RotateCcw } from "lucide-react";
import { TactileButton } from "@/components/ui/TactileButton";
import { DuoMathRenderer } from "./DuoMathRenderer";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

export interface MathFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (formulaLatex: string, isBlock: boolean) => void;
  initialLatex?: string;
  initialIsBlock?: boolean;
  title?: string;
}

interface PaletteKey {
  preview: string;
  snippet: string;
  cursorOffset?: number;
  label?: string;
}

// -------------------------------------------------------------
// SYMBOL PALETTE DATA (Organized exactly matching the layout)
// -------------------------------------------------------------

// Basic Tab: 4 Columns/Blocks
const BASIC_GROUPS: { name: string; keys: PaletteKey[] }[] = [
  {
    name: "Aljabar & Kalkulus",
    keys: [
      { preview: "a^2", snippet: "^{2}" },
      { preview: "a^x", snippet: "^{x}" },
      { preview: "a_x", snippet: "_{x}" },
      { preview: "\\sqrt[n]{a}", snippet: "\\sqrt[n]{a}" },
      { preview: "\\frac{a}{x}", snippet: "\\frac{a}{x}" },
      { preview: "|x|", snippet: "|x|" },
      { preview: "[x]", snippet: "[x]" },
      { preview: "\\{x\\}", snippet: "\\{x\\}" },
      { preview: "\\frac{dx}{dy}", snippet: "\\frac{dx}{dy}" },
      {
        preview: "\\frac{\\partial x}{\\partial y}",
        snippet: "\\frac{\\partial x}{\\partial y}",
      },
      { preview: "\\int_x^y", snippet: "\\int_{x}^{y}" },
      { preview: "\\oint_x^y", snippet: "\\oint_{x}^{y}" },
      { preview: "\\log_x y", snippet: "\\log_{x}(y)" },
      { preview: "\\lim_{x \\to y}", snippet: "\\lim_{x \\to y}" },
      { preview: "\\sum_x^y", snippet: "\\sum_{x}^{y}" },
      { preview: "\\prod_x^y", snippet: "\\prod_{x}^{y}" },
      { preview: "\\overleftarrow{xy}", snippet: "\\overleftarrow{xy}" },
      { preview: "\\overline{xy}", snippet: "\\overline{xy}" },
      { preview: "\\overrightarrow{xy}", snippet: "\\overrightarrow{xy}" },
      { preview: "\\cdot", snippet: "\\cdot " },
    ],
  },
  {
    name: "Operator & Relasi",
    keys: [
      { preview: "+", snippet: " + " },
      { preview: "-", snippet: " - " },
      { preview: "\\pm", snippet: "\\pm " },
      { preview: "\\times", snippet: "\\times " },
      { preview: "\\div", snippet: "\\div " },
      { preview: "=", snippet: " = " },
      { preview: "<", snippet: " < " },
      { preview: ">", snippet: " > " },
      { preview: "\\neq", snippet: "\\neq " },
      { preview: "\\le", snippet: "\\le " },
      { preview: "\\ge", snippet: "\\ge " },
      { preview: "\\equiv", snippet: "\\equiv " },
      { preview: "\\sim", snippet: "\\sim " },
      { preview: "\\approx", snippet: "\\approx " },
      { preview: "\\cong", snippet: "\\cong " },
    ],
  },
  {
    name: "Simbol & Geometri",
    keys: [
      { preview: "\\pi", snippet: "\\pi" },
      { preview: "\\theta", snippet: "\\theta" },
      { preview: "\\Delta", snippet: "\\Delta" },
      { preview: "\\alpha", snippet: "\\alpha" },
      { preview: "\\beta", snippet: "\\beta" },
      { preview: "\\nabla", snippet: "\\nabla" },
      { preview: "\\parallel", snippet: "\\parallel " },
      { preview: "\\perp", snippet: "\\perp " },
      { preview: "\\angle", snippet: "\\angle " },
      { preview: "^{\\circ}", snippet: "^{\\circ}" },
      { preview: "\\infty", snippet: "\\infty" },
      { preview: "\\propto", snippet: "\\propto " },
      { preview: "\\leftarrow", snippet: "\\leftarrow " },
      { preview: "\\rightarrow", snippet: "\\rightarrow " },
      { preview: "\\leftrightarrow", snippet: "\\leftrightarrow " },
    ],
  },
  {
    name: "Huruf Yunani Dasar",
    keys: [
      { preview: "\\alpha", snippet: "\\alpha" },
      { preview: "\\beta", snippet: "\\beta" },
      { preview: "\\gamma", snippet: "\\gamma" },
      { preview: "\\zeta", snippet: "\\zeta" },
      { preview: "\\eta", snippet: "\\eta" },
      { preview: "\\theta", snippet: "\\theta" },
      { preview: "\\lambda", snippet: "\\lambda" },
      { preview: "\\mu", snippet: "\\mu" },
      { preview: "\\nu", snippet: "\\nu" },
      { preview: "\\pi", snippet: "\\pi" },
      { preview: "\\rho", snippet: "\\rho" },
      { preview: "\\sigma", snippet: "\\sigma" },
      { preview: "\\phi", snippet: "\\phi" },
      { preview: "\\chi", snippet: "\\chi" },
      { preview: "\\psi", snippet: "\\psi" },
      { preview: "\\omega", snippet: "\\omega" },
    ],
  },
];

// Greek Tab
const GREEK_GROUPS: { name: string; keys: PaletteKey[] }[] = [
  {
    name: "Huruf Kecil (Lowercase)",
    keys: [
      { preview: "\\alpha", snippet: "\\alpha" },
      { preview: "\\beta", snippet: "\\beta" },
      { preview: "\\gamma", snippet: "\\gamma" },
      { preview: "\\delta", snippet: "\\delta" },
      { preview: "\\epsilon", snippet: "\\epsilon" },
      { preview: "\\zeta", snippet: "\\zeta" },
      { preview: "\\eta", snippet: "\\eta" },
      { preview: "\\theta", snippet: "\\theta" },
      { preview: "\\iota", snippet: "\\iota" },
      { preview: "\\kappa", snippet: "\\kappa" },
      { preview: "\\lambda", snippet: "\\lambda" },
      { preview: "\\mu", snippet: "\\mu" },
      { preview: "\\nu", snippet: "\\nu" },
      { preview: "\\xi", snippet: "\\xi" },
      { preview: "\\pi", snippet: "\\pi" },
      { preview: "\\rho", snippet: "\\rho" },
      { preview: "\\sigma", snippet: "\\sigma" },
      { preview: "\\tau", snippet: "\\tau" },
      { preview: "\\upsilon", snippet: "\\upsilon" },
      { preview: "\\phi", snippet: "\\phi" },
      { preview: "\\chi", snippet: "\\chi" },
      { preview: "\\psi", snippet: "\\psi" },
      { preview: "\\omega", snippet: "\\omega" },
    ],
  },
  {
    name: "Huruf Besar (Uppercase)",
    keys: [
      { preview: "\\Gamma", snippet: "\\Gamma" },
      { preview: "\\Delta", snippet: "\\Delta" },
      { preview: "\\Theta", snippet: "\\Theta" },
      { preview: "\\Lambda", snippet: "\\Lambda" },
      { preview: "\\Xi", snippet: "\\Xi" },
      { preview: "\\Pi", snippet: "\\Pi" },
      { preview: "\\Sigma", snippet: "\\Sigma" },
      { preview: "\\Upsilon", snippet: "\\Upsilon" },
      { preview: "\\Phi", snippet: "\\Phi" },
      { preview: "\\Psi", snippet: "\\Psi" },
      { preview: "\\Omega", snippet: "\\Omega" },
    ],
  },
];

// Advance Tab
const ADVANCE_GROUPS: { name: string; keys: PaletteKey[] }[] = [
  {
    name: "Trigonometri & Fungsi",
    keys: [
      { preview: "\\sin", snippet: "\\sin(" },
      { preview: "\\cos", snippet: "\\cos(" },
      { preview: "\\tan", snippet: "\\tan(" },
      { preview: "\\cot", snippet: "\\cot(" },
      { preview: "\\sec", snippet: "\\sec(" },
      { preview: "\\csc", snippet: "\\csc(" },
      { preview: "\\arcsin", snippet: "\\arcsin(" },
      { preview: "\\arccos", snippet: "\\arccos(" },
      { preview: "\\arctan", snippet: "\\arctan(" },
      { preview: "\\ln", snippet: "\\ln(" },
      { preview: "\\log", snippet: "\\log(" },
      { preview: "\\exp", snippet: "\\exp(" },
    ],
  },
  {
    name: "Himpunan & Logika",
    keys: [
      { preview: "\\in", snippet: "\\in " },
      { preview: "\\notin", snippet: "\\notin " },
      { preview: "\\subset", snippet: "\\subset " },
      { preview: "\\subseteq", snippet: "\\subseteq " },
      { preview: "\\cup", snippet: "\\cup " },
      { preview: "\\cap", snippet: "\\cap " },
      { preview: "\\emptyset", snippet: "\\emptyset" },
      { preview: "\\forall", snippet: "\\forall " },
      { preview: "\\exists", snippet: "\\exists " },
      { preview: "\\neg", snippet: "\\neg " },
      { preview: "\\implies", snippet: "\\implies " },
      { preview: "\\iff", snippet: "\\iff " },
    ],
  },
  {
    name: "Vektor & Matriks",
    keys: [
      { preview: "\\vec{v}", snippet: "\\vec{v}" },
      { preview: "\\hat{u}", snippet: "\\hat{u}" },
      {
        preview: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
        snippet: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
      },
      {
        preview: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
        snippet: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
      },
      { preview: "\\det", snippet: "\\det(" },
      { preview: "\\nabla^2", snippet: "\\nabla^2" },
    ],
  },
];

// Quick row for common numbers & variables
const QUICK_CHARS = [
  "x",
  "y",
  "z",
  "a",
  "b",
  "c",
  "n",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "(",
  ")",
];

export const MathFormulaModal: React.FC<MathFormulaModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialLatex = "",
  initialIsBlock = false,
  title,
}) => {
  const [latexInput, setLatexInput] = useState(initialLatex);
  const [isBlock, setIsBlock] = useState(initialIsBlock);
  const [activeTab, setActiveTab] = useState<"Basic" | "Greek" | "Advance">(
    "Basic",
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const { playPop, playTap, playCorrect } = useSoundEffect();

  // Reset or sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setLatexInput(initialLatex || "");
      setIsBlock(initialIsBlock || false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialLatex, initialIsBlock]);

  if (!isOpen) return null;

  // Insert a snippet at current cursor position
  const insertSnippet = (snippet: string) => {
    playPop();
    const input = inputRef.current;
    if (!input) {
      setLatexInput((prev) => `${prev}${snippet}`);
      return;
    }

    const start = input.selectionStart ?? latexInput.length;
    const end = input.selectionEnd ?? latexInput.length;
    const before = latexInput.substring(0, start);
    const after = latexInput.substring(end);

    const nextVal = `${before}${snippet}${after}`;
    setLatexInput(nextVal);

    setTimeout(() => {
      input.focus();
      // If snippet contains empty braces {}, put cursor inside
      const emptyBraceIdx = snippet.indexOf("{}");
      const newPos =
        emptyBraceIdx !== -1
          ? start + emptyBraceIdx + 1
          : start + snippet.length;
      input.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleBackspace = () => {
    playPop();
    const input = inputRef.current;
    if (!input) {
      setLatexInput((prev) => prev.slice(0, -1));
      return;
    }

    const start = input.selectionStart ?? latexInput.length;
    const end = input.selectionEnd ?? latexInput.length;
    if (start === end && start > 0) {
      const before = latexInput.substring(0, start - 1);
      const after = latexInput.substring(end);
      setLatexInput(`${before}${after}`);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start - 1, start - 1);
      }, 10);
    } else if (start !== end) {
      const before = latexInput.substring(0, start);
      const after = latexInput.substring(end);
      setLatexInput(`${before}${after}`);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start);
      }, 10);
    }
  };

  const handleClear = () => {
    playPop();
    setLatexInput("");
    inputRef.current?.focus();
  };

  const handleApply = () => {
    if (!latexInput.trim()) return;
    playCorrect();
    onInsert(latexInput.trim(), isBlock);
    onClose();
  };

  const currentGroups =
    activeTab === "Basic"
      ? BASIC_GROUPS
      : activeTab === "Greek"
        ? GREEK_GROUPS
        : ADVANCE_GROUPS;

  const modalTitle =
    title ||
    (initialLatex ? "Edit Rumus Matematika" : "Sisipkan Rumus Matematika");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full max-w-3xl bg-white rounded-3xl border-2 border-slate-200 border-b-[6px] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-base sm:text-lg font-black text-duo-dark tracking-wide">
                {modalTitle}
              </h3>
              <p className="text-xs font-bold text-slate-400">
                Klik tombol simbol di bawah untuk menyusun rumus matematika
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playTap();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
            {/* Live Formula Preview (Flat container, larger size, no inner shadow/outline) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  Pratinjau Rumus
                </label>
                <div className="flex items-center gap-1 text-[11px] font-black">
                  <button
                    type="button"
                    onClick={() => setIsBlock(false)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                      !isBlock
                        ? "bg-duo-blue text-white border-duo-blue shadow-2xs"
                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200",
                    )}
                  >
                    Sejajar (Inline)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBlock(true)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                      isBlock
                        ? "bg-duo-blue text-white border-duo-blue shadow-2xs"
                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200",
                    )}
                  >
                    Blok Tengah
                  </button>
                </div>
              </div>

              {/* Styled Preview Box */}
              <div className="min-h-[70px] p-4 bg-slate-50/90 rounded-xl flex items-center justify-center overflow-x-auto text-center font-bold text-xl sm:text-2xl text-duo-dark select-none">
                {latexInput.trim() ? (
                  <DuoMathRenderer
                    content={isBlock ? `$$${latexInput}$$` : `$${latexInput}$`}
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-400 italic">
                    Klik tombol simbol di atas untuk melihat pratinjau rumus...
                  </span>
                )}
              </div>
            </div>

            {/* LaTeX Text Input Bar */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                Kode Rumus (LaTeX):
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={latexInput}
                  onChange={(e) => setLatexInput(e.target.value)}
                  placeholder="Klik tombol simbol di atas atau ketik di sini..."
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 font-mono text-sm text-duo-dark placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                  title="Hapus Satu Karakter (Backspace)"
                >
                  <Delete className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                  title="Bersihkan Semua (Clear)"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Tabs Header (Basic / Greek / Advance - Matches Image 1) */}
            <div className="flex items-center gap-6 border-b border-slate-200 px-1">
              {(["Basic", "Greek", "Advance"] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      playTap();
                      setActiveTab(tab);
                    }}
                    className={cn(
                      "pb-2.5 text-sm sm:text-base font-extrabold tracking-wide transition-all cursor-pointer relative",
                      isActive
                        ? "text-duo-blue"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <span>{tab}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-duo-blue rounded-full"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Symbol Palette Keyboard Grid (Like Image 1) */}
            <div className="p-3 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
              {/* Columns of keys */}
              <div className="flex flex-row gap-3 sm:gap-4 overflow-x-auto pb-1 items-start">
                {currentGroups.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="flex flex-col gap-1.5 shrink-0 min-w-fit"
                  >
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-0.5">
                      {group.name}
                    </span>
                    <div className="grid grid-flow-col grid-rows-4 sm:grid-rows-5 gap-1.5">
                      {group.keys.map((key, kIdx) => (
                        <button
                          key={kIdx}
                          type="button"
                          onClick={() => insertSnippet(key.snippet)}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white hover:bg-blue-50/80 active:bg-blue-100 border border-slate-200/90 hover:border-duo-blue/40 text-slate-800 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs overflow-hidden"
                          title={key.snippet}
                        >
                          <div className="pointer-events-none text-xs sm:text-sm select-none">
                            <DuoMathRenderer
                              content={`$${key.preview}$`}
                              inlineOnly
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Numbers & Variable Keys */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 shrink-0">
                  Karakter:
                </span>
                {QUICK_CHARS.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => insertSnippet(char)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-xs font-black text-slate-700 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-5 sm:px-6 py-4 border-t-2 border-slate-100 flex items-center justify-between bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                playTap();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-200/60 transition-all cursor-pointer"
            >
              Batal
            </button>

            <TactileButton
              variant="blue"
              size="md"
              disabled={!latexInput.trim()}
              onClick={handleApply}
              icon={<Check className="w-4 h-4 stroke-[3]" />}
              iconPosition="left"
            >
              {initialLatex ? "Perbarui Rumus" : "Sisipkan ke Soal"}
            </TactileButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MathFormulaModal;
