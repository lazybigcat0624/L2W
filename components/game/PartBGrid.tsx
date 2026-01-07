import { GRID_SIZE } from '@/constants/game';
import { usePartAGridSize } from '@/hooks/usePartAGridSize';
import { usePartBCompletionStage } from '@/hooks/usePartBCompletionStage';
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useGameContext } from '../../contexts/GameContext';
import { useResponsive } from '../../hooks/useResponsive';
import { gameStyles } from '../../styles/styles';
import GameButton from './GameButton';
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
import { usePartBTimer } from './partB/usePartBTimer';
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
  const [showTimeUpOverlay, setShowTimeUpOverlay] = useState(false);
  const [timeUpStage, setTimeUpStage] = useState<'time' | 'continue'>('time');
  const [bonusTimeSeconds, setBonusTimeSeconds] = useState(0);
  const [lastRewardedWCount, setLastRewardedWCount] = useState(0);
  const completionStage = usePartBCompletionStage(isComplete);
  const { letter } = useResponsive();

  // Timer hook - 2 minutes (120 seconds)
  const timer = usePartBTimer({
    isActive: game.isPartBPhase && !isComplete && !showTimeUpOverlay,
    initialTimeSeconds: 120,
    bonusTimeSeconds,
    onTimeUp: () => {
      setShowTimeUpOverlay(true);
      setTimeUpStage('time');
      // Transition from "TIME" to "CONTINUE?" after 1 second
      setTimeout(() => {
        setTimeUpStage('continue');
      }, 1000);
    },
  });

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

  // Completion checking hook - level ends when all RFBs and LFBs are turned into Ws
  usePartBCompletion({
    availableRfbCount: pieces.availableRfbCount,
    availableLfbCount: pieces.availableLfbCount,
    pieces: pieces.pieces,
    onPartBEnd: () => {
      setIsComplete(true);
      game.handlePartBEnd();
    },
  });

  // Handle "CONTINUE?" button press
  const handleContinue = () => {
    // Reset the grid (clear all pieces) but keep counters - gives users a clear grid
    pieces.resetGrid();
    // Reset the timer first - this will restart the countdown from 2 minutes
    timer.resetTimer();
    // Hide the time-up overlay - this will make isActive true and restart the timer
    setShowTimeUpOverlay(false);
    setTimeUpStage('time');
  };

  // Reward system: add bonus time when W-blocks are formed
  // Give 30 seconds bonus time for every 3 W-blocks formed
  React.useEffect(() => {
    if (game.wCount > 0 && game.wCount >= 3 && game.wCount > lastRewardedWCount) {
      const rewardThreshold = Math.floor(game.wCount / 3) * 3;
      if (rewardThreshold > lastRewardedWCount) {
        const bonusTime = 30; // 30 seconds bonus
        setBonusTimeSeconds((prev) => prev + bonusTime);
        timer.addBonusTime(bonusTime);
        setLastRewardedWCount(rewardThreshold);
      }
    }
  }, [game.wCount, lastRewardedWCount, timer]);

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
      
      {/* Timer display */}
      {game.isPartBPhase && !isComplete && (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Text style={[gameStyles.message, { fontSize: letter * 0.9, color: timer.timeRemaining < 60 ? '#FF6B6B' : '#FFFFFF' }]}>
            Time: {timer.formattedTime}
          </Text>
        </View>
      )}

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
        
        {/* Time-up overlay */}
        {showTimeUpOverlay && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
          >
            {timeUpStage === 'time' && (
              <Text
                style={[
                  gameStyles.message,
                  gameStyles.failForward,
                  {
                    fontSize: letter * 1.2,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    color: '#FF0000', // Red text
                    marginBottom: 20,
                  },
                ]}
              >
                TIME
              </Text>
            )}
            {timeUpStage === 'continue' && (
              <>
                <Text
                  style={[
                    gameStyles.message,
                    gameStyles.failForward,
                    {
                      fontSize: letter * 1.2,
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: '#00FF00', // Green text
                      marginBottom: 20,
                    },
                  ]}
                >
                  CONTINUE?
                </Text>
                <GameButton title="CONTINUE?" onPress={handleContinue} />
              </>
            )}
          </View>
        )}

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
