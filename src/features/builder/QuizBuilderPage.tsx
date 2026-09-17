import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useBuilderStore } from '@/stores/builderStore';
import { pluginRegistry } from '@/plugins/core/registry';
import { QuestionTypeEnum } from '@/types/database';
import { TactileButton } from '@/components/ui/TactileButton';
import { DuoCard } from '@/components/ui/DuoCard';
import { Badge } from '@/components/ui/Badge';
import { ImageUploader } from '@/components/common/ImageUploader';
import { SortableQuestionItem } from './components/SortableQuestionItem';
import { useSoundEffect } from '@/hooks/useSoundEffect';
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
} from 'lucide-react';

export interface QuizBuilderPageProps {
  onBack?: () => void;
  onPreview?: () => void;
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
  const { playTap, playPop, playCorrect, playVictory } = useSoundEffect();

  // Sensors for @dnd-kit drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
  const currentPlugin = activeQuestion && pluginRegistry.hasPlugin(activeQuestion.type)
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
                value={currentQuiz.title || ''}
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
                  ? 'bg-duo-green-light border-duo-green text-duo-green-border'
                  : 'bg-slate-100 border-slate-300 text-[#777777]'
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
                if (onPreview) onPreview();
                else setPreviewMode(!previewMode);
              }}
              className="border-2 border-duo-gray text-[#4B4B4B]"
            >
              {previewMode ? 'Tutup Pratinjau' : 'Pratinjau'}
            </TactileButton>

            {/* Save Button */}
            <TactileButton
              variant="green"
              size="sm"
              isLoading={isSaving}
              icon={isDirty ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              onClick={handleSave}
              className="font-black px-4"
            >
              {isSaving ? 'Menyimpan...' : isDirty ? 'Simpan' : 'Tersimpan'}
            </TactileButton>
          </div>
        </div>

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-duo-green text-white text-xs font-black px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4" />
            Perubahan kuis berhasil disimpan!
          </div>
        )}
      </header>

      {/* 2. MAIN BUILDER BODY (Left Sidebar + Central Workspace) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR: Question Thumbnail List with @dnd-kit reordering */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          <DuoCard elevated className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-duo-blue" />
                Daftar Soal ({questions.length})
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Tarik untuk ubah urutan</span>
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

            {/* Add Question Button */}
            <div className="pt-2 border-t border-slate-100">
              <TactileButton
                variant="blue"
                size="md"
                fullWidth
                icon={<Plus className="w-5 h-5 stroke-[3]" />}
                onClick={() => {
                  playPop();
                  addQuestion('true_false');
                }}
                className="py-3 text-sm font-black shadow-sm"
              >
                + Tambah Soal
              </TactileButton>
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
                      mediaUrl: activeQuestion.mediaUrl || activeQuestion.content?.mediaUrl,
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
              {/* Question Type Selector Tab Bar */}
              <DuoCard elevated className="p-4 flex flex-col gap-3">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Pilih Format Mini-Game (8 Tipe Soal EduPlay):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {allRegisteredPlugins.map((plugin) => {
                    const isSelected = activeQuestion?.type === plugin.type;
                    const Icon = plugin.icon;

                    return (
                      <button
                        key={plugin.type}
                        type="button"
                        onClick={() => handleTypeChange(plugin.type)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'bg-duo-blue-light border-duo-blue border-b-4 border-b-duo-blue-border text-duo-dark shadow-sm'
                            : 'bg-white border-duo-gray hover:border-slate-300 text-duo-dark/80 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-duo-blue text-white shadow-xs'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-black truncate">
                            {plugin.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </DuoCard>

              {/* Question Configuration Card */}
              {activeQuestion && (
                <DuoCard elevated className="p-6 flex flex-col gap-6">
                  {/* Prompt Text Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Pertanyaan / Instruksi Soal #{activeQuestionIndex + 1}
                      </label>
                      <Badge variant="blue" className="text-[10px]">
                        {currentPlugin?.title}
                      </Badge>
                    </div>

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

                  {/* Media Uploader (Auto WebP Compression) */}
                  <ImageUploader
                    value={activeQuestion.mediaUrl}
                    onChange={(url) =>
                      updateQuestion(activeQuestionIndex, { mediaUrl: url })
                    }
                    label="Media Gambar / Diagram Pendukung (Opsional)"
                  />

                  {/* Dynamic Plugin Editor Component */}
                  {currentPlugin?.EditorComponent && (
                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                        Konfigurasi Khusus {currentPlugin.title}:
                      </h4>
                      <currentPlugin.EditorComponent
                        value={activeQuestion.content}
                        onChange={(newContent) => updateActiveQuestionContent(newContent)}
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

                    <div>
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                        <Clock className="w-3.5 h-3.5 text-duo-blue" />
                        Waktu Menjawab (Kiosk)
                      </label>
                      <select
                        defaultValue={30}
                        className="w-full px-4 py-2.5 bg-white border-2 border-duo-gray rounded-2xl font-bold text-sm text-duo-dark focus:outline-none focus:border-duo-blue"
                      >
                        <option value={15}>15 Detik (Cepat)</option>
                        <option value={30}>30 Detik (Ideal Kelas)</option>
                        <option value={60}>60 Detik (Analitis)</option>
                        <option value={0}>Tanpa Batas Waktu</option>
                      </select>
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

