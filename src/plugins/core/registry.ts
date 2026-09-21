import { QuestionTypeEnum } from "@/types/database";
import { QuestionPlugin } from "./types";
import { trueFalsePlugin } from "@/plugins/questions/true-false";
import { spellWordPlugin } from "@/plugins/questions/spell-the-word";
import { anagramPlugin } from "@/plugins/questions/anagram";
import { hangmanPlugin } from "@/plugins/questions/hangman";
import { crosswordPlugin } from "@/plugins/questions/crossword";
import { wordsearchPlugin } from "@/plugins/questions/wordsearch";
import { labelledDiagramPlugin } from "@/plugins/questions/labelled-diagram";
import { unjumblePlugin } from "@/plugins/questions/unjumble";
import { multipleChoicePlugin } from "@/plugins/questions/multiple-choice";

/**
 * Singleton Registry for decoupled question engine plugins
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<QuestionTypeEnum, QuestionPlugin<any, any>> = new Map();

  private constructor() {}

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Register a new question plugin into the runtime
   */
  public registerPlugin(plugin: QuestionPlugin<any, any>): void {
    if (
      this.plugins.has(plugin.type) &&
      this.plugins.get(plugin.type) !== plugin
    ) {
      console.warn(
        `[EduPlay PluginRegistry] Overwriting existing plugin registration for type: "${plugin.type}"`,
      );
    }
    this.plugins.set(plugin.type, plugin);
  }

  /**
   * Retrieve a question plugin by its QuestionTypeEnum.
   * Throws a descriptive error if the plugin is not yet registered.
   */
  public getPlugin<TContent = any, TAnswer = any>(
    type: QuestionTypeEnum,
  ): QuestionPlugin<TContent, TAnswer> {
    const plugin = this.plugins.get(type);
    if (!plugin) {
      const available = Array.from(this.plugins.keys());
      throw new Error(
        `[EduPlay PluginRegistry Error] Tipe soal "${type}" belum terdaftar! Plugin yang tersedia saat ini: [${
          available.length > 0
            ? available.join(", ")
            : "belum ada plugin terdaftar"
        }]. Pastikan file plugin telah diimpor dan didaftarkan via registerPlugin().`,
      );
    }
    return plugin as QuestionPlugin<TContent, TAnswer>;
  }

  /**
   * Check if a plugin for the given type is registered
   */
  public hasPlugin(type: QuestionTypeEnum): boolean {
    return this.plugins.has(type);
  }

  /**
   * Get all registered plugins
   */
  public getAllPlugins(): QuestionPlugin<any, any>[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Clear all registered plugins (useful for test isolation)
   */
  public clear(): void {
    this.plugins.clear();
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
export const questionRegistry = pluginRegistry;

// Functional export helpers
export const registerPlugin = (plugin: QuestionPlugin<any, any>) =>
  pluginRegistry.registerPlugin(plugin);
export const getPlugin = <TContent = any, TAnswer = any>(
  type: QuestionTypeEnum,
) => pluginRegistry.getPlugin<TContent, TAnswer>(type);
export const getAllPlugins = () => pluginRegistry.getAllPlugins();

// Register built-in plugins by default
pluginRegistry.registerPlugin(trueFalsePlugin);
pluginRegistry.registerPlugin(spellWordPlugin);
pluginRegistry.registerPlugin(anagramPlugin);
pluginRegistry.registerPlugin(hangmanPlugin);
pluginRegistry.registerPlugin(crosswordPlugin);
pluginRegistry.registerPlugin(wordsearchPlugin);
pluginRegistry.registerPlugin(labelledDiagramPlugin);
pluginRegistry.registerPlugin(unjumblePlugin);
pluginRegistry.registerPlugin(multipleChoicePlugin);
