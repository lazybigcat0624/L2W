// Game Constants
export const GRID_SIZE = 14;
export const CELL_SIZE = 20;

// Colors from PRD
export const GAME_COLORS = {
  background: '#000000',
  text: '#FFFFFF',
  title: '#00FFFF', // Light Blue/Cyan
  subtitle: '#FF00FF', // Purple/Magenta
  score: '#00FFFF', // Cyan
  lCounter: '#00FFFF', // Light Blue
  jCounter: '#FFA500', // Orange
  wCounter: '#FFFF00', // Yellow
  startButton: '#00FF00', // Bright Green
  fail: '#FF0000', // Red
  failForward: '#00FF00', // Green
  doIt: '#00FF00', // Bright Green
  gridLine: '#FFFFFF',
  gridLineFaded: 'rgba(255, 255, 255, 0.2)',
};

// Piece colors (7 distinct colors)
export const PIECE_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
];

// Tetris-like piece shapes
export type PieceShape = 'I' | 'O' | 'T' | 'S' | 'Z' | 'L' | 'J' | 'C' | 'P';

export interface Piece {
  shape: PieceShape;
  color: string;
  cells: number[][]; // Relative positions
  x: number;
  y: number;
}

// Scoring
export const SCORES = {
  RFB: 100, // Right-Facing Block
  LFB: 150, // Left-Facing Block
  W_BLOCK: 200, // W-Block
};

// Game states
export type GamePhase = 'idle' | 'partA' | 'transitionAB' | 'partB' | 'transitionBA' | 'complete';

export interface GameState {
  phase: GamePhase;
  score: number;
  level: number;
  rfbCount: number; // Right-Facing Blocks
  lfbCount: number; // Left-Facing Blocks
  wCount: number; // W-Blocks formed
  grid: number[][]; // Part A grid (0 = empty, 1-7 = piece colors)
  partBGrid: number[][]; // Part B grid
  currentPiece: Piece | null;
  gameStarted: boolean;
}

// L-Block patterns (for detection) - 5-cell L-shapes
type LBlockType = 'RFB' | 'LFB';
const L_BLOCK_SIZES = [3] as const;

const rotatePattern = (cells: number[][], size: number): number[][] =>
  cells.map(([row, col]) => [col, size - 1 - row]);

const normalizePattern = (cells: number[][]): number[][] => {
  const minRow = Math.min(...cells.map(([row]) => row));
  const minCol = Math.min(...cells.map(([, col]) => col));
  const normalized = cells.map(([row, col]) => [row - minRow, col - minCol]);
  normalized.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  return normalized;
};

const patternKey = (cells: number[][]): string =>
  cells.map(([row, col]) => `${row}:${col}`).join('|');

const createBasePattern = (size: number, type: LBlockType): number[][] => {
  const cells: number[][] = [];
  const seen = new Set<string>();
  const addCell = (row: number, col: number) => {
    const key = `${row},${col}`;
    if (!seen.has(key)) {
      seen.add(key);
      cells.push([row, col]);
    }
  };

  if (type === 'RFB') {
    for (let row = 0; row < size; row++) {
      addCell(row, 0);
    } 
    for (let col = 1; col < size; col++) {
      addCell(size - 1, col);
    }
  } else {
    for (let row = 0; row < size; row++) {
      addCell(row, size - 1);
    }
    for (let col = 0; col < size - 1; col++) {
      addCell(size - 1, col);
    }
  }

  return normalizePattern(cells);
};

const generateLPatterns = (type: LBlockType): number[][][] => {
  const patterns: number[][][] = [];

  L_BLOCK_SIZES.forEach((size) => {
    let current = createBasePattern(size, type);
    const seen = new Set<string>();
    const normalized = normalizePattern(current);
    const key = patternKey(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      patterns.push(normalized);
    }
  });

  return patterns;
};

export const L_PATTERNS = {
  RFB: generateLPatterns('RFB'),
  LFB: generateLPatterns('LFB'),
};

// Standard Tetris pieces
export const PIECE_SHAPES: Record<PieceShape, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  L: [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  J: [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  C: [
    [1, 1],
    [1, 0],
    [1, 1],
  ],
  P: [
    [1, 1],
    [1, 1],
    [1, 0],
  ],
};

