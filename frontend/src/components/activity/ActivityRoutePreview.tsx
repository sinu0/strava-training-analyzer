import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const ActivityMap = lazy(() => import('@/components/ActivityMap'));

interface ActivityRoutePreviewProps {
  activityName: string;
  summaryPolyline?: string | null;
  height?: number | string;
  priority?: boolean;
  showEmptyState?: boolean;
}

export default function ActivityRoutePreview({
  activityName,
  summaryPolyline,
  height = 210,
  priority = false,
  showEmptyState = true,
}: ActivityRoutePreviewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    priority || typeof IntersectionObserver === 'undefined',
  );
  const hasRoute = Boolean(summaryPolyline?.trim());

  useEffect(() => {
    if (visible || !hasRoute || !rootRef.current || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '420px 0px' },
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [hasRoute, visible]);

  if (!hasRoute && !showEmptyState) return null;

  return (
    <Box
      ref={rootRef}
      role="img"
      aria-label={`Mapa trasy: ${activityName}`}
      sx={{
        position: 'relative',
        height,
        minHeight: typeof height === 'number' ? height : 160,
        overflow: 'hidden',
        bgcolor: 'rgba(8, 12, 18, 0.94)',
        isolation: 'isolate',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: 410,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(5,8,12,0.02) 45%, rgba(5,8,12,0.52) 100%)',
        },
      }}
    >
      {hasRoute ? (
        visible ? (
          <Suspense fallback={<Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />}>
            <ActivityMap
              summaryPolyline={summaryPolyline}
              minHeight={0}
              interactive={false}
              showAttribution={false}
              preview
            />
          </Suspense>
        ) : (
          <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
        )
      ) : (
        <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: '100%', color: 'text.secondary' }}>
          <RouteOutlinedIcon sx={{ fontSize: 34, opacity: 0.5 }} />
          <Typography variant="caption">Brak zapisu trasy</Typography>
        </Stack>
      )}

      {hasRoute ? (
        <Stack
          direction="row"
          spacing={0.65}
          alignItems="center"
          sx={{
            position: 'absolute',
            left: 12,
            bottom: 10,
            zIndex: 420,
            px: 1,
            py: 0.55,
            borderRadius: 999,
            bgcolor: 'rgba(8, 12, 18, 0.76)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <MapOutlinedIcon sx={{ fontSize: 15, color: 'primary.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.primary' }}>
            Trasa GPS
          </Typography>
        </Stack>
      ) : null}
    </Box>
  );
}
