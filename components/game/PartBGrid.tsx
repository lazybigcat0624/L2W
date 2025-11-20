import { GAME_COLORS, GRID_SIZE } from '@/constants/game';
import { createEmptyGrid } from '@/utils/gameLogic';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { gameStyles } from '../../styles/styles';

// Constants
const MIN_CELL_SIZE = 10;
const MAX_GRID_WIDTH = 500;
const GRID_PADDING = 20;
const GRID_ROTATION_DEGREES = 45;
const ROTATION_FACTOR = Math.SQRT2; // 1.414... for 45-degree rotation

interface PartBGridProps {
  rfbCount: number;
  lfbCount: number;
  wCount: number;
  onGridChange: (newGrid: number[][]) => void;
  onWCountChange?: (delta: number) => void;
  onRfbCountChange?: (delta: number) => void;
  onLfbCountChange?: (delta: number) => void;
  onPartBEnd?: () => void;
}

interface CounterSizes {
  letter: number;
  number: number;
  square: number;
}

/**
 * PartBGrid Component
 *
 * Displays:
 * - Diagonal grid (rotated 45 degrees)
 * - Counters for RFB, LFB, and W
 */
export default function PartBGrid({
  rfbCount,
  lfbCount,
  wCount,
  onGridChange,
}: PartBGridProps) {
  const { width } = useWindowDimensions();

  // Initialize empty grid
  const [grid] = useState<number[][]>(() => createEmptyGrid());

  // Notify parent of grid changes
  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  /**
   * Calculates optimal cell size based on available space
   */
  const cellSize = useMemo(() => {
    const availableWidth = Math.min(width - GRID_PADDING, MAX_GRID_WIDTH);
    const availableHeight = availableWidth;
    const adjustedWidth = Math.floor(availableWidth / ROTATION_FACTOR);
    const adjustedHeight = Math.floor(availableHeight / ROTATION_FACTOR);

    return Math.max(
      MIN_CELL_SIZE,
      Math.min(Math.floor(adjustedWidth / GRID_SIZE), Math.floor(adjustedHeight / GRID_SIZE))
    );
  }, [width]);

  /**
   * Calculate responsive counter sizes
   */
  const counterSizes = useMemo((): CounterSizes => {
    const isSmallScreen = width < 400;
    const isVerySmall = width < 320;

    return {
      letter: isVerySmall ? 20 : isSmallScreen ? 28 : 36,
      number: isVerySmall ? 14 : isSmallScreen ? 18 : 22,
      square: isVerySmall ? 30 : isSmallScreen ? 40 : 50,
    };
  }, [width]);

  /**
   * Renders a counter button (RFB, LFB, or W)
   */
  const renderCounter = (
    type: 'RFB' | 'LFB' | 'W',
    count: number,
    color: string,
    symbol: string
  ) => {
    const { letter, number, square } = counterSizes;

    return (
      <View style={gameStyles.counter}>
        <View
          style={[
            gameStyles.counterSquare,
            {
              width: square,
              height: square,
              borderColor: type === 'W' ? '' : color,
            },
          ]}
        >
          <Text style={[gameStyles.counterLetter, { color, fontSize: letter }]}>{symbol}</Text>
        </View>
        <Text style={[gameStyles.counterNumber, { color, fontSize: number }]}>{count}</Text>
      </View>
    );
  };

  /**
   * Renders a single grid cell
   */
  const renderCell = (row: number, col: number) => {
    return (
      <View
        key={`${row}-${col}`}
        style={[
          gameStyles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: GAME_COLORS.background,
            borderColor: GAME_COLORS.gridLineFaded,
            borderWidth: 0.5,
          },
        ]}
      />
    );
  };

  /**
   * Renders a row of grid cells
   */
  const renderRow = (row: number) => (
    <View key={row} style={gameStyles.row}>
      {Array.from({ length: GRID_SIZE }, (_, col) => renderCell(row, col))}
    </View>
  );

  return (
    <>
      <View style={gameStyles.gridWrapper}>
        <View
          style={[
            gameStyles.gridContainerRotated,
            {
              transform: [{ rotate: `${GRID_ROTATION_DEGREES}deg` }],
            },
          ]}
        >
          {Array.from({ length: GRID_SIZE }, (_, row) => renderRow(row))}
        </View>
      </View>

      <View style={gameStyles.countersContainer}>
        {renderCounter('RFB', rfbCount, GAME_COLORS.lCounter, 'L')}
        {renderCounter('LFB', lfbCount, GAME_COLORS.jCounter, '⅃')}
        {renderCounter('W', wCount, GAME_COLORS.wCounter, 'W')}
      </View>
    </>
  );
}
