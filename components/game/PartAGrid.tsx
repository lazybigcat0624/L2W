import { GAME_COLORS, GRID_SIZE, PIECE_COLORS, Piece } from '@/constants/game';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

interface PartAGridProps {
  grid: number[][];
  currentPiece: Piece | null;
}

export default function PartAGrid({ grid, currentPiece }: PartAGridProps) {
  const { width, height } = useWindowDimensions();
  const availableWidth = Math.min(width - 40, 500); // Max width for larger screens
  const availableHeight = height * 0.45; // Use 45% of screen height for grid
  const cellSize = Math.max(
    10, // Minimum cell size
    Math.min(
      Math.floor(availableWidth / GRID_SIZE),
      Math.floor(availableHeight / GRID_SIZE)
    )
  );
  
  const renderCell = (row: number, col: number) => {
    let cellColor = GAME_COLORS.background;
    let borderColor = GAME_COLORS.gridLine;
    
    // Check if cell is part of current piece
    if (currentPiece) {
      const pieceRow = row - currentPiece.y;
      const pieceCol = col - currentPiece.x;
      
      if (
        pieceRow >= 0 &&
        pieceRow < currentPiece.cells.length &&
        pieceCol >= 0 &&
        pieceCol < currentPiece.cells[pieceRow].length &&
        currentPiece.cells[pieceRow][pieceCol]
      ) {
        cellColor = currentPiece.color;
        borderColor = GAME_COLORS.gridLine;
      }
    }
    
    // Check if cell is filled in grid
    if (grid[row] && grid[row][col] > 0) {
      cellColor = PIECE_COLORS[grid[row][col] - 1];
    }
    
    return (
      <View
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
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
  },
});

