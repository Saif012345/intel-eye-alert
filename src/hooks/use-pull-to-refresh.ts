import { useRef, useState, useEffect, useCallback } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || isRefreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        // Dampen the pull
        const dampened = Math.min(diff * 0.5, maxPull);
        setPullDistance(dampened);
        if (dampened > 10) e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistance >= threshold) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isRefreshing, pullDistance, threshold, maxPull, handleRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  return { containerRef, pullDistance, isRefreshing, progress };
}
