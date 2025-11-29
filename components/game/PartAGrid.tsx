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
    gameLogic.dropPiece();
  }, [gameLogic]);

  // Gesture hook - handles touch/swipe gestures
  const panResponder = usePartAGestures({
    phase: game.phase,
    onTap: handleTap,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeDown: handleSwipeDown,
  });

  // Keyboard hook - handles keyboard input for web
  usePartAKeyboard({
    phase: game.phase,
    gameStarted: gameLogic.gameStarted,
    currentPiece: gameLogic.currentPiece,
    grid: gameLogic.grid,
    onMoveLeft: handleSwipeLeft,
    onMoveRight: handleSwipeRight,
    onDrop: handleSwipeDown,
    onRotate: handleTap,
  });

  const handleStart = useCallback(() => {
    gameLogic.startGame();
    game.handleStartPartA();
  }, [gameLogic, game]);

  return (
    <View {...(game.phase === 'partA' ? panResponder.panHandlers : {})}>
      <GameInfo level={game.level} score={game.score} />
      
      <PartAGameGrid
        grid={gameLogic.grid}
        currentPiece={gameLogic.currentPiece}
        phase={game.phase}
        transitionStage={transitionStage}
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
