import React from "react";
import { CheckCircle2 } from "lucide-react";
import { QuestionPlugin, EditorProps, PlayerProps } from "@/plugins/core/types";
import { TactileButton } from "@/components/ui/TactileButton";
import { DuoCard } from "@/components/ui/DuoCard";
import { useSoundEffect } from "@/hooks/useSoundEffect";

export interface SampleContent {
  statement: string;
  isCorrectTrue: boolean;
  explanation?: string;
}

export type SampleAnswer = boolean;

/**
 * Sample Editor Component for Teacher Studio
 */
export const SampleEditor: React.FC<EditorProps<SampleContent>> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <DuoCard elevated className="flex flex-col gap-4 text-left">
      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1">
          Pernyataan / Soal
        </label>
        <input
          type="text"
          disabled={disabled}
          value={value.statement}
          onChange={(e) => onChange({ ...value, statement: e.target.value })}
          placeholder="Tuliskan pernyataan soal di sini..."
          className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-bold text-duo-dark focus:outline-none focus:border-duo-blue"
        />
      </div>

      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-2">
          Kunci Jawaban
        </label>
        <div className="flex gap-3">
          <TactileButton
            type="button"
            variant={value.isCorrectTrue ? "green" : "gray"}
            size="md"
            disabled={disabled}
            onClick={() => onChange({ ...value, isCorrectTrue: true })}
          >
            ✓ Benar
          </TactileButton>
          <TactileButton
            type="button"
            variant={!value.isCorrectTrue ? "red" : "gray"}
            size="md"
            disabled={disabled}
            onClick={() => onChange({ ...value, isCorrectTrue: false })}
          >
            ✕ Salah
          </TactileButton>
        </div>
      </div>

      <div>
        <label className="block text-xs font-black uppercase text-slate-400 mb-1">
          Penjelasan (Opsional)
        </label>
        <input
          type="text"
          disabled={disabled}
          value={value.explanation || ""}
          onChange={(e) => onChange({ ...value, explanation: e.target.value })}
          placeholder="Mengapa jawaban ini benar / salah..."
          className="w-full px-4 py-2.5 border-2 border-duo-gray rounded-2xl font-semibold text-sm text-duo-dark focus:outline-none focus:border-duo-blue"
        />
        <p className="mt-1 text-xs font-semibold text-slate-400">
          Teks ini akan muncul sebagai umpan balik setelah siswa menjawab soal.
        </p>
      </div>
    </DuoCard>
  );
};

/**
 * Sample Player Component for Classroom Kiosk Mode
 */
export const SamplePlayer: React.FC<
  PlayerProps<SampleContent, SampleAnswer>
> = ({ content, submittedAnswer, onAnswerSubmit, isEvaluating = false }) => {
  const { playTap } = useSoundEffect();

  const handleSelect = (choice: boolean) => {
    if (isEvaluating) return;
    playTap();
    onAnswerSubmit(choice);
  };

  return (
    <DuoCard
      elevated
      className="flex flex-col items-center text-center p-8 max-w-xl mx-auto w-full"
    >
      <div className="w-12 h-12 rounded-2xl bg-duo-blue-light border-2 border-duo-blue text-duo-blue-border flex items-center justify-center mb-4">
        <CheckCircle2 className="w-7 h-7" />
      </div>

      <h3 className="text-2xl md:text-3xl font-black text-[#3C3C3C] leading-snug">
        {content.statement}
      </h3>
      <p className="text-sm font-semibold text-[#777777] mt-2 mb-6">
        Sentuh salah satu pilihan kartu di bawah ini
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <TactileButton
          variant="green"
          size="lg"
          disabled={isEvaluating}
          onClick={() => handleSelect(true)}
          className={
            submittedAnswer === true ? "ring-4 ring-duo-green-border" : ""
          }
        >
          ✓ BENAR
        </TactileButton>

        <TactileButton
          variant="red"
          size="lg"
          disabled={isEvaluating}
          onClick={() => handleSelect(false)}
          className={
            submittedAnswer === false ? "ring-4 ring-duo-red-border" : ""
          }
        >
          ✕ SALAH
        </TactileButton>
      </div>
    </DuoCard>
  );
};

/**
 * Sample Plugin Definition adhering to QuestionPlugin interface
 */
export const sampleQuestionPlugin: QuestionPlugin<SampleContent, SampleAnswer> =
  {
    type: "true_false",
    title: "True or False (Sample Plugin)",
    description: "Pernyataan lugas dengan evaluasi kartu 3D Benar / Salah.",
    icon: CheckCircle2,
    defaultContent: {
      statement: "Matahari terbit dari sebelah timur.",
      isCorrectTrue: true,
      explanation: "Bumi berotasi dari barat ke timur.",
    },
    EditorComponent: SampleEditor,
    PlayerComponent: SamplePlayer,
    validateAnswer: (content: SampleContent, answer: SampleAnswer) => {
      const isCorrect = content.isCorrectTrue === answer;
      return {
        isCorrect,
        feedbackMessage: isCorrect
          ? "Luar biasa! Jawabanmu 100% tepat."
          : `Kurang tepat. ${content.explanation || ""}`,
      };
    },
    sanitizeForPlayer: (content: SampleContent): Partial<SampleContent> => {
      // Strips out answer key to prevent client inspection tampering
      return {
        statement: content.statement,
      };
    },
  };

export default sampleQuestionPlugin;
