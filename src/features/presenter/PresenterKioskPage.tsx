import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowLeft,
  Clock,
  Lightbulb,
} from "lucide-react";
import { Quiz } from "@/types/quiz";
import { QuestionTypeEnum } from "@/types/database";
import { BuilderQuestion } from "@/stores/builderStore";
import { pluginRegistry } from "@/plugins/core/registry";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DuoCard } from "@/components/ui/DuoCard";
import { TactileButton } from "@/components/ui/TactileButton";
import {
  BottomSheetFeedback,
  ErrorBoundary,
  HintBottomSheet,
} from "@/components/common";
import { VictoryScreen } from "./VictoryScreen";
import { useSoundEffect } from "@/hooks/useSoundEffect";
import { cn } from "@/utils/cn";
import { DuoMathRenderer } from "@/components/common/DuoMathRenderer";

/**
 * Helper to extract human-readable solution explanation and auto-fill payload
 * for all 8 mini-game plugin types.
 */
function getQuestionSolution(question: BuilderQuestion | undefined): {
  text: string;
  autoAnswer: any;
} {
  if (!question || !question.content) {
    return {
      text: "Kunci jawaban belum ditentukan.",
      autoAnswer: null,
    };
  }

  const content = question.content as any;
  const qType = (question.type || "").toLowerCase().replace(/-/g, "_");

  let text = "";
  let autoAnswer: any = null;

  // 1. True / False
  if (
    qType === "true_false" ||
    content.correctAnswer !== undefined ||
    content.isTrue !== undefined
  ) {
    const isTrueVal =
      content.correctAnswer !== undefined
        ? Boolean(content.correctAnswer)
        : Boolean(content.isTrue);
    text = `Jawaban yang Benar: ${isTrueVal ? "BENAR" : "SALAH"}`;
    autoAnswer = isTrueVal;
  }
  // 2. Spell the Word
  else if (qType === "spell_the_word") {
    const word = (content.targetWord || "").trim().toUpperCase();
    text = `Kata yang Tepat: "${word}"`;
    autoAnswer = word.split("");
  }
  // 3. Anagram
  else if (qType === "anagram") {
    const word = (content.targetWord || "").trim().toUpperCase();
    text = `Kata yang Tepat: "${word}"`;
    autoAnswer = word;
  }
  // 4. Hangman
  else if (qType === "hangman") {
    const word = (content.secretWord || "").trim().toUpperCase();
    text = `Kata Rahasia: "${word}"`;
    const letters = Array.from(new Set(word.replace(/[^A-Z]/g, "").split("")));
    autoAnswer = {
      guessedLetters: letters,
      isWon: true,
      revealedWord: word,
    };
  }
  // 5. Unjumble
  else if (qType === "unjumble") {
    const sentence =
      content.fullSentence ||
      (Array.isArray(content.tokens) ? content.tokens.join(" ") : "");
    text = `Susunan Kalimat yang Benar: "${sentence}"`;
    autoAnswer =
      Array.isArray(content.tokens) && content.tokens.length > 0
        ? content.tokens
        : sentence.split(/\s+/).filter(Boolean);
  }
  // 6. Crossword
  else if (qType === "crossword") {
    const wordsList = Array.isArray(content.words) ? content.words : [];
    if (wordsList.length > 0) {
      const clues = wordsList
        .map((w: any, idx: number) => {
          const num = w.number || idx + 1;
          const dir = w.direction === "ACROSS" ? "Mendatar" : "Menurun";
          return `${num}. ${w.word} (${dir}: ${w.clue || ""})`;
        })
        .join("\n");
      text = `Kunci Teka-Teki Silang:\n${clues}`;

      // Build cell coordinate map
      const cellAnswers: Record<string, string> = {};
      wordsList.forEach((w: any) => {
        if (w.word && w.startPos) {
          const letters = (w.word || "").toUpperCase().split("");
          letters.forEach((ch: string, i: number) => {
            const row =
              w.direction === "DOWN" ? w.startPos.row + i : w.startPos.row;
            const col =
              w.direction === "ACROSS" ? w.startPos.col + i : w.startPos.col;
            cellAnswers[`${row}-${col}`] = ch;
          });
        }
      });
      autoAnswer = cellAnswers;
    }
  }
  // 7. Wordsearch
  else if (qType === "wordsearch") {
    const wordsList = Array.isArray(content.words)
      ? content.words
          .map((w: any) => String(w).trim().toUpperCase())
          .filter(Boolean)
      : [];
    text = `Daftar Kata yang Dicari:\n${wordsList.join(", ")}`;
    autoAnswer = wordsList;
  }
  // 8. Labelled Diagram
  else if (qType === "labelled_diagram") {
    const labels = Array.isArray(content.labels) ? content.labels : [];
    if (labels.length > 0) {
      const pinList = labels
        .map((l: any, i: number) => `Pin #${i + 1}: ${l.text}`)
        .join("\n");
      text = `Label Diagram yang Tepat:\n${pinList}`;

      const pinAnswers: Record<string, string> = {};
      labels.forEach((l: any) => {
        pinAnswers[l.id] = l.text;
      });
      autoAnswer = pinAnswers;
    }
  }
  // 9. Multiple Choice
  else if (qType === "multiple_choice") {
    const options = Array.isArray(content.options) ? content.options : [];
    const correctIds: string[] =
      Array.isArray(content.correctOptionIds) &&
      content.correctOptionIds.length > 0
        ? content.correctOptionIds
        : content.correctOptionId
          ? [content.correctOptionId]
          : [];

    const correctList = options
      .map((opt: any, idx: number) => ({ opt, idx }))
      .filter(({ opt }: any) => correctIds.includes(opt.id));

    if (correctList.length > 1) {
      const items = correctList
        .map(
          ({ opt, idx }: any) =>
            `${String.fromCharCode(65 + idx)}. ${opt.text}`,
        )
        .join("\n");
      text = `Jawaban yang Benar (${correctList.length} opsi):\n${items}`;
      autoAnswer = correctIds;
    } else if (correctList.length === 1) {
      const { opt, idx } = correctList[0];
      const letter = String.fromCharCode(65 + idx);
      text = `Jawaban yang Benar: ${letter}. ${opt.text}`;
      autoAnswer = opt.id;
    } else {
      text = `Jawaban yang Benar: ${content.correctAnswer || "Belum ditentukan"}`;
      autoAnswer = content.correctOptionId || null;
    }
  }
  // Generic fallbacks
  else if (content.targetWord) {
    const word = String(content.targetWord).trim().toUpperCase();
    text = `Jawaban yang Tepat: "${word}"`;
    autoAnswer = word;
  } else if (content.secretWord) {
    const word = String(content.secretWord).trim().toUpperCase();
    text = `Jawaban yang Tepat: "${word}"`;
    autoAnswer = word;
  } else if (Array.isArray(content.words)) {
    const list = content.words
      .map((w: any) => (typeof w === "string" ? w : w.word))
      .filter(Boolean)
      .join(", ");
    text = `Jawaban yang Tepat: ${list}`;
    autoAnswer = content.words;
  }

  // Append explanation if provided
  if (content.explanation && content.explanation.trim()) {
    text = text
      ? `${text}\n\nPenjelasan: ${content.explanation.trim()}`
      : content.explanation.trim();
  }

  return {
    text: text || "Kunci jawaban belum ditentukan.",
    autoAnswer,
  };
}

