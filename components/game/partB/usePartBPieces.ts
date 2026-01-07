import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROTATIONS } from './constants';
import { validatePlacement } from './pieceValidation';
import type { BlockType, PieceRotation, PieceState } from './types';
import { useWBlockManager } from './useWBlockManager';
import { buildGridFromPieces } from './utils';
import { detectAllWBlocks, getPieceCells } from './wBlockDetection';

interface UsePartBPiecesProps {
  initialRfbCount: number;
  initialLfbCount: number;
  level: number;
  onRfbCountChange?: (delta: number) => void;
  onLfbCountChange?: (delta: number) => void;
  onWCountChange?: (delta: number) => void;
  onScoreChange?: (delta: number) => void;
  onGridChange?: (grid: number[][]) => void;
}

/**
 * Hook that manages Part B piece state and operations
 * Handles: placement, movement, rotation, W-block detection
 */
export function usePartBPieces({
  initialRfbCount,
  initialLfbCount,
  level,
  onRfbCountChange,
  onLfbCountChange,
  onWCountChange,
  onScoreChange,
  onGridChange,
}: UsePartBPiecesProps) {
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [availableRfbCount, setAvailableRfbCount] = useState(initialRfbCount);
  const [availableLfbCount, setAvailableLfbCount] = useState(initialLfbCount);
  const pieceIdCounter = useRef(0);

  const { checkAndScoreWBlock, checkAndUnmarkDestroyedWBlocks } = useWBlockManager({
    onWCountChange,
    onScoreChange,
  });

  // Update available counts when props change
  useEffect(() => {
    setAvailableRfbCount(initialRfbCount);
  }, [initialRfbCount]);

  useEffect(() => {
    setAvailableLfbCount(initialLfbCount);
  }, [initialLfbCount]);

  // Build grid from pieces and notify parent
  const baseGrid = useMemo(() => buildGridFromPieces(pieces), [pieces]);

  useEffect(() => {
    if (onGridChange) {
      setTimeout(() => {
        onGridChange(baseGrid);
      }, 0);
    }
  }, [baseGrid, onGridChange]);

  // W-block marking for visual feedback
  useEffect(() => {
    if (pieces.length < 2) {
      setPieces((prev) => {
        const hasWBlockPieces = prev.some((p) => p.isWBlock);
        if (!hasWBlockPieces) return prev;
        return prev.map((p) => (p.isWBlock ? { ...p, isWBlock: false } : p));
      });
      return;
    }

    const wBlocks = detectAllWBlocks(pieces);
    const piecesInWBlocks = new Set<string>();
    wBlocks.forEach((wb) => {
      piecesInWBlocks.add(wb.rfbId);
      piecesInWBlocks.add(wb.lfbId);
    });

    setPieces((prev) => {
      let needsUpdate = false;
      const updatedPieces = prev.map((piece) => {
        const isInWBlock = piecesInWBlocks.has(piece.id);
        if (isInWBlock && !piece.isWBlock) {
          needsUpdate = true;
          return { ...piece, isWBlock: true };
        }
        if (!isInWBlock && piece.isWBlock) {
          needsUpdate = true;
          return { ...piece, isWBlock: false };
        }
        return piece;
      });

      return needsUpdate ? updatedPieces : prev;
    });
  }, [pieces]);

  const getNextPieceId = useCallback(() => {
    pieceIdCounter.current += 1;
    return `piece-${pieceIdCounter.current}`;
  }, []);

  const placeNewPiece = useCallback(
    (
      type: BlockType,
      anchorRow: number,
      anchorCol: number,
      rotation: PieceRotation = 0,
      onConflict?: (conflicts: Array<{ row: number; col: number }>, blockingPieceIds: string[]) => void
    ) => {
      const candidate: PieceState = {
        id: getNextPieceId(),
        type,
        rotation,
        anchorRow,
        anchorCol,
      };
      let placed = false;

      setPieces((prev) => {
        const { valid, conflicts, blockingPieceIds } = validatePlacement(candidate, prev);

        if (!valid) {
          onConflict?.(conflicts, blockingPieceIds);
          placed = false;
          return prev;
        }

        placed = true;

        if (type === 'RFB') {
          setAvailableRfbCount((prevCount) => Math.max(0, prevCount - 1));
          setTimeout(() => {
            onRfbCountChange?.(-1);
          }, 0);
        } else {
          setAvailableLfbCount((prevCount) => Math.max(0, prevCount - 1));
          setTimeout(() => {
            onLfbCountChange?.(-1);
          }, 0);
        }

        const updatedPieces = [...prev, candidate];
        return checkAndScoreWBlock(updatedPieces);
      });

      return placed;
    },
    [checkAndScoreWBlock, getNextPieceId, onLfbCountChange, onRfbCountChange]
  );

  const moveExistingPiece = useCallback(
    (
      pieceId: string,
      anchorRow: number,
      anchorCol: number,
      onConflict?: (conflicts: Array<{ row: number; col: number }>, blockingPieceIds: string[]) => void
    ) => {
      let moved = false;

      setPieces((prev) => {
        const index = prev.findIndex((piece) => piece.id === pieceId);

        if (index === -1) {
          return prev;
        }

        const piece = prev[index];
        // For level 2+, W-blocks are locked and cannot be moved
        if (level >= 2 && piece.isWBlock) {
          return prev;
        }

        const candidate = { ...piece, anchorRow, anchorCol };
        const { valid, conflicts, blockingPieceIds } = validatePlacement(candidate, prev, pieceId);

        if (!valid) {
          onConflict?.(conflicts, blockingPieceIds);
          moved = false;
          return prev;
        }

        const updated = [...prev];
        updated[index] = candidate;
        moved = true;

        let result = checkAndUnmarkDestroyedWBlocks(updated, pieceId);
        result = checkAndScoreWBlock(result);

        return result;
      });

      return moved;
    },
    [checkAndScoreWBlock, checkAndUnmarkDestroyedWBlocks, level]
  );

  const rotatePiece = useCallback(
    (
      pieceId: string,
      onConflict?: (conflicts: Array<{ row: number; col: number }>, blockingPieceIds: string[]) => void
    ) => {
      setPieces((prev) => {
        const index = prev.findIndex((piece) => piece.id === pieceId);

        if (index === -1) {
          return prev;
        }

        const current = prev[index];
        // For level 2+, W-blocks are locked and cannot be rotated
        if (level >= 2 && current.isWBlock) {
          return prev;
        }
        const rotationIndex = ROTATIONS.indexOf(current.rotation);
        const nextRotation = ROTATIONS[(rotationIndex + 1) % ROTATIONS.length];
        const candidate = { ...current, rotation: nextRotation };
        const { valid, conflicts, blockingPieceIds } = validatePlacement(candidate, prev, pieceId);

        if (!valid) {
          onConflict?.(conflicts, blockingPieceIds);
          return prev;
        }

        const updated = [...prev];
        updated[index] = candidate;

        let result = checkAndUnmarkDestroyedWBlocks(updated, pieceId);
        result = checkAndScoreWBlock(result);

        return result;
      });
    },
    [checkAndScoreWBlock, checkAndUnmarkDestroyedWBlocks, level]
  );

  const removePiece = useCallback(
    (pieceId: string) => {
      setPieces((prev) => {
        const index = prev.findIndex((piece) => piece.id === pieceId);
        if (index === -1) {
          return prev;
        }

        const piece = prev[index];
        // For level 2+, W-blocks are locked and cannot be removed
        if (level >= 2 && piece.isWBlock) {
          return prev;
        }
        const updated = prev.filter((p) => p.id !== pieceId);

        // Return pieces to available count
        if (piece.type === 'RFB') {
          setAvailableRfbCount((prevCount) => prevCount + 1);
          setTimeout(() => {
            onRfbCountChange?.(1);
          }, 0);
        } else {
          setAvailableLfbCount((prevCount) => prevCount + 1);
          setTimeout(() => {
            onLfbCountChange?.(1);
          }, 0);
        }

        // Check and unmark destroyed W-blocks
        let result = checkAndUnmarkDestroyedWBlocks(updated, pieceId);
        result = checkAndScoreWBlock(result);

        return result;
      });
    },
    [checkAndScoreWBlock, checkAndUnmarkDestroyedWBlocks, onLfbCountChange, onRfbCountChange, level]
  );

  const findPieceAtCell = useCallback(
    (row: number, col: number) =>
      pieces.find((piece) => getPieceCells(piece).some((cell) => cell.row === row && cell.col === col)),
    [pieces]
  );

  const resetGrid = useCallback(() => {
    // Clear all pieces from the grid, but keep the counters
    // This is used when "Keep going?" is pressed after time runs out
    setPieces([]);
  }, []);

  return {
    pieces,
    baseGrid,
    availableRfbCount,
    availableLfbCount,
    placeNewPiece,
    moveExistingPiece,
    rotatePiece,
    removePiece,
    findPieceAtCell,
    resetGrid,
  };
}

