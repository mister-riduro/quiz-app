import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  LayoutDashboard,
  Plus,
  Volume2,
  VolumeX,
  LogOut,
  Menu,
  X,
  User,
  LogIn,
} from "lucide-react";
import { TactileButton } from "@/components/ui/TactileButton";
import { Badge } from "@/components/ui/Badge";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { DatabaseProfile } from "@/types/database";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/utils/cn";

export interface NavigationDrawerProps {
  currentMode: "dashboard" | "showcase";
  onNavigate: (mode: "dashboard" | "showcase") => void;
  onCreateQuiz?: () => void;
  user: SupabaseUser | null;
  profile: DatabaseProfile | null;
  onSignOut: () => void;
  onSignInPrompt?: () => void;
  children: React.ReactNode;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  currentMode,
  onNavigate,
  onCreateQuiz,
  user,
  profile,
  onSignOut,
  onSignInPrompt,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isMuted, toggleMute, playTap, playPop } = useSoundEffect();

  const teacherName =
    profile?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Guru EduPlay");
  const teacherInitial = teacherName ? teacherName[0]?.toUpperCase() : "G";

  const handleToggleSound = () => {
    const nextMuted = toggleMute();
    if (!nextMuted) {
      playTap();
    }
  };

  const handleNavClick = (mode: "dashboard" | "showcase") => {
    playPop();
    onNavigate(mode);
    setIsMobileOpen(false);
  };

  // Reusable Sidebar Content for both Desktop and Mobile Drawer
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Top: Logo & Main Navigation */}
      <div className="flex flex-col gap-6">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-11 h-11 rounded-2xl bg-duo-green border-b-4 border-duo-green-border flex items-center justify-center text-white shadow-sm shrink-0">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-duo-dark flex items-center gap-1.5 leading-none">
              EduPlay
            </h1>
          </div>
        </div>

        {/* Primary Action: Buat Kuis Baru */}
        {onCreateQuiz && (
          <div className="px-1">
            <TactileButton
              variant="green"
              size="lg"
              fullWidth
              icon={<Plus className="w-5 h-5 stroke-[3]" />}
              onClick={() => {
                playTap();
                setIsMobileOpen(false);
                onCreateQuiz();
              }}
              className="py-3 text-sm font-black tracking-wide shadow-sm"
            >
              Buat Kuis Baru
            </TactileButton>
          </div>
        )}

        {/* Navigation Menu Links */}
        <nav className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2">
            Menu Utama
          </span>

          {/* Nav Item 1: Dashboard Guru */}
          <button
            type="button"
            onClick={() => handleNavClick("dashboard")}
            className={cn(
              "w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer text-left",
              currentMode === "dashboard"
                ? "bg-[#E5FAD2] text-[#2E6B00] border-2 border-[#A2E865] active:translate-y-0.5"
                : "bg-transparent text-slate-600 hover:text-duo-dark hover:bg-slate-100 border-2 border-transparent active:bg-slate-200",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                currentMode === "dashboard"
                  ? "bg-white text-duo-green border border-[#A2E865]/60 shadow-2xs"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="flex-1">Dashboard Guru</span>
          </button>

          {/* Nav Item 2: Lab Showcase & Komponen */}
          <button
            type="button"
            onClick={() => handleNavClick("showcase")}
            className={cn(
              "w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer text-left",
              currentMode === "showcase"
                ? "bg-[#E5F5FF] text-[#096996] border-2 border-[#8ED4FF] active:translate-y-0.5"
                : "bg-transparent text-slate-600 hover:text-duo-dark hover:bg-slate-100 border-2 border-transparent active:bg-slate-200",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                currentMode === "showcase"
                  ? "bg-white text-duo-blue border border-[#8ED4FF]/60 shadow-2xs"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span className="flex-1">Lab Showcase</span>
          </button>
        </nav>
      </div>

      {/* Bottom Area: Sound Toggle & User Profile */}
      <div className="flex flex-col gap-3 pt-4 border-t-2 border-slate-100">
        {/* Sound Toggle Button */}
        <button
          type="button"
          onClick={handleToggleSound}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-xs font-black text-slate-600 hover:text-duo-dark transition-all cursor-pointer active:translate-y-[1px]"
        >
          <div className="flex items-center gap-2">
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-duo-red" />
            ) : (
              <Volume2 className="w-4 h-4 text-duo-green" />
            )}
            <span>Efek Audio:</span>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase",
              isMuted
                ? "bg-rose-100 text-rose-700"
                : "bg-emerald-100 text-emerald-700",
            )}
          >
            {isMuted ? "Bisu" : "Aktif"}
          </span>
        </button>

        {/* User Profile Card */}
        {user ? (
          <div className="p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-duo-green text-white font-black text-sm flex items-center justify-center border-b-2 border-duo-green-border shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={teacherName}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  teacherInitial
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-duo-dark truncate">
                  {teacherName}
                </span>
                <span className="text-[10px] font-bold text-slate-400 truncate">
                  {profile?.school_name || user.email}
                </span>
              </div>
            </div>

            {/* Logout Icon Button */}
            <button
              type="button"
              onClick={onSignOut}
              title="Keluar dari akun"
              aria-label="Keluar"
              className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-duo-red border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-black text-slate-500">
                Mode Tamu
              </span>
            </div>
            {onSignInPrompt && (
              <button
                type="button"
                onClick={onSignInPrompt}
                className="text-xs font-black text-duo-green hover:underline cursor-pointer flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" /> Masuk
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-duo-bg text-duo-dark selection:bg-duo-green-light selection:text-duo-green-border">
      {/* 1. DESKTOP PERMANENT LEFT NAVIGATION DRAWER (Sidebar) */}
      <aside
        aria-label="Navigasi Samping Dashboard"
        className="hidden lg:flex fixed inset-y-0 left-0 w-64 xl:w-72 bg-white border-r-2 border-slate-200 z-40 flex-col p-5 shadow-xs"
      >
        {renderSidebarContent()}
      </aside>

      {/* 2. MOBILE TOP BAR WITH HAMBURGER BUTTON (Hidden on Desktop) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b-2 border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playTap();
              setIsMobileOpen(true);
            }}
            aria-label="Buka Menu Navigasi"
            className="w-10 h-10 rounded-2xl bg-duo-bg border-2 border-slate-200 hover:border-slate-300 flex items-center justify-center text-duo-dark hover:bg-duo-gray transition-all active:translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-duo-green border-b-2 border-duo-green-border flex items-center justify-center text-white shadow-xs">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span className="font-black text-base text-duo-dark">EduPlay</span>
          </div>
        </div>

        {/* Current Active Mode Badge */}
        <Badge
          variant={currentMode === "dashboard" ? "green" : "blue"}
          className="text-[10px]"
        >
          {currentMode === "dashboard" ? "Dashboard" : "Showcase"}
        </Badge>
      </header>

      {/* 3. MOBILE SLIDE-OVER DRAWER (SLIDES IN FROM LEFT) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-duo-dark/50 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Slide-in Drawer from Left */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white border-r-2 border-slate-200 z-50 p-5 shadow-2xl flex flex-col justify-between lg:hidden"
            >
              {/* Close Button at top right of drawer */}
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setIsMobileOpen(false);
                }}
                aria-label="Tutup Menu"
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-duo-dark flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. MAIN WORKSPACE / CONTENT AREA (Offset for left drawer on desktop) */}
      <main className="flex-1 lg:pl-64 xl:pl-72 flex flex-col min-w-0 transition-all duration-200">
        {children}
      </main>
    </div>
  );
};

export default NavigationDrawer;
