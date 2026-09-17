import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface DuoBottomSheetProps {
  isOpen: boolean;
  isCorrect: boolean;
  message?: string;
  solutionExplanation?: string;
  onContinue: () => void;
}

export const DuoBottomSheet: React.FC<DuoBottomSheetProps> = ({
  isOpen,
  isCorrect,
  message,
  solutionExplanation,
  onContinue,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 p-6 md:p-8 z-50 transition-all border-t-2',
        isCorrect
          ? 'bg-[#D7FFB8] border-[#46A302] text-[#46A302]'
          : 'bg-[#FFDFE0] border-[#EA2B2B] text-[#EA2B2B]'
      )}
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {isCorrect ? (
            <CheckCircle2 className="w-10 h-10 text-[#58CC02] flex-shrink-0 mt-1" />
          ) : (
            <XCircle className="w-10 h-10 text-[#FF4B4B] flex-shrink-0 mt-1" />
          )}
          <div>
            <h3 className="text-xl md:text-2xl font-black">
              {isCorrect ? 'Luar Biasa!' : 'Jawaban Kurang Tepat!'}
            </h3>
            <p className="text-sm md:text-base font-semibold text-[#4B4B4B] mt-1">
              {message || (isCorrect ? 'Kamu berhasil menjawab dengan benar.' : solutionExplanation || 'Coba perhatikan baik-baik pada soal berikutnya!')}
            </p>
          </div>
        </div>
        <Button
          variant={isCorrect ? 'green' : 'red'}
          size="lg"
          onClick={onContinue}
          className="w-full md:w-auto min-w-[180px]"
        >
          Lanjutkan
        </Button>
      </div>
    </div>
  );
};

