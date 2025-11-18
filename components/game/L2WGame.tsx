import { GAME_COLORS, GamePhase, GRID_SIZE, L_PATTERNS, Piece, SCORES } from '@/constants/game';
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
import {
  canFormMoreWBlocks,
  canPlaceLBlock,
  detectWBlocks,
  L_BLOCK_SHAPES,
  placeLBlock,
  removeWBlocks,
  rotateLBlock,
} from '@/utils/partBLogic';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Counters from './Counters';
import GameButton from './GameButton';
import GameHeader from './GameHeader';
import PartAGrid from './PartAGrid';
import PartBGrid from './PartBGrid';
import TransitionMessage from './TransitionMessage';

const FALL_INTERVAL = 1000; // 1 second per fall
const TAP_THRESHOLD = 10;
const SWIPE_THRESHOLD = 30;
const SWIPE_COOLDOWN_MS = 120;

export default function L2WGame() {
  const { width } = useWindowDimensions();
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [rfbCount, setRfbCount] = useState(0);
  const [lfbCount, setLfbCount] = useState(0);
  const [wCount, setWCount] = useState(0);
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid());
  const [partBGrid, setPartBGrid] = useState<number[][]>(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [draggingPiece, setDraggingPiece] = useState<{ type: 'RFB' | 'LFB'; rotation: number } | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);

  const fallIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSwipeRef = useRef<{ direction: 'left' | 'right' | 'down'; time: number } | null>(null);
  const gridRef = useRef(grid);
  const currentPieceRef = useRef<Piece | null>(currentPiece);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

  // Keyboard support for web
  useEffect(() => {
    if (Platform.OS === 'web' && phase === 'partA' && gameStarted) {
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
    }
  }, [phase, gameStarted, currentPiece, grid]);

  // Part A: Handle piece falling
  useEffect(() => {
    if (phase === 'partA' && gameStarted) {
      fallIntervalRef.current = setInterval(() => {
        setCurrentPiece((prev) => {
          const activePiece = prev ?? currentPieceRef.current;
          if (!activePiece) return null;
          const activeGrid = gridRef.current;

          const testPiece = { ...activePiece, y: activePiece.y + 1 };
          if (canPlacePiece(activeGrid, testPiece)) {
            return testPiece;
          }

          // Piece can't fall, place it
          let updatedGrid = placePiece(activeGrid, activePiece);
          setGrid(updatedGrid);

          let totalRFBs = 0;
          let totalLFBs = 0;
          let totalScore = 0;
          let hasChanges = true;

          while (hasChanges) {
            hasChanges = false;

            const rfbBlocks = detectLBlocks(updatedGrid, L_PATTERNS.RFB);
            if (rfbBlocks.length > 0) {
              rfbBlocks.forEach((cells) => {
                updatedGrid = removeCells(updatedGrid, cells);
              });
              totalRFBs += rfbBlocks.length;
              totalScore += SCORES.RFB * rfbBlocks.length;
              hasChanges = true;
              setGrid(updatedGrid);
            }

            const lfbBlocks = detectLBlocks(updatedGrid, L_PATTERNS.LFB);
            if (lfbBlocks.length > 0) {
              lfbBlocks.forEach((cells) => {
                updatedGrid = removeCells(updatedGrid, cells);
              });
              totalLFBs += lfbBlocks.length;
              totalScore += SCORES.LFB * lfbBlocks.length;
              hasChanges = true;
              setGrid(updatedGrid);
            }
          }

          if (totalRFBs > 0) {
            setRfbCount((prevCount) => prevCount + totalRFBs);
          }
          if (totalLFBs > 0) {
            setLfbCount((prevCount) => prevCount + totalLFBs);
          }
          if (totalScore > 0) {
            setScore((prevScore) => prevScore + totalScore);
          }

          setGrid(updatedGrid);

          if (isGridFullToTop(updatedGrid)) {
            setPhase('transitionAB');
            setGameStarted(false);
            return null;
          }

          const next = generateRandomPiece();
          setNextPiece(next);
          return next;
        });
      }, FALL_INTERVAL);
    } else {
      if (fallIntervalRef.current) {
        clearInterval(fallIntervalRef.current);
        fallIntervalRef.current = null;
      }
    }

    return () => {
      if (fallIntervalRef.current) {
        clearInterval(fallIntervalRef.current);
      }
    };
  }, [phase, gameStarted]);

  // Handle tap to rotate (Part A) or rotate dragging block (Part B)
  const handleTap = useCallback(() => {
    if (phase === 'partA' && currentPiece) {
      const rotated = rotatePiece(currentPiece);
      if (canPlacePiece(grid, rotated)) {
        setCurrentPiece(rotated);
      }
    } else if (phase === 'partB' && draggingPiece) {
      const newRotation = (currentRotation + 90) % 360;
      setCurrentRotation(newRotation);
      setDraggingPiece({ ...draggingPiece, rotation: newRotation });
    }
  }, [phase, currentPiece, grid, draggingPiece, currentRotation]);

  // Handle swipe gestures for Part A
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => phase === 'partA',
    onMoveShouldSetPanResponder: () => phase === 'partA',
    onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (phase !== 'partA') return;

      const { dx, dy } = gestureState;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
        const direction: 'left' | 'right' = dx > 0 ? 'right' : 'left';
        const now = Date.now();
        if (
          !lastSwipeRef.current ||
          lastSwipeRef.current.direction !== direction ||
          now - lastSwipeRef.current.time > SWIPE_COOLDOWN_MS
        ) {
          lastSwipeRef.current = { direction, time: now };
          setCurrentPiece((prev) => {
            if (!prev) return null;
            const delta = direction === 'right' ? 1 : -1;
            const testPiece = { ...prev, x: prev.x + delta };
            return canPlacePiece(grid, testPiece) ? testPiece : prev;
          });
        }
      } else if (absDy > absDx && dy > SWIPE_THRESHOLD) {
        const now = Date.now();
        if (
          !lastSwipeRef.current ||
          lastSwipeRef.current.direction !== 'down' ||
          now - lastSwipeRef.current.time > SWIPE_COOLDOWN_MS
        ) {
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
        }
      }
    },
    onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      lastSwipeRef.current = null;

      if (phase !== 'partA') return;
      const absDx = Math.abs(gestureState.dx);
      const absDy = Math.abs(gestureState.dy);

      if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD) {
        handleTap();
      }
    },
  });

  // Start Part A
  const startPartA = () => {
    setGrid(createEmptyGrid());
    setCurrentPiece(generateRandomPiece());
    setNextPiece(generateRandomPiece());
    setGameStarted(true);
    setPhase('partA');
  };

  // Initialize Part B grid with pre-filled cells (architecture)
  const initializePartBGrid = (): number[][] => {
    const newGrid = createEmptyGrid();
    // Add some pre-filled cells to create grid architecture
    // Pattern: scattered pre-filled cells (value 3)
    const preFilledCells = [
      [2, 2], [2, 11], [5, 5], [5, 8], [8, 2], [8, 11],
      [11, 5], [11, 8], [3, 7], [7, 3], [7, 10], [10, 7],
    ];
    preFilledCells.forEach(([row, col]) => {
      if (row < GRID_SIZE && col < GRID_SIZE) {
        newGrid[row][col] = 3; // Pre-filled cell
      }
    });
    return newGrid;
  };

  // Start Part B
  const startPartB = () => {
    setPartBGrid(initializePartBGrid());
    setPhase('partB');
    setDraggingPiece(null);
    setCurrentRotation(0);
  };

  // Generate L-block in Part B
  const generateLBlock = (type: 'RFB' | 'LFB') => {
    if (type === 'RFB' && rfbCount > 0) {
      setDraggingPiece({ type: 'RFB', rotation: currentRotation });
    } else if (type === 'LFB' && lfbCount > 0) {
      setDraggingPiece({ type: 'LFB', rotation: currentRotation });
    }
  };

  // Place L-block in Part B
  const handlePlaceLBlock = (row: number, col: number, type: 'RFB' | 'LFB', rotation: number): boolean => {
    if (!draggingPiece) return false;

    const shape = L_BLOCK_SHAPES[type];
    const rotatedShape = rotateLBlock(shape, rotation);
    
    if (type === 'RFB' && rfbCount > 0) {
      if (canPlaceLBlock(partBGrid, rotatedShape, row, col)) {
        const newGrid = placeLBlock(partBGrid, rotatedShape, row, col, 'RFB');
        setPartBGrid(newGrid);
        setRfbCount((prev) => prev - 1);
        setDraggingPiece(null);
        
        // Check for W-block formation
        checkWBlocks(newGrid, rfbCount - 1, lfbCount);
        return true;
      }
    } else if (type === 'LFB' && lfbCount > 0) {
      if (canPlaceLBlock(partBGrid, rotatedShape, row, col)) {
        const newGrid = placeLBlock(partBGrid, rotatedShape, row, col, 'LFB');
        setPartBGrid(newGrid);
        setLfbCount((prev) => prev - 1);
        setDraggingPiece(null);
        
        // Check for W-block formation
        checkWBlocks(newGrid, rfbCount, lfbCount - 1);
        return true;
      }
    }
    
    return false;
  };

  // Check for W-block formation
  const checkWBlocks = (grid: number[][], currentRFB: number, currentLFB: number) => {
    const wBlocks = detectWBlocks(grid);
    
    if (wBlocks.length > 0) {
      let updatedGrid = grid;
      wBlocks.forEach((cells) => {
        updatedGrid = removeWBlocks(updatedGrid, cells);
      });
      
      setPartBGrid(updatedGrid);
      setWCount((prev) => prev + wBlocks.length);
      setScore((prev) => prev + SCORES.W_BLOCK * wBlocks.length);
      
      // Check completion or transition
      if (currentRFB === 0 && currentLFB === 0) {
        // All L-blocks used - level complete
        setPhase('complete');
      } else if (!canFormMoreWBlocks(updatedGrid, currentRFB, currentLFB)) {
        // Can't form more W-blocks - return to Part A
        setPhase('transitionBA');
      }
    } else {
      // Check if we can form more W-blocks
      if (currentRFB === 0 && currentLFB === 0) {
        setPhase('complete');
      } else if (!canFormMoreWBlocks(grid, currentRFB, currentLFB)) {
        setPhase('transitionBA');
      }
    }
  };

  // Handle transitions
  const handleTransition = () => {
    if (phase === 'transitionAB') {
      startPartB();
    } else if (phase === 'transitionBA') {
      startPartA();
    }
  };

  // Render Part A controls
  const renderPartAControls = () => {
    if (phase === 'idle') {
      return (
        <View style={styles.controlsContainer}>
          <GameButton title="START" onPress={startPartA} />
        </View>
      );
    }
    
    if (phase === 'transitionAB') {
      return (
        <View style={styles.controlsContainer}>
          <TransitionMessage showFail={true} showFailForward={true} showDoIt={false} />
          <GameButton title="START" onPress={handleTransition} />
        </View>
      );
    }
    
    return null;
  };

  // Render Part B controls
  const renderPartBControls = () => {
    if (phase !== 'partB' && phase !== 'transitionBA') return null;
    
    return (
      <View style={styles.controlsContainer}>
        {phase === 'transitionBA' && (
          <>
            <TransitionMessage
              showFail={rfbCount > 0 || lfbCount > 0}
              showFailForward={true}
              showDoIt={true}
            />
            <GameButton title="START" onPress={handleTransition} />
          </>
        )}
        {phase === 'partB' && (
          <View style={styles.partBControls}>
            <TouchableOpacity
              style={[
                styles.lBlockButton,
                { 
                  width: width < 320 ? 50 : width < 400 ? 60 : 80, 
                  height: width < 320 ? 50 : width < 400 ? 60 : 80 
                },
                rfbCount === 0 && styles.buttonDisabled
              ]}
              onPress={() => generateLBlock('RFB')}
              disabled={rfbCount === 0}
            >
              <Text style={[styles.lBlockText, { fontSize: width < 320 ? 28 : width < 400 ? 36 : 48 }]}>L</Text>
              <Text style={[styles.lBlockCount, { fontSize: width < 320 ? 10 : width < 400 ? 12 : 16 }]}>{rfbCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rotateButton,
                { 
                  width: width < 320 ? 40 : width < 400 ? 50 : 60, 
                  height: width < 320 ? 40 : width < 400 ? 50 : 60 
                },
                !draggingPiece && styles.buttonDisabled
              ]}
              onPress={handleTap}
              disabled={!draggingPiece}
            >
              <Text style={[styles.rotateText, { fontSize: width < 320 ? 20 : width < 400 ? 24 : 32 }]}>↻</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.lBlockButton,
                { 
                  width: width < 320 ? 50 : width < 400 ? 60 : 80, 
                  height: width < 320 ? 50 : width < 400 ? 60 : 80 
                },
                lfbCount === 0 && styles.buttonDisabled
              ]}
              onPress={() => generateLBlock('LFB')}
              disabled={lfbCount === 0}
            >
              <Text style={[styles.lBlockText, { fontSize: width < 320 ? 28 : width < 400 ? 36 : 48 }]}>J</Text>
              <Text style={[styles.lBlockCount, { fontSize: width < 320 ? 10 : width < 400 ? 12 : 16 }]}>{lfbCount}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container} {...(phase === 'partA' ? panResponder.panHandlers : {})}>
      <GameHeader score={score} level={level} />
      
      {phase === 'partA' || phase === 'transitionAB' || phase === 'idle' ? (
        <View style={styles.gameArea}>
          <PartAGrid grid={grid} currentPiece={currentPiece} />
          {phase === 'idle' && (
            <TouchableOpacity style={styles.tapArea} onPress={handleTap} activeOpacity={1}>
              <View style={styles.tapArea} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.gameArea}>
          <PartBGrid
            grid={partBGrid}
            onPlaceLBlock={handlePlaceLBlock}
            draggingPiece={draggingPiece}
          />
        </View>
      )}
      
      <Counters rfbCount={rfbCount} lfbCount={lfbCount} wCount={wCount} />
      
      {renderPartAControls()}
      {renderPartBControls()}
      
      {phase === 'complete' && (
        <View style={styles.completeContainer}>
          <Text style={[styles.completeText, { fontSize: width < 400 ? 32 : 42 }]}>LEVEL COMPLETE!</Text>
          <Text style={[styles.completeScore, { fontSize: width < 400 ? 18 : 24 }]}>Final Score: {score}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    minHeight: 200,
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  partBControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  lBlockButton: {
    backgroundColor: GAME_COLORS.title,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lBlockText: {
    fontWeight: 'bold',
    color: GAME_COLORS.background,
  },
  lBlockCount: {
    fontWeight: 'bold',
    color: GAME_COLORS.background,
    marginTop: 4,
  },
  rotateButton: {
    backgroundColor: GAME_COLORS.jCounter,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotateText: {
    color: GAME_COLORS.background,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  completeContainer: {
    alignItems: 'center',
    padding: 40,
  },
  completeText: {
    fontWeight: 'bold',
    color: GAME_COLORS.failForward,
    marginBottom: 20,
  },
  completeScore: {
    color: GAME_COLORS.score,
  },
});

