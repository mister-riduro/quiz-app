import { QuestionType } from '@/types/quiz';
import { QuestionPlugin } from './types';

class QuestionPluginRegistry {
  private plugins: Map<QuestionType, QuestionPlugin<any, any>> = new Map();

  register(plugin: QuestionPlugin<any, any>) {
    this.plugins.set(plugin.type, plugin);
  }

  get<TContent = any, TAnswer = any>(type: QuestionType): QuestionPlugin<TContent, TAnswer> | undefined {
    return this.plugins.get(type);
  }

  getAll(): QuestionPlugin<any, any>[] {
    return Array.from(this.plugins.values());
  }

  has(type: QuestionType): boolean {
    return this.plugins.has(type);
  }
}

export const questionRegistry = new QuestionPluginRegistry();

