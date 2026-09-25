import { CheckCircle2 } from "lucide-react";
import { QuestionPlugin } from "@/plugins/core/types";
import { TrueFalseContent, TrueFalseAnswer } from "./types";
import { TrueFalseEditor } from "./TrueFalseEditor";
import { TrueFalsePlayer } from "./TrueFalsePlayer";

export * from "./types";
export * from "./TrueFalseEditor";
export * from "./TrueFalsePlayer";

export const defaultTrueFalseContent: TrueFalseContent = {
  statement: "",
  correctAnswer: true,
  explanation: "",
};

export const validateTrueFalseAnswer = (
  content: TrueFalseContent,
  answer: TrueFalseAnswer,
): { isCorrect: boolean; feedbackMessage?: string } => {
  const isCorrect = content.correctAnswer === answer;
  let feedbackMessage: string;

  if (isCorrect) {
    feedbackMessage = content.explanation
      ? `Luar biasa, jawabanmu tepat! ${content.explanation}`
      : "Luar biasa, jawabanmu tepat!";
  } else {
    feedbackMessage = content.explanation
      ? `Kurang tepat. ${content.explanation}`
      : `Kurang tepat. Kunci jawaban yang benar adalah: ${content.correctAnswer ? "BENAR" : "SALAH"}.`;
  }

  return {
    isCorrect,
    feedbackMessage,
  };
};

export const sanitizeTrueFalseForPlayer = (
  content: TrueFalseContent,
): Partial<TrueFalseContent> => {
  return {
    statement: content.statement,
    explanation: content.explanation,
    mediaUrl: content.mediaUrl,
  };
};

export const trueFalsePlugin: QuestionPlugin<
  TrueFalseContent,
  TrueFalseAnswer
> = {
  type: "true_false",
  title: "True or False",
  description:
    "Pernyataan lugas dengan dua pilihan kartu 3D masif Benar atau Salah.",
  icon: CheckCircle2,
  defaultContent: defaultTrueFalseContent,
  EditorComponent: TrueFalseEditor,
  PlayerComponent: TrueFalsePlayer,
  validateAnswer: validateTrueFalseAnswer,
  sanitizeForPlayer: sanitizeTrueFalseForPlayer,
};

export default trueFalsePlugin;
