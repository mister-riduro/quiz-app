import { create } from 'zustand';
import { Quiz } from '@/types/quiz';
import { QuestionTypeEnum } from '@/types/database';
import { pluginRegistry } from '@/plugins/core/registry';
import { arrayMove } from '@dnd-kit/sortable';

export interface BuilderQuestion {
  id: string;
  quizId?: string;
  type: QuestionTypeEnum;
  orderIndex: number;
  titlePrompt: string;
  mediaUrl?: string;
  content: any;
  points: number;
}

export interface BuilderState {
  currentQuiz: Partial<Quiz>;
  questions: BuilderQuestion[];
  activeQuestionIndex: number;
  isDirty: boolean;
  isSaving: boolean;

  // Actions
  setQuizTitle: (title: string) => void;
  setQuizMetadata: (data: Partial<Quiz>) => void;
  togglePublish: () => void;
  addQuestion: (type?: QuestionTypeEnum) => void;
  updateQuestion: (index: number, data: Partial<BuilderQuestion>) => void;
  updateActiveQuestionContent: (content: any) => void;
  removeQuestion: (index: number) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;
  setActiveQuestionIndex: (index: number) => void;
  saveQuiz: () => Promise<boolean>;
  resetBuilder: () => void;
  loadQuiz: (quiz: Partial<Quiz>, questions?: BuilderQuestion[]) => void;
}

const DEFAULT_QUIZ: Partial<Quiz> = {
  title: 'Kuis Kelas Baru',
  description: 'Kuis interaktif pembelajaran tatap muka.',
  category: 'Umum',
  isPublished: false,
};

const createInitialQuestion = (
  orderIndex: number = 0,
  type: QuestionTypeEnum = 'true_false'
): BuilderQuestion => {
  let defaultContent: any = {};
  if (pluginRegistry.hasPlugin(type)) {
    defaultContent = pluginRegistry.getPlugin(type).defaultContent;
  }

  return {
    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    orderIndex,
    titlePrompt: 'Tuliskan pertanyaan kuis di sini...',
    mediaUrl: '',
    content: defaultContent,
    points: 100,
  };
};

export const useBuilderStore = create<BuilderState>((set) => ({
  currentQuiz: { ...DEFAULT_QUIZ },
  questions: [createInitialQuestion(0, 'true_false')],
  activeQuestionIndex: 0,
  isDirty: false,
  isSaving: false,

  setQuizTitle: (title: string) =>
    set((state) => ({
      currentQuiz: { ...state.currentQuiz, title },
      isDirty: true,
    })),

  setQuizMetadata: (data: Partial<Quiz>) =>
    set((state) => ({
      currentQuiz: { ...state.currentQuiz, ...data },
      isDirty: true,
    })),

  togglePublish: () =>
    set((state) => ({
      currentQuiz: {
        ...state.currentQuiz,
        isPublished: !state.currentQuiz.isPublished,
      },
      isDirty: true,
    })),

  addQuestion: (type: QuestionTypeEnum = 'true_false') =>
    set((state) => {
      const newQuestion = createInitialQuestion(state.questions.length, type);
      const newQuestions = [...state.questions, newQuestion];
      return {
        questions: newQuestions,
        activeQuestionIndex: newQuestions.length - 1,
        isDirty: true,
      };
    }),

  updateQuestion: (index: number, data: Partial<BuilderQuestion>) =>
    set((state) => {
      const updated = [...state.questions];
      if (updated[index]) {
        updated[index] = { ...updated[index]!, ...data };
      }
      return {
        questions: updated,
        isDirty: true,
      };
    }),

  updateActiveQuestionContent: (content: any) =>
    set((state) => {
      const { activeQuestionIndex, questions } = state;
      const updated = [...questions];
      if (updated[activeQuestionIndex]) {
        updated[activeQuestionIndex] = {
          ...updated[activeQuestionIndex]!,
          content,
        };
      }
      return {
        questions: updated,
        isDirty: true,
      };
    }),

  removeQuestion: (index: number) =>
    set((state) => {
      if (state.questions.length <= 1) {
        // Minimum 1 question required
        return state;
      }
      const filtered = state.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, orderIndex: i }));

      const nextActiveIndex = Math.min(
        state.activeQuestionIndex,
        filtered.length - 1
      );

      return {
        questions: filtered,
        activeQuestionIndex: Math.max(0, nextActiveIndex),
        isDirty: true,
      };
    }),

  reorderQuestions: (startIndex: number, endIndex: number) =>
    set((state) => {
      if (startIndex === endIndex) return state;
      const reordered = arrayMove(state.questions, startIndex, endIndex).map(
        (item, idx) => ({ ...item, orderIndex: idx })
      );
      return {
        questions: reordered,
        activeQuestionIndex: endIndex,
        isDirty: true,
      };
    }),

  setActiveQuestionIndex: (index: number) =>
    set((state) => ({
      activeQuestionIndex: Math.max(0, Math.min(index, state.questions.length - 1)),
    })),

  saveQuiz: async () => {
    set({ isSaving: true });
    // Simulated async saving or Supabase update
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ isSaving: false, isDirty: false });
    return true;
  },

  resetBuilder: () =>
    set({
      currentQuiz: { ...DEFAULT_QUIZ },
      questions: [createInitialQuestion(0, 'true_false')],
      activeQuestionIndex: 0,
      isDirty: false,
      isSaving: false,
    }),

  loadQuiz: (quiz: Partial<Quiz>, questions?: BuilderQuestion[]) =>
    set({
      currentQuiz: { ...quiz },
      questions:
        questions && questions.length > 0
          ? questions
          : [createInitialQuestion(0, 'true_false')],
      activeQuestionIndex: 0,
      isDirty: false,
      isSaving: false,
    }),
}));

export default useBuilderStore;
