import { Shuffle } from 'lucide-react';
import { QuestionPlugin } from '@/plugins/core/types';
import { AnagramContent, AnagramAnswer } from './types';
import { AnagramEditor } from './AnagramEditor';
import { AnagramPlayer } from './AnagramPlayer';

export * from './types';
export * from './AnagramEditor';
export * from './AnagramPlayer';

export const defaultAnagramContent: AnagramContent = {
  targetWord: 'MATAHARI',
  hint: 'Bintang raksasa di pusat tata surya yang menerangi Bumi di siang hari.',
};

export const validateAnagramAnswer = (
  content: AnagramContent,
  answer: AnagramAnswer
): { isCorrect: boolean; feedbackMessage?: string } => {
  const studentWord = (answer || '').trim().toUpperCase();
  const target = (content.targetWord || '').trim().toUpperCase();
  const isCorrect = studentWord === target;

  return {
    isCorrect,
    feedbackMessage: isCorrect
      ? 'Luar biasa! Anagram berhasil dipecahkan dengan sempurna.'
      : content.hint
      ? `Kurang tepat. Petunjuk: ${content.hint}`
      : `Kurang tepat. Kata yang benar adalah: ${target}.`,
  };
};

export const sanitizeAnagramForPlayer = (
  content: AnagramContent
): Partial<AnagramContent> => {
  return {
    targetWord: content.targetWord,
    hint: content.hint,
    mediaUrl: content.mediaUrl,
  };
};

export const anagramPlugin: QuestionPlugin<AnagramContent, AnagramAnswer> = {
  type: 'anagram',
  title: 'Anagram',
  description: 'Tukar dan susun kembali kartu huruf acak dengan animasi pegas magnetik.',
  icon: Shuffle,
  defaultContent: defaultAnagramContent,
  EditorComponent: AnagramEditor,
  PlayerComponent: AnagramPlayer,
  validateAnswer: validateAnagramAnswer,
  sanitizeForPlayer: sanitizeAnagramForPlayer,
};

export default anagramPlugin;

