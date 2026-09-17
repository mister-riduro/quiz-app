import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipForward,
  KeyRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Quiz } from '@/types/quiz';
import { BuilderQuestion } from '@/stores/builderStore';
import { pluginRegistry } from '@/plugins/core/registry';
import { defaultCrosswordContent } from '@/plugins/questions/crossword';
import { defaultWordsearchContent } from '@/plugins/questions/wordsearch';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BottomSheetFeedback } from '@/components/common/BottomSheetFeedback';
import { VictoryScreen } from './VictoryScreen';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { cn } from '@/utils/cn';

export interface PresenterKioskPageProps {
  quiz?: Partial<Quiz>;
  questions?: BuilderQuestion[];
  initialQuestionIndex?: number;
  onExit: () => void;
}

// Starter showcase questions across multiple EduPlay game engines if none provided
const DEFAULT_KIOSK_QUESTIONS: BuilderQuestion[] = [
  {
    id: 'kiosk-q1',
    type: 'crossword',
    orderIndex: 0,
    titlePrompt: 'Pecahkan Mini Teka-Teki Silang astronomi & alam berikut!',
    points: 100,
    content: defaultCrosswordContent,
  },
  {
    id: 'kiosk-q2',
    type: 'true_false',
    orderIndex: 1,
    titlePrompt: 'Bumi merupakan planet terbesar di dalam Tata Surya kita.',
    points: 50,
    content: {
      statement: 'Bumi merupakan planet terbesar di dalam Tata Surya kita.',
      isTrue: false,
      explanation: 'Planet terbesar di Tata Surya kita adalah Jupiter, bukan Bumi.',
    },
  },
  {
    id: 'kiosk-q3',
    type: 'wordsearch',
    orderIndex: 2,
    titlePrompt: 'Temukan nama-nama hewan yang tersembunyi di dalam matriks huruf!',
    points: 150,
    content: defaultWordsearchContent,
  },
  {
    id: 'kiosk-q4',
    type: 'anagram',
    orderIndex: 3,
    titlePrompt: 'Susun huruf-huruf acak ini menjadi nama planet terdekat dengan Matahari!',
    points: 100,
    content: {
      targetWord: 'MERKURIUS',
      hint: 'Planet terkecil dan terdekat posisinya dengan Matahari.',
    },
  },
];

