import { GRID_SIZE, Piece, PIECE_COLORS, PIECE_SHAPES, PieceShape } from '@/constants/game';

// Rotation types based on level
export type RotationType = 0 | 90 | 180 | 270;

// Simple seeded random function for consistent randomness based on level
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get rotation type from level
// Level 1-2: 0° (top to bottom)
// Level 3-4: 90° (right to left)
// Level 5-6: 270° (left to right)
// Level 7-8: 180° (down to top)
// Level 9+: random of 1-8 (deterministic based on level number)
export function getRotationFromLevel(level: number): RotationType {
  // Level 9+ uses random rotation from levels 1-8
  // Uses seeded random so same level always gets same rotation
  if (level >= 9) {
    const randomValue = seededRandom(level);
    const randomLevel = Math.floor(randomValue * 8) + 1; // Random between 1-8
    return getRotationFromLevel(randomLevel);
  }
  
  if (level <= 2) return 0;
  if (level <= 4) return 90;
  if (level <= 6) return 270;
  return 180;
}

// Check if level uses center spawn (odd levels) or random spawn (even levels)
export function isCenterSpawn(level: number): boolean {
  return level % 2 === 1;
}

// Rotate coordinates based on rotation type
// This transforms logical coordinates to visual coordinates
export function rotateCoordinates(x: number, y: number, rotation: RotationType): { x: number; y: number } {
  switch (rotation) {
    case 0:
      return { x, y };
    case 90:
      // Right to left: (x, y) -> (GRID_SIZE - 1 - y, x)
      return { x: GRID_SIZE - 1 - y, y: x };
    case 180:
      // Bottom to top: (x, y) -> (GRID_SIZE - 1 - x, GRID_SIZE - 1 - y)
      return { x: GRID_SIZE - 1 - x, y: GRID_SIZE - 1 - y };
    case 270:
      // Left to right: (x, y) -> (y, GRID_SIZE - 1 - x)
      return { x: y, y: GRID_SIZE - 1 - x };
    default:
      return { x, y };
  }
}

// Reverse rotate coordinates (visual to logical)
export function reverseRotateCoordinates(x: number, y: number, rotation: RotationType): { x: number; y: number } {
  switch (rotation) {
    case 0:
      return { x, y };
    case 90:
      // Reverse: (x, y) -> (y, GRID_SIZE - 1 - x)
      return { x: y, y: GRID_SIZE - 1 - x };
    case 180:
      // Reverse: (x, y) -> (GRID_SIZE - 1 - x, GRID_SIZE - 1 - y)
      return { x: GRID_SIZE - 1 - x, y: GRID_SIZE - 1 - y };
    case 270:
      // Reverse: (x, y) -> (GRID_SIZE - 1 - y, x)
      return { x: GRID_SIZE - 1 - y, y: x };
    default:
      return { x, y };
  }
}

// Get spawn position based on level and rotation
// Pieces spawn at the edge in the direction they will move
function getSpawnPosition(level: number, pieceWidth: number, pieceHeight: number): { x: number; y: number } {
  const rotation = getRotationFromLevel(level);
  const isCenter = isCenterSpawn(level);
  
  switch (rotation) {
    case 0: // Top to bottom - spawn at top edge
      return {
        x: isCenter ? Math.floor((GRID_SIZE - pieceWidth) / 2) : Math.floor(Math.random() * (GRID_SIZE - pieceWidth + 1)),
        y: 0, // Top edge - piece's top row (index 0) is at y=0
      };
    case 90: // Right to left - spawn at right edge
      // Piece's rightmost column should be at x = GRID_SIZE - 1
      // If piece width is W, spawn at x = GRID_SIZE - W
      return {
        x: GRID_SIZE - pieceWidth, // Right edge - piece's rightmost cell is at x=GRID_SIZE-1
        y: isCenter ? Math.floor((GRID_SIZE - pieceHeight) / 2) : Math.floor(Math.random() * (GRID_SIZE - pieceHeight + 1)),
      };
    case 180: // Bottom to top - spawn at bottom edge
      // Piece's bottommost row should be at y = GRID_SIZE - 1
      // If piece height is H, spawn at y = GRID_SIZE - H
      return {
        x: isCenter ? Math.floor((GRID_SIZE - pieceWidth) / 2) : Math.floor(Math.random() * (GRID_SIZE - pieceWidth + 1)),
        y: GRID_SIZE - pieceHeight, // Bottom edge - piece's bottom row is at y=GRID_SIZE-1
      };
    case 270: // Left to right - spawn at left edge
      return {
        x: 0, // Left edge - piece's leftmost cell (index 0) is at x=0
        y: isCenter ? Math.floor((GRID_SIZE - pieceHeight) / 2) : Math.floor(Math.random() * (GRID_SIZE - pieceHeight + 1)),
      };
    default:
      return { x: 0, y: 0 };
  }
}

