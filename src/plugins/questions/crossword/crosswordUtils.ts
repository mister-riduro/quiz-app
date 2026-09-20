import { CrosswordContent, CrosswordWord, CrosswordAnswer } from "./types";

export interface CrosswordGridCell {
  row: number;
  col: number;
  char: string;
  number?: number;
  wordIds: number[];
  acrossWordId?: number;
  downWordId?: number;
  hasCollision?: boolean;
  collisionDetails?: string;
}

export function coordKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function parseCoordKey(key: string): { row: number; col: number } {
  const [r, c] = key.split(/[,-]/).map((val) => parseInt(val, 10));
  return { row: isNaN(r) ? 0 : r, col: isNaN(c) ? 0 : c };
}

/**
 * Returns all cell coordinates for a given word.
 */
export function getWordCells(word: CrosswordWord): Array<{
  row: number;
  col: number;
  char: string;
  index: number;
}> {
  const letters = (word.word || "").toUpperCase().split("");
  return letters.map((char, index) => {
    const row =
      word.direction === "DOWN" ? word.startPos.row + index : word.startPos.row;
    const col =
      word.direction === "ACROSS"
        ? word.startPos.col + index
        : word.startPos.col;
    return { row, col, char, index };
  });
}

/**
 * Checks if a word extends outside the grid boundaries.
 */
export function isWordOutOfBounds(
  word: CrosswordWord,
  gridSize: { rows: number; cols: number },
): boolean {
  const len = (word.word || "").length;
  if (word.startPos.row < 0 || word.startPos.col < 0) return true;
  if (word.direction === "ACROSS") {
    return (
      word.startPos.row >= gridSize.rows ||
      word.startPos.col + len > gridSize.cols
    );
  } else {
    return (
      word.startPos.row + len > gridSize.rows ||
      word.startPos.col >= gridSize.cols
    );
  }
}

/**
 * Builds a fast lookup map of all active cells in the crossword grid,
 * assigning clue numbers to starting cells and detecting letter collisions.
 */
export function buildCrosswordGridMap(
  gridSize: { rows: number; cols: number },
  words: CrosswordWord[],
): {
  cellMap: Map<string, CrosswordGridCell>;
  collisionCount: number;
  outOfBoundsCount: number;
} {
  const cellMap = new Map<string, CrosswordGridCell>();
  let collisionCount = 0;
  let outOfBoundsCount = 0;

  // First pass: mark cells and detect collisions
  words.forEach((word) => {
    if (isWordOutOfBounds(word, gridSize)) {
      outOfBoundsCount++;
    }

    const cells = getWordCells(word);
    cells.forEach(({ row, col, char }) => {
      // Skip out-of-bound cells from rendering outside bounds
      if (row < 0 || row >= gridSize.rows || col < 0 || col >= gridSize.cols) {
        return;
      }

      const key = coordKey(row, col);
      const existing = cellMap.get(key);

      if (existing) {
        // Collision detection if intersecting letters don't match
        if (existing.char !== char) {
          existing.hasCollision = true;
          existing.collisionDetails = `Tabrakan huruf di (${row + 1},${col + 1}): '${existing.char}' vs '${char}'`;
          collisionCount++;
        }
        if (!existing.wordIds.includes(word.id)) {
          existing.wordIds.push(word.id);
        }
        if (word.direction === "ACROSS") existing.acrossWordId = word.id;
        if (word.direction === "DOWN") existing.downWordId = word.id;
      } else {
        cellMap.set(key, {
          row,
          col,
          char,
          wordIds: [word.id],
          acrossWordId: word.direction === "ACROSS" ? word.id : undefined,
          downWordId: word.direction === "DOWN" ? word.id : undefined,
        });
      }
    });
  });

  // Second pass: set clue numbers at starting cells
  words.forEach((word) => {
    const key = coordKey(word.startPos.row, word.startPos.col);
    const cell = cellMap.get(key);
    if (cell && (cell.number === undefined || cell.number > word.number)) {
      cell.number = word.number;
    }
  });

  return { cellMap, collisionCount, outOfBoundsCount };
}

/**
 * Renumbers words sequentially based on standard crossword rules:
 * Starting cells are sorted reading-order (row then col).
 * Words sharing the exact same start cell share the same number.
 */
