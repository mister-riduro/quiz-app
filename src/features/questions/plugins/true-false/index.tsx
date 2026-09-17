import React from 'react';
import { QuestionPlugin, EditorProps, PlayerProps, ValidationResult } from '../../core/types';

export interface TrueFalseContent {
  prompt: string;
  isCorrectTrue: boolean;
  explanation?: string;
  mediaUrl?: string;
}

const TrueFalseEditor: React.FC<EditorProps<TrueFalseContent>> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl border-2 border-[#E5E5E5]">
      <label className="font-bold text-sm text-[#4B4B4B]">Pertanyaan / Pernyataan:</label>
      <input
        type="text"
        className="w-full px-4 py-2 border-2 border-[#E5E5E5] rounded-xl focus:outline-none focus:border-[#1CB0F6]"
        value={value.prompt}
        onChange={(e) => onChange({ ...value, prompt: e.target.value })}
        placeholder="Masukkan pernyataan..."
      />
      <div className="flex gap-4 items-center mt-2">
        <span className="font-bold text-sm">Kunci Jawaban:</span>
        <button
          type="button"
          onClick={() => onChange({ ...value, isCorrectTrue: true })}
          className={`px-4 py-2 rounded-xl font-extrabold border-b-4 transition-all ${
            value.isCorrectTrue
              ? 'bg-[#58CC02] border-[#46A302] text-white'
              : 'bg-[#E5E5E5] border-[#CECECE] text-[#4B4B4B]'
          }`}
        >
          BENAR
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...value, isCorrectTrue: false })}
          className={`px-4 py-2 rounded-xl font-extrabold border-b-4 transition-all ${
            !value.isCorrectTrue
              ? 'bg-[#FF4B4B] border-[#EA2B2B] text-white'
              : 'bg-[#E5E5E5] border-[#CECECE] text-[#4B4B4B]'
          }`}
        >
          SALAH
        </button>
      </div>
    </div>
  );
};

const TrueFalsePlayer: React.FC<PlayerProps<TrueFalseContent, boolean>> = ({
  content,
  onAnswerSubmit,
  submittedAnswer,
  isEvaluating,
}) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[#4B4B4B]">
        {content.prompt}
      </h2>
      <div className="grid grid-cols-2 gap-4 w-full mt-4">
        <button
          type="button"
          disabled={isEvaluating}
          onClick={() => onAnswerSubmit(true)}
          className={`btn-3d-press py-6 text-xl tracking-wide rounded-2xl text-white bg-[#58CC02] border-[#46A302] shadow-sm ${
            submittedAnswer === true ? 'ring-4 ring-[#46A302]' : ''
          }`}
        >
          BENAR
        </button>
        <button
          type="button"
          disabled={isEvaluating}
          onClick={() => onAnswerSubmit(false)}
          className={`btn-3d-press py-6 text-xl tracking-wide rounded-2xl text-white bg-[#FF4B4B] border-[#EA2B2B] shadow-sm ${
            submittedAnswer === false ? 'ring-4 ring-[#EA2B2B]' : ''
          }`}
        >
          SALAH
        </button>
      </div>
    </div>
  );
};

export const trueFalsePlugin: QuestionPlugin<TrueFalseContent, boolean> = {
  type: 'true_false',
  label: 'Benar atau Salah',
  icon: 'CheckCircle2',
  description: 'Pernyataan sederhana dengan dua pilihan kartu 3D masif.',
  defaultContent: {
    prompt: '',
    isCorrectTrue: true,
  },
  EditorComponent: TrueFalseEditor,
  PlayerComponent: TrueFalsePlayer,
  validateAnswer: (content: TrueFalseContent, answer: boolean): ValidationResult => {
    const isCorrect = content.isCorrectTrue === answer;
    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? 'Luar biasa, jawaban kamu tepat!' : 'Kurang tepat, coba ingat lagi materinya ya!',
    };
  },
  sanitizeForPlayer: (content: TrueFalseContent): Partial<TrueFalseContent> => {
    // Hide correct answer from client payload in multiplayer
    const { isCorrectTrue: _, ...sanitized } = content;
    return sanitized;
  },
};

