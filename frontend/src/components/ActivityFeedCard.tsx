import BoltIcon from '@mui/icons-material/Bolt';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LandscapeIcon from '@mui/icons-material/Landscape';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import PoolIcon from '@mui/icons-material/Pool';
import StraightenIcon from '@mui/icons-material/Straighten';
import TimerIcon from '@mui/icons-material/Timer';
import { Box, Typography, Chip, Paper, Stack, Divider } from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';

import { DEFAULT_MAP_TILE_VARIANT, MAP_TILE_CONFIG } from '@/constants/mapTiles';
import type { ActivitySummary } from '@/types/activity';
import { BENEFIT_COLORS, BENEFIT_LABELS } from '@/types/trainingEffect';
import type { MaxValues, MetricKey } from '@/types/metrics';
import {
  CHART_COLORS,
  COMMON_COLORS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
  getSportColor,
} from '@/utils/colors';
import { formatDistance, formatDuration } from '@/utils/formatters';
import { decodePolyline } from '@/utils/map';
import 'leaflet/dist/leaflet.css';

function getSportIcon(sportType: string) {
  const t = sportType?.toLowerCase() ?? '';
  if (t.includes('cycling') || t.includes('bike') || t.includes('ride')) return <DirectionsBikeIcon fontSize="small" />;
  if (t.includes('run')) return <DirectionsRunIcon fontSize="small" />;
  if (t.includes('swim')) return <PoolIcon fontSize="small" />;
  return <FitnessCenterIcon fontSize="small" />;
}

interface ActivityFeedCardProps {
  activity: ActivitySummary;
  onClick: (id: string) => void;
  metricKey?: MetricKey;
  maxValues?: MaxValues;
  summaryText?: string;
}

const previewFrameSx = {
  width: 282,
  height: 168,
  borderRadius: 1,
  overflow: 'hidden',
  flexShrink: 0,
  position: 'relative',
  zIndex: 1,
} as const;

const ActivityPreview = memo(function ActivityPreview({
  positions,
  photoUrls,
  activityName,
}: {
  positions: [number, number][];
  photoUrls?: string[] | null;
  activityName: string;
}) {
  const photos = photoUrls ?? [];
  const hasMap = positions.length >= 2;

  if (!hasMap && photos.length === 0) {
    return (
      <Box
        data-testid="activity-preview"
        sx={{
          ...previewFrameSx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: SURFACE_COLORS.subtle,
        }}
      >
        <LandscapeIcon sx={{ color: 'text.disabled', fontSize: 32 }} />
      </Box>
    );
  }

  if (!hasMap) {
    return (
      <Box data-testid="activity-preview" sx={previewFrameSx}>
        <Box
          component="img"
          src={photos[0]}
          alt={activityName}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        <Stack
          spacing={0.75}
          sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 2, pointerEvents: 'none' }}
        >
          <PreviewBadge icon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 14 }} />} label={`Zdjęcia ${photos.length}`} />
        </Stack>
      </Box>
    );
  }

  const lats = positions.map(p => p[0]);
  const lngs = positions.map(p => p[1]);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];

  return (
    <Box
      data-testid="activity-preview"
      sx={{
        ...previewFrameSx,
        '.leaflet-container': { height: '100%' },
        '.leaflet-tile': {
          filter: 'contrast(1.24) saturate(1.16) brightness(0.78)',
        },
      }}
    >
      <MapContainer
        center={center}
        bounds={[
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ]}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url={MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT].url}
          attribution={MAP_TILE_CONFIG[DEFAULT_MAP_TILE_VARIANT].attribution}
        />
        <Polyline
          positions={positions}
          pathOptions={{ color: STATUS_COLORS.accent, weight: 3.6, opacity: 0.98 }}
        />
      </MapContainer>

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${alphaColor(CHART_COLORS.tooltip, 0.03)} 0%, ${alphaColor(CHART_COLORS.tooltip, 0.1)} 100%)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {photos.length > 0 && (
        <Stack
          spacing={0.75}
          sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 420, pointerEvents: 'none' }}
        >
          <PreviewBadge icon={<MapOutlinedIcon sx={{ fontSize: 14 }} />} label="Mapa" active />
          <PreviewBadge icon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 14 }} />} label={`Zdjęcia ${photos.length}`} />
        </Stack>
      )}
    </Box>
  );
});

