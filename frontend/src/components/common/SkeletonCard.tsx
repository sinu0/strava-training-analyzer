import { Box, Skeleton, Stack } from '@mui/material';

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
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.tokens?.surfaceBorder ?? theme.palette.divider}`,
        boxShadow: (theme) => theme.tokens?.cardShadow ?? 'none',
        overflow: 'hidden',
        minHeight: height,
      }}
    >
      <Box sx={{ px: { xs: 2, md: 2.5, lg: 3 }, pt: { xs: 2, md: 2.5 }, pb: 1 }}>
        {title ? <Skeleton variant="text" width="34%" height={22} sx={{ borderRadius: 2 }} /> : null}
      </Box>
      <Stack spacing={1.2} sx={{ px: { xs: 2, md: 2.5, lg: 3 }, pb: { xs: 2, md: 2.5, lg: 3 } }}>
        <Skeleton
          variant="rounded"
          height={typeof height === 'number' ? Math.max(80, height) - 80 : 140}
          sx={{ borderRadius: 4 }}
        />
        {lineKeys.map((lineKey, index) => (
          <Skeleton
            key={lineKey}
            variant="text"
            width={index === lines - 1 ? '55%' : '100%'}
            height={16}
          />
        ))}
      </Stack>
    </Box>
  );
}
