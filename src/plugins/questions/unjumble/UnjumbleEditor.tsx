import React, { useState, useMemo } from "react";
import {
  AlignLeft,
  HelpCircle,
  Sparkles,
  Link2,
  Unlink,
  RotateCcw,
  Shuffle,
  Info,
} from "lucide-react";
import { EditorProps } from "@/plugins/core/types";
import { UnjumbleContent } from "./types";
import { DuoCard } from "@/components/ui/DuoCard";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

/**
 * Split a sentence into individual word tokens by whitespace
 */
function splitSentenceToTokens(sentence: string): string[] {
  return sentence.trim() ? sentence.trim().split(/\s+/).filter(Boolean) : [];
}

export const UnjumbleEditor: React.FC<EditorProps<UnjumbleContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const fullSentence = value?.fullSentence ?? "";
  const tokens = useMemo(() => {
    if (value?.tokens && value.tokens.length > 0) {
      return value.tokens;
    }
    return splitSentenceToTokens(fullSentence);
  }, [value?.tokens, fullSentence]);

  const hint = value?.hint ?? "";
  const [previewShuffleSeed, setPreviewShuffleSeed] = useState<number>(1);

  // Handle sentence input change -> automatically re-tokenizes based on whitespace
  const handleSentenceChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const newSentence = e.target.value;
    const autoTokens = splitSentenceToTokens(newSentence);

    onChange({
      ...value,
      fullSentence: newSentence,
      tokens: autoTokens,
    });
  };

  // Handle merging two adjacent tokens into a single phrase token
  const handleMergeAdjacentTokens = (index: number) => {
    if (index < 0 || index >= tokens.length - 1) return;

    const merged = `${tokens[index]} ${tokens[index + 1]}`;
    const nextTokens = [
      ...tokens.slice(0, index),
      merged,
      ...tokens.slice(index + 2),
    ];

    onChange({
      ...value,
      tokens: nextTokens,
    });
  };

  // Handle splitting a merged phrase token back into individual words
  const handleSplitPhraseToken = (index: number) => {
    const targetToken = tokens[index];
    if (!targetToken) return;

    const parts = splitSentenceToTokens(targetToken);
    if (parts.length <= 1) return;

    const nextTokens = [
      ...tokens.slice(0, index),
      ...parts,
      ...tokens.slice(index + 1),
    ];

    onChange({
      ...value,
      tokens: nextTokens,
    });
  };

  // Reset tokens to default space-separated words of fullSentence
  const handleResetTokens = () => {
    const autoTokens = splitSentenceToTokens(fullSentence);
    onChange({
      ...value,
      tokens: autoTokens,
    });
  };

  // Handle hint change
  const handleHintChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    onChange({
      ...value,
      hint: e.target.value,
    });
  };

  // Live preview scrambled simulation
  const previewTokens = useMemo(() => {
    if (tokens.length <= 1) return tokens;
    const copy = [...tokens];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (i * previewShuffleSeed + 3) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [tokens, previewShuffleSeed]);

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Full Sentence Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <AlignLeft className="w-4 h-4 text-duo-blue" />
            <span>Kunci Jawaban</span>
          </label>
          {tokens.length > 0 && (
            <Badge variant="blue" className="text-[10px]">
              {tokens.length} Balok Kata
            </Badge>
          )}
        </div>

        <textarea
          rows={3}
          disabled={disabled}
          value={fullSentence}
          onChange={handleSentenceChange}
          placeholder="Contoh: Matahari terbit di sebelah timur setiap pagi."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-bold text-base text-duo-dark placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all resize-none"
        />

        <p className="text-xs font-semibold text-[#777777] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-duo-blue shrink-0" />
          <span>
            Ketik kalimat utuh. Sistem otomatis memecahnya menjadi balok kata
            berdasarkan spasi.
          </span>
        </p>
      </div>

      {/* 2. Token Manager: Display Tokens & Merge/Split Options */}
      <div className="flex flex-col gap-3 p-4 sm:p-5 bg-slate-50/80 rounded-2xl border-2 border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Pengaturan Balok Kata (Tokens)
            </h4>
            <p className="text-[11px] font-semibold text-slate-400">
              Klik &quot;Gabung&quot; di antara dua kata jika ingin
              menjadikannya satu frasa khusus.
            </p>
          </div>

          {tokens.length > 1 && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleResetTokens}
              className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-duo-blue transition-colors"
              title="Kembalikan pemisahan kata sesuai spasi kalimat asli"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Spasi Asli</span>
            </button>
          )}
        </div>

        {tokens.length === 0 ? (
          <div className="py-6 px-4 text-center border-2 border-dashed border-duo-gray rounded-xl bg-white">
            <span className="text-xs font-bold text-slate-400 italic">
              Ketik kalimat di atas untuk menghasilkan balok kata secara
              otomatis.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {tokens.map((token, index) => {
              const isMergedPhrase = token.includes(" ");

              return (
                <React.Fragment key={`token-editor-${index}-${token}`}>
                  {/* Word / Phrase Block */}
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 select-none transition-all shadow-xs",
                      isMergedPhrase
                        ? "bg-duo-blue-light/50 border-duo-blue text-duo-dark"
                        : "bg-white border-slate-200 text-duo-dark",
                    )}
                  >
                    <span className="text-sm font-black tracking-tight">
                      {token}
                    </span>

                    {/* Merged Phrase Indicator & Split Button */}
                    {isMergedPhrase && (
                      <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-duo-blue/30">
                        <span className="text-[9px] font-black uppercase tracking-wider text-duo-blue-border bg-duo-blue-light px-1.5 py-0.5 rounded-md">
                          Frasa
                        </span>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSplitPhraseToken(index)}
                          className="p-0.5 text-slate-400 hover:text-duo-red transition-colors"
                          title="Pisahkan kembali frasa ini menjadi kata tunggal"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Merge Button between adjacent tokens */}
                  {index < tokens.length - 1 && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleMergeAdjacentTokens(index)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-extrabold text-slate-400 hover:text-duo-blue hover:bg-duo-blue-light/50 border border-slate-200 hover:border-duo-blue transition-all"
                      title={`Gabungkan "${token}" dan "${tokens[index + 1]}" menjadi satu balok frasa`}
                    >
                      <Link2 className="w-3 h-3 text-duo-blue" />
                      <span>Gabung</span>
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Hint / Context Clue Input */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <HelpCircle className="w-4 h-4 text-duo-green" />
          <span>Petunjuk Soal / Konteks Kalimat (Opsional)</span>
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          value={hint}
          onChange={handleHintChange}
          placeholder="Contoh: Arah terbitnya matahari pada pagi hari."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-semibold text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all resize-none"
        />
      </div>

      {/* 4. Live Preview Section */}
      <div className="pt-4 border-t-2 border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-duo-yellow-border" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Live Preview Balok Teracak Siswa
            </h4>
          </div>
          {tokens.length > 1 && (
            <button
              type="button"
              onClick={() => setPreviewShuffleSeed((s) => s + 1)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold text-duo-blue hover:bg-duo-blue-light/50 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Acak Preview</span>
            </button>
          )}
        </div>

        {tokens.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-duo-gray rounded-2xl bg-slate-50">
            <p className="text-xs font-bold text-slate-400">
              Masukkan kalimat di atas untuk melihat simulasi balok acak siswa.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-5 bg-duo-bg border-2 border-slate-200 rounded-2xl">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Kumpulan Balok Acak Awal Siswa:
            </span>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {previewTokens.map((tok, idx) => (
                <div
                  key={`preview-tok-${idx}-${tok}`}
                  className="px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 font-black text-sm text-duo-dark shadow-xs select-none"
                >
                  {tok}
                </div>
              ))}
            </div>
            {hint && (
              <p className="text-xs font-bold text-slate-500 italic mt-1">
                &quot;{hint}&quot;
              </p>
            )}
          </div>
        )}
      </div>
    </DuoCard>
  );
};
