import { GamePhase } from '@/constants/game';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { gameStyles } from '../../styles/styles';
import GameHeader from './GameHeader';
import PartAGrid from './PartAGrid';
import PartBGrid from './PartBGrid';

// Constants
const RESPONSIVE_BREAKPOINT = 400;

/**
 * L2WGame Component
 *
 * Main coordinator component that manages:
 * - Overall game state (phase, score, level)
 * - Block counts (shared between Part A and Part B)
 * - Phase transitions
 * - High-level coordination between Part A and Part B
 */
export default function L2WGame() {
  const { width } = useWindowDimensions();

  // Overall game state
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);

  // Block counts (earned in Part A, used in Part B)
  const [rfbCount, setRfbCount] = useState(0);
  const [lfbCount, setLfbCount] = useState(0);
  const [wCount, setWCount] = useState(0);

  // State for Part A (managed by PartAGrid but needed for coordination)
  const [partAGrid, setPartAGrid] = useState<number[][]>([]);
  const [currentPiece, setCurrentPiece] = useState<any>(null);

  // State for Part B (managed by PartBGrid)
  const [partBGrid, setPartBGrid] = useState<number[][]>([]);

  /**
   * Starts Part A game phase
   */
  const handleStartPartA = useCallback(() => {
    setPhase('partA');
  }, []);

  /**
   * Handles phase transitions
   */
  const handleTransition = useCallback(() => {
    if (phase === 'transitionAB') {
      setPhase('partB');
    } else if (phase === 'transitionBA') {
      setPhase('partA');
    }
  }, [phase]);

  /**
   * Handles score updates from Part A
   */
  const handleScoreChange = useCallback((delta: number) => {
    setScore((prev) => prev + delta);
  }, []);

  /**
   * Handles RFB count updates from Part A
   */
  const handleRfbCountChange = useCallback((delta: number) => {
    setRfbCount((prev) => prev + delta);
  }, []);

  /**
   * Handles LFB count updates from Part A
   */
  const handleLfbCountChange = useCallback((delta: number) => {
    setLfbCount((prev) => prev + delta);
  }, []);

  /**
   * Handles W count updates from Part B
   */
  const handleWCountChange = useCallback((delta: number) => {
    setWCount((prev) => prev + delta);
  }, []);

  /**
   * Handles RFB count updates from Part B (when placing blocks)
   */
  const handlePartBRfbCountChange = useCallback((delta: number) => {
    setRfbCount((prev) => Math.max(0, prev + delta));
  }, []);

  /**
   * Handles LFB count updates from Part B (when placing blocks)
   */
  const handlePartBLfbCountChange = useCallback((delta: number) => {
    setLfbCount((prev) => Math.max(0, prev + delta));
  }, []);

  /**
   * Handles Part B end
   */
  const handlePartBEnd = useCallback(() => {
    setPhase('complete');
  }, []);

  /**
   * Determines if Part A phase is active or transitioning
   */
  const isPartAPhase = useMemo(
    () => phase === 'partA' || phase === 'transitionAB' || phase === 'idle',
    [phase]
  );

  /**
   * Renders completion screen
   */
  const renderCompletionScreen = useMemo(() => {
    if (phase !== 'complete') return null;

    const isSmallScreen = width < RESPONSIVE_BREAKPOINT;
    return (
      <View style={gameStyles.completeContainer}>
        <Text style={[gameStyles.completeText, { fontSize: isSmallScreen ? 32 : 42 }]}>
          LEVEL COMPLETE!
        </Text>
        <Text style={[gameStyles.completeScore, { fontSize: isSmallScreen ? 18 : 24 }]}>
          Final Score: {score}
        </Text>
      </View>
    );
  }, [phase, width, score]);

  return (
    <View style={gameStyles.container}>
      <GameHeader score={score} level={level} />

      <View style={gameStyles.gameArea}>
        {isPartAPhase ? (
          <PartAGrid
            phase={phase}
            rfbCount={rfbCount}
            lfbCount={lfbCount}
            wCount={wCount}
            onGridChange={setPartAGrid}
            onCurrentPieceChange={setCurrentPiece}
            onScoreChange={handleScoreChange}
            onRfbCountChange={handleRfbCountChange}
            onLfbCountChange={handleLfbCountChange}
            onPhaseChange={setPhase}
            onGameStartedChange={setGameStarted}
            onStartPartA={handleStartPartA}
            onTransition={handleTransition}
          />
        ) : (
          <PartBGrid
            rfbCount={rfbCount}
            lfbCount={lfbCount}
            wCount={wCount}
            onGridChange={setPartBGrid}
            onWCountChange={handleWCountChange}
            onRfbCountChange={handlePartBRfbCountChange}
            onLfbCountChange={handlePartBLfbCountChange}
            onScoreChange={handleScoreChange}
            onPartBEnd={handlePartBEnd}
          />
        )}
      </View>

      {renderCompletionScreen}
    </View>
  );
}
