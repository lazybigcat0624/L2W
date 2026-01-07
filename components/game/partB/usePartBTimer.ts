import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePartBTimerProps {
  isActive: boolean;
  initialTimeSeconds?: number;
  onTimeUp?: () => void;
  bonusTimeSeconds?: number;
}

/**
 * Hook that manages Part B timer
 * Tracks time remaining and handles time-up events
 */
export function usePartBTimer({
  isActive,
  initialTimeSeconds = 120, // 2 minutes default
  onTimeUp,
  bonusTimeSeconds = 0,
}: UsePartBTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeSeconds + bonusTimeSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);

  // Reset timer when active state changes or bonus time is added
  useEffect(() => {
    if (isActive) {
      // Only reset if timer hasn't timed out or if we're restarting
      if (!hasTimedOut) {
        const newTime = initialTimeSeconds + bonusTimeSeconds;
        setTimeRemaining(newTime);
        setIsPaused(false);
        startTimeRef.current = Date.now();
        totalPausedTimeRef.current = 0;
        pausedTimeRef.current = 0;
      }
    } else if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isActive, initialTimeSeconds, bonusTimeSeconds]);

  // Timer countdown logic
  useEffect(() => {
    if (!isActive || hasTimedOut || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setHasTimedOut(true);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, hasTimedOut, isPaused, onTimeUp]);

  const addBonusTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
  }, []);

  const resetTimer = useCallback(() => {
    setHasTimedOut(false);
    setIsPaused(false);
    setTimeRemaining(initialTimeSeconds + bonusTimeSeconds);
    startTimeRef.current = Date.now();
    totalPausedTimeRef.current = 0;
    pausedTimeRef.current = 0;
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [initialTimeSeconds, bonusTimeSeconds]);

  const pauseTimer = useCallback(() => {
    if (!isPaused) {
      setIsPaused(true);
      pausedTimeRef.current = Date.now();
    }
  }, [isPaused]);

  const resumeTimer = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      if (pausedTimeRef.current > 0) {
        totalPausedTimeRef.current += Date.now() - pausedTimeRef.current;
        pausedTimeRef.current = 0;
      }
    }
  }, [isPaused]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    hasTimedOut,
    isPaused,
    addBonusTime,
    resetTimer,
    pauseTimer,
    resumeTimer,
  };
}

