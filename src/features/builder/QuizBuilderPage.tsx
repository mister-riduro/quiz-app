import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useBuilderStore, BuilderQuestion } from "@/stores/builderStore";
import { pluginRegistry } from "@/plugins/core/registry";
import { QuestionTypeEnum } from "@/types/database";
import { Quiz } from "@/types/quiz";
import { TactileButton } from "@/components/ui/TactileButton";
import { DuoCard } from "@/components/ui/DuoCard";
import { Badge } from "@/components/ui/Badge";
import { DuoDropdown } from "@/components/ui/DuoDropdown";
import { ImageUploader } from "@/components/common/ImageUploader";
import { DuoMathTextarea } from "@/components/common/DuoMathTextarea";
import { DuoMathRenderer } from "@/components/common/DuoMathRenderer";
import { SortableQuestionItem } from "./components/SortableQuestionItem";
import { QuestionSettingsDrawer } from "./components/QuestionSettingsDrawer";
import { AddQuestionModal } from "./components/AddQuestionModal";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  Save,
  Plus,
  Sparkles,
  HelpCircle,
  Clock,
  Play,
  CheckCircle2,
  SlidersHorizontal,
  Menu,
  X,
  PanelRightOpen,
} from "lucide-react";

export interface QuizBuilderPageProps {
  onBack?: () => void;
  onPreview?: (quiz: Partial<Quiz>, questions: BuilderQuestion[]) => void;
}

