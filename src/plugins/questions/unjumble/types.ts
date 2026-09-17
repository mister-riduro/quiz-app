/**
 * Types for Unjumble (Sentence Rearranger) Question Plugin
 */

export interface UnjumbleContent {
  fullSentence: string;
  tokens: string[];
  hint?: string;
  mediaUrl?: string;
}

export type UnjumbleAnswer = string[];

export interface UnjumbleTokenItem {
  id: string;
  text: string;
  originalIndex: number;
}

