/**
 * Types for Spell the Word Question Plugin
 */

export interface SpellWordContent {
  targetWord: string;
  distractors?: string[];
  hint?: string;
  mediaUrl?: string;
}

export type SpellWordAnswer = string[];

