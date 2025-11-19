import React from 'react';
import { Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { gameStyles } from '../../styles/styles';

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
        gameStyles.button,
        { paddingHorizontal, paddingVertical },
        disabled && gameStyles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[gameStyles.buttonText, { fontSize }]}>{title}</Text>
    </TouchableOpacity>
  );
}

