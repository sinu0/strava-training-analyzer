import { Skeleton, Stack } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import Surface from '../Surface';

interface SkeletonCardProps {
  title?: boolean;
  lines?: number;
  height?: number | string;
}

/**
 * Renders a shared skeleton surface that preserves layout while async content loads.
 */
export default function SkeletonCard({
  title = true,
  lines = 3,
  height = 220,
}: SkeletonCardProps) {
  const lineKeys = Array.from({ length: lines }, (_, lineIndex) =>
    lineIndex === lines - 1 ? `tail-${lineIndex}` : `body-${lineIndex}`,
  );

  return (
    <Surface padding="none" sx={{ minHeight: height }}>
      <Stack spacing={1.2} sx={{ p: (theme) => getAppThemeTokens(theme).space.card }}>
        {title ? <Skeleton variant="text" width="34%" height={22} /> : null}
        <Skeleton variant="rounded" height={typeof height === 'number' ? Math.max(80, height) - 80 : 140} sx={{ borderRadius: 4 }} />
        {lineKeys.map((lineKey, index) => (
          <Skeleton key={lineKey} variant="text" width={index === lines - 1 ? '55%' : '100%'} height={16} />
        ))}
      </Stack>
    </Surface>
  );
}
