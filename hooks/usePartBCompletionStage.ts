import { useEffect, useState } from 'react';

export type PartBCompletionStage = 'levelComplete' | 'niceTurnAround' | 'button';

/**
 * Hook that manages Part B completion stage sequence
 * levelComplete -> niceTurnAround -> button
 */
export function usePartBCompletionStage(isComplete: boolean): PartBCompletionStage | null {
  const [completionStage, setCompletionStage] = useState<PartBCompletionStage | null>(null);

  useEffect(() => {
    if (isComplete) {
      setCompletionStage('levelComplete');
      
      const timer1 = setTimeout(() => {
        setCompletionStage('niceTurnAround');
      }, 1000);
      
      const timer2 = setTimeout(() => {
        setCompletionStage('button');
      }, 2000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setCompletionStage(null);
    }
  }, [isComplete]);

  return completionStage;
}

