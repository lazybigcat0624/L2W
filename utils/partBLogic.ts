import { GRID_SIZE } from '@/constants/game';

// L-block shapes for Part B
export const L_BLOCK_SHAPES = {
  RFB: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  LFB: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

// Rotate L-block
export function rotateLBlock(shape: number[][], rotation: number): number[][] {
  let rotated = shape.map(row => [...row]);
  
  for (let i = 0; i < (rotation / 90) % 4; i++) {
    const rows = rotated.length;
    const cols = rotated[0].length;
    const newShape: number[][] = [];
    
    for (let col = 0; col < cols; col++) {
      newShape[col] = [];
      for (let row = rows - 1; row >= 0; row--) {
        newShape[col][rows - 1 - row] = rotated[row][col];
      }
    }
    
    rotated = newShape;
  }
  
  return rotated;
}

// Check if L-block can be placed
export function canPlaceLBlock(
  grid: number[][],
  shape: number[][],
  row: number,
  col: number
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const gridRow = row + r;
        const gridCol = col + c;
        
        if (gridRow < 0 || gridRow >= GRID_SIZE || gridCol < 0 || gridCol >= GRID_SIZE) {
          return false;
        }
        
        // Can't place on pre-filled cells (3) or existing blocks
        if (grid[gridRow][gridCol] !== 0) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// Place L-block on grid
export function placeLBlock(
  grid: number[][],
  shape: number[][],
  row: number,
  col: number,
  type: 'RFB' | 'LFB'
): number[][] {
  const newGrid = grid.map(r => [...r]);
  const value = type === 'RFB' ? 1 : 2;
  
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const gridRow = row + r;
        const gridCol = col + c;
        
        if (gridRow >= 0 && gridRow < GRID_SIZE && gridCol >= 0 && gridCol < GRID_SIZE) {
          newGrid[gridRow][gridCol] = value;
        }
      }
    }
  }
  
  return newGrid;
}

// Detect W-blocks in Part B grid
// W pattern: RFB and LFB forming a W shape diagonally
// A W-block requires at least 4 cells with both RFB (1) and LFB (2) types
export function detectWBlocks(grid: number[][]): number[][][] {
  const wBlocks: number[][][] = [];
  const usedCells = new Set<string>();
  
  // Helper to create cell key
  const cellKey = (r: number, c: number) => `${r},${c}`;
  
  // Check diagonal patterns (top-left to bottom-right)
  for (let startRow = 0; startRow < GRID_SIZE - 3; startRow++) {
    for (let startCol = 0; startCol < GRID_SIZE - 3; startCol++) {
      // Check for W pattern: 4 cells forming a diagonal
      const cells = [
        [startRow, startCol],
        [startRow + 1, startCol + 1],
        [startRow + 2, startCol + 2],
        [startRow + 3, startCol + 3],
      ];
      
      // Check if all cells are already used
      const allUsed = cells.every(([r, c]) => usedCells.has(cellKey(r, c)));
      if (allUsed) continue;
      
      // Verify pattern: must have both 1 (RFB) and 2 (LFB), and no pre-filled cells (3)
      const values = cells.map(([r, c]) => grid[r]?.[c] || 0);
      const hasRFB = values.some(v => v === 1);
      const hasLFB = values.some(v => v === 2);
      const hasInvalid = values.some(v => v === 3 || v === 0); // Pre-filled or empty
      
      if (hasRFB && hasLFB && !hasInvalid) {
        // Mark cells as used and add to W-blocks
        cells.forEach(([r, c]) => usedCells.add(cellKey(r, c)));
        wBlocks.push(cells);
      }
    }
  }
  
  // Also check reverse diagonal (top-right to bottom-left)
  for (let startRow = 0; startRow < GRID_SIZE - 3; startRow++) {
    for (let startCol = 3; startCol < GRID_SIZE; startCol++) {
      const cells = [
        [startRow, startCol],
        [startRow + 1, startCol - 1],
        [startRow + 2, startCol - 2],
        [startRow + 3, startCol - 3],
      ];
      
      // Check if all cells are already used
      const allUsed = cells.every(([r, c]) => usedCells.has(cellKey(r, c)));
      if (allUsed) continue;
      
      const values = cells.map(([r, c]) => grid[r]?.[c] || 0);
      const hasRFB = values.some(v => v === 1);
      const hasLFB = values.some(v => v === 2);
      const hasInvalid = values.some(v => v === 3 || v === 0);
      
      if (hasRFB && hasLFB && !hasInvalid) {
        cells.forEach(([r, c]) => usedCells.add(cellKey(r, c)));
        wBlocks.push(cells);
      }
    }
  }
  
  // Check horizontal W patterns (for variety)
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 3; col++) {
      const cells = [
        [row, col],
        [row, col + 1],
        [row, col + 2],
        [row, col + 3],
      ];
      
      const allUsed = cells.every(([r, c]) => usedCells.has(cellKey(r, c)));
      if (allUsed) continue;
      
      const values = cells.map(([r, c]) => grid[r]?.[c] || 0);
      const hasRFB = values.some(v => v === 1);
      const hasLFB = values.some(v => v === 2);
      const hasInvalid = values.some(v => v === 3 || v === 0);
      
      if (hasRFB && hasLFB && !hasInvalid) {
        cells.forEach(([r, c]) => usedCells.add(cellKey(r, c)));
        wBlocks.push(cells);
      }
    }
  }
  
  return wBlocks;
}

// Remove W-blocks from grid
export function removeWBlocks(grid: number[][], wBlocks: number[][]): number[][] {
  const newGrid = grid.map(row => [...row]);
  
  for (let [row, col] of wBlocks) {
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      newGrid[row][col] = 0;
    }
  }
  
  return newGrid;
}

// Check if more W-blocks can be formed
export function canFormMoreWBlocks(grid: number[][], rfbCount: number, lfbCount: number): boolean {
  if (rfbCount === 0 || lfbCount === 0) {
    return false;
  }
  
  // Check if there are enough empty cells to potentially form a W-block
  // A W-block needs at least 4 cells with both RFB and LFB
  let emptyCells = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        emptyCells++;
      }
    }
  }
  
  // Need at least 4 empty cells in a pattern to form a W
  // Also need at least one of each type
  return emptyCells >= 4 && rfbCount > 0 && lfbCount > 0;
}

