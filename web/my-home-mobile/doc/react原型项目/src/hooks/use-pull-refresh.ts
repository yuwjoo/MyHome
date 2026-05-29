import { useState, useRef, useCallback } from 'react';

interface PullRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

interface PullRefreshState {
  pulling: boolean;
  refreshing: boolean;
  pullDistance: number;
}

export function usePullRefresh({ onRefresh, threshold = 72 }: PullRefreshOptions) {
  const [state, setState] = useState<PullRefreshState>({
    pulling: false,
    refreshing: false,
    pullDistance: 0,
  });

  const startYRef = useRef<number | null>(null);
  const isAtTopRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    const scrollTop = container ? container.scrollTop : window.scrollY;
    isAtTopRef.current = scrollTop <= 0;
    if (isAtTopRef.current) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isAtTopRef.current || startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) return;
    const distance = Math.min(delta * 0.5, threshold * 1.4);
    setState((prev) => ({ ...prev, pulling: true, pullDistance: distance }));
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.pulling) return;
    const triggered = state.pullDistance >= threshold;
    if (triggered) {
      setState({ pulling: false, refreshing: true, pullDistance: 0 });
      console.log(`[PullRefresh] refresh triggered`);
      try {
        await onRefresh();
      } finally {
        setState({ pulling: false, refreshing: false, pullDistance: 0 });
      }
    } else {
      setState({ pulling: false, refreshing: false, pullDistance: 0 });
    }
    startYRef.current = null;
    isAtTopRef.current = false;
  }, [state.pulling, state.pullDistance, threshold, onRefresh]);

  return {
    containerRef,
    pulling: state.pulling,
    refreshing: state.refreshing,
    pullDistance: state.pullDistance,
    threshold,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
