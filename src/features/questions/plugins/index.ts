import { registerAllQuestionPlugins } from '@/plugins/questions/allPlugins';
import { questionRegistry as legacyRegistry } from '../core/registry';
import { trueFalsePlugin as legacyTrueFalsePlugin } from './true-false';

export function initializeQuestionPlugins() {
  // Register all 8 modern plugins
  registerAllQuestionPlugins();

  // Register legacy plugin
  legacyRegistry.register(legacyTrueFalsePlugin);
}

export { legacyTrueFalsePlugin };
export * from '@/plugins/questions/allPlugins';
