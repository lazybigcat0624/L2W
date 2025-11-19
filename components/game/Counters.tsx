import { GAME_COLORS } from '@/constants/game';
import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { gameStyles } from '../../styles/styles';

interface CountersProps {
  rfbCount: number; // Right-Facing Blocks (L)
  lfbCount: number; // Left-Facing Blocks (J)
  wCount: number; // W-Blocks
}

export default function Counters({ rfbCount, lfbCount, wCount }: CountersProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isVerySmall = width < 320;
  const letterSize = isVerySmall ? 20 : isSmallScreen ? 28 : 36;
  const numberSize = isVerySmall ? 12 : isSmallScreen ? 14 : 16;
  
  return (
    <View style={gameStyles.countersContainerPartA}>
      <View style={gameStyles.counterItem}>
        <Text style={[gameStyles.counterLetterText, { color: GAME_COLORS.lCounter, fontSize: letterSize }]}>
          L
        </Text>
        <Text style={[gameStyles.counterNumberText, { color: GAME_COLORS.lCounter, fontSize: numberSize }]}>
          {rfbCount}
        </Text>
      </View>
      <View style={gameStyles.counterItem}>
        <Text style={[gameStyles.counterLetterText, { color: GAME_COLORS.jCounter, fontSize: letterSize }]}>
          ⅃
        </Text>
        <Text style={[gameStyles.counterNumberText, { color: GAME_COLORS.jCounter, fontSize: numberSize }]}>
          {lfbCount}
        </Text>
      </View>
      <View style={gameStyles.counterItem}>
        <Text style={[gameStyles.counterLetterText, { color: GAME_COLORS.wCounter, fontSize: letterSize }]}>
          W
        </Text>
        <Text style={[gameStyles.counterNumberText, { color: GAME_COLORS.wCounter, fontSize: numberSize }]}>
          {wCount}
        </Text>
      </View>
    </View>
  );
}

