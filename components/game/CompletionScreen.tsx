import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useGameContext } from '../../contexts/GameContext';
import { usePartAGridSize } from '../../hooks/usePartAGridSize';
import { useResponsive } from '../../hooks/useResponsive';
import { gameStyles } from '../../styles/styles';

interface CompletionScreenProps {
  score: number;
}

/**
 * Displays the level completion screen
 * Positioned the same way as Part B's "Continue" message overlay
 */
export default function CompletionScreen({ score }: CompletionScreenProps) {
  const { letter } = useResponsive();
  const game = useGameContext();
  const initialGridSize = usePartAGridSize();
  const partAGridWidth = game.partAGridWidth || initialGridSize;

  // Use same font size calculation as other overlay messages
  const overlayFontSize = useMemo(() => {
    const baseSize = letter * 1.2;
    const maxSizeFromGrid = partAGridWidth / 10;
    return Math.min(baseSize, maxSizeFromGrid);
  }, [letter, partAGridWidth]);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <Text
        style={[
          gameStyles.message,
          gameStyles.failForward,
          {
            fontSize: overlayFontSize, // Same size as TIME, CONTINUE?, FAIL, FAIL FORWARD?
            fontWeight: 'bold',
            textTransform: 'uppercase',
          },
        ]}
      >
        Level complete!
      </Text>
      <Text
        style={[
          gameStyles.message,
          gameStyles.failForward,
          {
            fontSize: overlayFontSize, // Same size as TIME, CONTINUE?, FAIL, FAIL FORWARD?
            fontWeight: 'bold',
            textTransform: 'uppercase',
            marginTop: 20,
          },
        ]}
      >
        Nice turn around!
      </Text>
    </View>
  );
}

