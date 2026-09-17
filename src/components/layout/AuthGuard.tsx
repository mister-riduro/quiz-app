import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Sparkles } from 'lucide-react';

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Route guard for teacher portal & protected studio areas.
 * Checks active session in Supabase Auth and redirects unauthenticated users.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = '/login',
}) => {
  const { session, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    // Ensure authStore is initialized when AuthGuard mounts
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !session && !fallback) {
      if (typeof window !== 'undefined' && window.location.pathname !== redirectTo) {
        window.location.href = redirectTo;
      }
    }
  }, [isLoading, session, fallback, redirectTo]);

  // Cheerful Duolingo-style loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-duo-bg text-duo-dark text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-duo-green border-4 border-duo-green-border flex items-center justify-center text-white shadow-md animate-bounce">
            <Sparkles className="w-10 h-10 animate-spin" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-duo-yellow border-2 border-duo-yellow-border flex items-center justify-center text-duo-dark font-black text-xs">
            ★
          </div>
        </div>

        <h3 className="text-xl font-black tracking-tight text-duo-dark">
          Menyiapkan Studio Guru EduPlay...
        </h3>
        <p className="text-xs sm:text-sm font-semibold text-[#777777] mt-1 max-w-xs">
          Memeriksa kredensial sesi pengajar dan sinkronisasi data kelas
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  // Authenticated: Render protected teacher studio content
  return <>{children}</>;
};

export default AuthGuard;

