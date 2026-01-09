import { GAME_COLORS, GamePhase, GRID_SIZE, Piece, PIECE_COLORS } from '@/constants/game';
import { usePartAGridSize } from '@/hooks/usePartAGridSize';
import { TransitionStage } from '@/hooks/useTransitionStage';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useResponsive } from '../../../hooks/useResponsive';
import { gameStyles } from '../../../styles/styles';

const MIN_CELL_SIZE = 10;
const MAX_GRID_WIDTH = 500;
const GRID_PADDING = 40;

interface PartAGameGridProps {
  grid: number[][];
  currentPiece: Piece | null;
  phase: GamePhase;
  transitionStage?: TransitionStage;
  onGridSizeChange?: (size: number) => void;
}

/**
 * Renders the Part A game grid with cells and transition messages overlay
 */
export default function PartAGameGrid({ grid, currentPiece, phase, transitionStage, onGridSizeChange }: PartAGameGridProps) {
  const { letter } = useResponsive();
  const { width } = useWindowDimensions();
  const initialGridSize = usePartAGridSize();
  const [partAGridWidth, setPartAGridWidth] = useState<number>(initialGridSize);
  const cellSize = useMemo(() => (partAGridWidth - 2) / GRID_SIZE, [partAGridWidth]);
  const gridContainerRef = useRef<View | null>(null);

  const handleLayout = useCallback(() => {
    if (gridContainerRef.current) {
      gridContainerRef.current.measureInWindow((x, y, measuredWidth, measuredHeight) => {
        // Calculate grid size using the same logic as usePartAGridSize
        const availableWidth = Math.min(width - GRID_PADDING, MAX_GRID_WIDTH);
        // Use the smaller of available width or measured height
        const calculatedSize = Math.max(MIN_CELL_SIZE * GRID_SIZE, Math.min(availableWidth, measuredHeight));
        setPartAGridWidth(calculatedSize);
        // Notify parent of the calculated size
        onGridSizeChange?.(calculatedSize);
      });
    }
  }, [width, onGridSizeChange]);

  const getCellColors = (row: number, col: number) => {
    // Check if cell is part of the current falling piece
    if (currentPiece) {
      const pieceRow = row - currentPiece.y;
      const pieceCol = col - currentPiece.x;

      const isInPieceBounds =
        pieceRow >= 0 &&
        pieceRow < currentPiece.cells.length &&
        pieceCol >= 0 &&
        pieceCol < currentPiece.cells[pieceRow]?.length;

      const isPartOfPiece = isInPieceBounds && currentPiece.cells[pieceRow][pieceCol] === 1;

      if (isPartOfPiece) {
        return {
          backgroundColor: currentPiece.color,
          borderColor: GAME_COLORS.gridLine,
        };
      }
    }

    // Check if cell contains a placed piece
    const gridValue = grid[row]?.[col] ?? 0;
    if (gridValue > 0 && gridValue <= PIECE_COLORS.length) {
      return {
        backgroundColor: PIECE_COLORS[gridValue - 1],
        borderColor: GAME_COLORS.gridLine,
      };
    }

    // Empty cell
    return {
      backgroundColor: GAME_COLORS.background,
      borderColor: GAME_COLORS.gridLineFaded,
    };
  };

  const renderCell = (row: number, col: number) => {
    const { backgroundColor, borderColor } = getCellColors(row, col);

    return (
      <View
        key={`${row}-${col}`}
        style={[
          gameStyles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor,
            borderColor,
          },
        ]}
      />
    );
  };

  const renderRow = (row: number) => (
    <View key={row} style={gameStyles.row}>
      {Array.from({ length: GRID_SIZE }, (_, col) => renderCell(row, col))}
    </View>
  );

  // Calculate responsive font size for overlay messages
  // Takes into account window size and grid width to prevent wrapping
  const overlayFontSize = useMemo(() => {
    // Base size from responsive hook (already accounts for window width)
    const baseSize = letter * 1.2;
    // Limit based on grid width (estimate ~10-12 characters width needed)
    const maxSizeFromGrid = partAGridWidth / 10;
    // Use the smaller of the two to prevent wrapping
    return Math.min(baseSize, maxSizeFromGrid);
  }, [letter, partAGridWidth]);

  const overlayFontSizeLong = useMemo(() => {
    // Match PartBGrid's overlayFontSize calculation for consistency
    // "FAIL FORWARD?" should match "TIME" and "CONTINUE?" size
    const baseSize = letter * 1.2;
    const maxSizeFromGrid = partAGridWidth / 10; // Use same divisor as overlayFontSize for consistency
    return Math.min(baseSize, maxSizeFromGrid);
  }, [letter, partAGridWidth]);

  // Show overlay for all transition stages (including when the button appears)
  const showMessage = phase === 'transitionAB' && !!transitionStage;
  const showFail = transitionStage === 'redFail';
  const showFailForward = transitionStage === 'greenFailForward' || transitionStage === 'button';

  return (
    <View 
      ref={gridContainerRef}
      onLayout={handleLayout}
      style={{ position: 'relative', minHeight: partAGridWidth, minWidth: partAGridWidth, flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={gameStyles.gridContainer}>
        {Array.from({ length: GRID_SIZE }, (_, row) => renderRow(row))}
      </View>
      
      {showMessage && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          {showFail && (
            <Text
              style={[
                gameStyles.message,
                gameStyles.fail,
                {
                  fontSize: overlayFontSize, // Same size as TIME
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                },
              ]}
            >
              FAIL
            </Text>
          )}
          {showFailForward && (
            <Text
              style={[
                gameStyles.message,
                gameStyles.failForward,
                {
                  fontSize: overlayFontSize, // Same size as TIME and CONTINUE? for consistency
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                },
              ]}
            >
              FAIL FORWARD?
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

