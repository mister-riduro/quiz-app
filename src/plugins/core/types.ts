import React from 'react';
import { QuestionTypeEnum } from '@/types/database';

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
  feedbackMessage?: string;
}

/**
 * Standard Micro-Plugin Contract for EduPlay Question Engines
 */
export interface QuestionPlugin<TContent = any, TAnswer = any> {
  type: QuestionTypeEnum;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultContent: TContent;
  EditorComponent: React.FC<EditorProps<TContent>>;
  PlayerComponent: React.FC<PlayerProps<TContent, TAnswer>>;
  validateAnswer: (content: TContent, answer: TAnswer) => { isCorrect: boolean; feedbackMessage?: string };
  sanitizeForPlayer: (content: TContent) => Partial<TContent>;
}

