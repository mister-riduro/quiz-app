import { trueFalsePlugin } from "./true-false";
import { spellWordPlugin } from "./spell-the-word";
import { anagramPlugin } from "./anagram";
import { hangmanPlugin } from "./hangman";
import { crosswordPlugin } from "./crossword";
import { wordsearchPlugin } from "./wordsearch";
import { labelledDiagramPlugin } from "./labelled-diagram";
import { unjumblePlugin } from "./unjumble";
import { multipleChoicePlugin } from "./multiple-choice";
import { pluginRegistry } from "@/plugins/core/registry";

// 1. TRUE OR FALSE
export { trueFalsePlugin };

// 2. SPELL THE WORD
export { spellWordPlugin };

// 3. ANAGRAM
export { anagramPlugin };

// 4. HANGMAN
export { hangmanPlugin };

// 5. CROSSWORD
export { crosswordPlugin };

// 6. WORDSEARCH
export { wordsearchPlugin };

// 7. LABELLED DIAGRAM
export { labelledDiagramPlugin };

// 8. UNJUMBLE
export { unjumblePlugin };

// 9. MULTIPLE CHOICE
export { multipleChoicePlugin };

/**
 * Register all plugins into the singleton registry
 */
export function registerAllQuestionPlugins() {
  pluginRegistry.registerPlugin(trueFalsePlugin);
  pluginRegistry.registerPlugin(spellWordPlugin);
  pluginRegistry.registerPlugin(anagramPlugin);
  pluginRegistry.registerPlugin(hangmanPlugin);
  pluginRegistry.registerPlugin(crosswordPlugin);
  pluginRegistry.registerPlugin(wordsearchPlugin);
  pluginRegistry.registerPlugin(labelledDiagramPlugin);
  pluginRegistry.registerPlugin(unjumblePlugin);
  pluginRegistry.registerPlugin(multipleChoicePlugin);
}
