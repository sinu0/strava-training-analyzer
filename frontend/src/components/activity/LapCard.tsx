import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import type { ActivityLap } from '@/types/activity';
import { getChartVisuals } from '@/utils/chartStyles';
import { formatDuration, formatDistance } from '@/utils/formatters';

interface LapCardProps {
  lap: ActivityLap;
  index: number;
  sportType: string;
  powerStream?: number[] | null;
  heartrateStream?: number[] | null;
  timeStream?: number[] | null;
  altitudeStream?: number[] | null;
  velocityStream?: number[] | null;
  isBestPower: boolean;
  isBestNP: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onHover?: (idx: number | null) => void;
  onSelect?: () => void;
}

const INTENSITY_COLORS: Record<string, string> = {
  VO2: '#FF4444',
  THRESHOLD: '#FFAA00',
  ENDURANCE: '#4488FF',
  RECOVERY: '#44CC44',
};

const INTENSITY_LABELS: Record<string, string> = {
  VO2: 'VO2max',
  THRESHOLD: 'Próg',
  ENDURANCE: 'Wytrzymałość',
  RECOVERY: 'Regeneracja',
};

function sliceStream(stream: number[] | null | undefined, start: number | null, end: number | null): number[] {
  if (!stream || start == null || end == null || start < 0 || end > stream.length || end <= start) return [];
  return stream.slice(start, end);
}

interface LapChartPoint {
  t: number;
  power: number | null;
  hr: number | null;
  speed: number | null;
  alt: number | null;
}

