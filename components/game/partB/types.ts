export type BlockType = 'RFB' | 'LFB';
export type PieceRotation = 0 | 90 | 180 | 270;
export type DragSource = 'counter' | 'board';

export interface CounterSizes {
  letter: number;
  number: number;
  square: number;
}

export interface PieceState {
  id: string;
  type: BlockType;
  rotation: PieceRotation;
  anchorRow: number;
  anchorCol: number;
  isWBlock?: boolean;
}

export interface DragState {
  source: DragSource;
  type: BlockType;
  rotation: PieceRotation;
  x: number;
  y: number;
  offsetRow: number;
  offsetCol: number;
  pieceId?: string;
}

export interface GridBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConflictStatePayload {
  pieceId: string | null;
  cells: Array<{ row: number; col: number }>;
  blockingPieceIds: string[];
}


