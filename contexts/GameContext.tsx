import { GamePhase } from '@/constants/game';
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useGameState, type GameState } from '../hooks/useGameState';

interface GameContextValue extends GameState {
  // Phase helpers
  isPartAPhase: boolean;
  isPartBPhase: boolean;
  isComplete: boolean;
  isIdle: boolean;
  
  // State setters (from useGameState)
  setPhase: (phase: GamePhase) => void;
  setScore: (score: number) => void;
  setLevel: (level: number) => void;
  setRfbCount: (count: number) => void;
  setLfbCount: (count: number) => void;
  setWCount: (count: number) => void;
  
  // Update functions (from useGameState)
  updateScore: (delta: number) => void;
  updateRfbCount: (delta: number) => void;
  updateLfbCount: (delta: number) => void;
  updateWCount: (delta: number) => void;
  
  // Actions
  handleTransition: () => void;
  handleStartPartA: () => void;
  handlePartBEnd: () => void;
  handleRestart: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

/**
 * Game Context Provider
 * Centralizes game state and actions to avoid prop drilling
 */
export function GameProvider({ children }: GameProviderProps) {
  const gameState = useGameState();

  const isPartAPhase = useMemo(
    () => gameState.phase === 'partA' || gameState.phase === 'transitionAB' || gameState.phase === 'idle',
    [gameState.phase]
  );

  const isPartBPhase = useMemo(
    () => gameState.phase === 'partB',
    [gameState.phase]
  );

  const isComplete = useMemo(
    () => gameState.phase === 'complete',
    [gameState.phase]
  );

  const isIdle = useMemo(
    () => gameState.phase === 'idle',
    [gameState.phase]
  );

  const handleTransition = () => {
    if (gameState.phase === 'transitionAB') {
      gameState.setPhase('partB');
    } else if (gameState.phase === 'transitionBA') {
      gameState.setPhase('partA');
    }
  };

  const handleStartPartA = () => {
    gameState.setPhase('partA');
  };

  const handlePartBEnd = () => {
    gameState.setPhase('complete');
  };

  const handleRestart = () => {
    gameState.reset();
  };

  const value: GameContextValue = useMemo(
    () => ({
      ...gameState,
      isPartAPhase,
      isPartBPhase,
      isComplete,
      isIdle,
      handleTransition,
      handleStartPartA,
      handlePartBEnd,
      handleRestart,
    }),
    [gameState, isPartAPhase, isPartBPhase, isComplete, isIdle]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Hook to access game context
 * Throws error if used outside GameProvider
 */
export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
}