function PreviewBadge({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.6,
        px: 1,
        py: 0.55,
        borderRadius: 1.2,
        bgcolor: active ? alphaColor(STATUS_COLORS.accent, 0.18) : alphaColor(CHART_COLORS.tooltip, 0.72),
        color: active ? STATUS_COLORS.accent : CHART_COLORS.tooltipText,
        border: active
          ? `1px solid ${alphaColor(STATUS_COLORS.accent, 0.45)}`
          : `1px solid ${alphaColor(CHART_COLORS.tooltipText, 0.1)}`,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 8px 18px ${alphaColor(COMMON_COLORS.black, 0.18)}`,
      }}
    >
      {icon}
      <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
}

function MetricBubble({ activity, metricKey, maxValues }: { activity: ActivitySummary; metricKey: MetricKey; maxValues: MaxValues }) {
  const [hovered, setHovered] = useState(false);
  const val = metricKey === 'distance' ? (activity.distanceM || 0)
    : metricKey === 'time' ? (activity.movingTimeSec || 0)
    : metricKey === 'power' ? (activity.avgPowerW || 0)
    : (activity.avgHeartrate || 0);
  const max = maxValues[metricKey];
  const minVal = metricKey === 'distance' ? (maxValues.minDistance || 0)
    : metricKey === 'time' ? (maxValues.minTime || 0)
    : metricKey === 'power' ? (maxValues.minPower || 0)
    : (maxValues.minHr || 0);
  const range = max - minVal;
   const ratio = range > 0 ? Math.max(0.15, (val - minVal) / range) : 0.15;
   const size = 30 + ratio * 40;
   const displaySize = hovered ? Math.min(size * 1.5, 100) : size;
   const color = metricKey === 'hr'
     ? STATUS_COLORS.error
     : metricKey === 'power'
       ? STATUS_COLORS.warning
       : getSportColor(activity.sportType);

  let label = '—';
  if (val > 0) {
    if (metricKey === 'distance') {
      label = activity.distanceM >= 1000 ? `${(activity.distanceM / 1000).toFixed(0)}km` : `${Math.round(activity.distanceM)}m`;
    } else if (metricKey === 'time') {
      const h = Math.floor(activity.movingTimeSec / 3600);
      const m = Math.floor((activity.movingTimeSec % 3600) / 60);
      label = h > 0 ? `${h}h${m}` : `${m}'`;
    } else if (metricKey === 'power') {
      label = `${activity.avgPowerW}W`;
    } else {
      label = `${activity.avgHeartrate}`;
    }
  }

  return (
    <Box
      data-testid="metric-bubble"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        width: displaySize, height: displaySize, borderRadius: '50%',
        bgcolor: `${color}18`, border: `2px solid ${color}70`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, alignSelf: 'center',
        transition: 'width 0.4s ease, height 0.4s ease, background-color 0.35s, border-color 0.35s',
        boxShadow: `0 2px 12px ${color}28`,
      }}
    >
      <Typography sx={{ fontSize: displaySize > 68 ? '0.92rem' : displaySize > 52 ? '0.82rem' : '0.72rem', fontWeight: 700, color, lineHeight: 1.1, textAlign: 'center', pointerEvents: 'none' }}>
        {label}
      </Typography>
    </Box>
  );
}

