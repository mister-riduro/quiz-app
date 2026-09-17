import React, { useState, useEffect, useRef } from "react";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { X, Sparkles, BookOpen, Save, ArrowRight } from "lucide-react";

export interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    quizData: { title: string; category: string; description: string },
    openEditor: boolean,
  ) => void;
}

const CATEGORY_OPTIONS = [
  "Umum",
  "IPA / Sains",
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "IPS / Sosial",
  "Pendidikan Agama",
  "Seni & Prakarya",
];

export const CreateQuizModal: React.FC<CreateQuizModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("IPA / Sains");
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { playTap, playPop, playVictory } = useSoundEffect();

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setCategory("IPA / Sains");
      setDescription("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStartEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    playVictory();
    onSubmit(
      { title: title.trim(), category, description: description.trim() },
      true,
    );
  };

  const handleSaveDraftOnly = () => {
    if (!title.trim()) return;
    playPop();
    onSubmit(
      { title: title.trim(), category, description: description.trim() },
      false,
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-duo-dark/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg">
        <DuoCard
          elevated
          className="bg-white p-6 sm:p-8 flex flex-col gap-6 relative shadow-2xl border-2 border-slate-200"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              playTap();
              onClose();
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-duo-dark flex items-center justify-center transition-all cursor-pointer"
            aria-label="Tutup Dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-duo-green-light border-2 border-duo-green text-duo-green-border flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-duo-dark tracking-tight">
                Buat Kuis Baru
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#777777] mt-0.5">
                Kuis baru otomatis tersimpan sebagai <strong>Draf</strong> di
                studio Anda.
              </p>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleStartEditor} className="flex flex-col gap-4">
            {/* Judul Kuis */}
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                Judul Kuis <span className="text-duo-red">*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="misal: Tata Surya & Nama Planet Kelas 4"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-duo-gray rounded-2xl font-bold text-sm sm:text-base text-duo-dark placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 transition-all"
              />
            </div>

            {/* Mata Pelajaran / Kategori */}
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-duo-blue" />
                Mata Pelajaran / Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-duo-gray rounded-2xl font-bold text-sm text-duo-dark focus:bg-white focus:outline-none focus:border-duo-blue transition-all"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Deskripsi Kuis (Opsional) */}
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                Deskripsi Singkat (Opsional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keterangan singkat mengenai topik atau petunjuk kuis..."
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-duo-gray rounded-2xl font-bold text-sm text-duo-dark placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-duo-blue transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <TactileButton
                type="submit"
                variant="green"
                size="lg"
                disabled={!title.trim()}
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                className="flex-1 py-3.5 text-sm font-black tracking-wide shadow-md"
              >
                Mulai Rancang Soal
              </TactileButton>

              <TactileButton
                type="button"
                variant="outline"
                size="lg"
                disabled={!title.trim()}
                icon={<Save className="w-4 h-4" />}
                iconPosition="left"
                onClick={handleSaveDraftOnly}
                className="py-3.5 text-sm font-black border-2 border-duo-gray text-slate-700"
              >
                Simpan ke Draft
              </TactileButton>
            </div>
          </form>
        </DuoCard>
      </div>
    </div>
  );
};

export default CreateQuizModal;
