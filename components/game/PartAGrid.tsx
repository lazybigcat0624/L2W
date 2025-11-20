import {
  GAME_COLORS,
  GRID_SIZE,
  GamePhase,
  L_PATTERNS,
  PIECE_COLORS,
  Piece,
  SCORES,
} from '@/constants/game';
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Platform,
  View,
  useWindowDimensions,
} from 'react-native';
import { gameStyles } from '../../styles/styles';
import Counters from './Counters';
import GameButton from './GameButton';
import TransitionMessage from './TransitionMessage';

// Constants
const MIN_CELL_SIZE = 10;
const MAX_GRID_WIDTH = 500;
const GRID_HEIGHT_RATIO = 0.45;
const GRID_PADDING = 40;
const FALL_INTERVAL_MS = 1000; // 1 second per fall
const TAP_THRESHOLD = 10;
const SWIPE_THRESHOLD = 30;
const SWIPE_COOLDOWN_MS = 120;

interface PartAGridProps {
  phase: GamePhase;
  rfbCount: number;
  lfbCount: number;
  wCount: number;
  onGridChange: (grid: number[][]) => void;
  onCurrentPieceChange: (piece: Piece | null) => void;
  onScoreChange: (score: number) => void;
  onRfbCountChange: (count: number) => void;
  onLfbCountChange: (count: number) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onGameStartedChange: (started: boolean) => void;
  onStartPartA: () => void;
  onTransition: () => void;
}

interface CellColors {
  backgroundColor: string;
  borderColor: string;
}

interface SwipeState {
  direction: 'left' | 'right' | 'down';
  time: number;
}

/**
 * PartAGrid Component
 *
 * Manages all Part A game logic including:
 * - Piece falling and placement
 * - L-block detection and removal
 * - Keyboard and gesture controls
 * - Grid rendering and display
 */
