import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRef, useState } from 'react';

import type { ReactNode, TouchEvent } from 'react';

interface PullToRefreshPanelProps {
  children: ReactNode;
  onRefresh: () => Promise<unknown> | unknown;
  disabled?: boolean;
}

const PULL_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 108;

/**
 * Adds a lightweight mobile-first pull-to-refresh gesture without changing page layout.
 */
export default function PullToRefreshPanel({
  children,
  onRefresh,
  disabled = false,
}: PullToRefreshPanelProps) {
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const canPull = () => {
    if (disabled || isRefreshing) {
      return false;
    }

    return window.scrollY <= 0;
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!canPull()) {
      startYRef.current = null;
      return;
    }

    startYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (startYRef.current == null || !canPull()) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? startYRef.current;
    const nextDistance = Math.max(0, currentY - startYRef.current);
    setPullDistance(Math.min(MAX_PULL_DISTANCE, nextDistance * 0.55));
  };

  const reset = () => {
    startYRef.current = null;
    setPullDistance(0);
  };

  const handleTouchEnd = async () => {
    if (pullDistance < PULL_THRESHOLD || disabled || isRefreshing) {
      reset();
      return;
    }

    setIsRefreshing(true);
    setPullDistance(PULL_THRESHOLD);

    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      reset();
    }
  };

  const progress = Math.min(100, Math.round((pullDistance / PULL_THRESHOLD) * 100));

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => {
        void handleTouchEnd();
      }}
      sx={{ position: 'relative' }}
    >
      <Box
        aria-hidden
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          height: pullDistance > 0 || isRefreshing ? pullDistance : 0,
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
          overflow: 'hidden',
          color: 'text.secondary',
          transition: 'height 0.2s ease, opacity 0.2s ease',
        }}
      >
        {isRefreshing ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <RefreshIcon
            fontSize="small"
            sx={{
              transform: pullDistance >= PULL_THRESHOLD ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        )}
        <Typography variant="caption" sx={{ fontSize: '0.78rem' }}>
          {isRefreshing
            ? 'Odświeżanie…'
            : progress >= 100
              ? 'Puść, aby odświeżyć'
              : 'Pociągnij, aby odświeżyć'}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}
