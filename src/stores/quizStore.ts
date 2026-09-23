import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Quiz } from "@/types/quiz";
import { BuilderQuestion } from "./builderStore";
import { quizService, isValidUUID } from "@/lib/quizService";
import { useAuthStore } from "./authStore";
import { generateUUID } from "@/utils/uuid";

export interface StoredQuiz extends Quiz {
  questions: BuilderQuestion[];
  teacherProfile?: {
    full_name?: string;
    school_name?: string;
    avatar_url?: string;
  };
}

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

/**
 * Helper to identify mock or legacy demo quizzes
 */
export const isMockQuiz = (
  quiz: Partial<StoredQuiz> | null | undefined,
): boolean => {
  if (!quiz || !quiz.id) return true;
  // Legacy sample IDs: quiz-1, quiz-2, quiz-3, or any quiz-*
  if (typeof quiz.id === "string" && quiz.id.startsWith("quiz-")) return true;
  // Non-UUID IDs
  if (!isValidUUID(quiz.id)) return true;
  // Mock dummy teachers
  if (quiz.teacherId === "teacher-1" || quiz.teacherId === "teacher-me")
    return true;
  return false;
};

// Immediate cleanup of legacy mock quizzes from browser localStorage on script load
try {
  const STORAGE_KEY = "eduplay-quizzes-storage";
  const raw =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;
  if (raw) {
    const data = JSON.parse(raw);
    if (Array.isArray(data?.state?.quizzes)) {
      const filtered = data.state.quizzes.filter(
        (q: StoredQuiz) => !isMockQuiz(q),
      );
      data.state.quizzes = filtered;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }
} catch {
  // safe fallback
}

export interface QuizStoreState {
  quizzes: StoredQuiz[];
  communityQuizzes: StoredQuiz[];
  isLoading: boolean;
  isLoadingCommunity: boolean;
  syncStatus: SyncStatus;
  errorMessage: string | null;

  // Actions
  fetchQuizzes: (teacherId?: string) => Promise<void>;
  fetchCommunityQuizzes: () => Promise<void>;
  cloneCommunityQuiz: (communityQuiz: StoredQuiz) => Promise<string>;
  saveQuiz: (quiz: StoredQuiz, teacherId?: string) => Promise<string>;
  updateQuiz: (
    id: string,
    updates: Partial<StoredQuiz>,
    teacherId?: string,
  ) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  duplicateQuiz: (id: string, teacherId?: string) => Promise<string | null>;
  togglePublish: (id: string) => Promise<void>;
  getQuizById: (id: string) => StoredQuiz | undefined;
  clearAllMockQuizzes: () => void;
}

export const useQuizStore = create<QuizStoreState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      communityQuizzes: [],
      isLoading: false,
      isLoadingCommunity: false,
      syncStatus: "synced",
      errorMessage: null,

      fetchQuizzes: async (teacherId?: string) => {
        const targetTeacherId = teacherId || useAuthStore.getState().user?.id;

        set({ isLoading: true, errorMessage: null });
        try {
          if (targetTeacherId) {
            set({ syncStatus: "syncing" });
            const cloudQuizzes =
              await quizService.fetchTeacherQuizzes(targetTeacherId);

            // Cloud quizzes are the authentic quizzes for the logged-in teacher
            set({
              quizzes: cloudQuizzes,
              isLoading: false,
              syncStatus: "synced",
              errorMessage: null,
            });
          } else {
            // Guest mode: purge any mock quizzes from state
            set((state) => ({
              quizzes: state.quizzes.filter((q) => !isMockQuiz(q)),
              isLoading: false,
              syncStatus: "offline",
            }));
          }
        } catch (err: any) {
          console.warn(
            "[useQuizStore] Cloud fetch failed, continuing with local storage:",
            err.message,
          );
          set((state) => ({
            quizzes: state.quizzes.filter((q) => !isMockQuiz(q)),
            isLoading: false,
            syncStatus: "offline",
            errorMessage: err.message || "Gagal menyinkronkan dengan Supabase",
          }));
        }
      },

      fetchCommunityQuizzes: async () => {
        set({ isLoadingCommunity: true });
        try {
          const publicQuizzes = await quizService.fetchPublishedQuizzes();
          set({ communityQuizzes: publicQuizzes, isLoadingCommunity: false });
        } catch (err: any) {
          console.warn("[useQuizStore] Community fetch warning:", err.message);
          set({ isLoadingCommunity: false });
        }
      },

      cloneCommunityQuiz: async (communityQuiz: StoredQuiz) => {
        const user = useAuthStore.getState().user;
        const newId = generateUUID();
        const newQuestions: BuilderQuestion[] = (
          communityQuiz.questions || []
        ).map((q, idx) => ({
          ...q,
          id: generateUUID(),
          quizId: newId,
          orderIndex: idx,
        }));

        const clonedQuiz: StoredQuiz = {
          ...communityQuiz,
          id: newId,
          teacherId: user?.id || "teacher-me",
          title: `${communityQuiz.title} (Salinan Komunitas)`,
          isPublished: false, // Cloned quiz starts as private draft for teacher
          questionsCount: newQuestions.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          questions: newQuestions,
          teacherProfile: undefined,
        };

        await get().saveQuiz(clonedQuiz, user?.id);
        return newId;
      },

      saveQuiz: async (quiz: StoredQuiz, teacherId?: string) => {
        const effectiveTeacherId =
          teacherId ||
          (quiz.teacherId && quiz.teacherId !== "teacher-me"
            ? quiz.teacherId
            : undefined) ||
          useAuthStore.getState().user?.id;

        const quizId = isValidUUID(quiz.id) ? quiz.id : generateUUID();
        const normalizedQuiz: StoredQuiz = {
          ...quiz,
          id: quizId,
          teacherId: effectiveTeacherId || "teacher-me",
          questionsCount: quiz.questions?.length ?? 0,
          updatedAt: new Date().toISOString(),
          createdAt: quiz.createdAt || new Date().toISOString(),
          questions: (quiz.questions || []).map((q, idx) => ({
            ...q,
            id: isValidUUID(q.id) ? q.id : generateUUID(),
            quizId,
            orderIndex: idx,
          })),
        };

        // 1. Optimistic local update
        set((state) => {
          const index = state.quizzes.findIndex(
            (q) => q.id === quizId || q.id === quiz.id,
          );
          if (index !== -1) {
            const updated = [...state.quizzes];
            updated[index] = normalizedQuiz;
            return { quizzes: updated };
          } else {
            return { quizzes: [normalizedQuiz, ...state.quizzes] };
          }
        });

        // 2. Cloud sync if teacher is logged in
        if (effectiveTeacherId && effectiveTeacherId !== "teacher-me") {
          set({ syncStatus: "syncing" });
          try {
            const syncedQuiz = await quizService.saveQuizToCloud(
              normalizedQuiz,
              effectiveTeacherId,
            );

            set((state) => ({
              quizzes: state.quizzes.map((q) =>
                q.id === quizId ? syncedQuiz : q,
              ),
              syncStatus: "synced",
              errorMessage: null,
            }));
          } catch (err: any) {
            console.error("[useQuizStore] saveQuizToCloud failed:", err);
            set({
              syncStatus: "error",
              errorMessage:
                "Gagal menyimpan ke Supabase. Data tersimpan di browser.",
            });
          }
        } else {
          set({ syncStatus: "offline" });
        }

        return quizId;
      },

      updateQuiz: async (
        id: string,
        updates: Partial<StoredQuiz>,
        teacherId?: string,
      ) => {
        const target = get().quizzes.find((q) => q.id === id);
        if (!target) return;

        const updatedQuiz: StoredQuiz = {
          ...target,
          ...updates,
          questionsCount: updates.questions
            ? updates.questions.length
            : target.questionsCount,
          updatedAt: new Date().toISOString(),
        };

        await get().saveQuiz(updatedQuiz, teacherId);
      },

      deleteQuiz: async (id: string) => {
        // Optimistic delete
        set((state) => ({
          quizzes: state.quizzes.filter((q) => q.id !== id),
        }));

        const user = useAuthStore.getState().user;
        if (user && isValidUUID(id)) {
          set({ syncStatus: "syncing" });
          try {
            await quizService.deleteQuizFromCloud(id);
            set({ syncStatus: "synced" });
          } catch (err: any) {
            console.error("[useQuizStore] deleteQuizFromCloud failed:", err);
            set({
              syncStatus: "error",
              errorMessage: "Gagal menghapus kuis dari Supabase.",
            });
          }
        }
      },

      duplicateQuiz: async (id: string, teacherId?: string) => {
        const original = get().quizzes.find((q) => q.id === id);
        if (!original) return null;

        const duplicatedId = generateUUID();
        const duplicatedQuestions: BuilderQuestion[] = (
          original.questions || []
        ).map((q, idx) => ({
          ...q,
          id: generateUUID(),
          quizId: duplicatedId,
          orderIndex: idx,
        }));

        const duplicatedQuiz: StoredQuiz = {
          ...original,
          id: duplicatedId,
          title: `${original.title} (Salinan)`,
          isPublished: false,
          questionsCount: duplicatedQuestions.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          questions: duplicatedQuestions,
        };

        await get().saveQuiz(duplicatedQuiz, teacherId);
        return duplicatedId;
      },

      togglePublish: async (id: string) => {
        const target = get().quizzes.find((q) => q.id === id);
        if (!target) return;

        const nextPublished = !target.isPublished;

        // Optimistic update
        set((state) => ({
          quizzes: state.quizzes.map((q) =>
            q.id === id
              ? {
                  ...q,
                  isPublished: nextPublished,
                  updatedAt: new Date().toISOString(),
                }
              : q,
          ),
        }));

        const user = useAuthStore.getState().user;
        if (user && isValidUUID(id)) {
          set({ syncStatus: "syncing" });
          try {
            await quizService.togglePublishInCloud(id, nextPublished);
            set({ syncStatus: "synced" });
            // Also refresh community quizzes
            get().fetchCommunityQuizzes();
          } catch (err: any) {
            console.error("[useQuizStore] togglePublishInCloud failed:", err);
            set({
              syncStatus: "error",
              errorMessage: "Gagal mengubah status publikasi di Supabase.",
            });
          }
        }
      },

      getQuizById: (id: string) => {
        return (
          get().quizzes.find((q) => q.id === id) ||
          get().communityQuizzes.find((q) => q.id === id)
        );
      },

      clearAllMockQuizzes: () => {
        set((state) => ({
          quizzes: state.quizzes.filter((q) => !isMockQuiz(q)),
        }));
        try {
          const STORAGE_KEY = "eduplay-quizzes-storage";
          const raw =
            typeof localStorage !== "undefined"
              ? localStorage.getItem(STORAGE_KEY)
              : null;
          if (raw) {
            const data = JSON.parse(raw);
            if (Array.isArray(data?.state?.quizzes)) {
              data.state.quizzes = data.state.quizzes.filter(
                (q: StoredQuiz) => !isMockQuiz(q),
              );
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }
          }
        } catch {
          // ignore
        }
      },
    }),
    {
      name: "eduplay-quizzes-storage",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any) => {
        const currentQuizzes = (persistedState?.quizzes || []) as StoredQuiz[];
        return {
          ...persistedState,
          quizzes: currentQuizzes.filter((q) => !isMockQuiz(q)),
        };
      },
      partialize: (state) => ({
        quizzes: state.quizzes.filter((q) => !isMockQuiz(q)),
      }),
    },
  ),
);

export default useQuizStore;
