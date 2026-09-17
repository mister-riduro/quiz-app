/**
 * Types for Wordsearch (Cari Kata) Question Plugin
 */

export interface WordPlacement {
  word: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  color?: string; // pastel color assigned to this word
}

export interface WordsearchContent {
  words: string[];
  gridSize?: number; // default 10
  allowDiagonal?: boolean;
  hint?: string;
  grid?: string[][]; // 10x10 character matrix
  placements?: WordPlacement[];
}

/**
 * List of word strings found by the student
 */
export type WordsearchAnswer = string[];

