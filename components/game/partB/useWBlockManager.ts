import { useCallback, useState } from 'react';
import { SCORES } from '@/constants/game';
import type { PieceState } from './types';
import { detectAllWBlocks } from './wBlockDetection';

interface UseWBlockManagerProps {
  onWCountChange?: (delta: number) => void;
  onScoreChange?: (delta: number) => void;
}

export const useWBlockManager = ({ onWCountChange, onScoreChange }: UseWBlockManagerProps) => {
  const [scoredWBlocks, setScoredWBlocks] = useState<Set<string>>(new Set());

  const checkAndScoreWBlock = useCallback(
    (piecesList: PieceState[]): PieceState[] => {
      const wBlocks = detectAllWBlocks(piecesList);
      if (wBlocks.length > 0) {
        // Mark all W-block pieces
        let updatedPieces = piecesList.map((piece) => {
          const isInWBlock = wBlocks.some(
            (wb) => piece.id === wb.rfbId || piece.id === wb.lfbId
          );
          if (isInWBlock) {
            return { ...piece, isWBlock: true };
          }
          return piece;
        });

        // Score all new W-blocks
        setScoredWBlocks((prev) => {
          const updated = new Set(prev);
          let newCount = 0;

          wBlocks.forEach((wBlock) => {
            const wBlockKey = `${wBlock.rfbId}:${wBlock.lfbId}`;
            if (!prev.has(wBlockKey)) {
              updated.add(wBlockKey);
              newCount += 1;
            }
          });

          // Defer callbacks to avoid updating parent during render
          if (newCount > 0) {
            setTimeout(() => {
              onWCountChange?.(newCount);
              onScoreChange?.(SCORES.W_BLOCK * newCount);
            }, 0);
          }

          return updated;
        });

        return updatedPieces;
      }
      return piecesList;
    },
    [onWCountChange, onScoreChange]
  );

  const checkAndUnmarkDestroyedWBlocks = useCallback(
    (piecesList: PieceState[], movedPieceId: string): PieceState[] => {
      // Find W-blocks that include the moved piece
      const currentWBlocks = detectAllWBlocks(piecesList);
      const wBlockKeys = currentWBlocks.map((wb) => `${wb.rfbId}:${wb.lfbId}`);

      // Check which W-blocks were scored but no longer exist
      setScoredWBlocks((prev) => {
        const destroyed: string[] = [];
        prev.forEach((key) => {
          if (!wBlockKeys.includes(key)) {
            destroyed.push(key);
          }
        });

        if (destroyed.length > 0) {
          // Remove destroyed W-blocks from scored set
          const updated = new Set(prev);
          destroyed.forEach((key) => updated.delete(key));

          // Defer callbacks to avoid updating parent during render
          if (destroyed.length > 0) {
            setTimeout(() => {
              onWCountChange?.(-destroyed.length);
              onScoreChange?.(-SCORES.W_BLOCK * destroyed.length);
            }, 0);
          }

          return updated;
        }
        return prev;
      });

      // Unmark pieces that are no longer in W-blocks
      const piecesInWBlocks = new Set<string>();
      currentWBlocks.forEach((wb) => {
        piecesInWBlocks.add(wb.rfbId);
        piecesInWBlocks.add(wb.lfbId);
      });

      return piecesList.map((piece) => {
        // If piece was marked as W-block but is no longer in a W-block, unmark it
        if (piece.isWBlock && !piecesInWBlocks.has(piece.id)) {
          return { ...piece, isWBlock: false };
        }
        return piece;
      });
    },
    [onWCountChange, onScoreChange]
  );

  const resetScoredWBlocks = useCallback(() => {
    // Reset the scored W-blocks set - used when grid is cleared
    // This prevents old W-block keys from interfering with new W-blocks
    setScoredWBlocks(new Set());
  }, []);

  return {
    checkAndScoreWBlock,
    checkAndUnmarkDestroyedWBlocks,
    scoredWBlocks,
    resetScoredWBlocks,
  };
};


