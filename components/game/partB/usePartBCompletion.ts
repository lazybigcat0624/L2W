import { useEffect } from 'react';
import { canPlacePieceType } from './pieceValidation';
import { detectAllWBlocks } from './wBlockDetection';
import type { PieceState } from './types';

interface UsePartBCompletionProps {
  availableRfbCount: number;
  availableLfbCount: number;
  pieces: PieceState[];
  onPartBEnd?: () => void;
}

/**
 * Hook that checks Part B completion conditions
 * Level ends when all RFBs and LFBs have been turned into Ws
 * This means: availableRfbCount === 0 AND availableLfbCount === 0
 * AND there are no remaining RFB or LFB pieces on the board that aren't part of W-blocks
 */
export function usePartBCompletion({
  availableRfbCount,
  availableLfbCount,
  pieces,
  onPartBEnd,
}: UsePartBCompletionProps) {
  useEffect(() => {
    // Level ends when all RFBs and LFBs have been turned into Ws
    // Check if both counters are zero
    if (availableRfbCount === 0 && availableLfbCount === 0) {
      // Check if there are any RFB or LFB pieces on the board that aren't part of W-blocks
      const rfbPieces = pieces.filter((p) => p.type === 'RFB' && !p.isWBlock);
      const lfbPieces = pieces.filter((p) => p.type === 'LFB' && !p.isWBlock);
      
      // If there are no remaining RFB or LFB pieces that aren't W-blocks, the level is complete
      if (rfbPieces.length === 0 && lfbPieces.length === 0) {
        onPartBEnd?.();
        return;
      }
    }
  }, [availableRfbCount, availableLfbCount, pieces, onPartBEnd]);
}

