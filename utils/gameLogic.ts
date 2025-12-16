import { GRID_SIZE, Piece, PIECE_COLORS, PIECE_SHAPES, PieceShape } from '@/constants/game';

// Generate random piece
// lastColor: optional parameter to prevent consecutive same colors
// level: current game level (level 1 = center drop, level 2+ = random drop)
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
  
  // Calculate X position: center for level 1, random for level 2+
  const pieceWidth = PIECE_SHAPES[shape][0].length;
  let x: number;
  if (level === 1) {
    // Center the piece: (GRID_SIZE - pieceWidth) / 2, rounded down
    x = Math.floor((GRID_SIZE - pieceWidth) / 2);
  } else {
    // Random position for level 2+
    x = Math.floor(Math.random() * (GRID_SIZE - pieceWidth + 1));
  }
  
  return {
    shape,
    color: colorsToUse[colorIndex],
    cells: PIECE_SHAPES[shape],
    x,
    y: 0,
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
        
        // Check bounds
        if (gridX < 0 || gridX >= GRID_SIZE || gridY >= GRID_SIZE) {
          return false;
        }
        
        // Check collision with existing blocks
        if (gridY >= 0 && grid[gridY] && grid[gridY][gridX] !== 0) {
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

// Detect L-blocks in grid
export function detectLBlocks(grid: number[][], patterns: number[][][]): number[][][] {
  const found: number[][][] = [];
  
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

// Check if grid is full to top
export function isGridFullToTop(grid: number[][]): boolean {
  return grid[0].some(cell => cell !== 0);
}

// Initialize empty grid
export function createEmptyGrid(): number[][] {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
}

