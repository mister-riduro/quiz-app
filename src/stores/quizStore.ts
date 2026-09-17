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

            // Merge cloud quizzes with any purely local drafts
            set((state) => {
              const cloudIds = new Set(cloudQuizzes.map((q) => q.id));
              const localDrafts = state.quizzes.filter(
                (q) => !cloudIds.has(q.id) && !isValidUUID(q.id),
              );

              return {
                quizzes: [...cloudQuizzes, ...localDrafts],
                isLoading: false,
                syncStatus: "synced",
                errorMessage: null,
              };
            });
          } else {
            // Guest mode
            set({
              isLoading: false,
              syncStatus: "offline",
            });
          }
        } catch (err: any) {
          console.warn(
            "[useQuizStore] Cloud fetch failed, continuing with local storage:",
            err.message,
          );
          set({
            isLoading: false,
            syncStatus: "offline",
            errorMessage: err.message || "Gagal menyinkronkan dengan Supabase",
          });
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
    }),
    {
      name: "eduplay-quizzes-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ quizzes: state.quizzes }),
    },
  ),
);

export default useQuizStore;