interface KioskSessionData {
  currentIndex?: number;
  answers?: Record<string, any>;
  evaluations?: Record<string, boolean>;
  unlockedQuestions?: Record<string, boolean>;
  isCompleted?: boolean;
  startTime?: number;
  globalTimeLeft?: number;
  globalSavedAt?: number;
  questionTimers?: Record<string, { timeLeft: number; savedAt: number }>;
}

function getKioskSession(key: string): KioskSessionData | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function updateKioskSession(
  key: string,
  updater: (prev: KioskSessionData) => KioskSessionData,
) {
  try {
    const prev = getKioskSession(key) || {};
    const updated = updater(prev);
    sessionStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}
}

export interface PresenterKioskPageProps {
  quiz?: Partial<Quiz>;
  questions?: BuilderQuestion[];
  initialQuestionIndex?: number;
  onExit: () => void;
}

export const PresenterKioskPage: React.FC<PresenterKioskPageProps> = ({
  quiz,
  questions: passedQuestions,
  initialQuestionIndex = 0,
  onExit,
}) => {
  const { playTap, playPop, playVictory, playWrong, isMuted, toggleMute } =
    useSoundEffect();

  const sessionKey = useMemo(
    () => (quiz?.id ? `eduplay_kiosk_${quiz.id}` : "eduplay_kiosk_active"),
    [quiz?.id],
  );

  // Active questions list
  const questions = useMemo<BuilderQuestion[]>(() => {
    if (passedQuestions && passedQuestions.length > 0) {
      return passedQuestions;
    }
    return [];
  }, [passedQuestions]);

  // Current active question index (restores from session storage on refresh)
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = getKioskSession(sessionKey);
    if (
      saved &&
      typeof saved.currentIndex === "number" &&
      saved.currentIndex >= 0 &&
      passedQuestions &&
      saved.currentIndex < passedQuestions.length
    ) {
      return saved.currentIndex;
    }
    return Math.min(
      initialQuestionIndex,
      Math.max(0, (passedQuestions?.length || 1) - 1),
    );
  });

  // Student submitted answers mapped by question id
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const saved = getKioskSession(sessionKey);
    return saved?.answers || {};
  });

  // Question evaluations: true, false, or undefined
  const [evaluations, setEvaluations] = useState<Record<string, boolean>>(
    () => {
      const saved = getKioskSession(sessionKey);
      return saved?.evaluations || {};
    },
  );

  // Unlocked questions by teacher mapped by question id
  const [unlockedQuestions, setUnlockedQuestions] = useState<
    Record<string, boolean>
  >(() => {
    const saved = getKioskSession(sessionKey);
    return saved?.unlockedQuestions || {};
  });

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

  // Hint Bottom Sheet State (Opened on-demand via "Butuh Petunjuk?" button)
  const [isHintOpen, setIsHintOpen] = useState(false);

  // Quiz completed state & timer
  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    const saved = getKioskSession(sessionKey);
    return saved?.isCompleted || false;
  });
  const [startTime, setStartTime] = useState<number>(() => {
    const saved = getKioskSession(sessionKey);
    return saved?.startTime || Date.now();
  });
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Collapsible floating teacher controls state
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Active question object
  const activeQuestion = questions[currentIndex] || questions[0];
  const activeQuestionRef = useRef(activeQuestion);
  useEffect(() => {
    activeQuestionRef.current = activeQuestion;
  }, [activeQuestion]);

  // Normalize question type (e.g. true-false -> true_false)
  const normalizedType = useMemo(() => {
    if (!activeQuestion?.type) return "true_false" as QuestionTypeEnum;
    return activeQuestion.type.replace(/-/g, "_") as QuestionTypeEnum;
  }, [activeQuestion?.type]);

  // Resolve plugin for active question with fallback
  const activePlugin = useMemo(() => {
    if (activeQuestion) {
      if (pluginRegistry.hasPlugin(activeQuestion.type)) {
        return pluginRegistry.getPlugin(activeQuestion.type);
      }
      if (pluginRegistry.hasPlugin(normalizedType)) {
        return pluginRegistry.getPlugin(normalizedType);
      }
    }
    return pluginRegistry.getAllPlugins()[0];
  }, [activeQuestion, normalizedType]);

  const isGlobalTimer = (quiz?.timerMode || "global") === "global";
  const globalTotalSeconds = quiz?.globalTimeLimitSeconds ?? 7200;
  const currentQuestionSeconds = activeQuestion?.timeLimitSeconds ?? 30;

  // Active time limit based on mode
  const effectiveTimeLimit = isGlobalTimer
    ? globalTotalSeconds
    : currentQuestionSeconds;

  // Global countdown timer state (runs continuously across all questions, persisted on refresh)
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number>(() => {
    if (globalTotalSeconds <= 0) return 0;
    const saved = getKioskSession(sessionKey);
    if (
      saved &&
      typeof saved.globalTimeLeft === "number" &&
      saved.globalSavedAt
    ) {
      const elapsed = Math.floor((Date.now() - saved.globalSavedAt) / 1000);
      return Math.max(0, saved.globalTimeLeft - elapsed);
    }
    return globalTotalSeconds;
  });

  // Per-question countdown timer state (resets on question change, persisted on refresh)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(() => {
    const activeQ = questions[currentIndex] || questions[0];
    if (!activeQ) return 30;
    const total = activeQ.timeLimitSeconds ?? 30;
    if (total <= 0) return 0;
    const saved = getKioskSession(sessionKey);
    const qSaved = saved?.questionTimers?.[activeQ.id];
    if (qSaved && typeof qSaved.timeLeft === "number" && qSaved.savedAt) {
      const elapsed = Math.floor((Date.now() - qSaved.savedAt) / 1000);
      return Math.max(0, qSaved.timeLeft - elapsed);
    }
    return total;
  });

  // Active time left to display
  const timeLeft = isGlobalTimer ? globalTimeLeft : questionTimeLeft;

  // Sync core kiosk state changes into sessionStorage
  useEffect(() => {
    updateKioskSession(sessionKey, (prev) => ({
      ...prev,
      currentIndex,
      answers,
      evaluations,
      unlockedQuestions,
      isCompleted,
      startTime,
    }));
  }, [
    currentIndex,
    answers,
    evaluations,
    unlockedQuestions,
    isCompleted,
    startTime,
    sessionKey,
  ]);

  // Reset per-question timer and hint state when question index changes, preserving ongoing question timer if revisited
  useEffect(() => {
    setIsHintOpen(false);
    if (!isGlobalTimer && activeQuestion) {
      const total = activeQuestion.timeLimitSeconds ?? 30;
      if (total <= 0) {
        setQuestionTimeLeft(0);
      } else {
        const saved = getKioskSession(sessionKey);
        const qSaved = saved?.questionTimers?.[activeQuestion.id];
        if (qSaved && typeof qSaved.timeLeft === "number" && qSaved.savedAt) {
          const elapsed = Math.floor((Date.now() - qSaved.savedAt) / 1000);
          setQuestionTimeLeft(Math.max(0, qSaved.timeLeft - elapsed));
        } else {
          setQuestionTimeLeft(total);
        }
      }
    }
  }, [
    currentIndex,
    isGlobalTimer,
    activeQuestion?.id,
    activeQuestion?.timeLimitSeconds,
    sessionKey,
  ]);

  // Global timer countdown effect (continuous across the entire quiz, saving remaining time on each tick)
  useEffect(() => {
    if (!isGlobalTimer || globalTotalSeconds <= 0 || isCompleted) return;

    const timer = setInterval(() => {
      setGlobalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          playWrong();
          setIsCompleted(true);
          const curQuestion = activeQuestionRef.current;
          const { text: solutionText } = getQuestionSolution(curQuestion);
          if (curQuestion) {
            setEvaluations((e) => ({ ...e, [curQuestion.id]: false }));
          }
          setFeedbackState({
            isOpen: true,
            isCorrect: false,
            title: "Waktu Kuis Habis! ⏰",
            message: `Batas waktu keseluruhan kuis (${Math.round(globalTotalSeconds / 60)} menit) telah berakhir.`,
            solutionExplanation: solutionText,
          });
          updateKioskSession(sessionKey, (s) => ({
            ...s,
            globalTimeLeft: 0,
            globalSavedAt: Date.now(),
          }));
          return 0;
        }
        const nextVal = prev - 1;
        updateKioskSession(sessionKey, (s) => ({
          ...s,
          globalTimeLeft: nextVal,
          globalSavedAt: Date.now(),
        }));
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGlobalTimer, globalTotalSeconds, isCompleted, playWrong, sessionKey]);

  // Per-question timer countdown effect (resets per question, saving remaining time on each tick)
  useEffect(() => {
    if (
      isGlobalTimer ||
      currentQuestionSeconds <= 0 ||
      feedbackState.isOpen ||
      isCompleted
    )
      return;

    const timer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        const curQuestion = activeQuestionRef.current;
        if (prev <= 1) {
          clearInterval(timer);
          playWrong();
          const { text: solutionText } = getQuestionSolution(curQuestion);
          if (curQuestion) {
            setEvaluations((e) => ({ ...e, [curQuestion.id]: false }));
            updateKioskSession(sessionKey, (s) => ({
              ...s,
              questionTimers: {
                ...(s.questionTimers || {}),
                [curQuestion.id]: { timeLeft: 0, savedAt: Date.now() },
              },
            }));
          }
          setFeedbackState({
            isOpen: true,
            isCorrect: false,
            title: "Waktu Habis! ⏰",
            message: "Waktu menjawab untuk soal ini telah habis.",
            solutionExplanation: solutionText,
          });
          return 0;
        }
        const nextVal = prev - 1;
        if (curQuestion) {
          updateKioskSession(sessionKey, (s) => ({
            ...s,
            questionTimers: {
              ...(s.questionTimers || {}),
              [curQuestion.id]: { timeLeft: nextVal, savedAt: Date.now() },
            },
          }));
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isGlobalTimer,
    currentQuestionSeconds,
    feedbackState.isOpen,
    isCompleted,
    playWrong,
    sessionKey,
  ]);

  const formatTimerBadge = (
    seconds: number,
    isGlobal: boolean,
    totalLimit: number,
  ) => {
    if (totalLimit <= 0) return "Tanpa Batas";
    if (seconds <= 0) return "Waktu Habis";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (isGlobal) {
      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
  };

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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

      const validation = activePlugin.validateAnswer(
        activeQuestion.content,
        studentAnswer,
      );
      const isCorrect = validation.isCorrect;

      // Record answer & evaluation
      setAnswers((prev) => ({ ...prev, [activeQuestion.id]: studentAnswer }));
      setEvaluations((prev) => ({ ...prev, [activeQuestion.id]: isCorrect }));

      if (isCorrect) {
        playVictory();
      } else {
        playWrong();
      }

      const { text: solutionText } = getQuestionSolution(activeQuestion);

      setIsHintOpen(false);

      // Show bottom sheet feedback
      setFeedbackState({
        isOpen: true,
        isCorrect,
        title: isCorrect
          ? "Luar Biasa! Jawaban Tepat!"
          : "Jawaban Belum Tepat!",
        message: validation.feedbackMessage,
        solutionExplanation: !isCorrect ? solutionText : undefined,
      });
    },
    [activeQuestion, activePlugin, playVictory, playWrong],
  );

  // Action on bottom sheet continue button
  const handleContinueNext = () => {
    setFeedbackState((prev) => ({ ...prev, isOpen: false }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all questions!
      setDurationSeconds(
        Math.max(1, Math.floor((Date.now() - startTime) / 1000)),
      );
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
      setDurationSeconds(
        Math.max(1, Math.floor((Date.now() - startTime) / 1000)),
      );
      setIsCompleted(true);
    }
  };

  // Teacher Control: Unlock / Reveal answer
  const handleUnlockAnswer = () => {
    playPop();
    if (!activeQuestion) return;

    setIsHintOpen(false);

    const { text: solutionText, autoAnswer } =
      getQuestionSolution(activeQuestion);

    // Auto-fill answer so the player component visually reflects the correct solution
    if (autoAnswer !== null && autoAnswer !== undefined) {
      setAnswers((prev) => ({ ...prev, [activeQuestion.id]: autoAnswer }));
    }

    setEvaluations((prev) => ({ ...prev, [activeQuestion.id]: true }));
    setUnlockedQuestions((prev) => ({ ...prev, [activeQuestion.id]: true }));

    setFeedbackState({
      isOpen: true,
      isCorrect: true,
      title: "Kunci Jawaban Dibuka 🔑",
      message:
        "Guru telah membuka kunci jawaban untuk dibahas bersama di kelas.",
      solutionExplanation: solutionText,
    });
  };

  // Reset quiz
  const handleRestartQuiz = () => {
    playTap();
    try {
      sessionStorage.removeItem(sessionKey);
    } catch (e) {}
    setAnswers({});
    setEvaluations({});
    setUnlockedQuestions({});
    setIsHintOpen(false);
    setCurrentIndex(0);
    setIsCompleted(false);
    setStartTime(Date.now());
    setDurationSeconds(0);
    setFeedbackState({ isOpen: false, isCorrect: false });
    if (!isGlobalTimer) {
      setQuestionTimeLeft(questions[0]?.timeLimitSeconds ?? 30);
    } else {
      setGlobalTimeLeft(globalTotalSeconds);
    }
  };

  // Exit presenter with session cleanup
  const handleExit = () => {
    playTap();
    try {
      sessionStorage.removeItem(sessionKey);
    } catch (e) {}
    onExit();
  };

  // Correct questions count
  const correctCount = useMemo(() => {
    return Object.values(evaluations).filter(Boolean).length;
  }, [evaluations]);

  // Calculate total score
  const totalScore = useMemo(() => {
    return questions.reduce((sum, q) => {
      return sum + (evaluations[q.id] ? (q.points ?? 100) : 0);
    }, 0);
  }, [questions, evaluations]);

  const maxScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points ?? 100), 0);
  }, [questions]);

  // Effective media URL (supporting images / diagrams from all storage locations)
  const effectiveMediaUrl =
    activeQuestion?.mediaUrl ||
    activeQuestion?.content?.mediaUrl ||
    activeQuestion?.content?.imageUrl ||
    activeQuestion?.content?.image_url ||
    "";

  // Default question prompt per plugin type
  const getDefaultPromptForType = (type?: string): string => {
    const norm = (type || "").replace(/-/g, "_");
    switch (norm) {
      case "true_false":
        return "Tentukan apakah pernyataan ini Benar atau Salah!";
      case "spell_the_word":
        return "Susun huruf-huruf menjadi kata yang tepat!";
      case "anagram":
        return "Susun kembali huruf acak menjadi kata yang benar!";
      case "hangman":
        return "Tebak kata rahasia dengan memilih huruf yang tepat!";
      case "crossword":
        return "Isi teka-teki silang dengan petunjuk kata yang tersedia!";
      case "wordsearch":
        return "Temukan semua kata tersembunyi di dalam matriks!";
      case "labelled_diagram":
        return "Pasangkan label ke titik diagram yang sesuai!";
      case "unjumble":
        return "Susun balok kata menjadi susunan kalimat yang utuh!";
      case "multiple_choice":
        return "Pilihlah salah satu jawaban yang paling tepat!";
      default:
        return "Selesaikan tantangan kuis interaktif berikut!";
    }
  };

  // Robust promptText resolution: never blank, never raw placeholder
  const promptText = useMemo(() => {
    const rawPrompt = activeQuestion?.titlePrompt?.trim();
    const isPlaceholderPrompt =
      !rawPrompt ||
      rawPrompt === "Tuliskan pertanyaan kuis di sini..." ||
      rawPrompt.toLowerCase() === "pertanyaan kuis" ||
      rawPrompt.toLowerCase() === "pertanyaan baru";

    if (!isPlaceholderPrompt) {
      return rawPrompt;
    }

    // Fallback to question content specific text
    const content = activeQuestion?.content;
    if (content) {
      if (typeof content.statement === "string" && content.statement.trim()) {
        return content.statement.trim();
      }
      if (typeof content.category === "string" && content.category.trim()) {
        return `Kategori: ${content.category.trim()}`;
      }
      if (typeof content.hint === "string" && content.hint.trim()) {
        return content.hint.trim();
      }
    }

    return getDefaultPromptForType(activeQuestion?.type);
  }, [activeQuestion]);

  const isDiagram = normalizedType === "labelled_diagram";
  const hasMedia = Boolean(effectiveMediaUrl && !isDiagram);
  const hintText = activeQuestion?.content?.hint;
  const isWidePlugin =
    normalizedType === "wordsearch" || normalizedType === "crossword";
  const leftColClass = isWidePlugin
    ? "md:col-span-4 lg:col-span-4"
    : "md:col-span-5 lg:col-span-5";
  const rightColClass = isWidePlugin
    ? "md:col-span-8 lg:col-span-8"
    : "md:col-span-7 lg:col-span-7";

  const playerContent = useMemo(() => {
    const rawContent =
      activeQuestion?.content && typeof activeQuestion.content === "object"
        ? activeQuestion.content
        : {};

    const statementMatches = Boolean(
      rawContent.statement &&
      promptText.trim().toLowerCase() ===
        rawContent.statement.trim().toLowerCase(),
    );

    return {
      ...rawContent,
      hint: undefined, // Hint is controlled via Presenter's "Butuh Petunjuk?" button & bottom sheet
      _hideMedia: hasMedia,
      _hideStatement: Boolean(promptText) || statementMatches,
      _hideHint: true,
    };
  }, [activeQuestion?.content, hasMedia, promptText]);

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAFC] text-duo-dark flex flex-col items-center justify-center p-6 text-center select-none">
        <DuoCard
          elevated
          className="max-w-md w-full p-8 flex flex-col items-center gap-4 bg-white"
        >
          <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 text-amber-600 flex items-center justify-center text-3xl font-black">
            📋
          </div>
          <h2 className="text-xl font-black text-duo-dark">
            Tidak Ada Soal untuk Ditampilkan
          </h2>
          <p className="text-sm font-semibold text-[#777777] leading-relaxed">
            Kuis ini belum memiliki butir soal yang dapat dimainkan. Silakan
            buat atau lengkapi butir soal di Studio Kuis.
          </p>
          <TactileButton
            variant="blue"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleExit}
          >
            Kembali ke Beranda
          </TactileButton>
        </DuoCard>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] text-duo-dark flex flex-col overflow-hidden select-none">
      {/* 1. TOP HEADER BAR: Kiosk Navigation, Thick Green Progress, Audio Toggle */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 sm:gap-6">
          {/* Exit Button */}
          <button
            type="button"
            onClick={handleExit}
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
              title={
                isMuted ? "Nyalakan Suara (Unmute)" : "Matikan Suara (Mute)"
              }
              className={cn(
                "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs",
                isMuted
                  ? "bg-red-50 border-red-200 text-duo-red"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700",
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
              title={
                isFullscreen
                  ? "Keluar Layar Penuh"
                  : "Mode Layar Penuh (Fullscreen)"
              }
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

      {/* 2. MAIN HORIZONTAL STAGE: DYNAMIC QUESTION & PLAYER RENDERER */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-32">
        <div className="w-full max-w-7xl mx-auto min-h-full flex flex-col justify-start pt-2 sm:pt-4 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 items-start">
            {/* LEFT COLUMN: Badges, Big Prompt Text, and Large Supporting Image */}
            <div
              className={cn(
                leftColClass,
                "flex flex-col justify-start gap-3 sm:gap-4 text-left",
              )}
            >
              {/* Badges: Quiz Title, Plugin, Points, Live Timer */}
              <div className="flex items-center gap-2 flex-wrap">
                {quiz?.title && (
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    {quiz.title} &bull;
                  </span>
                )}
                <span className="text-xs sm:text-sm font-black uppercase px-3 py-1 rounded-xl bg-duo-blue/10 text-duo-blue border border-duo-blue/20">
                  {activePlugin?.title || "Mini-Game"}
                </span>
                <span
                  className={cn(
                    "text-xs sm:text-sm font-black uppercase px-3 py-1 rounded-xl border",
                    (activeQuestion?.points ?? 100) === 0
                      ? "bg-slate-100 text-slate-600 border-slate-200"
                      : "bg-amber-50 text-amber-700 border-amber-200",
                  )}
                >
                  {(activeQuestion?.points ?? 100) === 0
                    ? "Tanpa Poin"
                    : `${activeQuestion?.points ?? 100} Poin`}
                </span>

                {/* Live Question / Global Timer Badge */}
                <span
                  className={cn(
                    "text-xs sm:text-sm font-black uppercase px-3 py-1 rounded-xl flex items-center gap-1.5 border transition-all",
                    effectiveTimeLimit <= 0
                      ? "bg-slate-100 text-slate-600 border-slate-200"
                      : timeLeft <= 0
                        ? "bg-red-100 text-duo-red border-red-300 font-black shadow-xs animate-pulse"
                        : timeLeft <= 10
                          ? "bg-red-100 text-duo-red border-red-300 animate-pulse font-black shadow-xs"
                          : isGlobalTimer
                            ? "bg-blue-50 text-duo-blue border-blue-200"
                            : "bg-emerald-50 text-duo-green border-emerald-200",
                  )}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold tracking-wider opacity-85">
                    Sisa Waktu:
                  </span>
                  <span className="font-black">
                    {formatTimerBadge(
                      timeLeft,
                      isGlobalTimer,
                      effectiveTimeLimit,
                    )}
                  </span>
                </span>
              </div>

              {/* Big Question Prompt Text (Large & High Contrast for Kids / Projectors) */}
              <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-[36px] font-black text-duo-dark leading-tight tracking-tight">
                <DuoMathRenderer content={promptText} />
              </h2>

              {/* Educational Hint Button (Opens Bottom Sheet Modal) */}
              {hintText && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.96, y: 2 }}
                  onClick={() => {
                    playPop();
                    setIsHintOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100/90 border-2 border-amber-300 border-b-4 border-b-amber-400 hover:border-b-amber-500 text-amber-900 rounded-2xl font-black text-xs sm:text-sm cursor-pointer shadow-xs active:border-b-2 active:translate-y-0.5 transition-all w-fit select-none"
                  title="Klik untuk membuka petunjuk soal"
                >
                  <div className="w-5 h-5 rounded-lg bg-amber-400 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>Butuh Petunjuk?</span>
                </motion.button>
              )}

              {/* Teacher Unlocked Answer Card (High visibility on stage for classroom discussion) */}
              {unlockedQuestions[activeQuestion?.id] && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-green-50/80 border-2 border-[#58CC02]/50 rounded-3xl flex items-start gap-3.5 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#58CC02] text-white flex items-center justify-center font-black shrink-0 shadow-xs mt-0.5">
                    <KeyRound className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-black uppercase text-[#46A302] tracking-wider">
                        Kunci Jawaban & Pembahasan
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#58CC02]/20 text-[#28570E] font-extrabold">
                        Mode Guru
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-800 whitespace-pre-line leading-relaxed">
                      {getQuestionSolution(activeQuestion).text}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Large Supporting Image / Diagram (Responsive for Classroom Layout) */}
              {hasMedia && (
                <div className="w-full rounded-3xl overflow-hidden border-4 border-slate-200 shadow-md bg-white p-2 sm:p-2.5 flex items-center justify-center transition-all">
                  <img
                    src={effectiveMediaUrl}
                    alt="Media Soal"
                    className="w-full max-h-[190px] sm:max-h-[220px] md:max-h-[250px] lg:max-h-[270px] object-contain rounded-2xl"
                  />
                </div>
              )}

              {/* Friendly Challenge Card when no media image is needed */}
              {!hasMedia && !isDiagram && (
                <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border-2 border-blue-100 rounded-3xl flex items-start gap-3.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-2xl bg-duo-blue text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                    ⭐
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-duo-blue tracking-wider mb-0.5">
                      Tantangan Interaktif
                    </h4>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
                      Selesaikan permainan interaktif di sebelah kanan untuk
                      meraih skor penuh!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Spacious Interactive Player Component */}
            <div
              className={cn(
                rightColClass,
                "flex flex-col justify-start items-center w-full",
              )}
            >
              <ErrorBoundary
                key={`error-boundary-${currentIndex}-${activeQuestion?.id}`}
                fallbackTitle="Komponen Soal Mengalami Kendala"
                fallbackMessage="Terjadi kendala saat menampilkan soal ini. Ketuk tombol di bawah untuk memuat ulang."
              >
                {activePlugin && activeQuestion && (
                  <motion.div
                    key={`player-${currentIndex}-${activeQuestion.id}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="w-full flex justify-center"
                  >
                    <activePlugin.PlayerComponent
                      key={activeQuestion.id}
                      content={playerContent}
                      submittedAnswer={answers[activeQuestion.id]}
                      onAnswerSubmit={handleAnswerSubmit}
                      isEvaluating={feedbackState.isOpen}
                      isCorrect={evaluations[activeQuestion.id]}
                    />
                  </motion.div>
                )}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </main>

      {/* 3. FLOATING TEACHER CONTROLS AT CORNER (COLLAPSIBLE) */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center">
        <AnimatePresence mode="wait">
          {isControlsCollapsed ? (
            /* Collapsed Trigger Pill Button */
            <motion.button
              key="collapsed-controls-trigger"
              type="button"
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playTap();
                setIsControlsCollapsed(false);
              }}
              title="Buka Menu Kontrol Guru"
              className="h-10 sm:h-11 px-3 sm:px-3.5 rounded-2xl bg-white/95 hover:bg-slate-50 backdrop-blur-md border-2 border-slate-200 text-slate-700 shadow-xl flex items-center gap-2 font-black text-xs cursor-pointer transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4 text-duo-blue" />
              <span className="hidden sm:inline">Kontrol</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </motion.button>
          ) : (
            /* Full Expanded Controls Bar */
            <motion.div
              key="expanded-controls-bar"
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white/95 backdrop-blur-md border-2 border-slate-200/90 rounded-2xl p-2 shadow-xl flex items-center gap-2"
            >
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
                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
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
                  setCurrentIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1),
                  );
                }}
                title="Soal Berikutnya"
                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-6 bg-slate-200 mx-0.5" />

              {/* Buka Kunci Jawaban Button (Unlock Answer) */}
              <button
                type="button"
                onClick={handleUnlockAnswer}
                title="Buka Kunci Jawaban untuk Seluruh Kelas"
                className={cn(
                  "px-3 py-2 rounded-xl border-2 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer",
                  unlockedQuestions[activeQuestion?.id]
                    ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-400 text-emerald-800"
                    : "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800",
                )}
              >
                <KeyRound
                  className={cn(
                    "w-3.5 h-3.5",
                    unlockedQuestions[activeQuestion?.id]
                      ? "text-emerald-600"
                      : "text-amber-600",
                  )}
                />
                <span className="hidden sm:inline">
                  {unlockedQuestions[activeQuestion?.id]
                    ? "Lihat Kunci Jawaban"
                    : "Buka Kunci Jawaban"}
                </span>
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

              <div className="w-[1px] h-6 bg-slate-200 mx-0.5" />

              {/* Collapse Button */}
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setIsControlsCollapsed(true);
                }}
                title="Ciutkan / Sembunyikan Kontrol Guru"
                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. DUOLINGO BOTTOM SHEET FEEDBACK COMPONENT */}
      <BottomSheetFeedback
        isOpen={feedbackState.isOpen}
        isCorrect={feedbackState.isCorrect}
        title={feedbackState.title}
        message={feedbackState.message}
        solutionExplanation={feedbackState.solutionExplanation}
        onAction={handleContinueNext}
        actionText={
          currentIndex < questions.length - 1
            ? "Lanjutkan"
            : "Lihat Hasil Akhir"
        }
      />

      {/* 5. DEDICATED HINT BOTTOM SHEET MODAL */}
      <HintBottomSheet
        isOpen={isHintOpen}
        hint={hintText}
        onClose={() => setIsHintOpen(false)}
      />

      {/* 6. SPECTACULAR VICTORY CELEBRATION SCREEN */}
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
            onExitDashboard={handleExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PresenterKioskPage;
