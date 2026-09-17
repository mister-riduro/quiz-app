import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Quiz } from "@/types/quiz";
import { BuilderQuestion } from "./builderStore";

export interface StoredQuiz extends Quiz {
  questions: BuilderQuestion[];
}

export interface QuizStoreState {
  quizzes: StoredQuiz[];
  saveQuiz: (quiz: StoredQuiz) => void;
  updateQuiz: (id: string, updates: Partial<StoredQuiz>) => void;
  deleteQuiz: (id: string) => void;
  duplicateQuiz: (id: string) => void;
  togglePublish: (id: string) => void;
  getQuizById: (id: string) => StoredQuiz | undefined;
}

export const useQuizStore = create<QuizStoreState>()(
  persist(
    (set, get) => ({
      quizzes: [],

      saveQuiz: (quiz: StoredQuiz) =>
        set((state) => {
          const index = state.quizzes.findIndex((q) => q.id === quiz.id);
          if (index !== -1) {
            const updated = [...state.quizzes];
            updated[index] = {
              ...updated[index]!,
              ...quiz,
              questionsCount: quiz.questions.length,
              updatedAt: new Date().toISOString(),
            };
            return { quizzes: updated };
          } else {
            return {
              quizzes: [
                {
                  ...quiz,
                  questionsCount: quiz.questions.length,
                  createdAt: quiz.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                ...state.quizzes,
              ],
            };
          }
        }),

      updateQuiz: (id: string, updates: Partial<StoredQuiz>) =>
        set((state) => ({
          quizzes: state.quizzes.map((q) =>
            q.id === id
              ? {
                  ...q,
                  ...updates,
                  questionsCount: updates.questions
                    ? updates.questions.length
                    : q.questionsCount,
                  updatedAt: new Date().toISOString(),
                }
              : q,
          ),
        })),

      deleteQuiz: (id: string) =>
        set((state) => ({
          quizzes: state.quizzes.filter((q) => q.id !== id),
        })),

      duplicateQuiz: (id: string) =>
        set((state) => {
          const original = state.quizzes.find((q) => q.id === id);
          if (!original) return state;

          const duplicatedId = `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const duplicatedQuestions = (original.questions || []).map(
            (q, idx) => ({
              ...q,
              id: `q-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              quizId: duplicatedId,
            }),
          );

          const duplicatedQuiz: StoredQuiz = {
            ...original,
            id: duplicatedId,
            title: `${original.title} (Salinan)`,
            isPublished: false, // Default duplicates to Draft
            questionsCount: duplicatedQuestions.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            questions: duplicatedQuestions,
          };

          return {
            quizzes: [duplicatedQuiz, ...state.quizzes],
          };
        }),

      togglePublish: (id: string) =>
        set((state) => ({
          quizzes: state.quizzes.map((q) =>
            q.id === id
              ? {
                  ...q,
                  isPublished: !q.isPublished,
                  updatedAt: new Date().toISOString(),
                }
              : q,
          ),
        })),

      getQuizById: (id: string) => {
        return get().quizzes.find((q) => q.id === id);
      },
    }),
    {
      name: "eduplay-quizzes-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useQuizStore;
