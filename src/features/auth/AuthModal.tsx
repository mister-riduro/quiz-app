import React, { useState, useEffect } from "react";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { X } from "lucide-react";

export interface AuthModalProps {
  isOpen: boolean;
  initialView?: "login" | "register";
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialView = "login",
  onClose,
  onSuccess,
}) => {
  const [view, setView] = useState<"login" | "register">(initialView);
  const { playTap, playPop, playVictory } = useSoundEffect();

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-duo-dark/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playTap();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md my-auto animate-in zoom-in-95 duration-150">
        {/* Floating Close Button in top right of card */}
        <button
          type="button"
          onClick={() => {
            playTap();
            onClose();
          }}
          className="absolute top-7 right-7 z-20 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-duo-dark flex items-center justify-center transition-all cursor-pointer shadow-xs"
          aria-label="Tutup Dialog Autentikasi"
        >
          <X className="w-4 h-4" />
        </button>

        {view === "login" ? (
          <LoginPage
            onSuccess={() => {
              playVictory();
              onSuccess?.();
              onClose();
            }}
            onNavigateToRegister={() => {
              playPop();
              setView("register");
            }}
          />
        ) : (
          <RegisterPage
            onSuccess={() => {
              playVictory();
              onSuccess?.();
              onClose();
            }}
            onNavigateToLogin={() => {
              playPop();
              setView("login");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
