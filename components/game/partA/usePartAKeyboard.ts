import { GamePhase, Piece } from '@/constants/game';
import { getRotationFromLevel } from '@/utils/gameLogic';
import { useEffect } from 'react';
import { Platform } from 'react-native';

interface UsePartAKeyboardProps {
  phase: GamePhase;
  gameStarted: boolean;
  currentPiece: Piece | null;
  grid: number[][];
  level: number;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDrop: () => void;
  onDropLeft?: () => void;
  onDropRight?: () => void;
  onDropUp?: () => void;
  onDropDown?: () => void;
  onRotate: () => void;
}

/**
 * Hook that manages keyboard input for web platform (Part A only)
 * Different key mappings for each level range:
 * - Level 1-2: left/right=move, up=rotate, down=drop down
 * - Level 3-4: left=drop left, right=rotate, up/down=move vertical
 * - Level 5-6: left=rotate, right=drop right, up/down=move vertical
 * - Level 7-8: left/right=move, up=drop up, down=rotate
 */
export function usePartAKeyboard({
  phase,
  gameStarted,
  currentPiece,
  grid,
  level,
  onMoveLeft,
  onMoveRight,
  onMoveUp,
  onMoveDown,
  onDrop,
  onDropLeft,
  onDropRight,
  onDropUp,
  onDropDown,
  onRotate,
}: UsePartAKeyboardProps) {
  useEffect(() => {
    if (Platform.OS !== 'web' || phase !== 'partA' || !gameStarted) {
      return;
    }

    const handleKeyPress = (e: globalThis.KeyboardEvent) => {
      if (!currentPiece) return;

      // Level 1-2: left/right=move, up=rotate, down=fast fall down
      if (level <= 2) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onMoveLeft();
            break;
          case 'ArrowRight':
            e.preventDefault();
            onMoveRight();
            break;
          case 'ArrowUp':
            e.preventDefault();
            onRotate();
            break;
          case 'ArrowDown':
            e.preventDefault();
            // Fast fall/drop to bottom instantly
            if (onDropDown) {
              onDropDown();
            } else {
              onDrop();
            }
            break;
          case ' ':
            e.preventDefault();
            onRotate();
            break;
        }
      }
      // Level 3-4: left=drop left, right=rotate, up/down=move vertical
      else if (level >= 3 && level <= 4) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onDropLeft?.();
            break;
          case 'ArrowRight':
            e.preventDefault();
            onRotate();
            break;
          case 'ArrowUp':
            e.preventDefault();
            onMoveUp?.();
            break;
          case 'ArrowDown':
            e.preventDefault();
            onMoveDown?.();
            break;
          case ' ':
            e.preventDefault();
            onRotate();
            break;
        }
      }
      // Level 5-6: left=rotate, right=drop right, up/down=move vertical
      else if (level >= 5 && level <= 6) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onRotate();
            break;
          case 'ArrowRight':
            e.preventDefault();
            onDropRight?.();
            break;
          case 'ArrowUp':
            e.preventDefault();
            onMoveUp?.();
            break;
          case 'ArrowDown':
            e.preventDefault();
            onMoveDown?.();
            break;
          case ' ':
            e.preventDefault();
            onRotate();
            break;
        }
      }
      // Level 7-8: left/right=move, up=drop up, down=rotate
      else if (level >= 7 && level <= 8) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onMoveLeft();
            break;
          case 'ArrowRight':
            e.preventDefault();
            onMoveRight();
            break;
          case 'ArrowUp':
            e.preventDefault();
            // Up arrow = fast falling up (drop in up direction)
            if (onDropUp) {
              onDropUp();
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            onRotate();
            break;
          case ' ':
            e.preventDefault();
            onRotate();
            break;
        }
      }
      // Level 9+: Random level from 1-8, use that level's keyboard mapping
      else {
        // Get the rotation to determine which level's controls to use
        const rotation = getRotationFromLevel(level);
        
        // Determine which level range this rotation corresponds to
        // 0° = level 1-2, 90° = level 3-4, 270° = level 5-6, 180° = level 7-8
        if (rotation === 0) {
          // Level 1-2 mapping: left/right=move, up=rotate, down=fast fall down
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              onMoveLeft();
              break;
            case 'ArrowRight':
              e.preventDefault();
              onMoveRight();
              break;
            case 'ArrowUp':
              e.preventDefault();
              onRotate();
              break;
            case 'ArrowDown':
              e.preventDefault();
              if (onDropDown) {
                onDropDown();
              } else {
                onDrop();
              }
              break;
            case ' ':
              e.preventDefault();
              onRotate();
              break;
          }
        } else if (rotation === 90) {
          // Level 3-4 mapping: left=drop left, right=rotate, up/down=move vertical
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              onDropLeft?.();
              break;
            case 'ArrowRight':
              e.preventDefault();
              onRotate();
              break;
            case 'ArrowUp':
              e.preventDefault();
              onMoveUp?.();
              break;
            case 'ArrowDown':
              e.preventDefault();
              onMoveDown?.();
              break;
            case ' ':
              e.preventDefault();
              onRotate();
              break;
          }
        } else if (rotation === 270) {
          // Level 5-6 mapping: left=rotate, right=drop right, up/down=move vertical
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              onRotate();
              break;
            case 'ArrowRight':
              e.preventDefault();
              onDropRight?.();
              break;
            case 'ArrowUp':
              e.preventDefault();
              onMoveUp?.();
              break;
            case 'ArrowDown':
              e.preventDefault();
              onMoveDown?.();
              break;
            case ' ':
              e.preventDefault();
              onRotate();
              break;
          }
        } else if (rotation === 180) {
          // Level 7-8 mapping: left/right=move, up=drop up, down=rotate
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              onMoveLeft();
              break;
            case 'ArrowRight':
              e.preventDefault();
              onMoveRight();
              break;
            case 'ArrowUp':
              e.preventDefault();
              if (onDropUp) {
                onDropUp();
              }
              break;
            case 'ArrowDown':
              e.preventDefault();
              onRotate();
              break;
            case ' ':
              e.preventDefault();
              onRotate();
              break;
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [phase, gameStarted, currentPiece, grid, level, onMoveLeft, onMoveRight, onMoveUp, onMoveDown, onDrop, onDropLeft, onDropRight, onDropUp, onDropDown, onRotate]);
}

