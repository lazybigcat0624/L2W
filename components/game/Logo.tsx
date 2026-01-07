import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Logo component displaying the diamond pattern
 * 14 diamonds arranged in a V-shape pattern (inverted triangle)
 */
export default function Logo({ size = 60 }: { size?: number }) {
  const diamondSize = size / 6;
  const colors = [
    ['#FF0000', '#0066FF', '#FFA500', '#FFFF00', '#FFA500'], // Row 1: red, blue, orange, yellow, orange
    ['#FF0000', '#FF0000', '#FFA500', '#FFA500'], // Row 2: red, red, orange, orange
    ['#FF0000', '#800080', '#FFA500'], // Row 3: red, purple, orange
    ['#800080', '#800080'], // Row 4: purple, purple
  ];

  const renderDiamond = (color: string, index: number, rowIndex: number) => {
    const rowLength = colors[rowIndex].length;
    const totalRows = colors.length;
    const maxRowLength = Math.max(...colors.map(row => row.length));
    const offsetX = (maxRowLength - rowLength) * diamondSize * 0.5;
    const x = index * diamondSize + offsetX;
    const y = rowIndex * diamondSize * 0.9; // Vertical spacing

    return (
      <View
        key={`${rowIndex}-${index}`}
        style={[
          styles.diamond,
          {
            width: diamondSize,
            height: diamondSize,
            backgroundColor: color,
            left: x,
            top: y,
            borderColor: '#E0E0E0',
            borderWidth: 0.5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size * 0.8,
        },
      ]}
    >
      {colors.map((row, rowIndex) =>
        row.map((color, index) => renderDiamond(color, index, rowIndex))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  diamond: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
});

