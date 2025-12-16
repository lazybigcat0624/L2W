import React from 'react';
import { View } from 'react-native';
import { gameStyles } from '../../../styles/styles';
import GameButton from '../GameButton';

interface PartBControlsProps {
  onLevelUp?: () => void;
  showLevelUp?: boolean;
}

/**
 * Renders Part B control buttons
 * Always maintains space for button to prevent layout shift (matching Part A)
 * Shows level up button when Part B completion stage reaches button phase
 */
export default function PartBControls({ onLevelUp, showLevelUp }: PartBControlsProps) {
  return (
    <View style={gameStyles.controlsContainer}>
      {showLevelUp && onLevelUp ? (
        <GameButton title="LEVEL UP?" onPress={onLevelUp} />
      ) : (
        <View style={{ opacity: 0, pointerEvents: 'none' }}>
          <GameButton title="LEVEL UP?" onPress={() => {}} />
        </View>
      )}
    </View>
  );
}

