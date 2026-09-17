/**
 * Types for Child-Friendly Balloon Mascot Hangman Question Plugin
 */

export interface HangmanContent {
  secretWord: string;
  category?: string;
  hint?: string;
  maxLives: number; // 3 to 6
  mediaUrl?: string;
}

export interface HangmanAnswerData {
  guessedLetters: string[];
  isWon: boolean;
  revealedWord?: string;
}

export type HangmanAnswer = HangmanAnswerData | string[] | string;

