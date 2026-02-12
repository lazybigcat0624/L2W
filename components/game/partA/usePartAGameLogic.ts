import { GamePhase, GRID_SIZE, L_PATTERNS, Piece, SCORES } from '@/constants/game';
import {
  canPlacePiece,
  createEmptyGrid,
  detectLBlocks,
  generateRandomPiece,
  getFallDirection,
  getHorizontalMovement,
  getRotationFromLevel,
  getVerticalMovement,
  isGridFullToTop,
  placePiece,
  removeCells,
  rotatePiece,
} from '@/utils/gameLogic';
import { useCallback, useEffect, useRef, useState } from 'react';

// Different falling intervals for different level ranges
const FALL_INTERVAL_LEVEL_1_2 = 1000; // 1 second for levels 1-2
const FALL_INTERVAL_LEVEL_3_4 = 1000; // 1 second for levels 3-4 (can be adjusted)
const FALL_INTERVAL_DEFAULT = 1000; // 1 second for other levels

// Get falling interval based on level
function getFallInterval(level: number): number {
  if (level <= 2) return FALL_INTERVAL_LEVEL_1_2;
  if (level <= 4) return FALL_INTERVAL_LEVEL_3_4;
  return FALL_INTERVAL_DEFAULT;
}

// Delay before L-block removal for better UX (in milliseconds)
const L_BLOCK_REMOVAL_DELAY = 400;

interface UsePartAGameLogicProps {
  phase: GamePhase;
  level: number;
  onScoreChange: (delta: number) => void;
  onRfbCountChange: (delta: number) => void;
  onLfbCountChange: (delta: number) => void;
  onPhaseChange: (phase: GamePhase) => void;
}

/**
 * Hook that manages Part A game logic:
 * - Piece falling
 * - L-block detection and removal
 * - Game state transitions
 */
