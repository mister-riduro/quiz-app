import { ListOrdered } from "lucide-react";
import { QuestionPlugin } from "@/plugins/core/types";
import { MultipleChoiceContent, MultipleChoiceAnswer } from "./types";
import { MultipleChoiceEditor } from "./MultipleChoiceEditor";
import { MultipleChoicePlayer } from "./MultipleChoicePlayer";

export * from "./types";
export * from "./MultipleChoiceEditor";
export * from "./MultipleChoicePlayer";

export const defaultMultipleChoiceContent: MultipleChoiceContent = {
  statement: "Planet ketiga dari Matahari dalam tata surya kita adalah...",
  options: [
    { id: "opt-1", text: "Merkurius" },
    { id: "opt-2", text: "Venus" },
    { id: "opt-3", text: "Bumi" },
    { id: "opt-4", text: "Mars" },
  ],
  correctOptionIds: ["opt-3"],
  correctOptionId: "opt-3",
  explanation: "",
  hint: "",
  randomizeOrder: false,
};

export const validateMultipleChoiceAnswer = (
  content: MultipleChoiceContent,
  answer: MultipleChoiceAnswer,
): { isCorrect: boolean; feedbackMessage?: string } => {
  const targetIds: string[] =
    Array.isArray(content.correctOptionIds) &&
    content.correctOptionIds.length > 0
      ? content.correctOptionIds
      : content.correctOptionId
        ? [content.correctOptionId]
        : [];

  const studentAnswers: string[] = Array.isArray(answer)
    ? answer
    : typeof answer === "string" && answer
      ? [answer]
      : [];

  const isCorrect =
    targetIds.length > 0 &&
    studentAnswers.length === targetIds.length &&
    targetIds.every((id) => studentAnswers.includes(id));

  const correctOptions = (content.options || []).filter((opt) =>
    targetIds.includes(opt.id),
  );
  const correctText = correctOptions.map((o) => `"${o.text}"`).join(", ");

  let feedbackMessage: string;
  if (isCorrect) {
    feedbackMessage = content.explanation
      ? `Luar biasa, pilihanmu tepat! ${content.explanation}`
      : "Luar biasa, pilihanmu tepat!";
  } else {
    feedbackMessage = content.explanation
      ? `Kurang tepat. ${content.explanation}`
      : `Kurang tepat. Kunci jawaban yang benar adalah: ${correctText || "kunci jawaban"}.`;
  }

  return {
    isCorrect,
    feedbackMessage,
  };
};

export const sanitizeMultipleChoiceForPlayer = (
  content: MultipleChoiceContent,
): Partial<MultipleChoiceContent> => {
  return {
    statement: content.statement,
    options: content.options,
    explanation: content.explanation,
    hint: content.hint,
    mediaUrl: content.mediaUrl,
    randomizeOrder: content.randomizeOrder,
  };
};

export const multipleChoicePlugin: QuestionPlugin<
  MultipleChoiceContent,
  MultipleChoiceAnswer
> = {
  type: "multiple_choice",
  title: "Pilihan Ganda",
  description:
    "Format pilihan ganda klasik dengan kartu 3D tactile, animasi, dan hotkey keyboard.",
  icon: ListOrdered,
  defaultContent: defaultMultipleChoiceContent,
  EditorComponent: MultipleChoiceEditor,
  PlayerComponent: MultipleChoicePlayer,
  validateAnswer: validateMultipleChoiceAnswer,
  sanitizeForPlayer: sanitizeMultipleChoiceForPlayer,
};

export default multipleChoicePlugin;
