import React, { useState, useMemo } from 'react';
import { Shuffle, HelpCircle, Sparkles, Type } from 'lucide-react';
import { EditorProps } from '@/plugins/core/types';
import { AnagramContent } from './types';
import { DuoCard } from '@/components/ui/DuoCard';
import { TileToken } from '@/components/ui/TileToken';
import { Badge } from '@/components/ui/Badge';

export const AnagramEditor: React.FC<EditorProps<AnagramContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const targetWord = (value.targetWord || '').toUpperCase();
  const hint = value.hint || '';
  const [shuffleSeed, setShuffleSeed] = useState<number>(1);

  const handleTargetWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    onChange({
      ...value,
      targetWord: sanitized,
    });
  };

  const handleHintChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    onChange({
      ...value,
      hint: e.target.value,
    });
  };

  // Preview scrambled letters
  const previewLetters = useMemo(() => {
    const chars = targetWord.split('').filter(Boolean);
    if (chars.length <= 1) return chars;

    const shuffled = [...chars];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (i * shuffleSeed + 3) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Ensure it looks scrambled if possible
    if (shuffled.join('') === targetWord && chars.length > 1) {
      const temp = shuffled[0];
      shuffled[0] = shuffled[1];
      shuffled[1] = temp;
    }

    return shuffled;
  }, [targetWord, shuffleSeed]);

  return (
    <DuoCard elevated className="flex flex-col gap-6 text-left p-6 sm:p-7">
      {/* 1. Target Word Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
            <Type className="w-4 h-4 text-duo-blue" />
            <span>Kata Target Anagram</span>
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
          placeholder="Contoh: MATAHARI"
          maxLength={15}
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-black text-xl uppercase tracking-widest text-duo-dark placeholder:font-medium placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all"
        />
        <p className="text-xs font-semibold text-[#777777]">
          Hanya huruf alfabet (A-Z). Huruf-huruf ini akan diacak dan disusun kembali oleh siswa dengan menggeser ubin 3D.
        </p>
      </div>

      {/* 2. Hint / Context Clue Input */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <HelpCircle className="w-4 h-4 text-duo-green" />
          <span>Petunjuk Konteks Makna Kata</span>
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          value={hint}
          onChange={handleHintChange}
          placeholder="Contoh: Bintang di pusat tata surya kita yang memancarkan cahaya dan panas ke Bumi."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-semibold text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/10 bg-white transition-all resize-none"
        />
        <p className="text-xs font-semibold text-[#777777]">
          Berikan petunjuk kontekstual atau definisi agar siswa dapat menebak kata yang dimaksud.
        </p>
      </div>

      {/* 3. Live Preview Section */}
      <div className="pt-4 border-t-2 border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-duo-yellow-border" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
              Live Preview Ubin Anagram Siswa
            </h4>
          </div>
          {targetWord.length > 1 && (
            <button
              type="button"
              onClick={() => setShuffleSeed((s) => s + 1)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold text-duo-blue hover:bg-duo-blue-light/50 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Acak Preview</span>
            </button>
          )}
        </div>

        {targetWord.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-duo-gray rounded-2xl bg-slate-50">
            <p className="text-xs font-bold text-slate-400">
              Masukkan kata target di atas untuk melihat simulasi balok anagram teracak.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-5 bg-duo-bg border-2 border-slate-200 rounded-2xl">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Kondisi Awal Balok Teracak:
            </span>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {previewLetters.map((char, idx) => (
                <TileToken
                  key={`preview-anagram-${idx}-${char}`}
                  label={char}
                  size="md"
                  className="pointer-events-none"
                />
              ))}
            </div>
            {hint && (
              <p className="text-xs font-bold text-slate-500 italic mt-1">
                "{hint}"
              </p>
            )}
          </div>
        )}
      </div>
    </DuoCard>
  );
};

