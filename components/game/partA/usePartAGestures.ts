import { GamePhase } from '@/constants/game';
import { useCallback, useMemo, useRef } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState
} from 'react-native';

const TAP_THRESHOLD = 10;
const SWIPE_THRESHOLD = 30;
const SWIPE_COOLDOWN_MS = 120;

interface SwipeState {
  direction: 'left' | 'right' | 'down' | 'up';
  time: number;
}

interface UsePartAGesturesProps {
  phase: GamePhase;
  onTap: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown: () => void;
  onSwipeUp?: () => void;
}

/**
 * Hook that manages gesture handling for Part A
 * Handles taps and swipes for piece control
 */
export function usePartAGestures({
  phase,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  onSwipeDown,
  onSwipeUp,
}: UsePartAGesturesProps) {
  const lastSwipeRef = useRef<SwipeState | null>(null);

  const handleHorizontalSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const now = Date.now();
      const canSwipe =
        !lastSwipeRef.current ||
        lastSwipeRef.current.direction !== direction ||
        now - lastSwipeRef.current.time > SWIPE_COOLDOWN_MS;

      if (!canSwipe) return;

      lastSwipeRef.current = { direction, time: now };
      if (direction === 'right') {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    },
    [onSwipeLeft, onSwipeRight]
  );

  const handleVerticalSwipe = useCallback(
    (direction: 'up' | 'down') => {
      const now = Date.now();
      const canSwipe =
        !lastSwipeRef.current ||
        lastSwipeRef.current.direction !== direction ||
        now - lastSwipeRef.current.time > SWIPE_COOLDOWN_MS;

      if (!canSwipe) return;

      lastSwipeRef.current = { direction, time: now };
      if (direction === 'down') {
        onSwipeDown();
      } else if (onSwipeUp) {
        onSwipeUp();
      }
    },
    [onSwipeDown, onSwipeUp]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => phase === 'partA',
        onMoveShouldSetPanResponder: () => phase === 'partA',
        onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          if (phase !== 'partA') return;

          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          // Horizontal swipe
          if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
            const direction: 'left' | 'right' = dx > 0 ? 'right' : 'left';
            handleHorizontalSwipe(direction);
          }
          // Vertical swipe (up or down)
          else if (absDy > absDx && absDy > SWIPE_THRESHOLD) {
            const direction: 'up' | 'down' = dy > 0 ? 'down' : 'up';
            handleVerticalSwipe(direction);
          }
        },
        onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
          lastSwipeRef.current = null;

          if (phase !== 'partA') return;

          // Detect tap (small movement)
          const absDx = Math.abs(gestureState.dx);
          const absDy = Math.abs(gestureState.dy);
          if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD) {
            onTap();
          }
        },
      }),
    [phase, handleHorizontalSwipe, handleVerticalSwipe, onTap]
  );

  return panResponder;
}