export const PresenterKioskPage: React.FC<PresenterKioskPageProps> = ({
  quiz,
  questions: passedQuestions,
  initialQuestionIndex = 0,
  onExit,
}) => {
  const { playTap, playPop, playVictory, playWrong, isMuted, toggleMute } =
    useSoundEffect();

  // Active questions list
  const questions = useMemo<BuilderQuestion[]>(() => {
    if (passedQuestions && passedQuestions.length > 0) {
      return passedQuestions;
    }
    return DEFAULT_KIOSK_QUESTIONS;
  }, [passedQuestions]);

  // Current active question index
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(initialQuestionIndex, Math.max(0, questions.length - 1))
  );

  // Student submitted answers mapped by question id
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Question evaluations: true, false, or undefined
  const [evaluations, setEvaluations] = useState<Record<string, boolean>>({});

  // BottomSheetFeedback State
  const [feedbackState, setFeedbackState] = useState<{
    isOpen: boolean;
    isCorrect: boolean;
    title?: string;
    message?: string;
    solutionExplanation?: string;
  }>({
    isOpen: false,
    isCorrect: false,
  });

  // Quiz completed state & timer
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active question object
  const activeQuestion = questions[currentIndex] || questions[0];

  // Resolve plugin for active question
  const activePlugin = useMemo(() => {
    if (activeQuestion && pluginRegistry.hasPlugin(activeQuestion.type)) {
      return pluginRegistry.getPlugin(activeQuestion.type);
    }
    return pluginRegistry.getAllPlugins()[0];
  }, [activeQuestion]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle browser fullscreen
  const toggleFullscreen = async () => {
    playTap();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      // Fullscreen not allowed or blocked
    }
  };

  // Handle student answer submission from PlayerComponent
  const handleAnswerSubmit = useCallback(
    (studentAnswer: any) => {
      if (!activeQuestion || !activePlugin) return;

      const validation = activePlugin.validateAnswer(activeQuestion.content, studentAnswer);
      const isCorrect = validation.isCorrect;

      // Record answer & evaluation
      setAnswers((prev) => ({ ...prev, [activeQuestion.id]: studentAnswer }));
      setEvaluations((prev) => ({ ...prev, [activeQuestion.id]: isCorrect }));

      if (isCorrect) {
        playVictory();
      } else {
        playWrong();
      }

      // Show bottom sheet feedback
      setFeedbackState({
        isOpen: true,
        isCorrect,
        title: isCorrect ? 'Luar Biasa! Jawaban Tepat!' : 'Jawaban Belum Tepat!',
        message: validation.feedbackMessage,
        solutionExplanation: !isCorrect
          ? activeQuestion.content?.explanation || 'Pelajari kembali petunjuk untuk memahami konsep ini.'
          : undefined,
      });
    },
    [activeQuestion, activePlugin, playVictory, playWrong]
  );

  // Action on bottom sheet continue button
  const handleContinueNext = () => {
    setFeedbackState((prev) => ({ ...prev, isOpen: false }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all questions!
      setDurationSeconds(Math.max(1, Math.floor((Date.now() - startTime) / 1000)));
      setIsCompleted(true);
    }
  };

  // Teacher Control: Skip question
  const handleSkipQuestion = () => {
    playTap();
    setFeedbackState((prev) => ({ ...prev, isOpen: false }));
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setDurationSeconds(Math.max(1, Math.floor((Date.now() - startTime) / 1000)));
      setIsCompleted(true);
    }
  };

  // Teacher Control: Unlock / Reveal answer
  const handleUnlockAnswer = () => {
    playPop();
    if (!activeQuestion) return;

    let solutionText = 'Kunci jawaban dibuka oleh Guru.';
    if (activeQuestion.content?.explanation) {
      solutionText = activeQuestion.content.explanation;
    } else if (activeQuestion.content?.isTrue !== undefined) {
      solutionText = `Pernyataan ini bernilai: ${activeQuestion.content.isTrue ? 'BENAR' : 'SALAH'}`;
    } else if (activeQuestion.content?.targetWord) {
      solutionText = `Kata yang tepat adalah: "${activeQuestion.content.targetWord}"`;
    } else if (activeQuestion.content?.words) {
      const wordsList = Array.isArray(activeQuestion.content.words)
        ? activeQuestion.content.words
            .map((w: any) => (typeof w === 'string' ? w : w.word))
            .filter(Boolean)
            .join(', ')
        : '';
      if (wordsList) {
        solutionText = `Daftar kata: ${wordsList}`;
      }
    }

    setEvaluations((prev) => ({ ...prev, [activeQuestion.id]: true }));
    setFeedbackState({
      isOpen: true,
      isCorrect: true,
      title: 'Kunci Jawaban Dibuka (Mode Guru)',
      message: 'Guru telah membuka kunci jawaban untuk dibahas bersama di kelas.',
      solutionExplanation: solutionText,
    });
  };

  // Reset quiz
  const handleRestartQuiz = () => {
    playTap();
    setAnswers({});
    setEvaluations({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setStartTime(Date.now());
    setDurationSeconds(0);
    setFeedbackState({ isOpen: false, isCorrect: false });
  };

  // Correct questions count
  const correctCount = useMemo(() => {
    return Object.values(evaluations).filter(Boolean).length;
  }, [evaluations]);

  // Calculate total score
  const totalScore = useMemo(() => {
    return questions.reduce((sum, q) => {
      return sum + (evaluations[q.id] ? q.points || 100 : 0);
    }, 0);
  }, [questions, evaluations]);

  const maxScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points || 100), 0);
  }, [questions]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] text-duo-dark flex flex-col overflow-hidden select-none">
      {/* 1. TOP HEADER BAR: Kiosk Navigation, Thick Green Progress, Audio Toggle */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 sm:gap-6">
          {/* Exit Button */}
          <button
            type="button"
            onClick={() => {
              playTap();
              onExit();
            }}
            title="Keluar dari Mode Presenter"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Thick Green Progress Bar with Question Number Badge */}
          <div className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex-1 min-w-0">
              <ProgressBar
                current={currentIndex + 1}
                total={questions.length}
                size="lg"
                className="w-full"
                ariaLabel={`Progres soal ${currentIndex + 1} dari ${questions.length}`}
              />
            </div>

            <span className="text-xs sm:text-sm font-black text-slate-500 whitespace-nowrap bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 shrink-0">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Audio & Fullscreen Toggle Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Nyalakan Suara (Unmute)' : 'Matikan Suara (Mute)'}
              className={cn(
                'w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs',
                isMuted
                  ? 'bg-red-50 border-red-200 text-duo-red'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              )}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Fullscreen)'}
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs hidden sm:flex"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CENTER STAGE: DYNAMIC QUESTION ENGINE RENDERER */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-28 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
          {/* Quiz Title & Question Type Badge */}
          <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
            {quiz?.title && (
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {quiz.title} &bull;
              </span>
            )}
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-lg bg-duo-blue/10 text-duo-blue border border-duo-blue/20">
              {activePlugin?.title || 'Mini-Game'}
            </span>
            <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              {activeQuestion?.points || 100} Poin
            </span>
          </div>

          {/* Question Prompt Title (Big Typography for Projector / TV Screen) */}
          {activeQuestion?.titlePrompt && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-center text-duo-dark max-w-3xl leading-snug mb-4 px-2">
              {activeQuestion.titlePrompt}
            </h2>
          )}

          {/* Media Diagram / Supporting Image if present */}
          {activeQuestion?.mediaUrl && (
            <div className="mb-4 max-w-md w-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-white p-1">
              <img
                src={activeQuestion.mediaUrl}
                alt="Media Soal"
                className="w-full max-h-56 object-contain rounded-xl"
              />
            </div>
          )}

          {/* DYNAMIC PLAYER COMPONENT RENDERING VIA REGISTRY */}
          {activePlugin && (
            <div className="w-full flex justify-center">
              <activePlugin.PlayerComponent
                content={activeQuestion.content}
                submittedAnswer={answers[activeQuestion.id]}
                onAnswerSubmit={handleAnswerSubmit}
                isEvaluating={feedbackState.isOpen}
                isCorrect={evaluations[activeQuestion.id]}
              />
            </div>
          )}
        </div>
      </main>

      {/* 3. FLOATING TEACHER CONTROLS AT CORNER (USER REQUIREMENT) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5">
        <div className="bg-white/95 backdrop-blur-md border-2 border-slate-200/90 rounded-2xl p-2 shadow-xl flex items-center gap-2">
          {/* Previous Question */}
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              playTap();
              setFeedbackState((prev) => ({ ...prev, isOpen: false }));
              setCurrentIndex((prev) => Math.max(0, prev - 1));
            }}
            title="Soal Sebelumnya"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next Question */}
          <button
            type="button"
            disabled={currentIndex === questions.length - 1}
            onClick={() => {
              playTap();
              setFeedbackState((prev) => ({ ...prev, isOpen: false }));
              setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
            }}
            title="Soal Berikutnya"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-slate-200 mx-0.5" />

          {/* Buka Kunci Jawaban Button (Unlock Answer) */}
          <button
            type="button"
            onClick={handleUnlockAnswer}
            title="Buka Kunci Jawaban untuk Seluruh Kelas"
            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-800 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Buka Kunci Jawaban</span>
            <span className="sm:hidden">Kunci</span>
          </button>

          {/* Lewati Soal Button (Skip Question) */}
          <button
            type="button"
            onClick={handleSkipQuestion}
            title="Lewati Pertanyaan Ini"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Lewati Soal</span>
            <span className="sm:hidden">Lewati</span>
          </button>
        </div>
      </div>

      {/* 4. DUOLINGO BOTTOM SHEET FEEDBACK COMPONENT */}
      <BottomSheetFeedback
        isOpen={feedbackState.isOpen}
        isCorrect={feedbackState.isCorrect}
        title={feedbackState.title}
        message={feedbackState.message}
        solutionExplanation={feedbackState.solutionExplanation}
        onAction={handleContinueNext}
        actionText={currentIndex < questions.length - 1 ? 'Lanjutkan' : 'Lihat Hasil Akhir'}
      />

      {/* 5. SPECTACULAR VICTORY CELEBRATION SCREEN */}
      <AnimatePresence>
        {isCompleted && (
          <VictoryScreen
            quizTitle={quiz?.title}
            totalQuestions={questions.length}
            correctQuestions={correctCount}
            totalScore={totalScore}
            maxScore={maxScore}
            durationSeconds={durationSeconds}
            onPlayAgain={handleRestartQuiz}
            onExitDashboard={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PresenterKioskPage;
