/**
 * Types for Crossword Mini (Teka-Teki Silang) Question Plugin
 */

export type CrosswordDirection = 'ACROSS' | 'DOWN';

export interface CrosswordWord {
  id: number;
  number: number;
  direction: CrosswordDirection;
  word: string;
  clue: string;
  startPos: {
    row: number; // 0-indexed row
    col: number; // 0-indexed column
  };
}

export interface CrosswordContent {
  gridSize: {
    rows: number;
    cols: number;
  };
  words: CrosswordWord[];
  title?: string;
  hint?: string;
}

/**
 * Maps coordinate string `${row}-${col}` to entered single uppercase character.
 * E.g.: { '1-1': 'B', '1-2': 'U', '1-3': 'M', '1-4': 'I' }
 */
export type CrosswordAnswer = Record<string, string>;

