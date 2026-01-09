import React from 'react';
import { View } from 'react-native';
import { gameStyles } from '../../../styles/styles';
import GameButton from '../GameButton';

interface PartBControlsProps {
  onLevelUp?: () => void;
  showLevelUp?: boolean;
  onContinue?: () => void;
  showContinue?: boolean;
}

/**
 * Renders Part B control buttons
 * Always maintains space for button to prevent layout shift (matching Part A)
 * Shows continue button when time-up stage reaches button phase
 * Shows level up button when Part B completion stage reaches button phase
 */
export default function PartBControls({ onLevelUp, showLevelUp, onContinue, showContinue }: PartBControlsProps) {
  return (
    <View style={gameStyles.controlsContainer}>
      {showContinue && onContinue ? (
        <GameButton title="Start" onPress={onContinue} />
      ) : showLevelUp && onLevelUp ? (
        <GameButton title="LEVEL UP" onPress={onLevelUp} />
      ) : (
        <View style={{ opacity: 0, pointerEvents: 'none' }}>
          <GameButton title="Start" onPress={() => {}} />
        </View>
      )}
    </View>
  );
}

