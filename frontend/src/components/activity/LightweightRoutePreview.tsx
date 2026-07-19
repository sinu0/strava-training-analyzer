import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';

import { decodePolyline } from '@/utils/map';

interface LightweightRoutePreviewProps {
  activityName: string;
  summaryPolyline?: string | null;
  height?: number;
}

interface RouteGeometry {
  path: string;
  start: [number, number];
  end: [number, number];
}

function toRouteGeometry(points: [number, number][]): RouteGeometry | null {
  if (points.length < 2) return null;
  const latitudes = points.map(([lat]) => lat);
  const longitudes = points.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const projectedPoints = points
    .filter((_, index) => index % Math.max(1, Math.floor(points.length / 240)) === 0)
    .map(([lat, lng]) => {
      const x = 8 + ((lng - minLng) / lngRange) * 84;
      const y = 8 + (1 - (lat - minLat) / latRange) * 84;
      return [x, y] as [number, number];
    });
  const [start] = projectedPoints;
  const end = projectedPoints[projectedPoints.length - 1];
  if (!start || !end) return null;
  return {
    path: projectedPoints.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' '),
    start,
    end,
  };
}

export default function LightweightRoutePreview({
  activityName,
  summaryPolyline,
  height = 150,
}: LightweightRoutePreviewProps) {
  const theme = useTheme();
  const route = useMemo(() => {
    if (!summaryPolyline?.trim()) return null;
    try {
      return toRouteGeometry(decodePolyline(summaryPolyline));
    } catch {
      return null;
    }
  }, [summaryPolyline]);
  const routeColor = theme.palette.mode === 'light' ? '#FC4C02' : '#4ECDC4';
  const roadColor = theme.palette.mode === 'light' ? '#DCE3E9' : '#2A3948';

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
        position: 'relative',
        bgcolor: theme.palette.mode === 'light' ? '#F7F9FB' : 'rgba(8,13,19,0.65)',
        backgroundImage: theme.palette.mode === 'light'
          ? 'radial-gradient(circle at 66% 40%, rgba(22,166,200,0.10), transparent 52%), linear-gradient(145deg, #FFFFFF, #EEF3F6)'
          : 'radial-gradient(circle at 50% 50%, rgba(22,166,200,0.12), transparent 64%)',
      }}
    >
      {route ? (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <g fill="none" stroke={roadColor} strokeWidth="1.35" opacity="0.78" vectorEffect="non-scaling-stroke">
            <path d="M-6 18 C18 4 33 30 55 20 S87 3 108 17" />
            <path d="M-8 45 C17 32 29 61 47 52 S82 30 108 44" />
            <path d="M-4 73 C16 56 30 83 53 71 S83 58 105 74" />
            <path d="M18 -6 C29 15 19 32 31 49 S23 78 34 108" />
            <path d="M49 -4 C40 17 56 31 49 48 S60 80 55 108" />
            <path d="M78 -5 C67 19 81 35 73 55 S80 81 72 106" />
            <path d="M5 34 L92 68" strokeWidth="0.75" opacity="0.62" />
            <path d="M12 90 L88 15" strokeWidth="0.75" opacity="0.62" />
          </g>
          <path
            d={route.path}
            fill="none"
            stroke={theme.palette.mode === 'light' ? '#FFFFFF' : '#071018'}
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={route.path}
            fill="none"
            stroke={routeColor}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={route.start[0]} cy={route.start[1]} r="4.2" fill={routeColor} />
          <path d={`M ${route.start[0] - 1.5} ${route.start[1] + 1.9} L ${route.start[0] + 2.3} ${route.start[1]} L ${route.start[0] - 1.5} ${route.start[1] - 1.9} Z`} fill="#FFFFFF" />
          <circle cx={route.end[0]} cy={route.end[1]} r="2.7" fill="#FFFFFF" stroke={routeColor} strokeWidth="1.8" />
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
