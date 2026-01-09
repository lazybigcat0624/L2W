import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, type PanResponderInstance } from 'react-native';
import { BLOCK_CENTER_OFFSET, MOVE_THRESHOLD_PX, TAP_THRESHOLD_PX } from './constants';
import type { BlockType, DragState, GridBounds, PieceRotation, PieceState } from './types';

interface UsePartBDragDropProps {
  pieces: PieceState[];
  availableRfbCount: number;
  availableLfbCount: number;
  gridBounds: GridBounds | null;
  cellSize: number;
  canInteractWithPiece: (pieceId?: string) => boolean;
  convertPointToGridCell: (pageX: number, pageY: number) => { row: number; col: number } | null;
  onPlaceNewPiece: (
    type: BlockType,
    anchorRow: number,
    anchorCol: number,
    rotation: PieceRotation,
    onConflict?: (conflicts: Array<{ row: number; col: number }>, blockingPieceIds: string[]) => void
  ) => boolean;
  onMoveExistingPiece: (
    pieceId: string,
    anchorRow: number,
    anchorCol: number,
    onConflict?: (conflicts: Array<{ row: number; col: number }>, blockingPieceIds: string[]) => void
  ) => boolean;
  onRotatePiece: (
    pieceId: string,
    onConflict?: (conflicts: Array<{ row: number; col: number }>, blockingPieceIds: string[]) => void
  ) => void;
  onRemovePiece: (pieceId: string) => void;
  onUpdateDraggingPiece?: (dragState: DragState | null) => void;
  onSetHiddenPieceId: (pieceId: string | null) => void;
  onSetConflictState: (payload: {
    pieceId: string | null;
    cells: Array<{ row: number; col: number }>;
    blockingPieceIds: string[];
  }) => void;
  onClearConflict: () => void;
  findPieceAtCell: (row: number, col: number) => PieceState | undefined;
}

/**
 * Hook that manages drag and drop logic for Part B
 * Handles pan responders for counters and board interactions
 */
