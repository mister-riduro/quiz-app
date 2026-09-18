import { Search } from "lucide-react";
import { QuestionPlugin } from "@/plugins/core/types";
import { WordsearchContent, WordsearchAnswer } from "./types";
import { WordsearchEditor } from "./WordsearchEditor";
import { WordsearchPlayer } from "./WordsearchPlayer";
import { generateWordsearchGrid } from "./wordsearchGenerator";

export * from "./types";
export * from "./wordsearchGenerator";
export * from "./WordsearchEditor";
export * from "./WordsearchPlayer";

const initialWords = ["KUCING", "ANJING", "BURUNG", "KELINCI"];
const initialGrid = generateWordsearchGrid(initialWords, 10, false);

export const defaultWordsearchContent: WordsearchContent = {
  words: initialWords,
  gridSize: 10,
  allowDiagonal: false,
  hint: "Temukan nama-nama hewan mamalia dan peliharaan yang bersembunyi di dalam matriks.",
  grid: initialGrid.grid,
  placements: initialGrid.placements,
};

export const validateWordsearchAnswer = (
  content: WordsearchContent,
  answer: WordsearchAnswer,
): { isCorrect: boolean; feedbackMessage?: string } => {
  if (!answer || !Array.isArray(answer) || answer.length === 0) {
    return {
      isCorrect: false,
      feedbackMessage: "Kamu belum menemukan kata apa pun di dalam kotak.",
    };
  }

  const targetWords = (
    content?.words && content.words.length > 0
      ? content.words
      : defaultWordsearchContent.words
  ).map((w) => w.trim().toUpperCase());

  const foundWords = answer.map((w) => w.trim().toUpperCase());

  const foundCount = targetWords.filter((w) => foundWords.includes(w)).length;
  const isAllFound =
    targetWords.length > 0 && foundCount === targetWords.length;

  return {
    isCorrect: isAllFound,
    feedbackMessage: isAllFound
      ? `Luar biasa! Semua ${targetWords.length} kata tersembunyi berhasil kamu temukan dengan lengkap.`
      : `Kamu berhasil menemukan ${foundCount} dari ${targetWords.length} kata. Coba telusuri kembali kata-kata yang tersisa!`,
  };
};

export const sanitizeWordsearchForPlayer = (
  content: WordsearchContent,
): Partial<WordsearchContent> => {
  return {
    words: content.words,
    gridSize: content.gridSize,
    grid: content.grid,
    hint: content.hint,
    allowDiagonal: content.allowDiagonal,
  };
};

export const wordsearchPlugin: QuestionPlugin<
  WordsearchContent,
  WordsearchAnswer
> = {
  type: "wordsearch",
  title: "Cari Kata",
  description: "Matriks huruf acak dengan swipe pill highlighter.",
  icon: Search,
  defaultContent: defaultWordsearchContent,
  EditorComponent: WordsearchEditor,
  PlayerComponent: WordsearchPlayer,
  validateAnswer: validateWordsearchAnswer,
  sanitizeForPlayer: sanitizeWordsearchForPlayer,
};

export default wordsearchPlugin;
