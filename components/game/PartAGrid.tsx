import { usePartAGridSize } from '@/hooks/usePartAGridSize';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useGameContext } from '../../contexts/GameContext';
import { useTransitionStage } from '../../hooks/useTransitionStage';
import Counters from './Counters';
import GameInfo from './GameInfo';
import PartAControls from './partA/PartAControls';
import PartAGameGrid from './partA/PartAGameGrid';
import { usePartAGameLogic } from './partA/usePartAGameLogic';
import { usePartAGestures } from './partA/usePartAGestures';
import { usePartAKeyboard } from './partA/usePartAKeyboard';

/**
 * Part A Grid Component
 * 
 * Uses context for state management - no prop drilling
 * Separated concerns: game logic, gestures, keyboard, rendering
 */
export default function PartAGrid() {
  const game = useGameContext();
  const transitionStage = useTransitionStage(game.phase);

  // Game logic hook - handles piece falling, L-block detection, etc.
  const gameLogic = usePartAGameLogic({
    phase: game.phase,
    level: game.level,
    onScoreChange: game.updateScore,
    onRfbCountChange: game.updateRfbCount,
    onLfbCountChange: game.updateLfbCount,
    onPhaseChange: game.setPhase,
  });

  // Gesture handlers
  const handleTap = useCallback(() => {
    gameLogic.rotateCurrentPiece();
  }, [gameLogic]);

  const handleSwipeLeft = useCallback(() => {
    gameLogic.movePiece('left');
  }, [gameLogic]);

  const handleSwipeRight = useCallback(() => {
    gameLogic.movePiece('right');
  }, [gameLogic]);

  const handleSwipeDown = useCallback(() => {
    // For levels 1-2: down swipe moves piece down one step (manual movement)
    if (game.level <= 2) {
      gameLogic.movePieceDown();
    }
    // For levels 3-4: down swipe moves vertically
    else if (game.level >= 3 && game.level <= 4) {
      gameLogic.movePieceVertical('down');
    }
    // For levels 5+: down swipe drops piece
    else {
      gameLogic.dropPiece();
    }
  }, [gameLogic, game.level]);

  const handleSwipeUp = useCallback(() => {
    // For levels 3-6, up swipe moves vertically
    if (game.level >= 3 && game.level <= 6) {
      gameLogic.movePieceVertical('up');
    }
  }, [gameLogic, game.level]);

  // Gesture hook - handles touch/swipe gestures
  const panResponder = usePartAGestures({
    phase: game.phase,
    onTap: handleTap,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeDown: handleSwipeDown,
    onSwipeUp: handleSwipeUp,
  });

  // Keyboard hook - handles keyboard input for web
  usePartAKeyboard({
    phase: game.phase,
    gameStarted: gameLogic.gameStarted,
    currentPiece: gameLogic.currentPiece,
    grid: gameLogic.grid,
    level: game.level,
    onMoveLeft: handleSwipeLeft,
    onMoveRight: handleSwipeRight,
    onMoveUp: handleSwipeUp,
    onMoveDown: () => {
      // For levels 3-6, down arrow should move down vertically
      if (game.level >= 3 && game.level <= 6) {
        gameLogic.movePieceVertical('down');
      }
    },
    onDrop: handleSwipeDown,
    onDropLeft: () => gameLogic.dropPieceInDirection('left'),
    onDropRight: () => gameLogic.dropPieceInDirection('right'),
    onDropUp: () => gameLogic.dropPieceInDirection('up'),
    onDropDown: () => gameLogic.dropPieceInDirection('down'),
    onRotate: handleTap,
  });

  const handleStart = useCallback(() => {
    gameLogic.startGame();
    game.handleStartPartA();
  }, [gameLogic, game]);

  const initialGridSize = usePartAGridSize();
  const partAGridWidth = game.partAGridWidth || initialGridSize;

  const handleGridSizeChange = useCallback((size: number) => {
    game.setPartAGridWidth(size);
  }, [game]);

  return (
    <View {...(game.phase === 'partA' ? panResponder.panHandlers : {})} style={{ position: 'relative', minWidth: partAGridWidth, maxWidth: 5000, flex: 1 }}>
      <GameInfo level={game.level} score={game.score} />
      
      <PartAGameGrid
        grid={gameLogic.grid}
        currentPiece={gameLogic.currentPiece}
        phase={game.phase}
        transitionStage={transitionStage}
        level={game.level}
        onGridSizeChange={handleGridSizeChange}
      />

      <View style={{ marginTop: 4 }}>
        <Counters rfbCount={game.rfbCount} lfbCount={game.lfbCount} wCount={game.wCount} />
      </View>

      <PartAControls
        phase={game.phase}
        transitionStage={transitionStage}
        onStart={handleStart}
        onTransition={game.handleTransition}
      />
    </View>
  );
}
