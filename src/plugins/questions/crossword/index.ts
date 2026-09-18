import { Grid } from "lucide-react";
import { QuestionPlugin } from "@/plugins/core/types";
import { CrosswordContent, CrosswordAnswer } from "./types";
import { CrosswordEditor } from "./CrosswordEditor";
import { CrosswordPlayer } from "./CrosswordPlayer";
import { defaultCrosswordContent, getStudentWord } from "./crosswordUtils";

export * from "./types";
export * from "./crosswordUtils";
export * from "./CrosswordEditor";
export * from "./CrosswordPlayer";

export const validateCrosswordAnswer = (
  content: CrosswordContent,
  answer: CrosswordAnswer,
): { isCorrect: boolean; feedbackMessage?: string } => {
  const words =
    content?.words && content.words.length > 0
      ? content.words
      : defaultCrosswordContent.words;

  if (!words || words.length === 0) {
    return {
      isCorrect: false,
      feedbackMessage: "Soal teka-teki silang belum memiliki daftar kata.",
    };
  }

  if (
    !answer ||
    typeof answer !== "object" ||
    Object.keys(answer).length === 0
  ) {
    return {
      isCorrect: false,
      feedbackMessage: "Kamu belum mengisi kotak teka-teki silang.",
    };
  }

  let correctCount = 0;

  words.forEach((w) => {
    const studentWord = getStudentWord(w, answer);
    const targetWord = (w.word || "").trim().toUpperCase();
    if (studentWord === targetWord && targetWord.length > 0) {
      correctCount++;
    }
  });

  const isAllCorrect = correctCount === words.length;

  return {
    isCorrect: isAllCorrect,
    feedbackMessage: isAllCorrect
      ? `Luar biasa! Seluruh ${words.length} kata teka-teki silang berhasil kamu pecahkan dengan sempurna!`
      : `Kamu berhasil menyelesaikan ${correctCount} dari ${words.length} kata. Periksa kembali kotak huruf yang masih keliru!`,
  };
};

export const sanitizeCrosswordForPlayer = (
  content: CrosswordContent,
): Partial<CrosswordContent> => {
  return {
    gridSize: content.gridSize,
    words: (content.words || []).map((w) => ({
      ...w,
      word: w.word ? "*".repeat(w.word.length) : "",
    })),
    title: content.title,
    hint: content.hint,
  };
};

export const crosswordPlugin: QuestionPlugin<
  CrosswordContent,
  CrosswordAnswer
> = {
  type: "crossword",
  title: "Teka-Teki Silang",
  description:
    "Mini grid TTS silang berpotongan dengan auto-advance kursor sentuh.",
  icon: Grid,
  defaultContent: defaultCrosswordContent,
  EditorComponent: CrosswordEditor,
  PlayerComponent: CrosswordPlayer,
  validateAnswer: validateCrosswordAnswer,
  sanitizeForPlayer: sanitizeCrosswordForPlayer,
};

export default crosswordPlugin;
