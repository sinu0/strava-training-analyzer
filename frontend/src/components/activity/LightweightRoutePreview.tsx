import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { decodePolyline } from '@/utils/map';

interface LightweightRoutePreviewProps {
  activityName: string;
  summaryPolyline?: string | null;
  height?: number;
}

function toSvgPath(points: [number, number][]): string {
  if (points.length < 2) return '';
  const latitudes = points.map(([lat]) => lat);
  const longitudes = points.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  return points
    .filter((_, index) => index % Math.max(1, Math.floor(points.length / 240)) === 0)
    .map(([lat, lng], index) => {
      const x = 8 + ((lng - minLng) / lngRange) * 84;
      const y = 8 + (1 - (lat - minLat) / latRange) * 84;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export default function LightweightRoutePreview({
  activityName,
  summaryPolyline,
  height = 150,
}: LightweightRoutePreviewProps) {
  const path = useMemo(() => {
    if (!summaryPolyline?.trim()) return '';
    try {
      return toSvgPath(decodePolyline(summaryPolyline));
    } catch {
      return '';
    }
  }, [summaryPolyline]);

  return (
    <Box
      role="img"
      aria-label={`Ślad trasy: ${activityName}`}
      data-testid="lightweight-route-preview"
      sx={{
        height,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        bgcolor: 'rgba(8,13,19,0.65)',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(78,205,196,0.08), transparent 64%)',
      }}
    >
      {path ? (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <path
            d={path}
            fill="none"
            stroke="#4ECDC4"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : (
        <Stack alignItems="center" spacing={0.5} color="text.secondary">
          <RouteOutlinedIcon />
          <Typography variant="caption">Brak zapisu trasy</Typography>
        </Stack>
      )}
    </Box>
  );
}
