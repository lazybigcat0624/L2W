import { GRID_SIZE } from '@/constants/game';
import { usePartAGridSize } from '@/hooks/usePartAGridSize';
import { usePartBCompletionStage } from '@/hooks/usePartBCompletionStage';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useGameContext } from '../../contexts/GameContext';
import { gameStyles } from '../../styles/styles';
import { useResponsive } from '../../hooks/useResponsive';
import GameInfo from './GameInfo';
import { DraggingOverlay } from './partB/DraggingOverlay';
import { GameGrid } from './partB/GameGrid';
import PartBControls from './partB/PartBControls';
import { PartBCounters } from './partB/PartBCounters';
import { usePartBCompletion } from './partB/usePartBCompletion';
import { usePartBConflict } from './partB/usePartBConflict';
import { usePartBDragDrop } from './partB/usePartBDragDrop';
import { usePartBGridLayout } from './partB/usePartBGridLayout';
import { usePartBPieces } from './partB/usePartBPieces';
import { getRotatedPattern } from './partB/utils';

/**
 * Part B Grid Component
 * 
 * Uses context for state management - no prop drilling
 * Separated concerns: pieces, drag/drop, conflicts, layout, completion
 */
export default function PartBGrid() {
  const game = useGameContext();
  const [hiddenPieceId, setHiddenPieceId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const completionStage = usePartBCompletionStage(isComplete);
  const { letter } = useResponsive();

  // Piece management hook
  const pieces = usePartBPieces({
    initialRfbCount: game.rfbCount,
    initialLfbCount: game.lfbCount,
    level: game.level,
    onRfbCountChange: game.updateRfbCount,
    onLfbCountChange: game.updateLfbCount,
    onWCountChange: game.updateWCount,
    onScoreChange: game.updateScore,
  });

  // Conflict management hook
  const conflict = usePartBConflict({ level: game.level, pieces: pieces.pieces });

  // Grid layout hook
  const layout = usePartBGridLayout();

  // Completion checking hook
  usePartBCompletion({
    availableRfbCount: pieces.availableRfbCount,
    availableLfbCount: pieces.availableLfbCount,
    pieces: pieces.pieces,
    onPartBEnd: () => {
      setIsComplete(true);
      game.handlePartBEnd();
    },
  });

  // Drag and drop hook
  const dragDrop = usePartBDragDrop({
    pieces: pieces.pieces,
    availableRfbCount: pieces.availableRfbCount,
    availableLfbCount: pieces.availableLfbCount,
    gridBounds: layout.gridBounds,
    cellSize: layout.cellSize,
    canInteractWithPiece: conflict.canInteractWithPiece,
    convertPointToGridCell: layout.convertPointToGridCell,
    onPlaceNewPiece: pieces.placeNewPiece,
    onMoveExistingPiece: pieces.moveExistingPiece,
    onRotatePiece: pieces.rotatePiece,
    onRemovePiece: pieces.removePiece,
    onUpdateDraggingPiece: undefined, // Handled internally
    onSetHiddenPieceId: setHiddenPieceId,
    onSetConflictState: conflict.setConflictState,
    onClearConflict: conflict.clearConflict,
    findPieceAtCell: pieces.findPieceAtCell,
  });

  // Display grid with hidden piece removed during drag
  const displayGrid = useMemo(() => {
    if (!hiddenPieceId) {
      return pieces.baseGrid;
    }

    const hiddenPiece = pieces.pieces.find((piece) => piece.id === hiddenPieceId);
    if (!hiddenPiece) {
      return pieces.baseGrid;
    }

    const clone = pieces.baseGrid.map((row) => [...row]);
    const pattern = getRotatedPattern(hiddenPiece.type, hiddenPiece.rotation);

    pattern.forEach(([dy, dx]) => {
      const row = hiddenPiece.anchorRow + dy;
      const col = hiddenPiece.anchorCol + dx;

      if (row >= 0 && col >= 0 && row < GRID_SIZE && col < GRID_SIZE) {
        clone[row][col] = 0;
      }
    });

    return clone;
  }, [pieces.baseGrid, hiddenPieceId, pieces.pieces]);

  // Get blocking cell set for visual feedback
  const blockingCellSet = conflict.getBlockingCellSet(pieces.pieces);
  const partAGridWidth = usePartAGridSize();

  // Show overlay for completion stages (same pattern as Part A)
  const showCompletionOverlay = isComplete && !!completionStage;
  const showLevelComplete = completionStage === 'levelComplete';
  const showNiceTurnAround = completionStage === 'niceTurnAround' || completionStage === 'button';

  return (
    <View ref={layout.containerRef} onLayout={layout.handleContainerLayout} >
      <GameInfo level={game.level} score={game.score} />

      <View
        style={[
          gameStyles.gridWrapper,
          {
            // Height should match the diagonal of the rotated grid
            minHeight: partAGridWidth,
            minWidth: partAGridWidth,
            position: 'relative',
          },
        ]}
        {...dragDrop.boardPanResponder.panHandlers}
      >
        <GameGrid
          displayGrid={displayGrid}
          cellSize={layout.cellSize}
          conflictCellSet={conflict.conflictCellSet}
          blockingCellSet={blockingCellSet}
          gridRef={layout.gridRef}
          onLayout={layout.handleGridLayout}
        />
        
        {showCompletionOverlay && (
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
            {showLevelComplete && (
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
                Level Complete!
              </Text>
            )}
            {showNiceTurnAround && (
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
                Nice turn around!
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={{ marginTop: 4 }}>
        <PartBCounters
          rfbCount={pieces.availableRfbCount}
          lfbCount={pieces.availableLfbCount}
          wCount={game.wCount}
          rfbPanHandlers={dragDrop.rfbPanResponder.panHandlers}
          lfbPanHandlers={dragDrop.lfbPanResponder.panHandlers}
        />
      </View>

      <PartBControls 
        onLevelUp={game.handleLevelUp} 
        showLevelUp={completionStage === 'button'} 
      />

      <DraggingOverlay
        draggingPiece={dragDrop.draggingPiece}
        containerOffset={layout.containerOffset}
        cellSize={layout.cellSize}
      />
    </View>
  );
}
