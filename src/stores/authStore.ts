import { create } from "zustand";
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

export const useAuthStore = create<AuthState>((set, get) => ({
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

      if (error) {
        console.warn("[EduPlay Auth] Could not load profile:", error.message);
        return null;
      }
      set({ profile: data as DatabaseProfile });
      return data as DatabaseProfile;
    } catch {
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
    }
  },

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Get initial session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;

      if (currentSession?.user) {
        set({
          user: currentSession.user,
          session: currentSession,
          isLoading: false,
        });
        await get().fetchProfile(currentSession.user.id);
      } else {
        set({
          user: null,
          session: null,
          profile: null,
          isLoading: false,
        });
      }

      // 2. Subscribe to auth state changes (clean up prior subscription if any)
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (newSession?.user) {
            set({
              user: newSession.user,
              session: newSession,
              isLoading: false,
            });
            await get().fetchProfile(newSession.user.id);
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              isLoading: false,
            });
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
}));

export default useAuthStore;
