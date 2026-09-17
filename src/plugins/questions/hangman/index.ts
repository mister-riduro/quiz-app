import { Gamepad2 } from 'lucide-react';
import { QuestionPlugin } from '@/plugins/core/types';
import { HangmanContent, HangmanAnswer } from './types';
import { HangmanEditor } from './HangmanEditor';
import { HangmanPlayer } from './HangmanPlayer';

export * from './types';
export * from './HangmanEditor';
export * from './HangmanPlayer';

export const defaultHangmanContent: HangmanContent = {
  secretWord: 'INDONESIA',
  category: 'Geografi & Negara',
  hint: 'Negara kepulauan terbesar di dunia dengan semboyan Bhinneka Tunggal Ika.',
  maxLives: 5,
};

export const validateHangmanAnswer = (
  content: HangmanContent,
  answer: HangmanAnswer
): { isCorrect: boolean; feedbackMessage?: string } => {
  const secret = (content.secretWord || '').toUpperCase().trim();
  let isWon = false;

  if (typeof answer === 'string') {
    isWon = answer.toUpperCase().trim() === secret;
  } else if (typeof answer === 'object' && answer !== null && 'isWon' in answer) {
    isWon = !!answer.isWon;
  } else if (Array.isArray(answer)) {
    const guessedSet = new Set(answer.map((l) => l.toUpperCase()));
    isWon = secret.split('').every((char) => char === ' ' || guessedSet.has(char));
  }

  return {
    isCorrect: isWon,
    feedbackMessage: isWon
      ? `Luar biasa! Kamu berhasil menebak kata "${secret}"!`
      : `Sayang sekali, balon meletus semua. Kata rahasia yang tepat adalah "${secret}".`,
  };
};

export const sanitizeHangmanForPlayer = (
  content: HangmanContent
): Partial<HangmanContent> => {
  return {
    category: content.category,
    hint: content.hint,
    maxLives: content.maxLives,
    mediaUrl: content.mediaUrl,
  };
};

export const hangmanPlugin: QuestionPlugin<HangmanContent, HangmanAnswer> = {
  type: 'hangman',
  title: 'Hangman Balon',
  description: 'Tebak kata ramah anak dengan maskot balon warna-warni dan 3D on-screen keyboard.',
  icon: Gamepad2,
  defaultContent: defaultHangmanContent,
  EditorComponent: HangmanEditor,
  PlayerComponent: HangmanPlayer,
  validateAnswer: validateHangmanAnswer,
  sanitizeForPlayer: sanitizeHangmanForPlayer,
};

export default hangmanPlugin;

