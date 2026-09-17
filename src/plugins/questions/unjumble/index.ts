import { AlignLeft } from 'lucide-react';
import { QuestionPlugin } from '@/plugins/core/types';
import { UnjumbleContent, UnjumbleAnswer } from './types';
import { UnjumbleEditor } from './UnjumbleEditor';
import { UnjumblePlayer } from './UnjumblePlayer';

export * from './types';
export * from './UnjumbleEditor';
export * from './UnjumblePlayer';

export const defaultUnjumbleContent: UnjumbleContent = {
  fullSentence: 'Matahari terbit di sebelah timur.',
  tokens: ['Matahari', 'terbit', 'di', 'sebelah', 'timur.'],
  hint: 'Arah terbitnya matahari setiap pagi.',
};

export const validateUnjumbleAnswer = (
  content: UnjumbleContent,
  answer: UnjumbleAnswer
): { isCorrect: boolean; feedbackMessage?: string } => {
  if (!answer || !Array.isArray(answer) || answer.length === 0) {
    return {
      isCorrect: false,
      feedbackMessage: 'Kamu belum menyusun kalimat.',
    };
  }

  const targetTokens =
    content.tokens && content.tokens.length > 0
      ? content.tokens
      : (content.fullSentence || '').trim().split(/\s+/).filter(Boolean);

  // Exact token-by-token comparison
  const isLengthMatch = answer.length === targetTokens.length;
  const isTokensMatch =
    isLengthMatch &&
    answer.every((token, idx) => {
      const target = targetTokens[idx];
      return target ? token.trim().toLowerCase() === target.trim().toLowerCase() : false;
    });

  // String comparison of joined sentence as fallback
  const studentSentence = answer.join(' ').trim().toLowerCase();
  const targetSentence = (content.fullSentence || targetTokens.join(' ')).trim().toLowerCase();
  const isSentenceMatch = studentSentence === targetSentence;

  const isCorrect = isTokensMatch || isSentenceMatch;

  return {
    isCorrect,
    feedbackMessage: isCorrect
      ? 'Luar biasa! Kalimat berhasil disusun dengan sempurna.'
      : content.hint
      ? `Susunan kalimat belum tepat. Petunjuk: ${content.hint}`
      : `Susunan kalimat belum tepat. Kalimat yang benar: "${content.fullSentence || targetTokens.join(' ')}"`,
  };
};

export const sanitizeUnjumbleForPlayer = (
  content: UnjumbleContent
): Partial<UnjumbleContent> => {
  return {
    fullSentence: content.fullSentence,
    tokens: content.tokens,
    hint: content.hint,
    mediaUrl: content.mediaUrl,
  };
};

export const unjumblePlugin: QuestionPlugin<UnjumbleContent, UnjumbleAnswer> = {
  type: 'unjumble',
  title: 'Susun Kalimat',
  description: 'Menyusun balok-balok kata menjadi kalimat koheren.',
  icon: AlignLeft,
  defaultContent: defaultUnjumbleContent,
  EditorComponent: UnjumbleEditor,
  PlayerComponent: UnjumblePlayer,
  validateAnswer: validateUnjumbleAnswer,
  sanitizeForPlayer: sanitizeUnjumbleForPlayer,
};

export default unjumblePlugin;