export const QuizBuilderPage: React.FC<QuizBuilderPageProps> = ({
  onBack,
  onPreview,
}) => {
  const {
    currentQuiz,
    questions,
    activeQuestionIndex,
    isDirty,
    isSaving,
    setQuizTitle,
    setTimerMode,
    setGlobalTimeLimit,
    setBulkQuestionsTimeLimit,
    addQuestion,
    updateQuestion,
    updateActiveQuestionContent,
    removeQuestion,
    duplicateQuestion,
    reorderQuestions,
    setActiveQuestionIndex,
    saveQuiz,
  } = useBuilderStore();

  const [previewMode, setPreviewMode] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Drawers State
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);
  const [isRightDrawerCollapsed, setIsRightDrawerCollapsed] = useState(false);

  const { playTap, playPop, playCorrect, playVictory } = useSoundEffect();

  // Detect whether all questions share the exact same time limit for bulk detection
  const allSameTime =
    questions.length > 0 &&
    questions.every(
      (q) =>
        (q.timeLimitSeconds ?? 30) === (questions[0]?.timeLimitSeconds ?? 30),
    );
  const currentBulkValue = allSameTime
    ? String(questions[0]?.timeLimitSeconds ?? 30)
    : "custom";

  // Sensors for @dnd-kit drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((item) => item.id === active.id);
      const newIndex = questions.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        playPop();
        reorderQuestions(oldIndex, newIndex);
      }
    }
  };

  const handleSave = async () => {
    playTap();
    const success = await saveQuiz();
    if (success) {
      playVictory();
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    }
  };

  const activeQuestion = questions[activeQuestionIndex] || questions[0];
  const allRegisteredPlugins = pluginRegistry.getAllPlugins();

  // Resolve current active plugin
  const currentPlugin =
    activeQuestion && pluginRegistry.hasPlugin(activeQuestion.type)
      ? pluginRegistry.getPlugin(activeQuestion.type)
      : allRegisteredPlugins[0];

  const handleTypeChange = (type: QuestionTypeEnum) => {
    playPop();
    if (!pluginRegistry.hasPlugin(type)) return;
    const targetPlugin = pluginRegistry.getPlugin(type);
    updateQuestion(activeQuestionIndex, {
      type,
      content: targetPlugin.defaultContent,
    });
  };

  // Reusable Left Drawer Content: Global Timer Settings & Question List with Clear Separation
  const renderLeftDrawerContent = () => (
    <div className="flex flex-col h-full min-h-0 bg-white select-none overflow-y-auto">
      {/* Drawer Header (Icon and subtitle removed as requested) */}
      <div className="p-4 sm:p-5 border-b-2 border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <h2 className="text-base sm:text-lg font-black text-duo-dark leading-tight">
          Navigasi Kuis
        </h2>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setIsMobileLeftOpen(false)}
          className="lg:hidden w-8 h-8 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-duo-dark flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="Tutup Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1">
        {/* SECTION 1: Pengaturan Waktu Kuis (Global vs Per Soal) */}
        <div className="p-3.5 bg-slate-50 rounded-[16px] border-2 border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-duo-blue" />
              Waktu Kuis
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="w-full grid grid-cols-2 p-1 bg-slate-200/70 rounded-[13px] border border-slate-300/40 text-[11px] font-black text-center">
            <button
              type="button"
              onClick={() => {
                playTap();
                setTimerMode("global");
              }}
              className={cn(
                "px-2.5 py-1.5 rounded-[10px] transition-all cursor-pointer",
                (currentQuiz.timerMode || "global") === "global"
                  ? "bg-white text-duo-dark shadow-xs font-black"
                  : "text-slate-500 hover:text-duo-dark font-bold",
              )}
            >
              Global (Total)
            </button>
            <button
              type="button"
              onClick={() => {
                playTap();
                setTimerMode("per_question");
              }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer",
                currentQuiz.timerMode === "per_question"
                  ? "bg-white text-duo-dark shadow-xs font-black"
                  : "text-slate-500 hover:text-duo-dark font-bold",
              )}
            >
              Per Butir Soal
            </button>
          </div>

          {/* Sub-setting: Global Timer */}
          {(currentQuiz.timerMode || "global") === "global" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400">
                Batas Waktu Total Kuis
              </label>
              <DuoDropdown<number>
                value={currentQuiz.globalTimeLimitSeconds ?? 7200}
                onChange={(val) => setGlobalTimeLimit(val)}
                options={[
                  { value: 900, label: "15 Menit" },
                  { value: 1800, label: "30 Menit" },
                  { value: 2700, label: "45 Menit" },
                  { value: 3600, label: "60 Menit (1 Jam)" },
                  { value: 5400, label: "90 Menit (1.5 Jam)" },
                  { value: 7200, label: "120 Menit (2 Jam)" },
                  { value: 10800, label: "180 Menit (3 Jam)" },
                  { value: 0, label: "Tanpa Batas Waktu (∞)" },
                  ...(![0, 900, 1800, 2700, 3600, 5400, 7200, 10800].includes(
                    currentQuiz.globalTimeLimitSeconds ?? 7200,
                  )
                    ? [
                        {
                          value: currentQuiz.globalTimeLimitSeconds ?? 7200,
                          label: `${Math.round(
                            (currentQuiz.globalTimeLimitSeconds ?? 7200) / 60,
                          )} Menit (Kustom)`,
                        },
                      ]
                    : []),
                ]}
                menuHeader="Batas Waktu Total Kuis:"
                aria-label="Batas Waktu Total Kuis"
              />
            </div>
          ) : (
            /* Sub-setting: Per Question Bulk Setter */
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400">
                Seragamkan Waktu Semua Soal
              </label>
              <DuoDropdown<string>
                value={currentBulkValue}
                onChange={(val) => {
                  if (val !== "custom") {
                    setBulkQuestionsTimeLimit(parseInt(val, 10) || 0);
                  }
                }}
                options={[
                  ...(!allSameTime
                    ? [
                        {
                          value: "custom",
                          label: "Kustom (Durasi Bervariasi)",
                          disabled: true,
                        },
                      ]
                    : []),
                  { value: "15", label: "15 Detik" },
                  { value: "20", label: "20 Detik" },
                  { value: "30", label: "30 Detik" },
                  { value: "45", label: "45 Detik" },
                  { value: "60", label: "60 Detik (1 Menit)" },
                  { value: "90", label: "90 Detik (1.5 Menit)" },
                  { value: "120", label: "120 Detik (2 Menit)" },
                  { value: "0", label: "Tanpa Batas Waktu (∞)" },
                ]}
                menuHeader="Seragamkan Durasi Soal:"
                aria-label="Seragamkan Waktu Semua Soal"
              />
            </div>
          )}
        </div>

        {/* DISTINCT SEPARATION: CLEAR DIVIDER */}
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2.5 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-duo-blue" />
              Daftar Soal ({questions.length})
            </span>
          </div>
        </div>

        {/* SECTION 2: Add Question Primary Action Button */}
        {/* SECTION 2: Add Question Primary Action Button */}
        <div>
          <TactileButton
            variant="blue"
            size="md"
            fullWidth
            icon={<Plus className="w-5 h-5 stroke-[3]" />}
            onClick={() => {
              playPop();
              setIsAddModalOpen(true);
            }}
            className="py-2.5 text-xs sm:text-sm font-black shadow-xs"
          >
            Tambah Soal
          </TactileButton>
        </div>

        {/* SECTION 3: Sortable Question List with Drag & Drop */}
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 px-1">
            Geser ikon untuk ubah urutan
          </span>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 pr-0.5">
                {questions.map((question, idx) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    index={idx}
                    isActive={idx === activeQuestionIndex}
                    canRemove={questions.length > 1}
                    timerMode={currentQuiz.timerMode || "global"}
                    globalSeconds={currentQuiz.globalTimeLimitSeconds ?? 30}
                    onSelect={() => {
                      playTap();
                      setActiveQuestionIndex(idx);
                      setIsMobileLeftOpen(false);
                    }}
                    onDuplicate={() => {
                      playVictory();
                      duplicateQuestion(idx);
                    }}
                    onRemove={() => {
                      playPop();
                      removeQuestion(idx);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-duo-bg text-duo-dark selection:bg-duo-green-light selection:text-duo-green-border">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="shrink-0 z-40 bg-white border-b-2 border-b-[#E5E5E5] px-3 sm:px-6 py-2.5 sm:py-3 shadow-xs">
        <div className="w-full flex items-center justify-between gap-3">
          {/* Back button & Title Input */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={() => {
                  playTap();
                  onBack();
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-[13px] bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 flex items-center justify-center text-duo-dark shrink-0 transition-colors cursor-pointer"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={currentQuiz.title || ""}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Judul Kuis Kelas..."
                className="w-full bg-transparent font-black text-base sm:text-xl text-duo-dark px-2 py-1 rounded-[13px] border border-transparent hover:border-slate-300 focus:border-duo-blue focus:bg-white focus:outline-none transition-all truncate"
              />
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Left Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => {
                playTap();
                setIsMobileLeftOpen(true);
              }}
              className="lg:hidden px-2.5 py-1.5 rounded-[13px] bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-xs font-black flex items-center gap-1.5 cursor-pointer text-duo-dark"
              title="Buka Daftar Soal"
            >
              <Menu className="w-4 h-4 text-duo-blue" />
              <span>#{activeQuestionIndex + 1}</span>
            </button>

            {/* Mobile Right Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => {
                playTap();
                setIsMobileRightOpen(true);
              }}
              className="lg:hidden px-2.5 py-1.5 rounded-[13px] bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-xs font-black flex items-center gap-1.5 cursor-pointer text-duo-dark"
              title="Buka Pengaturan Soal"
            >
              <SlidersHorizontal className="w-4 h-4 text-duo-yellow-border" />
              <span className="hidden xs:inline">Atur</span>
            </button>

            {/* Preview Button */}
            <TactileButton
              variant="outline"
              size="md"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
              onClick={() => {
                playTap();
                if (onPreview) {
                  onPreview(currentQuiz, questions);
                } else {
                  setPreviewMode(!previewMode);
                }
              }}
            >
              {previewMode ? "Tutup Pratinjau" : "Pratinjau"}
            </TactileButton>

            {/* Save Button */}
            <TactileButton
              variant="green"
              size="md"
              isLoading={isSaving}
              icon={
                isDirty ? (
                  <Save className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )
              }
              onClick={handleSave}
            >
              {isSaving ? "Menyimpan..." : isDirty ? "Simpan" : "Tersimpan"}
            </TactileButton>
          </div>
        </div>

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-duo-green text-white text-xs font-black px-4 py-2 rounded-[13px] shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-50">
            <Sparkles className="w-4 h-4" />
            {currentQuiz.isPublished
              ? "Kuis berhasil disimpan & dipublikasikan!"
              : "Draf kuis berhasil disimpan!"}
          </div>
        )}
      </header>

      {/* 2. MAIN 3-PANEL STUDIO LAYOUT */}
      <div className="flex-1 min-h-0 flex min-w-0 overflow-hidden">
        {/* ======================================================== */}
        {/* PANEL 1: LEFT DRAWER (DESKTOP DOCKED SIDEBAR)             */}
        {/* ======================================================== */}
        <aside
          aria-label="Navigasi Butir Soal"
          className="hidden lg:flex w-72 xl:w-80 border-r-2 border-slate-200 bg-white shrink-0 flex-col shadow-xs h-full min-h-0 overflow-hidden"
        >
          {renderLeftDrawerContent()}
        </aside>

        {/* ======================================================== */}
        {/* PANEL 1 MOBILE: SLIDE-OVER DRAWER (FROM LEFT)            */}
        {/* ======================================================== */}
        <AnimatePresence>
          {isMobileLeftOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileLeftOpen(false)}
                className="fixed inset-0 bg-duo-dark/50 backdrop-blur-xs z-50 lg:hidden"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 280 }}
                className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white border-r-2 border-slate-200 z-50 shadow-2xl flex flex-col lg:hidden"
              >
                {renderLeftDrawerContent()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* PANEL 2: CENTER WORKSPACE (SCROLLABLE CANVAS)            */}
        {/* ======================================================== */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
          <div className="w-full max-w-4xl flex flex-col gap-6">
            {previewMode ? (
              /* PREVIEW RUNNER MODE */
              <DuoCard elevated className="p-6 sm:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">Pratinjau Siswa</Badge>
                    <span className="text-xs font-bold text-[#777777]">
                      Soal #{activeQuestionIndex + 1} ({currentPlugin?.title})
                    </span>
                  </div>
                  <TactileButton
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(false)}
                  >
                    Kembali ke Editor
                  </TactileButton>
                </div>

                {/* Question Prompt for Preview */}
                {activeQuestion.type !== "crossword" &&
                  activeQuestion.titlePrompt && (
                    <h3 className="text-xl sm:text-2xl font-black text-center text-duo-dark px-2">
                      <DuoMathRenderer content={activeQuestion.titlePrompt} />
                    </h3>
                  )}

                {/* Render Player Component */}
                {currentPlugin && (
                  <div className="my-2">
                    <currentPlugin.PlayerComponent
                      content={{
                        ...activeQuestion.content,
                        titlePrompt: activeQuestion.titlePrompt,
                        statement:
                          activeQuestion.content?.statement ||
                          activeQuestion.titlePrompt,
                        mediaUrl:
                          activeQuestion.mediaUrl ||
                          activeQuestion.content?.mediaUrl,
                      }}
                      onAnswerSubmit={(ans: any) => {
                        playCorrect();
                        alert(`Jawaban diterima: ${JSON.stringify(ans)}`);
                      }}
                    />
                  </div>
                )}
              </DuoCard>
            ) : (
              /* ACTIVE QUESTION EDITOR WORKSPACE */
              activeQuestion && (
                <DuoCard elevated className="p-6 sm:p-7 flex flex-col gap-6">
                  {/* Question Type Header & Changer Row */}

                  {/* Rich Math WYSIWYG Question Prompt Field (Hidden for Crossword) */}
                  {activeQuestion.type !== "crossword" && (
                    <DuoMathTextarea
                      label="Soal"
                      value={activeQuestion.titlePrompt}
                      onChange={(val) =>
                        updateQuestion(activeQuestionIndex, {
                          titlePrompt: val,
                        })
                      }
                      placeholder="Tuliskan soal di sini (klik tombol rumus fx untuk menyisipkan matematika)..."
                      rows={2}
                    />
                  )}

                  {/* Media Uploader (Auto WebP Compression) - Hidden for Crossword & Labelled Diagram */}
                  {activeQuestion.type !== "labelled_diagram" &&
                    activeQuestion.type !== "crossword" && (
                      <ImageUploader
                        value={activeQuestion.mediaUrl}
                        onChange={(url) =>
                          updateQuestion(activeQuestionIndex, { mediaUrl: url })
                        }
                        label="Media Gambar / Diagram Pendukung (Opsional)"
                      />
                    )}

                  {/* Dynamic Plugin Editor Component */}
                  {currentPlugin?.EditorComponent && (
                    <div
                      className={cn(
                        activeQuestion.type !== "crossword" &&
                          "pt-4 border-t border-slate-100",
                      )}
                    >
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                        Konfigurasi {currentPlugin.title}:
                      </h4>
                      <currentPlugin.EditorComponent
                        value={activeQuestion.content}
                        onChange={(newContent) =>
                          updateActiveQuestionContent(newContent)
                        }
                      />
                    </div>
                  )}
                </DuoCard>
              )
            )}
          </div>
        </main>

        {/* ======================================================== */}
        {/* PANEL 3: RIGHT DRAWER (DESKTOP DOCKED / COLLAPSIBLE)      */}
        {/* ======================================================== */}
        {!previewMode &&
          activeQuestion &&
          (isRightDrawerCollapsed ? (
            /* Collapsed Rail */
            <aside
              aria-label="Panel Pengaturan Terlipat"
              className="hidden lg:flex w-10 shrink-0 border-l-2 border-slate-200 bg-white flex-col items-center py-3 shadow-xs h-full min-h-0 select-none transition-all"
            >
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setIsRightDrawerCollapsed(false);
                }}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-duo-dark flex items-center justify-center transition-colors cursor-pointer"
                title="Buka Pengaturan Soal"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>

              <span className="text-[10px] font-black uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 py-4 text-slate-400">
                Pengaturan
              </span>
            </aside>
          ) : (
            /* Expanded Drawer: Smaller width (w-60 xl:w-64) */
            <aside
              aria-label="Pengaturan Butir Soal"
              className="hidden lg:flex w-60 xl:w-64 border-l-2 border-slate-200 bg-white shrink-0 flex-col shadow-xs h-full min-h-0 overflow-hidden transition-all"
            >
              <QuestionSettingsDrawer
                question={activeQuestion}
                index={activeQuestionIndex}
                totalQuestions={questions.length}
                timerMode={currentQuiz.timerMode || "global"}
                globalTimeLimitSeconds={
                  currentQuiz.globalTimeLimitSeconds ?? 7200
                }
                onTypeChange={handleTypeChange}
                onUpdatePoints={(pts) =>
                  updateQuestion(activeQuestionIndex, { points: pts })
                }
                onUpdateTimeLimit={(sec) =>
                  updateQuestion(activeQuestionIndex, { timeLimitSeconds: sec })
                }
                onSwitchToPerQuestionTimer={() => setTimerMode("per_question")}
                onDuplicateQuestion={() => {
                  playVictory();
                  duplicateQuestion(activeQuestionIndex);
                }}
                onRemoveQuestion={() => {
                  playPop();
                  removeQuestion(activeQuestionIndex);
                }}
                onCollapse={() => {
                  playTap();
                  setIsRightDrawerCollapsed(true);
                }}
              />
            </aside>
          ))}

        {/* ======================================================== */}
        {/* PANEL 3 MOBILE: SLIDE-OVER DRAWER (FROM RIGHT)           */}
        {/* ======================================================== */}
        <AnimatePresence>
          {!previewMode && isMobileRightOpen && activeQuestion && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileRightOpen(false)}
                className="fixed inset-0 bg-duo-dark/50 backdrop-blur-xs z-50 lg:hidden"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 280 }}
                className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-white border-l-2 border-slate-200 z-50 shadow-2xl flex flex-col lg:hidden"
              >
                <QuestionSettingsDrawer
                  question={activeQuestion}
                  index={activeQuestionIndex}
                  totalQuestions={questions.length}
                  timerMode={currentQuiz.timerMode || "global"}
                  globalTimeLimitSeconds={
                    currentQuiz.globalTimeLimitSeconds ?? 7200
                  }
                  onTypeChange={handleTypeChange}
                  onUpdatePoints={(pts) =>
                    updateQuestion(activeQuestionIndex, { points: pts })
                  }
                  onUpdateTimeLimit={(sec) =>
                    updateQuestion(activeQuestionIndex, {
                      timeLimitSeconds: sec,
                    })
                  }
                  onSwitchToPerQuestionTimer={() =>
                    setTimerMode("per_question")
                  }
                  onDuplicateQuestion={() => {
                    playVictory();
                    duplicateQuestion(activeQuestionIndex);
                    setIsMobileRightOpen(false);
                  }}
                  onRemoveQuestion={() => {
                    playPop();
                    removeQuestion(activeQuestionIndex);
                    setIsMobileRightOpen(false);
                  }}
                  onCloseMobile={() => setIsMobileRightOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Format Mini-Game Soal Baru */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelectType={(type) => {
          addQuestion(type);
          setIsMobileLeftOpen(false);
        }}
      />
    </div>
  );
};

export default QuizBuilderPage;
