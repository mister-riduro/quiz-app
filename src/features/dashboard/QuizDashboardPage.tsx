import React, { useState, useEffect } from "react";
import { DuoCard } from "@/components/ui/DuoCard";
import { QuizCard } from "./components/QuizCard";
import { EmptyState } from "./components/EmptyState";
import { CreateQuizModal } from "./components/CreateQuizModal";
import { Quiz } from "@/types/quiz";
import { StoredQuiz } from "@/stores/quizStore";
import { useAuthStore } from "@/stores/authStore";
import { useQuizStore } from "@/stores/quizStore";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import {
  Search,
  BookOpen,
  Cloud,
  CloudOff,
  RefreshCw,
  Globe,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";
import { generateUUID } from "@/utils/uuid";

export interface QuizDashboardPageProps {
  onHostQuiz?: (quiz: Quiz) => void;
  onCreateQuiz?: (quizData?: {
    id: string;
    title: string;
    category: string;
    description: string;
  }) => void;
  onEditQuiz?: (quiz: Quiz) => void;
  isCreateModalOpen?: boolean;
  onOpenCreateModal?: () => void;
  onCloseCreateModal?: () => void;
}

type FilterTab = "all" | "published" | "draft";

export const QuizDashboardPage: React.FC<QuizDashboardPageProps> = ({
  onHostQuiz,
  onCreateQuiz,
  onEditQuiz,
  isCreateModalOpen: controlledIsCreateModalOpen,
  onOpenCreateModal,
  onCloseCreateModal,
}) => {
  const {
    quizzes,
    communityQuizzes,
    isLoading,
    isLoadingCommunity,
    syncStatus,
    saveQuiz,
    duplicateQuiz,
    togglePublish,
    deleteQuiz,
    fetchQuizzes,
    fetchCommunityQuizzes,
    cloneCommunityQuiz,
  } = useQuizStore();

  const [mainTab, setMainTab] = useState<"my-quizzes" | "community">(
    "my-quizzes",
  );
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [internalCreateModalOpen, setInternalCreateModalOpen] = useState(false);
  const isCreateModalOpen =
    controlledIsCreateModalOpen !== undefined
      ? controlledIsCreateModalOpen
      : internalCreateModalOpen;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View Mode: 'list' (default requested) vs 'grid'
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    try {
      const saved = localStorage.getItem("eduplay_quiz_view_mode");
      return saved === "grid" ? "grid" : "list";
    } catch {
      return "list";
    }
  });

  const handleSetViewMode = (mode: "grid" | "list") => {
    playTap();
    setViewMode(mode);
    try {
      localStorage.setItem("eduplay_quiz_view_mode", mode);
    } catch {
      // ignore localStorage quota/restriction
    }
  };

  const { profile, user } = useAuthStore();
  const { playTap, playPop, playWrong, playVictory } = useSoundEffect();

  useEffect(() => {
    fetchCommunityQuizzes();
  }, [fetchCommunityQuizzes]);

  // Handlers for quiz operations
  const handleOpenCreateModal = () => {
    playTap();
    if (onOpenCreateModal) {
      onOpenCreateModal();
    } else {
      setInternalCreateModalOpen(true);
    }
  };

  const handleCloseCreateModal = () => {
    if (onCloseCreateModal) {
      onCloseCreateModal();
    } else {
      setInternalCreateModalOpen(false);
    }
  };

  const handleModalSubmit = async (
    data: { title: string; category: string; description: string },
    openEditor: boolean,
  ) => {
    handleCloseCreateModal();
    const newQuizId = generateUUID();

    // Save to quizStore as draft (syncs to Supabase if logged in)
    await saveQuiz({
      id: newQuizId,
      teacherId: user?.id || "teacher-me",
      title: data.title,
      category: data.category,
      description: data.description,
      isPublished: false, // DRAFT
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questionsCount: 0,
      questions: [],
    });

    if (openEditor) {
      if (onCreateQuiz) {
        onCreateQuiz({ id: newQuizId, ...data });
      }
    } else {
      setActiveTab("draft");
      playVictory();
    }
  };

  const handleDuplicate = (quiz: Quiz) => {
    playPop();
    duplicateQuiz(quiz.id);
  };

  const handleTogglePublish = (quiz: Quiz) => {
    playPop();
    togglePublish(quiz.id);
  };

  const handleDelete = (quiz: Quiz) => {
    playWrong();
    if (window.confirm(`Yakin ingin menghapus kuis "${quiz.title}"?`)) {
      deleteQuiz(quiz.id);
    }
  };

  const handleCloneCommunity = async (communityQuiz: StoredQuiz) => {
    playPop();
    const clonedId = await cloneCommunityQuiz(communityQuiz);
    if (clonedId) {
      playVictory();
      setToastMessage(
        `Kuis "${communityQuiz.title}" berhasil disalin ke Kuis Saya! Anda kini dapat menyesuaikan soalnya.`,
      );
      setTimeout(() => setToastMessage(null), 5000);
      setMainTab("my-quizzes");
      setActiveTab("all");
    }
  };

  // Filter calculations for My Quizzes
  const totalCount = quizzes.length;
  const publishedCount = quizzes.filter((q) => q.isPublished).length;
  const draftCount = quizzes.filter((q) => !q.isPublished).length;

  const filteredQuizzes = quizzes.filter((q) => {
    // 1. Tab filter
    if (activeTab === "published" && !q.isPublished) return false;
    if (activeTab === "draft" && q.isPublished) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(qLower);
      const matchCat = q.category?.toLowerCase().includes(qLower);
      return matchTitle || matchCat;
    }

    return true;
  });

  // Filter calculations for Community Hub
  const filteredCommunityQuizzes = communityQuizzes.filter((q) => {
    if (!searchQuery.trim()) return true;
    const qLower = searchQuery.toLowerCase();
    const matchTitle = q.title.toLowerCase().includes(qLower);
    const matchCat = q.category?.toLowerCase().includes(qLower);
    const matchTeacher =
      q.teacherProfile?.full_name?.toLowerCase().includes(qLower) ||
      q.teacherProfile?.school_name?.toLowerCase().includes(qLower);
    return matchTitle || matchCat || matchTeacher;
  });

  const teacherName =
    profile?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Guru Hebat");

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      {/* 1. Header Sambutan Guru (Airlearn Hero Card) */}
      <DuoCard
        elevated
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-7 bg-white rounded-[16px] border-2 border-slate-200"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-duo-dark tracking-tight flex items-center gap-2">
            <span>Selamat Datang, {teacherName}!</span>
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Kelola dan buat kuis interaktif kelas tatap muka dengan cepat.
          </p>

          {/* Airlearn Signature Stats Capsules Row */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2">
            {/* Supabase Cloud Connection Status Capsule */}
            {syncStatus === "synced" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <Cloud className="w-3.5 h-3.5" /> Tersinkron
              </span>
            )}
            {syncStatus === "syncing" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />{" "}
                Menyinkronkan...
              </span>
            )}
            {syncStatus === "offline" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                <CloudOff className="w-3.5 h-3.5" />{" "}
                {user ? "Mode Offline" : "Penyimpanan Lokal"}
              </span>
            )}
            {syncStatus === "error" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                <CloudOff className="w-3.5 h-3.5" /> Kendala Sinkronisasi
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                playTap();
                fetchQuizzes();
              }}
              title="Sinkronkan dengan Supabase"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-slate-600 hover:text-duo-dark hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" /> Sinkronkan Ulang
            </button>
          </div>
        </div>
      </DuoCard>

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-[13px] font-black text-sm flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Mode Navigation: Kuis Saya vs Katalog Komunitas (Segmented Capsule Bar) */}
      <div className="flex items-center gap-2">
        <div className="inline-flex p-1.5 rounded-[16px] bg-[#E8EDF2] gap-1 border border-slate-200/40">
          <button
            type="button"
            onClick={() => {
              playPop();
              setMainTab("my-quizzes");
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all cursor-pointer",
              mainTab === "my-quizzes"
                ? "bg-white text-duo-dark shadow-xs"
                : "text-slate-500 hover:text-duo-dark hover:bg-white/40",
            )}
          >
            <BookOpen
              className={cn(
                "w-4 h-4",
                mainTab === "my-quizzes" ? "text-duo-green" : "text-slate-400",
              )}
            />
            <span>Kuis Saya ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playPop();
              setMainTab("community");
              fetchCommunityQuizzes();
            }}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all cursor-pointer",
              mainTab === "community"
                ? "bg-white text-duo-dark shadow-xs"
                : "text-slate-500 hover:text-duo-dark hover:bg-white/40",
            )}
          >
            <Globe
              className={cn(
                "w-4 h-4",
                mainTab === "community" ? "text-duo-blue" : "text-slate-400",
              )}
            />
            <span>Katalog Komunitas ({communityQuizzes.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KUIS SAYA */}
      {mainTab === "my-quizzes" && (
        <>
          {/* Filter Bar & Search Bar Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Airlearn Filter Segmented Capsule: Semua, Dipublikasikan, Draft */}
            <div className="inline-flex p-1.5 rounded-[16px] bg-[#E8EDF2] gap-1">
              <button
                type="button"
                onClick={() => {
                  playPop();
                  setActiveTab("all");
                }}
                className={cn(
                  "px-4 py-1.5 rounded-[13px] text-xs font-black transition-all cursor-pointer border-0",
                  activeTab === "all"
                    ? "bg-white text-duo-dark shadow-xs"
                    : "text-slate-500 hover:text-duo-dark hover:bg-white/40",
                )}
              >
                Semua ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  playPop();
                  setActiveTab("published");
                }}
                className={cn(
                  "px-4 py-1.5 rounded-[13px] text-xs font-black transition-all cursor-pointer border-0",
                  activeTab === "published"
                    ? "bg-white text-duo-dark shadow-xs"
                    : "text-slate-500 hover:text-duo-dark hover:bg-white/40",
                )}
              >
                Dipublikasikan ({publishedCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  playPop();
                  setActiveTab("draft");
                }}
                className={cn(
                  "px-4 py-1.5 rounded-[13px] text-xs font-black transition-all cursor-pointer border-0",
                  activeTab === "draft"
                    ? "bg-white text-duo-dark shadow-xs"
                    : "text-slate-500 hover:text-duo-dark hover:bg-white/40",
                )}
              >
                Draft ({draftCount})
              </button>
            </div>

            {/* Pill Search Bar */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kuis saya..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full font-bold text-xs sm:text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-green focus:ring-2 focus:ring-duo-green/20 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Quiz Cards Grid or Empty State */}
          {isLoading && quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[16px] border-2 border-dashed border-slate-200">
              <RefreshCw className="w-8 h-8 text-duo-green animate-spin mb-3" />
              <p className="font-bold text-sm text-slate-600">
                Mengambil data kuis dari Supabase...
              </p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <EmptyState
              onCreateQuiz={handleOpenCreateModal}
              title={searchQuery ? "Kuis Tidak Ditemukan" : undefined}
              description={
                searchQuery
                  ? `Tidak ada kuis yang cocok dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain atau bersihkan pencarian.`
                  : undefined
              }
            />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-xs uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-duo-green" />
                  Daftar Kuis Kelas ({filteredQuizzes.length})
                </h2>

                {/* Airlearn View Mode Switcher (Grid vs List) */}
                <div className="flex items-center p-1 bg-slate-100 rounded-full gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("list")}
                    title="Tampilan List (Baris)"
                    className={cn(
                      "p-1.5 rounded-full transition-all cursor-pointer",
                      viewMode === "list"
                        ? "bg-white text-duo-green-border shadow-xs border border-slate-200/60"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("grid")}
                    title="Tampilan Grid (Kartu)"
                    className={cn(
                      "p-1.5 rounded-full transition-all cursor-pointer",
                      viewMode === "grid"
                        ? "bg-white text-duo-green-border shadow-xs border border-slate-200/60"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-3"
                }
              >
                {filteredQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    viewMode={viewMode}
                    onHost={(q) => {
                      if (onHostQuiz) onHostQuiz(q);
                      else alert(`Memulai mode Host Kiosk untuk: "${q.title}"`);
                    }}
                    onEdit={(q) => {
                      if (onEditQuiz) onEditQuiz(q);
                      else alert(`Membuka editor untuk: "${q.title}"`);
                    }}
                    onDuplicate={handleDuplicate}
                    onTogglePublish={handleTogglePublish}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: KATALOG KOMUNITAS */}
      {mainTab === "community" && (
        <>
          {/* Community Info Banner & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Globe className="w-4 h-4 text-duo-blue" />
              <span>
                Kuis publik yang dibagikan oleh guru-guru di komunitas. Anda
                bisa langsung memainkannya atau menyalinnya ke daftar kuis Anda.
              </span>
            </div>

            {/* Search Community Bar */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kuis komunitas / guru..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full font-bold text-xs sm:text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue focus:ring-2 focus:ring-duo-blue/20 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Community Cards Grid or Empty State */}
          {isLoadingCommunity && communityQuizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[16px] border-2 border-dashed border-slate-200">
              <RefreshCw className="w-8 h-8 text-duo-blue animate-spin mb-3" />
              <p className="font-bold text-sm text-slate-600">
                Memuat kuis dari komunitas EduPlay...
              </p>
            </div>
          ) : filteredCommunityQuizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[16px] border-2 border-dashed border-slate-200 text-center">
              <Globe className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-black text-base text-duo-dark">
                {searchQuery
                  ? "Kuis Komunitas Tidak Ditemukan"
                  : "Belum Ada Kuis di Komunitas"}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 max-w-md">
                {searchQuery
                  ? `Tidak ada kuis komunitas yang cocok dengan pencarian "${searchQuery}".`
                  : "Jadilah pengajar pertama yang membagikan materi kuis ke komunitas dengan menekan tombol 'Publikasikan Kuis' di kuis Anda!"}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-xs uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-duo-blue" />
                  Kuis Publik Komunitas ({filteredCommunityQuizzes.length})
                </h2>

                {/* Airlearn View Mode Switcher (Grid vs List) */}
                <div className="flex items-center p-1 bg-slate-100 rounded-full gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("list")}
                    title="Tampilan List (Baris)"
                    className={cn(
                      "p-1.5 rounded-full transition-all cursor-pointer",
                      viewMode === "list"
                        ? "bg-white text-duo-blue-border shadow-xs border border-slate-200/60"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("grid")}
                    title="Tampilan Grid (Kartu)"
                    className={cn(
                      "p-1.5 rounded-full transition-all cursor-pointer",
                      viewMode === "grid"
                        ? "bg-white text-duo-blue-border shadow-xs border border-slate-200/60"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-3"
                }
              >
                {filteredCommunityQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    isCommunity={true}
                    viewMode={viewMode}
                    onHost={(q) => {
                      if (onHostQuiz) onHostQuiz(q);
                      else alert(`Memulai mode Host Kiosk untuk: "${q.title}"`);
                    }}
                    onClone={handleCloneCommunity}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Quiz Modal Dialog */}
      <CreateQuizModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default QuizDashboardPage;
