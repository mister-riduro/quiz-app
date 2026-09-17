import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { DatabaseProfile } from "@/types/database";

export interface AuthState {
  user: User | null;
  profile: DatabaseProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    schoolName?: string,
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  fetchProfile: (userId: string) => Promise<DatabaseProfile | null>;
}

/**
 * Translates raw Supabase error messages into friendly, constructive Indonesian messages
 */
function translateAuthError(errorMsg: string): string {
  const lower = errorMsg.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email atau kata sandi tidak cocok. Silakan periksa kembali.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already exists")
  ) {
    return "Alamat email ini sudah terdaftar. Silakan langsung masuk.";
  }
  if (
    lower.includes("password should be at least") ||
    lower.includes("at least 6 characters")
  ) {
    return "Kata sandi minimal harus terdiri dari 6 karakter demi keamanan.";
  }
  if (lower.includes("invalid email") || lower.includes("valid email")) {
    return "Format alamat email belum benar. Silakan periksa kembali.";
  }
  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("failed to fetch")
  ) {
    return "Koneksi jaringan terputus. Silakan periksa koneksi internet Anda.";
  }
  if (lower.includes("email not confirmed")) {
    return "Email Anda belum dikonfirmasi. Silakan periksa tautan di kotak masuk email Anda.";
  }
  return "Terjadi kendala saat menghubungi server. Silakan coba sesaat lagi.";
}

let authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      error: null,

      fetchProfile: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (!error && data) {
            set({ profile: data as DatabaseProfile });
            return data as DatabaseProfile;
          }

          // If profile record is missing, ensure it is upserted from user auth metadata
          const currentUser = get().user;
          if (currentUser && currentUser.id === userId) {
            const metadata = currentUser.user_metadata || {};
            const fallbackProfile: DatabaseProfile = {
              id: userId,
              full_name:
                metadata.full_name ||
                currentUser.email?.split("@")[0] ||
                "Guru EduPlay",
              email: currentUser.email || "",
              school_name: metadata.school_name || null,
              avatar_url: metadata.avatar_url || null,
              created_at: new Date().toISOString(),
            };

            const { data: upsertedData } = await (
              supabase.from("profiles") as any
            )
              .upsert(fallbackProfile, { onConflict: "id" })
              .select()
              .single();

            const resolved =
              (upsertedData as DatabaseProfile) || fallbackProfile;
            set({ profile: resolved });
            return resolved;
          }

          return null;
        } catch (err) {
          console.warn("[EduPlay Auth] Profile fetch/sync warning:", err);
          return null;
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({
              error: translateAuthError(error.message),
              isLoading: false,
            });
            return false;
          }

          set({
            user: data.user,
            session: data.session,
            error: null,
            isLoading: false,
          });

          if (data.user) {
            await get().fetchProfile(data.user.id);
          }

          return true;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Login gagal";
          set({ error: translateAuthError(msg), isLoading: false });
          return false;
        }
      },

      signUp: async (
        email: string,
        password: string,
        fullName: string,
        schoolName?: string,
      ) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                school_name: schoolName || "",
              },
            },
          });

          if (error) {
            set({
              error: translateAuthError(error.message),
              isLoading: false,
            });
            return false;
          }

          set({
            user: data.user,
            session: data.session,
            error: null,
            isLoading: false,
          });

          if (data.user) {
            // Also ensure profile record exists or fetch it
            await get().fetchProfile(data.user.id);
          }

          return true;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Registrasi gagal";
          set({ error: translateAuthError(msg), isLoading: false });
          return false;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn("[EduPlay Auth] Sign out error:", err);
        } finally {
          set({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            error: null,
          });
          try {
            localStorage.removeItem("eduplay-auth-storage");
          } catch (e) {
            // ignore localStorage access error if in restricted context
          }
        }
      },

      initialize: async () => {
        // If user is already loaded from persisted storage, don't block UI with loading splash
        if (!get().user) {
          set({ isLoading: true, error: null });
        }
        try {
          // 1. Get current session from Supabase
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();
          if (sessionError) {
            console.warn("[EduPlay Auth] Session check error:", sessionError);
          }
          const currentSession = sessionData?.session;

          if (currentSession?.user) {
            set({
              user: currentSession.user,
              session: currentSession,
              isLoading: false,
            });
            await get().fetchProfile(currentSession.user.id);
          } else {
            // If Supabase confirms there's no valid session, clear state
            set({
              user: null,
              session: null,
              profile: null,
              isLoading: false,
            });
            try {
              localStorage.removeItem("eduplay-auth-storage");
            } catch (e) {
              // ignore
            }
          }

          // 2. Subscribe to auth state changes (clean up prior subscription if any)
          if (authSubscription) {
            authSubscription.unsubscribe();
            authSubscription = null;
          }

          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (newSession?.user) {
                set({
                  user: newSession.user,
                  session: newSession,
                  isLoading: false,
                });
                await get().fetchProfile(newSession.user.id);
              } else if (event === "SIGNED_OUT" || !newSession) {
                set({
                  user: null,
                  session: null,
                  profile: null,
                  isLoading: false,
                });
                try {
                  localStorage.removeItem("eduplay-auth-storage");
                } catch (e) {
                  // ignore
                }
              }
            },
          );
          authSubscription = authListener.subscription;
        } catch (err) {
          console.warn("[EduPlay Auth] Initialization failed:", err);
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "eduplay-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.isLoading = false;
        }
      },
    },
  ),
);

export default useAuthStore;
