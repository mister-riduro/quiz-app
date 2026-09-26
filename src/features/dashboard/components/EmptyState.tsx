import React from "react";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { PlusCircle, Sparkles, Gamepad2 } from "lucide-react";

export interface EmptyStateProps {
  onCreateQuiz: () => void;
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateQuiz,
  title = "Belum Ada Kuis di Studio Anda!",
  description = "Mulai susun kuis interaktif pertama Anda. Pilih dari 8 mini-game seru dan langsung mainkan bersama murid di kelas!",
}) => {
  const { playTap, playVictory } = useSoundEffect();

  return (
    <DuoCard
      elevated
      className="w-full max-w-2xl mx-auto flex flex-col items-center text-center p-8 sm:p-12 my-6 bg-white"
    >
      {/* Clean Studio Vector Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-[13px] bg-emerald-50 border-2 border-duo-green/30 flex items-center justify-center shadow-xs">
          <Gamepad2 className="w-12 h-12 text-duo-green" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-8 h-8 rounded-[10px] bg-amber-400 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-4 h-4 fill-current" />
        </div>
      </div>

      {/* Texts */}
      <h3 className="text-2xl sm:text-3xl font-black text-duo-dark tracking-tight max-w-md">
        {title}
      </h3>
      <p className="text-sm sm:text-base font-semibold text-slate-500 max-w-lg mt-2 mb-8 leading-relaxed">
        {description}
      </p>

      {/* CTA Button */}
      <TactileButton
        variant="green"
        size="lg"
        icon={<PlusCircle className="w-5 h-5" />}
        onClick={() => {
          playTap();
          playVictory();
          onCreateQuiz();
        }}
        className="px-8 shadow-md"
      >
        Buat Kuis Pertama Sekarang
      </TactileButton>
    </DuoCard>
  );
};

export default EmptyState;
