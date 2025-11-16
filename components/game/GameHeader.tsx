import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { GAME_COLORS } from '@/constants/game';

interface GameHeaderProps {
  score: number;
  level: number;
}

export default function GameHeader({ score, level }: GameHeaderProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const isVerySmall = width < 320;
  const titleSize = isVerySmall ? 28 : isSmallScreen ? 36 : 48;
  const subtitleSize = isVerySmall ? 12 : isSmallScreen ? 16 : 20;
  const infoSize = isVerySmall ? 12 : isSmallScreen ? 14 : 18;
  
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { fontSize: titleSize }]}>L2W</Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>Learn to Win</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.score, { fontSize: infoSize }]}>Score: {score}</Text>
        <Text style={[styles.level, { fontSize: infoSize }]}>Level: {level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: GAME_COLORS.background,
    flexWrap: 'wrap',
  },
  titleContainer: {
    flex: 1,
    minWidth: 120,
  },
  title: {
    fontWeight: 'bold',
    color: GAME_COLORS.title,
  },
  subtitle: {
    color: GAME_COLORS.subtitle,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  score: {
    fontWeight: 'bold',
    color: GAME_COLORS.score,
  },
  level: {
    fontWeight: 'bold',
    color: GAME_COLORS.score,
  },
});

