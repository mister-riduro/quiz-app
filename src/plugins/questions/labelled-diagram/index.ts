import { MapPin } from "lucide-react";
import { QuestionPlugin } from "@/plugins/core/types";
import { LabelledDiagramContent, LabelledDiagramAnswer } from "./types";
import { DiagramEditor, DEFAULT_DIAGRAM_IMAGE } from "./DiagramEditor";
import { DiagramPlayer } from "./DiagramPlayer";

export * from "./types";
export * from "./DiagramEditor";
export * from "./DiagramPlayer";

export const defaultLabelledDiagramContent: LabelledDiagramContent = {
  image_url: DEFAULT_DIAGRAM_IMAGE,
  hint: "",
  labels: [
    { id: "pin-1", text: "Mahkota Bunga", x: 28.5, y: 32.0 },
    { id: "pin-2", text: "Kepala Putik", x: 50.0, y: 22.0 },
    { id: "pin-3", text: "Benang Sari", x: 71.5, y: 35.0 },
    { id: "pin-4", text: "Kelopak Bunga", x: 44.0, y: 74.0 },
  ],
};

export const validateLabelledDiagramAnswer = (
  content: LabelledDiagramContent,
  answer: LabelledDiagramAnswer,
): { isCorrect: boolean; feedbackMessage?: string } => {
  if (!answer || Object.keys(answer).length === 0) {
    return {
      isCorrect: false,
      feedbackMessage: "Kamu belum menempatkan label pada diagram.",
    };
  }

  const labels = content.labels || [];
  if (labels.length === 0) {
    return {
      isCorrect: true,
      feedbackMessage: "Diagram ini tidak memiliki pin label.",
    };
  }

  let correctCount = 0;
  labels.forEach((pin) => {
    const studentAnswer = (answer[pin.id] || "").trim().toLowerCase();
    const isMatched =
      studentAnswer === pin.text.trim().toLowerCase() ||
      studentAnswer === pin.id;
    if (isMatched) {
      correctCount++;
    }
  });

  const isAllCorrect = correctCount === labels.length;

  return {
    isCorrect: isAllCorrect,
    feedbackMessage: isAllCorrect
      ? `Luar biasa! Seluruh ${labels.length} label diagram berhasil dipasangkan dengan tepat.`
      : `Kamu memasangkan ${correctCount} dari ${labels.length} label dengan benar. Coba periksa kembali posisi labelmu!`,
  };
};

export const sanitizeLabelledDiagramForPlayer = (
  content: LabelledDiagramContent,
): Partial<LabelledDiagramContent> => {
  return {
    image_url: content.image_url,
    labels: content.labels,
    hint: content.hint,
  };
};

export const labelledDiagramPlugin: QuestionPlugin<
  LabelledDiagramContent,
  LabelledDiagramAnswer
> = {
  type: "labelled_diagram",
  title: "Diagram Berlabel",
  description:
    "Pin koordinat persentase responsif dengan drag label dari nampan kata.",
  icon: MapPin,
  defaultContent: defaultLabelledDiagramContent,
  EditorComponent: DiagramEditor,
  PlayerComponent: DiagramPlayer,
  validateAnswer: validateLabelledDiagramAnswer,
  sanitizeForPlayer: sanitizeLabelledDiagramForPlayer,
};

export default labelledDiagramPlugin;
