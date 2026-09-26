import React from "react";
import { BuilderQuestion } from "@/stores/builderStore";
import { pluginRegistry } from "@/plugins/core/registry";
import { QuestionTypeEnum } from "@/types/database";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import { DuoDropdown, DuoDropdownOption } from "@/components/ui/DuoDropdown";
import {
  Award,
  Clock,
  Lock,
  Copy,
  Trash2,
  X,
  Zap,
  LayoutGrid,
  PanelRightClose,
} from "lucide-react";

export interface QuestionSettingsDrawerProps {
  question: BuilderQuestion;
  index: number;
  totalQuestions: number;
  timerMode: "global" | "per_question";
  globalTimeLimitSeconds: number;
  onUpdatePoints: (points: number) => void;
  onUpdateTimeLimit: (seconds: number) => void;
  onTypeChange?: (type: QuestionTypeEnum) => void;
  onSwitchToPerQuestionTimer?: () => void;
  onDuplicateQuestion: () => void;
  onRemoveQuestion: () => void;
  onCollapse?: () => void;
  onCloseMobile?: () => void;
  className?: string;
}

const TIME_OPTIONS = [
  { value: 15, label: "15 Detik (Kilat)" },
  { value: 20, label: "20 Detik" },
  { value: 30, label: "30 Detik (Standar)" },
  { value: 45, label: "45 Detik (Sedang)" },
  { value: 60, label: "60 Detik (1 Menit)" },
  { value: 90, label: "90 Detik (1.5 Menit)" },
  { value: 120, label: "120 Detik (2 Menit)" },
  { value: 0, label: "Tanpa Batas Waktu (∞)" },
];

