import { GamePhase } from '@/constants/game';
import { TransitionStage } from '@/hooks/useTransitionStage';
import React from 'react';
import { View } from 'react-native';
import { gameStyles } from '../../../styles/styles';
import GameButton from '../GameButton';

interface PartAControlsProps {
  phase: GamePhase;
  transitionStage: TransitionStage;
  onStart: () => void;
  onTransition: () => void;
}

/**
 * Renders Part A control buttons
 * Messages are now displayed on the grid overlay
 * Always maintains space for button to prevent layout shift
 */
export default function PartAControls({ phase, transitionStage, onStart, onTransition }: PartAControlsProps) {
  const showIdleButton = phase === 'idle';
  const showTransitionButton = phase === 'transitionAB' && transitionStage === 'button';

  return (
    <View style={gameStyles.controlsContainer}>
      {showIdleButton && <GameButton title="START" onPress={onStart} />}
      {showTransitionButton && <GameButton title="START" onPress={onTransition} />}
      {!showIdleButton && !showTransitionButton && (
        <View style={{ opacity: 0, pointerEvents: 'none' }}>
          <GameButton title="START" onPress={() => {}} />
        </View>
      )}
    </View>
  );
}

