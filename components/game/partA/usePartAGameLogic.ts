import { GamePhase, L_PATTERNS, Piece, SCORES } from '@/constants/game';
import {
  canPlacePiece,
  createEmptyGrid,
  detectLBlocks,
  generateRandomPiece,
  isGridFullToTop,
  placePiece,
  removeCells,
  rotatePiece,
} from '@/utils/gameLogic';
import { useCallback, useEffect, useRef, useState } from 'react';

const FALL_INTERVAL_MS = 1000;

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

  // Keep refs synchronized with state
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

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

      while (hasChanges) {
        hasChanges = false;

        // Check for LFB blocks first (higher priority/scoring)
        const lfbBlocks = detectLBlocks(updatedGrid, L_PATTERNS.LFB);
        if (lfbBlocks.length > 0) {
          updatedGrid = removeCells(updatedGrid, lfbBlocks[0]);
          totalLFBs += 1;
          totalScore += SCORES.LFB;
          hasChanges = true;
          continue;
        }

        // Check for RFB blocks
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
   */
  useEffect(() => {
    if (phase !== 'partA' || !gameStarted) {
      if (fallIntervalRef.current) {
        clearInterval(fallIntervalRef.current);
        fallIntervalRef.current = null;
      }
      return;
    }

    fallIntervalRef.current = setInterval(() => {
      setCurrentPiece((prev) => {
        const activePiece = prev ?? currentPieceRef.current;
        if (!activePiece) return null;
        const activeGrid = gridRef.current;

        // Try to move piece down
        const testPiece = { ...activePiece, y: activePiece.y + 1 };
        if (canPlacePiece(activeGrid, testPiece)) {
          return testPiece;
        }

        // Piece can't fall further - place it on the grid
        const updatedGrid = placePiece(activeGrid, activePiece);
        setGrid(updatedGrid);

        // Process L-block detection and removal
        const { grid: finalGrid, rfbCount: newRFBs, lfbCount: newLFBs, score: newScore } =
          processLBlockRemoval(updatedGrid);

        setGrid(finalGrid);

        // Update last color to the piece that was just placed
        lastColorRef.current = activePiece.color;

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

          // Check if game is over (grid full to top)
          if (isGridFullToTop(finalGrid)) {
            onPhaseChange('transitionAB');
            setGameStarted(false);
          }
        }, 0);

        // Check if game is over - return null to stop piece generation
        if (isGridFullToTop(finalGrid)) {
          return null;
        }

        // Generate next piece (avoiding same color as the piece that was just placed)
        const next = generateRandomPiece(activePiece.color, level);
        setNextPiece(next);
        return next;
      });
    }, FALL_INTERVAL_MS);

    return () => {
      if (fallIntervalRef.current) {
        clearInterval(fallIntervalRef.current);
      }
    };
  }, [
    phase,
    gameStarted,
    level,
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
    const firstPiece = generateRandomPiece(undefined, level);
    lastColorRef.current = firstPiece.color;
    const secondPiece = generateRandomPiece(firstPiece.color, level);
    lastColorRef.current = secondPiece.color;
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setGameStarted(true);
  }, [level]);

  /**
   * Move piece horizontally
   */
  const movePiece = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentPiece) return;
      const delta = direction === 'right' ? 1 : -1;
      const testPiece = { ...currentPiece, x: currentPiece.x + delta };
      if (canPlacePiece(grid, testPiece)) {
        setCurrentPiece(testPiece);
      }
    },
    [currentPiece, grid]
  );

  /**
   * Drop piece to bottom
   */
  const dropPiece = useCallback(() => {
    if (!currentPiece) return;
    let testPiece = { ...currentPiece, y: currentPiece.y + 1 };
    while (canPlacePiece(grid, testPiece)) {
      testPiece = { ...testPiece, y: testPiece.y + 1 };
    }
    testPiece.y = testPiece.y - 1;
    setCurrentPiece(testPiece);
  }, [currentPiece, grid]);

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
    dropPiece,
    rotateCurrentPiece,
  };
}

