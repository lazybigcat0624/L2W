import React from 'react';
import { TouchableOpacity, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { GAME_COLORS } from '@/constants/game';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function GameButton({ title, onPress, disabled }: GameButtonProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;
  const fontSize = isSmallScreen ? 20 : 24;
  const paddingHorizontal = isSmallScreen ? 30 : 40;
  const paddingVertical = isSmallScreen ? 12 : 15;
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { paddingHorizontal, paddingVertical },
        disabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { fontSize }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: GAME_COLORS.startButton,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: 'bold',
    color: GAME_COLORS.background,
    textTransform: 'uppercase',
  },
});

