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
export type PieceShape = 'I' | 'O' | 'T' | 'S' | 'Z' | 'L' | 'J';

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
export const L_PATTERNS = {
  // Right-facing L (⅃) - 5 cells
  // Pattern: 4 cells vertical + 1 cell horizontal base on right
  RFB: [
    // Standard (vertical long leg with horizontal base on right, pointing down-right)
    // X
    // X
    // X
    // X X
    [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
    // Rotated 90° clockwise (horizontal leg with base on bottom, pointing right-down)
    // X X X X
    //       X
    [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]],
    // Rotated 180° clockwise (vertical leg with base on left at top, pointing up-right)
    // X X
    //   X
    //   X
    //   X
    [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1]],
    // Rotated 270° clockwise (horizontal leg with base on top, pointing left-up)
    //       X
    // X X X X
    [[0, 3], [1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  // Left-facing L (L) - 5 cells
  // Pattern: 4 cells vertical + 1 cell horizontal base on left
  LFB: [
    // Standard (vertical long leg with horizontal base on left, pointing down-left)
    //   X
    //   X
    //   X
    // X X
    [[0, 1], [1, 1], [2, 1], [3, 1], [3, 0]],
    // Rotated 90° clockwise (horizontal leg with base on bottom, pointing left-down)
    // X
    // X X X X
    [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3]],
    // Rotated 180° clockwise (vertical leg with base on right at top, pointing up-left)
    //     X
    //     X
    //     X
    //   X X
    [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
    // Rotated 270° clockwise (horizontal leg with base on top, pointing right-up)
    // X X X X
    // X
    [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0]],
  ],
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
};

