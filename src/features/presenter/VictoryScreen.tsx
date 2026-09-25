import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Home,
  Clock,
  CheckCircle2,
  Trophy,
  Target,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/soundManager";
import { cn } from "@/utils/cn";
import { TactileButton } from "@/components/ui/TactileButton";

export interface VictoryScreenProps {
  quizTitle?: string;
  totalQuestions: number;
  correctQuestions: number;
  totalScore: number;
  maxScore: number;
  durationSeconds: number;
  onPlayAgain: () => void;
  onExitDashboard: () => void;
}

// Format duration into MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  quizTitle,
  totalQuestions,
  correctQuestions,
  totalScore,
  maxScore,
  durationSeconds,
  onPlayAgain,
  onExitDashboard,
}) => {
  // Accuracy percentage calculation
  const accuracy = useMemo(() => {
    if (totalQuestions <= 0) return 0;
    return Math.round((correctQuestions / totalQuestions) * 100);
  }, [totalQuestions, correctQuestions]);

  // Star rating calculation (1, 2, or 3 stars)
  const earnedStars = useMemo(() => {
    if (accuracy >= 80) return 3;
    if (accuracy >= 50) return 2;
    return 1;
  }, [accuracy]);

  // Headline message based on stars
  const celebrationText = useMemo(() => {
    if (earnedStars === 3) {
      return {
        title: "Kelas Juara! Sempurna!",
        subtitle:
          "Seluruh siswa menunjukkan pemahaman materi yang sangat luar biasa!",
      };
    }
    if (earnedStars === 2) {
      return {
        title: "Kerja Hebat! Sangat Bagus!",
        subtitle:
          "Hasil kuis yang impresif, sebagian besar soal berhasil dijawab dengan tepat!",
      };
    }
    return {
      title: "Semangat Belajar! Bagus Sekali!",
      subtitle:
        "Partisipasi yang menyenangkan, mari pelajari kembali konsep yang menantang!",
    };
  }, [earnedStars]);

  // Massive Multi-Stage Confetti & Audio Fanfare Effect
  useEffect(() => {
    // 1. Instant Victory fanfare sound
    soundManager.play("victory");

    // 2. Stage 1: Massive center explosion
    try {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#58CC02", "#FFC800", "#1CB0F6", "#FF4B4B", "#A855F7"],
      });
    } catch {
      // Safe fallback
    }

    // 3. Stage 2: Left cannon after 300ms
    const timer1 = setTimeout(() => {
      try {
        confetti({
          particleCount: 75,
          angle: 60,
          spread: 65,
          origin: { x: 0.05, y: 0.8 },
          colors: ["#58CC02", "#FFC800", "#1CB0F6", "#22C55E"],
        });
      } catch {
        // Safe fallback
      }
    }, 300);

    // 4. Stage 3: Right cannon after 600ms
    const timer2 = setTimeout(() => {
      try {
        confetti({
          particleCount: 75,
          angle: 120,
          spread: 65,
          origin: { x: 0.95, y: 0.8 },
          colors: ["#FFC800", "#FF4B4B", "#A855F7", "#FF9600"],
        });
      } catch {
        // Safe fallback
      }
    }, 600);

    // 5. Star pop audio triggers timed with star animations
    const timerStar1 = setTimeout(() => soundManager.play("pop"), 450);
    const timerStar2 = setTimeout(() => soundManager.play("pop"), 850);
    const timerStar3 = setTimeout(() => soundManager.play("pop"), 1250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timerStar1);
      clearTimeout(timerStar2);
      clearTimeout(timerStar3);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#F8FAFC]/95 backdrop-blur-md overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6 select-none"
    >
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="max-w-2xl w-full bg-white rounded-3xl sm:rounded-[32px] border-4 border-slate-200 shadow-2xl p-6 sm:p-10 flex flex-col items-center text-center my-auto"
      >
        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-800 text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Sesi Kuis Selesai</span>
        </div>

        {/* 3. THREE-STAR 3D RATING DISPLAY (USER REQUIREMENT) */}
        <div className="flex items-end justify-center gap-3 sm:gap-5 mb-5 h-28 sm:h-32">
          {/* Star 1 (Left) */}
          <Star3D index={1} isEarned={earnedStars >= 1} size="sm" delay={0.4} />

          {/* Star 2 (Middle - Elevated & Larger) */}
          <Star3D
            index={2}
            isEarned={earnedStars >= 2}
            size="lg"
            delay={0.8}
            isCenter
          />

          {/* Star 3 (Right) */}
          <Star3D index={3} isEarned={earnedStars >= 3} size="sm" delay={1.2} />
        </div>

        {/* Celebration Title & Description */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-duo-dark mb-2 tracking-tight">
          {celebrationText.title}
        </h2>
        <p className="text-sm sm:text-base font-bold text-slate-500 max-w-md mb-6 leading-relaxed">
          {quizTitle ? (
            <>
              Kuis{" "}
              <span className="text-duo-dark font-extrabold">
                "{quizTitle}"
              </span>{" "}
              telah tuntas.{" "}
            </>
          ) : null}
          {celebrationText.subtitle}
        </p>

        {/* 4. CLASS PERFORMANCE RECAP CARD (USER REQUIREMENT) */}
        <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-inner">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1: Soal Benar */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-3 flex flex-col items-center shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-green-50 text-duo-green flex items-center justify-center mb-1.5 border border-green-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Soal Benar
              </span>
              <span className="text-base sm:text-lg font-black text-duo-dark">
                {correctQuestions} / {totalQuestions}
              </span>
            </div>

            {/* Metric 2: Persentase Akurasi */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-3 flex flex-col items-center shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-duo-blue flex items-center justify-center mb-1.5 border border-blue-200">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Akurasi Kelas
              </span>
              <span className="text-base sm:text-lg font-black text-duo-blue">
                {accuracy}%
              </span>
            </div>

            {/* Metric 3: Durasi Bermain */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-3 flex flex-col items-center shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 border border-amber-200">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Durasi Waktu
              </span>
              <span className="text-base sm:text-lg font-black text-duo-dark">
                {formatDuration(durationSeconds)}
              </span>
            </div>

            {/* Metric 4: Total Skor */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-3 flex flex-col items-center shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 text-duo-yellow-border flex items-center justify-center mb-1.5 border border-yellow-200">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Total Poin
              </span>
              <span className="text-base sm:text-lg font-black text-duo-green-border">
                {totalScore} / {maxScore}
              </span>
            </div>
          </div>
        </div>

        {/* 5. TWO ACTION BUTTONS WITH UNIFORM 2PX OUTLINE */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full">
          {/* Mainkan Lagi Button (duo-green) */}
          <TactileButton
            variant="green"
            size="lg"
            icon={<RotateCcw className="w-5 h-5 stroke-[2.5]" />}
            iconPosition="left"
            onClick={() => {
              soundManager.play("tap");
              onPlayAgain();
            }}
            className="w-full sm:flex-1 py-4 text-sm sm:text-base tracking-wider"
          >
            Mainkan Lagi
          </TactileButton>

          {/* Kembali ke Dashboard Button (duo-blue) */}
          <TactileButton
            variant="blue"
            size="lg"
            icon={<Home className="w-5 h-5 stroke-[2.5]" />}
            iconPosition="left"
            onClick={() => {
              soundManager.play("tap");
              onExitDashboard();
            }}
            className="w-full sm:flex-1 py-4 text-sm sm:text-base tracking-wider"
          >
            Kembali ke Dashboard
          </TactileButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface Star3DProps {
  index: number;
  isEarned: boolean;
  size: "sm" | "lg";
  delay: number;
  isCenter?: boolean;
}

const Star3D: React.FC<Star3DProps> = ({
  isEarned,
  size,
  delay,
  isCenter = false,
}) => {
  const isLarge = size === "lg";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -35 }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: 0,
      }}
      transition={{
        delay,
        type: "spring",
        damping: 14,
        stiffness: 260,
        mass: 0.7,
      }}
      className={cn(
        "relative flex items-center justify-center transition-all",
        isLarge
          ? "w-20 h-20 sm:w-24 sm:h-24 -translate-y-2"
          : "w-16 h-16 sm:w-20 sm:h-20",
      )}
    >
      {/* 3D Star Graphic with Specular Highlight and Depth */}
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "w-full h-full filter drop-shadow-md transition-all",
          isEarned
            ? "drop-shadow-[0_8px_12px_rgba(255,200,0,0.35)]"
            : "opacity-45",
        )}
      >
        <defs>
          {/* Gold Yellow Gradient */}
          <linearGradient
            id={`star-grad-${isCenter ? "c" : "s"}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#FFC800" />
            <stop offset="100%" stopColor="#E5A100" />
          </linearGradient>

          {/* Gray Gradient for unearned star */}
          <linearGradient id="star-gray" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>

        {/* 3D Star Base Shape with Thick 3D Border */}
        <polygon
          points="50,5 64,36 98,39 72,62 80,95 50,77 20,95 28,62 2,39 36,36"
          fill={
            isEarned
              ? `url(#star-grad-${isCenter ? "c" : "s"})`
              : "url(#star-gray)"
          }
          stroke={isEarned ? "#D48B00" : "#64748B"}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* Specular Highlight Sheen on upper star face */}
        {isEarned && (
          <polygon
            points="50,11 60,34 85,36 67,52 50,42"
            fill="white"
            opacity="0.4"
          />
        )}
      </svg>
    </motion.div>
  );
};

export default VictoryScreen;
