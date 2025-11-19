import { GAME_COLORS, GRID_SIZE } from '@/constants/game';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const CELL_COLOR_MAP: Record<number, string> = {
  0: GAME_COLORS.background,
  1: GAME_COLORS.lCounter, // Right-facing block placement
  2: GAME_COLORS.jCounter, // Left-facing block placement
  3: GAME_COLORS.subtitle, // Pre-filled architecture cells
};

export default function PartBGrid() {
  const { width, height } = useWindowDimensions();
  const availableWidth = Math.min(width - 40, 500);
  const availableHeight = height * 0.45;
  const rotationFactor = Math.SQRT2; // 1.414…
  const adjustedWidth = Math.floor(availableWidth / rotationFactor);
  const adjustedHeight = Math.floor(availableHeight / rotationFactor);
  const cellSize = Math.max(
    10,
    Math.min(
      Math.floor(adjustedWidth / GRID_SIZE),
      Math.floor(adjustedHeight / GRID_SIZE),
    ),
  );

  const renderCell = (row: number, col: number) => {
    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: GAME_COLORS.background,
            borderColor: GAME_COLORS.gridLineFaded,
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: GRID_SIZE }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: GRID_SIZE }).map((_, col) => renderCell(row, col))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    backgroundColor: GAME_COLORS.background,
    borderWidth: 1,
    borderColor: GAME_COLORS.gridLine,
    transform: [{ rotate: '45deg' }],
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
  },
});