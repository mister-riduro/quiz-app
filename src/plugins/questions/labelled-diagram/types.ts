/**
 * Types for Labelled Diagram Question Plugin
 */

export interface DiagramLabel {
  id: string;
  text: string;
  /** Relative horizontal coordinate percentage (0 - 100%) */
  x: number;
  /** Relative vertical coordinate percentage (0 - 100%) */
  y: number;
}

export interface LabelledDiagramContent {
  image_url: string;
  labels: DiagramLabel[];
  hint?: string;
}

/**
 * Maps pin id to the chosen label text or label id
 * Example: { 'pin-1': 'Jantung', 'pin-2': 'Paru-paru' }
 */
export type LabelledDiagramAnswer = Record<string, string>;