const ActivityFeedCard = memo(function ActivityFeedCard({
  activity,
  onClick,
  metricKey,
  maxValues,
  summaryText,
}: ActivityFeedCardProps) {
  const positions = useMemo(() => {
    if (!activity.summaryPolyline) return [] as [number, number][];
    try { return decodePolyline(activity.summaryPolyline); } catch { return [] as [number, number][]; }
  }, [activity.summaryPolyline]);
  const handleClick = useCallback(() => {
    onClick(activity.id);
  }, [activity.id, onClick]);

  const sportColor = getSportColor(activity.sportType);
  const date = new Date(activity.startedAt);
  const isRecentActivity = Date.now() - date.getTime() < 36 * 60 * 60 * 1000;
  const dateStr = date.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Paper
      onClick={handleClick}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        p: 1.75,
        position: 'relative',
        overflow: 'visible',
        cursor: 'pointer',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alphaColor(COMMON_COLORS.white, 0.08),
        borderLeft: `4px solid ${isRecentActivity ? sportColor : alphaColor(COMMON_COLORS.white, 0.08)}`,
        alignItems: 'stretch',
        minHeight: 188,
        isolation: 'isolate',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: `${sportColor}66`,
          bgcolor: `${sportColor}08`,
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 20px ${sportColor}20`,
        },
      }}
    >
      <Chip
        data-testid="activity-sport-chip"
        icon={getSportIcon(activity.sportType)}
        label={activity.sportType}
        size="small"
        sx={{
          position: 'absolute',
          top: 0,
          left: 16,
          transform: 'translateY(-25%)',
          zIndex: 20,
          bgcolor: `${sportColor}22`,
          color: sportColor,
          border: `1px solid ${sportColor}55`,
          boxShadow: `0 8px 20px ${sportColor}22`,
          backdropFilter: 'blur(10px)',
          fontWeight: 600,
          fontSize: '0.72rem',
          height: 28,
          px: 0.35,
          '& .MuiChip-icon': { color: sportColor },
        }}
      />

      <ActivityPreview positions={positions} photoUrls={activity.photoUrls} activityName={activity.name} />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body1" fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
              {activity.name}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mt: 0.25 }}>
              <Typography variant="caption" color="text.secondary">
                {dateStr}
              </Typography>
              {isRecentActivity ? (
                <Typography variant="caption" sx={{ color: sportColor, fontWeight: 700 }}>
                  Najnowsza aktywność
                </Typography>
              ) : null}
            </Stack>
          </Box>
          {!!metricKey && !!maxValues ? (
            <MetricBubble activity={activity} metricKey={metricKey} maxValues={maxValues} />
          ) : null}
        </Stack>

        <Divider sx={{ my: 0.25, borderColor: alphaColor(COMMON_COLORS.white, 0.06) }} />

        {summaryText ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {summaryText}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={0} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          {activity.primaryBenefit && (
            <BenefitChip benefit={activity.primaryBenefit} />
          )}
          {activity.distanceM != null && activity.distanceM > 0 && (
            <StatChip icon={<StraightenIcon sx={{ fontSize: '2rem' }} />} value={formatDistance(activity.distanceM)} color={sportColor} />
          )}
          {activity.movingTimeSec != null && (
            <StatChip icon={<TimerIcon sx={{ fontSize: '2rem' }} />} value={formatDuration(activity.movingTimeSec)} color={sportColor} />
          )}
          {activity.avgHeartrate != null && (
            <StatChip icon={<FavoriteIcon sx={{ fontSize: '2rem' }} />} value={`${activity.avgHeartrate} bpm`} color={STATUS_COLORS.error} />
          )}
          {activity.avgPowerW != null && (
            <StatChip icon={<BoltIcon sx={{ fontSize: '2rem' }} />} value={`${activity.avgPowerW} W`} color={STATUS_COLORS.warning} />
          )}
          {activity.avgSpeedMs != null && activity.avgSpeedMs > 0 && (
            <StatChip icon={<DirectionsBikeIcon sx={{ fontSize: '2rem' }} />} value={`${(activity.avgSpeedMs * 3.6).toFixed(1)} km/h`} color={STATUS_COLORS.secondary} />
          )}
          {activity.elevationGainM != null && activity.elevationGainM > 0 && (
            <StatChip icon={<LandscapeIcon sx={{ fontSize: '2rem' }} />} value={`↑${Math.round(activity.elevationGainM)} m`} color={STATUS_COLORS.info} />
          )}
        </Stack>
      </Box>
    </Paper>
  );
});

export default ActivityFeedCard;

function StatChip({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 0.5,
      px: 1, py: 0.5,
      borderRadius: 1,
      bgcolor: alphaColor(COMMON_COLORS.white, 0.04),
      border: `1px solid ${alphaColor(COMMON_COLORS.white, 0.08)}`,
    }}>
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1 }}>{value}</Typography>
    </Box>
  );
}

function BenefitChip({ benefit }: { benefit: string }) {
  const color = BENEFIT_COLORS[benefit] ?? '#58A6FF';
  const label = BENEFIT_LABELS[benefit] ?? benefit;
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.65rem',
        height: 22,
        bgcolor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
        '& .MuiChip-label': { px: 0.75 },
      }}
    />
  );
}
