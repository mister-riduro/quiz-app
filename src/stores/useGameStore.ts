import { create } from 'zustand';

export interface GameState {
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  streak: number;
  isEvaluating: boolean;
  isCorrect: boolean | null;
  isFinished: boolean;

  // Actions
  setTotalQuestions: (total: number) => void;
  evaluateAnswer: (isCorrect: boolean, points: number) => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentQuestionIndex: 0,
  totalQuestions: 0,
  score: 0,
  streak: 0,
  isEvaluating: false,
  isCorrect: null,
  isFinished: false,

  setTotalQuestions: (total) => set({ totalQuestions: total }),

  evaluateAnswer: (isCorrect, points) =>
    set((state) => ({
      isEvaluating: true,
      isCorrect,
      score: isCorrect ? state.score + points : state.score,
      streak: isCorrect ? state.streak + 1 : 0,
    })),

  nextQuestion: () =>
    set((state) => {
      const nextIndex = state.currentQuestionIndex + 1;
      const isFinished = nextIndex >= state.totalQuestions;
      return {
        currentQuestionIndex: nextIndex,
        isEvaluating: false,
        isCorrect: null,
        isFinished,
      };
    }),

  resetGame: () =>
    set({
      currentQuestionIndex: 0,
      score: 0,
      streak: 0,
      isEvaluating: false,
      isCorrect: null,
      isFinished: false,
    }),
}));

