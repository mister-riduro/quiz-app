import React, { useState, useRef, useEffect } from "react";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import { Badge } from "@/components/ui/Badge";
import { Quiz } from "@/types/quiz";
import { StoredQuiz } from "@/stores/quizStore";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { getMeshGradientStyle } from "@/utils";
import {
  Play,
  Edit3,
  MoreVertical,
  Copy,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  User,
} from "lucide-react";

export interface QuizCardProps {
  quiz: StoredQuiz | Quiz;
  onHost: (quiz: Quiz) => void;
  onEdit?: (quiz: Quiz) => void;
  onDuplicate?: (quiz: Quiz) => void;
  onDelete?: (quiz: Quiz) => void;
  onTogglePublish?: (quiz: Quiz) => void;
  isCommunity?: boolean;
  onClone?: (quiz: StoredQuiz) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onHost,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublish,
  isCommunity = false,
  onClone,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { playTap, playPop } = useSoundEffect();

  // Close dropdown menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPop();
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <DuoCard
      elevated
      className="flex flex-col justify-between p-5 bg-white transition-all duration-200 hover:-translate-y-1 group"
    >
      <div>
        {/* Top Cover Thumbnail */}
        <div
          className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-duo-gray mb-4 transition-transform duration-300 group-hover:scale-[1.01]"
          style={
            !quiz.coverImageUrl ? getMeshGradientStyle(quiz.id) : undefined
          }
        >
          {quiz.coverImageUrl && (
            <img
              src={quiz.coverImageUrl}
              alt={quiz.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}

          {/* Status Badge (Published / Draft) */}
          <div className="absolute top-3 right-3">
            {quiz.isPublished ? (
              <Badge variant="green" className="shadow-sm bg-white/95">
                <CheckCircle2 className="w-3 h-3 text-duo-green inline mr-1" />
                Dipublikasikan
              </Badge>
            ) : (
              <Badge variant="gray" className="shadow-sm bg-white/95">
                Draft
              </Badge>
            )}
          </div>

          {/* Category Tag */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="blue" className="shadow-sm bg-white/95 text-[11px]">
              {quiz.category || "Umum"}
            </Badge>
          </div>
        </div>

        {/* Content Details */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#777777] mb-1.5 flex-wrap">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-duo-blue" />
            {quiz.questionsCount ?? 0} Butir Soal
          </span>
          {isCommunity && (quiz as StoredQuiz).teacherProfile?.full_name && (
            <span className="flex items-center gap-1 text-slate-500 font-semibold truncate">
              • <User className="w-3 h-3 text-duo-green shrink-0" />
              {(quiz as StoredQuiz).teacherProfile?.full_name}
              {(quiz as StoredQuiz).teacherProfile?.school_name
                ? ` (${(quiz as StoredQuiz).teacherProfile?.school_name})`
                : ""}
            </span>
          )}
        </div>

        <h3
          className="font-black text-lg text-duo-dark tracking-tight line-clamp-1 group-hover:text-duo-blue transition-colors"
          title={quiz.title}
        >
          {quiz.title}
        </h3>

        <p className="text-xs font-semibold text-[#777777] line-clamp-2 mt-1 mb-5 min-h-[32px]">
          {quiz.description || "Kuis interaktif pembelajaran kelas tatap muka."}
        </p>
      </div>

      {/* Action Buttons Section */}
      {isCommunity ? (
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          {/* Mainkan di Kelas Button */}
          <TactileButton
            variant="blue"
            size="md"
            icon={<Play className="w-4 h-4 fill-current" />}
            onClick={() => {
              playTap();
              onHost(quiz);
            }}
            className="flex-1 py-3 text-sm tracking-wider shadow-sm font-black"
          >
            Mainkan di Kelas
          </TactileButton>

          {/* Clone to My Quizzes */}
          {onClone && (
            <TactileButton
              variant="green"
              size="md"
              icon={<Copy className="w-4 h-4" />}
              onClick={() => {
                playPop();
                onClone(quiz as StoredQuiz);
              }}
              className="px-3.5 py-3 text-xs tracking-wide font-black shrink-0"
            >
              Salin ke Kuis Saya
            </TactileButton>
          )}
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          {/* Massive Host / Play Button */}
          <TactileButton
            variant="blue"
            size="md"
            icon={<Play className="w-4 h-4 fill-current" />}
            onClick={() => {
              playTap();
              onHost(quiz);
            }}
            className="flex-1 py-3 text-sm tracking-wider shadow-sm font-black"
          >
            Host / Mainkan
          </TactileButton>

          {/* Edit Button */}
          {onEdit && (
            <TactileButton
              variant="outline"
              size="md"
              aria-label="Edit Kuis"
              onClick={() => {
                playTap();
                onEdit(quiz);
              }}
              className="px-3.5 py-3 border-2 border-duo-gray text-[#4B4B4B]"
            >
              <Edit3 className="w-4 h-4" />
            </TactileButton>
          )}

          {/* 3-Dots Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <TactileButton
              variant="outline"
              size="md"
              aria-label="Menu Opsi Kuis"
              onClick={toggleMenu}
              className="px-3.5 py-3 border-2 border-duo-gray text-[#4B4B4B]"
            >
              <MoreVertical className="w-4 h-4" />
            </TactileButton>

            {isMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-xl z-30 py-1.5 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setIsMenuOpen(false);
                    onEdit?.(quiz);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-duo-dark hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-duo-blue" />
                  Ubah Nama & Soal
                </button>

                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => {
                      playTap();
                      setIsMenuOpen(false);
                      onDuplicate(quiz);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-duo-dark hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-duo-orange" />
                    Gandakan Kuis
                  </button>
                )}

                {onTogglePublish && (
                  <button
                    type="button"
                    onClick={() => {
                      playTap();
                      setIsMenuOpen(false);
                      onTogglePublish(quiz);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-duo-dark hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                  >
                    {quiz.isPublished ? (
                      <>
                        <EyeOff className="w-4 h-4 text-slate-400" />
                        Tarik ke Draft
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-duo-green" />
                        Publikasikan Kuis
                      </>
                    )}
                  </button>
                )}

                {onDelete && (
                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        playTap();
                        setIsMenuOpen(false);
                        onDelete(quiz);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-duo-red hover:bg-duo-red-light flex items-center gap-2.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-duo-red" />
                      Hapus Kuis
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DuoCard>
  );
};

export default QuizCard;
