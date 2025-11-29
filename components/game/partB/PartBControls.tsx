import React from 'react';
import { View } from 'react-native';
import { gameStyles } from '../../../styles/styles';
import GameButton from '../GameButton';

interface PartBControlsProps {
  onRestart?: () => void;
  showRestart?: boolean;
}

/**
 * Renders Part B control buttons
 * Always maintains space for button to prevent layout shift (matching Part A)
 * Shows restart button when Part B is complete
 */
export default function PartBControls({ onRestart, showRestart }: PartBControlsProps) {
  return (
    <View style={gameStyles.controlsContainer}>
      {showRestart && onRestart ? (
        <GameButton title="RESTART" onPress={onRestart} />
      ) : (
        <View style={{ opacity: 0, pointerEvents: 'none' }}>
          <GameButton title="RESTART" onPress={() => {}} />
        </View>
      )}
    </View>
  );
}