export function usePartAGameLogic({
  phase,
  level,
  onScoreChange,
  onRfbCountChange,
  onLfbCountChange,
  onPhaseChange,
}: UsePartAGameLogicProps) {
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const fallIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gridRef = useRef(grid);
  const currentPieceRef = useRef<Piece | null>(currentPiece);
  const lastColorRef = useRef<string | undefined>(undefined);
  const levelRef = useRef(level);

  // Keep refs synchronized with state
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  /**
   * Check if any L-blocks exist in the grid (without removing them)
   */
  const hasLBlocks = useCallback((gridState: number[][]): boolean => {
    const lfbBlocks = detectLBlocks(gridState, L_PATTERNS.LFB);
    const rfbBlocks = detectLBlocks(gridState, L_PATTERNS.RFB);
    return lfbBlocks.length > 0 || rfbBlocks.length > 0;
  }, []);

  /**
   * Processes L-block detection and removal
   */
  const processLBlockRemoval = useCallback(
    (gridState: number[][]): { grid: number[][]; rfbCount: number; lfbCount: number; score: number } => {
      let updatedGrid = gridState;
      let totalRFBs = 0;
      let totalLFBs = 0;
      let totalScore = 0;
      let hasChanges = true;

      // Get current rotation based on level
      const currentLevel = levelRef.current;
      const rotation = getRotationFromLevel(currentLevel);

      while (hasChanges) {
        hasChanges = false;

        // Check for LFB blocks first (higher priority/scoring)
        // L-block patterns are always the same regardless of level
        const lfbBlocks = detectLBlocks(updatedGrid, L_PATTERNS.LFB);
        if (lfbBlocks.length > 0) {
          updatedGrid = removeCells(updatedGrid, lfbBlocks[0]);
          totalLFBs += 1;
          totalScore += SCORES.LFB;
          hasChanges = true;
          continue;
        }

        // Check for RFB blocks
        // L-block patterns are always the same regardless of level
        const rfbBlocks = detectLBlocks(updatedGrid, L_PATTERNS.RFB);
        if (rfbBlocks.length > 0) {
          updatedGrid = removeCells(updatedGrid, rfbBlocks[0]);
          totalRFBs += 1;
          totalScore += SCORES.RFB;
          hasChanges = true;
          continue;
        }
      }

      return { grid: updatedGrid, rfbCount: totalRFBs, lfbCount: totalLFBs, score: totalScore };
    },
    []
  );

  /**
   * Handles piece falling at regular intervals
   * Automatic falling works for all levels
   */
  useEffect(() => {
    if (phase !== 'partA' || !gameStarted) {
      if (fallIntervalRef.current) {
        clearInterval(fallIntervalRef.current);
        fallIntervalRef.current = null;
      }
      return;
    }

    // Get falling interval based on current level
    const currentLevel = levelRef.current;
    const fallInterval = getFallInterval(currentLevel);
    const rotation = getRotationFromLevel(currentLevel);

    fallIntervalRef.current = setInterval(() => {
      setCurrentPiece((prev) => {
        const activePiece = prev ?? currentPieceRef.current;
        if (!activePiece) return null;
        const activeGrid = gridRef.current;

        // Get fall direction based on rotation
        const fallDir = getFallDirection(rotation);

        // Try to move piece in fall direction
        const testPiece = { 
          ...activePiece, 
          x: activePiece.x + fallDir.dx, 
          y: activePiece.y + fallDir.dy 
        };
        if (canPlacePiece(activeGrid, testPiece)) {
          return testPiece;
        }

        // Piece can't fall further - place it on the grid
        const updatedGrid = placePiece(activeGrid, activePiece);
        setGrid(updatedGrid);

        // Immediately clear currentPiece to prevent double rendering
        setCurrentPiece(null);

        // Update last color to the piece that was just placed
        lastColorRef.current = activePiece.color;

        // Check if L-blocks are formed - only delay if they exist
        const hasBlocks = hasLBlocks(updatedGrid);
        const delay = hasBlocks ? L_BLOCK_REMOVAL_DELAY : 0;

        setTimeout(() => {
          // Process L-block detection and removal
          const { grid: finalGrid, rfbCount: newRFBs, lfbCount: newLFBs, score: newScore } =
            processLBlockRemoval(updatedGrid);

          setGrid(finalGrid);

          // Defer callback updates to avoid updating parent during render
          setTimeout(() => {
            if (newRFBs > 0) {
              onRfbCountChange(newRFBs);
            }
            if (newLFBs > 0) {
              onLfbCountChange(newLFBs);
            }
            if (newScore > 0) {
              onScoreChange(newScore);
            }

            // Check if game is over (grid full at spawn edge)
            if (isGridFullToTop(finalGrid, rotation)) {
              onPhaseChange('transitionAB');
              setGameStarted(false);
            }
          }, 0);

          // Check if game is over - stop piece generation
          if (isGridFullToTop(finalGrid, rotation)) {
            setCurrentPiece(null);
            return;
          }

          // Generate next piece (avoiding same color as the piece that was just placed)
          const next = generateRandomPiece(activePiece.color, currentLevel);
          setNextPiece(next);
          setCurrentPiece(next);
        }, delay);

        // Return null to stop current piece from falling while waiting for L-block removal
        return null;
      });
    }, fallInterval);

    return () => {
      if (fallIntervalRef.current) {
        clearInterval(fallIntervalRef.current);
      }
    };
  }, [
    phase,
    gameStarted,
    level,
    hasLBlocks,
    processLBlockRemoval,
    onPhaseChange,
    onScoreChange,
    onRfbCountChange,
    onLfbCountChange,
  ]);

  /**
   * Initialize Part A game
   */
  const startGame = useCallback(() => {
    setGrid(createEmptyGrid());
    const currentLevel = levelRef.current;
    const firstPiece = generateRandomPiece(undefined, currentLevel);
    lastColorRef.current = firstPiece.color;
    const secondPiece = generateRandomPiece(firstPiece.color, currentLevel);
    lastColorRef.current = secondPiece.color;
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setGameStarted(true);
  }, []);

  /**
   * Move piece horizontally
   */
  const movePiece = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentPiece) return;
      const rotation = getRotationFromLevel(level);
      const moveDir = getHorizontalMovement(rotation, direction);
      const testPiece = { 
        ...currentPiece, 
        x: currentPiece.x + moveDir.dx, 
        y: currentPiece.y + moveDir.dy 
      };
      if (canPlacePiece(grid, testPiece)) {
        setCurrentPiece(testPiece);
      }
    },
    [currentPiece, grid, level]
  );

  /**
   * Move piece vertically (for levels 3-4, 5-6)
   */
  const movePieceVertical = useCallback(
    (direction: 'up' | 'down') => {
      if (!currentPiece) return;
      const rotation = getRotationFromLevel(level);
      const moveDir = getVerticalMovement(rotation, direction);
      const testPiece = { 
        ...currentPiece, 
        x: currentPiece.x + moveDir.dx, 
        y: currentPiece.y + moveDir.dy 
      };
      if (canPlacePiece(grid, testPiece)) {
        setCurrentPiece(testPiece);
      }
    },
    [currentPiece, grid, level]
  );

  /**
   * Move piece down one step (for levels 1-2 manual movement)
   * If piece can't move further, places it and processes L-blocks
   */
  const movePieceDown = useCallback(() => {
    if (!currentPiece) return;
    const rotation = getRotationFromLevel(level);
    const fallDir = getFallDirection(rotation);
    const testPiece = { 
      ...currentPiece, 
      x: currentPiece.x + fallDir.dx, 
      y: currentPiece.y + fallDir.dy 
    };
    
    if (canPlacePiece(grid, testPiece)) {
      // Can move - just update position
      setCurrentPiece(testPiece);
    } else {
      // Can't move - place piece on grid
      const updatedGrid = placePiece(grid, currentPiece);
      setGrid(updatedGrid);

      // Immediately clear currentPiece to prevent double rendering
      setCurrentPiece(null);

      // Update last color
      lastColorRef.current = currentPiece.color;

      // Check if L-blocks are formed - only delay if they exist
      const hasBlocks = hasLBlocks(updatedGrid);
      const delay = hasBlocks ? L_BLOCK_REMOVAL_DELAY : 0;

      setTimeout(() => {
        // Process L-block detection and removal
        const { grid: finalGrid, rfbCount: newRFBs, lfbCount: newLFBs, score: newScore } =
          processLBlockRemoval(updatedGrid);

        setGrid(finalGrid);

        // Defer callback updates
        setTimeout(() => {
          if (newRFBs > 0) {
            onRfbCountChange(newRFBs);
          }
          if (newLFBs > 0) {
            onLfbCountChange(newLFBs);
          }
          if (newScore > 0) {
            onScoreChange(newScore);
          }

          // Check if game is over
          if (isGridFullToTop(finalGrid, rotation)) {
            onPhaseChange('transitionAB');
            setGameStarted(false);
          }
        }, 0);

        // Check if game is over - stop piece generation
        if (isGridFullToTop(finalGrid, rotation)) {
          setCurrentPiece(null);
          return;
        }

        // Generate next piece
        const next = generateRandomPiece(currentPiece.color, level);
        setNextPiece(next);
        setCurrentPiece(next);
      }, delay);
    }
  }, [currentPiece, grid, level, hasLBlocks, processLBlockRemoval, onPhaseChange, onScoreChange, onRfbCountChange, onLfbCountChange]);

  /**
   * Drop piece in fall direction (for levels 3+)
   * Places the piece on the grid when it can't move further
   */
  const dropPiece = useCallback(() => {
    if (!currentPiece) return;
    const rotation = getRotationFromLevel(level);
    const fallDir = getFallDirection(rotation);
    let testPiece = { 
      ...currentPiece, 
      x: currentPiece.x + fallDir.dx, 
      y: currentPiece.y + fallDir.dy 
    };
    while (canPlacePiece(grid, testPiece)) {
      testPiece = { 
        ...testPiece, 
        x: testPiece.x + fallDir.dx, 
        y: testPiece.y + fallDir.dy 
      };
    }
    // Move back one step to final position
    const finalPiece = { 
      ...testPiece, 
      x: testPiece.x - fallDir.dx, 
      y: testPiece.y - fallDir.dy 
    };
    
    // Place piece on grid (can't move after dropping)
    const updatedGrid = placePiece(grid, finalPiece);
    setGrid(updatedGrid);

    // Immediately clear currentPiece to prevent double rendering
    setCurrentPiece(null);

    // Update last color
    lastColorRef.current = finalPiece.color;

    // Check if L-blocks are formed - only delay if they exist
    const hasBlocks = hasLBlocks(updatedGrid);
    const delay = hasBlocks ? L_BLOCK_REMOVAL_DELAY : 0;

    setTimeout(() => {
      // Process L-block detection and removal
      const { grid: finalGrid, rfbCount: newRFBs, lfbCount: newLFBs, score: newScore } =
        processLBlockRemoval(updatedGrid);

      setGrid(finalGrid);

      // Defer callback updates
      setTimeout(() => {
        if (newRFBs > 0) {
          onRfbCountChange(newRFBs);
        }
        if (newLFBs > 0) {
          onLfbCountChange(newLFBs);
        }
        if (newScore > 0) {
          onScoreChange(newScore);
        }

        // Check if game is over
        if (isGridFullToTop(finalGrid, rotation)) {
          onPhaseChange('transitionAB');
          setGameStarted(false);
        }
      }, 0);

      // Check if game is over - stop piece generation
      if (isGridFullToTop(finalGrid, rotation)) {
        setCurrentPiece(null);
        return;
      }

      // Generate next piece
      const next = generateRandomPiece(finalPiece.color, level);
      setNextPiece(next);
      setCurrentPiece(next);
    }, delay);
  }, [currentPiece, grid, level, hasLBlocks, processLBlockRemoval, onPhaseChange, onScoreChange, onRfbCountChange, onLfbCountChange]);

  /**
   * Drop piece in a specific direction (for keyboard controls)
   * Places the piece on the grid when it can't move further
   */
  const dropPieceInDirection = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (!currentPiece) return;
    const rotation = getRotationFromLevel(level);
    let fallDir: { dx: number; dy: number };
    
    switch (direction) {
      case 'left':
        fallDir = { dx: -1, dy: 0 };
        break;
      case 'right':
        fallDir = { dx: 1, dy: 0 };
        break;
      case 'up':
        fallDir = { dx: 0, dy: -1 };
        break;
      case 'down':
        fallDir = { dx: 0, dy: 1 };
        break;
    }
    
    let testPiece = { 
      ...currentPiece, 
      x: currentPiece.x + fallDir.dx, 
      y: currentPiece.y + fallDir.dy 
    };
    // Safety limit to prevent infinite loops (max GRID_SIZE steps)
    let steps = 0;
    const maxSteps = GRID_SIZE;
    while (canPlacePiece(grid, testPiece) && steps < maxSteps) {
      testPiece = { 
        ...testPiece, 
        x: testPiece.x + fallDir.dx, 
        y: testPiece.y + fallDir.dy 
      };
      steps++;
    }
    // Move back one step to final position
    const finalPiece = { 
      ...testPiece, 
      x: testPiece.x - fallDir.dx, 
      y: testPiece.y - fallDir.dy 
    };
    
    // Place piece on grid (can't move after dropping)
    const updatedGrid = placePiece(grid, finalPiece);
    setGrid(updatedGrid);

    // Immediately clear currentPiece to prevent double rendering
    setCurrentPiece(null);

    // Update last color
    lastColorRef.current = finalPiece.color;

    // Check if L-blocks are formed - only delay if they exist
    const hasBlocks = hasLBlocks(updatedGrid);
    const delay = hasBlocks ? L_BLOCK_REMOVAL_DELAY : 0;

    setTimeout(() => {
      // Process L-block detection and removal
      const { grid: finalGrid, rfbCount: newRFBs, lfbCount: newLFBs, score: newScore } =
        processLBlockRemoval(updatedGrid);

      setGrid(finalGrid);

      // Defer callback updates
      setTimeout(() => {
        if (newRFBs > 0) {
          onRfbCountChange(newRFBs);
        }
        if (newLFBs > 0) {
          onLfbCountChange(newLFBs);
        }
        if (newScore > 0) {
          onScoreChange(newScore);
        }

        // Check if game is over
        if (isGridFullToTop(finalGrid, rotation)) {
          onPhaseChange('transitionAB');
          setGameStarted(false);
        }
      }, 0);

      // Check if game is over - stop piece generation
      if (isGridFullToTop(finalGrid, rotation)) {
        setCurrentPiece(null);
        return;
      }

      // Generate next piece
      const next = generateRandomPiece(finalPiece.color, level);
      setNextPiece(next);
      setCurrentPiece(next);
    }, delay);
  }, [currentPiece, grid, level, hasLBlocks, processLBlockRemoval, onPhaseChange, onScoreChange, onRfbCountChange, onLfbCountChange]);

  /**
   * Rotate piece
   */
  const rotateCurrentPiece = useCallback(() => {
    if (!currentPiece) return;
    const rotated = rotatePiece(currentPiece);
    if (canPlacePiece(grid, rotated)) {
      setCurrentPiece(rotated);
    }
  }, [currentPiece, grid]);

  return {
    grid,
    currentPiece,
    gameStarted,
    startGame,
    movePiece,
    movePieceVertical,
    movePieceDown,
    dropPiece,
    dropPieceInDirection,
    rotateCurrentPiece,
  };
}