// Get movement direction based on rotation
export function getFallDirection(rotation: RotationType): { dx: number; dy: number } {
  switch (rotation) {
    case 0: // Top to bottom
      return { dx: 0, dy: 1 };
    case 90: // Right to left
      return { dx: -1, dy: 0 };
    case 180: // Bottom to top
      return { dx: 0, dy: -1 };
    case 270: // Left to right
      return { dx: 1, dy: 0 };
    default:
      return { dx: 0, dy: 1 };
  }
}

// Get horizontal movement direction based on rotation
// For all rotations: left/right stays left/right (normal horizontal movement)
export function getHorizontalMovement(rotation: RotationType, direction: 'left' | 'right'): { dx: number; dy: number } {
  switch (rotation) {
    case 0: // Top to bottom - left/right stays left/right
      return { dx: direction === 'right' ? 1 : -1, dy: 0 };
    case 90: // Right to left - left/right stays left/right (horizontal)
      return { dx: direction === 'right' ? 1 : -1, dy: 0 };
    case 180: // Bottom to top - left/right stays left/right (normal)
      return { dx: direction === 'right' ? 1 : -1, dy: 0 };
    case 270: // Left to right - left/right stays left/right (horizontal)
      return { dx: direction === 'right' ? 1 : -1, dy: 0 };
    default:
      return { dx: direction === 'right' ? 1 : -1, dy: 0 };
  }
}

// Get vertical movement direction based on rotation
// For 90° and 270°: up/down moves vertically
// For 0° and 180°: up/down moves vertically (normal)
export function getVerticalMovement(rotation: RotationType, direction: 'up' | 'down'): { dx: number; dy: number } {
  switch (rotation) {
    case 0: // Top to bottom - up/down moves vertically
      return { dx: 0, dy: direction === 'down' ? 1 : -1 };
    case 90: // Right to left - up/down moves vertically
      return { dx: 0, dy: direction === 'down' ? 1 : -1 };
    case 180: // Bottom to top - up/down is reversed
      return { dx: 0, dy: direction === 'down' ? -1 : 1 };
    case 270: // Left to right - up/down moves vertically
      return { dx: 0, dy: direction === 'down' ? 1 : -1 };
    default:
      return { dx: 0, dy: direction === 'down' ? 1 : -1 };
  }
}

// Generate random piece
// lastColor: optional parameter to prevent consecutive same colors
// level: current game level (determines rotation and spawn position)
export function generateRandomPiece(lastColor?: string, level: number = 1): Piece {
  const shapes: PieceShape[] = [
    'I1', 'I2', 'I3', 'I4', 'I5', // I variants
    'O1', 'O2', 'O3', // O variants
    'T', 'C', 'P', 'F', // Other pieces
  ];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  
  // Filter out the last color to prevent consecutive same colors
  const availableColors = lastColor
    ? PIECE_COLORS.filter(color => color !== lastColor)
    : PIECE_COLORS;
  
  // If all colors were filtered out (shouldn't happen), use all colors
  const colorsToUse = availableColors.length > 0 ? availableColors : PIECE_COLORS;
  const colorIndex = Math.floor(Math.random() * colorsToUse.length);
  
  // Get piece dimensions
  const pieceHeight = PIECE_SHAPES[shape].length;
  const pieceWidth = PIECE_SHAPES[shape][0].length;
  
  // Get spawn position based on level
  const spawnPos = getSpawnPosition(level, pieceWidth, pieceHeight);
  
  return {
    shape,
    color: colorsToUse[colorIndex],
    cells: PIECE_SHAPES[shape],
    x: spawnPos.x,
    y: spawnPos.y,
  };
}

