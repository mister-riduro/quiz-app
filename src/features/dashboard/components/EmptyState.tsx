import React from 'react';
import { DuoCard } from '@/components/ui/DuoCard';
import { TactileButton } from '@/components/ui/TactileButton';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { PlusCircle, Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  onCreateQuiz: () => void;
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateQuiz,
  title = 'Belum Ada Kuis di Studio Anda!',
  description = 'Mulai susun kuis interaktif pertama Anda. Pilih dari 8 mini-game seru dan langsung mainkan bersama murid di kelas!',
}) => {
  const { playTap, playVictory } = useSoundEffect();

  return (
    <DuoCard
      elevated
      className="w-full max-w-2xl mx-auto flex flex-col items-center text-center p-8 sm:p-12 my-6 bg-white"
    >
      {/* Cheerful Mascot SVG Illustration (Duolingo / EduPlay Gamified Mascot) */}
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-duo-green-light via-duo-yellow-light to-duo-blue-light border-4 border-duo-green border-b-8 border-b-duo-green-border flex items-center justify-center text-5xl shadow-md transform -rotate-2 hover:rotate-0 transition-transform">
          🦉
        </div>
        {/* Floating Gamified Badges */}
        <div className="absolute -top-2 -right-3 w-10 h-10 rounded-2xl bg-duo-yellow border-2 border-duo-yellow-border flex items-center justify-center text-white shadow-md animate-bounce">
          <Sparkles className="w-5 h-5 fill-current text-duo-dark" />
        </div>
        <div className="absolute -bottom-2 -left-2 px-2.5 py-1 rounded-xl bg-duo-blue border-2 border-duo-blue-border text-white text-[10px] font-black uppercase tracking-wider shadow">
          Ready!
        </div>
      </div>

      {/* Texts */}
      <h3 className="text-2xl sm:text-3xl font-black text-duo-dark tracking-tight max-w-md">
        {title}
      </h3>
      <p className="text-sm sm:text-base font-semibold text-[#777777] max-w-lg mt-2 mb-8 leading-relaxed">
        {description}
      </p>

      {/* CTA Button */}
      <TactileButton
        variant="green"
        size="lg"
        icon={<PlusCircle className="w-6 h-6" />}
        onClick={() => {
          playTap();
          playVictory();
          onCreateQuiz();
        }}
        className="px-8 py-4 text-base tracking-wider font-black shadow-lg"
      >
        + Buat Kuis Pertama Sekarang
      </TactileButton>
    </DuoCard>
  );
};

export default EmptyState;

