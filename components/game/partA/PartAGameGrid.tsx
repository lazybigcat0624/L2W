import { GAME_COLORS, GamePhase, GRID_SIZE, Piece, PIECE_COLORS } from '@/constants/game';
import { usePartAGridSize } from '@/hooks/usePartAGridSize';
import { TransitionStage } from '@/hooks/useTransitionStage';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useResponsive } from '../../../hooks/useResponsive';
import { gameStyles } from '../../../styles/styles';

interface PartAGameGridProps {
  grid: number[][];
  currentPiece: Piece | null;
  phase: GamePhase;
  transitionStage?: TransitionStage;
}

/**
 * Renders the Part A game grid with cells and transition messages overlay
 */
export default function PartAGameGrid({ grid, currentPiece, phase, transitionStage }: PartAGameGridProps) {
  const { letter } = useResponsive();
  const partAGridWidth = usePartAGridSize();
  const cellSize = useMemo(() => (partAGridWidth - 2) / GRID_SIZE, [partAGridWidth]);

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

  // Show overlay for all transition stages (including when the button appears)
  const showMessage = phase === 'transitionAB' && !!transitionStage;
  const showFail = transitionStage === 'redFail';
  const showFailForward = transitionStage === 'greenFailForward' || transitionStage === 'button';

  return (
    <View style={{ position: 'relative', minHeight: partAGridWidth, minWidth: partAGridWidth }}>
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
                  fontSize: letter * 1.2,
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
                  fontSize: letter * 1.2,
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

