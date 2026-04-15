import { Box } from '@mui/material';
import { useRef } from 'react';

import type { ReactNode, TouchEvent } from 'react';

interface SwipeableContentProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const MIN_SWIPE_DISTANCE = 56;
const MAX_VERTICAL_DELTA = 36;

/**
 * Enables simple horizontal swipe navigation for tabbed mobile content.
 */
export default function SwipeableContent({
  children,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableContentProps) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    startRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = startRef.current;
    const touch = event.changedTouches[0];
    startRef.current = null;

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE || deltaY > MAX_VERTICAL_DELTA) {
      return;
    }

    if (deltaX < 0) {
      onSwipeLeft?.();
      return;
    }

    onSwipeRight?.();
  };

  return (
    <Box onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </Box>
  );
}
