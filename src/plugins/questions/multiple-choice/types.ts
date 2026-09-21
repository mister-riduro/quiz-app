export interface MultipleChoiceOption {
  id: string;
  text: string;
  mediaUrl?: string;
}

export interface MultipleChoiceContent {
  statement?: string;
  options: MultipleChoiceOption[];
  correctOptionIds: string[];
  correctOptionId?: string; // backward compatibility
  explanation?: string;
  hint?: string;
  mediaUrl?: string;
  randomizeOrder?: boolean;
}

export type MultipleChoiceAnswer = string | string[];