export function usePartBDragDrop({
  pieces,
  availableRfbCount,
  availableLfbCount,
  gridBounds,
  cellSize,
  canInteractWithPiece,
  convertPointToGridCell,
  onPlaceNewPiece,
  onMoveExistingPiece,
  onRotatePiece,
  onRemovePiece,
  onUpdateDraggingPiece,
  onSetHiddenPieceId,
  onSetConflictState,
  onClearConflict,
  findPieceAtCell,
}: UsePartBDragDropProps) {
  const draggingPieceRef = useRef<DragState | null>(null);
  const [draggingPiece, setDraggingPiece] = useState<DragState | null>(null);

  const updateDraggingPiece = useCallback(
    (next: DragState | null) => {
      draggingPieceRef.current = next;
      setDraggingPiece(next);
      onUpdateDraggingPiece?.(next);
    },
    [onUpdateDraggingPiece]
  );

  const handleDrop = useCallback(
    (dragState: DragState, pageX: number, pageY: number) => {
      const cell = convertPointToGridCell(pageX, pageY);

      if (!cell) {
        // Dropped outside grid - remove the piece if it's from the board
        if (dragState.source === 'board' && dragState.pieceId) {
          onRemovePiece(dragState.pieceId);
          onClearConflict();
          return true;
        }
        return false;
      }

      const anchorRow = cell.row - dragState.offsetRow;
      const anchorCol = cell.col - dragState.offsetCol;

      if (dragState.source === 'counter') {
        return onPlaceNewPiece(dragState.type, anchorRow, anchorCol, dragState.rotation, (conflicts, blockingPieceIds) => {
          onSetConflictState({ pieceId: null, cells: conflicts, blockingPieceIds });
        });
      }

      if (dragState.source === 'board' && dragState.pieceId) {
        return onMoveExistingPiece(dragState.pieceId, anchorRow, anchorCol, (conflicts, blockingPieceIds) => {
          onSetConflictState({ pieceId: dragState.pieceId ?? null, cells: conflicts, blockingPieceIds });
        });
      }

      return false;
    },
    [convertPointToGridCell, onMoveExistingPiece, onPlaceNewPiece, onRemovePiece, onSetConflictState, onClearConflict]
  );

  const createCounterPanResponder = useCallback(
    (type: BlockType) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          canInteractWithPiece() && (type === 'RFB' ? availableRfbCount > 0 : availableLfbCount > 0),
        onPanResponderGrant: (evt) => {
          updateDraggingPiece({
            source: 'counter',
            type,
            rotation: 0,
            offsetRow: BLOCK_CENTER_OFFSET,
            offsetCol: BLOCK_CENTER_OFFSET,
            x: evt.nativeEvent.pageX,
            y: evt.nativeEvent.pageY,
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const current = draggingPieceRef.current;
          if (!current) return;

          const { moveX, moveY } = gestureState;
          updateDraggingPiece({
            ...current,
            x: moveX ?? current.x,
            y: moveY ?? current.y,
          });
        },
        onPanResponderRelease: (evt, gestureState) => {
          const dropX = gestureState.moveX ?? evt.nativeEvent.pageX;
          const dropY = gestureState.moveY ?? evt.nativeEvent.pageY;
          const current = draggingPieceRef.current;
          updateDraggingPiece(null);

          if (current) {
            handleDrop(current, dropX, dropY);
          }
        },
        onPanResponderTerminate: () => {
          updateDraggingPiece(null);
          onClearConflict(); // Clear conflict state when gesture is terminated
        },
      }),
    [availableLfbCount, availableRfbCount, canInteractWithPiece, handleDrop, updateDraggingPiece]
  );

  const rfbPanResponder = useMemo<PanResponderInstance>(
    () => createCounterPanResponder('RFB'),
    [createCounterPanResponder]
  );

  const lfbPanResponder = useMemo<PanResponderInstance>(
    () => createCounterPanResponder('LFB'),
    [createCounterPanResponder]
  );

  const boardInteractionRef = useRef<{
    pieceId: string;
    offsetRow: number;
    offsetCol: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
    type: BlockType;
    rotation: PieceRotation;
  } | null>(null);

  const boardPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt) => {
          if (!gridBounds) {
            return false;
          }

          const cell = convertPointToGridCell(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
          if (!cell) {
            return false;
          }

          const piece = findPieceAtCell(cell.row, cell.col);
          if (!piece || !canInteractWithPiece(piece.id)) {
            return false;
          }

          onClearConflict();

          boardInteractionRef.current = {
            pieceId: piece.id,
            offsetRow: cell.row - piece.anchorRow,
            offsetCol: cell.col - piece.anchorCol,
            startX: evt.nativeEvent.pageX,
            startY: evt.nativeEvent.pageY,
            hasMoved: false,
            type: piece.type,
            rotation: piece.rotation,
          };

          return true;
        },
        onPanResponderMove: (_, gestureState) => {
          const context = boardInteractionRef.current;
          if (!context) return;

          const currentX = gestureState.moveX ?? context.startX;
          const currentY = gestureState.moveY ?? context.startY;
          const distance = Math.sqrt(
            (currentX - context.startX) * (currentX - context.startX) +
              (currentY - context.startY) * (currentY - context.startY)
          );

          if (!context.hasMoved && distance < MOVE_THRESHOLD_PX) {
            return;
          }

          if (!context.hasMoved) {
            context.hasMoved = true;
            onClearConflict();
            onSetHiddenPieceId(context.pieceId);
            updateDraggingPiece({
              source: 'board',
              pieceId: context.pieceId,
              type: context.type,
              rotation: context.rotation,
              offsetRow: context.offsetRow,
              offsetCol: context.offsetCol,
              x: currentX,
              y: currentY,
            });
          } else {
            const current = draggingPieceRef.current;
            if (!current) return;

            updateDraggingPiece({
              ...current,
              x: currentX,
              y: currentY,
            });
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          const context = boardInteractionRef.current;
          if (!context) return;

          const finalX = gestureState.moveX ?? evt.nativeEvent.pageX;
          const finalY = gestureState.moveY ?? evt.nativeEvent.pageY;
          const finalDistance = Math.sqrt(
            (finalX - context.startX) * (finalX - context.startX) +
              (finalY - context.startY) * (finalY - context.startY)
          );

          const isTap = !context.hasMoved || finalDistance < TAP_THRESHOLD_PX;

          if (isTap) {
            onClearConflict();
            updateDraggingPiece(null);
            onSetHiddenPieceId(null);
            onRotatePiece(context.pieceId, (conflicts, blockingPieceIds) => {
              onSetConflictState({ pieceId: context.pieceId, cells: conflicts, blockingPieceIds });
            });
          } else {
            const current = draggingPieceRef.current;
            updateDraggingPiece(null);

            if (current) {
              const success = handleDrop(current, finalX, finalY);
              onSetHiddenPieceId(null);

              if (success) {
                onClearConflict();
              } else {
                // If drop failed, conflict state was already set, but ensure it's cleared on next interaction
                // The conflict will be cleared when user tries to interact again
              }
            } else {
              onSetHiddenPieceId(null);
              onClearConflict(); // Clear conflict if no current drag state
            }
          }

          boardInteractionRef.current = null;
        },
        onPanResponderTerminate: () => {
          updateDraggingPiece(null);
          onSetHiddenPieceId(null);
          onClearConflict(); // Clear conflict state when gesture is terminated
          boardInteractionRef.current = null;
        },
      }),
    [
      onClearConflict,
      canInteractWithPiece,
      convertPointToGridCell,
      findPieceAtCell,
      gridBounds,
      handleDrop,
      onRotatePiece,
      onRemovePiece,
      onSetConflictState,
      onClearConflict,
      onSetHiddenPieceId,
      updateDraggingPiece,
    ]
  );

  return {
    draggingPiece,
    rfbPanResponder,
    lfbPanResponder,
    boardPanResponder,
  };
}

