export type QuestionType =
  | "crossword"
  | "wordsearch"
  | "spell_the_word"
  | "spell_word"
  | "anagram"
  | "true_false"
  | "labelled_diagram"
  | "unjumble"
  | "hangman"
  | "multiple_choice";

export interface BaseQuestionContent {
  prompt: string;
  mediaUrl?: string;
  hint?: string;
}

export interface Question<TContent = any> {
  id: string;
  quizId: string;
  type: QuestionType;
  title: string;
  orderIndex: number;
  content: TContent;
  points: number;
  timeLimitSeconds?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  isPublished: boolean;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  questionsCount?: number;
  category?: string;
  timerMode?: "global" | "per_question";
  globalTimeLimitSeconds?: number;
}

export interface GameParticipant {
  id: string;
  nickname: string;
  avatarId: string;
  score: number;
  streak: number;
}
