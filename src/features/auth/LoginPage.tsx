import React, { useState } from "react";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { useAuthStore } from "@/stores/authStore";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export interface LoginPageProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, isLoading, error, clearError } = useAuthStore();
  const { playTap, playCorrect, playWrong } = useSoundEffect();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTap();
    clearError();

    if (!email.trim() || !password.trim()) {
      return;
    }

    const success = await signIn(email.trim(), password);
    if (success) {
      playCorrect();
      onSuccess?.();
    } else {
      playWrong();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Centered Bouncy Card */}
      <DuoCard
        elevated
        className="w-full flex flex-col gap-6 p-6 sm:p-8 text-center"
      >
        {/* Brand Icon Badge */}
        <div className="flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-black text-duo-dark tracking-tight">
            Halo, Ketemu Lagi
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#777777] mt-1.5">
            Kelola bank soal interaktif dan mulai sesi kuis kelas
          </p>
        </div>

        {/* Friendly Visual Error Alert Bubble */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-duo-red-light border-2 border-duo-red rounded-2xl text-duo-red-border text-left text-xs sm:text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-duo-red" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">
              Alamat Email Pengajar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guru@sekolah.sch.id"
                className="w-full pl-11 pr-4 py-3 border-2 border-duo-gray rounded-2xl font-bold text-duo-dark placeholder:text-slate-300 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 transition-all text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 border-2 border-duo-gray rounded-2xl font-bold text-duo-dark placeholder:text-slate-300 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 transition-all text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-duo-dark"
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {onNavigateToForgotPassword && (
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    clearError();
                    onNavigateToForgotPassword();
                  }}
                  className="text-xs font-bold text-duo-blue hover:underline cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-3">
            <TactileButton
              type="submit"
              variant="green"
              size="lg"
              fullWidth
              isLoading={isLoading}
              icon={<Sparkles className="w-5 h-5" />}
              className="py-4 text-base tracking-wider"
            >
              Masuk Sekarang
            </TactileButton>
          </div>
        </form>

        {/* Footer Link: Switch to Register */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#777777]">
          <span>Belum memiliki akun guru?</span>
          <button
            type="button"
            onClick={() => {
              playTap();
              clearError();
              onNavigateToRegister?.();
            }}
            className="text-duo-blue font-black hover:underline cursor-pointer"
          >
            Daftar Akun Baru
          </button>
        </div>
      </DuoCard>
    </div>
  );
};

export default LoginPage;