export default function PartAGrid({
  phase,
  rfbCount,
  lfbCount,
  wCount,
  onGridChange,
  onCurrentPieceChange,
  onScoreChange,
    onRfbCountChange,
    onLfbCountChange,
    onPhaseChange,
  onGameStartedChange,
  onStartPartA,
  onTransition,
}: PartAGridProps) {
  const { width, height } = useWindowDimensions();

  // Part A state
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Refs for interval management and gesture handling
  const fallIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSwipeRef = useRef<SwipeState | null>(null);
  const gridRef = useRef(grid);
  const currentPieceRef = useRef<Piece | null>(currentPiece);

  // Keep refs synchronized with state for interval callbacks
  useEffect(() => {
    gridRef.current = grid;
    onGridChange(grid);
  }, [grid, onGridChange]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
    onCurrentPieceChange(currentPiece);
  }, [currentPiece, onCurrentPieceChange]);

  /**
   * Calculates optimal cell size based on available space
   */
  const cellSize = useMemo(() => {
    const availableWidth = Math.min(width - GRID_PADDING, MAX_GRID_WIDTH);
    const availableHeight = height * GRID_HEIGHT_RATIO;

    const widthBasedSize = Math.floor(availableWidth / GRID_SIZE);
    const heightBasedSize = Math.floor(availableHeight / GRID_SIZE);

    return Math.max(MIN_CELL_SIZE, Math.min(widthBasedSize, heightBasedSize));
  }, [width, height]);

  /**
   * Processes L-block detection and removal when a piece is placed
   * Returns updated counts and score
   */
  const processLBlockRemoval = useCallback(
    (gridState: number[][]): { grid: number[][]; rfbCount: number; lfbCount: number; score: number } => {
      let updatedGrid = gridState;
      let totalRFBs = 0;
      let totalLFBs = 0;
      let totalScore = 0;
      let hasChanges = true;

      // Continuously detect and remove L-blocks until no more are found
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
   * Handles keyboard input for web platform (Part A only)
   */
  useEffect(() => {
    if (Platform.OS !== 'web' || phase !== 'partA' || !gameStarted) {
      return;
    }

    const handleKeyPress = (e: globalThis.KeyboardEvent) => {
      if (!currentPiece) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentPiece((prev) => {
            if (!prev) return null;
            const testPiece = { ...prev, x: prev.x - 1 };
            return canPlacePiece(grid, testPiece) ? testPiece : prev;
          });
          break;

        case 'ArrowRight':
          e.preventDefault();
          setCurrentPiece((prev) => {
            if (!prev) return null;
            const testPiece = { ...prev, x: prev.x + 1 };
            return canPlacePiece(grid, testPiece) ? testPiece : prev;
          });
          break;

        case 'ArrowDown':
          e.preventDefault();
          setCurrentPiece((prev) => {
            if (!prev) return null;
            let testPiece = { ...prev, y: prev.y + 1 };
            while (canPlacePiece(grid, testPiece)) {
              testPiece = { ...testPiece, y: testPiece.y + 1 };
            }
            testPiece.y = testPiece.y - 1;
            return testPiece;
          });
          break;

        case ' ':
        case 'ArrowUp':
          e.preventDefault();
          const rotated = rotatePiece(currentPiece);
          if (canPlacePiece(grid, rotated)) {
            setCurrentPiece(rotated);
          }
          break;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [phase, gameStarted, currentPiece, grid]);

  /**
   * Part A: Handles piece falling at regular intervals
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

        // Update counts and score via callbacks
        if (newRFBs > 0) {
          onRfbCountChange(newRFBs);
        }
        if (newLFBs > 0) {
          onLfbCountChange(newLFBs);
        }
        if (newScore > 0) {
          onScoreChange(newScore);
        }

        setGrid(finalGrid);

        // Check if game is over (grid full to top)
        if (isGridFullToTop(finalGrid)) {
          onPhaseChange('transitionAB');
          setGameStarted(false);
          onGameStartedChange(false);
          return null;
        }

        // Generate next piece
        const next = generateRandomPiece();
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
    processLBlockRemoval,
    onPhaseChange,
    onGameStartedChange,
    onScoreChange,
    onRfbCountChange,
    onLfbCountChange,
  ]);

  /**
   * Handles tap gesture - rotates piece in Part A
   */
  const handleTap = useCallback(() => {
    if (phase === 'partA' && currentPiece) {
      const rotated = rotatePiece(currentPiece);
      if (canPlacePiece(grid, rotated)) {
        setCurrentPiece(rotated);
      }
    }
  }, [phase, currentPiece, grid]);

  /**
   * Handles horizontal swipe (left/right) to move piece
   */
  const handleHorizontalSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const now = Date.now();
      const canSwipe =
        !lastSwipeRef.current ||
        lastSwipeRef.current.direction !== direction ||
        now - lastSwipeRef.current.time > SWIPE_COOLDOWN_MS;

      if (!canSwipe) return;

      lastSwipeRef.current = { direction, time: now };
      setCurrentPiece((prev) => {
        if (!prev) return null;
        const delta = direction === 'right' ? 1 : -1;
        const testPiece = { ...prev, x: prev.x + delta };
        return canPlacePiece(grid, testPiece) ? testPiece : prev;
      });
    },
    [grid]
  );

  /**
   * Handles vertical swipe (down) to drop piece
   */
  const handleVerticalSwipe = useCallback(() => {
    const now = Date.now();
    const canSwipe =
      !lastSwipeRef.current ||
      lastSwipeRef.current.direction !== 'down' ||
      now - lastSwipeRef.current.time > SWIPE_COOLDOWN_MS;

    if (!canSwipe) return;

    lastSwipeRef.current = { direction: 'down', time: now };
    setCurrentPiece((prev) => {
      if (!prev) return null;
      let testPiece = { ...prev, y: prev.y + 1 };
      while (canPlacePiece(grid, testPiece)) {
        testPiece = { ...testPiece, y: testPiece.y + 1 };
      }
      testPiece.y = testPiece.y - 1;
      return testPiece;
    });
  }, [grid]);

  /**
   * Pan responder for handling swipe gestures in Part A
   */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => phase === 'partA',
        onMoveShouldSetPanResponder: () => phase === 'partA',
        onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          if (phase !== 'partA') return;

          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          // Horizontal swipe
          if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
            const direction: 'left' | 'right' = dx > 0 ? 'right' : 'left';
            handleHorizontalSwipe(direction);
          }
          // Vertical swipe (down)
          else if (absDy > absDx && dy > SWIPE_THRESHOLD) {
            handleVerticalSwipe();
          }
        },
        onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          lastSwipeRef.current = null;

          if (phase !== 'partA') return;

          // Detect tap (small movement)
          const absDx = Math.abs(gestureState.dx);
          const absDy = Math.abs(gestureState.dy);
          if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD) {
            handleTap();
          }
        },
      }),
    [phase, grid, handleTap, handleHorizontalSwipe, handleVerticalSwipe]
  );

  /**
   * Initialize Part A game
   */
  const handleStartPartA = useCallback(() => {
    setGrid(createEmptyGrid());
    setCurrentPiece(generateRandomPiece());
    setNextPiece(generateRandomPiece());
    setGameStarted(true);
    onGameStartedChange(true);
    onStartPartA();
  }, [onGameStartedChange, onStartPartA]);

  /**
   * Determines the colors for a cell based on current piece and grid state
   */
  const getCellColors = (row: number, col: number): CellColors => {
    // Check if cell is part of the current falling piece
    if (currentPiece) {
      const pieceRow = row - currentPiece.y;
      const pieceCol = col - currentPiece.x;

      const isInPieceBounds =
        pieceRow >= 0 &&
        pieceRow < currentPiece.cells.length &&
        pieceCol >= 0 &&
        pieceCol < currentPiece.cells[pieceRow]?.length;

      const isPartOfPiece = isInPieceBounds && currentPiece.cells[pieceRow][pieceCol] === 1;

      if (isPartOfPiece) {
        return {
          backgroundColor: currentPiece.color,
          borderColor: GAME_COLORS.gridLine,
        };
      }
    }

    // Check if cell contains a placed piece
    const gridValue = grid[row]?.[col] ?? 0;
    if (gridValue > 0 && gridValue <= PIECE_COLORS.length) {
      return {
        backgroundColor: PIECE_COLORS[gridValue - 1],
        borderColor: GAME_COLORS.gridLine,
      };
    }

    // Empty cell
    return {
      backgroundColor: GAME_COLORS.background,
      borderColor: GAME_COLORS.gridLineFaded,
    };
  };

  /**
   * Renders a single grid cell
   */
  const renderCell = (row: number, col: number) => {
    const { backgroundColor, borderColor } = getCellColors(row, col);

    return (
      <View
        key={`${row}-${col}`}
        style={[
          gameStyles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor,
            borderColor,
          },
        ]}
      />
    );
  };

  /**
   * Renders a row of cells
   */
  const renderRow = (row: number) => (
    <View key={row} style={gameStyles.row}>
      {Array.from({ length: GRID_SIZE }, (_, col) => renderCell(row, col))}
    </View>
  );

  /**
   * Renders Part A control buttons
   */
  const renderControls = useCallback(() => {
    if (phase === 'idle') {
      return (
        <View style={gameStyles.controlsContainer}>
          <GameButton title="START" onPress={handleStartPartA} />
        </View>
      );
    }

    if (phase === 'transitionAB') {
      return (
        <View style={gameStyles.controlsContainer}>
          <TransitionMessage showFail={true} showFailForward={true} showDoIt={false} />
          <GameButton title="START" onPress={onTransition} />
        </View>
      );
    }

    return null;
  }, [phase, handleStartPartA, onTransition]);

  return (
    <View {...(phase === 'partA' ? panResponder.panHandlers : {})}>
      <View style={gameStyles.gridContainer}>
        {Array.from({ length: GRID_SIZE }, (_, row) => renderRow(row))}
      </View>

      <Counters rfbCount={rfbCount} lfbCount={lfbCount} wCount={wCount} />

      {renderControls()}
    </View>
  );
}
