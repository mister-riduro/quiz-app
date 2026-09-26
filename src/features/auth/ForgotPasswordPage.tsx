import React, { useState } from "react";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { useAuthStore } from "@/stores/authStore";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export interface ForgotPasswordPageProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
  isRecoveryMode?: boolean; // When arriving from password reset email callback
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onSuccess,
  onNavigateToLogin,
  isRecoveryMode = false,
}) => {
  const [isRecoveryModeLocal, setIsRecoveryModeLocal] =
    useState(isRecoveryMode);
  const activeRecoveryMode = isRecoveryMode || isRecoveryModeLocal;

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { resetPassword, updatePassword, isLoading, error, clearError } =
    useAuthStore();
  const { playTap, playCorrect, playWrong } = useSoundEffect();

  // Mode 1: Request reset email
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    playTap();
    clearError();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Silakan masukkan alamat email terdaftar Anda.");
      playWrong();
      return;
    }

    const success = await resetPassword(email.trim());
    if (success) {
      playCorrect();
      setIsSubmitted(true);
    } else {
      playWrong();
    }
  };

  // Mode 2: Update new password (after following email link)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    playTap();
    clearError();
    setLocalError(null);

    if (newPassword.length < 6) {
      setLocalError("Kata sandi baru minimal harus 6 karakter.");
      playWrong();
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError(
        "Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.",
      );
      playWrong();
      return;
    }

    const success = await updatePassword(newPassword);
    if (success) {
      playCorrect();
      setIsSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } else {
      playWrong();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col items-center">
      <DuoCard
        elevated
        className="w-full flex flex-col gap-6 p-6 sm:p-8 text-center bg-white"
      >
        {/* Header Icon */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-100 border-2 border-amber-300 text-amber-600 flex items-center justify-center mb-3 shadow-xs">
            <KeyRound className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-duo-dark tracking-tight">
            {activeRecoveryMode ? "Setel Kata Sandi Baru" : "Lupa Kata Sandi?"}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#777777] mt-1.5 leading-relaxed">
            {activeRecoveryMode
              ? "Masukkan kata sandi baru untuk akun pengajar Anda."
              : "Masukkan email terdaftar Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi."}
          </p>
        </div>

        {/* Error Alert */}
        {(error || localError) && (
          <div className="flex items-start gap-3 p-4 bg-duo-red-light border-2 border-duo-red rounded-2xl text-duo-red-border text-left text-xs sm:text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-duo-red" />
            <div className="flex-1">{localError || error}</div>
          </div>
        )}

        {/* Success State */}
        {isSubmitted ? (
          <div className="flex flex-col items-center gap-4 py-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 border-2 border-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-sm font-bold text-slate-700 leading-relaxed text-center">
              {activeRecoveryMode ? (
                <span>
                  Kata sandi berhasil diperbarui! Mengalihkan ke halaman
                  masuk...
                </span>
              ) : (
                <div className="flex flex-col gap-2">
                  <span>
                    Tautan pemulihan kata sandi telah dikirim ke{" "}
                    <strong className="text-duo-dark">{email}</strong>. Silakan
                    periksa kotak masuk atau folder spam email Anda.
                  </span>
                  {!isSupabaseConfigured && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-800 text-left flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Mode Simulasi Lokal:</strong> Proyek belum
                        terhubung ke Supabase riil di berkas <code>.env</code>.
                        Anda dapat langsung menguji penetapan kata sandi baru
                        melalui tombol di bawah.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!activeRecoveryMode && !isSupabaseConfigured && (
              <div className="w-full">
                <TactileButton
                  variant="blue"
                  size="md"
                  fullWidth
                  onClick={() => {
                    playTap();
                    setIsRecoveryModeLocal(true);
                    setIsSubmitted(false);
                  }}
                  className="py-3 font-black text-xs"
                >
                  Uji Setel Kata Sandi Baru Sekarang (Demo) →
                </TactileButton>
              </div>
            )}

            <div className="w-full">
              <TactileButton
                variant={
                  !activeRecoveryMode && !isSupabaseConfigured
                    ? "outline"
                    : "green"
                }
                size="md"
                fullWidth
                onClick={() => {
                  playTap();
                  onNavigateToLogin?.();
                }}
                icon={<ArrowLeft className="w-4 h-4" />}
                className="py-3 font-black text-sm"
              >
                Kembali ke Halaman Masuk
              </TactileButton>
            </div>
          </div>
        ) : activeRecoveryMode ? (
          /* FORM 2: UPDATE NEW PASSWORD */
          <form
            onSubmit={handleUpdatePassword}
            className="flex flex-col gap-4 text-left"
          >
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-11 pr-12 py-3 border-2 border-duo-gray rounded-2xl font-bold text-duo-dark placeholder:text-slate-300 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 transition-all text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-duo-dark"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 tracking-wider">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full pl-11 pr-4 py-3 border-2 border-duo-gray rounded-2xl font-bold text-duo-dark placeholder:text-slate-300 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="mt-2">
              <TactileButton
                type="submit"
                variant="green"
                size="lg"
                fullWidth
                isLoading={isLoading}
                icon={<Sparkles className="w-5 h-5" />}
                className="py-4 text-base tracking-wider font-black"
              >
                Simpan Kata Sandi Baru
              </TactileButton>
            </div>
          </form>
        ) : (
          /* FORM 1: REQUEST RESET LINK */
          <form
            onSubmit={handleRequestReset}
            className="flex flex-col gap-4 text-left"
          >
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

            <div className="mt-2">
              <TactileButton
                type="submit"
                variant="blue"
                size="lg"
                fullWidth
                isLoading={isLoading}
                icon={<Mail className="w-5 h-5" />}
                className="py-4 text-base tracking-wider font-black"
              >
                Kirim Tautan Pemulihan
              </TactileButton>
            </div>
          </form>
        )}

        {/* Back to Login Link */}
        {!isSubmitted && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#777777]">
            <button
              type="button"
              onClick={() => {
                playTap();
                clearError();
                if (isRecoveryModeLocal) {
                  setIsRecoveryModeLocal(false);
                } else {
                  onNavigateToLogin?.();
                }
              }}
              className="text-duo-blue font-black hover:underline cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />{" "}
              {isRecoveryModeLocal
                ? "Kembali ke Permintaan Email"
                : "Kembali ke Halaman Masuk"}
            </button>
          </div>
        )}
      </DuoCard>
    </div>
  );
};

export default ForgotPasswordPage;
