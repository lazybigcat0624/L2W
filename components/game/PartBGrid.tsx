import { GAME_COLORS, GRID_SIZE, SCORES } from '@/constants/game';
import { createEmptyGrid } from '@/utils/gameLogic';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  type PanResponderInstance,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
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
  onScoreChange?: (delta: number) => void;
  onPartBEnd?: () => void;
}

interface CounterSizes {
  letter: number;
  number: number;
  square: number;
}

type BlockType = 'RFB' | 'LFB';
type PieceRotation = 0 | 90 | 180 | 270;

interface PieceState {
  id: string;
  type: BlockType;
  rotation: PieceRotation;
  anchorRow: number;
  anchorCol: number;
  isWBlock?: boolean;
}

type DragSource = 'counter' | 'board';

interface DragState {
  source: DragSource;
  type: BlockType;
  rotation: PieceRotation;
  x: number;
  y: number;
  offsetRow: number;
  offsetCol: number;
  pieceId?: string;
}

interface GridBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BLOCK_DIMENSION = 3;
const BLOCK_CENTER_OFFSET = Math.floor(BLOCK_DIMENSION / 2);
const BLOCK_SHAPES: Record<BlockType, number[][]> = {
  RFB: [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ],
  LFB: [
    [0, 2],
    [1, 2],
    [2, 2],
    [2, 0],
    [2, 1],
  ],
};

const ROTATIONS: PieceRotation[] = [0, 90, 180, 270];
const MOVE_THRESHOLD_PX = 6;

const rotatePattern = (pattern: number[][], rotation: PieceRotation): number[][] => {
  if (rotation === 0) {
    return pattern;
  }

  let rotated = pattern;
  const steps = rotation / 90;

  for (let i = 0; i < steps; i += 1) {
    rotated = rotated.map(([row, col]) => [col, BLOCK_DIMENSION - 1 - row]);
  }

  return rotated;
};

const getRotatedPattern = (type: BlockType, rotation: PieceRotation) =>
  rotatePattern(BLOCK_SHAPES[type], rotation);

// Generate W patterns from actual BLOCK_SHAPES used in Part B
const generateWPatterns = (): number[][][] => {
  const patterns: number[][][] = [];
  const seen = new Set<string>();

  // W-block pattern consists of:
  // RFB: [0,0], [1,0], [2,0], [2,1] (4 cells - right-facing L)
  // LFB positioned to form W: [2,2], [3,2], [4,2], [4,3], [4,4] (5 cells - left-facing L)
  // Total: 9 cells (no overlap)
  const wBase: number[][] = [
    // RFB cells
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    // LFB cells in W formation
    [2, 2],
    [3, 2],
    [4, 2],
    [4, 3],
    [4, 4],
  ];

  // Remove duplicates and normalize
  const uniqueMap = new Map<string, [number, number]>();
  wBase.forEach(([row, col]) => {
    uniqueMap.set(`${row}:${col}`, [row, col]);
  });
  let current = Array.from(uniqueMap.values());

  // Generate all 4 rotations
  for (let i = 0; i < 4; i += 1) {
    // Normalize
    const minRow = Math.min(...current.map(([r]) => r));
    const minCol = Math.min(...current.map(([, c]) => c));
    const normalized = current
      .map(([r, c]) => [r - minRow, c - minCol] as [number, number])
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    const key = normalized.map(([r, c]) => `${r}:${c}`).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      patterns.push(normalized);
    }

    // Rotate for next iteration - need to find bounding box for rotation
    if (i < 3) {
      const maxRow = Math.max(...current.map(([r]) => r));
      const maxCol = Math.max(...current.map(([, c]) => c));
      const size = Math.max(maxRow, maxCol) + 1;
      current = current.map(([row, col]) => [col, size - 1 - row]);
    }
  }

  return patterns;
};

const W_PATTERNS = generateWPatterns();

