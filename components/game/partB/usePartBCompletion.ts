import { useEffect } from 'react';
import { canPlacePieceType } from './pieceValidation';
import type { PieceState } from './types';

interface UsePartBCompletionProps {
  availableRfbCount: number;
  availableLfbCount: number;
  pieces: PieceState[];
  onPartBEnd?: () => void;
}

/**
 * Hook that checks Part B completion conditions
 * Level ends when:
 * - In case of LFB counter is 0:
 *   - If there's no LFB on grid to form W block → level ends
 *   - If there's LFB on grid to form W block:
 *     - If there's no RFB on counter AND no RFB on grid → level ends
 *     - If there's RFB on counter but no space to put RFB on grid → level ends
 * - Same logic for RFB
 */
export function usePartBCompletion({
  availableRfbCount,
  availableLfbCount,
  pieces,
  onPartBEnd,
}: UsePartBCompletionProps) {
  useEffect(() => {
    // Get pieces that are not part of W-blocks (can potentially form W-blocks)
    const rfbPiecesOnGrid = pieces.filter((p) => p.type === 'RFB' && !p.isWBlock);
    const lfbPiecesOnGrid = pieces.filter((p) => p.type === 'LFB' && !p.isWBlock);

    // Check LFB completion conditions
    if (availableLfbCount === 0) {
      // No LFB in counter box
      if (lfbPiecesOnGrid.length === 0) {
        // No LFB on grid to form W block → level ends
        onPartBEnd?.();
        return;
      } else {
        // There's LFB on grid that can form W block
        // Check if there's RFB available
        const hasRfbOnCounter = availableRfbCount > 0;
        const hasRfbOnGrid = rfbPiecesOnGrid.length > 0;

        if (!hasRfbOnCounter && !hasRfbOnGrid) {
          // No RFB on counter AND no RFB on grid → level ends
          onPartBEnd?.();
          return;
        }

        if (hasRfbOnCounter && !canPlacePieceType('RFB', pieces)) {
          // There's RFB on counter but no space to put RFB on grid → level ends
          onPartBEnd?.();
          return;
        }
      }
    }

    // Check RFB completion conditions (same logic as LFB)
    if (availableRfbCount === 0) {
      // No RFB in counter box
      if (rfbPiecesOnGrid.length === 0) {
        // No RFB on grid to form W block → level ends
        onPartBEnd?.();
        return;
      } else {
        // There's RFB on grid that can form W block
        // Check if there's LFB available
        const hasLfbOnCounter = availableLfbCount > 0;
        const hasLfbOnGrid = lfbPiecesOnGrid.length > 0;

        if (!hasLfbOnCounter && !hasLfbOnGrid) {
          // No LFB on counter AND no LFB on grid → level ends
          onPartBEnd?.();
          return;
        }

        if (hasLfbOnCounter && !canPlacePieceType('LFB', pieces)) {
          // There's LFB on counter but no space to put LFB on grid → level ends
          onPartBEnd?.();
          return;
        }
      }
    }
  }, [availableRfbCount, availableLfbCount, pieces, onPartBEnd]);
}

