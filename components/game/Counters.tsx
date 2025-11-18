import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { GAME_COLORS } from '@/constants/game';

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
    <View style={styles.container}>
      <View style={styles.counter}>
        <Text style={[styles.letter, { color: GAME_COLORS.lCounter, fontSize: letterSize }]}>L</Text>
        <Text style={[styles.number, { color: GAME_COLORS.lCounter, fontSize: numberSize }]}>{rfbCount}</Text>
      </View>
      <View style={styles.counter}>
        <Text style={[styles.letter, { color: GAME_COLORS.jCounter, fontSize: letterSize }]}>⅃</Text>
        <Text style={[styles.number, { color: GAME_COLORS.jCounter, fontSize: numberSize }]}>{lfbCount}</Text>
      </View>
      <View style={styles.counter}>
        <Text style={[styles.letter, { color: GAME_COLORS.wCounter, fontSize: letterSize }]}>W</Text>
        <Text style={[styles.number, { color: GAME_COLORS.wCounter, fontSize: numberSize }]}>{wCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: GAME_COLORS.background,
  },
  counter: {
    alignItems: 'center',
  },
  letter: {
    fontWeight: 'bold',
  },
  number: {
    fontWeight: 'bold',
    marginTop: 4,
  },
});

