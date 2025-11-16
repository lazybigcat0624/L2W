import { GamePhase, Piece } from '@/constants/game';

export interface GameState {
  phase: GamePhase;
  score: number;
  level: number;
  rfbCount: number;
  lfbCount: number;
  wCount: number;
  grid: number[][];
  partBGrid: number[][];
  currentPiece: Piece | null;
  gameStarted: boolean;
  nextPiece: Piece | null;
}

export interface LBlock {
  type: 'RFB' | 'LFB';
  cells: number[][];
}

export interface WBlock {
  cells: number[][];
}