export function renumberCrosswordWords(
  words: CrosswordWord[],
): CrosswordWord[] {
  // Group by starting position
  const startPosMap = new Map<string, CrosswordWord[]>();
  words.forEach((w) => {
    const key = `${w.startPos.row}_${w.startPos.col}`;
    const group = startPosMap.get(key) || [];
    group.push(w);
    startPosMap.set(key, group);
  });

  // Sort unique start positions in reading order
  const sortedKeys = Array.from(startPosMap.keys()).sort((a, b) => {
    const [rA, cA] = a.split("_").map(Number);
    const [rB, cB] = b.split("_").map(Number);
    if (rA !== rB) return rA - rB;
    return cA - cB;
  });

  let currentNumber = 1;
  const renumbered: CrosswordWord[] = [];

  sortedKeys.forEach((key) => {
    const group = startPosMap.get(key)!;
    group.forEach((word) => {
      renumbered.push({
        ...word,
        number: currentNumber,
      });
    });
    currentNumber++;
  });

  // Preserve initial order of IDs
  return words.map((original) => {
    const found = renumbered.find((rw) => rw.id === original.id);
    return found || original;
  });
}

/**
 * Returns the next cell coordinate within the active word, or null if at end.
 */
export function getNextCellInWord(
  word: CrosswordWord,
  currentRow: number,
  currentCol: number,
): { row: number; col: number } | null {
  const cells = getWordCells(word);
  const currentIndex = cells.findIndex(
    (c) => c.row === currentRow && c.col === currentCol,
  );
  if (currentIndex >= 0 && currentIndex < cells.length - 1) {
    return {
      row: cells[currentIndex + 1].row,
      col: cells[currentIndex + 1].col,
    };
  }
  return null;
}

/**
 * Returns the previous cell coordinate within the active word, or null if at start.
 */
export function getPrevCellInWord(
  word: CrosswordWord,
  currentRow: number,
  currentCol: number,
): { row: number; col: number } | null {
  const cells = getWordCells(word);
  const currentIndex = cells.findIndex(
    (c) => c.row === currentRow && c.col === currentCol,
  );
  if (currentIndex > 0) {
    return {
      row: cells[currentIndex - 1].row,
      col: cells[currentIndex - 1].col,
    };
  }
  return null;
}

/**
 * Checks if all letters of a word are filled in the answer.
 */
export function isWordFilled(
  word: CrosswordWord,
  answer: CrosswordAnswer,
): boolean {
  const cells = getWordCells(word);
  return cells.every((c) => {
    const val = answer[coordKey(c.row, c.col)];
    return typeof val === "string" && val.trim().length > 0;
  });
}

/**
 * Reconstructs the student's entered word from the answer grid.
 */
export function getStudentWord(
  word: CrosswordWord,
  answer: CrosswordAnswer,
): string {
  const cells = getWordCells(word);
  return cells
    .map((c) => {
      const val =
        answer[coordKey(c.row, c.col)] || answer[`${c.row},${c.col}`] || "";
      return val.trim().toUpperCase();
    })
    .join("");
}

/**
 * Default mini crossword puzzle:
 * 6x6 grid with 5 interconnected Indonesian words
 */
export const defaultCrosswordContent: CrosswordContent = {
  gridSize: { rows: 6, cols: 6 },
  words: [
    {
      id: 1,
      number: 1,
      direction: "ACROSS",
      word: "BUMI",
      clue: "Planet ketiga dari Matahari tempat tinggal umat manusia",
      startPos: { row: 1, col: 1 },
    },
    {
      id: 2,
      number: 1,
      direction: "DOWN",
      word: "BULAN",
      clue: "Satelit alami Bumi yang tampak bersinar indah di malam hari",
      startPos: { row: 1, col: 1 },
    },
    {
      id: 3,
      number: 2,
      direction: "DOWN",
      word: "MAUT",
      clue: "Kematian atau batas akhir dari kehidupan fana",
      startPos: { row: 1, col: 3 },
    },
    {
      id: 4,
      number: 3,
      direction: "ACROSS",
      word: "LAUT",
      clue: "Hamparan air asin yang sangat luas di permukaan bumi",
      startPos: { row: 3, col: 1 },
    },
    {
      id: 5,
      number: 4,
      direction: "ACROSS",
      word: "NADA",
      clue: "Bunyi beraturan yang memiliki tinggi nada atau frekuensi tertentu dalam musik",
      startPos: { row: 5, col: 1 },
    },
  ],
  hint: "",
};
