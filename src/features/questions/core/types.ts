import React from 'react';
import { QuestionType } from '@/types/quiz';

export interface EditorProps<TContent> {
  value: TContent;
  onChange: (value: TContent) => void;
  disabled?: boolean;
}

export interface PlayerProps<TContent, TAnswer> {
  content: TContent;
  submittedAnswer?: TAnswer;
  onAnswerSubmit: (answer: TAnswer) => void;
  isEvaluating?: boolean;
  isCorrect?: boolean | null;
}

export interface ValidationResult {
  isCorrect: boolean;
  score: number;
  feedback?: string;
}

export interface QuestionPlugin<TContent = any, TAnswer = any> {
  type: QuestionType;
  label: string;
  icon: string;
  description: string;
  defaultContent: TContent;
  EditorComponent: React.FC<EditorProps<TContent>>;
  PlayerComponent: React.FC<PlayerProps<TContent, TAnswer>>;
  validateAnswer: (content: TContent, answer: TAnswer) => ValidationResult;
  sanitizeForPlayer: (content: TContent) => Partial<TContent>;
}

