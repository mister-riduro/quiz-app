import { WordPlacement } from './types';

export interface PastelPalette {
  bg: string;
  text: string;
  border: string;
  glow: string;
}

export const PASTEL_PALETTES: PastelPalette[] = [
  { bg: '#D7FFB8', text: '#2E7D32', border: '#58CC02', glow: 'rgba(88, 204, 2, 0.4)' }, // Pastel Green
  { bg: '#DDF4FF', text: '#0277BD', border: '#1CB0F6', glow: 'rgba(28, 176, 246, 0.4)' }, // Pastel Blue
  { bg: '#FFE8CC', text: '#D84315', border: '#FF9600', glow: 'rgba(255, 150, 0, 0.4)' }, // Pastel Orange
  { bg: '#F3E5FF', text: '#7B1FA2', border: '#CE82FF', glow: 'rgba(206, 130, 255, 0.4)' }, // Pastel Purple
  { bg: '#FFF5CC', text: '#F57F17', border: '#FFC800', glow: 'rgba(255, 200, 0, 0.4)' }, // Pastel Yellow
  { bg: '#FFDFE0', text: '#C62828', border: '#FF4B4B', glow: 'rgba(255, 75, 75, 0.4)' }, // Pastel Coral
];

interface Direction {
  dr: number;
  dc: number;
}

// Indonesian / English standard uppercase alphabet distribution
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface GeneratedWordsearch {
  grid: string[][];
  placements: WordPlacement[];
  placedWords: string[];
  unplacedWords: string[];
}

/**
 * Generate a 10x10 Wordsearch matrix from an array of target words
 */
export function generateWordsearchGrid(
  rawWords: string[],
  gridSize: number = 10,
  allowDiagonal: boolean = false
): GeneratedWordsearch {
  const size = Math.max(8, Math.min(14, gridSize));

  // 1. Sanitize and filter words
  const sanitizedWords = Array.from(
    new Set(
      rawWords
        .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ''))
        .filter((w) => w.length >= 2 && w.length <= size)
    )
  );

  // Sort words by length descending (greedy heuristic)
  sanitizedWords.sort((a, b) => b.length - a.length);

  // Define allowed directions
  const directions: Direction[] = [
    { dr: 0, dc: 1 }, // Horizontal (Left to Right)
    { dr: 1, dc: 0 }, // Vertical (Top to Bottom)
  ];

  if (allowDiagonal) {
    directions.push({ dr: 1, dc: 1 }); // Diagonal Down-Right
    directions.push({ dr: -1, dc: 1 }); // Diagonal Up-Right
  }

  let bestGrid: string[][] = [];
  let bestPlacements: WordPlacement[] = [];
  let bestPlacedCount = -1;

  // Run up to 40 generation attempts to maximize placements
  const maxAttempts = 40;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: string[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => '')
    );
    const placements: WordPlacement[] = [];

    for (let wIdx = 0; wIdx < sanitizedWords.length; wIdx++) {
      const word = sanitizedWords[wIdx]!;
      const candidates: { r: number; c: number; dir: Direction }[] = [];

      for (const dir of directions) {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const endR = r + (word.length - 1) * dir.dr;
            const endC = c + (word.length - 1) * dir.dc;

            if (endR >= 0 && endR < size && endC >= 0 && endC < size) {
              let canPlace = true;
              for (let i = 0; i < word.length; i++) {
                const currR = r + i * dir.dr;
                const currC = c + i * dir.dc;
                const charAtCell = grid[currR]![currC]!;
                if (charAtCell !== '' && charAtCell !== word[i]) {
                  canPlace = false;
                  break;
                }
              }

              if (canPlace) {
                candidates.push({ r, c, dir });
              }
            }
          }
        }
      }

      if (candidates.length > 0) {
        // Pick a random candidate placement
        const chosen = candidates[Math.floor(Math.random() * candidates.length)]!;
        for (let i = 0; i < word.length; i++) {
          grid[chosen.r + i * chosen.dir.dr]![chosen.c + i * chosen.dir.dc] = word[i]!;
        }

        const endR = chosen.r + (word.length - 1) * chosen.dir.dr;
        const endC = chosen.c + (word.length - 1) * chosen.dir.dc;

        placements.push({
          word,
          startRow: chosen.r,
          startCol: chosen.c,
          endRow: endR,
          endCol: endC,
          color: PASTEL_PALETTES[wIdx % PASTEL_PALETTES.length]?.border,
        });
      }
    }

    if (placements.length > bestPlacedCount) {
      bestPlacedCount = placements.length;
      bestGrid = grid;
      bestPlacements = placements;

      // If all words are placed, we're done early
      if (bestPlacedCount === sanitizedWords.length) {
        break;
      }
    }
  }

  // 2. Fill empty cells with random uppercase characters A-Z
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (bestGrid[r]![c] === '') {
        bestGrid[r]![c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)]!;
      }
    }
  }

  const placedWordSet = new Set(bestPlacements.map((p) => p.word));
  const unplacedWords = sanitizedWords.filter((w) => !placedWordSet.has(w));

  return {
    grid: bestGrid,
    placements: bestPlacements,
    placedWords: bestPlacements.map((p) => p.word),
    unplacedWords,
  };
}