export const QuestionSettingsDrawer: React.FC<QuestionSettingsDrawerProps> = ({
  question,
  index,
  totalQuestions,
  timerMode,
  globalTimeLimitSeconds,
  onUpdatePoints,
  onUpdateTimeLimit,
  onTypeChange,
  onSwitchToPerQuestionTimer,
  onDuplicateQuestion,
  onRemoveQuestion,
  onCollapse,
  onCloseMobile,
  className,
}) => {
  const { playTap, playPop } = useSoundEffect();
  const allRegisteredPlugins = pluginRegistry.getAllPlugins();
  const currentPoints = question.points ?? 100;
  const currentTimeLimit = question.timeLimitSeconds ?? 30;

  // Options for Format Soal (With Icons)
  const formatOptions: DuoDropdownOption<QuestionTypeEnum>[] =
    allRegisteredPlugins.map((p) => ({
      value: p.type,
      label: p.title,
      icon: p.icon,
    }));

  // Options for Poin Jawaban (Without Icons - clean numbers as requested)
  const pointOptions: DuoDropdownOption<number>[] = [
    { value: 0, label: "0 Poin (Tanpa Poin / Latihan)" },
    { value: 50, label: "50 Poin (Mudah)" },
    { value: 100, label: "100 Poin (Standar)" },
    { value: 150, label: "150 Poin (Tantangan)" },
    { value: 200, label: "200 Poin (Bonus)" },
    ...(![0, 50, 100, 150, 200].includes(currentPoints)
      ? [{ value: currentPoints, label: `${currentPoints} Poin (Kustom)` }]
      : []),
  ];

  // Options for Batas Waktu Soal (Without Icons - clean time options as requested)
  const timeLimitOptions: DuoDropdownOption<number>[] = TIME_OPTIONS.map(
    (opt) => ({
      value: opt.value,
      label: opt.label,
    }),
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white select-none overflow-y-auto",
        className,
      )}
    >
      {/* 1. DRAWER HEADER (Icon removed as requested in #1) */}
      <div className="p-3.5 sm:p-4 border-b-2 border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <h3 className="text-sm sm:text-base font-black text-duo-dark truncate">
          Pengaturan Soal #{index + 1}
        </h3>

        <div className="flex items-center gap-1 shrink-0">
          {/* Desktop collapse button */}
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-duo-dark items-center justify-center transition-colors cursor-pointer"
              title="Tutup Panel Pengaturan"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-duo-dark flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Tutup Pengaturan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. DRAWER BODY */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-4 flex-1">
        {/* SECTION 1: FORMAT / TIPE SOAL (DROPDOWN WITH ICONS) */}
        {onTypeChange && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-duo-blue" />
              Format Soal
            </label>

            <DuoDropdown<QuestionTypeEnum>
              value={question.type}
              onChange={(newType) => onTypeChange(newType)}
              options={formatOptions}
              menuHeader="Ganti Format Mini-Game:"
              placeholder="Pilih Tipe Soal"
              aria-label="Format Soal"
            />
          </div>
        )}

        {/* SECTION 2: POIN SOAL (DROPDOWN WITHOUT ICONS) */}
        <div className="flex flex-col gap-1.5 pt-3.5 border-t-2 border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-duo-yellow-border" />
              Poin Jawaban
            </label>
          </div>

          <DuoDropdown<number>
            value={currentPoints}
            onChange={(pts) => onUpdatePoints(pts)}
            options={pointOptions}
            menuHeader="Pilih Poin Jawaban:"
            aria-label="Poin Jawaban"
          />
        </div>

        {/* SECTION 3: BATAS WAKTU SOAL */}
        <div className="flex flex-col gap-1.5 pt-3.5 border-t-2 border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Clock
                className={cn(
                  "w-4 h-4",
                  timerMode === "global" ? "text-slate-400" : "text-duo-green",
                )}
              />
              Batas Waktu Soal
            </label>
          </div>

          {timerMode === "global" ? (
            /* Locked Global Mode State */
            <div className="p-2.5 bg-slate-50 rounded-[13px] border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs font-black">
                  Total:{" "}
                  {globalTimeLimitSeconds > 0
                    ? `${Math.round(globalTimeLimitSeconds / 60)} Menit`
                    : "Tanpa Batas"}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 leading-tight">
                Durasi per soal dinonaktifkan saat mode global aktif.
              </p>

              {onSwitchToPerQuestionTimer && (
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    onSwitchToPerQuestionTimer();
                  }}
                  className="mt-0.5 w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-[10px] text-[11px] font-black text-duo-blue flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-duo-blue" />
                  Beralih ke Waktu Per Soal
                </button>
              )}
            </div>
          ) : (
            /* Per Question Mode (Dropdown without icons) */
            <DuoDropdown<number>
              value={currentTimeLimit}
              onChange={(sec) => onUpdateTimeLimit(sec)}
              options={timeLimitOptions}
              menuHeader="Pilih Durasi Waktu:"
              aria-label="Batas Waktu Soal"
            />
          )}
        </div>

        {/* SECTION 4: TINDAKAN BUTIR SOAL (TERTIARY BUTTONS, NOT FILLED) */}
        <div className="flex flex-col gap-2 pt-3.5 border-t-2 border-slate-100">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Tindakan Lainnya
          </span>

          <div className="flex flex-col gap-1.5">
            {/* Duplicate Button (Tertiary Outline) */}
            <button
              type="button"
              onClick={() => {
                playPop();
                onDuplicateQuestion();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[13px] border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-duo-dark text-xs font-bold transition-all cursor-pointer active:translate-y-0.5"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Duplikasi Soal</span>
            </button>

            {/* Delete Button (Tertiary Outline) */}
            <button
              type="button"
              disabled={totalQuestions <= 1}
              onClick={() => {
                playPop();
                onRemoveQuestion();
              }}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[13px] border text-xs font-bold transition-all",
                totalQuestions <= 1
                  ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                  : "border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50/50 text-slate-500 hover:text-duo-red cursor-pointer active:translate-y-0.5",
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Soal</span>
            </button>
          </div>

          {totalQuestions <= 1 && (
            <span className="text-[10px] font-bold text-slate-400 text-center">
              Minimal 1 butir soal.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionSettingsDrawer;
