import React, { useState, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import { GAME_COLORS, GRID_SIZE } from '@/constants/game';

interface PartBGridProps {
  grid: number[][];
  onPlaceLBlock: (row: number, col: number, type: 'RFB' | 'LFB', rotation: number) => boolean;
  draggingPiece: { type: 'RFB' | 'LFB'; rotation: number } | null;
}

// Diamond cell grid - cross-diagonal layout
export default function PartBGrid({ grid, onPlaceLBlock, draggingPiece }: PartBGridProps) {
  const { width, height } = useWindowDimensions();
  const availableWidth = Math.min(width - 40, 500); // Max width for larger screens
  const availableHeight = height * 0.45; // Use 45% of screen height for grid
  const cellSize = Math.max(
    8, // Minimum cell size
    Math.min(
      Math.floor(availableWidth / (GRID_SIZE * 1.2)), // Account for diamond spacing
      Math.floor(availableHeight / (GRID_SIZE * 1.2))
    )
  );
  
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const gridContainerRef = useRef<View>(null);

  // Convert diamond grid coordinates to screen coordinates (isometric/diamond layout)
  const getDiamondPosition = (row: number, col: number) => {
    // Isometric projection: diamond cells arranged diagonally
    const offsetX = (col - row) * (cellSize * 0.707); // cos(45°) ≈ 0.707
    const offsetY = (col + row) * (cellSize * 0.5);
    return {
      x: offsetX,
      y: offsetY,
    };
  };


  const handleCellPress = (row: number, col: number) => {
    if (draggingPiece) {
      const success = onPlaceLBlock(row, col, draggingPiece.type, draggingPiece.rotation);
      if (success) {
        setSelectedCell(null);
      }
    } else {
      setSelectedCell({ row, col });
    }
  };

  // Simplified: Use tap-to-place for better reliability
  // Drag preview can be added later if needed

  const renderDiamondCell = (row: number, col: number) => {
    const position = getDiamondPosition(row, col);
    const isFilled = grid[row] && grid[row][col] > 0;
    const cellValue = grid[row]?.[col] || 0;
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    
    // Determine cell color based on value
    let cellColor = 'transparent';
    if (cellValue === 1) {
      cellColor = GAME_COLORS.lCounter; // RFB
    } else if (cellValue === 2) {
      cellColor = GAME_COLORS.jCounter; // LFB
    } else if (cellValue === 3) {
      cellColor = GAME_COLORS.title; // Pre-filled (architecture)
    }
    
    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.diamondCell,
          {
            left: position.x,
            top: position.y,
            width: cellSize,
            height: cellSize,
            backgroundColor: cellColor,
            borderColor: isSelected ? GAME_COLORS.failForward : GAME_COLORS.gridLine,
            borderWidth: isSelected ? 2 : 0.5,
          },
        ]}
        onPress={() => handleCellPress(row, col)}
        activeOpacity={0.7}
      />
    );
  };

  // Calculate grid container size
  const maxOffset = getDiamondPosition(GRID_SIZE - 1, GRID_SIZE - 1);
  const gridWidth = maxOffset.x + cellSize + 20;
  const gridHeight = maxOffset.y + cellSize + 20;


  return (
    <View style={styles.container}>
      <View
        ref={gridContainerRef}
        style={[styles.gridContainer, { width: gridWidth, height: gridHeight }]}
      >
        {Array.from({ length: GRID_SIZE }).map((_, row) =>
          Array.from({ length: GRID_SIZE }).map((_, col) => renderDiamondCell(row, col))
        )}
      </View>
      {draggingPiece && (
        <View style={styles.dragHint}>
          <Text style={styles.dragHintText}>Tap a cell to place the L-block</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    backgroundColor: GAME_COLORS.background,
    position: 'relative',
    alignSelf: 'center',
    marginVertical: 10,
  },
  diamondCell: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  dragHint: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dragHintText: {
    color: GAME_COLORS.failForward,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

