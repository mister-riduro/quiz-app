import React, { useState, useRef } from "react";
import { DuoMathRenderer } from "./DuoMathRenderer";
import { MathFormulaModal } from "./MathFormulaModal";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";

export interface DuoMathTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

interface FormulaMatch {
  id: string;
  fullMatch: string;
  latex: string;
  start: number;
  end: number;
  isBlock: boolean;
}

/**
 * Parses and extracts all math formulas from a text string with start/end indices.
 */
function extractFormulas(text: string): FormulaMatch[] {
  if (!text) return [];
  const regex =
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g;
  const matches: FormulaMatch[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    let latex = raw;
    let isBlock = false;

    if (raw.startsWith("$$") && raw.endsWith("$$")) {
      latex = raw.slice(2, -2).trim();
      isBlock = true;
    } else if (raw.startsWith("\\[") && raw.endsWith("\\]")) {
      latex = raw.slice(2, -2).trim();
      isBlock = true;
    } else if (raw.startsWith("$") && raw.endsWith("$")) {
      latex = raw.slice(1, -1).trim();
      isBlock = false;
    } else if (raw.startsWith("\\(") && raw.endsWith("\\)")) {
      latex = raw.slice(2, -2).trim();
      isBlock = false;
    }

    matches.push({
      id: `formula-${idx++}`,
      fullMatch: raw,
      latex,
      start: match.index,
      end: match.index + raw.length,
      isBlock,
    });
  }

  return matches;
}

export const DuoMathTextarea: React.FC<DuoMathTextareaProps> = ({
  value,
  onChange,
  placeholder = "Tuliskan soal di sini (klik tombol fx untuk menyisipkan rumus matematika)...",
  rows = 2,
  label = "Soal",
  disabled = false,
  className,
  helperText,
}) => {
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<FormulaMatch | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { playTap } = useSoundEffect();

  // Detect if current text contains any math LaTeX markers ($ or \( or \[)
  const hasMath =
    value.includes("$") || value.includes("\\(") || value.includes("\\[");

  // Helper to insert text at current cursor position
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value ? `${value} ${textToInsert}` : textToInsert);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const before = value.substring(0, start);
    const after = value.substring(end);

    const nextValue = `${before}${textToInsert}${after}`;
    onChange(nextValue);

    // Reposition cursor right after inserted formula
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Called when modal inserts a new formula or updates an existing one
  const handleInsertFromModal = (latex: string, isBlock: boolean) => {
    const formatted = isBlock ? `\n$$${latex}$$\n` : `$${latex}$`;

    if (editingFormula) {
      // Replace existing formula in text
      const before = value.substring(0, editingFormula.start);
      const after = value.substring(editingFormula.end);
      const nextValue = `${before}${formatted}${after}`;
      onChange(nextValue);
      setEditingFormula(null);
    } else {
      // Insert new formula at cursor
      insertTextAtCursor(formatted);
    }
  };

  // Detect clicking inside textarea on an existing formula to open modal for editing
  const handleTextareaClick = () => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart ?? 0;
    const formulas = extractFormulas(value);

    // Check if clicked position is inside any formula
    const clicked = formulas.find((f) => pos >= f.start && pos <= f.end);
    if (clicked) {
      playTap();
      setEditingFormula(clicked);
      setIsFormulaModalOpen(true);
    }
  };

  // Click on rendered formula in the preview strip
  const handlePreviewFormulaClick = (latex: string, isBlock: boolean) => {
    if (disabled) return;
    playTap();
    const formulas = extractFormulas(value);
    const found = formulas.find((f) => f.latex.trim() === latex.trim()) || {
      id: "preview-formula",
      fullMatch: isBlock ? `$$${latex}$$` : `$${latex}$`,
      latex,
      start: value.indexOf(latex) > 0 ? value.indexOf(latex) - 1 : 0,
      end:
        value.indexOf(latex) > 0
          ? value.indexOf(latex) + latex.length + 1
          : latex.length,
      isBlock,
    };

    setEditingFormula(found);
    setIsFormulaModalOpen(true);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Top Header - Clean label without top buttons */}
      {label && (
        <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
          {label}
        </label>
      )}

      {/* Editor Content Area with Embedded Bottom-Right Formula Button */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={rows}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onClick={handleTextareaClick}
            placeholder={placeholder}
            className="w-full px-4 py-3 pb-12 pr-12 border-2 border-duo-gray rounded-2xl font-bold text-sm sm:text-base text-duo-dark placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 bg-white transition-all resize-none"
          />

          {/* Icon Button (Without text) inside textarea at bottom-right */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              playTap();
              setEditingFormula(null);
              setIsFormulaModalOpen(true);
            }}
            className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-xl bg-white hover:bg-duo-blue/10 active:bg-duo-blue/20 text-duo-blue border-2 border-slate-200 hover:border-duo-blue/40 flex items-center justify-center cursor-pointer shadow-xs transition-all active:scale-90"
            title="Sisipkan Rumus Matematika"
          >
            <span className="font-serif italic font-black text-sm select-none">
              fx
            </span>
          </button>
        </div>

        {/* Live Formula Preview Strip with click-to-edit capability */}
        {hasMath && value.trim() && (
          <div className="p-3.5 bg-slate-50/90 rounded-xl flex flex-col gap-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Pratinjau Rumus
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Klik rumus untuk mengedit
              </span>
            </div>
            <div className="font-bold text-base sm:text-lg lg:text-xl text-duo-dark py-1 leading-relaxed">
              <DuoMathRenderer
                content={value}
                onFormulaClick={handlePreviewFormulaClick}
              />
            </div>
          </div>
        )}
      </div>

      {/* Helper text if provided */}
      {helperText && (
        <p className="text-xs font-semibold text-[#777777]">{helperText}</p>
      )}

      {/* Modal Dialog for formula builder & editor */}
      <MathFormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => {
          setIsFormulaModalOpen(false);
          setEditingFormula(null);
        }}
        onInsert={handleInsertFromModal}
        initialLatex={editingFormula?.latex || ""}
        initialIsBlock={editingFormula?.isBlock || false}
        title={
          editingFormula ? "Edit Rumus Matematika" : "Sisipkan Rumus Matematika"
        }
      />
    </div>
  );
};

export default DuoMathTextarea;