const buildGridFromPieces = (pieces: PieceState[]) => {
  const grid = createEmptyGrid();

  pieces.forEach((piece) => {
    const pattern = getRotatedPattern(piece.type, piece.rotation);
    // Use value 3 for W-block pieces (to distinguish them visually)
    // value 1 = RFB, value 2 = LFB, value 3 = W-block
    const value = piece.isWBlock ? 3 : piece.type === 'RFB' ? 1 : 2;

    pattern.forEach(([dy, dx]) => {
      const row = piece.anchorRow + dy;
      const col = piece.anchorCol + dx;

      if (row >= 0 && col >= 0 && row < GRID_SIZE && col < GRID_SIZE) {
        grid[row][col] = value;
      }
    });
  });

  return grid;
};

const clampCell = (row: number, col: number) => ({
  row: Math.max(0, Math.min(row, GRID_SIZE - 1)),
  col: Math.max(0, Math.min(col, GRID_SIZE - 1)),
});

export default function PartBGrid({
  rfbCount,
  lfbCount,
  wCount,
  onGridChange,
  onRfbCountChange,
  onLfbCountChange,
  onWCountChange,
  onScoreChange,
  onPartBEnd,
}: PartBGridProps) {
  const { width } = useWindowDimensions();
  const [pieces, setPieces] = useState<PieceState[]>([]);
  const [availableRfbCount, setAvailableRfbCount] = useState(rfbCount);
  const [availableLfbCount, setAvailableLfbCount] = useState(lfbCount);
  const gridRef = useRef<View | null>(null);
  const containerRef = useRef<View | null>(null);
  const [gridBounds, setGridBounds] = useState<GridBounds | null>(null);
  const [containerOffset, setContainerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingPiece, setDraggingPiece] = useState<DragState | null>(null);
  const draggingPieceRef = useRef<DragState | null>(null);
  const pieceIdCounter = useRef(0);
  const [hiddenPieceId, setHiddenPieceId] = useState<string | null>(null);
  const [conflictCells, setConflictCells] = useState<Array<{ row: number; col: number }>>([]);
  const [conflictPieceId, setConflictPieceId] = useState<string | null>(null);
  const [blockingPieceIds, setBlockingPieceIds] = useState<string[]>([]);
  const [scoredWBlocks, setScoredWBlocks] = useState<Set<string>>(new Set());

  const baseGrid = useMemo(() => buildGridFromPieces(pieces), [pieces]);

  useEffect(() => {
    setAvailableRfbCount(rfbCount);
  }, [rfbCount]);

  useEffect(() => {
    setAvailableLfbCount(lfbCount);
  }, [lfbCount]);

  useEffect(() => {
    // Defer callback to avoid updating parent during render
    setTimeout(() => {
      onGridChange(baseGrid);
    }, 0);
  }, [baseGrid, onGridChange]);

  const conflictCellSet = useMemo(() => {
    const set = new Set<string>();
    conflictCells.forEach(({ row, col }) => set.add(`${row}:${col}`));
    return set;
  }, [conflictCells]);

  const displayGrid = useMemo(() => {
    if (!hiddenPieceId) {
      return baseGrid;
    }

    const hiddenPiece = pieces.find((piece) => piece.id === hiddenPieceId);

    if (!hiddenPiece) {
      return baseGrid;
    }

    const clone = baseGrid.map((row) => [...row]);
    const pattern = getRotatedPattern(hiddenPiece.type, hiddenPiece.rotation);

    pattern.forEach(([dy, dx]) => {
      const row = hiddenPiece.anchorRow + dy;
      const col = hiddenPiece.anchorCol + dx;

      if (row >= 0 && col >= 0 && row < GRID_SIZE && col < GRID_SIZE) {
        clone[row][col] = 0;
      }
    });

    return clone;
  }, [baseGrid, hiddenPieceId, pieces]);

  const updateDraggingPiece = useCallback((next: DragState | null) => {
    draggingPieceRef.current = next;
    setDraggingPiece(next);
  }, []);

  const clearConflict = useCallback(() => {
    setConflictCells([]);
    setConflictPieceId(null);
    setBlockingPieceIds([]);
  }, []);

  interface ConflictStatePayload {
    pieceId: string | null;
    cells: Array<{ row: number; col: number }>;
    blockingPieceIds: string[];
  }

  const setConflictState = useCallback(({ pieceId, cells, blockingPieceIds }: ConflictStatePayload) => {
    setConflictPieceId(pieceId);
    setConflictCells(cells);
    setBlockingPieceIds(blockingPieceIds);
  }, []);

  const canInteractWithPiece = useCallback(
    (pieceId?: string) => {
      if (!conflictPieceId) {
        return true;
      }

      return pieceId ? conflictPieceId === pieceId : false;
    },
    [conflictPieceId]
  );

  const getNextPieceId = useCallback(() => {
    pieceIdCounter.current += 1;
    return `piece-${pieceIdCounter.current}`;
  }, []);

  const getPieceCells = useCallback(
    (piece: { type: BlockType; rotation: PieceRotation; anchorRow: number; anchorCol: number }) => {
      const pattern = getRotatedPattern(piece.type, piece.rotation);
      return pattern.map(([dy, dx]) => ({
        row: piece.anchorRow + dy,
        col: piece.anchorCol + dx,
      }));
    },
    []
  );

  const detectWBlock = useCallback(
    (piecesList: PieceState[]): { rfbId: string; lfbId: string } | null => {
      const rfbPieces = piecesList.filter((p) => p.type === 'RFB');
      const lfbPieces = piecesList.filter((p) => p.type === 'LFB');

      for (const rfbPiece of rfbPieces) {
        for (const lfbPiece of lfbPieces) {
          const rfbCells = getPieceCells(rfbPiece);
          const lfbCells = getPieceCells(lfbPiece);

          // Combine cells from both pieces (remove duplicates)
          const uniqueCellsMap = new Map<string, { row: number; col: number }>();
          [...rfbCells, ...lfbCells].forEach((cell) => {
            uniqueCellsMap.set(`${cell.row}:${cell.col}`, cell);
          });
          const uniqueCells = Array.from(uniqueCellsMap.values());

          // W-block should have 9 cells total (4 from RFB + 5 from LFB, no overlap in correct W formation)
          if (uniqueCells.length !== 9) {
            continue;
          }

          // Normalize the combined cells (subtract min row/col)
          const minRow = Math.min(...uniqueCells.map((c) => c.row));
          const minCol = Math.min(...uniqueCells.map((c) => c.col));
          const normalized = uniqueCells
            .map((c) => [c.row - minRow, c.col - minCol] as [number, number])
            .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

          // Check if normalized cells match any W pattern
          for (const wPattern of W_PATTERNS) {
            const normalizedPattern = [...wPattern].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

            // Compare normalized patterns
            if (
              normalized.length === normalizedPattern.length &&
              normalized.every(
                (cell, idx) =>
                  cell[0] === normalizedPattern[idx][0] && cell[1] === normalizedPattern[idx][1]
              )
            ) {
              return { rfbId: rfbPiece.id, lfbId: lfbPiece.id };
            }
          }
        }
      }

      return null;
    },
    [getPieceCells]
  );

  const detectAllWBlocks = useCallback(
    (piecesList: PieceState[]): Array<{ rfbId: string; lfbId: string }> => {
      const rfbPieces = piecesList.filter((p) => p.type === 'RFB');
      const lfbPieces = piecesList.filter((p) => p.type === 'LFB');
      const wBlocks: Array<{ rfbId: string; lfbId: string }> = [];
      const usedPairs = new Set<string>();

      for (const rfbPiece of rfbPieces) {
        for (const lfbPiece of lfbPieces) {
          // Skip if this pair has already been checked
          const pairKey = `${rfbPiece.id}:${lfbPiece.id}`;
          if (usedPairs.has(pairKey)) {
            continue;
          }
          usedPairs.add(pairKey);

          const rfbCells = getPieceCells(rfbPiece);
          const lfbCells = getPieceCells(lfbPiece);

          // Combine cells from both pieces (remove duplicates)
          const uniqueCellsMap = new Map<string, { row: number; col: number }>();
          [...rfbCells, ...lfbCells].forEach((cell) => {
            uniqueCellsMap.set(`${cell.row}:${cell.col}`, cell);
          });
          const uniqueCells = Array.from(uniqueCellsMap.values());

          // W-block should have 9 cells total (4 from RFB + 5 from LFB, no overlap in correct W formation)
          if (uniqueCells.length !== 9) {
            continue;
          }

          // Normalize the combined cells (subtract min row/col)
          const minRow = Math.min(...uniqueCells.map((c) => c.row));
          const minCol = Math.min(...uniqueCells.map((c) => c.col));
          const normalized = uniqueCells
            .map((c) => [c.row - minRow, c.col - minCol] as [number, number])
            .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

          // Check if normalized cells match any W pattern
          for (const wPattern of W_PATTERNS) {
            const normalizedPattern = [...wPattern].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

            // Compare normalized patterns
            if (
              normalized.length === normalizedPattern.length &&
              normalized.every(
                (cell, idx) =>
                  cell[0] === normalizedPattern[idx][0] && cell[1] === normalizedPattern[idx][1]
              )
            ) {
              wBlocks.push({ rfbId: rfbPiece.id, lfbId: lfbPiece.id });
              break; // Found a match for this pair, move to next
            }
          }
        }
      }

      return wBlocks;
    },
    [getPieceCells]
  );

  // Check for W-block formations and score them (but don't remove pieces)
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
    [detectAllWBlocks, onWCountChange, onScoreChange]
  );

  // Check for destroyed W-blocks and unmark pieces, decrease score/counter
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
    [detectAllWBlocks, onWCountChange, onScoreChange]
  );

  // Continuously check for W-blocks and mark them (for color changes)
  useEffect(() => {
    if (pieces.length < 2) {
      // If less than 2 pieces, unmark any remaining W-block pieces
      setPieces((prev) => {
        const hasWBlockPieces = prev.some((p) => p.isWBlock);
        if (!hasWBlockPieces) return prev; // No change needed
        return prev.map((p) => (p.isWBlock ? { ...p, isWBlock: false } : p));
      });
      return;
    }

    const wBlocks = detectAllWBlocks(pieces);
    const wBlockKeys = wBlocks.map((wb) => `${wb.rfbId}:${wb.lfbId}`);
    
    // Check for destroyed W-blocks and score new ones in one update
    setScoredWBlocks((prev) => {
      const updated = new Set(prev);
      let destroyedCount = 0;
      let newCount = 0;

      // Check for destroyed W-blocks
      prev.forEach((key) => {
        if (!wBlockKeys.includes(key)) {
          updated.delete(key);
          destroyedCount += 1;
        }
      });

      // Check for new W-blocks
      wBlocks.forEach((wBlock) => {
        const wBlockKey = `${wBlock.rfbId}:${wBlock.lfbId}`;
        if (!prev.has(wBlockKey)) {
          updated.add(wBlockKey);
          newCount += 1;
        }
      });

      // Defer callbacks to avoid updating parent during render
      const netChange = newCount - destroyedCount;
      if (netChange !== 0) {
        setTimeout(() => {
          onWCountChange?.(netChange);
          onScoreChange?.(SCORES.W_BLOCK * netChange);
        }, 0);
      }

      return updated;
    });

    // Mark/unmark pieces based on current W-blocks
    const piecesInWBlocks = new Set<string>();
    wBlocks.forEach((wb) => {
      piecesInWBlocks.add(wb.rfbId);
      piecesInWBlocks.add(wb.lfbId);
    });

    // Only update if there's an actual change to avoid infinite loops
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
  }, [pieces, detectAllWBlocks, onWCountChange, onScoreChange]);

  const blockingCellSet = useMemo(() => {
    const set = new Set<string>();

    blockingPieceIds.forEach((pieceId) => {
      const piece = pieces.find((p) => p.id === pieceId);
      if (!piece) {
        return;
      }

      getPieceCells(piece).forEach(({ row, col }) => {
        set.add(`${row}:${col}`);
      });
    });

    return set;
  }, [blockingPieceIds, getPieceCells, pieces]);

  const validatePlacement = useCallback(
    (
      candidate: { type: BlockType; rotation: PieceRotation; anchorRow: number; anchorCol: number },
      existingPieces: PieceState[],
      ignorePieceId?: string
    ) => {
      const occupiedBy = new Map<string, string>();

      existingPieces.forEach((piece) => {
        if (piece.id === ignorePieceId) {
          return;
        }

        getPieceCells(piece).forEach(({ row, col }) => {
          occupiedBy.set(`${row}:${col}`, piece.id);
        });
      });

      const conflicts: Array<{ row: number; col: number }> = [];
      const blockingIds = new Set<string>();

      getPieceCells(candidate).forEach(({ row, col }) => {
        if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) {
          conflicts.push(clampCell(row, col));
          return;
        }

        const key = `${row}:${col}`;
        const blockingPieceId = occupiedBy.get(key);

        if (blockingPieceId) {
          conflicts.push({ row, col });
          blockingIds.add(blockingPieceId);
        }
      });

      return {
        valid: conflicts.length === 0,
        conflicts,
        blockingPieceIds: Array.from(blockingIds),
      };
    },
    [getPieceCells]
  );

  // Check if a piece type can be placed anywhere on the grid
  const canPlacePieceType = useCallback(
    (type: BlockType, piecesList: PieceState[]): boolean => {
      // Try all rotations
      for (const rotation of ROTATIONS) {
        // Try all possible positions on the grid
        for (let row = 0; row <= GRID_SIZE - BLOCK_DIMENSION; row++) {
          for (let col = 0; col <= GRID_SIZE - BLOCK_DIMENSION; col++) {
            const candidate: PieceState = {
              id: 'temp',
              type,
              rotation,
              anchorRow: row,
              anchorCol: col,
            };
            const { valid } = validatePlacement(candidate, piecesList);
            if (valid) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [validatePlacement]
  );

  // Check Part B completion conditions
  // Complete only when we can't make W-blocks anymore:
  // - If we can still make W-blocks (both counters > 0): check if no space to place pieces
  // - If one counter is zero: check if we can still form W-block with existing pieces
  //   - If we can form W-blocks with existing pieces, don't complete
  //   - If we can't form W-blocks with existing pieces, complete (even if we can place remaining pieces)
  useEffect(() => {
    // Defer callback to avoid updating parent during render
    // If we can still make W-blocks (both counters > 0)
    if (availableRfbCount > 0 && availableLfbCount > 0) {
      // Check if there's space to place at least one piece of each type
      const canPlaceRfb = canPlacePieceType('RFB', pieces);
      const canPlaceLfb = canPlacePieceType('LFB', pieces);

      // If there's no space to place at least one piece of each type, Part B is complete
      // (Need both RFB and LFB to form W-block, so both must be placeable)
      if (!canPlaceRfb || !canPlaceLfb) {
        onPartBEnd?.();
        return;
      }
    } else {
      // If one counter is zero, rely on existing pieces on the board
      const rfbPieces = pieces.filter((p) => p.type === 'RFB');
      const lfbPieces = pieces.filter((p) => p.type === 'LFB');
      const maxPossibleWBlocks = Math.min(rfbPieces.length, lfbPieces.length);

      // If we don't have both piece types on the board, we can't form any more W-blocks
      if (maxPossibleWBlocks === 0) {
        onPartBEnd?.();
        return;
      }

      const currentWBlocks = detectAllWBlocks(pieces);

      // If we've formed every W-block that is possible with the remaining pieces, Part B is complete
      if (currentWBlocks.length >= maxPossibleWBlocks) {
        onPartBEnd?.();
        return;
      }
    }
  }, [availableRfbCount, availableLfbCount, pieces, canPlacePieceType, detectAllWBlocks, onPartBEnd]);

  const placeNewPiece = useCallback(
    (type: BlockType, anchorRow: number, anchorCol: number, rotation: PieceRotation = 0) => {
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
          setConflictState({ pieceId: null, cells: conflicts, blockingPieceIds });
          placed = false;
          return prev;
        }

        placed = true;
        clearConflict();

        if (type === 'RFB') {
          setAvailableRfbCount((prevCount) => Math.max(0, prevCount - 1));
          // Defer callback to avoid updating parent during render
          setTimeout(() => {
            onRfbCountChange?.(-1);
          }, 0);
        } else {
          setAvailableLfbCount((prevCount) => Math.max(0, prevCount - 1));
          // Defer callback to avoid updating parent during render
          setTimeout(() => {
            onLfbCountChange?.(-1);
          }, 0);
        }

        const updatedPieces = [...prev, candidate];

        // Check for W-block formation, score, and mark pieces (but don't remove pieces)
        return checkAndScoreWBlock(updatedPieces);
      });

      return placed;
    },
    [
      checkAndScoreWBlock,
      clearConflict,
      getNextPieceId,
      onLfbCountChange,
      onRfbCountChange,
      onScoreChange,
      onWCountChange,
      setConflictState,
      validatePlacement,
    ]
  );

  const moveExistingPiece = useCallback(
    (pieceId: string, anchorRow: number, anchorCol: number) => {
      let moved = false;

      setPieces((prev) => {
        const index = prev.findIndex((piece) => piece.id === pieceId);

        if (index === -1) {
          return prev;
        }

        const candidate = { ...prev[index], anchorRow, anchorCol };
        const { valid, conflicts, blockingPieceIds } = validatePlacement(candidate, prev, pieceId);

        if (!valid) {
          setConflictState({ pieceId, cells: conflicts, blockingPieceIds });
          moved = false;
          return prev;
        }

        const updated = [...prev];
        updated[index] = candidate;
        moved = true;
        clearConflict();

        // First check for destroyed W-blocks and unmark pieces
        let result = checkAndUnmarkDestroyedWBlocks(updated, pieceId);
        
        // Then check for new W-block formations, score, and mark pieces
        result = checkAndScoreWBlock(result);

        return result;
      });

      if (!moved) {
        return false;
      }

      setHiddenPieceId(null);
      return true;
    },
    [clearConflict, checkAndScoreWBlock, checkAndUnmarkDestroyedWBlocks, setConflictState, validatePlacement]
  );

  const rotatePiece = useCallback(
    (pieceId: string) => {
      setPieces((prev) => {
        const index = prev.findIndex((piece) => piece.id === pieceId);

        if (index === -1) {
          return prev;
        }

        const current = prev[index];
        const rotationIndex = ROTATIONS.indexOf(current.rotation);
        const nextRotation = ROTATIONS[(rotationIndex + 1) % ROTATIONS.length];
        const candidate = { ...current, rotation: nextRotation };
        const { valid, conflicts, blockingPieceIds } = validatePlacement(candidate, prev, pieceId);

        if (!valid) {
          setConflictState({ pieceId, cells: conflicts, blockingPieceIds });
          return prev;
        }

        clearConflict();
        const updated = [...prev];
        updated[index] = candidate;

        // First check for destroyed W-blocks and unmark pieces
        let result = checkAndUnmarkDestroyedWBlocks(updated, pieceId);
        
        // Then check for new W-block formations, score, and mark pieces
        result = checkAndScoreWBlock(result);

        return result;
      });
    },
    [checkAndScoreWBlock, checkAndUnmarkDestroyedWBlocks, clearConflict, setConflictState, validatePlacement]
  );

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

  const handleGridLayout = useCallback(() => {
    if (!gridRef.current || typeof gridRef.current.measureInWindow !== 'function') {
      return;
    }

    gridRef.current.measureInWindow((x, y, layoutWidth, layoutHeight) => {
      setGridBounds({
        x,
        y,
        width: layoutWidth,
        height: layoutHeight,
      });
    });
  }, []);

  const handleContainerLayout = useCallback(() => {
    if (!containerRef.current || typeof containerRef.current.measureInWindow !== 'function') {
      return;
    }

    containerRef.current.measureInWindow((x, y) => {
      setContainerOffset({ x, y });
    });
  }, []);

  const convertPointToGridCell = useCallback(
    (pageX: number, pageY: number) => {
      if (!gridBounds) {
        return null;
      }
      const centerX = gridBounds.x + gridBounds.width / 2;
      const centerY = gridBounds.y + gridBounds.height / 2;
      const relativeX = pageX - centerX;
      const relativeY = pageY - centerY;
      const radians = (-GRID_ROTATION_DEGREES * Math.PI) / 180;

      const unrotatedX = relativeX * Math.cos(radians) - relativeY * Math.sin(radians);
      const unrotatedY = relativeX * Math.sin(radians) + relativeY * Math.cos(radians);

      const gridPixelSize = cellSize * GRID_SIZE;
      const halfSize = gridPixelSize / 2;
      const localX = unrotatedX + halfSize;
      const localY = unrotatedY + halfSize;

      if (localX < 0 || localY < 0 || localX >= gridPixelSize || localY >= gridPixelSize) {
        return null;
      }

      const col = Math.floor(localX / cellSize);
      const row = Math.floor(localY / cellSize);

      return { row, col };
    },
    [cellSize, gridBounds]
  );

  const handleDrop = useCallback(
    (dragState: DragState, pageX: number, pageY: number) => {
      const cell = convertPointToGridCell(pageX, pageY);

      if (!cell) {
        if (dragState.source === 'board' && dragState.pieceId) {
          setConflictState({ pieceId: dragState.pieceId, cells: [], blockingPieceIds: [] });
        }

        return false;
      }

      const anchorRow = cell.row - dragState.offsetRow;
      const anchorCol = cell.col - dragState.offsetCol;

      if (dragState.source === 'counter') {
        return placeNewPiece(dragState.type, anchorRow, anchorCol, dragState.rotation);
      }

      if (dragState.source === 'board' && dragState.pieceId) {
        return moveExistingPiece(dragState.pieceId, anchorRow, anchorCol);
      }

      return false;
    },
    [convertPointToGridCell, moveExistingPiece, placeNewPiece, setConflictState]
  );

  const createCounterPanResponder = useCallback(
    (type: BlockType) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          canInteractWithPiece() &&
          (type === 'RFB' ? availableRfbCount > 0 : availableLfbCount > 0),
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

          if (!current) {
            return;
          }

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

  const findPieceAtCell = useCallback(
    (row: number, col: number) => pieces.find((piece) => getPieceCells(piece).some((cell) => cell.row === row && cell.col === col)),
    [getPieceCells, pieces]
  );

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

          if (!context) {
            return;
          }

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
            clearConflict();
            setHiddenPieceId(context.pieceId);
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

            if (!current) {
              return;
            }

            updateDraggingPiece({
              ...current,
              x: currentX,
              y: currentY,
            });
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          const context = boardInteractionRef.current;

          if (!context) {
            return;
          }

          if (context.hasMoved) {
            const dropX = gestureState.moveX ?? evt.nativeEvent.pageX;
            const dropY = gestureState.moveY ?? evt.nativeEvent.pageY;
            const current = draggingPieceRef.current;
            updateDraggingPiece(null);

            if (current) {
              const success = handleDrop(current, dropX, dropY);

              if (!success) {
                setHiddenPieceId(null);
              }
            } else {
              setHiddenPieceId(null);
            }
          } else {
            rotatePiece(context.pieceId);
          }

          boardInteractionRef.current = null;
        },
        onPanResponderTerminate: () => {
          updateDraggingPiece(null);
          setHiddenPieceId(null);
          boardInteractionRef.current = null;
        },
      }),
    [
      clearConflict,
      canInteractWithPiece,
      convertPointToGridCell,
      findPieceAtCell,
      gridBounds,
      handleDrop,
      rotatePiece,
      updateDraggingPiece,
    ]
  );

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
    const isInteractive = type !== 'W';
    const panHandlers =
      type === 'RFB'
        ? rfbPanResponder.panHandlers
        : type === 'LFB'
        ? lfbPanResponder.panHandlers
        : undefined;

    return (
      <View
        style={[
          gameStyles.counter,
          isInteractive && count === 0 ? gameStyles.counterDisabled : undefined,
        ]}
        {...(isInteractive ? panHandlers : {})}
      >
        <View
          style={[
            gameStyles.counterSquare,
            {
              width: square,
              height: square,
              borderColor: color,
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
    const cellValue = displayGrid[row]?.[col] ?? 0;
    const fillColor =
      cellValue === 3
        ? GAME_COLORS.wCounter // Yellow for W-block pieces
        : cellValue === 1
        ? GAME_COLORS.lCounter
        : cellValue === 2
        ? GAME_COLORS.jCounter
        : GAME_COLORS.background;
    const key = `${row}:${col}`;
    const isConflicted = conflictCellSet.has(key);
    const isBlocking = blockingCellSet.has(key);
    const borderColor = cellValue === 0 ? GAME_COLORS.gridLineFaded : GAME_COLORS.gridLine;

    return (
      <View
        key={`${row}-${col}`}
        pointerEvents="none"
        style={[
          gameStyles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: fillColor,
            borderColor,
            borderWidth: 0.5,
            position: 'relative',
          },
        ]}
      >
        {isBlocking ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderColor: GAME_COLORS.fail,
              borderWidth: 2,
              pointerEvents: 'none',
            }}
          />
        ) : null}
        {isConflicted ? (
          <View
            style={{
              position: 'absolute',
              top: 2,
              left: 2,
              right: 2,
              bottom: 2,
              backgroundColor: 'rgba(255, 0, 0, 0.35)',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </View>
    );
  };

  /**
   * Renders a row of grid cells
   */
  const renderRow = (row: number) => (
    <View key={row} style={gameStyles.row} pointerEvents="none">
      {Array.from({ length: GRID_SIZE }, (_, col) => renderCell(row, col))}
    </View>
  );

  const renderDraggingOverlay = () => {
    if (!draggingPiece) return null;

    const color = draggingPiece.type === 'RFB' ? GAME_COLORS.lCounter : GAME_COLORS.jCounter;
    const pattern = getRotatedPattern(draggingPiece.type, draggingPiece.rotation);
    const blockPixelSize = BLOCK_DIMENSION * cellSize;

    const relativeX = draggingPiece.x - containerOffset.x;
    const relativeY = draggingPiece.y - containerOffset.y;

    return (
      <View
        style={[
          gameStyles.draggingPiece,
          {
            left: relativeX - blockPixelSize / 2,
            top: relativeY - blockPixelSize / 2,
            transform: [{ rotate: `${GRID_ROTATION_DEGREES}deg` }],
            pointerEvents: 'none',
          },
        ]}
      >
        <View
          style={{
            width: blockPixelSize,
            height: blockPixelSize,
          }}
        >
          {pattern.map(([dy, dx], index) => (
            <View
              key={`${index}-${dy}-${dx}`}
              style={{
                position: 'absolute',
                left: dx * cellSize,
                top: dy * cellSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: color,
                borderColor: GAME_COLORS.gridLine,
                borderWidth: 0.5,
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View ref={containerRef} onLayout={handleContainerLayout} style={{ flex: 1, width: '100%' }}>
      <View style={gameStyles.gridWrapper} {...boardPanResponder.panHandlers}>
        <View
          ref={gridRef}
          onLayout={handleGridLayout}
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

      <View style={[gameStyles.countersContainer, { marginTop: 4 }]}>
        {renderCounter('RFB', availableRfbCount, GAME_COLORS.lCounter, 'L')}
        {renderCounter('LFB', availableLfbCount, GAME_COLORS.jCounter, '⅃')}
        {renderCounter('W', wCount, GAME_COLORS.wCounter, 'W')}
      </View>

      {renderDraggingOverlay()}
    </View>
  );
}