// Check if piece can be placed at position
export function canPlacePiece(grid: number[][], piece: Piece, dx: number = 0, dy: number = 0): boolean {
  const newX = piece.x + dx;
  const newY = piece.y + dy;
  
  for (let row = 0; row < piece.cells.length; row++) {
    for (let col = 0; col < piece.cells[row].length; col++) {
      if (piece.cells[row][col]) {
        const gridX = newX + col;
        const gridY = newY + row;
        
        // Check bounds (including negative y for upward movement)
        if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
          return false;
        }
        
        // Check collision with existing blocks
        if (grid[gridY] && grid[gridY][gridX] !== 0) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// Place piece on grid
export function placePiece(grid: number[][], piece: Piece): number[][] {
  const newGrid = grid.map(row => [...row]);
  const colorIndex = PIECE_COLORS.indexOf(piece.color) + 1;
  
  for (let row = 0; row < piece.cells.length; row++) {
    for (let col = 0; col < piece.cells[row].length; col++) {
      if (piece.cells[row][col]) {
        const gridX = piece.x + col;
        const gridY = piece.y + row;
        
        if (gridY >= 0 && gridY < GRID_SIZE && gridX >= 0 && gridX < GRID_SIZE) {
          newGrid[gridY][gridX] = colorIndex;
        }
      }
    }
  }
  
  return newGrid;
}

// Rotate piece 90 degrees clockwise
export function rotatePiece(piece: Piece): Piece {
  const rows = piece.cells.length;
  const cols = piece.cells[0].length;
  const rotated: number[][] = [];
  
  for (let col = 0; col < cols; col++) {
    rotated[col] = [];
    for (let row = rows - 1; row >= 0; row--) {
      rotated[col][rows - 1 - row] = piece.cells[row][col];
    }
  }
  
  return {
    ...piece,
    cells: rotated,
  };
}

// Rotate a pattern's relative offsets based on rotation type
// Patterns are [dy, dx] where dy is row offset and dx is column offset
function rotatePatternOffsets(pattern: number[][], rotation: RotationType): number[][] {
  switch (rotation) {
    case 0:
      return pattern;
    case 90:
      // 90° clockwise: (dy, dx) -> (dx, -dy) in relative terms
      // But we need to normalize, so we find min and adjust
      const rotated90 = pattern.map(([dy, dx]) => [dx, -dy]);
      const minDy90 = Math.min(...rotated90.map(([dy]) => dy));
      const minDx90 = Math.min(...rotated90.map(([, dx]) => dx));
      return rotated90.map(([dy, dx]) => [dy - minDy90, dx - minDx90]);
    case 180:
      // 180°: (dy, dx) -> (-dy, -dx)
      const rotated180 = pattern.map(([dy, dx]) => [-dy, -dx]);
      const minDy180 = Math.min(...rotated180.map(([dy]) => dy));
      const minDx180 = Math.min(...rotated180.map(([, dx]) => dx));
      return rotated180.map(([dy, dx]) => [dy - minDy180, dx - minDx180]);
    case 270:
      // 270° clockwise (or -90°): (dy, dx) -> (-dx, dy)
      const rotated270 = pattern.map(([dy, dx]) => [-dx, dy]);
      const minDy270 = Math.min(...rotated270.map(([dy]) => dy));
      const minDx270 = Math.min(...rotated270.map(([, dx]) => dx));
      return rotated270.map(([dy, dx]) => [dy - minDy270, dx - minDx270]);
    default:
      return pattern;
  }
}

// Rotate all patterns in a pattern set
function rotatePatternSet(patterns: number[][][], rotation: RotationType): number[][][] {
  if (rotation === 0) return patterns;
  return patterns.map(pattern => rotatePatternOffsets(pattern, rotation));
}

// Detect L-blocks in grid
// L-block patterns are always the same regardless of level/rotation
export function detectLBlocks(grid: number[][], patterns: number[][][]): number[][][] {
  const found: number[][][] = [];
  
  // Use original patterns (no rotation)
  for (let pattern of patterns) {
    // Find the maximum offset to determine bounds
    const maxDy = Math.max(...pattern.map(([dy]) => dy));
    const maxDx = Math.max(...pattern.map(([, dx]) => dx));
    // Check bounds: pattern can fit within grid
    for (let y = 0; y <= GRID_SIZE - maxDy - 1; y++) {
      for (let x = 0; x <= GRID_SIZE - maxDx - 1; x++) {
        let match = true;
        const cells: number[][] = [];
        
        for (let [dy, dx] of pattern) {
          const gy = y + dy;
          const gx = x + dx;
          if (gy >= GRID_SIZE || gx >= GRID_SIZE || gy < 0 || gx < 0 || grid[gy][gx] === 0) {
            match = false;
            break;
          }
          
          cells.push([gy, gx]);
        }
        
        if (match) {
          found.push(cells)
        }
      }
    }
  }
  
  return found;
}

// Remove cells from grid
export function removeCells(grid: number[][], cells: number[][]): number[][] {
  const newGrid = grid.map(row => [...row]);
  
  for (let [y, x] of cells) {
    if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
      newGrid[y][x] = 0;
    }
  }
  
  return newGrid;
}

// Apply gravity to grid - makes blocks fall down after removal
export function applyGravity(grid: number[][]): number[][] {
  const newGrid = grid.map(row => [...row]);
  
  // Process each column separately
  for (let col = 0; col < GRID_SIZE; col++) {
    // Collect all non-zero cells in this column from bottom to top
    const columnCells: number[] = [];
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      if (newGrid[row][col] !== 0) {
        columnCells.push(newGrid[row][col]);
        newGrid[row][col] = 0;
      }
    }
    
    // Place cells back from bottom up
    for (let i = 0; i < columnCells.length; i++) {
      newGrid[GRID_SIZE - 1 - i][col] = columnCells[i];
    }
  }
  
  return newGrid;
}

// Check if grid is full at the spawn edge based on rotation
export function isGridFullToTop(grid: number[][], rotation: RotationType = 0): boolean {
  switch (rotation) {
    case 0: // Top to bottom - check top row
      return grid[0].some(cell => cell !== 0);
    case 90: // Right to left - check right column
      return grid.some(row => row[GRID_SIZE - 1] !== 0);
    case 180: // Bottom to top - check bottom row
      return grid[GRID_SIZE - 1].some(cell => cell !== 0);
    case 270: // Left to right - check left column
      return grid.some(row => row[0] !== 0);
    default:
      return grid[0].some(cell => cell !== 0);
  }
}

// Initialize empty grid
export function createEmptyGrid(): number[][] {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
}

