import React from 'react';
import { View } from 'react-native';
import { GameProvider, useGameContext } from '../../contexts/GameContext';
import { gameStyles } from '../../styles/styles';
import CompletionScreen from './CompletionScreen';
import GameHeader from './GameHeader';
import PartAGrid from './PartAGrid';
import PartBGrid from './PartBGrid';

/**
 * Main game component - uses context for state management
 */
function L2WGameContent() {
  const game = useGameContext();

  return (
    <View style={gameStyles.container}>
      <GameHeader />

      <View style={gameStyles.gameArea}>
        {game.isPartAPhase ? (
          <PartAGrid />
        ) : game.isPartBPhase ? (
          <PartBGrid />
        ) : null}
      </View>

      {game.isComplete && <CompletionScreen score={game.score} />}
    </View>
  );
}

/**
 * Main game component with provider
 */
export default function L2WGame() {
  return (
    <GameProvider>
      <L2WGameContent />
    </GameProvider>
  );
}
