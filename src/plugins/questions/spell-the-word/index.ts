import { SpellCheck } from 'lucide-react';
import { QuestionPlugin } from '@/plugins/core/types';
import { SpellWordContent, SpellWordAnswer } from './types';
import { SpellWordEditor } from './SpellWordEditor';
import { SpellWordPlayer } from './SpellWordPlayer';

export * from './types';
export * from './SpellWordEditor';
export * from './SpellWordPlayer';

export const defaultSpellWordContent: SpellWordContent = {
  targetWord: 'PLANET',
  distractors: ['X', 'B'],
  hint: 'Benda langit yang mengorbit bintang seperti Matahari.',
};

export const validateSpellWordAnswer = (
  content: SpellWordContent,
  answer: SpellWordAnswer
): { isCorrect: boolean; feedbackMessage?: string } => {
  const studentWord = (answer || []).join('').trim().toUpperCase();
  const target = (content.targetWord || '').trim().toUpperCase();
  const isCorrect = studentWord === target;

  return {
    isCorrect,
    feedbackMessage: isCorrect
      ? 'Luar biasa! Susunan huruf kata kamu 100% tepat.'
      : content.hint
      ? `Kurang tepat. Petunjuk: ${content.hint}`
      : `Kurang tepat. Kata yang benar adalah: ${target}.`,
  };
};

export const sanitizeSpellWordForPlayer = (
  content: SpellWordContent
): Partial<SpellWordContent> => {
  return {
    targetWord: content.targetWord,
    distractors: content.distractors,
    hint: content.hint,
    mediaUrl: content.mediaUrl,
  };
};

export const spellWordPlugin: QuestionPlugin<SpellWordContent, SpellWordAnswer> = {
  type: 'spell_the_word',
  title: 'Spell the Word',
  description: 'Siswa menyusun kata dari bank huruf acak ke dalam kartu slot taktil.',
  icon: SpellCheck,
  defaultContent: defaultSpellWordContent,
  EditorComponent: SpellWordEditor,
  PlayerComponent: SpellWordPlayer,
  validateAnswer: validateSpellWordAnswer,
  sanitizeForPlayer: sanitizeSpellWordForPlayer,
};

export default spellWordPlugin;

