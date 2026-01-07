import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gameStyles } from '../../styles/styles';
import { useResponsive } from '../../hooks/useResponsive';
import Logo from './Logo';

/**
 * Game header component - displays logo, title and subtitle
 */
export default function GameHeader() {
  const insets = useSafeAreaInsets();
  const { title, subtitle } = useResponsive();
  
  return (
    <View style={[gameStyles.header, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={gameStyles.titleContainer}>
        <Logo size={60} />
        <Text style={[gameStyles.title, { fontSize: title }]}>L2W</Text>
        <Text style={[gameStyles.subtitle, { fontSize: subtitle }]}>Learn to Win</Text>
      </View>
    </View>
  );
}

