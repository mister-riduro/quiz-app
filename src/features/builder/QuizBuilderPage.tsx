import React, { useState, useRef, useEffect } from "react";
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
import { ImageUploader } from "@/components/common/ImageUploader";
import { SortableQuestionItem } from "./components/SortableQuestionItem";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  HelpCircle,
  Clock,
  Award,
  Play,
  CheckCircle2,
  ChevronDown,
  Check,
  Lock,
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
    togglePublish,
    addQuestion,
    updateQuestion,
    updateActiveQuestionContent,
    removeQuestion,
    reorderQuestions,
    setActiveQuestionIndex,
    saveQuiz,
  } = useBuilderStore();

  const [previewMode, setPreviewMode] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAddDropdownOpen(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col bg-duo-bg text-duo-dark selection:bg-duo-green-light selection:text-duo-green-border">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-b-[#E5E5E5] px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Back button & Title Input */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={() => {
                  playTap();
                  onBack();
                }}
                className="w-10 h-10 rounded-2xl bg-slate-50 border-2 border-duo-gray hover:bg-slate-100 flex items-center justify-center text-duo-dark shrink-0 transition-colors"
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
                className="w-full bg-transparent font-black text-lg sm:text-xl text-duo-dark px-2.5 py-1 rounded-xl border border-transparent hover:border-duo-gray focus:border-duo-blue focus:bg-white focus:outline-none transition-all truncate"
              />
            </div>
          </div>

          {/* Action Controls: Toggle Publish, Preview, Save */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {/* Publish Toggle */}
            <button
              type="button"
              onClick={() => {
                playPop();
                togglePublish();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border-2 ${
                currentQuiz.isPublished
                  ? "bg-duo-green-light border-duo-green text-duo-green-border"
                  : "bg-slate-100 border-slate-300 text-[#777777]"
              }`}
            >
              {currentQuiz.isPublished ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Dipublikasikan
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Draf (Privat)
                </>
              )}
            </button>

            {/* Preview Button */}
            <TactileButton
              variant="outline"
              size="sm"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
              onClick={() => {
                playTap();
                if (onPreview) {
                  onPreview(currentQuiz, questions);
                } else {
                  setPreviewMode(!previewMode);
                }
              }}
              className="border-2 border-duo-gray text-[#4B4B4B]"
            >
              {previewMode ? "Tutup Pratinjau" : "Pratinjau"}
            </TactileButton>

            {/* Save Button */}
            <TactileButton
              variant="green"
              size="sm"
              isLoading={isSaving}
              icon={
                isDirty ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )
              }
              onClick={handleSave}
              className="font-black px-4"
            >
              {isSaving ? "Menyimpan..." : isDirty ? "Simpan" : "Tersimpan"}
            </TactileButton>
          </div>
        </div>

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-duo-green text-white text-xs font-black px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-50">
            <Sparkles className="w-4 h-4" />
            {currentQuiz.isPublished
              ? "Kuis berhasil disimpan & dipublikasikan!"
              : "Draf kuis berhasil disimpan!"}
          </div>
        )}
      </header>

      {/* 2. MAIN BUILDER BODY (Left Sidebar + Central Workspace) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR: Question Thumbnail List with @dnd-kit reordering */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          {/* TOP CARD: Pengaturan Waktu Kuis (Waktu Global vs Per Soal Bulk) */}
          <DuoCard elevated className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2.5 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-duo-blue" />
                Pengaturan Waktu
              </h3>

              {/* Mode Toggle Switcher */}
              <div className="w-full grid grid-cols-2 p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-[11px] font-black text-center">
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setTimerMode("global");
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    (currentQuiz.timerMode || "global") === "global"
                      ? "bg-white text-duo-blue shadow-xs font-black"
                      : "text-slate-500 hover:text-duo-dark font-bold",
                  )}
                >
                  Global
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setTimerMode("per_question");
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                    currentQuiz.timerMode === "per_question"
                      ? "bg-white text-duo-blue shadow-xs font-black"
                      : "text-slate-500 hover:text-duo-dark font-bold",
                  )}
                >
                  Per Soal
                </button>
              </div>
            </div>

            {/* Condition 1: Global Timer Mode (Enabled) */}
            {(currentQuiz.timerMode || "global") === "global" ? (
              <div className="flex flex-col gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black uppercase text-slate-500">
                      Batas Waktu Total Kuis
                    </label>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 text-duo-blue border border-blue-200">
                      {Math.round(
                        (currentQuiz.globalTimeLimitSeconds ?? 7200) / 60,
                      )}{" "}
                      Menit
                    </span>
                  </div>
                  <select
                    value={currentQuiz.globalTimeLimitSeconds ?? 7200}
                    onChange={(e) => {
                      playPop();
                      setGlobalTimeLimit(parseInt(e.target.value) || 0);
                    }}
                    className="w-full px-3 py-2 bg-white border-2 border-duo-blue/40 rounded-xl font-bold text-xs sm:text-sm text-duo-dark focus:outline-none focus:border-duo-blue cursor-pointer"
                  >
                    <option value={900}>15 Menit</option>
                    <option value={1800}>30 Menit</option>
                    <option value={2700}>45 Menit</option>
                    <option value={3600}>60 Menit (1 Jam)</option>
                    <option value={5400}>90 Menit (1.5 Jam)</option>
                    <option value={7200}>120 Menit (2 Jam)</option>
                    <option value={10800}>180 Menit (3 Jam)</option>
                    <option value={0}>Tanpa Batas Waktu (∞)</option>
                    {![0, 900, 1800, 2700, 3600, 5400, 7200, 10800].includes(
                      currentQuiz.globalTimeLimitSeconds ?? 7200,
                    ) && (
                      <option value={currentQuiz.globalTimeLimitSeconds}>
                        {Math.round(
                          (currentQuiz.globalTimeLimitSeconds ?? 7200) / 60,
                        )}{" "}
                        Menit (Kustom)
                      </option>
                    )}
                  </select>
                </div>

                {/* <div className="p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] font-bold text-duo-blue leading-relaxed flex items-start gap-1.5">
                  <span className="text-sm">⏱️</span>
                  <span>
                    Keseluruhan kuis harus diselesaikan dalam{" "}
                    <strong>
                      {Math.round(
                        (currentQuiz.globalTimeLimitSeconds ?? 7200) / 60,
                      )}{" "}
                      menit
                    </strong>
                    . Durasi per butir soal dinonaktifkan.
                  </span>
                </div> */}
              </div>
            ) : (
              /* Condition 2: Per Question Mode (Bulk Time Setting) */
              <div className="flex flex-col gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black uppercase text-slate-500">
                      Waktu Serentak Semua Soal
                    </label>
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border",
                        allSameTime
                          ? "bg-duo-green/10 text-duo-green border-duo-green/20"
                          : "bg-amber-50 text-amber-600 border-amber-200",
                      )}
                    >
                      {allSameTime ? "Seragam" : "Kustom"}
                    </span>
                  </div>

                  <select
                    value={currentBulkValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "custom") {
                        playPop();
                        setBulkQuestionsTimeLimit(parseInt(val, 10) || 0);
                      }
                    }}
                    className={cn(
                      "w-full px-3 py-2 bg-white border-2 rounded-xl font-bold text-xs sm:text-sm text-duo-dark focus:outline-none cursor-pointer transition-colors",
                      allSameTime
                        ? "border-duo-green/50 focus:border-duo-green"
                        : "border-amber-300 focus:border-amber-400",
                    )}
                  >
                    {!allSameTime && (
                      <option value="custom">Kustom (Durasi Bervariasi)</option>
                    )}
                    <option value="15">15 Detik </option>
                    <option value="20">20 Detik</option>
                    <option value="30">30 Detik </option>
                    <option value="45">45 Detik </option>
                    <option value="60">60 Detik (1 Menit)</option>
                    <option value="90">90 Detik (1.5 Menit)</option>
                    <option value="120">120 Detik (2 Menit)</option>
                    <option value="0">Tanpa Batas Waktu (∞)</option>
                  </select>
                </div>

                {/* <div
                  className={cn(
                    "p-2.5 border rounded-xl text-[11px] font-bold leading-relaxed flex items-start gap-1.5",
                    allSameTime
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                      : "bg-amber-50/80 border-amber-200 text-amber-800",
                  )}
                >
                  <span className="text-sm">{allSameTime ? "✅" : "⚡"}</span>
                  <span>
                    {allSameTime
                      ? `Semua (${questions.length}) soal diatur serentak ke ${questions[0]?.timeLimitSeconds ?? 30} detik. Setiap soal tetap bisa diubah secara individual.`
                      : `Durasi soal berbeda-beda (Kustom). Pilih durasi di atas jika ingin menyamakan seluruh soal kembali.`}
                  </span>
                </div> */}
              </div>
            )}
          </DuoCard>

          <DuoCard elevated className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2.5 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-duo-blue" />
                Daftar Soal ({questions.length})
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                Tarik untuk ubah urutan
              </span>
            </div>

            {/* Sortable Dnd-Kit List */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
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

            {/* Add Question Button with Dropdown Selector */}
            <div
              className="pt-2 border-t border-slate-100 relative"
              ref={addDropdownRef}
            >
              <TactileButton
                variant="blue"
                size="md"
                fullWidth
                icon={<Plus className="w-5 h-5 stroke-[3]" />}
                onClick={() => {
                  playPop();
                  setIsAddDropdownOpen((prev) => !prev);
                }}
                className="py-3 text-sm font-black shadow-sm"
              >
                Tambah Soal
              </TactileButton>

              {isAddDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-xl z-50 py-2 flex flex-col max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Pilih Format Soal (8 Mini-Game):
                  </div>
                  {allRegisteredPlugins.map((plugin) => {
                    const Icon = plugin.icon;
                    return (
                      <button
                        key={plugin.type}
                        type="button"
                        onClick={() => {
                          playPop();
                          addQuestion(plugin.type);
                          setIsAddDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-duo-dark hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-duo-blue/10 text-duo-blue flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-black truncate">
                            {plugin.title}
                          </span>
                          <span className="block text-[10px] text-slate-400 truncate">
                            {plugin.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </DuoCard>
        </aside>

        {/* CENTRAL WORKSPACE: Question Type Selector, Prompt, Media, and Plugin Editor */}
        <main className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          {previewMode ? (
            /* PREVIEW RUNNER */
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

              {/* Render Player Component of Active Question Plugin */}
              {currentPlugin && (
                <div className="my-4">
                  <currentPlugin.PlayerComponent
                    content={{
                      ...activeQuestion.content,
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
            /* EDITOR WORKSPACE */
            <>
              {/* Question Configuration Card */}
              {activeQuestion && (
                <DuoCard elevated className="p-6 flex flex-col gap-6">
                  {/* Compact Question Type Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-duo-blue/10 border-2 border-duo-blue/30 text-duo-blue flex items-center justify-center shrink-0 shadow-xs">
                        {currentPlugin && (
                          <currentPlugin.icon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                          Format Soal #{activeQuestionIndex + 1}
                        </span>
                        <span className="text-base font-black text-duo-dark">
                          {currentPlugin?.title}
                        </span>
                      </div>
                    </div>

                    {/* Compact Question Type Changer Dropdown */}
                    <div className="relative" ref={typeDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          playTap();
                          setIsTypeDropdownOpen((prev) => !prev);
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border-2 border-duo-gray hover:border-duo-blue rounded-xl text-xs font-black text-duo-dark transition-all cursor-pointer shadow-xs active:translate-y-0.5"
                      >
                        <span>{currentPlugin?.title || "Pilih Tipe Soal"}</span>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </button>

                      {isTypeDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-xl z-30 py-2 flex flex-col max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-3.5 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Pilih Format Baru:
                          </div>
                          {allRegisteredPlugins.map((plugin) => {
                            const Icon = plugin.icon;
                            const isSelected =
                              activeQuestion.type === plugin.type;
                            return (
                              <button
                                key={plugin.type}
                                type="button"
                                onClick={() => {
                                  handleTypeChange(plugin.type);
                                  setIsTypeDropdownOpen(false);
                                }}
                                className={`w-full px-3.5 py-2.5 text-left text-xs font-extrabold flex items-center gap-2.5 transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-duo-blue-light/60 text-duo-blue font-black"
                                    : "text-duo-dark hover:bg-slate-100"
                                }`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-duo-blue text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block truncate font-black">
                                    {plugin.title}
                                  </span>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-duo-blue shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prompt Text Field */}
                  <div>
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                      Pertanyaan / Instruksi Soal #{activeQuestionIndex + 1}
                    </label>

                    <textarea
                      rows={2}
                      value={activeQuestion.titlePrompt}
                      onChange={(e) =>
                        updateQuestion(activeQuestionIndex, {
                          titlePrompt: e.target.value,
                        })
                      }
                      placeholder="Tuliskan teks pertanyaan yang akan ditampilkan di layar proyektor..."
                      className="w-full px-4 py-3 border-2 border-duo-gray rounded-2xl font-bold text-sm sm:text-base text-duo-dark focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/15 transition-all"
                    />
                  </div>

                  {/* Media Uploader (Auto WebP Compression) - hidden for labelled_diagram because DiagramEditor has its own dedicated canvas uploader */}
                  {activeQuestion.type !== "labelled_diagram" && (
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
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                        Konfigurasi Khusus {currentPlugin.title}:
                      </h4>
                      <currentPlugin.EditorComponent
                        value={activeQuestion.content}
                        onChange={(newContent) =>
                          updateActiveQuestionContent(newContent)
                        }
                      />
                    </div>
                  )}

                  {/* Scoring & Timer Config Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                        <Award className="w-3.5 h-3.5 text-duo-yellow-border" />
                        Poin Jawaban Benar
                      </label>
                      <select
                        value={activeQuestion.points}
                        onChange={(e) =>
                          updateQuestion(activeQuestionIndex, {
                            points: parseInt(e.target.value) || 100,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white border-2 border-duo-gray rounded-2xl font-bold text-sm text-duo-dark focus:outline-none focus:border-duo-blue"
                      >
                        <option value={50}>50 Poin (Mudah)</option>
                        <option value={100}>100 Poin (Standar)</option>
                        <option value={150}>150 Poin (Tantangan)</option>
                        <option value={200}>200 Poin (Bonus)</option>
                      </select>
                    </div>

                    {/* Waktu Pengerjaan Soal (Terkunci saat Mode Global, Aktif saat Mode Per Soal) */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Clock
                            className={cn(
                              "w-3.5 h-3.5",
                              (currentQuiz.timerMode || "global") === "global"
                                ? "text-slate-400"
                                : "text-duo-green",
                            )}
                          />
                          Batas Waktu Soal #{activeQuestionIndex + 1}
                        </label>

                        {(currentQuiz.timerMode || "global") === "global" ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-400" />
                            Global
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-duo-green/10 text-duo-green border border-duo-green/20">
                            Per Soal Aktif
                          </span>
                        )}
                      </div>

                      {(currentQuiz.timerMode || "global") === "global" ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="relative">
                            <select
                              disabled
                              value="global"
                              className="w-full px-4 py-2.5 bg-slate-100/90 border-2 border-slate-200 rounded-2xl font-bold text-sm text-slate-400 cursor-not-allowed opacity-75 select-none"
                            >
                              <option value="global">
                                Mengikuti Waktu Global Kuis (
                                {Math.round(
                                  (currentQuiz.globalTimeLimitSeconds ?? 7200) /
                                    60,
                                )}{" "}
                                Menit)
                              </option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-4 h-4" />
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                            <span>🔒</span>
                            Kuis menggunakan waktu global{" "}
                            <strong>
                              {Math.round(
                                (currentQuiz.globalTimeLimitSeconds ?? 7200) /
                                  60,
                              )}{" "}
                              menit
                            </strong>{" "}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <select
                            value={activeQuestion.timeLimitSeconds ?? 30}
                            onChange={(e) =>
                              updateQuestion(activeQuestionIndex, {
                                timeLimitSeconds: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-4 py-2.5 bg-white border-2 border-duo-green/40 rounded-2xl font-bold text-sm text-duo-dark focus:outline-none focus:border-duo-green cursor-pointer"
                          >
                            <option value={15}>15 Detik (Kilat)</option>
                            <option value={20}>20 Detik</option>
                            <option value={30}>30 Detik (Standar)</option>
                            <option value={45}>45 Detik (Sedang)</option>
                            <option value={60}>60 Detik (1 Menit)</option>
                            <option value={90}>90 Detik (1.5 Menit)</option>
                            <option value={120}>120 Detik (2 Menit)</option>
                            <option value={0}>Tanpa Batas Waktu (∞)</option>
                          </select>
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-duo-green inline-block" />
                            Kamu tetap bisa mengubah waktu per soal secara
                            terpisah.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </DuoCard>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuizBuilderPage;
