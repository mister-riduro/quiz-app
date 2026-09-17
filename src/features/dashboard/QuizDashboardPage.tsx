import React, { useState } from "react";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { QuizCard } from "./components/QuizCard";
import { EmptyState } from "./components/EmptyState";
import { CreateQuizModal } from "./components/CreateQuizModal";
import { Quiz } from "@/types/quiz";
import { useAuthStore } from "@/stores/authStore";
import { useQuizStore } from "@/stores/quizStore";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { Plus, Search, BookOpen, Sparkles } from "lucide-react";

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
  const quizzes = useQuizStore((state) => state.quizzes);
  const { saveQuiz, duplicateQuiz, togglePublish, deleteQuiz } = useQuizStore();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { profile, user } = useAuthStore();
  const { playTap, playPop, playWrong, playVictory } = useSoundEffect();

  // Handlers for quiz operations
  const handleCreateNew = () => {
    playTap();
    setIsCreateModalOpen(true);
  };

  const handleModalSubmit = (
    data: { title: string; category: string; description: string },
    openEditor: boolean,
  ) => {
    setIsCreateModalOpen(false);
    const newQuizId = `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Save to quizStore as draft immediately!
    saveQuiz({
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

  // Filter calculations
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

      {/* 2. Filter Tabs & Search Bar Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tabs: Semua, Dipublikasikan, Draft */}
        <div className="flex items-center p-1.5 bg-slate-200/80 rounded-2xl gap-1 border border-slate-300/50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              playPop();
              setActiveTab("all");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
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
            placeholder="Cari judul kuis..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-duo-gray rounded-2xl font-bold text-xs sm:text-sm text-duo-dark placeholder:text-slate-400 focus:outline-none focus:border-duo-blue"
          />
        </div>
      </div>

      {/* 3. Quiz Cards Grid or Empty State */}
      {filteredQuizzes.length === 0 ? (
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
