import { GamePhase } from '@/constants/game';
import { useEffect, useState } from 'react';

export type TransitionStage = 'redFail' | 'greenFailForward' | 'button';

/**
 * Hook that manages Part A transition stage sequence
 * redFail -> greenFailForward -> button
 */
export function useTransitionStage(phase: GamePhase): TransitionStage {
  const [transitionStage, setTransitionStage] = useState<TransitionStage>('redFail');

  useEffect(() => {
    if (phase === 'transitionAB') {
      setTransitionStage('redFail');
      
      const timer1 = setTimeout(() => {
        setTransitionStage('greenFailForward');
      }, 1000);
      
      const timer2 = setTimeout(() => {
        setTransitionStage('button');
      }, 2000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setTransitionStage('redFail');
    }
  }, [phase]);

  return transitionStage;
}

