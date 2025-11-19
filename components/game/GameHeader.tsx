import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gameStyles } from '../../styles/styles';

interface GameHeaderProps {
  score: number;
  level: number;
}

export default function GameHeader({ score, level }: GameHeaderProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallScreen = width < 400;
  const isVerySmall = width < 320;
  const titleSize = isVerySmall ? 28 : isSmallScreen ? 36 : 48;
  const subtitleSize = isVerySmall ? 12 : isSmallScreen ? 16 : 20;
  const infoSize = isVerySmall ? 12 : isSmallScreen ? 14 : 18;
  
  return (
    <View style={[gameStyles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={gameStyles.titleContainer}>
        <Text style={[gameStyles.title, { fontSize: titleSize }]}>L2W</Text>
        <Text style={[gameStyles.subtitle, { fontSize: subtitleSize }]}>Learn to Win</Text>
      </View>
      <View style={gameStyles.infoContainer}>
        <Text style={[gameStyles.score, { fontSize: infoSize }]}>Score: {score}</Text>
        <Text style={[gameStyles.level, { fontSize: infoSize }]}>Level: {level}</Text>
      </View>
    </View>
  );
}

