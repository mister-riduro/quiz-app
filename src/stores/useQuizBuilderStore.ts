import { create } from 'zustand';
import { Question, Quiz } from '@/types/quiz';

export interface QuizBuilderState {
  currentQuiz: Partial<Quiz> | null;
  questions: Question[];
  activeQuestionIndex: number;

  // Actions
  setQuiz: (quiz: Partial<Quiz>) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (index: number, question: Partial<Question>) => void;
  removeQuestion: (index: number) => void;
  setActiveQuestionIndex: (index: number) => void;
  resetBuilder: () => void;
}

export const useQuizBuilderStore = create<QuizBuilderState>((set) => ({
  currentQuiz: null,
  questions: [],
  activeQuestionIndex: 0,

  setQuiz: (quiz) => set({ currentQuiz: quiz }),

  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, question],
      activeQuestionIndex: state.questions.length,
    })),

  updateQuestion: (index, questionUpdate) =>
    set((state) => {
      const updated = [...state.questions];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...questionUpdate };
      }
      return { questions: updated };
    }),

  removeQuestion: (index) =>
    set((state) => ({
      questions: state.questions.filter((_, i) => i !== index),
      activeQuestionIndex: Math.max(0, index - 1),
    })),

  setActiveQuestionIndex: (index) => set({ activeQuestionIndex: index }),

  resetBuilder: () =>
    set({
      currentQuiz: null,
      questions: [],
      activeQuestionIndex: 0,
    }),
}));