export default function LapCard({
  lap,
  index,
  sportType: _sportType,
  powerStream,
  heartrateStream,
  timeStream,
  altitudeStream,
  velocityStream,
  isBestPower,
  isBestNP,
  isExpanded,
  onToggleExpand,
  onHover,
  onSelect,
}: LapCardProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const colors = {
    power: theme.tokens?.chart.primary ?? theme.palette.primary.main,
    heartRate: theme.palette.error.main,
    speed: theme.tokens?.chart.secondary ?? theme.palette.secondary.main,
    elevation: theme.palette.success.main,
  };
  const intensityColor = lap.intensityClass ? INTENSITY_COLORS[lap.intensityClass] ?? '#666' : '#666';
  const intensityLabel = lap.intensityClass ? INTENSITY_LABELS[lap.intensityClass] ?? '' : '';

  const mergedChartData = useMemo((): LapChartPoint[] => {
    if (!isExpanded) return [];
    const start = lap.startIndex;
    const end = lap.endIndex;

    const pwr = sliceStream(powerStream, start, end);
    const hr = sliceStream(heartrateStream, start, end);
    const spd = sliceStream(velocityStream, start, end);
    const alt = sliceStream(altitudeStream, start, end);
    const time = sliceStream(timeStream, start, end);

    const len = Math.max(pwr.length, hr.length, spd.length, alt.length, time.length);
    const hasTime = time.length > 0;
    const t0: number = hasTime ? (time[0] ?? 0) : 0;

    const points: LapChartPoint[] = [];
    for (let i = 0; i < len; i++) {
      const tRaw = (hasTime && i < time.length) ? (time[i] ?? 0) : 0;
      const pVal = (i < pwr.length) ? pwr[i] : undefined;
      const hVal = (i < hr.length) ? hr[i] : undefined;
      const sVal = (i < spd.length) ? spd[i] : undefined;
      const aVal = (i < alt.length) ? alt[i] : undefined;
      points.push({
        t: hasTime ? (tRaw - t0) / 60 : i,
        power: pVal ?? null,
        hr: hVal ?? null,
        speed: sVal != null ? sVal * 3.6 : null,
        alt: aVal ?? null,
      });
    }
    return points;
  }, [isExpanded, lap.startIndex, lap.endIndex, powerStream, heartrateStream, velocityStream, altitudeStream, timeStream]);

  const hasChartData = mergedChartData.length > 0;
  const hasPower = mergedChartData.some((p) => p.power != null);
  const hasHr = mergedChartData.some((p) => p.hr != null);
  const hasSpeed = mergedChartData.some((p) => p.speed != null);
  const hasAlt = mergedChartData.some((p) => p.alt != null);

  const isBest = isBestPower || isBestNP;

  return (
    <Box
      onClick={onSelect}
      onMouseEnter={() => onHover?.(index)}
      onMouseLeave={() => onHover?.(null)}
      sx={{
        bgcolor: isBest ? alpha(theme.palette.warning.main, 0.08) : 'background.paper',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: isBest ? alpha(theme.palette.warning.main, 0.42) : 'divider',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: theme.tokens?.transition ?? 'border-color 0.2s, background-color 0.2s',
        '&:hover': {
          borderColor: isBest ? alpha(theme.palette.warning.main, 0.7) : alpha(theme.palette.primary.main, 0.58),
          bgcolor: isBest ? alpha(theme.palette.warning.main, 0.1) : theme.tokens?.surfaceSubtle,
        },
      }}
    >
      {/* Intensity bar + Content row */}
      <Box sx={{ display: 'flex', minHeight: 72 }}>
        <Box
          sx={{
            width: 4,
            minWidth: 4,
            bgcolor: intensityColor,
            flexShrink: 0,
          }}
        />

        <Box sx={{ flex: 1, minWidth: 0, px: 2, py: 1.5 }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 700 }}>
                {lap.name || `Okr. ${index + 1}`}
              </Typography>
              {!!intensityLabel && (
                <Chip
                  label={intensityLabel}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    bgcolor: `${intensityColor}22`,
                    color: intensityColor,
                    border: `1px solid ${intensityColor}44`,
                  }}
                />
              )}
              {!!isBest && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  {!!isBestPower && (
                    <Chip
                      icon={<LocalFireDepartmentIcon sx={{ fontSize: 14 }} />}
                      label="Najmoc"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        bgcolor: (currentTheme) => alpha(currentTheme.palette.error.main, 0.12),
                        color: 'error.main',
                      }}
                    />
                  )}
                  {!!isBestNP && (
                    <Chip
                      icon={<EmojiEventsIcon sx={{ fontSize: 14 }} />}
                      label="NP"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        bgcolor: (currentTheme) => alpha(currentTheme.palette.warning.main, 0.14),
                        color: 'warning.main',
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} sx={{ color: 'text.secondary' }}>
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>

          {/* Primary metrics */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                {formatDuration(lap.movingTimeSec)}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase' }}>
                Czas
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                {lap.avgPowerW != null ? `${lap.avgPowerW} W` : '-'}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase' }}>
                Moc
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                {lap.avgHeartrate != null ? `${lap.avgHeartrate}` : '-'}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase' }}>
                HR
              </Typography>
            </Box>
          </Box>

          {/* Secondary metrics */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {formatDistance(lap.distanceM)}
            </Typography>
            {lap.avgCadence != null && (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {lap.avgCadence} rpm
              </Typography>
            )}
            {lap.totalElevationGain != null && lap.totalElevationGain > 0 && (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                +{Math.round(lap.totalElevationGain)} m
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Expanded section */}
      <Collapse in={isExpanded} timeout={200}>
        <Box sx={{ px: 2, pb: 2, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Advanced metrics */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2, mt: 1.5 }}>
            {lap.normalizedPowerW != null && (
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}>
                  {lap.normalizedPowerW} W
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>NP</Typography>
              </Box>
            )}
            {lap.variabilityIndex != null && (
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}>
                  {lap.variabilityIndex.toFixed(2)}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>VI</Typography>
              </Box>
            )}
            {lap.powerDropPct != null && (
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: lap.powerDropPct > 0 ? 'error.main' : lap.powerDropPct < 0 ? 'success.main' : 'text.primary',
                  }}
                >
                  {lap.powerDropPct > 0 ? '-' : '+'}{Math.abs(lap.powerDropPct).toFixed(1)}%
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>
                  Spadek mocy
                </Typography>
              </Box>
            )}
            {lap.avgSpeedMs != null && (
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}>
                  {(lap.avgSpeedMs * 3.6).toFixed(1)} km/h
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase' }}>Prędkość</Typography>
              </Box>
            )}
          </Box>

          {/* Strava-style combined lap chart */}
          {!!hasChartData && (
            <Box sx={{ mb: 0.5 }}>
              {/* Legend */}
              <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                {!!hasPower && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 3, borderRadius: 1, bgcolor: colors.power }} />
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Moc</Typography>
                  </Box>
                )}
                {!!hasHr && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 3, borderRadius: 1, bgcolor: colors.heartRate }} />
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Tętno</Typography>
                  </Box>
                )}
                {!!hasSpeed && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 3, borderRadius: 1, bgcolor: colors.speed }} />
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Prędkość</Typography>
                  </Box>
                )}
                {!!hasAlt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 3, borderRadius: 1, bgcolor: colors.elevation }} />
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>Przewyższenie</Typography>
                  </Box>
                )}
              </Box>

              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={mergedChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id={`altGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.elevation} stopOpacity={0.26} />
                      <stop offset="100%" stopColor={colors.elevation} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  {/* Power Y axis (left) */}
                  {!!hasPower && (
                    <YAxis
                      yAxisId="power"
                      orientation="left"
                      hide
                      domain={['dataMin - 20', 'dataMax + 20']}
                    />
                  )}
                  {/* HR Y axis (right) */}
                  {!!hasHr && (
                    <YAxis
                      yAxisId="hr"
                      orientation="right"
                      hide
                      domain={['dataMin - 10', 'dataMax + 10']}
                    />
                  )}
                  {/* Altitude Y axis (hidden, for scaling) */}
                  {!!hasAlt && (
                    <YAxis
                      yAxisId="alt"
                      orientation="right"
                      hide
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                  )}
                  <Tooltip
                    {...chart.tooltip}
                    formatter={(value, name) => {
                      const numericValue = Number(value ?? 0);
                      const seriesName = String(name ?? '');
                      switch (seriesName) {
                        case 'power': return [`${Math.round(numericValue)} W`, 'Moc'];
                        case 'hr': return [`${Math.round(numericValue)} bpm`, 'Tętno'];
                        case 'speed': return [`${numericValue.toFixed(1)} km/h`, 'Prędkość'];
                        case 'alt': return [`${Math.round(numericValue)} m`, 'Wysokość'];
                        default: return [numericValue, seriesName];
                      }
                    }}
                    labelFormatter={(value) => `${Number(value ?? 0).toFixed(1)} min`}
                  />

                  {/* Elevation area (background layer) */}
                  {!!hasAlt && (
                    <Area
                      yAxisId="alt"
                      dataKey="alt"
                      fill={`url(#altGrad-${index})`}
                      stroke="none"
                      isAnimationActive={false}
                    />
                  )}

                  {/* Speed line */}
                  {!!hasSpeed && (
                    <Line
                      yAxisId="power"
                      dataKey="speed"
                      stroke={colors.speed}
                      strokeWidth={1.2}
                      strokeOpacity={0.6}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {/* HR line */}
                  {!!hasHr && (
                    <Line
                      yAxisId="hr"
                      dataKey="hr"
                      stroke={colors.heartRate}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {/* Power line (on top) */}
                  {!!hasPower && (
                    <Line
                      yAxisId="power"
                      dataKey="power"
                      stroke={colors.power}
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {/* Average power reference line */}
                  {!!hasPower && lap.avgPowerW != null && (
                    <ReferenceLine
                      yAxisId="power"
                      y={lap.avgPowerW}
                      stroke={colors.power}
                      strokeDasharray="4 2"
                      strokeOpacity={0.3}
                      strokeWidth={1}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
