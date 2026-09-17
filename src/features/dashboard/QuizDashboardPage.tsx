import React, { useState, useEffect } from "react";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { QuizCard } from "./components/QuizCard";
import { EmptyState } from "./components/EmptyState";
import { CreateQuizModal } from "./components/CreateQuizModal";
import { Quiz } from "@/types/quiz";
import { StoredQuiz } from "@/stores/quizStore";
import { useAuthStore } from "@/stores/authStore";
import { useQuizStore } from "@/stores/quizStore";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import {
  Plus,
  Search,
  BookOpen,
  Sparkles,
  Cloud,
  CloudOff,
  RefreshCw,
  Globe,
  CheckCircle2,
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
}

type FilterTab = "all" | "published" | "draft";

export const QuizDashboardPage: React.FC<QuizDashboardPageProps> = ({
  onHostQuiz,
  onCreateQuiz,
  onEditQuiz,
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { profile, user } = useAuthStore();
  const { playTap, playPop, playWrong, playVictory } = useSoundEffect();

  useEffect(() => {
    fetchCommunityQuizzes();
  }, [fetchCommunityQuizzes]);

  // Handlers for quiz operations
  const handleCreateNew = () => {
    playTap();
    setIsCreateModalOpen(true);
  };

  const handleModalSubmit = async (
    data: { title: string; category: string; description: string },
    openEditor: boolean,
  ) => {
    setIsCreateModalOpen(false);
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
  const teacherInitial = teacherName ? teacherName[0]?.toUpperCase() : "G";

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      {/* 1. Header Sambutan Guru */}
      <DuoCard
        elevated
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 bg-white"
      >
        <div className="flex items-center gap-4">
          {/* Avatar Profil */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-duo-green to-[#46A302] border-4 border-duo-green-border text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={teacherName}
                className="w-full h-full rounded-3xl object-cover"
              />
            ) : (
              <span>{teacherInitial}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase text-duo-green tracking-wider inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Studio Pengajar
              </span>
              {profile?.school_name && (
                <span className="text-xs font-bold text-slate-400">
                  • {profile.school_name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-duo-dark tracking-tight">
              Selamat Datang, {teacherName}! 👋
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#777777] mt-1">
              Kelola materi kuis kelas dan mulai sesi presentasi di depan
              proyektor / tablet.
            </p>

            {/* Supabase Cloud Connection Status */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {syncStatus === "synced" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                  <Cloud className="w-3.5 h-3.5" /> Supabase Cloud Aktif
                </span>
              )}
              {syncStatus === "syncing" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 border border-sky-300 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />{" "}
                  Menyinkronkan Supabase...
                </span>
              )}
              {syncStatus === "offline" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <CloudOff className="w-3.5 h-3.5" />{" "}
                  {user ? "Mode Offline" : "Penyimpanan Lokal (Guest)"}
                </span>
              )}
              {syncStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <CloudOff className="w-3.5 h-3.5" /> Kendala Sinkronisasi
                  Supabase
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  playTap();
                  fetchQuizzes();
                }}
                title="Sinkronkan dengan Supabase"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600 hover:text-duo-dark hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              >
                <RefreshCw className="w-3 h-3" /> Sinkronkan Ulang
              </button>
            </div>
          </div>
        </div>

        {/* Action Button: Buat Kuis Baru */}
        <div className="shrink-0">
          <TactileButton
            variant="green"
            size="lg"
            icon={<Plus className="w-5 h-5 stroke-[3]" />}
            onClick={handleCreateNew}
            className="w-full sm:w-auto px-7 py-3.5 text-base tracking-wide font-black shadow-md"
          >
            Buat Kuis Baru
          </TactileButton>
        </div>
      </DuoCard>

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Mode Navigation: Kuis Saya vs Katalog Komunitas */}
      <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            playPop();
            setMainTab("my-quizzes");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
            mainTab === "my-quizzes"
              ? "bg-duo-green text-white shadow-md border-b-4 border-b-duo-green-border"
              : "bg-white text-[#777777] hover:text-duo-dark border-2 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Kuis Saya ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => {
            playPop();
            setMainTab("community");
            fetchCommunityQuizzes();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all cursor-pointer ${
            mainTab === "community"
              ? "bg-duo-blue text-white shadow-md border-b-4 border-b-duo-blue-border"
              : "bg-white text-[#777777] hover:text-duo-dark border-2 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Globe className="w-4 h-4" />
          Katalog Komunitas ({communityQuizzes.length})
        </button>
      </div>

      {/* TAB 1: KUIS SAYA */}
      {mainTab === "my-quizzes" && (
        <>
          {/* Filter Tabs & Search Bar Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Tabs: Semua, Dipublikasikan, Draft */}
            <div className="flex items-center p-1.5 bg-slate-200/80 rounded-2xl gap-1 border border-slate-300/50 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  playPop();
                  setActiveTab("all");
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-duo-dark shadow-sm border-b-2 border-b-slate-300"
                    : "text-[#777777] hover:text-duo-dark"
                }`}
              >
                Semua ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  playPop();
                  setActiveTab("published");
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === "published"
                    ? "bg-duo-green text-white shadow-sm border-b-2 border-b-duo-green-border"
                    : "text-[#777777] hover:text-duo-dark"
                }`}
              >
                Dipublikasikan ({publishedCount})
              </button>

              <button
                type="button"
                onClick={() => {
                  playPop();
                  setActiveTab("draft");
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === "draft"
                    ? "bg-duo-yellow text-duo-dark shadow-sm border-b-2 border-b-duo-yellow-border"
                    : "text-[#777777] hover:text-duo-dark"
                }`}
              >
                Draft ({draftCount})
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kuis saya..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-duo-gray rounded-2xl font-bold text-xs sm:text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue"
              />
            </div>
          </div>

          {/* Quiz Cards Grid or Empty State */}
          {isLoading && quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <RefreshCw className="w-8 h-8 text-duo-green animate-spin mb-3" />
              <p className="font-bold text-sm text-slate-600">
                Mengambil data kuis dari Supabase...
              </p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <EmptyState
              onCreateQuiz={handleCreateNew}
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
                <h2 className="font-black text-sm uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-duo-blue" />
                  Daftar Kuis Kelas ({filteredQuizzes.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
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
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-duo-gray rounded-2xl font-bold text-xs sm:text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue"
              />
            </div>
          </div>

          {/* Community Cards Grid or Empty State */}
          {isLoadingCommunity && communityQuizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <RefreshCw className="w-8 h-8 text-duo-blue animate-spin mb-3" />
              <p className="font-bold text-sm text-slate-600">
                Memuat kuis dari komunitas EduPlay...
              </p>
            </div>
          ) : filteredCommunityQuizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <Globe className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-black text-base text-duo-dark">
                {searchQuery
                  ? "Kuis Komunitas Tidak Ditemukan"
                  : "Belum Ada Kuis di Komunitas"}
              </h3>
              <p className="text-xs font-semibold text-[#777777] mt-1 max-w-md">
                {searchQuery
                  ? `Tidak ada kuis komunitas yang cocok dengan pencarian "${searchQuery}".`
                  : "Jadilah pengajar pertama yang membagikan materi kuis ke komunitas dengan menekan tombol 'Publikasikan Kuis' di kuis Anda!"}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-sm uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-duo-blue" />
                  Kuis Publik Komunitas ({filteredCommunityQuizzes.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunityQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    isCommunity={true}
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
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default QuizDashboardPage;
