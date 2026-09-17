import React from "react";
import { Gamepad2, Volume2, VolumeX } from "lucide-react";
import { useSoundEffect } from "@/hooks/useSoundEffect";

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSoundToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = "EduPlay",
  // subtitle = "Interactive Classroom Quiz Studio",
  showSoundToggle = true,
}) => {
  const { isMuted, toggleMute, playTap } = useSoundEffect();

  const handleToggleSound = () => {
    const nextMuted = toggleMute();
    if (!nextMuted) {
      playTap();
    }
  };

  return (
    <header className="w-full bg-white border-b-2 border-b-[#E5E5E5] px-6 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-duo-green border-b-4 border-duo-green-border flex items-center justify-center text-white shadow-sm">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-duo-dark flex items-center gap-2">
              {title}
            </h1>
          </div>
        </div>

        {showSoundToggle && (
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className="w-10 h-10 rounded-2xl bg-duo-bg border-2 border-duo-gray border-b-4 border-b-duo-gray-border flex items-center justify-center text-duo-dark hover:bg-duo-gray transition-all active:translate-y-[2px] active:border-b-2"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-duo-red" />
            ) : (
              <Volume2 className="w-5 h-5 text-duo-green" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
